"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

const outcomes = ["+Eco", "+Motivacao", "+Regeneracao"] as const;

export default function Dice() {
  const [value, setValue] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const timerRef = useRef<number | null>(null);

  const roll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setValue(null);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      const next = outcomes[Math.floor(Math.random() * outcomes.length)];
      setValue(next);
      setIsRolling(false);
      timerRef.current = null;
    }, 2000);
  };

  return (
    <motion.button
      onClick={roll}
      disabled={isRolling}
      animate={
        isRolling
          ? { rotate: [0, 120, 240, 360], scale: [1, 1.02, 1.01, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        isRolling
          ? {
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.4, 0.75, 1],
            }
          : undefined
      }
      className="flex h-32 w-32 flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-center text-sm uppercase tracking-widest text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] disabled:opacity-70"
    >
      <span className="text-xs text-white/60">Dado</span>
      <span className="mt-2 font-display text-2xl">
        {isRolling ? "..." : value || "Rolar"}
      </span>
    </motion.button>
  );
}
