"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CardData, CardHistoryEntry, PlayerState, RoomState } from "@/lib/types";
import type { CardRenderMode } from "@/components/GameCard";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  getOrCreatePlayerId,
  getStoredPlayerName,
  getStoredPlayerColor,
  setStoredPlayerName,
  setStoredPlayerColor,
  MAX_PLAYER_NAME_LENGTH,
  normalizePlayerName,
} from "@/lib/playerId";
import {
  buyFromMarket,
  drawFromDeck,
  kickPlayer,
  joinRoom,
  leaveRoom,
  rollDice,
  setPlayerColor,
  refreshMarket,
  returnCard,
} from "@/lib/roomApi";
import Dice from "@/components/Dice";
import DeckPile from "@/components/DeckPile";
import ScaledCard from "@/components/ScaledCard";
import CardModal from "@/components/CardModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import PlayerSeatsLayout from "@/components/PlayerSeatsLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import HistoryButton from "@/components/HistoryButton";
import HistoryModal from "@/components/HistoryModal";
import RefreshButton from "@/components/RefreshButton";
import { useGameScale } from "@/hooks/useGameScale";
import type { DiceRollState, CardHistoryAction } from "@/lib/types";
import {
  DEFAULT_PLAYER_COLOR,
  getPlayerColorInfo,
  PLAYER_COLORS,
} from "@/lib/playerColors";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [historyEntries, setHistoryEntries] = useState<CardHistoryEntry[]>([]);
  const [historyPulseToken, setHistoryPulseToken] = useState(0);
  const [marketRefreshPulseToken, setMarketRefreshPulseToken] = useState(0);
  const [marketRefreshPlayerId, setMarketRefreshPlayerId] = useState<string | null>(null);
  const [marketRefreshSnapshotColor, setMarketRefreshSnapshotColor] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [nameDraft, setNameDraft] = useState<string>("");
  const [colorDraft, setColorDraft] = useState<string>(DEFAULT_PLAYER_COLOR);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [isHandOpen, setIsHandOpen] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardRenderMode, setCardRenderMode] = useState<CardRenderMode>("classic");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | null>(
    null
  );
  const [confirmReturn, setConfirmReturn] = useState<{
    cardId: string;
    label: string;
    action: CardHistoryAction;
  } | null>(null);
  const [confirmKick, setConfirmKick] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckRevealCard, setDeckRevealCard] = useState<CardData | null>(null);
  const [deckRevealFaceUp, setDeckRevealFaceUp] = useState(false);
  const [allCardsOpen, setAllCardsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceRoll, setDiceRoll] = useState<DiceRollState | null>(null);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const diceRollTimerRef = useRef<number | null>(null);
  const pendingDiceRollRef = useRef<DiceRollState | null>(null);
  const colorRecheckTimerRef = useRef<number | null>(null);
  const deckRevealTimerRef = useRef<{
    flip: number | null;
    close: number | null;
  }>({ flip: null, close: null });

  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    const storedName = getStoredPlayerName();
    if (storedName) {
      setPlayerName(storedName);
      setNameDraft(storedName);
    } else {
      setNamePromptOpen(true);
    }
  }, []);

  useEffect(() => {
    const storedMode = window.localStorage.getItem("card-render-mode");
    if (storedMode === "safe" || storedMode === "classic") {
      setCardRenderMode(storedMode);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("card-render-mode", cardRenderMode);
  }, [cardRenderMode]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimer.current = null;
    }, 2200);
  }, []);

  const beginAction = useCallback(() => {
    setPendingCount((count) => count + 1);
  }, []);

  const endAction = useCallback(() => {
    setPendingCount((count) => Math.max(0, count - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(action: () => Promise<T>) => {
      beginAction();
      try {
        return await action();
      } finally {
        endAction();
      }
    },
    [beginAction, endAction]
  );

  const handleResponseError = useCallback(
    async (response: Response) => {
      if (response.ok) return false;
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      showToast(data?.error || "Algo deu errado.");
      return true;
    },
    [showToast]
  );

  const ensureReady = useCallback(() => {
    if (!roomId || roomId === "undefined") {
      showToast("Codigo de sala invalido.");
      return false;
    }
    if (!playerId) {
      showToast("Jogador nao identificado.");
      return false;
    }
    return true;
  }, [playerId, roomId, showToast]);

  const clearDeckRevealTimers = useCallback(() => {
    if (deckRevealTimerRef.current.flip) {
      window.clearTimeout(deckRevealTimerRef.current.flip);
      deckRevealTimerRef.current.flip = null;
    }
  }, []);

  const closeDeckReveal = useCallback(() => {
    clearDeckRevealTimers();
    setDeckModalOpen(false);
    setDeckRevealCard(null);
    setDeckRevealFaceUp(false);
  }, [clearDeckRevealTimers]);

  const fetchRoom = useCallback(async () => {
    if (!roomId || roomId === "undefined") return;
    const { data } = await supabaseBrowser
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    if (data) {
      const nextRoom = data as RoomState;
      setRoom(nextRoom);
      if (Array.isArray(nextRoom.card_history)) {
        setHistoryEntries((current) => {
          const merged = new Map<string, CardHistoryEntry>();
          [...current, ...nextRoom.card_history!].forEach((entry) => {
            merged.set(entry.id, entry);
          });
          return Array.from(merged.values()).sort((left, right) => left.createdAt - right.createdAt);
        });
      }
    }
  }, [roomId]);

  const triggerMarketRefreshFeedback = useCallback((color: string | null) => {
    setMarketRefreshPulseToken((current) => current + 1);
  }, []);

  const joinProfile = useCallback(
    async (nextName: string, nextColor: string) => {
      if (!playerId) return;
      if (!roomId || roomId === "undefined") {
        showToast("Codigo de sala invalido.");
        return;
      }

      await withLoading(async () => {
        const normalizedName = normalizePlayerName(nextName);
        const joinResponse = await joinRoom(roomId, playerId, normalizedName);
        const joinFailed = await handleResponseError(joinResponse);
        if (joinFailed) return;

        const colorResponse = await setPlayerColor(roomId, playerId, nextColor);
        const colorFailed = await handleResponseError(colorResponse);
        if (colorFailed) return;

        fetchRoom();

        if (colorRecheckTimerRef.current) {
          window.clearTimeout(colorRecheckTimerRef.current);
        }
        colorRecheckTimerRef.current = window.setTimeout(() => {
          void (async () => {
            const recheckResponse = await setPlayerColor(roomId, playerId, nextColor);
            const recheckFailed = await handleResponseError(recheckResponse);
            if (!recheckFailed) {
              fetchRoom();
            }
          })();
          colorRecheckTimerRef.current = null;
        }, 5000);
      });
    },
    [fetchRoom, handleResponseError, playerId, roomId, showToast, withLoading]
  );

  useEffect(() => {
    if (!playerId) return;

    const storedName = getStoredPlayerName();
    const storedColor = getStoredPlayerColor();

    if (storedName) {
      setPlayerName(storedName);
      setNameDraft(storedName);
      setColorDraft(storedColor || DEFAULT_PLAYER_COLOR);
      void joinProfile(storedName, storedColor || DEFAULT_PLAYER_COLOR);
      return;
    }

    setColorDraft(DEFAULT_PLAYER_COLOR);
    setNamePromptOpen(true);
  }, [joinProfile, playerId]);

  useEffect(() => {
    if (!roomId || roomId === "undefined") return;

    fetchRoom();

    const channel = supabaseBrowser
      .channel(`rooms:${roomId}`)
      .on(
        "broadcast",
        { event: "dice_roll" },
        ({ payload }) => {
          const roll = payload as DiceRollState | null;
          if (roll) {
            setDiceRoll(roll);
          }
        }
      )
      .on(
        "broadcast",
        { event: "card_history" },
        ({ payload }) => {
          const entry = payload as CardHistoryEntry | null;
          if (!entry) return;
          setHistoryEntries((current) => {
            if (current.some((item) => item.id === entry.id)) {
              return current;
            }
            return [...current, entry].sort((left, right) => left.createdAt - right.createdAt);
          });
          setHistoryPulseToken((current) => current + 1);
        }
      )
      .on(
        "broadcast",
        { event: "market_refresh" },
        ({ payload }) => {
          const data = payload as
            | {
                playerId?: string | null;
                playerColor?: string | null;
                playerColorValue?: string | null;
                playerName?: string | null;
                refreshedAt?: number;
              }
            | null;
          setMarketRefreshPlayerId(data?.playerId || null);
          setMarketRefreshSnapshotColor(data?.playerColorValue || data?.playerColor || null);
          const colorValue = data?.playerColorValue || (data?.playerColor ? getPlayerColorInfo(data.playerColor).value : null);
          triggerMarketRefreshFeedback(colorValue);
          void fetchRoom();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => {
          void fetchRoom();
        }
      )
      .subscribe();

    roomChannelRef.current = channel;

    const pollId = window.setInterval(() => {
      void fetchRoom();
    }, 2000);

    return () => {
      window.clearInterval(pollId);
      supabaseBrowser.removeChannel(channel);
      roomChannelRef.current = null;
    };
  }, [fetchRoom, roomId]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const request = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => null);
      }
    };
    request();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (allCardsOpen) {
        setAllCardsOpen(false);
        return;
      }

      if (colorRecheckTimerRef.current) {
        window.clearTimeout(colorRecheckTimerRef.current);
        colorRecheckTimerRef.current = null;
      }

      if (namePromptOpen) {
        setNamePromptOpen(false);
        return;
      }

      if (selectedCard) {
        setSelectedCard(null);
        setSelectedMarketIndex(null);
        return;
      }

      if (deckModalOpen) {
        closeDeckReveal();
        return;
      }

      if (confirmReturn) {
        setConfirmReturn(null);
        return;
      }

      if (historyOpen) {
        setHistoryOpen(false);
        return;
      }

      if (confirmKick) {
        setConfirmKick(null);
        return;
      }

      if (confirmRefresh) {
        setConfirmRefresh(false);
        return;
      }

      if (isHandOpen) {
        setIsHandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    allCardsOpen,
    confirmRefresh,
    confirmReturn,
    confirmKick,
    historyOpen,
    deckModalOpen,
    isHandOpen,
    namePromptOpen,
    selectedCard,
    closeDeckReveal,
  ]);

  useEffect(() => {
    return () => {
      if (colorRecheckTimerRef.current) {
        window.clearTimeout(colorRecheckTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!deckModalOpen || !deckRevealCard) {
      clearDeckRevealTimers();
      if (!deckModalOpen) {
        setDeckRevealFaceUp(false);
      }
      return;
    }

    clearDeckRevealTimers();
    setDeckRevealFaceUp(false);

    const flipDelay = cardRenderMode === "classic" ? 140 : 0;

    deckRevealTimerRef.current.flip = window.setTimeout(() => {
      setDeckRevealFaceUp(true);
      deckRevealTimerRef.current.flip = null;
    }, flipDelay);

    return clearDeckRevealTimers;
  }, [cardRenderMode, clearDeckRevealTimers, closeDeckReveal, deckModalOpen, deckRevealCard]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
      return;
    }
    document.exitFullscreen().catch(() => null);
  }, []);

  const player = useMemo(() => {
    if (!room || !playerId) return null;
    return room.players[playerId] || null;
  }, [room, playerId]);

  const diceGlowColor = useMemo(() => {
    if (!diceRoll?.playerId || !room) return null;
    const roller = room.players[diceRoll.playerId];
    if (!roller?.color) return null;
    return getPlayerColorInfo(roller.color).glow;
  }, [diceRoll?.playerId, room]);

  useEffect(() => {
    if (!room?.last_dice_roll) return;
    setDiceRoll((current) => {
      if (current?.rolledAt === room.last_dice_roll?.rolledAt) {
        return current;
      }
      return room.last_dice_roll;
    });
  }, [room?.last_dice_roll]);

  const handleRollDice = async () => {
    if (!ensureReady()) return;
    setIsDiceRolling(true);
    pendingDiceRollRef.current = null;
    if (diceRollTimerRef.current) {
      window.clearTimeout(diceRollTimerRef.current);
    }
    diceRollTimerRef.current = window.setTimeout(() => {
      setIsDiceRolling(false);
      diceRollTimerRef.current = null;
      const roll = pendingDiceRollRef.current;
      if (!roll) return;
      pendingDiceRollRef.current = null;
      void roomChannelRef.current?.send({
        type: "broadcast",
        event: "dice_roll",
        payload: roll,
      });
    }, 2000);

    await withLoading(async () => {
      const response = await rollDice(roomId, playerId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        const data = (await response.json().catch(() => null)) as
          | { roll?: DiceRollState }
          | null;
        if (data?.roll) {
          const roll = data.roll;
          setDiceRoll(roll);
          pendingDiceRollRef.current = roll;
          if (diceRollTimerRef.current === null) {
            pendingDiceRollRef.current = null;
            void roomChannelRef.current?.send({
              type: "broadcast",
              event: "dice_roll",
              payload: roll,
            });
          }
          setRoom((current) =>
            current ? { ...current, last_dice_roll: roll } : current
          );
        }
        fetchRoom();
      }
    });
  };

  const handleDraw = async () => {
    if (!ensureReady()) return;
    await withLoading(async () => {
      const response = await drawFromDeck(roomId, playerId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        const data = (await response.json().catch(() => null)) as
          | { card?: CardData }
          | null;
        if (data?.card) {
          setDeckRevealCard(data.card);
          setDeckRevealFaceUp(false);
          setDeckModalOpen(true);
        } else {
          closeDeckReveal();
        }
        showToast("Carta comprada do monte.");
        fetchRoom();
      }
    });
  };

  const handleBuy = async () => {
    if (!ensureReady() || selectedMarketIndex === null) return;
    await withLoading(async () => {
      const response = await buyFromMarket(roomId, playerId, selectedMarketIndex);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        setSelectedMarketIndex(null);
        setSelectedCard(null);
        showToast("Carta comprada do mercado.");
        fetchRoom();
      }
    });
  };

  const commitProfile = useCallback(() => {
    const nextName = normalizePlayerName(nameDraft);
    const nextColor = colorDraft || DEFAULT_PLAYER_COLOR;
    if (!nextName) {
      showToast("Informe um nome.");
      return;
    }

    setStoredPlayerName(nextName);
    setStoredPlayerColor(nextColor);
    setPlayerName(nextName);
    setNameDraft(nextName);
    setColorDraft(nextColor);
    setNamePromptOpen(false);
    void joinProfile(nextName, nextColor);
  }, [colorDraft, joinProfile, nameDraft, showToast]);


  const handleReturn = async () => {
    if (!playerId || !confirmReturn) return;
    await withLoading(async () => {
      const player = room?.players[playerId];
      const wasLastCard = (player?.hand.length ?? 0) === 1;
      const card = player?.hand.find((entry) => entry.id === confirmReturn.cardId);
      if (!card) {
        showToast("Nenhuma carta selecionada.");
        setConfirmReturn(null);
        return;
      }
      const response = await returnCard(roomId, playerId, confirmReturn.cardId, confirmReturn.action);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        const data = (await response.json().catch(() => null)) as
          | { historyEntry?: CardHistoryEntry }
          | null;
        setConfirmReturn(null);
        const nextEntry = data?.historyEntry ?? (card && player ? {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          action: confirmReturn.action,
          card,
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color || DEFAULT_PLAYER_COLOR,
          createdAt: Date.now(),
        } : null);

        if (nextEntry) {
          setHistoryEntries((current) => {
            if (current.some((entry) => entry.id === nextEntry.id)) {
              return current;
            }
            return [...current, nextEntry].sort((left, right) => left.createdAt - right.createdAt);
          });
          setHistoryPulseToken((current) => current + 1);
          void roomChannelRef.current?.send({
            type: "broadcast",
            event: "card_history",
            payload: nextEntry,
          });
        }
        if (wasLastCard) {
          setIsHandOpen(false);
          setSelectedHandCardId(null);
        }
        fetchRoom();
      }
    });
  };

  const handleRefresh = async () => {
    if (!player || !room?.players[playerId]) {
      showToast("Voce foi removido da sala.");
      router.push("/");
      return;
    }
    await withLoading(async () => {
      const response = await refreshMarket(roomId, playerId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        const refreshColor = player.color ? getPlayerColorInfo(player.color).value : null;
        setMarketRefreshPlayerId(player.id);
        setMarketRefreshSnapshotColor(refreshColor);
        triggerMarketRefreshFeedback(refreshColor);
        void roomChannelRef.current?.send({
          type: "broadcast",
          event: "market_refresh",
          payload: {
            playerId: player.id,
            playerName: player.name,
            playerColor: player.color || null,
            playerColorValue: refreshColor,
            refreshedAt: Date.now(),
          },
        });
        setConfirmRefresh(false);
        fetchRoom();
      }
    });
  };

  const handleKick = async () => {
    if (!playerId || !confirmKick) return;
    await withLoading(async () => {
      const response = await kickPlayer(roomId, playerId, confirmKick.playerId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        setConfirmKick(null);
        fetchRoom();
      }
    });
  };

  const handleLeaveRoom = async () => {
    if (!playerId) {
      router.push("/");
      return;
    }
    await withLoading(async () => {
      const response = await leaveRoom(roomId, playerId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        router.push("/");
      }
    });
  };

  const handCards = player?.hand ?? [];

  const gs = useGameScale(viewport);
  const isCompact = Boolean(viewport.width && (viewport.width < 640 || viewport.height < 520));
  const compactActiveCard = useMemo(() => {
    if (!selectedHandCardId) return null;
    return handCards.find((card) => card.id === selectedHandCardId) ?? null;
  }, [handCards, selectedHandCardId]);
  const visibleHistoryEntries = historyEntries.length ? historyEntries : (room?.card_history ?? []);
  const latestHistoryEntry = visibleHistoryEntries[visibleHistoryEntries.length - 1] ?? null;
  const latestHistoryGlow = latestHistoryEntry
    ? getPlayerColorInfo(room?.players[latestHistoryEntry.playerId]?.color ?? latestHistoryEntry.playerColor).value
    : null;
  const latestHistoryPlayer = latestHistoryEntry ? room?.players[latestHistoryEntry.playerId] ?? null : null;
  const latestHistoryName = latestHistoryPlayer?.name ?? latestHistoryEntry?.playerName ?? null;
  const latestHistoryActionLabel = latestHistoryEntry?.action === "used" ? "usou" : latestHistoryEntry?.action === "discarded" ? "descartou" : null;
  const marketRefreshResolvedPlayer = marketRefreshPlayerId ? room?.players[marketRefreshPlayerId] ?? null : null;
  const resolveStoredColor = (value: string | null) => {
    if (!value) return null;
    if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")) {
      return value;
    }
    return getPlayerColorInfo(value).value;
  };
  const marketRefreshGlow = marketRefreshResolvedPlayer?.color
    ? getPlayerColorInfo(marketRefreshResolvedPlayer.color).value
    : resolveStoredColor(marketRefreshSnapshotColor);

  const orderedPlayers = useMemo(() => {
    if (!room) return [] as PlayerState[];
    const entries = Object.values(room.players);
    entries.sort((left, right) => {
      const leftTime = Number.isFinite(left.joinedAt) ? left.joinedAt : 0;
      const rightTime = Number.isFinite(right.joinedAt) ? right.joinedAt : 0;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return left.id.localeCompare(right.id);
    });
    const selfIndex = entries.findIndex((entry) => entry.id === playerId);
    if (selfIndex > -1) {
      const [self] = entries.splice(selfIndex, 1);
      return [self, ...entries];
    }
    return entries;
  }, [room, playerId]);

  const takenColorIds = useMemo(() => {
    const ids = new Set<string>();
    orderedPlayers.forEach((entry) => {
      if (entry.id === playerId) return;
      if (entry.color) ids.add(entry.color);
    });
    return ids;
  }, [orderedPlayers, playerId]);

  const firstAvailableColorId = useMemo(() => {
    return (
      PLAYER_COLORS.find((entry) => !takenColorIds.has(entry.id))?.id ||
      DEFAULT_PLAYER_COLOR
    );
  }, [takenColorIds]);

  useEffect(() => {
    if (!namePromptOpen) return;
    if (!takenColorIds.has(colorDraft)) return;
    setColorDraft(firstAvailableColorId);
  }, [colorDraft, firstAvailableColorId, namePromptOpen, takenColorIds]);

  const availableByClass = useMemo(() => {
    if (!room) return { Resiliente: [], Sinergista: [], Impetuoso: [] };
    const available = [
      ...room.deck_queue,
      ...room.market_cards.filter((card): card is CardData => Boolean(card)),
    ];
    const map = new Map<
      string,
      { card: CardData; count: number }
    >();

    available.forEach((card) => {
      const key = `${card.classe}|${card.titulo}|${card.descricao}|${card.custo}|${
        card.condicao || ""
      }`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { card, count: 1 });
      }
    });

    const grouped = {
      Resiliente: [] as Array<{ card: CardData; count: number }>,
      Sinergista: [] as Array<{ card: CardData; count: number }>,
      Impetuoso: [] as Array<{ card: CardData; count: number }>,
    };

    Array.from(map.values()).forEach((entry) => {
      grouped[entry.card.classe].push(entry);
    });

    return grouped;
  }, [room]);

  return (
    <div className="relative flex h-full flex-1 overflow-hidden">
      <div
        className={`absolute left-4 top-4 z-40 transition-opacity duration-200 ${
          isHandOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <motion.button
          onClick={() => setMenuOpen((open) => !open)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1 rounded-full border border-white/20 bg-black/40"
        >
          <span className="h-0.5 w-4 bg-white" />
          <span className="h-0.5 w-4 bg-white" />
          <span className="h-0.5 w-4 bg-white" />
        </motion.button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 w-48 rounded-2xl border border-white/10 bg-black/80 p-3 text-sm text-white"
            >
              <p className="mb-1 text-center font-mono text-sm uppercase tracking-[0.18em] text-white/50">
                {roomId}
              </p>
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.22em] text-white/45">
                {latestHistoryEntry && latestHistoryName && latestHistoryActionLabel
                  ? `${latestHistoryName} ${latestHistoryActionLabel} uma carta`
                  : "Nenhuma carta no histórico ainda"}
              </p>
              <div className="mb-2 h-px bg-white/10" />
              <button
                onClick={() => {
                  void handleLeaveRoom();
                }}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Sair da Sala
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setAllCardsOpen(true);
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Ver todas as cartas
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setHistoryOpen(true);
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Ver histórico
              </button>
              <button
                onClick={toggleFullscreen}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Alternar Fullscreen
              </button>
              <button
                onClick={() => setCardRenderMode((mode) => (mode === "safe" ? "classic" : "safe"))}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Modo de cartas: {cardRenderMode === "safe" ? "Seguro" : "Clássico"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid h-full w-full grid-cols-2">
        <section className="relative flex h-full flex-col items-center justify-center border-r border-white/10">
          <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative z-10">
                <Dice
                  size={Math.round(gs.diceSize * 1.25 * 0.95)}
                  value={diceRoll?.value ?? null}
                  isRolling={isDiceRolling}
                  shakeToken={diceRoll?.rolledAt ?? null}
                  glowColor={diceGlowColor}
                  onRoll={handleRollDice}
                />
            </div>

            <div className="absolute inset-0">
              <PlayerSeatsLayout
                orderedPlayers={orderedPlayers}
                playerId={playerId}
                playerName={playerName}
                masterId={room?.master_id || null}
                handCardsLength={handCards.length}
                viewport={viewport}
                gameScale={gs}
                renderMode={cardRenderMode}
                onEditProfile={() => {
                  const currentColor = player?.color || getStoredPlayerColor() || DEFAULT_PLAYER_COLOR;
                  setNameDraft(playerName || getStoredPlayerName());
                  setColorDraft(currentColor);
                  setNamePromptOpen(true);
                }}
                onKickPlayer={room?.master_id === playerId ? (targetPlayerId) => {
                  if (targetPlayerId === playerId) return;
                  const targetPlayer = room.players[targetPlayerId];
                  if (!targetPlayer) return;
                  setConfirmKick({ playerId: targetPlayerId, playerName: targetPlayer.name });
                } : undefined}
                onOpenHand={() => {
                  if (handCards.length === 0) return;
                  setIsHandOpen((open) => !open);
                }}
              />
            </div>
          </div>

          <AnimatePresence>
            {isHandOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className={`fixed inset-0 z-50 flex flex-col bg-black/90 p-4 ${isCompact ? "pt-6 pb-20" : "p-6"}`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl uppercase tracking-wide text-white">
                      Sua Mão
                    </h2>
                    <motion.button
                      onClick={() => setIsHandOpen(false)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wide"
                    >
                      Fechar
                    </motion.button>
                  </div>

                  <div className="scrollbar-accent mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                    {handCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedHandCardId(card.id)}
                        className={`flex w-full flex-col items-stretch gap-3 rounded-2xl border p-3 transition sm:flex-row sm:items-center ${
                          selectedHandCardId === card.id
                            ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(255,140,60,0.22)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center">
                          <ScaledCard
                            card={card}
                            scale={isCompact ? Math.min(0.78, gs.scale) : Math.max(0.75, gs.scale)}
                            renderMode={cardRenderMode}
                            onClick={() => {
                              setSelectedHandCardId(card.id);
                              setSelectedCard(card);
                            }}
                            className="mx-auto"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 px-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-lg uppercase tracking-wide text-white">
                              {card.titulo}
                            </p>
                            {selectedHandCardId === card.id && (
                              <span className="rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                                Selecionada
                              </span>
                            )}
                          </div>
                          <p className={`text-sm text-white/70 ${isCompact ? "max-h-[36vh] overflow-y-auto" : "line-clamp-6"}`}>{card.descricao}</p>
                        </div>
                        <div className={`${isCompact ? "hidden" : "mt-2 flex w-full gap-2 sm:mt-0 sm:w-auto sm:flex-col"}`}>
                          <motion.button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedHandCardId(card.id);
                              setConfirmReturn({ cardId: card.id, label: "Usar", action: "used" });
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full rounded-full bg-emerald-400/20 border border-emerald-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                          >
                            Usar
                          </motion.button>
                          <motion.button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedHandCardId(card.id);
                              setConfirmReturn({ cardId: card.id, label: "Descartar", action: "discarded" });
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full rounded-full bg-amber-400/20 border border-amber-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                          >
                            Descartar
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isCompact && compactActiveCard && (
                    <div className="fixed bottom-4 left-4 right-4 z-60 mx-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-black/80 p-3 backdrop-blur">
                      <div className="flex gap-3">
                        <motion.button
                          onClick={() => setConfirmReturn({ cardId: compactActiveCard.id, label: "Usar", action: "used" })}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white"
                        >
                          Usar
                        </motion.button>
                        <motion.button
                          onClick={() => setConfirmReturn({ cardId: compactActiveCard.id, label: "Descartar", action: "discarded" })}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white"
                        >
                          Descartar
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </section>

        <section
          className="relative flex h-full flex-col items-center justify-center gap-4 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && isHandOpen) {
              setIsHandOpen(false);
            }
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <DeckPile
              w={gs.deckW}
              h={gs.deckH}
              renderMode={cardRenderMode}
              onClick={() => {
                clearDeckRevealTimers();
                setDeckRevealCard(null);
                setDeckRevealFaceUp(false);
                setDeckModalOpen(true);
              }}
            />
          </div>

          <div
            className="grid w-full place-items-center gap-3"
            style={{
              gridTemplateColumns: `repeat(2, ${Math.round(240 * gs.scale)}px)`,
              maxWidth: Math.round(240 * gs.scale) * 2 + 16,
            }}
          >
            {(room?.market_cards || new Array(4).fill(null)).map((card, index) => (
              <ScaledCard
                key={card?.id ?? `empty-${index}`}
                card={card}
                isFaceUp={Boolean(card)}
                scale={gs.scale}
                renderMode={cardRenderMode}
                onClick={() => {
                  if (!card) return;
                  setSelectedMarketIndex(index);
                  setSelectedCard(card);
                }}
              />
            ))}
          </div>

          <RefreshButton
            onClick={() => setConfirmRefresh(true)}
            className="mt-1"
            glowColor={marketRefreshGlow}
            pulseToken={marketRefreshPulseToken}
          />
          <HistoryButton
            onClick={() => setHistoryOpen(true)}
            className="mt-2"
            action={latestHistoryEntry?.action ?? null}
            glowColor={latestHistoryGlow}
            pulseToken={historyPulseToken || latestHistoryEntry?.id || visibleHistoryEntries.length}
          />
        </section>
      </div>

      <CardModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        actionLabel={selectedMarketIndex !== null ? "Comprar" : undefined}
        renderMode={cardRenderMode}
        onClose={() => {
          setSelectedCard(null);
          setSelectedMarketIndex(null);
        }}
        onConfirm={selectedMarketIndex !== null ? handleBuy : undefined}
      />

      <CardModal
        card={deckRevealCard}
        isOpen={deckModalOpen}
        actionLabel={deckRevealCard ? undefined : "Comprar do Monte"}
        showBackOnly={!deckRevealFaceUp}
        disableFlip={cardRenderMode === "safe"}
        renderMode={cardRenderMode}
        onClose={closeDeckReveal}
        onConfirm={
          deckRevealCard
            ? undefined
            : async () => {
                await handleDraw();
              }
        }
      />

      <ConfirmDialog
        isOpen={Boolean(confirmReturn)}
        title={confirmReturn ? `${confirmReturn.label} carta` : ""}
        description="A carta volta para o fim do baralho."
        confirmLabel={confirmReturn?.label || "Confirmar"}
        onCancel={() => setConfirmReturn(null)}
        onConfirm={handleReturn}
      />

      <HistoryModal
        entries={visibleHistoryEntries}
        players={room?.players || {}}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmRefresh}
        title="Repor mercado"
        description="As cartas atuais voltam para o fim do baralho."
        confirmLabel="Repor"
        onCancel={() => setConfirmRefresh(false)}
        onConfirm={handleRefresh}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmKick)}
        title={confirmKick ? `Expulsar ${confirmKick.playerName}` : "Expulsar jogador"}
        description="Esse jogador será removido da sala."
        confirmLabel="Expulsar"
        onCancel={() => setConfirmKick(null)}
        onConfirm={handleKick}
      />

      <AnimatePresence>
        {allCardsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
            onClick={() => setAllCardsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex h-[min(80vh,720px)] w-[min(90vw,900px)] flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase tracking-wide">
                  Todas as cartas
                </h2>
                <button
                  onClick={() => setAllCardsOpen(false)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wide"
                >
                  Fechar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {(["Resiliente", "Sinergista", "Impetuoso"] as const).map(
                  (classe) => (
                    <div key={classe} className="mb-8">
                      <h3 className="font-display text-2xl uppercase tracking-wide text-white/80">
                        {classe}
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {availableByClass[classe].map(({ card, count }) => (
                          <div
                            key={`${classe}-${card.titulo}-${card.custo}-${count}`}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3"
                            onClick={() => {
                              setSelectedMarketIndex(null);
                              setSelectedCard(card);
                            }}
                          >
                            <ScaledCard card={card} scale={0.67} renderMode={cardRenderMode} />
                            <div className="flex flex-col gap-2">
                              <p className="text-xs uppercase tracking-widest text-white/70">
                                {count} cópias
                              </p>
                              <p className="font-display text-xl uppercase tracking-wide">
                                {card.titulo}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {namePromptOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
            onClick={() => setNamePromptOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-[min(92vw,560px)] rounded-3xl border border-white/10 bg-black/85 p-6 text-white"
            >
              <h2 className="font-display text-3xl uppercase tracking-wide">
                {playerName ? "Editar perfil" : "Seu nome"}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Escolha um nome e uma cor fixa para esta sala.
              </p>
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitProfile();
                }}
                placeholder="Digite seu nome"
                maxLength={MAX_PLAYER_NAME_LENGTH}
                autoFocus
                className="mt-4 w-full rounded-full border border-white/20 bg-black/30 px-4 py-3 text-sm uppercase tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <div className="mt-5">
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/55">
                  Cor do jogador
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PLAYER_COLORS.map((entry) => {
                    const isActive = colorDraft === entry.id;
                    const isTakenByOther = takenColorIds.has(entry.id) && !isActive;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        disabled={isTakenByOther}
                        onClick={() => setColorDraft(entry.id)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-xs uppercase tracking-[0.14em] transition ${
                          isActive ? "border-white/35 bg-white/10" : "border-white/10 bg-white/5"
                        } ${isTakenByOther ? "cursor-not-allowed opacity-35" : "hover:bg-white/10"}`}
                        style={{
                          boxShadow: isActive ? `0 0 0 1px ${entry.glow}, 0 0 18px ${entry.glow}` : undefined,
                        }}
                      >
                        <span
                          className="h-5 w-5 rounded-md border border-black/20"
                          style={{ backgroundColor: entry.value }}
                        />
                        <span className="truncate">{entry.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <motion.button
                onClick={commitProfile}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="mt-5 w-full cursor-pointer rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black"
              >
                {playerName ? "Salvar alterações" : "Entrar na sala"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {portrait && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-center text-white">
          <p className="max-w-xs text-lg">
            Vire o dispositivo para landscape para continuar.
          </p>
        </div>
      )}

      <Toast message={toastMessage} />
      <LoadingSpinner isVisible={pendingCount > 0} />
    </div>
  );
}
