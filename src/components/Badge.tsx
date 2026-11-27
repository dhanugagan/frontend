import { ReactNode } from "react";
import type { LabelName, Severity } from "@/types/api";

type Tone = "neutral" | "brand" | "model" | "safe" | "fraud" | "warn" | "orange";
const TONES: Record<Tone, string> = {
  neutral: "bg-white/5 text-slate-300 ring-white/10",
  brand: "bg-brand-400/10 text-brand-300 ring-brand-400/25",
  model: "bg-model-400/10 text-model-300 ring-model-400/25",
  safe: "bg-safe-400/10 text-safe-300 ring-safe-400/25",
  fraud: "bg-fraud-400/10 text-fraud-300 ring-fraud-400/30",
  warn: "bg-warn-400/10 text-warn-300 ring-warn-400/25",
  orange: "bg-orange-400/10 text-orange-300 ring-orange-400/25",
};

export function Badge({ tone = "neutral", children, dot, title }: { tone?: Tone; children: ReactNode; dot?: boolean; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const LABEL_TONE: Record<LabelName, Tone> = { illicit: "fraud", licit: "safe", unknown: "neutral" };

/** Ground-truth label from the dataset (a "GT" prefix keeps it visually distinct from model predictions). */
export function GroundTruthBadge({ label }: { label: LabelName | null | undefined }) {
  if (!label) return <span className="text-slate-500">—</span>;
  return (
    <Badge tone={LABEL_TONE[label]} title="Ground-truth label from the dataset (not a model prediction)">
      <span className="font-semibold opacity-70">GT</span> {label}
    </Badge>
  );
}

/** Model output (a "AI" prefix + violet ring marks it as predicted). */
export function PredictionBadge({ label }: { label: "illicit" | "licit" | LabelName | null | undefined }) {
  if (!label || label === "unknown") return <span className="text-slate-500">—</span>;
  return (
    <span title="Predicted by a model at its own threshold" className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${label === "illicit" ? "bg-fraud-400/10 text-fraud-300 ring-model-400/50" : "bg-safe-400/10 text-safe-300 ring-model-400/50"}`}>
      <span className="font-semibold text-model-300">AI</span> {label}
    </span>
  );
}

const SEV: Record<Severity, { tone: Tone; label: string }> = { critical: { tone: "fraud", label: "Critical" }, high: { tone: "orange", label: "High" }, medium: { tone: "warn", label: "Medium" } };
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge tone={SEV[severity].tone} dot>
      {SEV[severity].label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: "available" | "unavailable" | "unverified" }) {
  if (status === "available") return <Badge tone="safe" dot>Operational</Badge>;
  if (status === "unavailable") return <Badge tone="fraud" dot>Unavailable</Badge>;
  return <Badge tone="warn" dot>Not verified</Badge>;
}
