"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-[min(90vw,420px)] rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white"
          >
            <h2 className="font-display text-2xl uppercase tracking-wide">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-white/70">{description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="cursor-pointer rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black"
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
