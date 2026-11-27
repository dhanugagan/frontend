import { ReactNode } from "react";
import { AnimatedCounter, TiltCard } from "./MotionPrimitives";

type Accent = "brand" | "fraud" | "safe" | "warn" | "model" | "slate";
const ACCENT: Record<Accent, { text: string; bg: string; bar: string; glow: string }> = {
  brand: { text: "text-brand-500", bg: "bg-ink-750/60", bar: "from-brand-500 via-model-500", glow: "rgba(163,230,53,0.13)" },
  fraud: { text: "text-fraud-300", bg: "bg-fraud-500/15", bar: "from-fraud-500 via-fraud-400", glow: "rgba(244,63,94,0.14)" },
  safe: { text: "text-model-400", bg: "bg-ink-750/60", bar: "from-model-500 via-brand-500", glow: "rgba(132,204,22,0.13)" },
  warn: { text: "text-warn-300", bg: "bg-warn-500/15", bar: "from-warn-500 via-warn-400", glow: "rgba(245,158,11,0.12)" },
  model: { text: "text-brand-200", bg: "bg-ink-750/50", bar: "from-model-500 via-brand-200", glow: "rgba(255,255,255,0.08)" },
  slate: { text: "text-silver", bg: "bg-white/5", bar: "from-silver/40", glow: "rgba(255,255,255,0.08)" },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  unavailable,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: Accent;
  unavailable?: boolean;
}) {
  const a = ACCENT[accent];
  return (
    <TiltCard intensity={5} glowColor={a.glow} className="relative overflow-hidden p-4 animate-fade">
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.bar} to-transparent`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold tracking-tight num ${unavailable ? "text-silver" : "text-cloud"}`}>
            {unavailable ? "Unavailable" : typeof value === "string" ? <AnimatedCounter value={value} /> : value}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-silver">{hint}</p>}
        </div>
        <div className={`rounded-xl border border-white/[0.08] p-2.5 ${a.bg} ${a.text}`}>{icon}</div>
      </div>
    </TiltCard>
  );
}
