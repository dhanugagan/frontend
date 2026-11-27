/** Page tests with the API layer MOCKED (these test rendering and state handling, not the real backend; see tests/integration for that). */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/hooks/AppContext";
import { ApiError } from "@/services/client";

vi.mock("@/components/GraphView", () => ({ GraphView: () => <div data-testid="graph-mock" /> }));
vi.mock("@/services/api", () => ({ api: new Proxy({}, { get: (_t, k) => (globalThis as unknown as { __api: Record<string, unknown> }).__api[k as string] }) }));

const g = globalThis as unknown as { __api: Record<string, ReturnType<typeof vi.fn>> };
const alertPage = (items: unknown[]) => ({ items, total: items.length, page: 1, page_size: 25, pages: 1, severity_counts: { critical: 1, high: 0, medium: 0 }, sources_used: ["s"], storage_note: "No database: derived on demand" });
const alert = { alert_id: "a:1", origin: "stored_prediction_output", tx_id: 123, severity: "critical", probability: 0.97, threshold: 0.5, model_id: "graphsage", model_family: "graphsage", time_step: 40, timestamp: null, evaluation_context: "held-out", ground_truth_label: "illicit" };

function wrap(ui: React.ReactElement, path = "/") {
  return render(<MemoryRouter initialEntries={[path]}><AppProvider>{ui}</AppProvider></MemoryRouter>);
}

beforeEach(() => {
  g.__api = {
    health: vi.fn().mockResolvedValue({ status: "ok", service: "x", version: "1", uptime_seconds: 1, dataset_available: true, ml_runtime_available: true, models_verified: false, detail: {} }),
    alerts: vi.fn().mockResolvedValue(alertPage([alert])),
    alertSources: vi.fn().mockResolvedValue({ sources: [], session_alerts: "in memory only" }),
    predictionModels: vi.fn().mockResolvedValue([]),
    systemInfo: vi.fn().mockResolvedValue({ limits: { max_upload_bytes: 1048576, max_csv_rows: 100 } }),
  };
});

describe("AlertsPage", () => {
  it("lists real alert rows, severity counts and opens details", async () => {
    const { default: AlertsPage } = await import("@/pages/AlertsPage");
    wrap(<AlertsPage />);
    expect(await screen.findByText("123")).toBeInTheDocument();
    expect(screen.getByText("97.00%")).toBeInTheDocument();
    await userEvent.click(screen.getByText("123"));
    expect(await screen.findByText(/Alert · tx/)).toBeInTheDocument();
    expect(screen.getByText("not recorded")).toBeInTheDocument();       // no timestamp is invented
  });
  it("shows an error state (not fake rows) when the backend fails", async () => {
    g.__api.alerts = vi.fn().mockRejectedValue(new ApiError("network", "Cannot reach the backend"));
    const { default: AlertsPage } = await import("@/pages/AlertsPage");
    wrap(<AlertsPage />);
    expect(await screen.findByText("Backend not reachable")).toBeInTheDocument();
    expect(screen.queryByText("123")).not.toBeInTheDocument();
  });
  it("shows the empty state", async () => {
    g.__api.alerts = vi.fn().mockResolvedValue(alertPage([]));
    const { default: AlertsPage } = await import("@/pages/AlertsPage");
    wrap(<AlertsPage />);
    expect(await screen.findByText("No alerts")).toBeInTheDocument();
  });
});

describe("PredictionPage", () => {
  it("explains unavailable models with the backend's exact reasons and blocks prediction", async () => {
    g.__api.predictionModels = vi.fn().mockResolvedValue([{ model_id: "gcn", family: "gcn", title: "GCN", kind: "gnn", feature_set: "local", edge_mode: "directed", threshold: null, threshold_rule: null, thresholds: {}, seeds: [], status: "unavailable", reasons: ["dataset unavailable: tx_id.npy sha256 differs"], requires_graph_context: true, reproduction_of_stored_scores: "not_checked", checks: [], config: {} }]);
    const { default: PredictionPage } = await import("@/pages/PredictionPage");
    wrap(<PredictionPage />);
    expect(await screen.findByText("GCN")).toBeInTheDocument();
    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(screen.getByText(/No model is available for inference/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /run prediction/i })).not.toBeInTheDocument();
  });
  it("runs an existing-transaction prediction and keeps ground truth separate", async () => {
    g.__api.predictionModels = vi.fn().mockResolvedValue([{ model_id: "graphsage", family: "graphsage", title: "GraphSAGE", kind: "gnn", feature_set: "local", edge_mode: "directed", threshold: 0.5, threshold_rule: "r", thresholds: {}, seeds: ["42"], status: "available", reasons: [], requires_graph_context: true, reproduction_of_stored_scores: "reproduced", checks: [], config: {} }]);
    g.__api.predictTransaction = vi.fn().mockResolvedValue({ tx_id: 5, time_step: 40, ground_truth_label: "licit", evaluation_context: "held_out_window: test", graph: { in_degree: 1, out_degree: 2, note: null }, predictions: [{ model_id: "graphsage", model_family: "graphsage", model_title: "GraphSAGE", feature_set: "local", edge_mode: "directed", probability: 0.8, threshold: 0.5, threshold_rule: "r", predicted_label: "illicit", per_seed_probability: null, used_graph_context: true, reproduction_of_stored_scores: "reproduced" }], note: "n" });
    const { default: PredictionPage } = await import("@/pages/PredictionPage");
    wrap(<PredictionPage />);
    await screen.findAllByText("GraphSAGE");
    await userEvent.type(screen.getByLabelText("Transaction ID"), "5");
    await userEvent.click(screen.getByRole("button", { name: /run prediction/i }));
    await waitFor(() => expect(g.__api.predictTransaction).toHaveBeenCalledWith(5, []));
    expect(await screen.findByText("80.00%", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("GT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI").length).toBeGreaterThan(0);
  });
  it("validates the transaction id client-side", async () => {
    g.__api.predictionModels = vi.fn().mockResolvedValue([{ model_id: "gcn", family: "gcn", title: "GCN", kind: "gnn", feature_set: "local", edge_mode: "directed", threshold: 0.5, threshold_rule: null, thresholds: {}, seeds: ["42"], status: "available", reasons: [], requires_graph_context: true, reproduction_of_stored_scores: "reproduced", checks: [], config: {} }]);
    const { default: PredictionPage } = await import("@/pages/PredictionPage");
    wrap(<PredictionPage />);
    await screen.findAllByText("GCN");
    await userEvent.type(screen.getByLabelText("Transaction ID"), "abc");
    await userEvent.click(screen.getByRole("button", { name: /run prediction/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("numeric");
    expect(g.__api.predictTransaction).toBeUndefined();
  });
});

describe("GraphPage", () => {
  it("renders controls and an empty state without loading the whole graph", async () => {
    g.__api.graphStats = vi.fn().mockResolvedValue({ nodes: 10, edges: 9, in_degree: { median: 1, max: 3 }, out_degree: { median: 1, max: 4 } });
    const { default: GraphPage } = await import("@/pages/GraphPage");
    wrap(<GraphPage />);
    expect(await screen.findByText("No graph loaded")).toBeInTheDocument();
    expect(g.__api.alerts).not.toHaveBeenCalled();
  });
  it("loads a neighbourhood with bounded limits and shows truncation", async () => {
    g.__api.graphStats = vi.fn().mockResolvedValue({ nodes: 10, edges: 9, in_degree: { median: 1, max: 3 }, out_degree: { median: 1, max: 4 } });
    g.__api.neighborhood = vi.fn().mockResolvedValue({ center: 7, depth: 1, direction: "both", limits: { max_nodes: 100, max_edges: 300 }, node_count: 1, edge_count: 0, truncated: { nodes: true, edges: false }, elements: { nodes: [{ data: { id: "7", label: "7", tx_id: 7, time_step: 1, split: "train", ground_truth_label: "licit", in_degree: 0, out_degree: 0, depth: 0, is_center: true }, classes: "licit center" }], edges: [] }, note: "" });
    g.__api.graphNeighbors = vi.fn().mockResolvedValue({ tx_id: 7, direction: "both", items: [], total: 0, page: 1, page_size: 10, pages: 0 });
    const { default: GraphPage } = await import("@/pages/GraphPage");
    wrap(<GraphPage />);
    await userEvent.type(screen.getByLabelText("Transaction ID"), "7");
    await userEvent.click(screen.getByRole("button", { name: /^load$/i }));
    await waitFor(() => expect(g.__api.neighborhood).toHaveBeenCalled());
    expect(g.__api.neighborhood.mock.calls[0][1]).toMatchObject({ depth: 1, direction: "both", max_nodes: 100 });
    expect(await screen.findByText(/Node limit reached/)).toBeInTheDocument();
    expect(screen.getByTestId("graph-mock")).toBeInTheDocument();
  });
});
