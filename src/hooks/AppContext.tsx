import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";
import { ApiError, toApiError } from "@/services/client";
import type { HealthResponse, ModelStatus } from "@/types/api";

export type Connection = "checking" | "online" | "offline";

interface AppCtx {
  /** Increment to make pages reload their data (top bar refresh). */
  refreshKey: number;
  refresh: () => void;
  health: HealthResponse | null;
  connection: Connection;
  healthError: ApiError | null;
  /** Live-inference model status from GET /predictions/models (runs the backend's compatibility verification once). null until verified. */
  models: ModelStatus[] | null;
  modelsLoading: boolean;
  modelsError: ApiError | null;
  verifyModels: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<ApiError | null>(null);
  const [connection, setConnection] = useState<Connection>("checking");
  const [models, setModels] = useState<ModelStatus[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<ApiError | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const h = await api.health();
        if (alive) {
          setHealth(h);
          setHealthError(null);
          setConnection("online");
        }
      } catch (e) {
        if (alive) {
          setHealthError(toApiError(e));
          setConnection("offline");
        }
      }
    };
    poll();
    const t = setInterval(poll, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshKey]);

  const verifyModels = useCallback(() => {
    if (inflight.current) return inflight.current;
    setModelsLoading(true);
    setModelsError(null);
    inflight.current = api
      .predictionModels()
      .then((m) => setModels(m))
      .catch((e) => setModelsError(toApiError(e)))
      .finally(() => {
        setModelsLoading(false);
        inflight.current = null;
      });
    return inflight.current;
  }, []);

  const value = useMemo<AppCtx>(
    () => ({ refreshKey, refresh: () => setRefreshKey((k) => k + 1), health, connection, healthError, models, modelsLoading, modelsError, verifyModels }),
    [refreshKey, health, connection, healthError, models, modelsLoading, modelsError, verifyModels],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside <AppProvider>");
  return c;
}
