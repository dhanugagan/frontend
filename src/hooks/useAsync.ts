import { DependencyList, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "@/services/client";

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/** Runs `fn` (with an AbortSignal) whenever `deps` change; aborts the previous request. Errors are surfaced, never swallowed or replaced by mock data. */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: DependencyList, enabled = true): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({ data: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef
      .current(ctl.signal)
      .then((data) => !ctl.signal.aborted && setState({ data, error: null, loading: false }))
      .catch((e) => {
        const err = toApiError(e);
        if (err.kind !== "cancelled" && !ctl.signal.aborted) setState((s) => ({ data: s.data, error: err, loading: false }));
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
