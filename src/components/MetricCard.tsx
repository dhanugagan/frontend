import { ReactNode } from "react";

type Accent = "brand" | "fraud" | "safe" | "warn" | "model" | "slate";
const ACCENT: Record<Accent, { text: string; bg: string; bar: string }> = {
  brand: { text: "text-brand-300", bg: "bg-brand-400/10", bar: "from-brand-400/60" },
  fraud: { text: "text-fraud-300", bg: "bg-fraud-400/10", bar: "from-fraud-400/60" },
  safe: { text: "text-safe-300", bg: "bg-safe-400/10", bar: "from-safe-400/60" },
  warn: { text: "text-warn-300", bg: "bg-warn-400/10", bar: "from-warn-400/60" },
  model: { text: "text-model-300", bg: "bg-model-400/10", bar: "from-model-400/60" },
  slate: { text: "text-slate-300", bg: "bg-white/5", bar: "from-slate-400/40" },
};

export function MetricCard({ label, value, hint, icon, accent = "brand", unavailable }: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; accent?: Accent; unavailable?: boolean }) {
  const a = ACCENT[accent];
  return (
    <div className="card relative overflow-hidden p-4 animate-fade">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.bar} to-transparent`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className={`mt-2 truncate text-2xl font-semibold tracking-tight num ${unavailable ? "text-slate-500" : "text-white"}`}>{unavailable ? "Unavailable" : value}</p>
          {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`rounded-lg p-2 ${a.bg} ${a.text}`}>{icon}</div>
      </div>
    </div>
  );
}
