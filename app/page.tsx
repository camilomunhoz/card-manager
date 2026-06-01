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
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        showToast(data?.error || "Nao foi possivel criar a sala.");
        return;
      }
      const data = (await response.json()) as { roomId?: string };
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
        return;
      }
      showToast("Nao foi possivel criar a sala.");
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
    <div className="min-h-screen flex-1 px-4 py-8 sm:px-6 sm:py-16">
      <main className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
        <div className="max-w-2xl">
          <p className="font-display text-sm uppercase tracking-[0.45em] text-white/65 sm:text-base">
            Playtest
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[0.92] tracking-tight text-white sm:text-6xl">
            <span className="block">Freud Explica</span>
            <span className="block text-[color:var(--accent)]">Versão Medieval</span>
          </h1>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[color:var(--muted)] sm:text-base">
          Enquanto não temos 23874239 cartas de ação impressas, vamos usar esse carinha aqui para simular o baralho.
        </p>
        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
              Nova Sala
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
              O baralho é inicializado automaticamente.
            </p>
            <button
              onClick={createRoom}
              disabled={isCreating}
              className="mt-5 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black transition duration-200 hover:scale-[1.03] hover:brightness-110 disabled:opacity-70 sm:mt-6"
            >
              {isCreating ? "Criando..." : "Criar Sala"}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
              Entrar
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
              Digite o codigo para entrar em uma sala existente.
            </p>
            <div className="mt-5 flex w-full items-center rounded-full border border-white/20 bg-black/30 pr-2 sm:mt-6">
              <span className="pl-4 text-xs uppercase tracking-widest text-white/60 sm:text-sm">ROOM-</span>
              <input
                value={roomCode.replace("ROOM-", "")}
                onChange={(event) => setRoomCode("ROOM-" + event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="1234"
                className="flex-1 bg-transparent pl-0 pr-1 py-3 text-sm uppercase tracking-widest text-white placeholder:text-white/40 focus:outline-none sm:pr-2"
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={isJoining}
              className="mt-4 w-full rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition duration-200 hover:scale-[1.03] hover:border-[color:var(--accent)] disabled:opacity-70"
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
