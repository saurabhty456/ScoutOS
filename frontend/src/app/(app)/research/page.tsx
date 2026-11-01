"use client";
import { useState } from "react";
import { Search, Globe, ExternalLink, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { research } from "@/lib/api";
import type { Source } from "@/types";

const FILTERS = ["All", "Official Websites", "Product Pages", "Pricing Pages", "Other"];

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState("All");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await research.search(query, "Business intelligence research");
      setResults(res.results);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "All" ? results : results.filter((r) => {
    if (filter === "Official Websites") return r.source_type === "official_website";
    if (filter === "Product Pages") return r.source_type === "product_page";
    if (filter === "Pricing Pages") return r.source_type === "pricing_page";
    return r.source_type === "other" || !r.source_type;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Research Explorer" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Research Explorer</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Search the web with TinySearch and explore sources.</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                placeholder="e.g. AI meeting assistant software competitors pricing"
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </form>

          {searched && (
            <>
              {/* Filters */}
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        filter === f ? "bg-primary text-white border-primary" : "border-border hover:bg-secondary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3 text-xs text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No results found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((s) => (
                    <Card key={s.id} className="shadow-none hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-sm">{s.title || s.domain}</div>
                                <div className="text-xs text-primary mt-0.5">{s.domain}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {s.source_type && (
                                  <Badge variant="secondary" className="text-[10px]">{s.source_type.replace("_", " ")}</Badge>
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
            </>
          )}

          {!searched && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Enter a search query to discover relevant sources.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["AI meeting assistant competitors", "project management SaaS pricing", "customer support software market"].map((q) => (
                  <button key={q} onClick={() => setQuery(q)} className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
