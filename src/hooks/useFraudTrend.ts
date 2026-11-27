import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { toApiError, ApiError } from "@/services/client";

export interface TrendPoint {
  step: number;
  illicit: number;
  share: number;
}

/**
 * The backend has no per-time-step label endpoint, so the trend is assembled from real queries:
 * GET /transactions?label=illicit&time_step=t&page_size=1 (the `total` field) for t = 1..49, combined with nodes_per_time_step from /graph/stats.
 */
export function useFraudTrend(nodesPerStep: Record<string, number> | undefined, enabled: boolean, refreshKey: number) {
  const [state, setState] = useState<{ data: TrendPoint[] | null; error: ApiError | null; progress: number }>({ data: null, error: null, progress: 0 });
  useEffect(() => {
    if (!enabled || !nodesPerStep) return;
    const ctl = new AbortController();
    let done = 0;
    const steps = Array.from({ length: 49 }, (_, i) => i + 1);
    const out: TrendPoint[] = [];
    (async () => {
      try {
        let next = 0;
        const worker = async () => {
          while (next < steps.length && !ctl.signal.aborted) {
            const t = steps[next++];
            const page = await api.transactions({ label: "illicit", time_step: t, page_size: 1 }, ctl.signal);
            const total = nodesPerStep[String(t)] ?? 0;
            out.push({ step: t, illicit: page.total, share: total ? (100 * page.total) / total : 0 });
            done += 1;
            if (!ctl.signal.aborted) setState((s) => ({ ...s, progress: done / steps.length }));
          }
        };
        await Promise.all(Array.from({ length: 6 }, worker));
        if (!ctl.signal.aborted) setState({ data: out.sort((a, b) => a.step - b.step), error: null, progress: 1 });
      } catch (e) {
        const err = toApiError(e);
        if (err.kind !== "cancelled" && !ctl.signal.aborted) setState({ data: null, error: err, progress: 0 });
      }
    })();
    return () => ctl.abort();
  }, [nodesPerStep, enabled, refreshKey]);
  return state;
}
