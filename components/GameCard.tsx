"use client";

import { motion } from "framer-motion";
import type { CardClass, CardData } from "@/lib/types";

export type CardRenderMode = "safe" | "classic";

interface GameCardProps {
  card: CardData | null;
  isFaceUp?: boolean;
  disableFlip?: boolean;
  onClick?: () => void;
  layoutId?: string;
  className?: string;
  renderMode?: CardRenderMode;
}

const CARD_W = 240;
const CARD_H = 144;

const CLASS_PATTERN: Record<CardClass, string> = {
  Resiliente: "/patterns/pattern-resiliente.png",
  Sinergista: "/patterns/pattern-sinergista.png",
  Impetuoso: "/patterns/pattern-impetuoso.png",
};

const CLASS_DECORATION: Record<
  CardClass,
  {
    glow: string;
    accent: string;
    ink: string;
  }
> = {
  Resiliente: {
    glow: "rgba(86, 129, 255, 0.24)",
    accent: "#8fb0ff",
    ink: "rgba(14, 24, 52, 0.16)",
  },
  Sinergista: {
    glow: "rgba(255, 180, 92, 0.24)",
    accent: "#ffd18f",
    ink: "rgba(66, 37, 6, 0.16)",
  },
  Impetuoso: {
    glow: "rgba(255, 111, 111, 0.24)",
    accent: "#ff9b9b",
    ink: "rgba(72, 14, 14, 0.16)",
  },
};

export default function GameCard({
  card,
  isFaceUp = true,
  disableFlip = false,
  onClick,
  layoutId,
  className = "",
  renderMode = "safe",
}: GameCardProps) {
  const decoration = card ? CLASS_DECORATION[card.classe] : null;

  const renderGenericBack = (toneClassName: string) => (
    <div className={`flex h-full flex-col justify-between rounded-md border border-white/10 ${toneClassName} p-2`}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/70">
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px]">Carta</span>
        <span>Verso</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-display text-2xl uppercase tracking-[0.35em] text-white/80">
          Carta
        </div>
      </div>
      <div className="text-center text-[9px] uppercase tracking-[0.3em] text-white/50">
        Freud Explica
      </div>
    </div>
  );

  const backTone =
    "bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14)_0%,transparent_38%),repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_12px),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.28))]";

  if (renderMode === "classic") {
    const rotation = isFaceUp ? 180 : 0;

    return (
      <motion.div
        layoutId={layoutId}
        onClick={onClick}
        animate={disableFlip ? undefined : { rotateY: rotation }}
        transition={disableFlip ? undefined : { duration: 0.6, ease: "easeInOut" }}
        style={{
          width: CARD_W,
          height: CARD_H,
          perspective: "1200px",
          ...(disableFlip ? { transform: `rotateY(${rotation}deg)` } : {}),
        }}
        className={`relative cursor-pointer card-3d contain-strict ${className}`}
      >
        <div className="card-face absolute inset-0 rounded-lg border border-white/20 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black shadow-[0_15px_35px_rgba(0,0,0,0.4)]" />
        <div className="card-face back absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-br from-amber-200 via-amber-100 to-orange-50 p-2 text-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
          {card && CLASS_PATTERN[card.classe] && (
            <div
              className="pointer-events-none absolute inset-0 rounded-lg"
              style={{
                backgroundImage: `url(${CLASS_PATTERN[card.classe]})`,
                backgroundSize: "cover",
                backgroundRepeat: "repeat",
                opacity: 0.1,
              }}
            />
          )}
          {card ? (
            <div className="flex h-full flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <span className="rounded-full bg-[color:#6b6420] px-1 text-white">
                  {card.classe}
                </span>
                <span style={{ fontVariantNumeric: "slashed-zero tabular-nums" }}>
                  Custo {card.custo}
                </span>
              </div>
              <div className="font-display text-[18px] uppercase tracking-wide text-zinc-900">
                {card.titulo}
              </div>
              <div className="text-[10px] leading-[10px] text-zinc-700">
                {card.descricao}
              </div>
              <div className="mt-auto text-[6px] uppercase tracking-widest text-zinc-500">
                {card.condicao || "Sem condição de ativação"}
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex h-full flex-col justify-between p-2 text-zinc-900">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <span className="rounded-full bg-[color:#6b6420] px-1 text-white">Carta</span>
                <span className="text-[10px]">Monte</span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="rounded-full border border-white/5 bg-white/20 px-4 py-2 font-display text-2xl uppercase tracking-[0.35em] text-zinc-900">
                  Carta
                </div>
              </div>
              <div className="text-center text-[9px] uppercase tracking-[0.3em] text-zinc-500">Freud Explica</div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      animate={disableFlip ? undefined : { scale: isFaceUp ? 1 : 0.99 }}
      transition={disableFlip ? undefined : { duration: 0.2, ease: "easeOut" }}
      style={{
        width: CARD_W,
        height: CARD_H,
      }}
      className={`relative cursor-pointer overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-[0_15px_35px_rgba(0,0,0,0.4)] contain-strict ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            decoration && isFaceUp
              ? `radial-gradient(circle at 18% 18%, ${decoration.glow} 0%, transparent 36%), radial-gradient(circle at 82% 18%, ${decoration.glow} 0%, transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.25))`
              : `radial-gradient(circle at 50% 18%, rgba(255,255,255,0.14) 0%, transparent 38%), repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 12px), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.28))`,
          boxShadow: decoration ? `inset 0 0 0 1px ${decoration.ink}` : undefined,
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-lg border border-white/10" />
      <div className="relative z-10 h-full p-2 text-white">
        {card && isFaceUp ? (
          <div className="flex h-full flex-col gap-1.5 rounded-md border border-white/10 bg-black/20 p-2 backdrop-blur-[1px]">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/75">
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ backgroundColor: decoration?.accent ?? "rgba(255,255,255,0.2)", color: "#111" }}
              >
                {card.classe}
              </span>
              <span style={{ fontVariantNumeric: "slashed-zero tabular-nums" }}>
                Custo {card.custo}
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-0">
              <div className="min-w-0 font-display text-[19px] uppercase leading-[0.88] tracking-wide text-white">
                {card.titulo}
              </div>
              <div className="text-left text-[6px] uppercase leading-none tracking-widest text-white/55">
                {card.condicao || "Sem condição de ativação"}
              </div>
            </div>
            <div className="text-[10px] leading-[10px] text-white/80">
              {card.descricao}
            </div>
          </div>
        ) : card ? (
          renderGenericBack(
            "bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14)_0%,transparent_38%),repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_12px),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.28))]"
          )
        ) : (
          renderGenericBack(backTone)
        )}
      </div>
    </motion.div>
  );
}
