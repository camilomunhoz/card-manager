"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CardData } from "@/lib/types";
import GameCard from "./GameCard";

interface CardModalProps {
  card: CardData | null;
  isOpen: boolean;
  actionLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function CardModal({
  card,
  isOpen,
  actionLabel,
  onClose,
  onConfirm,
}: CardModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex w-[min(90vw,520px)] flex-col items-center gap-6"
          >
            <div className="w-full" style={{ transform: "scale(1.5)" }}>
              <GameCard card={card} />
            </div>
            <div className="flex gap-3">
              {onConfirm && actionLabel && (
                <button
                  onClick={onConfirm}
                  className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-black"
                >
                  {actionLabel}
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
