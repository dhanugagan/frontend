import { ReactNode } from "react";
import type { LabelName, Severity } from "@/types/api";

type Tone = "neutral" | "brand" | "model" | "safe" | "fraud" | "warn" | "orange";
const TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.05] text-silver ring-white/10",
  brand: "bg-ink-750/60 text-brand-400 ring-brand-500/35",
  model: "bg-ink-800/80 text-model-300 ring-model-500/35",
  safe: "bg-ink-750/70 text-brand-200 ring-brand-500/35",
  fraud: "bg-fraud-500/15 text-fraud-300 ring-fraud-400/35",
  warn: "bg-warn-500/15 text-warn-300 ring-warn-400/35",
  orange: "bg-orange-400/15 text-orange-300 ring-orange-400/35",
};

export function Badge({ tone = "neutral", children, dot, title }: { tone?: Tone; children: ReactNode; dot?: boolean; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const LABEL_TONE: Record<LabelName, Tone> = { illicit: "fraud", licit: "safe", unknown: "neutral" };

/** Ground-truth label from the dataset (a "GT" prefix keeps it visually distinct from model predictions). */
export function GroundTruthBadge({ label }: { label: LabelName | null | undefined }) {
  if (!label) return <span className="text-silver">—</span>;
  return (
    <Badge tone={LABEL_TONE[label]} title="Ground-truth label from the dataset (not a model prediction)">
      <span className="font-mono font-semibold opacity-75">GT</span> {label}
    </Badge>
  );
}

/** Model output (an "AI" prefix + Secure Teal ring marks it as predicted). */
export function PredictionBadge({ label }: { label: "illicit" | "licit" | LabelName | null | undefined }) {
  if (!label || label === "unknown") return <span className="text-silver">—</span>;
  return (
    <span
      title="Predicted by a model at its own threshold"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
        label === "illicit" ? "bg-fraud-500/15 text-fraud-300 ring-model-500/50" : "bg-ink-750/70 text-brand-200 ring-model-500/50"
      }`}
    >
      <span className="font-mono font-semibold text-model-300">AI</span> {label}
    </span>
  );
}

const SEV: Record<Severity, { tone: Tone; label: string }> = {
  critical: { tone: "fraud", label: "Critical" },
  high: { tone: "orange", label: "High" },
  medium: { tone: "warn", label: "Medium" },
};
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
