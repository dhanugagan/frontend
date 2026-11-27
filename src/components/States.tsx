import { ReactNode } from "react";
import { AlertTriangle, DatabaseZap, Inbox, Loader2, WifiOff } from "lucide-react";
import type { ApiError } from "@/services/client";
import { Button } from "./Button";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2.5 py-10 text-sm text-cloud/85">
      <Loader2 className="h-4 w-4 animate-spin text-brand-500" aria-hidden /> {label}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink-800/45 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-brand-500/[0.08] to-transparent" />
    </div>
  );
}

export function EmptyState({ title, description, icon, action }: { title: string; description?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-10 text-center">
      <div className="rounded-xl border border-white/10 bg-ink-800/70 p-3 text-brand-500">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <p className="font-display text-sm font-semibold text-cloud">{title}</p>
      {description && <p className="max-w-md text-xs leading-relaxed text-silver">{description}</p>}
      {action}
    </div>
  );
}

/** Shown when a metric / endpoint / artifact is not available. Never replaced by made-up numbers. */
export function UnavailableState({ title = "Unavailable", reason }: { title?: string; reason: ReactNode }) {
  return <EmptyState icon={<DatabaseZap className="h-5 w-5 text-warn-300" />} title={title} description={reason} />;
}

export function ErrorState({ error, onRetry, compact }: { error: ApiError | Error; onRetry?: () => void; compact?: boolean }) {
  const api = error as ApiError;
  const offline = api.kind === "network" || api.kind === "timeout";
  const unavailable = api.kind === "unavailable";
  const title = offline ? "Backend not reachable" : unavailable ? "Not available in the backend" : api.kind === "not_found" ? "Not found" : api.kind === "validation" ? "Invalid request" : "Request failed";
  return (
    <div role="alert" className={`flex flex-col items-center gap-2.5 text-center ${compact ? "py-5" : "py-10"}`}>
      <div className={`rounded-xl border p-3 ${unavailable ? "border-warn-400/25 bg-warn-400/10 text-warn-300" : "border-fraud-400/25 bg-fraud-400/10 text-fraud-300"}`}>
        {offline ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
      </div>
      <p className="font-display text-sm font-semibold text-cloud">{title}</p>
      <p className="max-w-lg text-xs leading-relaxed text-silver">{error.message}</p>
      {api.requestId && <p className="num text-[10px] text-silver">request id {api.requestId}</p>}
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "fraud" | "safe"; title?: string; children: ReactNode }) {
  const t = {
    info: "border-model-500/30 bg-ink-800/75 text-brand-200",
    warn: "border-warn-400/25 bg-warn-400/[0.06] text-warn-200",
    fraud: "border-fraud-400/25 bg-fraud-400/[0.06] text-fraud-200",
    safe: "border-brand-500/30 bg-ink-750/45 text-brand-200",
  }[tone];
  return (
    <div role="note" className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${t}`}>
      {title && <p className="mb-0.5 font-display font-semibold">{title}</p>}
      <div className="text-cloud/85">{children}</div>
    </div>
  );
}
