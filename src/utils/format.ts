const nf = new Intl.NumberFormat("en-US");

export const fmtInt = (v: number | null | undefined): string => (v === null || v === undefined || Number.isNaN(v) ? "—" : nf.format(v));
export const fmtPct = (v: number | null | undefined, digits = 2): string => (v === null || v === undefined || Number.isNaN(v) ? "—" : `${v.toFixed(digits)}%`);
export const fmtMetric = (v: number | null | undefined, digits = 3): string => (v === null || v === undefined || Number.isNaN(v) ? "—" : v.toFixed(digits));
export const fmtProb = (v: number | null | undefined): string => (v === null || v === undefined || Number.isNaN(v) ? "—" : `${(v * 100).toFixed(2)}%`);

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export const titleCase = (s: string): string => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Histogram of probabilities in [0,1] with equal-width bins. */
export function histogram(values: number[], bins = 10): { bin: string; from: number; to: number; count: number }[] {
  const out = Array.from({ length: bins }, (_, i) => ({ bin: `${(i / bins).toFixed(1)}–${((i + 1) / bins).toFixed(1)}`, from: i / bins, to: (i + 1) / bins, count: 0 }));
  for (const v of values) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor(v * bins)));
    out[i].count += 1;
  }
  return out;
}
