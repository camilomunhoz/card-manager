"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CardRenderMode } from "./GameCard";

interface DeckPileProps {
  /** Pixel dimensions – pass from useGameScale */
  w?: number;
  h?: number;
  onClick?: () => void;
  renderMode?: CardRenderMode;
}

export default function DeckPile({ w = 240, h = 144, onClick, renderMode = "safe" }: DeckPileProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsCompact(media.matches || window.innerHeight < 520);
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const visualScale = isCompact ? 0.82 : 0.92;
  const renderedW = w * visualScale;
  const renderedH = h * visualScale;
  const baseContentScale = Math.min(renderedW / 240, renderedH / 144);
  const contentScale = isCompact
    ? Math.max(0.42, Math.min(0.58, baseContentScale))
    : Math.max(0.55, Math.min(1, baseContentScale));
  const topFontSize = Math.max(isCompact ? 5.5 : 7, 10 * contentScale);
  const topMiniFontSize = Math.max(isCompact ? 5 : 6, 9 * contentScale);
  const centerFontSize = Math.max(isCompact ? 11 : 14, 24 * contentScale);
  const footerFontSize = Math.max(isCompact ? 5 : 6, 9 * contentScale);
  const topPaddingX = Math.max(isCompact ? 3 : 4, 8 * contentScale);
  const topPaddingY = Math.max(isCompact ? 1.5 : 2, 5 * contentScale);
  const footerPaddingY = Math.max(isCompact ? 1.5 : 2, 4 * contentScale);

  return (
    <motion.button
      onClick={onClick}
      whileHover={onClick ? { scale: 1.03 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`relative ${onClick ? "cursor-pointer" : ""}`}
      style={{ width: renderedW, height: renderedH }}
      aria-label="Comprar carta do monte"
    >
      <div className="absolute left-2 top-2 h-full w-full rounded-lg bg-black/60 shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
      <div className="absolute left-1 top-1 h-full w-full rounded-lg bg-black/70 shadow-[0_12px_30px_rgba(0,0,0,0.55)]" />
      {renderMode === "classic" ? (
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14)_0%,transparent_38%),repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0_2px,transparent_2px_12px),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.28))]" />
          <div className="pointer-events-none absolute inset-0 rounded-lg border border-white/10" />
          {/* Classic deck small: plain dark/gray gradient back with no text */}
        </div>
      ) : (
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14)_0%,transparent_38%),repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_12px),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.28))]" />
          <div className="pointer-events-none absolute inset-0 rounded-lg border border-white/10" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between text-white/80">
            <div
              className="flex items-center justify-between font-semibold uppercase tracking-widest text-white/70"
              style={{ fontSize: topFontSize, padding: `${topPaddingY}px ${topPaddingX}px 0` }}
            >
              <span className="rounded-full border border-white/20 px-2 py-0.5 leading-none" style={{ fontSize: topMiniFontSize }}>
                Carta
              </span>
              <span>Monte</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-display uppercase tracking-[0.35em] text-white/80 leading-none"
                style={{ fontSize: centerFontSize, paddingLeft: isCompact ? 10 : 16, paddingRight: isCompact ? 10 : 16, paddingTop: isCompact ? 4 : 8, paddingBottom: isCompact ? 4 : 8 }}
              >
                Carta
              </div>
            </div>
            <div
              className="text-center uppercase tracking-[0.3em] text-white/50"
              style={{ fontSize: footerFontSize, paddingBottom: footerPaddingY }}
            >
              Freud Explica
            </div>
          </div>
        </div>
      )}
    </motion.button>
  );
}
