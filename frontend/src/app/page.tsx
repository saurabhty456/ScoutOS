import Link from "next/link";
import {
  Zap, Search, Globe, Bot, MonitorCheck, MousePointer,
  ArrowRight, CheckCircle2, TrendingUp, Shield, BarChart3,
  ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    name: "TinySearch",
    role: "Web Discovery",
    description: "Discover competitors, partners, pricing pages, and market sources from a single query.",
    icon: Search,
  },
  {
    name: "TinyFetch",
    role: "Content Extraction",
    description: "Pull structured facts from any public webpage — prices, features, team info, policies.",
    icon: Globe,
  },
  {
    name: "TinyAgent",
    role: "Autonomous Research",
    description: "Deploy a goal-directed AI agent to investigate competitors with multi-step web navigation.",
    icon: Bot,
  },
  {
    name: "TinyBrowser",
    role: "Controlled Automation",
    description: "Run approved browser workflows — navigate, interact, and capture evidence from real pages.",
    icon: MousePointer,
  },
  {
    name: "TinyMonitor",
    role: "Continuous Monitoring",
    description: "Watch selected pages and topics for changes. Get alerted when a competitor updates pricing.",
    icon: MonitorCheck,
  },
];

const exampleMissions = [
  "Analyze the AI meeting-assistant market and compare 5 competitors",
  "Find pricing gaps in the project management software space",
  "Research potential distributors for a consumer hardware product",
  "Monitor three competitor pricing pages for changes this month",
  "Identify the top 10 sales prospects in the mid-market CRM space",
];

const steps = [
  { step: "01", title: "Describe your goal", desc: "Write a natural-language business objective. No query language needed." },
  { step: "02", title: "ScoutOS plans & executes", desc: "The platform builds a research workflow and runs all five intelligence tools automatically." },
  { step: "03", title: "Review evidence-backed results", desc: "Every finding links to its source. Facts, inferences, and hypotheses are clearly distinguished." },
  { step: "04", title: "Act and monitor", desc: "Approve controlled browser actions. Set monitors to track competitors for ongoing changes." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">ScoutOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 uppercase tracking-wider">Autonomous Business Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-5" style={{ letterSpacing: "-0.04em" }}>
            Your next business advantage starts with better intelligence.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            Research markets, understand competitors, uncover opportunities, and turn web intelligence into action — all from one workspace.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start a Mission <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg">Explore How It Works</Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 mt-10">
            {["Source-backed findings", "5 AI capabilities unified", "Continuous monitoring"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example missions */}
      <section className="border-y border-border py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Example missions</p>
          <div className="flex flex-wrap gap-2">
            {exampleMissions.map((m) => (
              <span key={m} className="flex items-center gap-1.5 text-sm border border-border bg-card rounded-full px-3 py-1.5 text-foreground">
                <ChevronRight className="h-3 w-3 text-primary" />
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>How it works</h2>
        <p className="text-muted-foreground mb-12">From a business question to structured intelligence in minutes.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="relative">
              <div className="text-xs font-mono text-muted-foreground mb-3">{step}</div>
              <h3 className="font-medium mb-2 text-sm">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Five products */}
      <section className="border-t border-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>Five capabilities. One workflow.</h2>
          <p className="text-muted-foreground mb-12">ScoutOS orchestrates five distinct TinyFish intelligence capabilities to give you depth no single tool can provide.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(({ name, role, description, icon: Icon }) => (
              <div key={name} className="bg-card rounded-lg border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-medium text-sm">{name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{role}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>Evidence-backed intelligence</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every claim in a ScoutOS report traces back to its source. We distinguish facts extracted directly from pages, inferences drawn from evidence, and hypotheses that need further validation.
            </p>
            <div className="space-y-3">
              {[
                { label: "FACT", desc: "Directly extracted from source", color: "bg-emerald-500/15 text-emerald-400" },
                { label: "INFERENCE", desc: "Interpreted from available evidence", color: "bg-primary/15 text-primary" },
                { label: "HYPOTHESIS", desc: "Possible opportunity for validation", color: "bg-purple-500/15 text-purple-400" },
                { label: "UNKNOWN", desc: "Could not be established", color: "bg-secondary text-muted-foreground" },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>{label}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, title: "Market Opportunity Detection", desc: "Identify gaps between what customers want and what competitors offer." },
              { icon: BarChart3, title: "Competitor Comparisons", desc: "Side-by-side pricing, features, and positioning from live sources." },
              { icon: Shield, title: "Continuous Monitoring", desc: "Track competitor changes over time with automated page and topic monitors." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>Start your first intelligence mission</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Describe a business goal. ScoutOS handles the research.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Create free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" fill="white" />
            </div>
            <span>ScoutOS</span>
          </div>
          <span>Powered by TinyFish</span>
        </div>
      </footer>
    </div>
  );
}
