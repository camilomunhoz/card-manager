"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CardData } from "@/lib/types";
import ScaledCard from "./ScaledCard";

interface CardModalProps {
  card: CardData | null;
  isOpen: boolean;
  actionLabel?: string;
  showBackOnly?: boolean;
  disableFlip?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const MODAL_ZOOM = 2.5;

export default function CardModal({
  card,
  isOpen,
  actionLabel,
  showBackOnly = false,
  disableFlip = false,
  onClose,
  onConfirm,
}: CardModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex flex-col items-center gap-6"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ScaledCard
              card={card}
              isFaceUp={!showBackOnly}
              disableFlip={disableFlip}
              scale={MODAL_ZOOM}
              layoutId={card ? `card-${card.id}` : undefined}
            />
            <div className="relative z-50 flex gap-3">
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
