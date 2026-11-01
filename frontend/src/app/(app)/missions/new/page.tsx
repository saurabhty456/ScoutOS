"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Topbar } from "@/components/layout/topbar";
import { missions as missionsApi } from "@/lib/api";

const TEMPLATES = [
  {
    id: "competitor", label: "Competitor Analysis",
    prompt: "Identify competitors in [market], compare their pricing, features, and positioning. Recommend a customer segment worth targeting.",
  },
  {
    id: "market", label: "Market Opportunity",
    prompt: "Research the [industry] market. Identify underserved customer segments and gaps in current offerings. Return actionable opportunities.",
  },
  {
    id: "pricing", label: "Pricing Intelligence",
    prompt: "Compare pricing models and tiers across the top [product type] tools. Identify pricing gaps and recommend positioning.",
  },
  {
    id: "partner", label: "Partner Discovery",
    prompt: "Find potential distributors, resellers, and integration partners for a [product description] targeting [audience].",
  },
  {
    id: "prospect", label: "Sales Prospect Research",
    prompt: "Research [company name] — their product, team, recent news, and potential need for [your solution].",
  },
  {
    id: "launch", label: "Launch Research",
    prompt: "Research everything needed to launch [product] in [market]: competitors, pricing, channels, and target audience.",
  },
];

export default function NewMissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [objective, setObjective] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [geoScope, setGeoScope] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [includeMonitoring, setIncludeMonitoring] = useState(false);
  const [includeBrowser, setIncludeBrowser] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const template = searchParams.get("template");
    if (template) setObjective(template);
  }, [searchParams]);

  const addCompetitor = () => {
    if (competitorInput.trim()) {
      setCompetitors([...competitors, competitorInput.trim()]);
      setCompetitorInput("");
    }
  };

  const addUrl = () => {
    if (urlInput.trim()) {
      setReferenceUrls([...referenceUrls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) { setError("Please describe your mission objective."); return; }
    setLoading(true);
    setError("");
    try {
      const mission = await missionsApi.create({
        objective: objective.trim(),
        industry: industry || undefined,
        target_market: targetMarket || undefined,
        geographic_scope: geoScope || undefined,
        competitors: competitors.length ? competitors : undefined,
        reference_urls: referenceUrls.length ? referenceUrls : undefined,
        include_monitoring: includeMonitoring,
        include_browser_action: includeBrowser,
      });
      router.push(`/missions/${mission.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create mission");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="New Mission" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">New Intelligence Mission</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Describe your business objective in plain language. ScoutOS will plan and execute the research.
            </p>
          </div>

          {/* Templates */}
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick start</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setObjective(t.prompt)}
                  className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-secondary hover:border-primary/30 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {/* Main objective */}
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Mission objective <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Analyze the market for AI-powered meeting assistants. Identify competitors, compare their pricing and features, and recommend a customer segment worth investigating."
                className="min-h-[120px] text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Be specific about what you want to learn and the format of the output.
              </p>
            </div>

            {/* Options checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMonitoring}
                  onChange={(e) => setIncludeMonitoring(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Set up monitoring</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBrowser}
                  onChange={(e) => setIncludeBrowser(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Include browser action</span>
              </label>
            </div>

            {/* Advanced options */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => setAdvanced(!advanced)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
              >
                Advanced options (optional)
                {advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {advanced && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">Industry</label>
                      <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, FinTech" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">Target market</label>
                      <Input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} placeholder="e.g. SMBs, enterprise" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">Geographic scope</label>
                      <Input value={geoScope} onChange={(e) => setGeoScope(e.target.value)} placeholder="e.g. US, global" />
                    </div>
                  </div>

                  {/* Competitors */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Specific competitors to investigate</label>
                    <div className="flex gap-2">
                      <Input value={competitorInput} onChange={(e) => setCompetitorInput(e.target.value)} placeholder="Company name" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())} />
                      <Button type="button" variant="outline" size="sm" onClick={addCompetitor}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {competitors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {competitors.map((c) => (
                          <span key={c} className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2.5 py-1">
                            {c}
                            <button type="button" onClick={() => setCompetitors(competitors.filter((x) => x !== c))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reference URLs */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Reference URLs</label>
                    <div className="flex gap-2">
                      <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} />
                      <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {referenceUrls.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {referenceUrls.map((u) => (
                          <div key={u} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{u}</span>
                            <button type="button" onClick={() => setReferenceUrls(referenceUrls.filter((x) => x !== u))}>
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Mission
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push("/missions")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
