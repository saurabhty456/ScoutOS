"use client";
import { useEffect, useState } from "react";
import { Bell, Plus, Pause, Play, Loader2, Globe, Search as SearchIcon, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Topbar } from "@/components/layout/topbar";
import { monitors as monitorsApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Monitor } from "@/types";

export default function MonitorsPage() {
  const [list, setList] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", monitor_type: "page" as "page" | "topic", purpose: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    monitorsApi.list()
      .then((r) => setList(r.monitors))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePause = async (id: string) => {
    try {
      const updated = await monitorsApi.pause(id);
      setList((prev) => prev.map((m) => m.id === id ? updated : m));
    } catch {}
  };

  const handleResume = async (id: string) => {
    try {
      const updated = await monitorsApi.resume(id);
      setList((prev) => prev.map((m) => m.id === id ? updated : m));
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.target.trim()) { setError("Target is required."); return; }
    setSaving(true);
    setError("");
    try {
      const mon = await monitorsApi.create({
        name: form.name || `Monitor: ${form.target.slice(0, 40)}`,
        target: form.target,
        monitor_type: form.monitor_type,
        purpose: form.purpose || undefined,
        schedule_cron: "0 9 * * *",
      });
      setList((prev) => [mon, ...prev]);
      setCreating(false);
      setForm({ name: "", target: "", monitor_type: "page", purpose: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create monitor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Monitors" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold">Monitoring Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track pages and topics for changes over time.</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setCreating(!creating)}>
              <Plus className="h-4 w-4" /> New Monitor
            </Button>
          </div>

          {/* Create form */}
          {creating && (
            <Card className="shadow-none mb-5 border-primary/20">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Create Monitor</CardTitle></CardHeader>
              <CardContent className="pt-0">
                {error && <div className="mb-3 p-2 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Type</label>
                      <div className="flex gap-2">
                        {["page", "topic"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm({ ...form, monitor_type: t as "page" | "topic" })}
                            className={`flex-1 text-xs py-1.5 rounded border font-medium transition-colors ${
                              form.monitor_type === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"
                            }`}
                          >
                            {t === "page" ? "Page monitor" : "Topic monitor"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Name (optional)</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Competitor pricing watch" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      {form.monitor_type === "page" ? "Page URL" : "Search query"} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={form.target}
                      onChange={(e) => setForm({ ...form, target: e.target.value })}
                      placeholder={form.monitor_type === "page" ? "https://competitor.com/pricing" : "AI meeting assistant pricing 2024"}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Purpose / alert condition (optional)</label>
                    <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Notify me if the monthly price drops below $50" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving} className="gap-2">
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Create Monitor
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Monitor list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No monitors yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Set up a monitor to track competitor pages or market topics for changes.</p>
              <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create first monitor
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((m) => (
                <Card key={m.id} className="shadow-none hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                          {m.monitor_type === "page"
                            ? <Globe className="h-4 w-4 text-muted-foreground" />
                            : <SearchIcon className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm">{m.name}</span>
                            <Badge variant={m.status === "active" ? "success" : m.status === "paused" ? "secondary" : "destructive"} className="text-[10px]">
                              {m.status}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">{m.monitor_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{m.target}</p>
                          {m.purpose && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Watching for: {m.purpose}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {m.last_checked_at ? `Last run ${formatRelativeTime(m.last_checked_at)}` : "Not yet run"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {m.status === "active" ? (
                          <Button variant="outline" size="sm" onClick={() => handlePause(m.id)} className="gap-1.5 h-7 text-xs">
                            <Pause className="h-3 w-3" /> Pause
                          </Button>
                        ) : m.status === "paused" ? (
                          <Button variant="outline" size="sm" onClick={() => handleResume(m.id)} className="gap-1.5 h-7 text-xs">
                            <Play className="h-3 w-3" /> Resume
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Error
                          </Button>
                        )}
                      </div>
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
