import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CommandPalette } from "@/components/CommandPalette";
import { ScrollProgressBar } from "@/components/MotionPrimitives";
import { QuickActions } from "@/components/QuickActions";
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
    <div className="relative flex min-h-screen">
      <AnimatedBackground />
      <ScrollProgressBar />
      <CommandPalette />
      <QuickActions />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-brand-500 focus:px-3 focus:py-1.5 focus:font-semibold focus:text-ink-900">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobile(true)} />
        {connection === "offline" && (
          <div role="alert" className="flex items-center gap-2 border-b border-fraud-400/25 bg-fraud-500/10 px-5 py-2 text-xs text-fraud-200 backdrop-blur-sm">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
            <span>{healthError?.message ?? "Backend unreachable."} Data shown on pages may be stale or missing; nothing is substituted.</span>
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-[1520px] flex-1 px-3 py-6 sm:px-6 lg:px-8">
          <div key={loc.pathname} className="animate-pageEnter">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-white/[0.08] bg-ink-950/80 px-6 pb-16 pt-5 text-xs text-silver backdrop-blur-md sm:pb-6">
          <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-3">
            <p className="text-cloud font-medium">Sentinel GNN · Graph-Based Financial Fraud Detection</p>
            <p className="text-silver">
              Predictions are indicators for investigation, not proof of fraud. No database: all live values come from the backend&apos;s files and in-memory processing.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
