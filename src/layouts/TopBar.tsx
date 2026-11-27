import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, RefreshCw, Search } from "lucide-react";
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

  const dot = connection === "online" ? "bg-safe-400" : connection === "offline" ? "bg-fraud-400" : "bg-warn-400 animate-pulse";
  const text = connection === "online" ? "Backend online" : connection === "offline" ? "Backend offline" : "Connecting…";
  const critCount = crit.data?.total ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-ink-950/80 px-3 backdrop-blur-md sm:px-5">
      <button aria-label="Open navigation" onClick={onMenu} className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <span className="text-slate-500">Sentinel</span>
        <span className="text-slate-600">/</span>
        <span className="truncate font-medium text-slate-100">{current?.label ?? "Page"}</span>
      </nav>
      <form onSubmit={submit} role="search" className="ml-auto flex max-w-sm flex-1 flex-col">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input aria-label="Search transaction by ID" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transaction ID…" className="input pl-9" />
        </div>
        {err && <span role="alert" className="absolute top-12 text-[11px] text-fraud-300">{err}</span>}
      </form>
      <div className="flex items-center gap-1.5">
        <div title={healthError ? healthError.message : health ? `${health.service} v${health.version} · up ${fmtDuration(health.uptime_seconds)}` : undefined} className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-inset ring-white/10 md:flex" data-testid="connection-status">
          <span className={`h-2 w-2 rounded-full ${dot}`} /> {text}
        </div>
        <button aria-label="Refresh data" title="Refresh data" onClick={refresh} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
          <RefreshCw className="h-[18px] w-[18px]" />
        </button>
        <button aria-label={critCount ? `${critCount} critical alerts` : "No critical alerts"} title="Critical alerts (stored prediction outputs)" onClick={() => nav("/alerts")} className="relative rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
          <Bell className="h-[18px] w-[18px]" />
          {critCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-fraud-500 px-1 text-[10px] font-semibold text-white">{critCount > 999 ? "999+" : critCount}</span>}
        </button>
      </div>
    </header>
  );
}
