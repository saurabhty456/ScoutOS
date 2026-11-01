"use client";
import { useEffect, useState } from "react";
import { MousePointer, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { actions as actionsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { BrowserAction } from "@/types";

export default function ActionsPage() {
  const [list, setList] = useState<BrowserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    actionsApi.list()
      .then((r) => setList(r.actions))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const updated = await actionsApi.approve(id);
      setList((prev) => prev.map((a) => a.id === id ? updated : a));
    } catch {}
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      const updated = await actionsApi.reject(id);
      setList((prev) => prev.map((a) => a.id === id ? updated : a));
    } catch {}
    setProcessing(null);
  };

  const handleRetry = async (id: string) => {
    setProcessing(id);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/actions/${id}/retry`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("scout_token")}`,
          "Content-Type": "application/json",
        },
      });
      if (resp.ok) {
        const updated = await resp.json();
        setList((prev) => prev.map((a) => a.id === id ? updated : a));
      }
    } catch {}
    setProcessing(null);
  };

  const statusBadge = (s: BrowserAction["execution_status"]) => {
    const map: Record<string, { variant: "success" | "warning" | "info" | "destructive" | "secondary"; label: string }> = {
      completed: { variant: "success", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
      executing: { variant: "info", label: "Executing" },
      pending_approval: { variant: "warning", label: "Awaiting Approval" },
      approved: { variant: "info", label: "Approved" },
      rejected: { variant: "secondary", label: "Rejected" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    };
    const item = map[s] || { variant: "secondary" as const, label: s };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Action Center" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Action Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Review and approve browser workflow actions before they execute.</p>
          </div>

          {/* Safety notice */}
          <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              Browser actions interact with real websites. Review each proposed step carefully before approving. Consequential or irreversible actions require explicit approval.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16">
              <MousePointer className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No actions yet</h3>
              <p className="text-sm text-muted-foreground">Browser workflow actions from your missions will appear here for review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((action) => (
                <Card key={action.id} className="shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{action.action_type}</span>
                          {statusBadge(action.execution_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">Target: {action.target}</p>
                      </div>
                      {action.approval_status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(action.id)}
                            disabled={processing === action.id}
                            className="gap-1.5 h-7 text-xs"
                          >
                            {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(action.id)}
                            disabled={processing === action.id}
                            className="gap-1.5 h-7 text-xs text-destructive"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                      {action.execution_status === "failed" && (
                        <div className="shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleRetry(action.id)}
                            disabled={processing === action.id}
                            className="gap-1.5 h-7 text-xs"
                          >
                            {processing === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Proposed steps */}
                    {action.proposed_steps?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Proposed steps</p>
                        <div className="space-y-1">
                          {action.proposed_steps.map((step, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="text-muted-foreground font-mono">{i + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {action.result_summary && (
                      <div className="p-2.5 rounded bg-secondary/50 text-xs text-muted-foreground">
                        Result: {action.result_summary}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(action.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
