import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Network, Search, Sparkles } from "lucide-react";
import { Badge, GroundTruthBadge, PredictionBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardHeader, PageHeader } from "@/components/Card";
import { Column, DataTable, Pagination } from "@/components/DataTable";
import { DetailPanel, KV } from "@/components/DetailPanel";
import { Field, SearchInput, SegmentedControl, Select } from "@/components/Inputs";
import { ScrollReveal, TiltCard } from "@/components/MotionPrimitives";
import { EmptyState, ErrorState, Notice, Skeleton, Spinner } from "@/components/States";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/services/api";
import { ApiError, toApiError } from "@/services/client";
import type { LabelName, SplitName, TransactionDetail, TransactionPredictionResponse, TransactionRow } from "@/types/api";
import { fmtInt, fmtMetric, fmtProb } from "@/utils/format";

const PAGE_SIZE = 25;

export default function ExplorerPage() {
  const { refreshKey } = useApp();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const selected = params.get("tx") && /^\d+$/.test(params.get("tx")!) ? Number(params.get("tx")) : null;

  const [search, setSearch] = useState(selected ? String(selected) : "");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [split, setSplit] = useState<"" | SplitName>("");
  const [label, setLabel] = useState<"" | LabelName>("");
  const [timeStep, setTimeStep] = useState("");
  const [sort, setSort] = useState<{ key: "tx_id" | "time_step"; order: "asc" | "desc" }>({ key: "time_step", order: "desc" });
  const [page, setPage] = useState(1);

  const stepNum = timeStep && /^\d+$/.test(timeStep) && +timeStep >= 1 && +timeStep <= 49 ? +timeStep : undefined;
  const stepInvalid = timeStep !== "" && stepNum === undefined;

  useEffect(() => setPage(1), [split, label, stepNum, sort]);
  useEffect(() => { if (selected) setSearch(String(selected)); }, [selected]);

  const list = useAsync(
    (s) => api.transactions({ split: split || undefined, label: label || undefined, time_step: stepNum, sort_by: sort.key, order: sort.order, page, page_size: PAGE_SIZE }, s),
    [split, label, stepNum, sort, page, refreshKey],
    !stepInvalid,
  );

  const select = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id === null) next.delete("tx"); else next.set("tx", String(id));
    setParams(next, { replace: false });
  };

  const submitSearch = () => {
    const v = search.trim();
    if (!/^\d+$/.test(v)) return setSearchError("Transaction IDs are whole numbers.");
    setSearchError(null);
    select(Number(v));
  };

  const columns: Column<TransactionRow>[] = useMemo(() => [
    { key: "tx", header: "Transaction ID", sortKey: "tx_id", render: (r) => <span className="num font-medium text-cloud">{r.tx_id}</span> },
    { key: "ts", header: "Time step", sortKey: "time_step", render: (r) => <span className="num text-cloud/90">{r.time_step}</span> },
    { key: "split", header: "Split", render: (r) => <Badge>{r.split === "val" ? "validation" : r.split}</Badge> },
    { key: "gt", header: "Ground truth", render: (r) => <GroundTruthBadge label={r.ground_truth_label} /> },
    { key: "in", header: "In", align: "right", render: (r) => <span className="num text-cloud/85">{fmtInt(r.in_degree)}</span> },
    { key: "out", header: "Out", align: "right", render: (r) => <span className="num text-cloud/85">{fmtInt(r.out_degree)}</span> },
  ], []);

  const onSort = (key: string) => setSort((s) => (s.key === key ? { key: s.key, order: s.order === "asc" ? "desc" : "asc" } : { key: key as "tx_id" | "time_step", order: "asc" }));
  const reset = () => { setSplit(""); setLabel(""); setTimeStep(""); setSort({ key: "time_step", order: "desc" }); };

  return (
    <>
      <PageHeader title="Transaction Explorer" description="Search the real dataset, filter by split, label and time step, and inspect a transaction's features, relationships and stored model outputs." />
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Transaction ID">
            <div className="flex gap-2">
              <SearchInput label="Transaction ID" value={search} onChange={(v) => { setSearch(v); setSearchError(null); }} onSubmit={submitSearch} placeholder="e.g. 230425980" inputMode="numeric" className="min-w-0 flex-1 sm:w-56 sm:flex-none" />
              <Button variant="primary" onClick={submitSearch} icon={<Search className="h-4 w-4" />}>Find</Button>
            </div>
            {searchError && <span role="alert" className="mt-1 block text-[11px] text-fraud-300">{searchError}</span>}
          </Field>
          <Field label="Split"><Select label="Split" value={split} onChange={(v) => setSplit(v as "" | SplitName)} options={[{ value: "", label: "All splits" }, { value: "train", label: "Train (1–29)" }, { value: "val", label: "Validation (30–34)" }, { value: "test", label: "Test (35–49)" }]} /></Field>
          <Field label="Ground-truth label"><Select label="Ground-truth label" value={label} onChange={(v) => setLabel(v as "" | LabelName)} options={[{ value: "", label: "All labels" }, { value: "illicit", label: "Illicit" }, { value: "licit", label: "Licit" }, { value: "unknown", label: "Unknown" }]} /></Field>
          <Field label="Time step" hint={stepInvalid ? "Enter 1–49" : undefined}>
            <input aria-label="Time step" inputMode="numeric" className={`input w-24 ${stepInvalid ? "border-fraud-400/60" : ""}`} value={timeStep} onChange={(e) => setTimeStep(e.target.value)} placeholder="1–49" />
          </Field>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
        <p className="mt-3 text-[11px] text-silver">Prediction-based filtering is not offered: the backend&apos;s transaction list filters dataset fields only. Stored and live predictions appear in the detail panel.</p>
      </Card>

      <ScrollReveal delayMs={30}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card pad={false}>
            <div className="p-4 pb-2 sm:p-5 sm:pb-2"><CardHeader title="Transactions" subtitle={list.data ? `${fmtInt(list.data.total)} match the filters` : undefined} /></div>
            {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !list.data ? <Spinner /> : list.data.items.length === 0 ? <EmptyState title="No transactions match" description="Loosen the filters to see more rows." action={<Button size="sm" onClick={reset}>Reset filters</Button>} /> : (
              <>
                <DataTable caption="Dataset transactions" columns={columns} rows={list.data.items} rowKey={(r) => r.tx_id} selectedKey={selected} onRowClick={(r) => select(r.tx_id)} sort={sort} onSort={onSort} loading={list.loading} />
                <Pagination page={list.data.page} pages={list.data.pages} total={list.data.total} pageSize={PAGE_SIZE} onPage={setPage} noun="transactions" />
              </>
            )}
          </Card>

          <div className="xl:sticky xl:top-20 xl:self-start">
            {selected === null ? (
              <Card><EmptyState icon={<Search className="h-5 w-5" />} title="Select a transaction" description="Click a row or search an ID to see its features, relationships and predictions." /></Card>
            ) : (
              <TransactionPanel txId={selected} onClose={() => select(null)} onOpenGraph={() => nav(`/graph?tx=${selected}`)} onOpenTx={(id) => select(id)} />
            )}
          </div>
        </div>
      </ScrollReveal>
    </>
  );
}

function TransactionPanel({ txId, onClose, onOpenGraph, onOpenTx }: { txId: number; onClose: () => void; onOpenGraph: () => void; onOpenTx: (id: number) => void }) {
  const { refreshKey } = useApp();
  const detail = useAsync<TransactionDetail>((s) => api.transaction(txId, s), [txId, refreshKey]);
  const [tab, setTab] = useState<"overview" | "features" | "predictions">("overview");
  useEffect(() => setTab("overview"), [txId]);

  return (
    <DetailPanel className="max-h-[calc(100vh-7rem)]" title={<span className="num">Transaction {txId}</span>} subtitle={detail.data ? <>Time step {detail.data.time_step} · {detail.data.split === "val" ? "validation" : detail.data.split}</> : undefined} onClose={onClose}>
      {detail.error ? <ErrorState error={detail.error} compact onRetry={detail.reload} /> : !detail.data ? <div className="space-y-2"><Skeleton className="h-6" /><Skeleton className="h-24" /></div> : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl label="Detail section" value={tab} onChange={setTab} options={[{ value: "overview", label: "Overview" }, { value: "features", label: "Features" }, { value: "predictions", label: "Predictions" }]} />
            <Button size="sm" onClick={onOpenGraph} icon={<Network className="h-3.5 w-3.5 text-brand-500" />}>Graph</Button>
          </div>
          {tab === "overview" && <OverviewTab d={detail.data} onOpenTx={onOpenTx} />}
          {tab === "features" && <FeaturesTab txId={txId} />}
          {tab === "predictions" && <PredictionsTab d={detail.data} />}
        </>
      )}
    </DetailPanel>
  );
}

function OverviewTab({ d, onOpenTx }: { d: TransactionDetail; onOpenTx: (id: number) => void }) {
  const rel = d.relationships;
  const Related = ({ title, items }: { title: string; items: { tx_id: number; ground_truth_label: LabelName }[] }) => (
    <div>
      <p className="eyebrow mb-1.5">{title} ({items.length}{rel.neighbor_list_truncated ? "+" : ""})</p>
      {items.length === 0 ? <p className="text-xs text-silver">None</p> : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((n) => (
            <li key={n.tx_id}>
              <button
                onClick={() => onOpenTx(n.tx_id)}
                className="num rounded-lg border border-white/10 bg-ink-950/75 px-2.5 py-1 text-[11px] text-cloud transition hover:border-brand-500/50 hover:bg-ink-750/60"
                title={`ground truth: ${n.ground_truth_label}`}
              >
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${n.ground_truth_label === "illicit" ? "bg-fraud-400" : n.ground_truth_label === "licit" ? "bg-model-500" : "bg-steel"}`} />
                {n.tx_id}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <div className="space-y-4">
      <dl>
        <KV label="Ground-truth label"><GroundTruthBadge label={d.ground_truth_label} /></KV>
        <KV label="Time step" mono>{d.time_step}</KV>
        <KV label="Split">{d.split === "val" ? "validation" : d.split}</KV>
        <KV label="In-degree (parents)" mono>{fmtInt(rel.in_degree)}</KV>
        <KV label="Out-degree (children)" mono>{fmtInt(rel.out_degree)}</KV>
      </dl>
      <p className="text-[11px] leading-relaxed text-silver">{rel.direction_semantics}</p>
      <Related title="Parents" items={rel.parents} />
      <Related title="Children" items={rel.children} />
      {rel.neighbor_list_truncated && <p className="text-[11px] text-silver">Lists are capped by the backend; use the Graph Explorer for the full neighbourhood.</p>}
    </div>
  );
}

function FeaturesTab({ txId }: { txId: number }) {
  const [group, setGroup] = useState<"local" | "aggregate" | "augmented" | "all">("augmented");
  const [source, setSource] = useState<"raw" | "scaled">("raw");
  const [q, setQ] = useState("");
  const f = useAsync((s) => api.features(txId, group, source, s), [txId, group, source]);
  const rows = useMemo(() => (f.data ? f.data.feature_names.map((n, i) => ({ n, v: f.data!.values[i] })).filter((r) => r.n.toLowerCase().includes(q.toLowerCase())) : []), [f.data, q]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select label="Feature group" value={group} onChange={(v) => setGroup(v as typeof group)} options={[{ value: "augmented", label: "Augmented (17)" }, { value: "local", label: "Local (93)" }, { value: "aggregate", label: "Aggregate (72)" }, { value: "all", label: "All (182)" }]} />
        <SegmentedControl label="Value source" value={source} onChange={setSource} options={[{ value: "raw", label: "Raw" }, { value: "scaled", label: "Scaled" }]} />
      </div>
      <SearchInput label="Filter features" value={q} onChange={setQ} placeholder="Filter by name…" />
      {f.error ? <ErrorState error={f.error} compact onRetry={f.reload} /> : !f.data ? <Spinner /> : (
        <>
          <p className="text-[11px] text-silver">{f.data.source_description}</p>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-ink-950/75">
            <table className="w-full text-xs"><caption className="sr-only">Feature values</caption><tbody className="divide-y divide-white/[0.05]">
              {rows.map((r) => <tr key={r.n} className="transition hover:bg-brand-500/[0.04]"><th scope="row" className="px-3 py-1.5 text-left font-normal text-cloud/85">{r.n}</th><td className="num px-3 py-1.5 text-right text-cloud">{r.v === null ? <span className="text-silver" title="missing in the dataset">null</span> : Number.isInteger(r.v) ? r.v : r.v.toPrecision(6)}</td></tr>)}
              {rows.length === 0 && <tr><td className="px-3 py-4 text-center text-silver">No feature matches.</td></tr>}
            </tbody></table>
          </div>
        </>
      )}
    </div>
  );
}

function PredictionsTab({ d }: { d: TransactionDetail }) {
  const [live, setLive] = useState<TransactionPredictionResponse | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setLive(null); setErr(null); }, [d.tx_id]);
  const run = async () => {
    setBusy(true); setErr(null);
    try { setLive(await api.predictTransaction(d.tx_id)); } catch (e) { setErr(toApiError(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow mb-1.5">Stored model outputs</p>
        {d.stored_predictions.length === 0 ? <p className="text-xs text-silver">No stored experiment output covers this transaction (stored outputs exist only for labeled validation/test nodes).</p> : (
          <ul className="space-y-2">
            {d.stored_predictions.map((p) => (
              <li key={p.source_id} className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-3 text-xs transition hover:border-brand-500/35">
                <div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-cloud" title={p.model_id}>{p.model_family}</span><PredictionBadge label={p.predicted_label} /></div>
                <p className="mt-1 text-silver">{p.experiment} · {p.split} · p = <span className="num text-cloud">{fmtProb(p.probability)}</span> · threshold <span className="num">{fmtMetric(p.threshold, 4)}</span></p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between"><p className="eyebrow">Live inference</p><Button size="sm" variant="primary" loading={busy} onClick={run} icon={<Sparkles className="h-3.5 w-3.5" />}>Run prediction</Button></div>
        {busy && <p className="text-xs text-silver">The first live prediction runs the backend&apos;s compatibility verification and can take a while.</p>}
        {err && <ErrorState error={err} compact />}
        {live && (
          <div className="space-y-2">
            <Notice tone="info" title="Evaluation context">{live.evaluation_context}</Notice>
            {live.predictions.map((p) => (
              <TiltCard key={p.model_id} intensity={3} className="p-3 text-xs">
                <div className="flex items-center justify-between gap-2"><span className="font-medium text-cloud">{p.model_title}</span><PredictionBadge label={p.predicted_label} /></div>
                <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${p.predicted_label === "illicit" ? "bg-fraud-400" : "bg-brand-500"}`} style={{ width: `${p.probability * 100}%` }} />
                </div>
                <p className="mt-1.5 text-silver">probability <span className="num text-cloud">{fmtProb(p.probability)}</span> · threshold <span className="num">{fmtMetric(p.threshold, 4)}</span> · {p.used_graph_context ? "graph context used" : "features only"}</p>
              </TiltCard>
            ))}
            <p className="text-[11px] text-silver">Dataset ground truth: <GroundTruthBadge label={live.ground_truth_label} />. {live.graph.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
