"use client";

import { motion } from "framer-motion";
import type { CardData } from "@/lib/types";
import GameCard, { type CardRenderMode } from "./GameCard";

interface ScaledCardProps {
  card: CardData | null;
  scale?: number;
  isFaceUp?: boolean;
  disableFlip?: boolean;
  onClick?: () => void;
  layoutId?: string;
  className?: string;
  renderMode?: CardRenderMode;
}

const CARD_W = 240;
const CARD_H = 144;

export default function ScaledCard({
  card,
  scale = 1,
  isFaceUp = true,
  disableFlip = false,
  onClick,
  layoutId,
  className = "",
  renderMode = "safe",
}: ScaledCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      whileHover={isInteractive ? { scale: 1.03 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      style={{
        width: CARD_W * scale,
        height: CARD_H * scale,
      }}
      className={`relative ${isInteractive ? "cursor-pointer" : ""} ${className}`}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="origin-top-left"
      >
        <GameCard
          card={card}
          isFaceUp={isFaceUp}
          disableFlip={disableFlip}
          renderMode={renderMode}
        />
      </div>
    </motion.div>
  );
}
