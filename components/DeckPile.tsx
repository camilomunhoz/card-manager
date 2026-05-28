"use client";

export default function DeckPile({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative"
      style={{ width: 240, height: 144 }}
      aria-label="Comprar carta do monte"
    >
      <div className="absolute left-2 top-2 h-full w-full rounded-lg bg-black/60 shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
      <div className="absolute left-1 top-1 h-full w-full rounded-lg bg-black/70 shadow-[0_12px_30px_rgba(0,0,0,0.55)]" />
      <div className="relative h-full w-full rounded-lg border border-white/20 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black shadow-[0_15px_35px_rgba(0,0,0,0.6)]" />
    </button>
  );
}
