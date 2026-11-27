import { useEffect, useMemo, useState } from "react";
import { Cpu, ShieldCheck } from "lucide-react";
import { Badge, StatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardHeader, PageHeader } from "@/components/Card";
import { GroupedBars, PrScatter, RadarCompare } from "@/components/charts";
import { Column, DataTable } from "@/components/DataTable";
import { Field, Select } from "@/components/Inputs";
import { TiltCard } from "@/components/MotionPrimitives";
import { ErrorState, Notice, Skeleton, UnavailableState } from "@/components/States";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/services/api";
import { ApiError, toApiError } from "@/services/client";
import type { CompatibilityReport, EvalSplit, PerformanceRecord } from "@/types/api";
import { fmtDate, fmtInt, fmtMetric } from "@/utils/format";
import { SERIES } from "@/utils/palette";

const SPLIT_LABEL: Record<EvalSplit, string> = { validation: "Validation (threshold fitted on it)", out_of_time_validation: "Out-of-time validation (forward-chaining)", test: "Test (steps 35–49)" };
const METRICS = [["accuracy", "Accuracy"], ["precision", "Precision"], ["recall", "Recall"], ["f1", "F1"], ["roc_auc", "ROC-AUC"], ["pr_auc", "PR-AUC"]] as const;
type MetricKey = (typeof METRICS)[number][0];

const rowLabel = (r: PerformanceRecord) => `${r.title}${r.feature_set ? ` · ${r.feature_set}` : ""}${r.strategy && r.strategy !== "matched" ? ` · ${r.strategy}` : ""}`;

export default function PerformancePage() {
  const { refreshKey, models } = useApp();
  const perf = useAsync((s) => api.performance({}, s), [refreshKey]);
  const [experiment, setExperiment] = useState("");
  const [split, setSplit] = useState<EvalSplit | "">("");
  const [op, setOp] = useState("");
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({ key: "pr_auc", order: "desc" });
  const [detail, setDetail] = useState<string | null>(null);

  const records = perf.data?.records ?? [];
  const experiments = useMemo(() => [...new Set(records.map((r) => r.experiment))], [records]);
  useEffect(() => { if (!experiment && experiments.length) setExperiment(experiments.includes("gnn_final_v1") ? "gnn_final_v1" : experiments[0]); }, [experiments, experiment]);
  const inExp = records.filter((r) => r.experiment === experiment);
  const splits = useMemo(() => (["test", "out_of_time_validation", "validation"] as EvalSplit[]).filter((s) => inExp.some((r) => r.split === s)), [inExp]);
  useEffect(() => { if (splits.length && !splits.includes(split as EvalSplit)) setSplit(splits[0]); }, [splits, split]);
  const ops = useMemo(() => [...new Set(inExp.filter((r) => r.split === split && r.operating_point).map((r) => r.operating_point!))], [inExp, split]);
  useEffect(() => { if (ops.length && !ops.includes(op)) setOp(ops.includes("primary") ? "primary" : ops[0]); if (!ops.length) setOp(""); }, [ops, op]);

  const rows = inExp.filter((r) => r.split === split && (!op || r.operating_point === op));
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = sort.key === "model" ? rowLabel(a) : (a.metrics[sort.key as MetricKey] ?? -1);
    const bv = sort.key === "model" ? rowLabel(b) : (b.metrics[sort.key as MetricKey] ?? -1);
    return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.order === "asc" ? 1 : -1);
  }), [rows, sort]);
  const best = (k: MetricKey) => Math.max(...rows.map((r) => r.metrics[k] ?? -1));
  const selected = rows.find((r) => `${r.model_id}|${r.split}|${r.operating_point ?? ""}` === detail) ?? null;

  const cols: Column<PerformanceRecord>[] = [
    { key: "model", header: "Model", sortKey: "model", render: (r) => <div><p className="text-sm text-cloud">{rowLabel(r)}</p><p className="text-[11px] text-silver">{r.model_family}{r.selected ? "" : " · not selected"}</p></div> },
    ...METRICS.map(([k, label]): Column<PerformanceRecord> => ({ key: k, header: label, sortKey: k, align: "right", render: (r) => { const v = r.metrics[k]; const isBest = v !== null && rows.length > 1 && v === best(k); return <span className={`num ${isBest ? "font-semibold text-brand-500" : ""}`} title={k === "accuracy" && r.accuracy_source !== "reported" ? (r.accuracy_source === "derived_from_confusion_matrix" ? "derived from the stored confusion matrix" : "not recorded") : undefined}>{fmtMetric(v)}{k === "accuracy" && r.accuracy_source === "derived_from_confusion_matrix" ? "*" : ""}</span>; } })),
    { key: "thr", header: "Threshold", align: "right", render: (r) => <span className="num text-silver">{fmtMetric(r.threshold, 4)}</span> },
  ];
  const onSort = (key: string) => setSort((s) => (s.key === key ? { key, order: s.order === "asc" ? "desc" : "asc" } : { key, order: "desc" }));

  const barData = sorted.map((r) => ({ name: rowLabel(r).replace(" · ", "\n"), accuracy: r.metrics.accuracy, precision: r.metrics.precision, recall: r.metrics.recall, f1: r.metrics.f1 }));
  const aucData = sorted.map((r) => ({ name: rowLabel(r), roc_auc: r.metrics.roc_auc, pr_auc: r.metrics.pr_auc }));
  const scatter = sorted.filter((r) => r.metrics.precision !== null && r.metrics.recall !== null).map((r, i) => ({ name: rowLabel(r), precision: r.metrics.precision!, recall: r.metrics.recall!, color: SERIES[i % SERIES.length] }));
  const radarRows = sorted.slice(0, 5);
  const radar = METRICS.map(([k, label]) => ({ metric: label, ...Object.fromEntries(radarRows.map((r) => [rowLabel(r), r.metrics[k] ?? 0])) }));

  return (
    <>
      <PageHeader title="Model Performance" description="Stored evaluation results read from the experiment output files. Validation, out-of-time validation and test numbers are never mixed." />
      {perf.error ? <Card><ErrorState error={perf.error} onRetry={perf.reload} /></Card> : (
        <>
          <Card className="mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Experiment"><Select label="Experiment" value={experiment} onChange={setExperiment} options={experiments.map((e) => ({ value: e, label: e }))} disabled={!experiments.length} /></Field>
              <Field label="Evaluation split"><Select label="Evaluation split" value={split} onChange={(v) => setSplit(v as EvalSplit)} options={splits.map((s) => ({ value: s, label: SPLIT_LABEL[s] }))} disabled={!splits.length} /></Field>
              {ops.length > 1 && <Field label="Operating point"><Select label="Operating point" value={op} onChange={setOp} options={ops.map((o) => ({ value: o, label: o }))} /></Field>}
              <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-silver">{perf.data?.experiments.map((e) => <Badge key={e.name} tone={e.found ? "neutral" : "fraud"} title={e.found ? `finished ${fmtDate(e.finished_utc)}` : "not found"}>{e.name}{e.found ? "" : " ✕"}</Badge>)}</div>
            </div>
            {split && <p className="mt-3 text-xs text-silver">{rows[0]?.evaluation_scope}</p>}
          </Card>

          <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {perf.data?.families.map((f) => (
              <TiltCard key={f.family} intensity={4} className={`px-3.5 py-3 ${f.available ? "" : "border-warn-400/25 bg-warn-400/[0.04]"}`}>
                <p className="text-xs font-medium text-cloud" title={f.unavailable_reason ?? undefined}>{f.title}</p>
                <p className="text-[11px] text-silver">{f.available ? `${f.record_count} result${f.record_count === 1 ? "" : "s"}` : "No results found"}</p>
              </TiltCard>
            )) ?? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
          {perf.data?.families.filter((f) => !f.available).map((f) => <div key={f.family} className="mb-3"><Notice tone="warn" title={`${f.title}: no evaluation data`}>{f.unavailable_reason}</Notice></div>)}

          {perf.loading && !perf.data ? <Skeleton className="h-72" /> : rows.length === 0 ? (
            <Card><UnavailableState title="No results for this selection" reason="The selected experiment has no records for this split. Pick another experiment or split." /></Card>
          ) : (
            <>
              <Card pad={false}>
                <div className="p-4 pb-2 sm:p-5 sm:pb-2"><CardHeader title="Metric comparison" subtitle="Best value per metric highlighted. * accuracy derived from the stored confusion matrix. Click a row for details." /></div>
                <DataTable caption="Model metrics" columns={cols} rows={sorted} rowKey={(r) => `${r.model_id}|${r.split}|${r.operating_point ?? ""}`} selectedKey={detail} onRowClick={(r) => setDetail(`${r.model_id}|${r.split}|${r.operating_point ?? ""}`)} sort={sort} onSort={onSort} />
              </Card>
              {selected && (
                <Card className="mt-4">
                  <CardHeader title={rowLabel(selected)} subtitle={`${selected.experiment} · ${SPLIT_LABEL[selected.split]}`} actions={<Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Close</Button>} />
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      {selected.confusion_matrix ? <ConfusionMatrix cm={selected.confusion_matrix} /> : <p className="text-xs text-silver">No confusion matrix stored for this record.</p>}
                      <dl className="mt-3 text-xs text-cloud/85"><p>Evaluated nodes: <span className="num">{fmtInt(selected.n)}</span> · illicit: <span className="num">{fmtInt(selected.n_illicit)}</span></p><p>FPR <span className="num">{fmtMetric(selected.metrics.false_positive_rate, 4)}</span> · FNR <span className="num">{fmtMetric(selected.metrics.false_negative_rate, 4)}</span></p><p className="mt-1 text-silver">Threshold source: {selected.threshold_source}</p></dl>
                    </div>
                    <div><p className="eyebrow mb-1.5">Caveats</p><ul className="list-disc space-y-1 pl-4 text-xs text-cloud/85">{selected.caveats.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                  </div>
                </Card>
              )}
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card><CardHeader title="Accuracy, precision, recall and F1" /><GroupedBars label="Accuracy, precision, recall and F1 per model" data={barData} series={[{ key: "accuracy", name: "Accuracy" }, { key: "precision", name: "Precision" }, { key: "recall", name: "Recall" }, { key: "f1", name: "F1" }]} /><p className="mt-1 text-[11px] text-silver">Accuracy is uninformative under heavy class imbalance (about 6.5% illicit in the test period).</p></Card>
                <Card><CardHeader title="ROC-AUC and PR-AUC" /><GroupedBars label="ROC-AUC and PR-AUC per model" data={aucData} series={[{ key: "roc_auc", name: "ROC-AUC" }, { key: "pr_auc", name: "PR-AUC" }]} /></Card>
                <Card><CardHeader title="Precision vs recall" /><PrScatter label="Precision versus recall per model" points={scatter} /></Card>
                <Card><CardHeader title="Radar comparison" subtitle="Top models by current sort (max 5)" /><RadarCompare label="Radar chart of all six metrics" data={radar} series={radarRows.map((r) => ({ key: rowLabel(r), name: rowLabel(r) }))} /></Card>
              </div>
            </>
          )}
          <div className="mt-4"><Notice tone="info" title="How to read these numbers">{perf.data?.notes.join(" ")}</Notice></div>
        </>
      )}
      <CompatibilitySection availabilityModels={models} />
    </>
  );
}

function ConfusionMatrix({ cm }: { cm: { tn: number; fp: number; fn: number; tp: number } }) {
  const cell = (v: number, label: string, tone: string) => <div className={`rounded-xl border border-white/[0.06] p-3 text-center ${tone}`}><p className="num text-lg font-semibold text-cloud">{fmtInt(v)}</p><p className="text-[11px] text-silver">{label}</p></div>;
  return (
    <div role="group" aria-label="Confusion matrix" className="grid max-w-xs grid-cols-2 gap-2">
      {cell(cm.tn, "true licit", "bg-ink-750/50")}{cell(cm.fp, "false alarm (FP)", "bg-warn-400/10")}{cell(cm.fn, "missed fraud (FN)", "bg-fraud-400/10")}{cell(cm.tp, "caught fraud (TP)", "bg-ink-750/50")}
    </div>
  );
}

function CompatibilitySection({ availabilityModels }: { availabilityModels: ReturnType<typeof useApp>["models"] }) {
  const [rep, setRep] = useState<CompatibilityReport | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (refresh: boolean) => { setBusy(true); setErr(null); try { setRep(await api.compatibility(refresh)); } catch (e) { setErr(toApiError(e)); } finally { setBusy(false); } };
  const list = rep?.models ?? availabilityModels ?? [];
  return (
    <Card className="mt-4">
      <CardHeader title="Checkpoint compatibility" icon={<ShieldCheck className="h-4 w-4" />} subtitle="Package discovery is not inference availability: every integrity and compatibility check must pass" actions={<Button size="sm" loading={busy} onClick={() => run(!!rep)} icon={<Cpu className="h-3.5 w-3.5" />}>{rep ? "Re-run verification" : "Run verification"}</Button>} />
      {err && <ErrorState error={err} compact />}
      {!rep && !availabilityModels && !err && <p className="text-xs text-silver">Not run yet. Verification checks hashes, scalers, dataset provenance and reproduces the package&apos;s stored scores; the first run can take a while.</p>}
      {rep && (
        <div className="mb-4 space-y-1.5">
          <p className="text-xs text-cloud/85">Package <span className="num">{rep.package}</span>: {rep.package_found ? <Badge tone="safe" dot>found at {rep.package_location}</Badge> : <Badge tone="fraud" dot>not found</Badge>}</p>
          {!rep.package_found && <p className="text-xs text-silver">Searched: {rep.searched_experiment_roots.join(", ")}</p>}
          {rep.package_checks.map((c) => <p key={c.id} className="flex gap-2 text-xs"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${c.status === "pass" ? "bg-brand-500" : c.status === "fail" ? "bg-fraud-400" : "bg-warn-400"}`} /><span className="text-cloud">{c.title}</span>{c.detail && <span className="text-silver">— {c.detail}</span>}</p>)}
        </div>
      )}
      {list.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <div key={m.model_id} className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-3">
              <div className="flex items-start justify-between gap-2"><p className="text-sm text-cloud">{m.title}</p><StatusBadge status={m.status} /></div>
              {m.reasons.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-fraud-200/90">{m.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
              {m.checks.length > 0 && <details className="mt-2 text-[11px] text-silver"><summary className="cursor-pointer">{m.checks.filter((c) => c.status === "pass").length}/{m.checks.length} checks passed</summary><ul className="mt-1 space-y-0.5">{m.checks.map((c) => <li key={c.id}><span className={c.status === "pass" ? "text-brand-400" : c.status === "fail" ? "text-fraud-300" : "text-warn-300"}>{c.status}</span> {c.id}{c.detail ? ` — ${c.detail}` : ""}</li>)}</ul></details>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
