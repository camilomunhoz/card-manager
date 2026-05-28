"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { CardData, PlayerState, RoomState } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  getOrCreatePlayerId,
  getStoredPlayerName,
  setStoredPlayerName,
} from "@/lib/playerId";
import {
  buyFromMarket,
  drawFromDeck,
  joinRoom,
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
import { useGameScale } from "@/hooks/useGameScale";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [nameDraft, setNameDraft] = useState<string>("");
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [isHandOpen, setIsHandOpen] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | null>(
    null
  );
  const [confirmReturn, setConfirmReturn] = useState<{
    cardId: string;
    label: string;
  } | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckRevealCard, setDeckRevealCard] = useState<CardData | null>(null);
  const [allCardsOpen, setAllCardsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

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

  const commitPlayerName = useCallback(() => {
    const next = nameDraft.trim();
    if (!next) {
      showToast("Informe um nome.");
      return;
    }
    setStoredPlayerName(next);
    setPlayerName(next);
    setNamePromptOpen(false);
  }, [nameDraft, showToast]);

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

  const fetchRoom = useCallback(async () => {
    if (!roomId || roomId === "undefined") return;
    const { data } = await supabaseBrowser
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    if (data) setRoom(data as RoomState);
  }, [roomId]);

  useEffect(() => {
    if (!playerId || !playerName) return;
    if (!roomId || roomId === "undefined") {
      showToast("Codigo de sala invalido.");
      return;
    }
    withLoading(async () => {
      const response = await joinRoom(roomId, playerId, playerName);
      await handleResponseError(response);
    });
  }, [playerId, playerName, roomId, showToast]);

  useEffect(() => {
    if (!roomId || roomId === "undefined") return;

    fetchRoom();

    const channel = supabaseBrowser
      .channel(`rooms:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) setRoom(payload.new as RoomState);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
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


  const handleReturn = async () => {
    if (!playerId || !confirmReturn) return;
    await withLoading(async () => {
      const response = await returnCard(roomId, playerId, confirmReturn.cardId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        setConfirmReturn(null);
        fetchRoom();
      }
    });
  };

  const handleRefresh = async () => {
    await withLoading(async () => {
      const response = await refreshMarket(roomId);
      const hasError = await handleResponseError(response);
      if (!hasError) {
        setConfirmRefresh(false);
        fetchRoom();
      }
    });
  };

  const handCards = player?.hand ?? [];

  const gs = useGameScale(viewport);

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
      <div className="absolute left-4 top-4 z-40">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40"
        >
          <span className="h-0.5 w-4 bg-white" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 w-48 rounded-2xl border border-white/10 bg-black/80 p-3 text-sm text-white"
            >
              <button
                onClick={() => router.push("/")}
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
                onClick={toggleFullscreen}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
              >
                Alternar Fullscreen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid h-full w-full grid-cols-2">
        <section className="relative flex h-full flex-col items-center justify-center border-r border-white/10">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="relative z-10">
              <Dice size={gs.diceSize} />
            </div>

            <div className="absolute inset-0">
              <PlayerSeatsLayout
                orderedPlayers={orderedPlayers}
                playerId={playerId}
                playerName={playerName}
                handCardsLength={handCards.length}
                viewport={viewport}
                gameScale={gs}
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
                className="absolute inset-0 z-30 flex flex-col bg-black/70 p-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl uppercase tracking-wide text-white">
                    Sua Mão
                  </h2>
                  <button
                    onClick={() => setIsHandOpen(false)}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wide"
                  >
                    Fechar
                  </button>
                </div>
                <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                  {handCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex-shrink-0" onClick={() => setSelectedCard(card)}>
                        <ScaledCard card={card} scale={gs.scale} />
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <p className="font-display text-2xl uppercase tracking-wide text-white">
                          {card.titulo}
                        </p>
                        <p className="text-sm text-white/70">{card.descricao}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            setConfirmReturn({ cardId: card.id, label: "Usar" })
                          }
                          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black"
                        >
                          Usar
                        </button>
                        <button
                          onClick={() =>
                            setConfirmReturn({ cardId: card.id, label: "Descartar" })
                          }
                          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="relative flex h-full flex-col items-center justify-center gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            <DeckPile
              w={gs.deckW}
              h={gs.deckH}
              onClick={() => {
                setDeckRevealCard(null);
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
                onClick={() => {
                  if (!card) return;
                  setSelectedMarketIndex(index);
                  setSelectedCard(card);
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setConfirmRefresh(true)}
            className="rounded-full border border-white/20 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          >
            Repor Mercado
          </button>
        </section>
      </div>

      <CardModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        actionLabel={selectedMarketIndex !== null ? "Comprar" : undefined}
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
        showBackOnly={!deckRevealCard}
        disableFlip={!deckRevealCard}
        onClose={() => {
          setDeckModalOpen(false);
          setDeckRevealCard(null);
        }}
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

      <ConfirmDialog
        isOpen={confirmRefresh}
        title="Repor mercado"
        description="As cartas atuais voltam para o fim do baralho."
        confirmLabel="Repor"
        onCancel={() => setConfirmRefresh(false)}
        onConfirm={handleRefresh}
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
                            <ScaledCard card={card} scale={0.67} />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-[min(90vw,420px)] rounded-3xl border border-white/10 bg-black/80 p-6 text-white"
            >
              <h2 className="font-display text-3xl uppercase tracking-wide">
                Seu nome
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Esse nome aparece acima da sua mão.
              </p>
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitPlayerName();
                }}
                placeholder="Digite seu nome"
                maxLength={24}
                autoFocus
                className="mt-4 w-full rounded-full border border-white/20 bg-black/30 px-4 py-3 text-sm uppercase tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <button
                onClick={commitPlayerName}
                className="mt-4 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black"
              >
                Entrar na sala
              </button>
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
