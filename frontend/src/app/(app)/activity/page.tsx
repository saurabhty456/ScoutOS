"use client";
import { Activity, Clock } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

export default function ActivityPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Activity" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All workspace events and audit trail.</p>
          </div>
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Activity events will appear here as you run missions.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
