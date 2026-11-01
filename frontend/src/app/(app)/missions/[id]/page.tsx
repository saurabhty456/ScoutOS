"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play, XCircle, RefreshCw, ExternalLink, Clock,
  CheckCircle2, AlertCircle, Loader2, Search, Globe,
  Bot, MousePointer, MonitorCheck, ChevronRight,
  FileText, Activity, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Topbar } from "@/components/layout/topbar";
import { missions as missionsApi } from "@/lib/api";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Mission, MissionStep, Source, Finding, Report } from "@/types";

const TABS = ["Overview", "Research", "Evidence", "Report", "Activity"] as const;
type Tab = typeof TABS[number];

function stepIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    search: <Search className="h-3.5 w-3.5" />,
    fetch: <Globe className="h-3.5 w-3.5" />,
    agent: <Bot className="h-3.5 w-3.5" />,
    browser: <MousePointer className="h-3.5 w-3.5" />,
    monitor: <MonitorCheck className="h-3.5 w-3.5" />,
    analysis: <Activity className="h-3.5 w-3.5" />,
    report: <FileText className="h-3.5 w-3.5" />,
  };
  return map[type] || <Activity className="h-3.5 w-3.5" />;
}

function stepLabel(type: string): string {
  const map: Record<string, string> = {
    search: "TinySearch — Web Discovery",
    fetch: "TinyFetch — Content Extraction",
    agent: "TinyAgent — Autonomous Research",
    browser: "TinyBrowser — Browser Automation",
    monitor: "TinyMonitor — Setup Monitoring",
    analysis: "Analysis Engine",
    report: "Report Generation",
  };
  return map[type] || type;
}

function statusColor(status: string) {
  if (status === "completed") return "text-emerald-600";
  if (status === "running") return "text-blue-600";
  if (status === "failed") return "text-destructive";
  if (status === "skipped") return "text-muted-foreground";
  return "text-muted-foreground";
}

function missionProgress(status: Mission["status"]): number {
  const map: Record<string, number> = {
    draft: 0, queued: 5, planning: 10, discovering: 25,
    extracting: 45, investigating: 60, validating: 70,
    analyzing: 80, generating_report: 90, monitoring_setup: 95,
    completed: 100, partially_completed: 100, failed: 100, cancelled: 0,
  };
  return map[status] || 0;
}

function isRunning(status: Mission["status"]) {
  return ["queued", "planning", "discovering", "extracting", "investigating", "validating", "analyzing", "generating_report", "monitoring_setup"].includes(status);
}

function verificationBadge(v: string) {
  const map: Record<string, { label: string; variant: "success" | "info" | "purple" | "warning" | "secondary" }> = {
    verified: { label: "FACT", variant: "success" },
    corroborated: { label: "VERIFIED", variant: "success" },
    inferred: { label: "INFERENCE", variant: "info" },
    conflicting: { label: "CONFLICTING", variant: "warning" },
    unverified: { label: "UNVERIFIED", variant: "secondary" },
    unavailable: { label: "UNKNOWN", variant: "secondary" },
  };
  const s = map[v] || { label: v.toUpperCase(), variant: "secondary" as const };
  return <Badge variant={s.variant} className="text-[10px] font-bold">{s.label}</Badge>;
}

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [m, s, src, f] = await Promise.all([
        missionsApi.get(id),
        missionsApi.steps(id).catch(() => ({ steps: [] })),
        missionsApi.sources(id).catch(() => ({ sources: [] })),
        missionsApi.findings(id).catch(() => ({ findings: [] })),
      ]);
      setMission(m);
      setSteps(s.steps);
      setSources(src.sources);
      setFindings(f.findings);
      if (m.status === "completed" || m.status === "partially_completed") {
        missionsApi.report(id).then(setReport).catch(() => null);
      }
    } catch {
      router.push("/missions");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll while running
  useEffect(() => {
    if (!mission || !isRunning(mission.status)) return;
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, [mission, fetchAll]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await missionsApi.start(id);
      await fetchAll();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await missionsApi.cancel(id);
      await fetchAll();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="Mission" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!mission) return null;

  const running = isRunning(mission.status);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title={truncate(mission.title, 50)} />
      <main className="flex-1 overflow-y-auto">
        {/* Mission header */}
        <div className="border-b border-border bg-white px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                  <Link href="/missions" className="hover:text-foreground">Missions</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium truncate max-w-xs">{mission.title}</span>
                </div>
                <h1 className="text-lg font-semibold">{mission.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{mission.objective}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {mission.status === "draft" && (
                  <Button size="sm" onClick={handleStart} disabled={actionLoading} className="gap-1.5">
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Start Mission
                  </Button>
                )}
                {running && (
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={actionLoading} className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}
                {(mission.status === "failed" || mission.status === "partially_completed") && (
                  <Button size="sm" variant="outline" onClick={handleStart} disabled={actionLoading} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                )}
              </div>
            </div>

            {/* Progress */}
            {running && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="capitalize">{mission.status.replace("_", " ")}…</span>
                  <span>{missionProgress(mission.status)}%</span>
                </div>
                <Progress value={missionProgress(mission.status)} className="h-1" />
              </div>
            )}

            {/* Status + meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                {running ? <Loader2 className="h-3 w-3 animate-spin text-blue-500" /> :
                  mission.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                  mission.status === "failed" ? <AlertCircle className="h-3 w-3 text-destructive" /> :
                  <Clock className="h-3 w-3" />}
                <span className="capitalize font-medium text-foreground">{mission.status.replace(/_/g, " ")}</span>
              </div>
              <span>·</span>
              <span>{formatRelativeTime(mission.created_at)}</span>
              {sources.length > 0 && <><span>·</span><span>{sources.length} sources</span></>}
              {findings.length > 0 && <><span>·</span><span>{findings.length} findings</span></>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex gap-0">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                  {t === "Research" && sources.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5">{sources.length}</span>
                  )}
                  {t === "Evidence" && findings.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5">{findings.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-5xl mx-auto px-6 py-6">

          {/* OVERVIEW */}
          {tab === "Overview" && (
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Execution steps */}
                <Card className="shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Execution Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {steps.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">
                        {mission.status === "draft" ? "Start the mission to begin execution." : "No steps recorded yet."}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {steps.map((step) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary/30">
                            <div className={`mt-0.5 ${statusColor(step.status)}`}>
                              {step.status === "running" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : step.status === "completed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : step.status === "failed" ? (
                                <AlertCircle className="h-3.5 w-3.5" />
                              ) : (
                                <div className={`h-3.5 w-3.5 rounded-full border-2 ${step.status === "pending" ? "border-border" : "border-current"}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-muted-foreground ${statusColor(step.status)}`}>{stepIcon(step.step_type)}</span>
                                <span className="text-sm font-medium">{stepLabel(step.step_type)}</span>
                                <Badge variant={
                                  step.status === "completed" ? "success" :
                                  step.status === "running" ? "info" :
                                  step.status === "failed" ? "destructive" : "secondary"
                                } className="ml-auto text-[10px]">
                                  {step.status}
                                </Badge>
                              </div>
                              {step.output_summary && (
                                <p className="text-xs text-muted-foreground mt-1">{step.output_summary}</p>
                              )}
                              {step.error_code && (
                                <p className="text-xs text-destructive mt-1">{step.error_code}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Error summary */}
                {mission.error_summary && (
                  <Card className="shadow-none border-destructive/20">
                    <CardContent className="p-4">
                      <div className="flex gap-2.5">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-destructive mb-1">Mission error</div>
                          <p className="text-sm text-muted-foreground">{mission.error_summary}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                {/* Mission details */}
                <Card className="shadow-none">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {[
                      { label: "Status", value: mission.status.replace(/_/g, " ") },
                      { label: "Created", value: formatRelativeTime(mission.created_at) },
                      mission.started_at && { label: "Started", value: formatRelativeTime(mission.started_at) },
                      mission.completed_at && { label: "Completed", value: formatRelativeTime(mission.completed_at) },
                      mission.input_parameters.industry && { label: "Industry", value: mission.input_parameters.industry },
                      mission.input_parameters.geographic_scope && { label: "Geography", value: mission.input_parameters.geographic_scope },
                    ].filter(Boolean).map((item) => item && (
                      <div key={item.label} className="flex items-start justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-right capitalize">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick links */}
                {(sources.length > 0 || findings.length > 0 || report) && (
                  <Card className="shadow-none">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Access</CardTitle></CardHeader>
                    <CardContent className="pt-0 space-y-1.5">
                      {sources.length > 0 && (
                        <button onClick={() => setTab("Research")} className="w-full text-left flex items-center gap-2 text-sm p-2 rounded hover:bg-secondary">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{sources.length} sources discovered</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                        </button>
                      )}
                      {findings.length > 0 && (
                        <button onClick={() => setTab("Evidence")} className="w-full text-left flex items-center gap-2 text-sm p-2 rounded hover:bg-secondary">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{findings.length} findings recorded</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                        </button>
                      )}
                      {report && (
                        <button onClick={() => setTab("Report")} className="w-full text-left flex items-center gap-2 text-sm p-2 rounded hover:bg-secondary">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Intelligence report ready</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* RESEARCH */}
          {tab === "Research" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{sources.length} Sources Discovered</h2>
              </div>
              {sources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sources discovered yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <Card key={s.id} className="shadow-none hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-sm">{s.title || s.domain}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{s.domain}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {s.source_type && (
                                  <Badge variant="secondary" className="text-[10px]">{s.source_type.replace("_", " ")}</Badge>
                                )}
                                {s.extraction_status && (
                                  <Badge variant={s.extraction_status === "extracted" ? "success" : s.extraction_status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                                    {s.extraction_status}
                                  </Badge>
                                )}
                                <a href={s.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                            {s.snippet && (
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{s.snippet}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EVIDENCE */}
          {tab === "Evidence" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{findings.length} Findings</h2>
              </div>
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No findings extracted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {findings.map((f) => (
                    <Card key={f.id} className="shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {verificationBadge(f.verification_status)}
                              <Badge variant="secondary" className="text-[10px]">{f.category}</Badge>
                              <Badge variant={f.confidence === "high" ? "success" : f.confidence === "medium" ? "warning" : "secondary"} className="text-[10px]">
                                {f.confidence} confidence
                              </Badge>
                            </div>
                            <p className="text-sm">{f.claim}</p>
                            {f.evidence_excerpt && (
                              <blockquote className="mt-2 pl-3 border-l-2 border-border text-xs text-muted-foreground italic">
                                "{f.evidence_excerpt}"
                              </blockquote>
                            )}
                            {f.source_url && (
                              <a href={f.source_url} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORT */}
          {tab === "Report" && (
            <div>
              {!report ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {mission.status === "completed" || mission.status === "partially_completed"
                      ? "Report is being generated…"
                      : "The report will be generated when the mission completes."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{report.title}</h2>
                    <p className="text-xs text-muted-foreground">Generated {formatRelativeTime(report.generated_at)}</p>
                  </div>

                  {/* Executive summary */}
                  <Card className="shadow-none">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Executive Summary</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed">{report.executive_summary}</p>
                    </CardContent>
                  </Card>

                  {/* Key findings */}
                  {report.structured_content.key_findings?.length > 0 && (
                    <Card className="shadow-none">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Key Findings</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {report.structured_content.key_findings.map((f, i) => (
                          <div key={i} className="flex gap-2.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Competitor table */}
                  {report.structured_content.competitor_comparison?.length > 0 && (
                    <Card className="shadow-none">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Competitor Comparison</CardTitle></CardHeader>
                      <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-xs text-muted-foreground">
                                <th className="text-left pb-2 pr-4 font-medium">Company</th>
                                <th className="text-left pb-2 pr-4 font-medium">Pricing</th>
                                <th className="text-left pb-2 pr-4 font-medium">Target Audience</th>
                                <th className="text-left pb-2 font-medium">Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.structured_content.competitor_comparison.map((c, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                  <td className="py-3 pr-4">
                                    <div className="font-medium">{c.name}</div>
                                    <a href={c.website} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline">{c.website}</a>
                                  </td>
                                  <td className="py-3 pr-4 text-muted-foreground">{c.pricing || "—"}</td>
                                  <td className="py-3 pr-4 text-muted-foreground">{c.target_audience || "—"}</td>
                                  <td className="py-3">
                                    <Badge variant={c.confidence === "high" ? "success" : c.confidence === "medium" ? "warning" : "secondary"} className="text-[10px]">
                                      {c.confidence}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {report.structured_content.recommendations?.length > 0 && (
                    <Card className="shadow-none">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {report.structured_content.recommendations.map((r, i) => (
                          <div key={i} className="p-3 rounded-md bg-secondary/40">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{r.title}</span>
                              <Badge variant={r.type === "fact" ? "success" : r.type === "inference" ? "info" : "purple"} className="text-[10px] font-bold uppercase">
                                {r.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{r.description}</p>
                            {r.evidence && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic">Evidence: {r.evidence}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Next steps */}
                  {report.structured_content.next_steps?.length > 0 && (
                    <Card className="shadow-none">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Recommended Next Steps</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {report.structured_content.next_steps.map((s, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Missing info */}
                  {report.structured_content.missing_information?.length > 0 && (
                    <Card className="shadow-none border-amber-200">
                      <CardHeader className="pb-3"><CardTitle className="text-sm text-amber-700">Information Gaps</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-1.5">
                        {report.structured_content.missing_information.map((m, i) => (
                          <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Sources */}
                  {report.structured_content.sources?.length > 0 && (
                    <Card className="shadow-none">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Sources</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {report.structured_content.sources.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-xs text-muted-foreground font-mono">[{i + 1}]</span>
                            <div>
                              <a href={s.url} target="_blank" rel="noopener noreferrer"
                                className="text-primary hover:underline">{s.title || s.url}</a>
                              <div className="text-xs text-muted-foreground">{s.retrieved_at}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY */}
          {tab === "Activity" && (
            <div>
              <h2 className="text-sm font-semibold mb-4">Activity Log</h2>
              {steps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No activity yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.id} className="flex gap-3 text-sm">
                      <div className={`mt-1 ${statusColor(step.status)}`}>
                        {stepIcon(step.step_type)}
                      </div>
                      <div className="flex-1 pb-3 border-b border-border last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stepLabel(step.step_type)}</span>
                          <span className="text-xs text-muted-foreground">
                            {step.started_at ? formatRelativeTime(step.started_at) : "—"}
                          </span>
                        </div>
                        {step.input_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5">Input: {step.input_summary}</p>
                        )}
                        {step.output_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5">Output: {step.output_summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
