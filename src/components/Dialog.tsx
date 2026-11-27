import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm animate-fade" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`card animated-border relative max-h-[85vh] w-full overflow-auto p-5 sm:p-6 animate-modalIn ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
          <h2 id={titleId} className="font-display text-base font-semibold text-cloud">{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-silver transition hover:bg-white/5 hover:text-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
