import { NavLink } from "react-router-dom";
import { Activity, BellRing, ChevronsLeft, ChevronsRight, GaugeCircle, LayoutDashboard, Network, ScanSearch, ShieldAlert, X } from "lucide-react";

export const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transaction Explorer", icon: ScanSearch },
  { to: "/prediction", label: "Fraud Prediction", icon: ShieldAlert },
  { to: "/graph", label: "Graph Explorer", icon: Network },
  { to: "/models", label: "Model Performance", icon: GaugeCircle },
  { to: "/alerts", label: "Fraud Alerts", icon: BellRing },
] as const;

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-400/25 to-model-500/25 ring-1 ring-inset ring-brand-400/30">
        <Activity className="h-4 w-4 text-brand-300" aria-hidden />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-white">Sentinel GNN</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Crypto fraud intelligence</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: Props) {
  const links = (compact: boolean, onClick?: () => void) => (
    <nav aria-label="Primary" className="mt-6 flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest}
          onClick={onClick}
          title={compact ? label : undefined}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${compact ? "justify-center" : ""} ${isActive ? "bg-brand-400/10 text-brand-300 shadow-[inset_2px_0_0_0_#22d3ee]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`
          }
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!compact && <span className="truncate">{label}</span>}
          {compact && <span className="sr-only">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <>
      <aside className={`hidden shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/80 backdrop-blur transition-[width] duration-200 lg:flex ${collapsed ? "w-[68px]" : "w-64"}`}>
        <div className={`flex h-14 items-center border-b border-white/[0.06] ${collapsed ? "justify-center" : "px-5"}`}>
          <Logo compact={collapsed} />
        </div>
        {links(collapsed)}
        <div className="mt-auto p-3">
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/70" onClick={onCloseMobile} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-ink-900 animate-fade">
            <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
              <Logo />
              <button aria-label="Close navigation" onClick={onCloseMobile} className="rounded p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {links(false, onCloseMobile)}
          </aside>
        </div>
      )}
    </>
  );
}
