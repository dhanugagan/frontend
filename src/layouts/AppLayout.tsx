import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { useApp } from "@/hooks/AppContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  const { connection, healthError } = useApp();
  useEffect(() => setMobile(false), [loc.pathname]);
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-brand-500 focus:px-3 focus:py-1.5 focus:text-ink-950">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobile(true)} />
        {connection === "offline" && (
          <div role="alert" className="flex items-center gap-2 border-b border-fraud-400/25 bg-fraud-400/10 px-5 py-2 text-xs text-fraud-200">
            <WifiOff className="h-4 w-4" /> {healthError?.message ?? "Backend unreachable."} Data shown on pages may be stale or missing; nothing is substituted.
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-5 sm:px-5 lg:px-6">
          <Outlet />
        </main>
        <footer className="border-t border-white/[0.05] px-5 py-3 text-center text-[11px] text-slate-500">Predictions are indicators for investigation, not proof of fraud. No database: all values come from the backend's files and in-memory processing.</footer>
      </div>
    </div>
  );
}
