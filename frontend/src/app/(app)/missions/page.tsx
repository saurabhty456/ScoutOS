"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, Loader2, Crosshair } from "lucide-react";
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
  discovering: "info",
  extracting: "info",
  investigating: "info",
  analyzing: "info",
  generating_report: "info",
  planning: "info",
  draft: "secondary",
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
                {loading ? "Loading…" : `${list.length} mission${list.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link href="/missions/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Mission
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16">
              <Crosshair className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No missions yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create your first intelligence mission to get started.</p>
              <Link href="/missions/new">
                <Button className="gap-2"><Plus className="h-4 w-4" /> Create Mission</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}`}>
                  <div className="flex items-start justify-between p-4 rounded-lg border border-border bg-white hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-medium text-sm mb-0.5">{m.title}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{m.objective}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(m.created_at)}
                        </span>
                        {m.input_parameters?.industry && (
                          <span className="bg-secondary rounded px-1.5 py-0.5">{m.input_parameters.industry}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={STATUS_VARIANTS[m.status] || "secondary"} className="capitalize">
                        {m.status.replace(/_/g, " ")}
                      </Badge>
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
