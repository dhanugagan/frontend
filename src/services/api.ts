/** Centralised API layer. Every function maps 1:1 to a route of the backend (backend/app/api/routes/*). */
import type {
  Alert, AlertPage, AlertQuery, AlertSource, CompatibilityReport, CsvPredictionResponse, DashboardModels, DashboardOverview, EvalSplit, FeatureResponse, GraphNodeInfo, GraphStats,
  HealthResponse, ModelStatus, NeighborPage, Neighborhood, NeighborhoodQuery, Page, PerformanceResponse, StoredPrediction, SystemInfo, TransactionDetail, TransactionPredictionResponse,
  TransactionQuery, TransactionRow,
} from "@/types/api";
import { get, post } from "./client";

const V1 = "/api/v1";
type Params = Record<string, string | number | boolean | undefined>;
const clean = (p: object = {}): Params => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== "")) as Params;

export const api = {
  // system
  health: (signal?: AbortSignal) => get<HealthResponse>("/api/health", { signal }),
  systemInfo: (signal?: AbortSignal) => get<SystemInfo>("/api/system/info", { signal }),

  // dashboard
  overview: (signal?: AbortSignal) => get<DashboardOverview>(`${V1}/dashboard/overview`, { signal }),
  dashboardModels: (signal?: AbortSignal) => get<DashboardModels>(`${V1}/dashboard/models`, { signal }),

  // transactions
  transactions: (q: TransactionQuery = {}, signal?: AbortSignal) => get<Page<TransactionRow>>(`${V1}/transactions`, { params: clean(q), signal }),
  transaction: (txId: number, signal?: AbortSignal) => get<TransactionDetail>(`${V1}/transactions/${txId}`, { signal }),
  features: (txId: number, group: "all" | "local" | "aggregate" | "augmented" = "all", source: "raw" | "scaled" = "raw", signal?: AbortSignal) =>
    get<FeatureResponse>(`${V1}/transactions/${txId}/features`, { params: { group, source }, signal }),

  // predictions
  predictionModels: (signal?: AbortSignal) => get<ModelStatus[]>(`${V1}/predictions/models`, { signal, timeout: 300000 }),
  predictTransaction: (txId: number, models?: string[], signal?: AbortSignal) =>
    post<TransactionPredictionResponse>(`${V1}/predictions/transaction`, { tx_id: txId, models: models && models.length ? models : null }, { signal, timeout: 300000 }),
  storedPredictions: (txId: number, signal?: AbortSignal) => get<{ tx_id: number; source: string; predictions: StoredPrediction[] }>(`${V1}/predictions/stored/${txId}`, { signal }),
  predictCsv: (file: File, model: string, onProgress?: (fraction: number) => void, signal?: AbortSignal) => {
    const form = new FormData();
    form.append("model", model);
    form.append("file", file, file.name);
    return post<CsvPredictionResponse>(`${V1}/predictions/csv`, form, {
      signal,
      timeout: 600000,
      onUploadProgress: (e) => onProgress?.(e.total ? e.loaded / e.total : 0),
    });
  },

  // graph
  graphStats: (signal?: AbortSignal) => get<GraphStats>(`${V1}/graph/stats`, { signal }),
  graphNode: (txId: number, signal?: AbortSignal) => get<GraphNodeInfo>(`${V1}/graph/nodes/${txId}`, { signal }),
  graphNeighbors: (txId: number, direction: "in" | "out" | "both" = "both", page = 1, pageSize = 25, signal?: AbortSignal) =>
    get<NeighborPage>(`${V1}/graph/nodes/${txId}/neighbors`, { params: { direction, page, page_size: pageSize }, signal }),
  neighborhood: (txId: number, q: NeighborhoodQuery = {}, signal?: AbortSignal) =>
    get<Neighborhood>(`${V1}/graph/neighborhood/${txId}`, { params: clean(q), signal, timeout: 300000 }),

  // models
  performance: (opts: { family?: string; split?: EvalSplit; experiment?: string; selected_only?: boolean; include_all_validation_runs?: boolean } = {}, signal?: AbortSignal) =>
    get<PerformanceResponse>(`${V1}/models/performance`, { params: clean(opts), signal }),
  compatibility: (refresh = false, signal?: AbortSignal) => get<CompatibilityReport>(`${V1}/models/compatibility`, { params: refresh ? { refresh: true } : undefined, signal, timeout: 300000 }),

  // alerts
  alerts: (q: AlertQuery = {}, signal?: AbortSignal) => get<AlertPage>(`${V1}/alerts`, { params: clean(q), signal }),
  alertSources: (signal?: AbortSignal) => get<{ sources: AlertSource[]; session_alerts: string }>(`${V1}/alerts/sources`, { signal }),
  alert: (alertId: string, signal?: AbortSignal) => get<Alert>(`${V1}/alerts/${alertId}`, { signal }),
};
