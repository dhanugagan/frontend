import { useEffect, useState } from "react";
import { ArrowUp, Command } from "lucide-react";
import { openCommandPalette } from "./CommandPalette";

/** Compact floating quick-action dock providing instant Command Palette access and smooth Scroll-to-Top. */
export function QuickActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-label="Quick actions"
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/90 p-1.5 shadow-elevated backdrop-blur-md"
    >
      <button
        type="button"
        onClick={openCommandPalette}
        title="Open command palette (⌘K)"
        aria-label="Open command palette"
        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-silver transition hover:bg-white/[0.07] hover:text-cloud"
      >
        <Command className="h-3.5 w-3.5 text-brand-500" aria-hidden />
        <span className="hidden sm:inline font-mono text-[11px]">⌘K</span>
      </button>
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Scroll to top"
          aria-label="Scroll to top"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-model-500 p-1.5 text-ink-900 shadow-glow transition hover:brightness-105"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
