"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Loader2, Crosshair, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { missions as missionsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Mission } from "@/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
  completed: "success",
  partially_completed: "warning",
  failed: "destructive",
  cancelled: "secondary",
  draft: "secondary",
  queued: "info",
  discovering: "info",
  extracting: "info",
  investigating: "info",
  analyzing: "info",
  generating_report: "info",
  planning: "info",
};

export default function MissionsPage() {
  const [list, setList] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    missionsApi.list()
      .then((r) => setList(r.missions))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Missions" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold">Intelligence Missions</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loading ? "Loading..." : `${list.length} mission${list.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link href="/missions/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Mission
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <Crosshair className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-medium mb-1">No missions yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first intelligence mission. Describe a business goal and ScoutOS handles the research.
              </p>
              <Link href="/missions/new">
                <Button className="gap-2"><Plus className="h-4 w-4" /> Create Mission</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}`}>
                  <div className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm group-hover:text-primary transition-colors">{m.title}</div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{m.objective}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(m.created_at)}
                        </span>
                        {m.input_parameters?.industry && (
                          <span className="bg-secondary rounded px-1.5 py-0.5 text-[10px] font-medium">{m.input_parameters.industry}</span>
                        )}
                        {m.input_parameters?.include_monitoring && (
                          <span className="text-purple-400 text-[10px] font-medium">Monitoring</span>
                        )}
                        {m.input_parameters?.include_browser_action && (
                          <span className="text-orange-400 text-[10px] font-medium">Browser Action</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={STATUS_VARIANTS[m.status] || "secondary"} className="capitalize">
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
