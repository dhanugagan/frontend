/** Client-side helpers for the prediction page. Nothing here fabricates data: CSV exports contain exactly what the backend returned. */
import type { CsvResultRow } from "@/types/api";

const CANONICAL_ID = ["txId", "txid", "tx_id"];

export interface CsvPrecheck {
  ok: boolean;
  errors: string[];
  warnings: string[];
  header: string[];
  columns: number;
  hasId: boolean;
}

export function precheckCsvHeader(text: string): CsvPrecheck {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const header = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!firstLine.trim()) errors.push("The file has no header row.");
  const idCols = header.filter((h) => CANONICAL_ID.includes(h));
  if (header.length && idCols.length !== 1) errors.push(`Exactly one transaction id column (txId) is required; found ${idCols.length}.`);
  if (new Set(header).size !== header.length) errors.push("Duplicate column names in the header.");
  if (/\u0000/.test(text.slice(0, 4096))) errors.push("The file looks binary, not text CSV.");
  if (header.length === 1 && idCols.length === 1) warnings.push("Only txId detected — suitable for graph models (GCN, GraphSAGE, GAT, Control).");
  return { ok: errors.length === 0, errors, warnings, header, columns: header.length, hasId: idCols.length === 1 };
}

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function resultsToCsv(rows: CsvResultRow[], modelId: string, threshold: number): string {
  const head = ["row", "tx_id", "time_step", "probability", "predicted_label", "threshold", "model_id", "ground_truth_label", "in_dataset"];
  const body = rows.map((r) => [r.row, r.tx_id, r.time_step ?? "", r.probability, r.predicted_label, threshold, modelId, r.ground_truth_label ?? "", r.in_dataset].map(esc).join(","));
  return [head.join(","), ...body].join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv"): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
