import { useEffect, useMemo, useState } from "react";
import { Download, FileWarning, Play, ShieldAlert } from "lucide-react";
import { Badge, GroundTruthBadge, PredictionBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardHeader, PageHeader } from "@/components/Card";
import { DonutChart, HistogramChart } from "@/components/charts";
import { Column, DataTable, Pagination } from "@/components/DataTable";
import { Field, SearchInput, SegmentedControl, Select } from "@/components/Inputs";
import { MetricCard } from "@/components/MetricCard";
import { ErrorState, Notice, Spinner } from "@/components/States";
import { UploadArea } from "@/components/UploadArea";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/services/api";
import { ApiError, toApiError } from "@/services/client";
import type { CsvPredictionResponse, CsvResultRow, ModelStatus, TransactionPredictionResponse } from "@/types/api";
import { downloadText, precheckCsvHeader, resultsToCsv } from "@/utils/csv";
import { fmtBytes, fmtInt, fmtMetric, fmtPct, fmtProb, histogram } from "@/utils/format";
import { COLORS } from "@/utils/palette";

export default function PredictionPage() {
  const { models, modelsLoading, modelsError, verifyModels } = useApp();
  const [mode, setMode] = useState<"transaction" | "csv">("transaction");
  useEffect(() => { if (!models && !modelsLoading && !modelsError) void verifyModels(); }, [models, modelsLoading, modelsError, verifyModels]);
  const available = (models ?? []).filter((m) => m.status === "available");
  const unavailable = (models ?? []).filter((m) => m.status !== "available");

  return (
    <>
      <PageHeader title="Fraud Prediction" description="Run verified models on existing transactions or score a CSV batch. Graph models need real graph relationships, so arbitrary manual transactions are not supported." />
      <Notice tone="warn" title="Indicators, not proof">Predictions are model outputs at each model's own validated threshold. They support investigation and do not establish that a transaction is fraudulent.</Notice>

      <Card className="mt-4">
        <CardHeader title="Models available for inference" subtitle="A model is usable only after every backend compatibility check passes" actions={<Button size="sm" loading={modelsLoading} onClick={() => verifyModels()}>Re-check</Button>} />
        {modelsLoading && !models ? <Spinner label="Verifying checkpoints, scalers and dataset hashes… the first run can take a while." /> : modelsError ? <ErrorState error={modelsError} onRetry={() => verifyModels()} compact /> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {available.map((m) => <ModelCard key={m.model_id} m={m} />)}
            {unavailable.map((m) => <ModelCard key={m.model_id} m={m} />)}
            {models && models.length === 0 && <p className="text-sm text-slate-400 md:col-span-3">The backend lists no models. The final package was not found or is incomplete — see <a className="text-brand-300 underline" href="/models">Model Performance</a>.</p>}
          </div>
        )}
      </Card>

      <div className="mt-4">
        <SegmentedControl label="Prediction mode" value={mode} onChange={setMode} options={[{ value: "transaction", label: "Existing transaction" }, { value: "csv", label: "CSV batch" }]} />
      </div>
      <div className="mt-4">
        {mode === "transaction" ? <TransactionMode available={available} /> : <CsvMode available={available} />}
      </div>
    </>
  );
}

function ModelCard({ m }: { m: ModelStatus }) {
  const ok = m.status === "available";
  return (
    <div className={`rounded-lg border p-3 ${ok ? "border-safe-400/20 bg-safe-400/[0.04]" : "border-fraud-400/20 bg-fraud-400/[0.04]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{m.title}</p><p className="text-[11px] text-slate-400">{m.kind === "gnn" ? "graph model · needs graph context" : "tabular baseline"} · {m.feature_set ?? "?"} features</p></div>
        <Badge tone={ok ? "safe" : "fraud"} dot>{ok ? "available" : "unavailable"}</Badge>
      </div>
      {ok ? <p className="mt-2 text-xs text-slate-400">threshold <span className="num text-slate-200">{fmtMetric(m.threshold, 4)}</span> · {m.seeds.length} seed{m.seeds.length === 1 ? "" : "s"} · stored-score reproduction: {m.reproduction_of_stored_scores.replace(/_/g, " ")}</p> : (
        <details className="mt-2 text-xs text-slate-300"><summary className="cursor-pointer text-fraud-300">Why unavailable</summary><ul className="mt-1 list-disc space-y-1 pl-4 text-slate-400">{m.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul></details>
      )}
    </div>
  );
}

function NoModels() {
  return <Notice tone="warn" title="No model is available for inference">The backend could not verify any model. The cards above show the exact reason per model. Stored predictions in the Transaction Explorer and Alerts pages remain available.</Notice>;
}

function TransactionMode({ available }: { available: ModelStatus[] }) {
  const [id, setId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [res, setRes] = useState<TransactionPredictionResponse | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const [idErr, setIdErr] = useState<string | null>(null);

  const toggle = (m: string) => setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  const run = async () => {
    if (!/^\d+$/.test(id.trim())) return setIdErr("Enter a numeric transaction ID.");
    setIdErr(null); setBusy(true); setErr(null); setRes(null);
    try { setRes(await api.predictTransaction(Number(id.trim()), picked)); } catch (e) { setErr(toApiError(e)); } finally { setBusy(false); }
  };
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Existing transaction" subtitle="The transaction and its graph neighbourhood must exist in the dataset" />
        {available.length === 0 ? <NoModels /> : (
          <div className="space-y-4">
            <Field label="Transaction ID"><SearchInput label="Transaction ID" value={id} onChange={(v) => { setId(v); setIdErr(null); }} onSubmit={run} inputMode="numeric" placeholder="e.g. 230425980" /></Field>
            {idErr && <p role="alert" className="text-[11px] text-fraud-300">{idErr}</p>}
            <fieldset><legend className="eyebrow mb-1.5">Models (none selected = all available)</legend>
              <div className="space-y-1.5">{available.map((m) => <label key={m.model_id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-200"><input type="checkbox" className="accent-cyan-400" checked={picked.includes(m.model_id)} onChange={() => toggle(m.model_id)} /> {m.title}</label>)}</div>
            </fieldset>
            <Button variant="primary" className="w-full" loading={busy} onClick={run} icon={<Play className="h-4 w-4" />}>Run prediction</Button>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Result" />
        {busy ? <Spinner label="Scoring…" /> : err ? <ErrorState error={err} onRetry={run} /> : !res ? <p className="py-10 text-center text-sm text-slate-400">Results appear here.</p> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm"><span className="num text-lg font-semibold text-white">{res.tx_id}</span><span className="text-slate-400">time step {res.time_step}</span><span className="text-xs text-slate-500">dataset ground truth</span><GroundTruthBadge label={res.ground_truth_label} /></div>
            <Notice tone="info" title="Evaluation context">{res.evaluation_context}</Notice>
            <div className="grid gap-3 md:grid-cols-2">
              {res.predictions.map((p) => (
                <div key={p.model_id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-slate-100">{p.model_title}</p><p className="text-[11px] text-slate-500">{p.used_graph_context ? "graph context used" : "features only"}</p></div><PredictionBadge label={p.predicted_label} /></div>
                  <div className="relative mt-3 h-2 rounded-full bg-white/10" aria-label={`probability ${fmtProb(p.probability)} against threshold ${fmtMetric(p.threshold, 3)}`}>
                    <div className={`h-full rounded-full ${p.predicted_label === "illicit" ? "bg-fraud-400" : "bg-safe-400"}`} style={{ width: `${p.probability * 100}%` }} />
                    <div className="absolute -top-1 h-4 w-0.5 bg-white/80" style={{ left: `${p.threshold * 100}%` }} title={`threshold ${fmtMetric(p.threshold, 4)}`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">probability <span className="num text-slate-100">{fmtProb(p.probability)}</span> · threshold <span className="num">{fmtMetric(p.threshold, 4)}</span></p>
                  {p.per_seed_probability && <p className="mt-1 text-[11px] text-slate-500">seeds: {Object.entries(p.per_seed_probability).map(([s, v]) => `${s}: ${fmtProb(v)}`).join(" · ")}</p>}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">In-degree {res.graph.in_degree} · out-degree {res.graph.out_degree}{res.graph.note ? ` — ${res.graph.note}` : ""}</p>
            <p className="text-[11px] text-slate-500">{res.note}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function CsvMode({ available }: { available: ModelStatus[] }) {
  const info = useAsync((s) => api.systemInfo(s), []);
  const maxBytes = info.data?.limits.max_upload_bytes ?? null;
  const maxRows = info.data?.limits.max_csv_rows ?? null;
  const [model, setModel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [res, setRes] = useState<CsvPredictionResponse | null>(null);

  useEffect(() => { if (!model && available.length) setModel(available[0].model_id); }, [available, model]);
  const chosen = available.find((m) => m.model_id === model);

  const onFile = async (f: File | null) => {
    setFile(f); setRes(null); setErr(null); setProgress(null); setNotes([]);
    if (!f) return setProblems([]);
    const errs: string[] = [];
    if (!f.name.toLowerCase().endsWith(".csv")) errs.push("Only .csv files are accepted.");
    if (maxBytes && f.size > maxBytes) errs.push(`The file is ${fmtBytes(f.size)}; the limit is ${fmtBytes(maxBytes)}.`);
    if (f.size === 0) errs.push("The file is empty.");
    if (!errs.length) {
      const pre = precheckCsvHeader(await f.slice(0, 65536).text());
      errs.push(...pre.errors);
      setNotes(pre.warnings);
    }
    setProblems(errs);
  };

  const submit = async () => {
    if (!file || !model) return;
    setBusy(true); setErr(null); setRes(null); setProgress(0);
    try { setRes(await api.predictCsv(file, model, setProgress)); } catch (e) { setErr(toApiError(e)); } finally { setBusy(false); setProgress(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="CSV batch prediction" subtitle={`Validated by the backend (type, size${maxRows ? `, up to ${fmtInt(maxRows)} rows` : ""}, columns); processed in memory, never stored`} />
        {available.length === 0 ? <NoModels /> : (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div>
              <UploadArea file={file} onFile={onFile} maxBytes={maxBytes} disabled={busy} progress={progress} />
              {problems.length > 0 && <div role="alert" className="mt-3 space-y-1 rounded-lg border border-fraud-400/25 bg-fraud-400/[0.06] p-3 text-xs text-fraud-200">{problems.map((p) => <p key={p} className="flex gap-2"><FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p}</p>)}</div>}
              {notes.map((n) => <p key={n} className="mt-2 text-xs text-slate-400">{n}</p>)}
            </div>
            <div className="space-y-3">
              <Field label="Model"><Select label="Model" value={model} onChange={setModel} options={available.map((m) => ({ value: m.model_id, label: m.title }))} /></Field>
              {chosen && (chosen.kind === "gnn" ? (
                <Notice tone="info" title="Graph model">The CSV needs a <code className="num">txId</code> column only. Each ID must exist in the loaded graph — probabilities come from its real neighbourhood. Full 182-column files are accepted only if they equal the stored features.</Notice>
              ) : (
                <Notice tone="info" title="Tabular model">Needs <code className="num">txId</code> plus every {chosen.feature_set} feature column in canonical order (Local_feature_1…, Aggregate_feature_1…, then the 17 augmented columns). Augmented values may be empty.</Notice>
              ))}
              <Button variant="primary" className="w-full" disabled={!file || problems.length > 0 || !model} loading={busy} onClick={submit} icon={<Play className="h-4 w-4" />}>Run batch prediction</Button>
            </div>
          </div>
        )}
      </Card>
      {err && <Card><ErrorState error={err} /> {Array.isArray((err.details as { missing_columns?: string[] } | undefined)?.missing_columns) && <p className="text-center text-xs text-slate-400">Missing columns: {((err.details as { missing_columns: string[] }).missing_columns).slice(0, 8).join(", ")}…</p>}</Card>}
      {res && <CsvResults res={res} />}
    </div>
  );
}

function CsvResults({ res }: { res: CsvPredictionResponse }) {
  const [label, setLabel] = useState<"" | "illicit" | "licit">("");
  const [minP, setMinP] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const min = minP === "" ? 0 : Math.min(1, Math.max(0, Number(minP) || 0));
  const rows = useMemo(() => res.results.filter((r) => (!label || r.predicted_label === label) && r.probability >= min && (!q || String(r.tx_id).includes(q.trim()))).sort((a, b) => b.probability - a.probability), [res, label, min, q]);
  useEffect(() => setPage(1), [label, minP, q]);
  const PAGE = 20;
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  const s = res.summary;
  const hist = useMemo(() => histogram(res.results.map((r) => r.probability), 10), [res]);
  const cols: Column<CsvResultRow>[] = [
    { key: "row", header: "Row", render: (r) => <span className="num text-slate-400">{r.row}</span> },
    { key: "tx", header: "Transaction", render: (r) => <span className="num text-slate-100">{r.tx_id}</span> },
    { key: "p", header: "Probability", render: (r) => <span className="num">{fmtProb(r.probability)}</span> },
    { key: "pred", header: "Predicted", render: (r) => <PredictionBadge label={r.predicted_label} /> },
    { key: "gt", header: "Dataset label", render: (r) => <GroundTruthBadge label={r.ground_truth_label} /> },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Rows submitted" value={fmtInt(s.rows_submitted)} icon={<Download className="h-5 w-5" />} accent="brand" hint={`${fmtInt(s.rows_rejected)} rejected`} />
        <MetricCard label="Predicted licit" value={fmtInt(s.predicted_licit)} icon={<ShieldAlert className="h-5 w-5" />} accent="safe" />
        <MetricCard label="Predicted illicit" value={fmtInt(s.predicted_illicit)} icon={<ShieldAlert className="h-5 w-5" />} accent="fraud" />
        <MetricCard label="Illicit rate" value={fmtPct(s.predicted_illicit_rate === null ? null : s.predicted_illicit_rate * 100)} icon={<ShieldAlert className="h-5 w-5" />} accent="warn" hint={`${res.model.title} · thr ${fmtMetric(res.model.threshold, 3)}`} />
      </div>
      <Notice tone="info" title={res.mode === "graph_lookup" ? "Graph lookup" : "Tabular features"}>{res.note}</Notice>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card><CardHeader title="Predicted classes" /><DonutChart label="Predicted licit versus illicit" data={[{ name: "Licit", value: s.predicted_licit, color: COLORS.licit }, { name: "Illicit", value: s.predicted_illicit, color: COLORS.illicit }]} /></Card>
        <Card className="lg:col-span-2"><CardHeader title="Probability distribution" subtitle="Illicit probability of the scored rows" /><HistogramChart label="Histogram of predicted illicit probabilities" data={hist} /></Card>
      </div>
      <Card pad={false}>
        <div className="p-4 pb-2 sm:p-5 sm:pb-2">
          <CardHeader title="Results" subtitle={`${fmtInt(rows.length)} of ${fmtInt(res.results.length)} rows shown`} actions={<Button size="sm" onClick={() => downloadText(`predictions_${res.model.model_id}.csv`, resultsToCsv(res.results, res.model.model_id, res.model.threshold))} icon={<Download className="h-3.5 w-3.5" />}>Download CSV</Button>} />
          <div className="mb-2 flex flex-wrap items-end gap-3">
            <Field label="Predicted"><Select label="Filter predicted label" value={label} onChange={(v) => setLabel(v as typeof label)} options={[{ value: "", label: "All" }, { value: "illicit", label: "Illicit" }, { value: "licit", label: "Licit" }]} /></Field>
            <Field label="Min. probability (0–1)"><input aria-label="Minimum probability" className="input w-28" inputMode="decimal" value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="0.0" /></Field>
            <Field label="Transaction ID"><SearchInput label="Filter by transaction id" value={q} onChange={setQ} placeholder="contains…" className="w-44" /></Field>
          </div>
        </div>
        <DataTable caption="Batch prediction results" columns={cols} rows={view} rowKey={(r) => r.row} />
        <Pagination page={page} pages={Math.ceil(rows.length / PAGE)} total={rows.length} pageSize={PAGE} onPage={setPage} />
      </Card>
      {res.rejected_total > 0 && (
        <Card>
          <CardHeader title={`Rejected rows (${fmtInt(res.rejected_total)})`} subtitle="These rows were not scored" />
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-300">{res.rejected.map((r, i) => <li key={i}><span className="num text-slate-500">row {r.row}</span> {r.tx_id !== undefined && <span className="num">· {r.tx_id}</span>} — {r.reason}</li>)}</ul>
          {res.rejected_total > res.rejected.length && <p className="mt-2 text-[11px] text-slate-500">Showing the first {res.rejected.length}.</p>}
        </Card>
      )}
      <p className="text-center text-[11px] text-slate-500">{res.disclaimer}</p>
    </>
  );
}
