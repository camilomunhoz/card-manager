"use client";

import { motion } from "framer-motion";
import type { CardData } from "@/lib/types";

interface GameCardProps {
  card: CardData | null;
  isFaceUp?: boolean;
  disableFlip?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  layoutId?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { w: 160, h: 96 },
  md: { w: 240, h: 144 },
  lg: { w: 360, h: 216 },
} as const;

const CLASS_PATTERN: Record<string, string> = {
  Resiliente: "/patterns/pattern-resiliente.png",
  Sinergista: "/patterns/pattern-sinergista.png",
  Impetuoso: "/patterns/pattern-impetuoso.png",
};

export default function GameCard({
  card,
  isFaceUp = true,
  disableFlip = false,
  size = "md",
  onClick,
  layoutId,
  className = "",
}: GameCardProps) {
  const rotation = isFaceUp ? 180 : 0;
  const { w: CARD_W, h: CARD_H } = SIZE_MAP[size];
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      animate={disableFlip ? undefined : { rotateY: rotation }}
      transition={disableFlip ? undefined : { duration: 0.6, ease: "easeInOut" }}
      style={{
        width: CARD_W,
        height: CARD_H,
        ...(disableFlip ? { transform: `rotateY(${rotation}deg)` } : {}),
        perspective: "1200px",
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
              <span className="rounded-full bg-[color:#6b6420] text-white px-1">{card.classe}</span>
              <span>Custo {card.custo}</span>
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
          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-zinc-400">
            Vazio
          </div>
        )}
      </div>
    </motion.div>
  );
}
