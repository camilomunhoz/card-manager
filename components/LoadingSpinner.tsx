"use client";

export default function LoadingSpinner({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-full border border-white/10 bg-black/80 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      Carregando
    </div>
  );
}
