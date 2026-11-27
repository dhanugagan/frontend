import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Command, Menu, RefreshCw, Search } from "lucide-react";
import { openCommandPalette } from "@/components/CommandPalette";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/services/api";
import { fmtDuration } from "@/utils/format";
import { NAV } from "./Sidebar";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { connection, health, healthError, refresh, refreshKey } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const current = NAV.find((n) => (n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to)));
  const crit = useAsync((s) => api.alerts({ severity: "critical", page_size: 1 }, s), [refreshKey, connection === "online"], connection === "online");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!/^\d+$/.test(v)) return setErr("Enter a numeric transaction ID");
    setErr(null);
    nav(`/transactions?tx=${v}`);
    setQ("");
  };

  const dot = connection === "online" ? "bg-brand-500" : connection === "offline" ? "bg-fraud-400" : "bg-warn-400 animate-pulse";
  const text = connection === "online" ? "Backend online" : connection === "offline" ? "Backend offline" : "Connecting…";
  const critCount = crit.data?.total ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/[0.08] bg-ink-900/85 px-3 backdrop-blur-md sm:gap-4 sm:px-6">
      <button type="button" aria-label="Open navigation" onClick={onMenu} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-silver hover:bg-white/5 hover:text-cloud lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <span className="text-silver whitespace-nowrap">Sentinel</span>
        <span className="text-steel" aria-hidden="true">/</span>
        <span className="truncate font-display font-semibold text-cloud">{current?.label ?? "Page"}</span>
      </nav>
      <form onSubmit={submit} role="search" className="ml-auto flex min-w-0 max-w-sm flex-1 flex-col">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" aria-hidden />
          <input aria-label="Search transaction by ID" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transaction ID…" className="input h-9 pl-9 text-xs sm:text-sm" />
        </div>
        {err && <span role="alert" className="absolute top-14 text-[11px] text-fraud-300">{err}</span>}
      </form>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div title={healthError ? healthError.message : health ? `${health.service} v${health.version} · up ${fmtDuration(health.uptime_seconds)}` : undefined} className="hidden items-center gap-2 rounded-xl border border-white/10 bg-ink-950/85 px-3 py-1.5 text-xs text-cloud/85 md:flex whitespace-nowrap" data-testid="connection-status">
          <span className={`h-2 w-2 rounded-full ${dot}`} /> {text}
        </div>
        <button
          type="button"
          aria-label="Open quick command palette"
          title="Command palette (⌘K)"
          onClick={openCommandPalette}
          className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-950/75 px-2.5 text-xs text-silver transition hover:border-brand-500/45 hover:bg-white/5 hover:text-cloud sm:inline-flex"
        >
          <Command className="h-3.5 w-3.5 text-brand-500" aria-hidden />
          <span className="font-mono text-[11px]">K</span>
        </button>
        <button type="button" aria-label="Refresh data" title="Refresh data" onClick={refresh} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-ink-950/75 text-silver transition hover:border-brand-500/45 hover:bg-white/5 hover:text-cloud">
          <RefreshCw className="h-[18px] w-[18px]" />
        </button>
        <button type="button" aria-label={critCount ? `${critCount} critical alerts` : "No critical alerts"} title="Critical alerts (stored prediction outputs)" onClick={() => nav("/alerts")} className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-ink-950/75 text-silver transition hover:border-model-500/45 hover:bg-white/5 hover:text-cloud">
          <Bell className="h-[18px] w-[18px]" />
          {critCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-[1.15rem] place-items-center rounded-full bg-fraud-500 px-1 text-[10px] font-semibold text-cloud">{critCount > 999 ? "999+" : critCount}</span>}
        </button>
      </div>
    </header>
  );
}
