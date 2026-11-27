import { useNavigate } from "react-router-dom";
import { Boxes, CheckCircle2, GitBranch, Percent, ShieldAlert, ShieldCheck, ArrowRight, Cpu, ListChecks } from "lucide-react";
import { Badge, GroundTruthBadge, SeverityBadge, StatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardHeader } from "@/components/Card";
import { DonutChart, StackedBars, TimeStepChart } from "@/components/charts";
import { ErrorState, Skeleton, UnavailableState } from "@/components/States";
import { MetricCard } from "@/components/MetricCard";
import { ScrollReveal } from "@/components/MotionPrimitives";
import { CapabilitiesBento, ClosingBanner, LandingHero, WorkflowShowcase } from "@/components/LandingShowcase";
import { useApp } from "@/hooks/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { useFraudTrend } from "@/hooks/useFraudTrend";
import { api } from "@/services/api";
import { fmtDate, fmtInt, fmtMetric, fmtPct, fmtProb } from "@/utils/format";
import { COLORS } from "@/utils/palette";

export default function OverviewPage() {
  const { refreshKey, models, modelsLoading, verifyModels, modelsError } = useApp();
  const nav = useNavigate();
  const overview = useAsync((s) => api.overview(s), [refreshKey]);
  const dmodels = useAsync((s) => api.dashboardModels(s), [refreshKey]);
  const stats = useAsync((s) => api.graphStats(s), [refreshKey]);
  const recentTx = useAsync((s) => api.transactions({ sort_by: "time_step", order: "desc", page_size: 8 }, s), [refreshKey]);
  const recentAlerts = useAsync((s) => api.alerts({ page_size: 6, sort_by: "probability", order: "desc" }, s), [refreshKey]);
  const trend = useFraudTrend(stats.data?.nodes_per_time_step, !!stats.data, refreshKey);

  const o = overview.data;
  const t = o?.transactions;
  const load = overview.loading && !o;

  const dist = t ? [
    { name: "Licit", value: t.licit ?? 0, color: COLORS.licit },
    { name: "Illicit", value: t.illicit ?? 0, color: COLORS.illicit },
    { name: "Unknown", value: t.unknown ?? 0, color: COLORS.unknown },
  ] : [];
  const splitData = o ? Object.entries(o.splits).map(([name, s]) => ({ name: name === "val" ? "validation" : name, Licit: s.licit ?? 0, Illicit: s.illicit ?? 0, Unknown: s.unknown ?? 0 })) : [];
  const liveModels = models ? models.map((m) => ({ model_id: m.model_id, title: m.title, status: m.status, kind: m.kind })) : (dmodels.data?.live_inference_models ?? []).map((m) => ({ model_id: m.model_id, title: m.title, status: m.status, kind: m.kind }));
  const verified = !!models || !!dmodels.data?.live_models_verified;
  const finalExp = dmodels.data?.experiments.find((e) => e.role === "gnn_final");
  const lastUpdated = finalExp?.finished_utc ?? dmodels.data?.experiments.find((e) => e.finished_utc)?.finished_utc;

  return (
    <>
      <LandingHero />
      <CapabilitiesBento />
      <WorkflowShowcase />

      {/* Live Backend Telemetry Section */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-cloud">Live Network Telemetry</h2>
          <p className="mt-0.5 text-xs text-silver">
            Real-time graph summaries, model verification state, and prediction outputs read from the connected API.
          </p>
        </div>
        {lastUpdated && <Badge tone="neutral" title="Finish time of the most recent experiment run">Models last trained {fmtDate(lastUpdated)}</Badge>}
      </div>

      {overview.error && !o ? (
        <Card><ErrorState error={overview.error} onRetry={overview.reload} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {load ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[104px]" />) : (
            <>
              <MetricCard label="Total transactions" value={fmtInt(t?.total)} hint={o?.count_source === "step2_metadata" ? "from Step 2 metadata" : "verified arrays"} icon={<Boxes className="h-5 w-5" />} accent="brand" />
              <MetricCard label="Licit" value={fmtInt(t?.licit)} hint="labeled licit" icon={<ShieldCheck className="h-5 w-5" />} accent="safe" />
              <MetricCard label="Illicit" value={fmtInt(t?.illicit)} hint="labeled illicit" icon={<ShieldAlert className="h-5 w-5" />} accent="fraud" />
              <MetricCard label="Fraud rate" value={fmtPct(t?.fraud_percentage_of_labeled)} hint="illicit / (illicit + licit)" icon={<Percent className="h-5 w-5" />} accent="warn" />
              <MetricCard label="Graph nodes" value={fmtInt(o?.graph.nodes)} hint={`${fmtInt(t?.unknown)} unlabeled`} icon={<Boxes className="h-5 w-5" />} accent="model" />
              <MetricCard label="Graph edges" value={fmtInt(o?.graph.edges)} hint={o?.graph.directed ? "directed txId1 → txId2" : undefined} icon={<GitBranch className="h-5 w-5" />} accent="brand" />
            </>
          )}
        </div>
      )}
      {o && !o.data_verified && <p className="mt-3 text-xs text-warn-300">Dataset not verified against the Step 2 metadata: {String(o.data_verification.reason ?? "see /api/system/info")}</p>}

      <ScrollReveal delayMs={40}>
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader title="Label distribution" subtitle="Unknown-label transactions are neither licit nor illicit" />
            {load ? <Skeleton className="h-64" /> : t ? <DonutChart label="Licit, illicit and unknown transaction counts" data={dist} center={{ top: fmtPct(t.fraud_percentage_of_labeled), bottom: "of labeled are illicit" }} /> : <UnavailableState reason="No label counts returned by the backend." />}
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Class distribution per split" subtitle="Temporal split: train 1–29 · validation 30–34 · test 35–49" />
            {load ? <Skeleton className="h-60" /> : splitData.length ? (
              <>
                <StackedBars label="Transactions per split by label" data={splitData} series={[{ key: "Licit", name: "Licit", color: COLORS.licit }, { key: "Illicit", name: "Illicit", color: COLORS.illicit }, { key: "Unknown", name: "Unknown", color: COLORS.unknown }]} />
                <p className="mt-1 text-xs text-silver">Illicit share of labeled nodes: {Object.entries(o!.splits).map(([k, s]) => `${k === "val" ? "validation" : k} ${fmtPct((s.illicit_rate_among_labeled ?? NaN) * 100)}`).join(" · ")}</p>
              </>
            ) : <UnavailableState reason="No split summary available." />}
          </Card>
        </div>
      </ScrollReveal>

      <ScrollReveal delayMs={60}>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Illicit transactions per time step" subtitle="Assembled from real backend queries (49 lightweight requests); the backend has no dedicated trend endpoint" />
            {trend.error ? <ErrorState error={trend.error} compact /> : trend.data ? <TimeStepChart label="Illicit transactions and share per time step" data={trend.data} /> : stats.error ? <ErrorState error={stats.error} compact onRetry={stats.reload} /> : (
              <div className="py-16 text-center text-xs text-silver">Loading trend… {Math.round(trend.progress * 100)}%<div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10"><div className="tri-gradient-bar h-full transition-all" style={{ width: `${trend.progress * 100}%` }} /></div></div>
            )}
          </Card>
          <Card>
            <CardHeader title="Models" icon={<Cpu className="h-4 w-4" />} subtitle={verified ? "Compatibility verification has run" : "Compatibility not verified yet"} actions={<Button size="sm" loading={modelsLoading} onClick={() => verifyModels()}>{verified ? "Re-check" : "Verify now"}</Button>} />
            {dmodels.error && !dmodels.data ? <ErrorState error={dmodels.error} compact onRetry={dmodels.reload} /> : (
              <ul className="space-y-2">
                {liveModels.length === 0 && !dmodels.loading && <li className="text-xs text-silver">The backend lists no inference models (final package not found or incomplete).</li>}
                {liveModels.map((m) => (
                  <li key={m.model_id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-ink-950/60 px-3 py-2 transition hover:border-brand-500/35">
                    <div className="min-w-0"><p className="truncate text-sm text-cloud">{m.title}</p><p className="text-[11px] text-silver">{m.kind === "gnn" ? "graph model" : "tabular baseline"}</p></div>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
            {modelsError && <p className="mt-2 text-xs text-fraud-300">{modelsError.message}</p>}
            {dmodels.data && dmodels.data.best_test_pr_auc_by_family.length > 0 && (
              <div className="mt-4 border-t border-white/[0.07] pt-3">
                <p className="eyebrow mb-2">Best test PR-AUC (stored results)</p>
                {dmodels.data.best_test_pr_auc_by_family.map((b) => (
                  <div key={b.family} className="flex justify-between py-0.5 text-xs"><span className="text-cloud/85">{b.family}</span><span className="num text-cloud">{fmtMetric(b.test_pr_auc)} <span className="text-silver">· {b.experiment}</span></span></div>
                ))}
              </div>
            )}
            <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={() => nav("/models")} icon={<ArrowRight className="h-4 w-4" />}>Full model comparison</Button>
          </Card>
        </div>
      </ScrollReveal>

      <ScrollReveal delayMs={80}>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card pad={false}>
            <div className="p-4 pb-0 sm:p-5 sm:pb-0"><CardHeader title="Recent high-probability alerts" icon={<ShieldAlert className="h-4 w-4" />} subtitle="Derived from stored prediction outputs" actions={<Button size="sm" variant="ghost" onClick={() => nav("/alerts")}>View all</Button>} /></div>
            {recentAlerts.error ? <ErrorState error={recentAlerts.error} compact onRetry={recentAlerts.reload} /> : recentAlerts.loading && !recentAlerts.data ? <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div> : !recentAlerts.data?.items.length ? <UnavailableState title="No alerts" reason="No stored prediction output is available to derive alerts from." /> : (
              <ul className="divide-y divide-white/[0.06]">
                {recentAlerts.data.items.map((a) => (
                  <li key={a.alert_id}><button onClick={() => nav(`/transactions?tx=${a.tx_id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-brand-500/[0.05] sm:px-5">
                    <span className="num text-sm text-cloud">{a.tx_id}</span>
                    <span className="flex items-center gap-3"><span className="num text-xs text-silver">{fmtProb(a.probability)}</span><SeverityBadge severity={a.severity} /></span>
                  </button></li>
                ))}
              </ul>
            )}
          </Card>
          <Card pad={false}>
            <div className="p-4 pb-0 sm:p-5 sm:pb-0"><CardHeader title="Latest transactions" icon={<ListChecks className="h-4 w-4" />} subtitle="Highest time steps in the dataset" actions={<Button size="sm" variant="ghost" onClick={() => nav("/transactions")}>Explore</Button>} /></div>
            {recentTx.error ? <ErrorState error={recentTx.error} compact onRetry={recentTx.reload} /> : recentTx.loading && !recentTx.data ? <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div> : (
              <ul className="divide-y divide-white/[0.06]">
                {recentTx.data?.items.map((r) => (
                  <li key={r.tx_id}><button onClick={() => nav(`/transactions?tx=${r.tx_id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-brand-500/[0.05] sm:px-5">
                    <span className="num text-sm text-cloud">{r.tx_id}</span>
                    <span className="flex items-center gap-3"><span className="text-xs text-silver">step {r.time_step}</span><GroundTruthBadge label={r.ground_truth_label} /></span>
                  </button></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </ScrollReveal>

      <Card className="mt-4">
        <CardHeader title="Experiments" icon={<CheckCircle2 className="h-4 w-4" />} subtitle="Artifacts the backend found" />
        {dmodels.data ? (
          <div className="grid gap-3 md:grid-cols-3">
            {dmodels.data.experiments.map((e) => (
              <div key={e.name} className="rounded-xl border border-white/[0.08] bg-ink-950/60 p-3.5">
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-cloud">{e.name}</p>{e.found ? <Badge tone="safe" dot>found</Badge> : <Badge tone="fraud" dot>not found</Badge>}</div>
                <p className="mt-1 text-xs text-silver">{e.found ? `${e.environment ?? "environment n/a"} · ${e.n_runs ?? "?"} runs · finished ${fmtDate(e.finished_utc)}` : "Not present in the configured experiment directories."}</p>
              </div>
            ))}
          </div>
        ) : dmodels.error ? <ErrorState error={dmodels.error} compact onRetry={dmodels.reload} /> : <Skeleton className="h-16" />}
      </Card>

      <ClosingBanner />
    </>
  );
}
