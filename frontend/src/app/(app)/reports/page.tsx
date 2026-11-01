"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { missions as missionsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Mission } from "@/types";

export default function ReportsPage() {
  const [completed, setCompleted] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    missionsApi.list()
      .then((r) => setCompleted(r.missions.filter((m) => m.status === "completed" || m.status === "partially_completed")))
      .catch(() => setCompleted([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Intelligence Reports" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Intelligence Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Reports generated from completed missions.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : completed.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No reports yet</h3>
              <p className="text-sm text-muted-foreground">Complete a mission to generate an intelligence report.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completed.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}?tab=report`}>
                  <Card className="shadow-none hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="h-9 w-9 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                            <FileText className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{m.title}</div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.objective}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(m.completed_at || m.updated_at)}
                            </div>
                          </div>
                        </div>
                        <Badge variant={m.status === "completed" ? "success" : "warning"}>
                          {m.status === "completed" ? "Final" : "Partial"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
