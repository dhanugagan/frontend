import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, Network, ScanSearch } from "lucide-react";
import { Badge, GroundTruthBadge, SeverityBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardHeader, PageHeader } from "@/components/Card";
import { Column, DataTable, Pagination } from "@/components/DataTable";
import { DetailPanel, KV } from "@/components/DetailPanel";
import { Field, SearchInput, SegmentedControl, Select } from "@/components/Inputs";
import { TiltCard } from "@/components/MotionPrimitives";
import { EmptyState, ErrorState, Notice, Spinner } from "@/components/States";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { api } from "@/services/api";
import type { Alert, Severity } from "@/types/api";
import { fmtDate, fmtInt, fmtMetric, fmtProb } from "@/utils/format";
import { SEVERITY_COLOR } from "@/utils/palette";

const PAGE_SIZE = 25;
type SortKey = "probability" | "tx_id" | "time_step" | "severity" | "timestamp";

export default function AlertsPage() {
  const { refreshKey } = useApp();
  const nav = useNavigate();
  const sources = useAsync((s) => api.alertSources(s), [refreshKey]);
  const [origin, setOrigin] = useState<"stored" | "session" | "all">("stored");
  const [source, setSource] = useState("");
  const [severity, setSeverity] = useState<"" | Severity>("");
  const [family, setFamily] = useState("");
  const [minP, setMinP] = useState("");
  const [txq, setTxq] = useState("");
  const [step, setStep] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; order: "asc" | "desc" }>({ key: "probability", order: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alert | null>(null);

  const dTx = useDebounced(txq);
  const txNum = /^\d+$/.test(dTx.trim()) ? Number(dTx.trim()) : undefined;
  const pNum = minP === "" ? undefined : Number.isFinite(Number(minP)) && +minP >= 0 && +minP <= 1 ? Number(minP) : undefined;
  const stepNum = /^\d+$/.test(step) && +step >= 1 && +step <= 49 ? Number(step) : undefined;
  const bad = (minP !== "" && pNum === undefined) || (step !== "" && stepNum === undefined) || (dTx.trim() !== "" && txNum === undefined);

  useEffect(() => setPage(1), [origin, source, severity, family, pNum, txNum, stepNum, sort]);
  const alerts = useAsync((s) => api.alerts({ origin, source: source || undefined, severity: severity || undefined, model_family: family || undefined, min_probability: pNum, tx_id: txNum, time_step: stepNum, sort_by: sort.key, order: sort.order, page, page_size: PAGE_SIZE }, s),
    [origin, source, severity, family, pNum, txNum, stepNum, sort, page, refreshKey], !bad);
  const d = alerts.data;
  const families = useMemo(() => [...new Set((sources.data?.sources ?? []).map((s) => s.model_family))], [sources.data]);

  const cols: Column<Alert>[] = [
    { key: "sev", header: "Severity", sortKey: "severity", render: (a) => <SeverityBadge severity={a.severity} /> },
    { key: "tx", header: "Transaction", sortKey: "tx_id", render: (a) => <span className="num text-cloud">{a.tx_id}</span> },
    { key: "p", header: "Probability", sortKey: "probability", render: (a) => <span className="num">{fmtProb(a.probability)}</span> },
    { key: "m", header: "Model", render: (a) => <span className="text-xs text-silver">{a.model_family ?? a.model_id}</span> },
    { key: "t", header: "Time step", sortKey: "time_step", render: (a) => <span className="num">{a.time_step ?? "—"}</span> },
    { key: "o", header: "Origin", render: (a) => <Badge tone={a.origin === "session_prediction" ? "model" : "neutral"}>{a.origin === "session_prediction" ? "live session" : "stored output"}</Badge> },
    { key: "ts", header: "Timestamp", sortKey: "timestamp", render: (a) => <span className="text-xs text-silver">{a.timestamp ? fmtDate(a.timestamp) : "n/a"}</span> },
  ];
  const onSort = (key: string) => setSort((s) => (s.key === key ? { key: s.key, order: s.order === "asc" ? "desc" : "asc" } : { key: key as SortKey, order: "desc" }));
  const reset = () => { setSource(""); setSeverity(""); setFamily(""); setMinP(""); setTxq(""); setStep(""); };

  return (
    <>
      <PageHeader title="Fraud Alerts" description="Alerts derived from actual prediction outputs: transactions predicted illicit at a model's own threshold. There is no database — stored-output alerts are re-derived from artifacts; live-session alerts exist in memory only." />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["critical", "high", "medium"] as Severity[]).map((s) => (
          <TiltCard key={s} intensity={4} glowColor={`${SEVERITY_COLOR[s]}26`}>
            <button onClick={() => setSeverity(severity === s ? "" : s)} aria-pressed={severity === s} className={`w-full rounded-xl px-4 py-3.5 text-left transition hover:bg-white/[0.03] ${severity === s ? "ring-1 ring-brand-500/60" : ""}`}>
              <p className="eyebrow flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />{s}</p>
              <p className="num mt-1.5 text-2xl font-bold text-cloud">{d ? fmtInt(d.severity_counts[s]) : "…"}</p>
            </button>
          </TiltCard>
        ))}
      </div>

      <Card className="mb-4">
        <div className="mb-3"><SegmentedControl label="Alert origin" value={origin} onChange={setOrigin} options={[{ value: "stored", label: "Stored outputs" }, { value: "session", label: "Live session" }, { value: "all", label: "Both" }]} /></div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Prediction source"><Select label="Prediction source" value={source} onChange={setSource} disabled={origin === "session"} options={[{ value: "", label: "Default source" }, { value: "all", label: "All sources" }, ...(sources.data?.sources ?? []).map((s) => ({ value: s.source_id, label: `${s.model_id} · ${s.experiment}` }))]} /></Field>
          <Field label="Model family"><Select label="Model family" value={family} onChange={setFamily} options={[{ value: "", label: "Any" }, ...families.map((f) => ({ value: f, label: f }))]} /></Field>
          <Field label="Severity"><Select label="Severity" value={severity} onChange={(v) => setSeverity(v as "" | Severity)} options={[{ value: "", label: "Any" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }]} /></Field>
          <Field label="Min. probability" hint={minP !== "" && pNum === undefined ? "0 – 1" : undefined}><input aria-label="Minimum probability" className={`input w-28 ${minP !== "" && pNum === undefined ? "border-fraud-400/60" : ""}`} inputMode="decimal" value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="0.0" /></Field>
          <Field label="Time step" hint={step !== "" && stepNum === undefined ? "1 – 49" : undefined}><input aria-label="Time step" className={`input w-24 ${step !== "" && stepNum === undefined ? "border-fraud-400/60" : ""}`} inputMode="numeric" value={step} onChange={(e) => setStep(e.target.value)} placeholder="1–49" /></Field>
          <Field label="Transaction ID"><SearchInput label="Transaction ID" value={txq} onChange={setTxq} inputMode="numeric" placeholder="exact id" className="w-full sm:w-44" /></Field>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </Card>
      {sources.error && <div className="mb-3"><Notice tone="warn">Prediction sources could not be listed: {sources.error.message}</Notice></div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card pad={false}>
          <div className="p-4 pb-2 sm:p-5 sm:pb-2"><CardHeader title="Alerts" icon={<BellRing className="h-4 w-4" />} subtitle={d ? `${fmtInt(d.total)} alerts · ${d.sources_used.length ? `source: ${d.sources_used.join(", ")}` : "no stored source"}` : undefined} /></div>
          {alerts.error ? <ErrorState error={alerts.error} onRetry={alerts.reload} /> : !d ? <Spinner /> : d.items.length === 0 ? (
            <EmptyState title="No alerts" description={origin === "session" ? "No live prediction has flagged a transaction in this session yet. Run predictions on the Fraud Prediction page." : "No transaction matches these filters, or no stored prediction output is available."} />
          ) : (
            <>
              <DataTable caption="Fraud alerts" columns={cols} rows={d.items} rowKey={(a) => a.alert_id} selectedKey={selected?.alert_id} onRowClick={setSelected} sort={sort} onSort={onSort} loading={alerts.loading} />
              <Pagination page={d.page} pages={d.pages} total={d.total} pageSize={PAGE_SIZE} onPage={setPage} noun="alerts" />
            </>
          )}
          {d && <p className="border-t border-white/[0.06] px-4 py-2 text-[11px] text-silver">{d.storage_note}</p>}
        </Card>
        <div className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <DetailPanel title={<span className="num">Alert · tx {selected.tx_id}</span>} subtitle={<SeverityBadge severity={selected.severity} />} onClose={() => setSelected(null)}>
              <dl>
                <KV label="Predicted probability" mono>{fmtProb(selected.probability)}</KV>
                <KV label="Model threshold" mono>{fmtMetric(selected.threshold, 4)}</KV>
                <KV label="Model">{selected.model_id}</KV>
                <KV label="Time step" mono>{selected.time_step ?? "—"}</KV>
                <KV label="Dataset ground truth"><GroundTruthBadge label={selected.ground_truth_label} /></KV>
                <KV label="Origin">{selected.origin === "session_prediction" ? "live session prediction" : "stored prediction output"}</KV>
                <KV label="Timestamp">{selected.timestamp ? fmtDate(selected.timestamp) : "not recorded"}</KV>
                {selected.source_generated_utc && <KV label="Output generated">{fmtDate(selected.source_generated_utc)}</KV>}
                <KV label="Status">Active (derived)</KV>
              </dl>
              {selected.evaluation_context && <div className="mt-3"><Notice tone="info" title="Evaluation context">{selected.evaluation_context}</Notice></div>}
              <p className="mt-3 text-[11px] text-silver">Severity = margin above the model&apos;s threshold. Alerts are indicators for investigation, not proof of fraud; the backend keeps no acknowledgement state.</p>
              <div className="mt-4 flex gap-2"><Button size="sm" variant="primary" onClick={() => nav(`/transactions?tx=${selected.tx_id}`)} icon={<ScanSearch className="h-3.5 w-3.5" />}>Open transaction</Button><Button size="sm" onClick={() => nav(`/graph?tx=${selected.tx_id}`)} icon={<Network className="h-3.5 w-3.5" />}>View graph</Button></div>
            </DetailPanel>
          ) : <Card><EmptyState icon={<BellRing className="h-5 w-5" />} title="Select an alert" description="Click a row for the model output behind it." /></Card>}
        </div>
      </div>
    </>
  );
}
