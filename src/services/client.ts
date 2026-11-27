import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "@/types/api";

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "http://localhost:8000";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000;

export type ApiErrorKind = "network" | "timeout" | "unavailable" | "not_found" | "validation" | "too_large" | "unsupported_media" | "server" | "cancelled" | "http";

/** Normalised error: every failed request becomes one of these. Failed requests are never replaced by mock data. */
export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number | null;
  code: string | null;
  details: unknown;
  requestId: string | null;
  constructor(kind: ApiErrorKind, message: string, opts: { status?: number | null; code?: string | null; details?: unknown; requestId?: string | null } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = opts.status ?? null;
    this.code = opts.code ?? null;
    this.details = opts.details;
    this.requestId = opts.requestId ?? null;
  }
}

const STATUS_KIND: Record<number, ApiErrorKind> = { 404: "not_found", 413: "too_large", 415: "unsupported_media", 422: "validation", 503: "unavailable" };

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isCancel(err)) return new ApiError("cancelled", "Request cancelled");
  const e = err as AxiosError<{ error?: ApiErrorBody }>;
  if (axios.isAxiosError(e)) {
    if (e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") return new ApiError("timeout", "The backend did not respond in time.");
    if (!e.response) return new ApiError("network", `Cannot reach the backend at ${API_BASE_URL}. Is it running?`);
    const status = e.response.status;
    const body = e.response.data?.error;
    const kind = STATUS_KIND[status] ?? (status >= 500 ? "server" : "http");
    return new ApiError(kind, body?.message ?? `Request failed with status ${status}`, { status, code: body?.code, details: body?.details, requestId: body?.request_id });
  }
  return new ApiError("http", err instanceof Error ? err.message : "Unexpected error");
}

export const http: AxiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: TIMEOUT, headers: { Accept: "application/json" } });

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    return (await http.get<T>(url, config)).data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    return (await http.post<T>(url, body, config)).data;
  } catch (e) {
    throw toApiError(e);
  }
}
