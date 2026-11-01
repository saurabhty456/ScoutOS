import Link from "next/link";
import {
  Zap, Search, Globe, Bot, MonitorCheck, MousePointer,
  ArrowRight, CheckCircle2, TrendingUp, Shield, BarChart3, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    name: "TinySearch",
    role: "Web Discovery",
    description: "Discover competitors, partners, pricing pages, and market sources from a single query.",
    icon: Search,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    name: "TinyFetch",
    role: "Content Extraction",
    description: "Pull structured facts from any public webpage — prices, features, team info, policies.",
    icon: Globe,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    name: "TinyAgent",
    role: "Autonomous Research",
    description: "Deploy a goal-directed AI agent to investigate competitors with multi-step web navigation.",
    icon: Bot,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    name: "TinyBrowser",
    role: "Controlled Automation",
    description: "Run approved browser workflows — navigate, interact, and capture evidence from real pages.",
    icon: MousePointer,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    name: "TinyMonitor",
    role: "Continuous Monitoring",
    description: "Watch selected pages and topics for changes. Get alerted when a competitor updates pricing.",
    icon: MonitorCheck,
    color: "text-red-600",
    bg: "bg-red-50",
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
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <nav className="border-b border-border sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">ScoutOS</span>
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
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <Badge variant="info" className="mb-5 text-xs font-medium">AUTONOMOUS BUSINESS INTELLIGENCE</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.15] mb-5">
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

          {/* Social proof line */}
          <div className="flex items-center gap-6 mt-10">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Source-backed findings</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>5 AI capabilities unified</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Continuous monitoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* Example missions */}
      <section className="border-y border-border bg-secondary/30 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Example missions</p>
          <div className="flex flex-wrap gap-2">
            {exampleMissions.map((m) => (
              <span
                key={m}
                className="flex items-center gap-1.5 text-sm border border-border bg-white rounded-full px-3 py-1.5 text-foreground"
              >
                <ChevronRight className="h-3 w-3 text-primary" />
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold mb-2">How it works</h2>
        <p className="text-muted-foreground mb-12">From a business question to structured intelligence in minutes.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="relative">
              <div className="text-xs font-mono text-muted-foreground mb-3">{step}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Five products */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-2">Five capabilities. One workflow.</h2>
          <p className="text-muted-foreground mb-12">ScoutOS orchestrates five distinct TinyFish intelligence capabilities to give you depth no single tool can provide.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(({ name, role, description, icon: Icon, color, bg }) => (
              <div key={name} className="bg-white rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
                <div className={`h-9 w-9 rounded-md ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm">{name}</span>
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
            <h2 className="text-2xl font-bold mb-4">Evidence-backed intelligence</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every claim in a ScoutOS report traces back to its source. We distinguish facts extracted directly from pages, inferences drawn from evidence, and hypotheses that need further validation.
            </p>
            <div className="space-y-3">
              {[
                { label: "FACT", desc: "Directly extracted from source", color: "bg-emerald-100 text-emerald-700" },
                { label: "INFERENCE", desc: "Interpreted from available evidence", color: "bg-blue-100 text-blue-700" },
                { label: "HYPOTHESIS", desc: "Possible opportunity for validation", color: "bg-purple-100 text-purple-700" },
                { label: "UNKNOWN", desc: "Could not be established", color: "bg-gray-100 text-gray-600" },
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
              <div key={title} className="flex gap-4 p-4 rounded-lg border border-border">
                <div className="h-8 w-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
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
      <section className="border-t border-border bg-primary py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Start your first intelligence mission</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Describe a business goal. ScoutOS handles the research.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
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
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span>ScoutOS</span>
          </div>
          <span>Powered by TinyFish</span>
        </div>
      </footer>
    </div>
  );
}
