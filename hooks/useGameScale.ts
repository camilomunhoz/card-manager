"use client";

import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Reference design resolution (desktop)                              */
/* ------------------------------------------------------------------ */
const REF_W = 1200;
const REF_H = 800;

export interface GameScale {
  /** Global uniform scale factor (0…1) */
  scale: number;
  /** Card width for this viewport */
  cardW: number;
  /** Card height for this viewport */
  cardH: number;
  /** Deck pile dimensions */
  deckW: number;
  deckH: number;
  /** Dice dimensions (square) */
  diceSize: number;
}

/* ------------------------------------------------------------------ */
/*  Card base sizes at scale = 1 (md)                                  */
/* ------------------------------------------------------------------ */
const BASE_CARD_W = 240;
const BASE_CARD_H = 144;
const BASE_DECK_W = 240;
const BASE_DECK_H = 144;
const BASE_DICE = 128;

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Returns a game scale object that adapts all UI element sizes to the
 * current viewport.  The reference resolution is 1200×800 px – on
 * smaller screens the scale drops so that cards, deck and dice
 * remain proportional and never overflow.
 */
export function useGameScale(
  viewport: { width: number; height: number },
): GameScale {
  return useMemo(() => {
    const { width: vw, height: vh } = viewport;

    // Guard against SSR / missing measurement
    if (!vw || !vh) {
      return {
        scale: 1,
        cardW: BASE_CARD_W,
        cardH: BASE_CARD_H,
        deckW: BASE_DECK_W,
        deckH: BASE_DECK_H,
        diceSize: BASE_DICE,
      };
    }

    // Scale so that a 2×2 mercado grid + deck always fits in the right
    // half of the viewport (which gets roughly vw/2 × vh).
    const halfW = vw / 2;
    const usableW = halfW - 64; // horizontal padding
    const usableH = vh - 64;     // vertical padding

    // Two cards side-by-side need 2 * cardW + gap; above them the deck.
    // We solve for the largest cardW that fits both constraints.
    const maxCardWFromWidth = (usableW - 16) / 2;   // 16 px gap
    const maxCardWFromHeight = (usableH - 16) / 2.5; // 2 cards + deck ≈ 2.5 card heights

    const targetCardW = Math.min(maxCardWFromWidth, maxCardWFromHeight, BASE_CARD_W);
    const scale = Math.max(0.35, Math.min(1, targetCardW / BASE_CARD_W));

    return {
      scale,
      cardW: Math.round(BASE_CARD_W * scale),
      cardH: Math.round(BASE_CARD_H * scale),
      deckW: Math.round(BASE_DECK_W * scale),
      deckH: Math.round(BASE_DECK_H * scale),
      diceSize: Math.round(BASE_DICE * scale),
    };
  }, [viewport.width, viewport.height]);
}
