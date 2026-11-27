import type { LabelName, Severity } from "@/types/api";

export const COLORS = {
  licit: "#4ade80",
  illicit: "#fb7185",
  unknown: "#64748b",
  brand: "#22d3ee",
  model: "#a78bfa",
  warn: "#fbbf24",
  grid: "rgba(148,163,184,0.12)",
  axis: "#94a3b8",
};

export const LABEL_COLOR: Record<LabelName, string> = { licit: COLORS.licit, illicit: COLORS.illicit, unknown: COLORS.unknown };
export const SEVERITY_COLOR: Record<Severity, string> = { critical: "#f43f5e", high: "#fb923c", medium: "#fbbf24" };

/** Distinct, colour-blind-friendly series colours for model comparisons. */
export const SERIES = ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#4ade80", "#38bdf8", "#f472b6", "#fb923c"];
