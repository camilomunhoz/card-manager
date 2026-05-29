"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CardHistoryEntry } from "@/lib/types";
import { getPlayerColorInfo } from "@/lib/playerColors";

interface HistoryModalProps {
  entries: CardHistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

const emptyMessage = "Nenhuma carta foi usada ou descartada ainda.";

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

export default function HistoryModal({ entries, isOpen, onClose }: HistoryModalProps) {
  const usedEntries = entries.filter((entry) => entry.action === "used").slice().reverse();
  const discardedEntries = entries.filter((entry) => entry.action === "discarded").slice().reverse();

  const renderEntry = (entry: CardHistoryEntry) => {
    const colorInfo = getPlayerColorInfo(entry.playerColor);

    return (
      <div
        key={entry.id}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl uppercase tracking-wide text-white">
              {entry.card.titulo}
            </p>
            <HistoryTag action={entry.action} />
          </div>
          <p className="text-sm text-white/70">{entry.card.descricao}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
              {entry.card.classe}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
              Custo {entry.card.custo}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          <span
            className="h-3.5 w-3.5 rounded-full border border-black/20"
            style={{ backgroundColor: colorInfo.value }}
            aria-hidden="true"
          />
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              borderColor: `${colorInfo.value}66`,
              color: colorInfo.value,
              backgroundColor: `${colorInfo.value}1A`,
            }}
          >
            {entry.playerName}
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
            className="flex h-[min(84vh,760px)] w-[min(94vw,920px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/90 text-white shadow-2xl"
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

            <div className="grid flex-1 gap-4 overflow-hidden p-5 sm:grid-cols-2 sm:p-6">
              <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white/90">
                    Usadas
                  </h3>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    {usedEntries.length}
                  </span>
                </div>
                <div className="scrollbar-accent min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {usedEntries.length ? usedEntries.map(renderEntry) : <p className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-sm text-white/55">{emptyMessage}</p>}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white/90">
                    Descartadas
                  </h3>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    {discardedEntries.length}
                  </span>
                </div>
                <div className="scrollbar-accent min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
