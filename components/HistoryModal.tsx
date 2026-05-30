"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CardHistoryEntry, PlayerState } from "@/lib/types";
import { getPlayerColorInfo } from "@/lib/playerColors";

interface HistoryModalProps {
  entries: CardHistoryEntry[];
  players: Record<string, PlayerState>;
  isOpen: boolean;
  onClose: () => void;
}

const emptyMessage = "Nenhuma carta foi usada ou descartada ainda.";

const truncateName = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 7 ? `${trimmed.slice(0, 7)}...` : trimmed;
};

function HistoryTag({ action }: { action: CardHistoryEntry["action"] }) {
  const label = action === "used" ? "Usada" : "Descartada";
  const tone = action === "used"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : "border-amber-400/30 bg-amber-400/10 text-amber-200";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone}`}>
      {label}
    </span>
  );
}

export default function HistoryModal({ entries, players, isOpen, onClose }: HistoryModalProps) {
  const usedEntries = entries.filter((entry) => entry.action === "used").slice().reverse();
  const discardedEntries = entries.filter((entry) => entry.action === "discarded").slice().reverse();

  const renderEntry = (entry: CardHistoryEntry) => {
    const resolvedPlayer = players[entry.playerId] ?? null;
    const colorInfo = getPlayerColorInfo(resolvedPlayer?.color ?? entry.playerColor);
    const playerLabel = truncateName(resolvedPlayer?.name ?? entry.playerName);

    return (
      <div
        key={entry.id}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-3 rounded-md bg-black/10 px-3 py-1.5">
                <p className="font-display text-lg truncate uppercase tracking-wide text-white">
                  {entry.card.titulo}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: `${colorInfo.value}66`,
                color: colorInfo.value,
                backgroundColor: `${colorInfo.value}1A`,
              }}
            >
              {playerLabel}
            </span>
          </div>
        </div>

        <div className="text-sm text-white/70">{entry.card.descricao}</div>

        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60 mt-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
            {entry.card.classe}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
            Custo {entry.card.custo}
          </span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="flex max-h-[84vh] w-[min(94vw,920px)] flex-col overflow-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-2xl scrollbar-accent"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <h2 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">
                  Histórico
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Cartas usadas ou descartadas, com a cor do jogador que fez a ação.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white/90">
                    <span className="rounded-md px-3 py-1" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(52,211,153,0.16)", color: "#BBF7D0" }}>
                      Usadas
                    </span>
                  </h3>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    {usedEntries.length}
                  </span>
                </div>
                <div className="scrollbar-accent min-h-0 flex-1 max-h-[56vh] space-y-3 overflow-y-auto pr-1">
                  {usedEntries.length ? usedEntries.map(renderEntry) : <p className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-sm text-white/55">{emptyMessage}</p>}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white/90">
                    <span className="rounded-md px-3 py-1" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#FFE6B9" }}>
                      Descartadas
                    </span>
                  </h3>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    {discardedEntries.length}
                  </span>
                </div>
                <div className="scrollbar-accent min-h-0 flex-1 max-h-[56vh] space-y-3 overflow-y-auto pr-1">
                  {discardedEntries.length ? discardedEntries.map(renderEntry) : <p className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-sm text-white/55">{emptyMessage}</p>}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
