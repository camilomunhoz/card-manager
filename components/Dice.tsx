"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEventHandler } from "react";

interface DiceProps {
  /** Dice size in pixels (square). Default 128. */
  size?: number;
  value?: string | null;
  isRolling?: boolean;
  shakeToken?: number | null;
  glowColor?: string | null;
  onRoll?: MouseEventHandler<HTMLButtonElement>;
}

export default function Dice({
  size = 128,
  value = null,
  isRolling = false,
  shakeToken = null,
  glowColor = null,
  onRoll,
}: DiceProps) {
  const labelFont = Math.round(size * 0.09375);
  const valueFont = Math.round(size * 0.1875);
  const valueMarginTop = Math.round(size * 0.02);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);
  const didMountRef = useRef(false);
  const glowStyle = !isRolling && glowColor
    ? {
        boxShadow: `0 0 0 1px ${glowColor}, 0 0 22px ${glowColor}`,
      }
    : undefined;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (shakeToken === null) return;

    setIsShaking(true);
    if (shakeTimerRef.current) {
      window.clearTimeout(shakeTimerRef.current);
    }
    shakeTimerRef.current = window.setTimeout(() => {
      setIsShaking(false);
      shakeTimerRef.current = null;
    }, 650);
  }, [shakeToken]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        window.clearTimeout(shakeTimerRef.current);
      }
    };
  }, []);

  const canRoll = Boolean(onRoll) && !isRolling;

  return (
    <motion.button
      onClick={onRoll}
      disabled={isRolling || !onRoll}
      whileHover={canRoll ? { scale: 1.03 } : undefined}
      whileTap={canRoll ? { scale: 0.96 } : undefined}
      animate={
        isRolling
          ? { rotate: [0, 120, 240, 360], scale: [1, 1.02, 1.01, 1] }
          : isShaking
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0], rotate: [0, -4, 4, -3, 3, -1, 1, 0] }
            : { rotate: 0, scale: 1, x: 0 }
      }
      transition={
        isRolling
          ? {
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.4, 0.75, 1],
            }
          : isShaking
            ? {
                duration: 0.65,
                ease: "easeInOut",
              }
          : undefined
      }
      style={{ width: size, height: size, ...glowStyle }}
      className={`flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-center text-sm uppercase tracking-widest text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] ${canRoll ? "cursor-pointer" : ""} disabled:cursor-default disabled:opacity-70`}
    >
      <span className="text-white/60" style={{ fontSize: labelFont }}>
        Dado
      </span>
      <span className="font-display" style={{ fontSize: valueFont, marginTop: valueMarginTop }}>
        {isRolling ? "..." : value || "Rolar"}
      </span>
    </motion.button>
  );
}
