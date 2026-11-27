import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Expand, Maximize2, Network, Search } from "lucide-react";
import { Badge, GroundTruthBadge, PredictionBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, PageHeader } from "@/components/Card";
import { DetailPanel, KV } from "@/components/DetailPanel";
import { GraphFilters, GraphView, LayoutName } from "@/components/GraphView";
import { Field, SearchInput, Select, Toggle } from "@/components/Inputs";
import { TiltCard } from "@/components/MotionPrimitives";
import { EmptyState, ErrorState, Notice, Spinner } from "@/components/States";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/services/api";
import { ApiError, toApiError } from "@/services/client";
import type { CyEdge, CyNode, Neighborhood } from "@/types/api";
import { fmtInt, fmtProb } from "@/utils/format";

const MAX_LOADED_NODES = 800;

export default function GraphPage() {
  const { models, modelsLoading, verifyModels, refreshKey } = useApp();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const stats = useAsync((s) => api.graphStats(s), [refreshKey]);
  const limits = useAsync((s) => api.systemInfo(s), []);

  const [txInput, setTxInput] = useState(params.get("tx") ?? "");
  const [inputErr, setInputErr] = useState<string | null>(null);
  const [depth, setDepth] = useState("1");
  const [direction, setDirection] = useState<"in" | "out" | "both">("both");
  const [maxNodes, setMaxNodes] = useState("100");
  const [overlay, setOverlay] = useState("");
  const [layout, setLayout] = useState<LayoutName>("cose");
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [filters, setFilters] = useState<GraphFilters>({ licit: true, illicit: true, unknown: true, predictedIllicitOnly: false });

  const [nodes, setNodes] = useState<Map<string, CyNode>>(new Map());
  const [edges, setEdges] = useState<Map<string, CyEdge>>(new Map());
  const [centerId, setCenterId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ source: string; target: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [find, setFind] = useState("");

  const maxNodesLimit = limits.data?.limits.graph_max_nodes ?? 500;
  const maxDepthLimit = limits.data?.limits.graph_max_depth ?? 3;
  const overlayOptions = (models ?? []).filter((m) => m.status === "available");

  const fetchHood = useCallback(async (id: number, d: number, dir: typeof direction, mn: number, ov: string) => {
    return api.neighborhood(id, { depth: d, direction: dir, max_nodes: Math.min(mn, maxNodesLimit), overlay: ov || undefined });
  }, [maxNodesLimit]);

  const describe = (h: Neighborhood): string[] => {
    const out: string[] = [];
    if (h.truncated.nodes) out.push(`Node limit reached (${h.limits.max_nodes}); the neighbourhood is larger than shown.`);
    if (h.truncated.edges) out.push(`Edge limit reached (${h.limits.max_edges}); some edges are not drawn.`);
    if (h.overlay_note) out.push(h.overlay_note);
    return out;
  };

  const load = useCallback(async (idStr: string, reset = true) => {
    if (!/^\d+$/.test(idStr.trim())) return setInputErr("Transaction IDs are whole numbers.");
    setInputErr(null); setBusy(true); setError(null);
    try {
      const h = await fetchHood(Number(idStr.trim()), Math.min(Number(depth), maxDepthLimit), direction, Number(maxNodes) || 100, overlay);
      const nm = new Map<string, CyNode>(reset ? [] : nodes);
      const em = new Map<string, CyEdge>(reset ? [] : edges);
      h.elements.nodes.forEach((n) => nm.set(n.data.id, nm.has(n.data.id) && !reset ? { ...nm.get(n.data.id)!, data: { ...nm.get(n.data.id)!.data, ...n.data, is_center: nm.get(n.data.id)!.data.is_center }, classes: nm.get(n.data.id)!.classes } : n));
      h.elements.edges.forEach((e) => em.set(e.data.id, e));
      if (nm.size > MAX_LOADED_NODES) return setNotices([`Loading would exceed ${MAX_LOADED_NODES} nodes in the viewer; clear the graph or lower the limits.`]);
      setNodes(nm); setEdges(em);
      if (reset) { setCenterId(String(h.center)); setSelectedId(String(h.center)); setLayoutVersion((v) => v + 1); const n = new URLSearchParams(params); n.set("tx", String(h.center)); setParams(n, { replace: true }); }
      else setLayoutVersion((v) => v + 1);
      setNotices(describe(h));
    } catch (e) { setError(toApiError(e)); } finally { setBusy(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth, direction, maxNodes, overlay, nodes, edges, fetchHood, maxDepthLimit, params]);

  useEffect(() => { const t = params.get("tx"); if (t && /^\d+$/.test(t) && nodes.size === 0) void load(t, true); /* eslint-disable-next-line */ }, []);

  // re-fetch the centre when the overlay model changes so predictions appear on nodes
  useEffect(() => { if (centerId) void load(centerId, true); /* eslint-disable-next-line */ }, [overlay]);

  const expand = useCallback((id: string) => {
    if (nodes.size >= MAX_LOADED_NODES) return setNotices([`The viewer is capped at ${MAX_LOADED_NODES} nodes. Clear the graph to explore further.`]);
    const keepDepth = depth; void keepDepth;
    setBusy(true); setError(null);
    fetchHood(Number(id), 1, direction, Math.min(60, Number(maxNodes) || 60), overlay).then((h) => {
      const nm = new Map(nodes); const em = new Map(edges);
      h.elements.nodes.forEach((n) => { if (!nm.has(n.data.id)) nm.set(n.data.id, { ...n, data: { ...n.data, is_center: false }, classes: n.classes.replace(" center", "") }); });
      h.elements.edges.forEach((e) => em.set(e.data.id, e));
      setNodes(nm); setEdges(em); setLayoutVersion((v) => v + 1); setNotices(describe(h));
    }).catch((e) => setError(toApiError(e))).finally(() => setBusy(false));
  }, [nodes, edges, direction, maxNodes, overlay, fetchHood, depth]);

  const nodeList = useMemo(() => [...nodes.values()], [nodes]);
  const edgeList = useMemo(() => [...edges.values()], [edges]);
  const highlight = useMemo(() => new Set(find.trim() ? nodeList.filter((n) => n.data.id.includes(find.trim())).map((n) => n.data.id) : []), [find, nodeList]);
  const selected = selectedId ? nodes.get(selectedId)?.data ?? null : null;
  const counts = useMemo(() => ({ illicit: nodeList.filter((n) => n.data.ground_truth_label === "illicit").length, licit: nodeList.filter((n) => n.data.ground_truth_label === "licit").length, unknown: nodeList.filter((n) => n.data.ground_truth_label === "unknown").length, predIll: nodeList.filter((n) => n.data.predicted_label === "illicit").length }), [nodeList]);
  const clear = () => { setNodes(new Map()); setEdges(new Map()); setCenterId(null); setSelectedId(null); setNotices([]); const n = new URLSearchParams(params); n.delete("tx"); setParams(n, { replace: true }); };

  return (
    <>
      <PageHeader title="Graph Explorer" description="Explore bounded neighbourhoods of the transaction graph. Edges point from a transaction to the transactions that spend its outputs (txId1 → txId2). The whole graph is never loaded." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[{ l: "Graph nodes", v: stats.data?.nodes }, { l: "Graph edges", v: stats.data?.edges }, { l: "Median in / out degree", v: stats.data ? `${stats.data.in_degree.median} / ${stats.data.out_degree.median}` : undefined }, { l: "Max in / out degree", v: stats.data ? `${stats.data.in_degree.max} / ${stats.data.out_degree.max}` : undefined }].map((x) => (
          <TiltCard key={x.l} intensity={4} className="px-4 py-3.5"><p className="eyebrow">{x.l}</p><p className="num mt-1 text-lg font-bold text-cloud">{stats.error ? "—" : typeof x.v === "number" ? fmtInt(x.v) : x.v ?? "…"}</p></TiltCard>
        ))}
      </div>
      {stats.error && <div className="mb-4"><ErrorState error={stats.error} compact onRetry={stats.reload} /></div>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Transaction ID"><div className="flex gap-2"><SearchInput label="Transaction ID" value={txInput} onChange={(v) => { setTxInput(v); setInputErr(null); }} onSubmit={() => load(txInput, true)} placeholder="e.g. 230425980" inputMode="numeric" className="min-w-0 flex-1 sm:w-52 sm:flex-none" /><Button variant="primary" loading={busy} onClick={() => load(txInput, true)} icon={<Network className="h-4 w-4" />}>Load</Button></div>{inputErr && <span role="alert" className="mt-1 block text-[11px] text-fraud-300">{inputErr}</span>}</Field>
          <Field label="Depth"><Select label="Depth" value={depth} onChange={setDepth} options={Array.from({ length: maxDepthLimit }, (_, i) => ({ value: String(i + 1), label: `${i + 1} hop${i ? "s" : ""}` }))} /></Field>
          <Field label="Direction"><Select label="Direction" value={direction} onChange={(v) => setDirection(v as typeof direction)} options={[{ value: "both", label: "Parents + children" }, { value: "in", label: "Parents (incoming)" }, { value: "out", label: "Children (outgoing)" }]} /></Field>
          <Field label="Max nodes" hint={`≤ ${maxNodesLimit}`}><Select label="Max nodes" value={maxNodes} onChange={setMaxNodes} options={[25, 50, 100, 200, 300, 500].filter((n) => n <= maxNodesLimit).map((n) => ({ value: String(n), label: String(n) }))} /></Field>
          <Field label="Prediction overlay">
            {models ? <Select label="Prediction overlay" value={overlay} onChange={setOverlay} options={[{ value: "", label: "None (dataset labels)" }, ...overlayOptions.map((m) => ({ value: m.model_id, label: m.title }))]} /> : <Button loading={modelsLoading} onClick={() => verifyModels()}>Load overlay models</Button>}
          </Field>
          <Field label="Layout"><Select label="Layout" value={layout} onChange={(v) => { setLayout(v as LayoutName); setLayoutVersion((x) => x + 1); }} options={[{ value: "cose", label: "Force-directed" }, { value: "breadthfirst", label: "Hierarchical (flow)" }, { value: "concentric", label: "Concentric" }, { value: "circle", label: "Circle" }]} /></Field>
        </div>
      </Card>

      {overlay === "" && models && overlayOptions.length === 0 && <div className="mb-4"><Notice tone="warn">No model is verified for inference, so the overlay is unavailable. Nodes show dataset labels only.</Notice></div>}
      {error && <Card className="mb-4"><ErrorState error={error} onRetry={() => centerId && load(centerId, true)} compact /></Card>}
      {notices.map((n) => <div key={n} className="mb-3"><Notice tone="warn">{n}</Notice></div>)}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card pad={false} className="relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Toggle label={`Licit ${counts.licit}`} checked={filters.licit} onChange={(v) => setFilters((f) => ({ ...f, licit: v }))} />
              <Toggle label={`Illicit ${counts.illicit}`} checked={filters.illicit} onChange={(v) => setFilters((f) => ({ ...f, illicit: v }))} />
              <Toggle label={`Unknown ${counts.unknown}`} checked={filters.unknown} onChange={(v) => setFilters((f) => ({ ...f, unknown: v }))} />
              {overlay && <Toggle label={`Predicted illicit only (${counts.predIll})`} checked={filters.predictedIllicitOnly} onChange={(v) => setFilters((f) => ({ ...f, predictedIllicitOnly: v }))} />}
            </div>
            <div className="flex flex-wrap items-center gap-2"><SearchInput label="Highlight a loaded transaction" value={find} onChange={setFind} placeholder="Highlight ID…" className="w-full sm:w-40" /><Button size="sm" variant="ghost" onClick={() => setLayoutVersion((v) => v + 1)} icon={<Maximize2 className="h-3.5 w-3.5" />}>Re-layout</Button>{nodes.size > 0 && <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>}</div>
          </div>
          <div className="relative h-[420px] sm:h-[520px] lg:h-[560px] bg-ink-950/60">
            {nodes.size === 0 ? (busy ? <Spinner label="Loading neighbourhood…" /> : <EmptyState icon={<Network className="h-5 w-5" />} title="No graph loaded" description="Enter a transaction ID above. Double-click a node to expand its neighbourhood; click for details." />) : (
              <GraphView nodes={nodeList} edges={edgeList} selectedId={selectedId} centerId={centerId} highlightIds={highlight} filters={filters} layout={layout} layoutVersion={layoutVersion} onSelect={(id) => { setSelectedId(id); setSelectedEdge(null); }} onExpand={expand} onSelectEdge={setSelectedEdge} />
            )}
            {busy && nodes.size > 0 && <div className="absolute right-3 top-3"><Badge tone="brand">updating…</Badge></div>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/[0.07] px-4 py-2 text-[11px] text-silver">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-fraud-400" /> illicit (ground truth)</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-model-500" /> licit</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-steel" /> unknown</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border-2 border-brand-200" /> predicted illicit (overlay)</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border-2 border-brand-500" /> centre</span>
            <span>edge: transaction flow →</span>
            <span className="ml-auto num text-cloud">{nodes.size} nodes · {edges.size} edges loaded</span>
          </div>
        </Card>

        <div>
          {selectedEdge ? (
            <DetailPanel title="Edge" subtitle="Transaction flow" onClose={() => setSelectedEdge(null)}><dl><KV label="From (txId1)" mono>{selectedEdge.source}</KV><KV label="To (txId2)" mono>{selectedEdge.target}</KV><KV label="Relationship">funds flow from → to</KV></dl></DetailPanel>
          ) : selected ? (
            <NodePanel key={selected.id} node={selected} onExpand={() => expand(selected.id)} onClose={() => setSelectedId(null)} onOpenExplorer={() => nav(`/transactions?tx=${selected.tx_id}`)} onFocus={(id) => { setTxInput(String(id)); void load(String(id), true); }} />
          ) : (
            <Card><EmptyState icon={<Search className="h-5 w-5" />} title="Select a node" description="Click a node for its details, parents and children. Double-click to expand." /></Card>
          )}
        </div>
      </div>
    </>
  );
}

function NodePanel({ node, onExpand, onClose, onOpenExplorer, onFocus }: { node: CyNode["data"]; onExpand: () => void; onClose: () => void; onOpenExplorer: () => void; onFocus: (id: number) => void }) {
  const [page, setPage] = useState(1);
  const nb = useAsync((s) => api.graphNeighbors(node.tx_id, "both", page, 10, s), [node.tx_id, page]);
  return (
    <DetailPanel title={<span className="num">{node.tx_id}</span>} subtitle={`Time step ${node.time_step} · ${node.split === "val" ? "validation" : node.split}`} onClose={onClose}>
      <dl>
        <KV label="Ground truth"><GroundTruthBadge label={node.ground_truth_label} /></KV>
        {node.predicted_label && <KV label="Predicted"><PredictionBadge label={node.predicted_label} /></KV>}
        {node.probability !== undefined && <KV label="Probability" mono>{fmtProb(node.probability)}</KV>}
        {node.overlay_model && <KV label="Overlay model">{node.overlay_model}</KV>}
        <KV label="In-degree" mono>{node.in_degree}</KV>
        <KV label="Out-degree" mono>{node.out_degree}</KV>
        <KV label="Depth from centre" mono>{node.depth}</KV>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={onExpand} icon={<Expand className="h-3.5 w-3.5" />}>Expand</Button><Button size="sm" onClick={() => onFocus(node.tx_id)}>Centre here</Button><Button size="sm" variant="ghost" onClick={onOpenExplorer}>Explorer</Button></div>
      <p className="eyebrow mb-2 mt-5">Neighbours {nb.data ? `(${nb.data.total})` : ""}</p>
      {nb.error ? <ErrorState error={nb.error} compact onRetry={nb.reload} /> : !nb.data ? <Spinner /> : (
        <>
          <ul className="space-y-1">{nb.data.items.map((n) => <li key={`${n.relation}-${n.tx_id}`}><button onClick={() => onFocus(n.tx_id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-brand-500/[0.06]"><span className="num text-cloud">{n.tx_id}</span><span className="flex items-center gap-2"><span className="text-silver">{n.relation}</span><GroundTruthBadge label={n.ground_truth_label} /></span></button></li>)}</ul>
          {nb.data.pages > 1 && <div className="mt-2 flex items-center justify-between text-xs text-silver"><Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button><span className="num">{page}/{nb.data.pages}</span><Button size="sm" variant="ghost" disabled={page >= nb.data.pages} onClick={() => setPage(page + 1)}>Next</Button></div>}
        </>
      )}
    </DetailPanel>
  );
}
