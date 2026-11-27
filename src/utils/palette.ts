import type { LabelName, Severity } from "@/types/api";

export const COLORS = {
  licit: "#84cc16", // Lime Green
  illicit: "#fb7185", // Coral Rose (distinct semantic fraud alert state)
  unknown: "#71717a", // Neutral Zinc Steel
  brand: "#a3e635", // Primary Lime Green
  model: "#ffffff", // Pure White
  warn: "#f59e0b",
  cloud: "#ffffff", // Pure White
  silver: "#b4b8c2", // Crisp Silver
  grid: "rgba(255,255,255,0.09)",
  axis: "#b4b8c2",
};

export const LABEL_COLOR: Record<LabelName, string> = {
  licit: COLORS.licit,
  illicit: COLORS.illicit,
  unknown: COLORS.unknown,
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#f43f5e",
  high: "#fb923c",
  medium: "#f59e0b",
};

/** High-contrast chart series harmonized with Lime Green and Pure White. */
export const SERIES = ["#a3e635", "#ffffff", "#84cc16", "#fb7185", "#f59e0b", "#d9f99d", "#b4b8c2", "#65a30d"];
