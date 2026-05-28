"use client";

import { motion } from "framer-motion";
import type { CardData } from "@/lib/types";
import GameCard from "./GameCard";

interface ScaledCardProps {
  card: CardData | null;
  scale?: number;
  isFaceUp?: boolean;
  disableFlip?: boolean;
  onClick?: () => void;
  layoutId?: string;
  className?: string;
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
}: ScaledCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      style={{
        width: CARD_W * scale,
        height: CARD_H * scale,
      }}
      className={`relative ${className}`}
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
        />
      </div>
    </motion.div>
  );
}
