"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/rooms/create", { method: "POST" });
      const data = (await response.json()) as { roomId?: string };
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = () => {
    if (!roomCode.trim()) return;
    router.push(`/room/${roomCode.trim()}`);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/40 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="font-display text-5xl uppercase tracking-wide text-white">
          Card Arena
        </p>
        <p className="mt-3 max-w-xl text-base text-[color:var(--muted)]">
          Crie uma sala, compartilhe o codigo e comece o playtest. Sem turnos,
          sem travas, com feedback instantaneo.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Nova Sala
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              O baralho eh inicializado automaticamente.
            </p>
            <button
              onClick={createRoom}
              disabled={isCreating}
              className="mt-6 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:brightness-110 disabled:opacity-70"
            >
              {isCreating ? "Criando..." : "Criar Sala"}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Entrar
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Digite o codigo para entrar em uma sala existente.
            </p>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="ROOM-1234"
              className="mt-6 w-full rounded-full border border-white/20 bg-black/30 px-4 py-3 text-sm uppercase tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
            <button
              onClick={joinRoom}
              className="mt-4 w-full rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-[color:var(--accent)]"
            >
              Entrar na Sala
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
