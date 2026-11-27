import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Command,
  GaugeCircle,
  LayoutDashboard,
  Network,
  RefreshCw,
  ScanSearch,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { useApp } from "@/hooks/AppContext";

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  section: "Navigation" | "Transaction" | "Action";
  icon: typeof LayoutDashboard;
  run: () => void;
}

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent("sentinel:open-command-palette"));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { refresh } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("sentinel:open-command-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sentinel:open-command-palette", onCustom);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      prev?.focus?.();
    };
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const trimmed = query.trim();
    const qLower = trimmed.toLowerCase();
    const list: PaletteItem[] = [];

    if (/^\d+$/.test(trimmed)) {
      list.push(
        {
          id: `tx-inspect-${trimmed}`,
          label: `Inspect Transaction #${trimmed}`,
          hint: "Open in Transaction Explorer",
          section: "Transaction",
          icon: ScanSearch,
          run: () => nav(`/transactions?tx=${trimmed}`),
        },
        {
          id: `tx-graph-${trimmed}`,
          label: `Explore Graph Neighbourhood #${trimmed}`,
          hint: "Open in Graph Explorer",
          section: "Transaction",
          icon: Network,
          run: () => nav(`/graph?tx=${trimmed}`),
        },
      );
    }

    const staticItems: PaletteItem[] = [
      { id: "nav-overview", label: "Overview & Landing", hint: "Platform showcase, capabilities & live telemetry", section: "Navigation", icon: LayoutDashboard, run: () => nav("/") },
      { id: "nav-tx", label: "Transaction Explorer", hint: "Search dataset rows, features & outputs", section: "Navigation", icon: ScanSearch, run: () => nav("/transactions") },
      { id: "nav-predict", label: "Fraud Prediction", hint: "Run verified inference or CSV batch", section: "Navigation", icon: ShieldAlert, run: () => nav("/prediction") },
      { id: "nav-graph", label: "Graph Explorer", hint: "Inspect directed txId1 → txId2 neighbourhoods", section: "Navigation", icon: Network, run: () => nav("/graph") },
      { id: "nav-models", label: "Model Performance", hint: "Compare ROC-AUC, PR-AUC, F1 & compatibility", section: "Navigation", icon: GaugeCircle, run: () => nav("/models") },
      { id: "nav-alerts", label: "Fraud Alerts", hint: "Derived high-probability transaction flags", section: "Navigation", icon: BellRing, run: () => nav("/alerts") },
      { id: "act-refresh", label: "Refresh Backend Telemetry", hint: "Re-fetch live backend status & queries", section: "Action", icon: RefreshCw, run: () => refresh() },
    ];

    const filtered = qLower
      ? staticItems.filter((i) => i.label.toLowerCase().includes(qLower) || i.hint.toLowerCase().includes(qLower))
      : staticItems;

    return [...list, ...filtered];
  }, [query, nav, refresh]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  if (!open) return null;

  const execute = (item: PaletteItem) => {
    setOpen(false);
    item.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[10vh] sm:px-4 sm:pt-[12vh]" role="presentation">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick command palette"
        className="card animated-border relative w-full max-w-xl overflow-hidden bg-ink-900/95 shadow-elevated animate-modalIn"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
              } else if (e.key === "Enter" && items[activeIndex]) {
                e.preventDefault();
                execute(items[activeIndex]);
              }
            }}
            placeholder="Jump to page or enter a numeric Transaction ID…"
            className="w-full bg-transparent text-sm text-cloud placeholder:text-silver/70 focus:outline-none"
            aria-label="Command search"
          />
          <button
            type="button"
            aria-label="Close command palette"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-silver transition hover:bg-white/5 hover:text-cloud"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-silver">
              No matching pages or actions. Try a numeric transaction ID or route name.
            </li>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const active = idx === activeIndex;
              return (
                <li key={item.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => execute(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-gradient-to-r from-ink-750/75 via-ink-800/70 to-transparent text-cloud ring-1 ring-brand-500/35"
                        : "text-silver hover:bg-white/[0.04] hover:text-cloud"
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] ${active ? "bg-ink-750 text-brand-500" : "bg-ink-950/70 text-silver"}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      <p className="truncate text-[11px] text-silver">{item.hint}</p>
                    </div>
                    <span className="hidden shrink-0 text-[10px] font-medium tracking-wide text-silver sm:inline">
                      {item.section}
                    </span>
                    <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition ${active ? "text-brand-500 opacity-100" : "opacity-0"}`} aria-hidden />
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-white/[0.07] bg-ink-950/80 px-4 py-2 text-[11px] text-silver">
          <span className="flex items-center gap-1.5">
            <Command className="h-3 w-3 text-model-400" aria-hidden />
            <span>Use ↑ ↓ to navigate · Enter to open · Esc to close</span>
          </span>
          <span className="font-mono text-silver">⌘K</span>
        </div>
      </div>
    </div>
  );
}
