"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { CardData, RoomState } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getOrCreatePlayerId } from "@/lib/playerId";
import {
  buyFromMarket,
  drawFromDeck,
  joinRoom,
  refreshMarket,
  returnCard,
} from "@/lib/roomApi";
import Dice from "@/components/Dice";
import DeckPile from "@/components/DeckPile";
import GameCard from "@/components/GameCard";
import CardModal from "@/components/CardModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [isHandOpen, setIsHandOpen] = useState(false);
  const [portrait, setPortrait] = useState(false);
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
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

  useEffect(() => {
    if (!playerId) return;
    joinRoom(roomId, playerId);
  }, [playerId, roomId]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseBrowser
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (data) setRoom(data as RoomState);
    };
    load();

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
  }, [roomId]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
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
    if (!playerId) return;
    const response = await drawFromDeck(roomId, playerId);
    await handleResponseError(response);
  };

  const handleBuy = async () => {
    if (!playerId || selectedMarketIndex === null) return;
    const response = await buyFromMarket(roomId, playerId, selectedMarketIndex);
    const hasError = await handleResponseError(response);
    if (!hasError) {
      setSelectedMarketIndex(null);
      setSelectedCard(null);
    }
  };

  const handleReturn = async () => {
    if (!playerId || !confirmReturn) return;
    const response = await returnCard(roomId, playerId, confirmReturn.cardId);
    const hasError = await handleResponseError(response);
    if (!hasError) {
      setConfirmReturn(null);
    }
  };

  const handleRefresh = async () => {
    const response = await refreshMarket(roomId);
    const hasError = await handleResponseError(response);
    if (!hasError) {
      setConfirmRefresh(false);
    }
  };

  const handCards = player?.hand ?? [];

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
          <Dice />

          <div className="absolute bottom-6 flex w-full items-end justify-center">
            <div
              className="relative h-40 w-[70%]"
              onClick={() => setIsHandOpen((open) => !open)}
            >
              {handCards.map((card, index) => {
                const angle = index * 6 - handCards.length * 2.5;
                const offset = index * 12;
                return (
                  <div
                    key={card.id}
                    className="absolute bottom-0 left-1/2 w-28"
                    style={{
                      transform: `translateX(${offset}px) rotate(-90deg) rotate(${angle}deg)`,
                      transformOrigin: "bottom center",
                    }}
                  >
                    <GameCard card={card} isFaceUp={false} />
                  </div>
                );
              })}
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
                    Sua Mao
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
                      <div className="w-40" onClick={() => setSelectedCard(card)}>
                        <GameCard card={card} />
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

        <section className="relative flex h-full flex-col items-center justify-start gap-6 p-8">
          <DeckPile onClick={handleDraw} />

          <div className="grid w-full max-w-lg grid-cols-2 gap-4">
            {(room?.market_cards || new Array(4).fill(null)).map((card, index) => (
              <GameCard
                key={card?.id ?? `empty-${index}`}
                card={card}
                isFaceUp={Boolean(card)}
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
            className="rounded-full border border-white/20 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white"
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

      {portrait && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-center text-white">
          <p className="max-w-xs text-lg">
            Vire o dispositivo para landscape para continuar.
          </p>
        </div>
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
