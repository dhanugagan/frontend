import { ReactNode } from "react";
import { AlertTriangle, DatabaseZap, Inbox, Loader2, WifiOff } from "lucide-react";
import type { ApiError } from "@/services/client";
import { Button } from "./Button";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin text-brand-400" aria-hidden /> {label}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`relative overflow-hidden rounded-md bg-white/[0.05] ${className}`}><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>;
}

export function EmptyState({ title, description, icon, action }: { title: string; description?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="rounded-full bg-white/5 p-3 text-slate-400">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && <p className="max-w-md text-xs leading-relaxed text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

/** Shown when a metric / endpoint / artifact is not available. Never replaced by made-up numbers. */
export function UnavailableState({ title = "Unavailable", reason }: { title?: string; reason: ReactNode }) {
  return <EmptyState icon={<DatabaseZap className="h-5 w-5" />} title={title} description={reason} />;
}

export function ErrorState({ error, onRetry, compact }: { error: ApiError | Error; onRetry?: () => void; compact?: boolean }) {
  const api = error as ApiError;
  const offline = api.kind === "network" || api.kind === "timeout";
  const unavailable = api.kind === "unavailable";
  const title = offline ? "Backend not reachable" : unavailable ? "Not available in the backend" : api.kind === "not_found" ? "Not found" : api.kind === "validation" ? "Invalid request" : "Request failed";
  return (
    <div role="alert" className={`flex flex-col items-center gap-2 text-center ${compact ? "py-5" : "py-10"}`}>
      <div className={`rounded-full p-3 ${unavailable ? "bg-warn-400/10 text-warn-300" : "bg-fraud-400/10 text-fraud-300"}`}>{offline ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</div>
      <p className="text-sm font-medium text-slate-100">{title}</p>
      <p className="max-w-lg text-xs leading-relaxed text-slate-400">{error.message}</p>
      {api.requestId && <p className="num text-[10px] text-slate-500">request id {api.requestId}</p>}
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "fraud" | "safe"; title?: string; children: ReactNode }) {
  const t = { info: "border-brand-400/25 bg-brand-400/[0.06] text-brand-200", warn: "border-warn-400/25 bg-warn-400/[0.06] text-warn-200", fraud: "border-fraud-400/25 bg-fraud-400/[0.06] text-fraud-200", safe: "border-safe-400/25 bg-safe-400/[0.06] text-safe-200" }[tone];
  return (
    <div role="note" className={`rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${t}`}>
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      <div className="text-slate-300">{children}</div>
    </div>
  );
}
