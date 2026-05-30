"use client";

import { useEffect } from "react";
import { useAnimationControls, motion } from "framer-motion";
import type { CardHistoryAction } from "@/lib/types";

interface HistoryButtonProps {
  onClick: () => void;
  className?: string;
  action?: CardHistoryAction | null;
  glowColor?: string | null;
  pulseToken?: string | number;
}

function HistoryIcon({ action }: { action?: CardHistoryAction | null }) {
  if (action === "used") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M6 8.5V6.2c0-.66.54-1.2 1.2-1.2h9.6c.66 0 1.2.54 1.2 1.2V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7.5 8.5h9l-.7 11.2c-.04.64-.57 1.13-1.2 1.13H9.4c-.63 0-1.16-.49-1.2-1.13L7.5 8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9.8 13 1.5 1.5 2.9-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (action === "discarded") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M6.5 7.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 7.5V6.2c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2v1.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.3 7.5 9 18.1c.04.64.57 1.13 1.2 1.13h3.6c.63 0 1.16-.49 1.2-1.13l.7-10.6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10.5 11.2v4M13.5 11.2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m16.3 15.5 2.6 2.6M18.9 15.5l-2.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 20.25c-4.56 0-8.25-3.69-8.25-8.25S7.44 3.75 12 3.75s8.25 3.69 8.25 8.25-3.69 8.25-8.25 8.25Z" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
    </svg>
  );
}

export default function HistoryButton({
  onClick,
  className = "",
  action = null,
  glowColor = null,
  pulseToken,
}: HistoryButtonProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (pulseToken === undefined || pulseToken === null) return;
    void controls.start({
      x: [0, -3, 3, -2, 2, 0],
      transition: { duration: 0.42, ease: "easeInOut" },
    });
  }, [controls, pulseToken]);

  const iconTone = action === "used" ? "text-emerald-200" : action === "discarded" ? "text-amber-200" : "text-white";
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
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 ${iconTone}`}>
        <HistoryIcon action={action} />
      </span>
      <span>Histórico</span>
    </motion.button>
  );
}
