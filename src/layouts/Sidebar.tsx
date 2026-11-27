import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Activity, BellRing, ChevronsLeft, ChevronsRight, GaugeCircle, LayoutDashboard, Network, ScanSearch, ShieldAlert, X } from "lucide-react";
import emblemImg from "@/assets/images/lime_hex_emblem_1795757055811.jpg";

export const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transaction Explorer", icon: ScanSearch },
  { to: "/prediction", label: "Fraud Prediction", icon: ShieldAlert },
  { to: "/graph", label: "Graph Explorer", icon: Network },
  { to: "/models", label: "Model Performance", icon: GaugeCircle },
  { to: "/alerts", label: "Fraud Alerts", icon: BellRing },
] as const;

export function Logo({ compact }: { compact?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-500/35 bg-gradient-to-br from-ink-750/70 via-ink-900 to-ink-800 shadow-glow">
        {imgErr ? (
          <Activity className="h-4 w-4 text-brand-500" aria-hidden />
        ) : (
          <img
            src={emblemImg}
            alt="Sentinel GNN mark"
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-sm font-bold tracking-tight text-cloud whitespace-nowrap">Sentinel GNN</p>
          <p className="text-[11px] text-silver whitespace-nowrap">Graph Fraud Platform</p>
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  const links = (compact: boolean, onClick?: () => void, touchComfort = false) => (
    <nav aria-label="Primary" className="mt-5 flex flex-col gap-1.5 px-3">
      {NAV.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest}
          onClick={onClick}
          title={compact ? label : undefined}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-xl px-3 ${touchComfort ? "py-3" : "py-2.5"} text-sm font-medium transition duration-150 whitespace-nowrap ${
              compact ? "justify-center" : ""
            } ${
              isActive
                ? "border border-brand-500/35 bg-gradient-to-r from-ink-750/75 via-ink-800/80 to-transparent text-cloud shadow-card"
                : "border border-transparent text-silver hover:translate-x-0.5 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-cloud"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-brand-500" : "text-silver group-hover:text-model-400"}`} aria-hidden />
              {!compact && <span className="truncate">{label}</span>}
              {!compact && isActive && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-500 to-model-500" />}
              {compact && <span className="sr-only">{label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      <aside className={`hidden shrink-0 flex-col border-r border-white/[0.08] bg-ink-900/90 backdrop-blur-md transition-[width] duration-200 lg:flex ${collapsed ? "w-[74px]" : "w-64"}`}>
        <div className={`flex h-16 items-center border-b border-white/[0.07] ${collapsed ? "justify-center" : "px-5"}`}>
          <Logo compact={collapsed} />
        </div>
        {links(collapsed)}
        <div className="mt-auto p-3">
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-silver transition hover:border-brand-500/35 hover:bg-white/5 hover:text-cloud"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm animate-fade" onClick={onCloseMobile} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-ink-900 animate-fade">
            <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5">
              <Logo />
              <button ref={closeBtnRef} type="button" aria-label="Close navigation" onClick={onCloseMobile} className="grid h-9 w-9 place-items-center rounded-lg text-silver hover:bg-white/5 hover:text-cloud">
                <X className="h-5 w-5" />
              </button>
            </div>
            {links(false, onCloseMobile, true)}
          </aside>
        </div>
      )}
    </>
  );
}
