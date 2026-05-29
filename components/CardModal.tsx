"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CardData } from "@/lib/types";
import type { CardRenderMode } from "./GameCard";
import ScaledCard from "./ScaledCard";

interface CardModalProps {
  card: CardData | null;
  isOpen: boolean;
  actionLabel?: string;
  showBackOnly?: boolean;
  disableFlip?: boolean;
  renderMode?: CardRenderMode;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function CardModal({
  card,
  isOpen,
  actionLabel,
  showBackOnly = false,
  disableFlip = false,
  renderMode = "safe",
  onClose,
  onConfirm,
}: CardModalProps) {
  const [zoom, setZoom] = useState(2.5);

  useEffect(() => {
    const update = () => {
      setZoom(Math.min(3, window.innerWidth / 240, window.innerHeight / 144));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
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
              scale={zoom}
              layoutId={card ? `card-${card.id}` : undefined}
              renderMode={renderMode}
            />
            <div className="relative z-50 flex gap-3">
              {onConfirm && actionLabel && (
                <motion.button
                  onClick={onConfirm}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="cursor-pointer rounded-full bg-[color:var(--accent)] px-6 py-3 text-xs font-semibold uppercase tracking-wide text-black"
                >
                  {actionLabel}
                </motion.button>
              )}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="cursor-pointer rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Fechar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
