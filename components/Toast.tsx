"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 left-1/2 z-50 w-[min(80vw,360px)] -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
