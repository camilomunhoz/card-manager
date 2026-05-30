"use client";

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

interface RefreshButtonProps {
  onClick: () => void;
  className?: string;
  glowColor?: string | null;
  pulseToken?: string | number;
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-13.9 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12a8 8 0 0 1 13.9-5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 16.7 6 17.8l-1.1-.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.8 7.3 18 6.2l1.1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RefreshButton({
  onClick,
  className = "",
  glowColor = null,
  pulseToken,
}: RefreshButtonProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (pulseToken === undefined || pulseToken === null) return;
    void controls.start({
      x: [0, -3, 3, -2, 2, 0],
      transition: { duration: 0.42, ease: "easeInOut" },
    });
  }, [controls, pulseToken]);

  const outlineColor = glowColor || "rgba(255,255,255,0.18)";
  const shadowColor = glowColor ? `${glowColor}66` : "rgba(255,255,255,0.12)";
  const buttonGlow = glowColor
    ? `${glowColor}55, 0 0 18px ${glowColor}22, 0 0 0 1px ${glowColor}55`
    : "0 0 0 1px rgba(255,255,255,0.12)";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={controls}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center gap-2 rounded-full border bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[color:var(--accent)] ${className}`}
      style={{
        borderColor: outlineColor,
        boxShadow: `0 0 0 1px ${shadowColor}, ${buttonGlow}`,
      }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90">
        <RefreshIcon />
      </span>
      <span>Repor Mercado</span>
    </motion.button>
  );
}
