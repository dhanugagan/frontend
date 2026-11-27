// @vitest-environment node
/**
 * Integration tests against a RUNNING backend (not mocks). Set INTEGRATION_API_URL, e.g.
 *   $env:INTEGRATION_API_URL="http://localhost:8000"; npm run test:integration
 * Without it the suite is skipped. These exercise the same service layer the UI uses.
 */
import { describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import { ApiError } from "@/services/client";

const URL_ = process.env.INTEGRATION_API_URL;
const d = URL_ ? describe : describe.skip;

d("frontend API layer against a live backend", () => {
  vi.setConfig({ testTimeout: 240000 });
  it("health + system info", async () => {
    const h = await api.health();
    expect(h.status).toBe("ok");
    const s = await api.systemInfo();
    expect(s.database).toMatch(/^none/);
    expect(s.limits.max_upload_bytes).toBeGreaterThan(0);
  });
  it("dashboard overview is internally consistent", async () => {
    const o = await api.overview();
    expect(o.transactions.licit! + o.transactions.illicit! + o.transactions.unknown!).toBe(o.transactions.total);
    expect(o.graph.nodes).toBe(o.transactions.total);
    const m = await api.dashboardModels();
    expect(m.evaluated_families.map((f) => f.family)).toEqual(expect.arrayContaining(["gcn", "graphsage", "gat", "control", "random_forest", "xgboost"]));
  });
  it("transactions list, detail, features, 404", async () => {
    const list = await api.transactions({ label: "illicit", page_size: 5 });
    expect(list.items.length).toBeGreaterThan(0);
    const id = list.items[0].tx_id;
    const det = await api.transaction(id);
    expect(det.tx_id).toBe(id);
    const f = await api.features(id, "local", "raw");
    expect(f.values).toHaveLength(93);
    await expect(api.transaction(1)).rejects.toMatchObject({ kind: "not_found" });
    await expect(api.transactions({ time_step: 99 })).rejects.toBeInstanceOf(ApiError);
  });
  it("graph: stats, neighbours, bounded neighbourhood", async () => {
    const st = await api.graphStats();
    const id = (await api.transactions({ page_size: 1, sort_by: "tx_id" })).items[0].tx_id;
    const h = await api.neighborhood(id, { depth: 2, max_nodes: 10, max_edges: 10 });
    expect(h.node_count).toBeLessThanOrEqual(10);
    expect(h.edge_count).toBeLessThanOrEqual(10);
    expect(st.nodes).toBeGreaterThan(h.node_count);
    const n = await api.graphNeighbors(id, "both", 1, 5);
    expect(n.items.length).toBeLessThanOrEqual(5);
    await expect(api.neighborhood(id, { depth: 9 })).rejects.toMatchObject({ kind: "validation" });
  });
  it("performance + alerts", async () => {
    const p = await api.performance();
    expect(Array.isArray(p.records)).toBe(true);
    const a = await api.alerts({ page_size: 5, sort_by: "probability", order: "desc" });
    expect(a.items.length).toBeLessThanOrEqual(5);
    for (const x of a.items) expect(x.probability).toBeGreaterThanOrEqual(x.threshold ?? 0);
  });
  it("prediction models, live prediction and CSV upload follow the compatibility gate", async () => {
    const models = await api.predictionModels();
    const ok = models.filter((m) => m.status === "available");
    if (ok.length === 0) {
      await expect(api.predictTransaction(1)).rejects.toBeInstanceOf(ApiError);
      return;
    }
    const id = (await api.transactions({ split: "test", label: "illicit", page_size: 1 })).items[0].tx_id;
    const r = await api.predictTransaction(id, [ok[0].model_id]);
    expect(r.predictions[0].threshold).toBe(ok[0].threshold);
    const csv = new File([`txId\n${id}\n99999999\n`], "b.csv", { type: "text/csv" });
    let progress = -1;
    const res = await api.predictCsv(csv, ok[0].model_id, (f) => (progress = f));
    expect(res.summary.rows_predicted).toBe(1);
    expect(res.rejected_total).toBe(1);
    expect(progress).toBeGreaterThanOrEqual(0);
    await expect(api.predictCsv(new File(["a,b\n1,2"], "bad.csv", { type: "text/csv" }), ok[0].model_id)).rejects.toMatchObject({ kind: "validation" });
    await expect(api.predictCsv(new File(["x"], "bad.txt", { type: "text/plain" }), ok[0].model_id)).rejects.toMatchObject({ kind: "unsupported_media" });
  });
});
