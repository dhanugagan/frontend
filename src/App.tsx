import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { EmptyState, Spinner } from "@/components/States";

const Overview = lazy(() => import("@/pages/OverviewPage"));
const Explorer = lazy(() => import("@/pages/ExplorerPage"));
const Prediction = lazy(() => import("@/pages/PredictionPage"));
const Graph = lazy(() => import("@/pages/GraphPage"));
const Performance = lazy(() => import("@/pages/PerformancePage"));
const Alerts = lazy(() => import("@/pages/AlertsPage"));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="transactions" element={<Explorer />} />
          <Route path="prediction" element={<Prediction />} />
          <Route path="graph" element={<Graph />} />
          <Route path="models" element={<Performance />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="*" element={<EmptyState title="Page not found" description="Use the sidebar to navigate." />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
