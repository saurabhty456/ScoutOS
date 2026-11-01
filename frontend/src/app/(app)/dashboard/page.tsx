"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crosshair, Bell, BarChart3, TrendingUp,
  Plus, ArrowRight, Clock, CheckCircle2, Loader2,
  Search, Globe, Bot, MousePointer, MonitorCheck,
  Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { missions as missionsApi, monitors as monitorsApi } from "@/lib/api";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Mission, Monitor } from "@/types";

const TEMPLATES = [
  { id: "competitor", label: "Competitor Analysis", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50", prompt: "Research competitors in [market], compare their pricing, features, and positioning." },
  { id: "market", label: "Market Opportunity", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", prompt: "Identify market gaps and underserved segments in [industry]." },
  { id: "pricing", label: "Pricing Intelligence", icon: Search, color: "text-purple-600", bg: "bg-purple-50", prompt: "Compare pricing models across leading [product type] tools." },
  { id: "partner", label: "Partner Discovery", icon: Globe, color: "text-orange-600", bg: "bg-orange-50", prompt: "Find potential distribution partners and resellers for [product]." },
];

function statusBadge(status: Mission["status"]) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" }> = {
    completed: { label: "Completed", variant: "success" },
    partially_completed: { label: "Partial", variant: "warning" },
    failed: { label: "Failed", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "secondary" },
    draft: { label: "Draft", variant: "secondary" },
    queued: { label: "Queued", variant: "info" },
    discovering: { label: "Discovering", variant: "info" },
    extracting: { label: "Extracting", variant: "info" },
    investigating: { label: "Investigating", variant: "info" },
    analyzing: { label: "Analyzing", variant: "info" },
    generating_report: { label: "Reporting", variant: "info" },
    planning: { label: "Planning", variant: "info" },
  };
  const s = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [missionList, setMissionList] = useState<Mission[]>([]);
  const [monitorList, setMonitorList] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      missionsApi.list().catch(() => ({ missions: [] })),
      monitorsApi.list().catch(() => ({ monitors: [] })),
    ]).then(([m, mon]) => {
      setMissionList(m.missions);
      setMonitorList(mon.monitors);
      setLoading(false);
    });
  }, []);

  const active = missionList.filter((m) =>
    ["discovering", "extracting", "investigating", "analyzing", "generating_report", "planning", "queued"].includes(m.status)
  );
  const completed = missionList.filter((m) => m.status === "completed" || m.status === "partially_completed");
  const activeMonitors = monitorList.filter((m) => m.status === "active");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Overview" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Intelligence Workspace</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your research missions, monitors, and reports.</p>
            </div>
            <Link href="/missions/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Mission
              </Button>
            </Link>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Missions", value: active.length, icon: Crosshair, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Active Monitors", value: activeMonitors.length, icon: Bell, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Total Missions", value: missionList.length, icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="shadow-none hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    <div className={`h-7 w-7 rounded-md ${bg} flex items-center justify-center`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">{loading ? "-" : value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent missions */}
            <div className="lg:col-span-2">
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Recent Missions</CardTitle>
                    <Link href="/missions">
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : missionList.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium mb-1">Start your first mission</p>
                      <p className="text-xs text-muted-foreground mb-4">Describe a business goal and ScoutOS handles the research.</p>
                      <Link href="/missions/new">
                        <Button size="sm" className="gap-2">
                          <Plus className="h-3.5 w-3.5" /> New Mission
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {missionList.slice(0, 6).map((m) => (
                        <Link key={m.id} href={`/missions/${m.id}`}>
                          <div className="flex items-start justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{m.title}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(m.created_at)}
                                {m.input_parameters?.industry && (
                                  <>
                                    <span>·</span>
                                    <span>{m.input_parameters.industry}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="ml-3 shrink-0">{statusBadge(m.status)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Active monitors */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Monitors</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {activeMonitors.length === 0 ? (
                    <div className="text-center py-6">
                      <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No active monitors</p>
                      <Link href="/monitors">
                        <Button variant="ghost" size="sm" className="text-xs mt-2">Set up monitoring</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activeMonitors.slice(0, 4).map((m) => (
                        <Link key={m.id} href="/monitors">
                          <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs truncate">{truncate(m.name, 32)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2.5">
                  {[
                    { icon: Search, label: "TinySearch", sub: "Web discovery" },
                    { icon: Globe, label: "TinyFetch", sub: "Content extraction" },
                    { icon: Bot, label: "TinyAgent", sub: "Autonomous research" },
                    { icon: MousePointer, label: "TinyBrowser", sub: "Browser automation" },
                    { icon: MonitorCheck, label: "TinyMonitor", sub: "Continuous monitoring" },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{label}</div>
                        <div className="text-[10px] text-muted-foreground">{sub}</div>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Templates */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Start from a template</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATES.map(({ id, label, icon: Icon, color, bg, prompt }) => (
                  <button
                    key={id}
                    onClick={() => router.push(`/missions/new?template=${encodeURIComponent(prompt)}`)}
                    className="text-left p-3.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/3 transition-all"
                  >
                    <div className={`h-8 w-8 rounded-md ${bg} flex items-center justify-center mb-2.5`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{prompt}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
