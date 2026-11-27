/**
 * TypeScript mirrors of the FastAPI backend's actual Pydantic schemas / service output
 * (backend/app/schemas/*.py and backend/app/services/*.py). Where the backend returns a free-form block
 * (schemas.common.Loose) the field is typed from the service code that builds it.
 */

export type LabelName = "illicit" | "licit" | "unknown";
export type SplitName = "train" | "val" | "test";
export type Severity = "medium" | "high" | "critical";

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id?: string | null;
  details?: unknown;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ---- system -------------------------------------------------------------
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  dataset_available: boolean;
  ml_runtime_available: boolean;
  models_verified: boolean;
  detail: Record<string, unknown>;
}

export interface ExperimentInfo {
  role: "baselines" | "gnn_local" | "gnn_final";
  name: string;
  found: boolean;
  started_utc?: string | null;
  finished_utc?: string | null;
  pipeline_version?: string | null;
  n_runs?: number | null;
  n_configs_evaluated_on_test?: number | null;
  environment?: string | null;
  device?: string | null;
  seed?: number | null;
  has_frozen_selection?: boolean;
  final_test_done?: boolean;
}

export interface SystemInfo {
  service: string;
  version: string;
  database: string;
  api_versions: string[];
  python: string;
  libraries: Record<string, string | null>;
  device: string;
  artifacts: {
    processed_dataset: { processed_dir_exists: boolean; files: Record<string, boolean>; step2_metadata_found: boolean };
    dataset_integrity: Record<string, unknown> | null;
    experiments: ExperimentInfo[];
    final_package_found: boolean;
    searched_experiment_roots?: string[];
    configuration_problems?: string[];
  };
  limits: { max_upload_bytes: number; max_csv_rows: number; max_page_size: number; graph_max_nodes: number; graph_max_edges: number; graph_max_depth: number };
  ml_runtime: { loaded: boolean; unavailable_reason: string | null };
  models: { verification_run: boolean; available: string[]; planned: string[] };
  notes: string[];
}

// ---- dashboard ----------------------------------------------------------
export interface SplitSummary {
  time_steps: [number, number] | null;
  nodes: number | null;
  illicit: number | null;
  licit: number | null;
  unknown: number | null;
  illicit_rate_among_labeled: number | null;
}

export interface DashboardOverview {
  transactions: {
    total: number | null;
    licit: number | null;
    illicit: number | null;
    unknown: number | null;
    labeled: number;
    fraud_percentage_of_labeled: number | null;
    illicit_percentage_of_all: number | null;
    definition: string;
  };
  graph: { nodes: number | null; edges: number | null; directed: boolean };
  splits: Record<string, SplitSummary>;
  count_source: string;
  data_verified: boolean;
  data_verification: Record<string, unknown>;
}

export interface LiveModelSummary {
  model_id: string;
  family: string;
  title: string;
  kind: "gnn" | "tabular";
  status: "unverified" | "available" | "unavailable";
  threshold: number | null;
  feature_set: string | null;
}

export interface FamilyAvailability {
  family: string;
  title: string;
  available: boolean;
  unavailable_reason: string | null;
  record_count: number;
}

export interface DashboardModels {
  live_inference_models: LiveModelSummary[];
  live_models_verified: boolean;
  evaluated_families: FamilyAvailability[];
  best_test_pr_auc_by_family: { family: string; experiment: string; model_id: string; feature_set: string | null; test_pr_auc: number; test_f1: number | null; split: string }[];
  experiments: ExperimentInfo[];
  notes: string[];
}

// ---- transactions ---------------------------------------------------------
export interface TransactionRow {
  tx_id: number;
  time_step: number;
  split: SplitName;
  ground_truth_label: LabelName;
  in_degree: number;
  out_degree: number;
}

export interface StoredPrediction {
  source_id: string;
  experiment: string;
  model_id: string;
  model_family: string;
  split: string;
  threshold: number | null;
  generated_utc: string | null;
  source: "stored_experiment_output";
  probability: number;
  predicted_label: LabelName | null;
  ground_truth_label: LabelName | null;
  time_step: number;
}

export interface RelatedNode {
  tx_id: number;
  ground_truth_label: LabelName;
}

export interface TransactionDetail extends TransactionRow {
  feature_groups: Record<string, number>;
  relationships: {
    direction_semantics: string;
    in_degree: number;
    out_degree: number;
    parents: RelatedNode[];
    children: RelatedNode[];
    neighbor_list_truncated: boolean;
  };
  stored_predictions: StoredPrediction[];
}

export interface FeatureResponse {
  tx_id: number;
  group: string;
  source: "raw" | "scaled";
  source_description: string;
  feature_names: string[];
  values: (number | null)[];
}

export interface TransactionQuery {
  split?: SplitName;
  label?: LabelName;
  time_step?: number;
  min_time_step?: number;
  max_time_step?: number;
  sort_by?: "tx_id" | "time_step";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// ---- models / compatibility ----------------------------------------------
export interface CheckResult {
  id: string;
  title: string;
  status: "pass" | "fail" | "warn" | "skipped";
  detail: string;
  blocking: boolean;
}

export interface ModelStatus {
  model_id: string;
  family: string;
  title: string;
  kind: "gnn" | "tabular";
  feature_set: string | null;
  edge_mode: string | null;
  threshold: number | null;
  threshold_rule: string | null;
  thresholds: Record<string, number>;
  seeds: string[];
  status: "unverified" | "available" | "unavailable";
  reasons: string[];
  requires_graph_context: boolean;
  reproduction_of_stored_scores: "reproduced" | "no_stored_scores" | "not_checked";
  checks: CheckResult[];
  config: Record<string, unknown>;
}

export interface CompatibilityReport {
  package: string;
  package_found: boolean;
  package_location: string | null;
  searched_experiment_roots: string[];
  verification_run: boolean;
  verified_at: string | null;
  package_checks: CheckResult[];
  models: ModelStatus[];
  available_model_ids: string[];
}

export type EvalSplit = "validation" | "out_of_time_validation" | "test";

export interface MetricSet {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  roc_auc: number | null;
  pr_auc: number | null;
  false_positive_rate: number | null;
  false_negative_rate: number | null;
}

export interface PerformanceRecord {
  experiment: string;
  model_family: string;
  model_id: string;
  title: string;
  feature_set: string | null;
  strategy: string | null;
  split: EvalSplit;
  operating_point?: string;
  evaluation_scope: string;
  threshold: number | null;
  threshold_source: string;
  metrics: MetricSet;
  accuracy_source: "reported" | "derived_from_confusion_matrix" | "not_recorded";
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number } | null;
  n: number | null;
  n_illicit: number | null;
  selected: boolean;
  caveats: string[];
  per_fold?: Record<string, unknown>;
}

export interface PerformanceResponse {
  records: PerformanceRecord[];
  families: FamilyAvailability[];
  experiments: ExperimentInfo[];
  notes: string[];
}

// ---- predictions --------------------------------------------------------
export interface ModelPrediction {
  model_id: string;
  model_family: string;
  model_title: string;
  feature_set: string | null;
  edge_mode: string | null;
  probability: number;
  threshold: number;
  threshold_rule: string | null;
  predicted_label: "illicit" | "licit";
  per_seed_probability: Record<string, number> | null;
  used_graph_context: boolean;
  reproduction_of_stored_scores: string;
}

export interface TransactionPredictionResponse {
  tx_id: number;
  time_step: number;
  ground_truth_label: LabelName;
  evaluation_context: string;
  graph: { in_degree: number; out_degree: number; note: string | null };
  predictions: ModelPrediction[];
  note: string;
}

export interface CsvResultRow {
  row: number;
  tx_id: number;
  time_step?: number | null;
  probability: number;
  predicted_label: "illicit" | "licit";
  ground_truth_label: LabelName | null;
  in_dataset: boolean;
  evaluation_context?: string;
}

export interface CsvRejectedRow {
  row: number;
  tx_id?: number;
  reason: string;
}

export interface CsvPredictionResponse {
  model: { model_id: string; family: string; title: string; feature_set: string | null; edge_mode: string | null; threshold: number; threshold_rule: string | null; seeds: string[] };
  mode: "graph_lookup" | "tabular_features";
  note: string;
  summary: {
    rows_submitted: number;
    rows_predicted: number;
    rows_rejected: number;
    predicted_licit: number;
    predicted_illicit: number;
    predicted_illicit_rate: number | null;
  };
  results: CsvResultRow[];
  rejected: CsvRejectedRow[];
  rejected_total: number;
  disclaimer: string;
}

// ---- graph ----------------------------------------------------------------
export interface GraphStats {
  nodes: number;
  edges: number;
  directed: boolean;
  edge_semantics: string;
  self_loops: number;
  cross_time_step_edges: number;
  in_degree: { min: number; median: number; p99: number; max: number };
  out_degree: { min: number; median: number; p99: number; max: number };
  isolated_nodes: number;
  in_degree_zero_nodes: number;
  out_degree_zero_nodes: number;
  nodes_per_time_step: Record<string, number>;
  data_verified_against_step2: boolean;
}

export interface GraphNodeInfo {
  tx_id: number;
  time_step: number;
  split: SplitName;
  ground_truth_label: LabelName;
  in_degree: number;
  out_degree: number;
}

export interface NeighborItem extends GraphNodeInfo {
  relation: "parent" | "child";
}

export interface NeighborPage extends Page<NeighborItem> {
  tx_id: number;
  direction: "in" | "out" | "both";
}

export interface CyNodeData extends GraphNodeInfo {
  id: string;
  label: string;
  depth: number;
  is_center: boolean;
  predicted_label?: "illicit" | "licit";
  probability?: number;
  overlay_model?: string;
  overlay_source?: string;
}

export interface CyNode {
  data: CyNodeData;
  classes: string;
}

export interface CyEdge {
  data: { id: string; source: string; target: string };
}

export interface Neighborhood {
  center: number;
  depth: number;
  direction: "in" | "out" | "both";
  limits: { max_nodes: number; max_edges: number };
  node_count: number;
  edge_count: number;
  truncated: { nodes: boolean; edges: boolean };
  elements: { nodes: CyNode[]; edges: CyEdge[] };
  note: string;
  overlay_note?: string;
}

export interface NeighborhoodQuery {
  depth?: number;
  direction?: "in" | "out" | "both";
  max_nodes?: number;
  max_edges?: number;
  overlay?: string;
}

// ---- alerts ----------------------------------------------------------------
export interface Alert {
  alert_id: string;
  origin: "stored_prediction_output" | "session_prediction";
  tx_id: number;
  severity: Severity;
  probability: number;
  threshold: number | null;
  model_id: string;
  model_family: string | null;
  time_step: number | null;
  split?: string | null;
  timestamp: string | null;
  source_generated_utc?: string | null;
  evaluation_context: string | null;
  ground_truth_label: LabelName | null;
}

export interface AlertPage extends Page<Alert> {
  severity_counts: Record<Severity, number>;
  sources_used: string[];
  storage_note: string;
}

export interface AlertSource {
  source_id: string;
  experiment: string;
  model_id: string;
  model_family: string;
  split: string;
  threshold: number | null;
  generated_utc: string | null;
  default: boolean;
}

export interface AlertQuery {
  origin?: "stored" | "session" | "all";
  source?: string;
  severity?: Severity;
  min_probability?: number;
  time_step?: number;
  model_family?: string;
  tx_id?: number;
  sort_by?: "probability" | "tx_id" | "time_step" | "severity" | "timestamp";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
