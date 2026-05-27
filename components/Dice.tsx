"use client";

import { useState } from "react";

const outcomes = ["+Eco", "+Motivacao", "+Regeneracao"] as const;

export default function Dice() {
  const [value, setValue] = useState<string | null>(null);

  const roll = () => {
    const next = outcomes[Math.floor(Math.random() * outcomes.length)];
    setValue(next);
  };

  return (
    <button
      onClick={roll}
      className="flex h-32 w-32 flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-center text-sm uppercase tracking-widest text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
    >
      <span className="text-xs text-white/60">Dado</span>
      <span className="mt-2 font-display text-2xl">
        {value || "Rolar"}
      </span>
    </button>
  );
}
