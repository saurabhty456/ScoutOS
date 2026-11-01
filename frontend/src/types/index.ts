// ─── Core domain types ───────────────────────────────────────────────────────

export type MissionStatus =
  | "draft"
  | "queued"
  | "planning"
  | "discovering"
  | "extracting"
  | "investigating"
  | "validating"
  | "analyzing"
  | "generating_report"
  | "awaiting_approval"
  | "monitoring_setup"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

export type StepType =
  | "search"
  | "fetch"
  | "agent"
  | "browser"
  | "monitor"
  | "analysis"
  | "report";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  input_parameters: MissionInput;
  execution_plan?: ExecutionPlan;
  error_summary?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  steps?: MissionStep[];
  sources?: Source[];
  findings?: Finding[];
  report?: Report;
}

export interface MissionInput {
  objective: string;
  industry?: string;
  target_market?: string;
  geographic_scope?: string;
  competitors?: string[];
  reference_urls?: string[];
  deliverables?: string[];
  include_monitoring?: boolean;
  include_browser_action?: boolean;
}

export interface ExecutionPlan {
  research_questions: string[];
  source_categories: string[];
  deliverables: string[];
  tools: StepType[];
  requires_approval: boolean;
  monitoring_required: boolean;
}

export interface MissionStep {
  id: string;
  mission_id: string;
  step_type: StepType;
  provider: string;
  status: StepStatus;
  input_summary?: string;
  output_summary?: string;
  error_code?: string;
  started_at?: string;
  completed_at?: string;
}

export interface Source {
  id: string;
  url: string;
  domain: string;
  title?: string;
  source_type?: "official_website" | "product_page" | "pricing_page" | "other";
  discovered_at: string;
  extraction_status?: "pending" | "extracted" | "failed" | "unavailable";
  snippet?: string;
}

export type VerificationStatus =
  | "verified"
  | "corroborated"
  | "inferred"
  | "conflicting"
  | "unverified"
  | "unavailable";

export interface Finding {
  id: string;
  mission_id: string;
  source_id?: string;
  source_url?: string;
  category: string;
  claim: string;
  structured_value?: Record<string, unknown>;
  evidence_excerpt?: string;
  confidence: "high" | "medium" | "low";
  verification_status: VerificationStatus;
  observed_at: string;
}

export interface Report {
  id: string;
  mission_id: string;
  title: string;
  executive_summary: string;
  structured_content: ReportContent;
  status: "draft" | "final";
  generated_at: string;
}

export interface ReportContent {
  key_findings: string[];
  competitor_comparison?: CompetitorRow[];
  market_opportunities?: string[];
  recommendations: Recommendation[];
  risks_and_uncertainties: string[];
  missing_information: string[];
  next_steps: string[];
  sources: SourceReference[];
}

export interface CompetitorRow {
  name: string;
  website: string;
  pricing?: string;
  key_features: string[];
  target_audience?: string;
  positioning?: string;
  confidence: "high" | "medium" | "low";
}

export interface Recommendation {
  title: string;
  description: string;
  evidence: string;
  type: "fact" | "inference" | "hypothesis";
}

export interface SourceReference {
  title: string;
  url: string;
  retrieved_at: string;
}

export type MonitorStatus = "active" | "paused" | "failed";
export type MonitorType = "page" | "topic";

export interface Monitor {
  id: string;
  mission_id?: string;
  provider_monitor_id?: string;
  name: string;
  target: string;
  monitor_type: MonitorType;
  schedule_cron: string;
  status: MonitorStatus;
  last_checked_at?: string;
  created_at: string;
  purpose?: string;
}

export interface MonitorEvent {
  id: string;
  monitor_id: string;
  event_type: "baseline_captured" | "changed" | "no_changes" | "error";
  previous_value?: string;
  current_value?: string;
  change_summary?: string;
  evidence_url?: string;
  observed_at: string;
}

export type ActionStatus = "pending_approval" | "approved" | "rejected" | "executing" | "completed" | "failed" | "cancelled";

export interface BrowserAction {
  id: string;
  mission_id?: string;
  action_type: string;
  target: string;
  proposed_steps: string[];
  approval_status: "pending" | "approved" | "rejected";
  execution_status: ActionStatus;
  result_summary?: string;
  evidence?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}
