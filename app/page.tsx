"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Toast from "@/components/Toast";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimer.current = null;
    }, 2200);
  }, []);

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

  const joinRoom = async () => {
    if (!roomCode.trim()) return;
    setIsJoining(true);
    try {
      const { error } = await supabaseBrowser
        .from("rooms")
        .select("id")
        .eq("id", roomCode.trim())
        .single();
      if (error) {
        showToast("Sala não encontrada.");
        return;
      }
      router.push(`/room/${roomCode.trim()}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/40 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="font-display text-5xl uppercase tracking-wide text-white">
          Playtest <small className="ml-5">Freud Explica - Versão Medieval</small>
        </p>
        <p className="mt-3 max-w-xl text-base text-[color:var(--muted)]">
          Enquanto não temos 23874239 cartas de ação impressas, vamos usar esse carinha aqui para simular o baralho.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              Nova Sala
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              O baralho é inicializado automaticamente.
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
            <div className="mt-6 flex w-full items-center rounded-full border border-white/20 bg-black/30">
              <span className="pl-4 text-sm uppercase tracking-widest text-white/60">ROOM-</span>
              <input
                value={roomCode.replace("ROOM-", "")}
                onChange={(event) => setRoomCode("ROOM-" + event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="1234"
                className="flex-1 bg-transparent pl-0 pr-2 py-3 text-sm uppercase tracking-widest text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={isJoining}
              className="mt-4 w-full rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-[color:var(--accent)] disabled:opacity-70"
            >
              {isJoining ? "Verificando..." : "Entrar na Sala"}
            </button>
          </div>
        </div>
      </main>
      <Toast message={toastMessage} />
    </div>
  );
}
