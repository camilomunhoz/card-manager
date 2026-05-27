"use client";

import { motion } from "framer-motion";
import type { CardData } from "@/lib/types";

interface GameCardProps {
  card: CardData | null;
  isFaceUp?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function GameCard({
  card,
  isFaceUp = true,
  onClick,
  className = "",
}: GameCardProps) {
  return (
    <motion.div
      onClick={onClick}
      animate={{ rotateY: isFaceUp ? 180 : 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={`relative aspect-[5/3] w-full cursor-pointer card-3d ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div className="card-face absolute inset-0 rounded-2xl border border-white/20 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black shadow-[0_15px_35px_rgba(0,0,0,0.4)]" />
      <div className="card-face back absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-200 via-amber-100 to-orange-50 p-4 text-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
        {card ? (
          <div className="flex h-full flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-zinc-600">
              <span>{card.classe}</span>
              <span>Custo {card.custo}</span>
            </div>
            <div className="font-display text-2xl uppercase tracking-wide text-zinc-900">
              {card.titulo}
            </div>
            <div className="text-sm leading-6 text-zinc-700">
              {card.descricao}
            </div>
            <div className="mt-auto text-xs uppercase tracking-widest text-zinc-500">
              {card.condicao || "Sem condicao"}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-zinc-400">
            Vazio
          </div>
        )}
      </div>
    </motion.div>
  );
}
