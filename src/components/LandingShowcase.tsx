import { TouchEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Cpu,
  FileSpreadsheet,
  GitBranch,
  Layers,
  Maximize2,
  Network,
  Pause,
  Play,
  ScanSearch,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import heroGraphImg from "@/assets/images/lime_hero_network_1795757054890.jpg";
import pipelineGnnImg from "@/assets/images/lime_gnn_layers_1795757055444.jpg";
import emblemImg from "@/assets/images/lime_hex_emblem_1795757055811.jpg";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { ScrollReveal } from "./MotionPrimitives";

interface WorkflowStage {
  step: string;
  title: string;
  headline: string;
  summary: string;
  route: string;
  cta: string;
  highlights: { label: string; value: string }[];
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    step: "01",
    title: "Transaction Explorer",
    headline: "Query dataset transactions, time steps, and local feature vectors",
    summary:
      "Search by exact transaction ID, filter across temporal splits and dataset labels, sort by degree or time step, and inspect individual feature distributions side by side.",
    route: "/transactions",
    cta: "Open Transaction Explorer",
    highlights: [
      { label: "Filtering", value: "Split · Label · Step" },
      { label: "Feature View", value: "Live Searchable Table" },
      { label: "Context", value: "GT vs AI Separated" },
    ],
  },
  {
    step: "02",
    title: "Graph Investigation",
    headline: "Traverse directed payment flows without loading the entire graph",
    summary:
      "Expand bounded k-hop incoming and outgoing neighborhoods around any transaction ID, switch spatial layouts, and overlay verified model risk predictions directly on graph nodes.",
    route: "/graph",
    cta: "Open Graph Explorer",
    highlights: [
      { label: "Direction", value: "Parents · Children · Both" },
      { label: "Layouts", value: "Force · Flow · Circle" },
      { label: "Overlays", value: "Verified Model Risk" },
    ],
  },
  {
    step: "03",
    title: "Live & Batch Scoring",
    headline: "Run calibrated single-transaction inference or in-memory CSV scoring",
    summary:
      "Score verified models against real transaction neighborhoods or validate and process uploaded CSV files in memory with probability histograms and downloadable reports.",
    route: "/prediction",
    cta: "Open Fraud Prediction",
    highlights: [
      { label: "Single Scoring", value: "Per-Model Thresholds" },
      { label: "CSV Batch", value: "In-Memory Validation" },
      { label: "Export", value: "Downloadable CSV" },
    ],
  },
  {
    step: "04",
    title: "Performance & Alerts",
    headline: "Audit model metrics and triage high-probability threshold alerts",
    summary:
      "Compare PR-AUC, ROC-AUC, precision-recall curves, and confusion matrices across evaluation splits, then investigate flagged transactions sorted by threshold margin.",
    route: "/alerts",
    cta: "Review Fraud Alerts",
    highlights: [
      { label: "Evaluation", value: "PR-AUC · ROC-AUC · F1" },
      { label: "Integrity", value: "Compatibility Checks" },
      { label: "Triage", value: "Critical · High · Medium" },
    ],
  },
];

function ResilientImage({
  src,
  alt,
  className = "",
  fallbackTitle,
  lazy = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle: string;
  lazy?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-ink-750/60 via-ink-900 to-ink-800 p-6 text-center ${className}`}
      >
        <div>
          <Layers className="mx-auto h-7 w-7 text-brand-500" aria-hidden />
          <p className="mt-2 text-xs font-medium text-silver">{fallbackTitle}</p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={lazy ? "lazy" : undefined}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function LandingHero() {
  const nav = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <section
        aria-label="Sentinel GNN platform introduction"
        className="card animated-border relative mb-8 overflow-hidden bg-ink-900/95 shadow-elevated"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-ink-750/25 to-model-500/10 rotate-12 animate-floatSlow"
        />

        <div className="grid items-stretch lg:grid-cols-[1.12fr_0.88fr]">
          {/* Left narrative & CTA column */}
          <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-brand-500/35 bg-ink-950 shadow-glow animate-floatSlow">
                  <ResilientImage
                    src={emblemImg}
                    alt="Sentinel GNN cryptographic node mark"
                    className="h-full w-full object-cover"
                    fallbackTitle="Sentinel GNN"
                  />
                </div>
                <p className="text-xs font-medium text-silver">
                  <span className="font-semibold text-cloud">Sentinel GNN</span>
                  <span className="mx-2 text-steel" aria-hidden="true">·</span>
                  <span>Graph-Based Financial Fraud Intelligence</span>
                </p>
              </div>

              <h1 className="mt-6 max-w-2xl font-display text-[clamp(1.85rem,3.4vw,3.15rem)] font-bold leading-[1.1] tracking-tight text-cloud [text-wrap:balance]">
                Uncover Illicit Payment Rings{" "}
                <span className="tri-gradient-text">Across Graph Topology</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-silver sm:text-[15px]">
                Investigate transaction neighborhoods, compare graph and tabular risk models, and score suspicious
                activity with calibrated, transparent probability thresholds.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => nav("/transactions")} icon={<ArrowRight className="h-4 w-4" />}>
                Explore Transactions
              </Button>
              <Button variant="secondary" onClick={() => nav("/graph")} icon={<GitBranch className="h-4 w-4 text-brand-500" />}>
                Inspect Graph Neighbourhoods
              </Button>
              <Button variant="ghost" onClick={() => nav("/prediction")} icon={<ShieldAlert className="h-4 w-4 text-model-400" />}>
                Score Fraud Risk
              </Button>
            </div>
          </div>

          {/* Right visual showcase with responsive capability strip */}
          <div className="group relative flex flex-col justify-end overflow-hidden border-t border-white/[0.08] lg:min-h-[380px] lg:border-l lg:border-t-0">
            <div className="relative h-56 w-full sm:h-72 lg:absolute lg:inset-0 lg:h-full">
              <ResilientImage
                src={heroGraphImg}
                alt="Isometric transaction graph visualization with Lime Green nodes and Pure White edges on Midnight Black"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                fallbackTitle="Transaction Graph Topology"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/25 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-ink-900/25 lg:to-ink-900/90"
              />
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Expand transaction network visualization"
                title="Expand visualization"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-ink-900/85 text-silver opacity-90 backdrop-blur-md transition hover:border-brand-500/50 hover:text-cloud group-hover:opacity-100 sm:right-4 sm:top-4"
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="relative z-10 m-3 grid grid-cols-1 gap-3 rounded-xl border border-white/15 bg-ink-900/90 p-4 backdrop-blur-md shadow-card sm:m-4 sm:grid-cols-3 sm:gap-3">
              <div>
                <p className="text-[11px] text-silver">Neighbourhoods</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-400">Bounded k-Hop Flow</p>
              </div>
              <div>
                <p className="text-[11px] text-silver">Inference</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-200">Single &amp; CSV Batch</p>
              </div>
              <div>
                <p className="text-[11px] text-silver">Audit Clarity</p>
                <p className="mt-0.5 text-sm font-semibold text-model-300">GT &amp; AI Separated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} title="Directed Transaction Network View" wide>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950">
          <ResilientImage
            src={heroGraphImg}
            alt="Expanded isometric transaction network visualization"
            className="max-h-[65vh] w-full object-contain"
            fallbackTitle="Transaction Network View"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-silver">
          Interactive investigation across directed payment relationships connects transaction features with structural graph context while keeping model outputs clearly separated from ground-truth labels.
        </p>
      </Dialog>
    </>
  );
}

export function CapabilitiesBento() {
  const nav = useNavigate();
  const [diagramOpen, setDiagramOpen] = useState(false);

  return (
    <ScrollReveal delayMs={40}>
      <section aria-label="Core platform capabilities" className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-cloud sm:text-2xl">
              Built for High-Stakes Fraud Investigation
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-silver">
              Every surface connects network topology, calibrated scoring, and transparent evidence without guesswork.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => nav("/models")} icon={<Cpu className="h-3.5 w-3.5 text-brand-500" />}>
            Compare Models
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* 01. Wide capability card */}
          <article className="card flex flex-col justify-between p-6 transition hover:border-brand-500/35 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-brand-400">01. Transaction Intelligence</span>
                <ScanSearch className="h-5 w-5 text-brand-500" aria-hidden />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-cloud sm:text-xl">
                Pinpoint Anomalous Transfers &amp; Feature Signatures
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver">
                Filter transactions across temporal windows and known dataset classifications. Open any transaction row
                for instant access to incoming/outgoing counterparties, searchable feature vectors, and per-model risk
                probabilities.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
              <span className="text-xs text-silver">Search by ID · Sort degrees · Inspect features</span>
              <Button size="sm" variant="secondary" onClick={() => nav("/transactions")} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                Open Explorer
              </Button>
            </div>
          </article>

          {/* 02. Deep Emerald elevated dark card */}
          <article className="card flex flex-col justify-between bg-gradient-to-br from-ink-750/55 via-ink-850/95 to-ink-900 p-6 transition hover:border-model-500/40 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-model-300">02. Bounded Subgraphs</span>
                <Network className="h-5 w-5 text-model-400" aria-hidden />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-cloud sm:text-xl">
                Expand Multi-Hop Payment Neighbourhoods
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-silver">
                Trace upstream funding sources and downstream spending paths interactively. Double-click nodes to expand
                hops, toggle class visibility, and overlay verified prediction risk directly onto graph entities.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
              <span className="text-xs text-brand-200">Directional · Force &amp; Flow Layouts</span>
              <Button size="sm" variant="primary" onClick={() => nav("/graph")} icon={<GitBranch className="h-3.5 w-3.5" />}>
                Explore Graph
              </Button>
            </div>
          </article>

          {/* 03. Pure White (#FFFFFF) light-contrast capability card */}
          <article className="card-cloud flex flex-col justify-between p-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-ink-750">03. Calibrated Scoring</span>
                <FileSpreadsheet className="h-5 w-5 text-ink-750" aria-hidden />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink-900 sm:text-xl">
                Live Verification &amp; In-Memory Batch CSV Scoring
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Score individual transactions or drag-and-drop CSV batches with client-side header prechecks, real-time
                upload progress, class distribution charts, and one-click CSV result exports.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/15 pt-4">
              <span className="text-xs font-medium text-zinc-700">Processed in memory · Never persisted</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => nav("/prediction")}
                className="bg-ink-900 text-cloud border border-ink-900 hover:bg-ink-800 hover:text-cloud"
                icon={<ArrowRight className="h-3.5 w-3.5 text-brand-500" />}
              >
                Launch Prediction
              </Button>
            </div>
          </article>

          {/* 04. Wide visual + model architecture card */}
          <article className="card overflow-hidden transition hover:border-brand-500/35 lg:col-span-7">
            <div className="grid h-full items-stretch sm:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-semibold text-brand-400">04. Model Governance</span>
                    <Cpu className="h-5 w-5 text-brand-500" aria-hidden />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-cloud sm:text-xl">
                    Side-by-Side Metric Benchmarking &amp; Integrity Checks
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver">
                    Evaluate precision-recall tradeoffs, ROC-AUC, radar profiles, and confusion matrices alongside
                    checkpoint integrity diagnostics before authorizing any model for inference.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                  <span className="text-xs text-silver">PR-AUC · Confusion Matrices · Caveats</span>
                  <Button size="sm" variant="secondary" onClick={() => nav("/models")} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Model Benchmarks
                  </Button>
                </div>
              </div>

              <div className="group relative min-h-[210px] overflow-hidden border-t border-white/[0.08] sm:border-l sm:border-t-0">
                <ResilientImage
                  src={pipelineGnnImg}
                  lazy
                  alt="Isometric multi-layer Graph Neural Network architecture diagram in Lime Green and Pure White on Midnight Black"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  fallbackTitle="Graph Neural Network Layers"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/20 to-transparent"
                />
                <button
                  type="button"
                  onClick={() => setDiagramOpen(true)}
                  aria-label="Expand neural message passing illustration"
                  title="Expand architecture view"
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-ink-900/85 text-silver opacity-90 backdrop-blur-md transition hover:border-brand-500/50 hover:text-cloud group-hover:opacity-100"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </button>
                <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-ink-900/90 px-3 py-2 text-xs backdrop-blur-md">
                  <p className="font-medium text-cloud">Multi-Hop Message Passing</p>
                  <p className="text-[11px] text-silver">Structural context + calibrated thresholds</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <Dialog open={diagramOpen} onClose={() => setDiagramOpen(false)} title="Graph Neural Message Passing Architecture" wide>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950">
          <ResilientImage
            src={pipelineGnnImg}
            alt="Expanded multi-layer Graph Neural Network schematic"
            className="max-h-[65vh] w-full object-contain"
            fallbackTitle="Graph Neural Network Layers"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-silver">
          Graph architectures aggregate structural patterns across directed transaction neighborhoods, enabling analysts to compare graph-aware inference directly against tabular baselines.
        </p>
      </Dialog>
    </ScrollReveal>
  );
}

export function WorkflowShowcase() {
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) return;

    const timer = setInterval(() => {
      setTick((t) => {
        if (t >= 100) {
          setIndex((i) => (i + 1) % WORKFLOW_STAGES.length);
          return 0;
        }
        return t + 2.5;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [playing]);

  const selectStage = (idx: number) => {
    setIndex(idx);
    setTick(0);
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 42) return;
    if (dx < 0) selectStage((index + 1) % WORKFLOW_STAGES.length);
    else selectStage((index - 1 + WORKFLOW_STAGES.length) % WORKFLOW_STAGES.length);
  };

  const stage = WORKFLOW_STAGES[index];

  return (
    <ScrollReveal delayMs={60}>
      <section aria-label="Interactive investigation workflow" className="mb-8">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-cloud">
              End-to-End Investigation Workflow
            </h2>
            <p className="mt-0.5 text-xs text-silver">
              Step through each operational workspace from raw transaction lookup to alert triage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause workflow showcase" : "Play workflow showcase"}
              icon={playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            >
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Previous workflow step"
              onClick={() => selectStage((index - 1 + WORKFLOW_STAGES.length) % WORKFLOW_STAGES.length)}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label="Next workflow step"
              onClick={() => selectStage((index + 1) % WORKFLOW_STAGES.length)}
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="card animated-border overflow-hidden">
          <div className="grid grid-cols-2 gap-1.5 border-b border-white/[0.08] bg-ink-950/85 p-2.5 lg:grid-cols-4">
            {WORKFLOW_STAGES.map((s, i) => {
              const isCurrent = i === index;
              const isPast = i < index;
              return (
                <button
                  key={s.step}
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => selectStage(i)}
                  className={`group rounded-xl px-3.5 py-2.5 text-left transition ${
                    isCurrent ? "bg-ink-800/90 ring-1 ring-brand-500/40" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`font-mono font-semibold ${isCurrent ? "text-brand-400" : "text-silver"}`}>
                      {s.step}
                    </span>
                    <span className={`truncate font-medium ${isCurrent ? "text-cloud" : "text-silver"}`}>
                      {s.title}
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="tri-gradient-bar h-full origin-left transition-transform duration-150"
                      style={{ transform: `scaleX(${isCurrent ? tick / 100 : isPast ? 1 : 0})` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div
            key={stage.step}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="flex flex-col justify-between gap-6 p-6 animate-fade lg:flex-row lg:items-center lg:p-8"
          >
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-semibold text-brand-400">
                {stage.step}. {stage.title}
              </p>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-cloud sm:text-2xl [text-wrap:balance]">
                {stage.headline}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-silver">{stage.summary}</p>
              <div className="mt-5">
                <Button variant="primary" size="sm" onClick={() => nav(stage.route)} icon={<ArrowRight className="h-3.5 w-3.5" />}>
                  {stage.cta}
                </Button>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
              {stage.highlights.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-ink-950/70 px-4 py-3"
                >
                  <span className="text-xs text-silver">{h.label}</span>
                  <span className="font-mono text-xs font-semibold text-cloud">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

export function ClosingBanner() {
  const nav = useNavigate();

  return (
    <ScrollReveal delayMs={80}>
      <section
        aria-label="Get started with fraud investigation"
        className="card animated-border mt-8 overflow-hidden bg-gradient-to-br from-ink-750/55 via-ink-900 to-ink-850 p-6 sm:p-8"
      >
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold text-brand-400">Investigation Ready</p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-cloud sm:text-2xl [text-wrap:balance]">
              Inspect Suspicious Flows or Score Batch Exports Now
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-silver">
              Move seamlessly from high-probability alerts into single-transaction scoring, multi-hop graph expansion, and model diagnostics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button variant="primary" onClick={() => nav("/prediction")} icon={<ShieldAlert className="h-4 w-4" />}>
              Run Fraud Prediction
            </Button>
            <Button variant="secondary" onClick={() => nav("/alerts")} icon={<BellRing className="h-4 w-4 text-model-400" />}>
              Review Fraud Alerts
            </Button>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
