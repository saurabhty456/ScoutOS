"""Run the primary demonstration mission and report results."""
import urllib.request, json, time

BASE = "http://localhost:8000"

def api(path, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method=method)
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

# Auth
tok = api("/api/auth/login", "POST", {"email":"test@scoutos.dev","password":"testpass123"})["access_token"]
print("✓ Authenticated")

# Create the demo mission
mission = api("/api/missions", "POST", {
    "objective": "Analyze the market for AI-powered meeting assistants. Identify competitors offering AI-powered meeting assistants. Compare their positioning, publicly available pricing, core features, and target customers. Identify potential gaps in the market, recommend a customer segment worth investigating.",
    "industry": "SaaS / Productivity",
    "include_monitoring": True,
    "include_browser_action": True,
}, tok)
mid = mission["id"]
print(f"✓ Mission created: {mission['title']}")

# Start it
api(f"/api/missions/{mid}/start", "POST", token=tok)
print("✓ Mission started — waiting for completion (up to 3 minutes)...")

# Poll
for i in range(36):
    time.sleep(5)
    m = api(f"/api/missions/{mid}", token=tok)
    status = m["status"]
    print(f"  [{(i+1)*5}s] {status}")
    if status in ("completed", "partially_completed", "failed"):
        break

print(f"\n{'='*60}")
print(f"FINAL STATUS: {m['status']}")

# Steps
steps = api(f"/api/missions/{mid}/steps", token=tok)["steps"]
print(f"\nEXECUTION STEPS ({len(steps)}):")
for s in steps:
    icon = "✓" if s["status"] == "completed" else "✗" if s["status"] == "failed" else "○"
    print(f"  {icon} [{s['step_type']}] {s.get('output_summary','') or s.get('error_code','')}")

# Sources
sources = api(f"/api/missions/{mid}/sources", token=tok)["sources"]
print(f"\nSOURCES DISCOVERED ({len(sources)}):")
for s in sources[:8]:
    print(f"  • {s['domain']} [{s.get('source_type','?')}] — {s.get('title','')[:50]}")

# Findings
findings = api(f"/api/missions/{mid}/findings", token=tok)["findings"]
print(f"\nFINDINGS ({len(findings)}):")
for f in findings[:8]:
    print(f"  [{f['category']}|{f['verification_status']}] {f['claim'][:80]}")

# Report
try:
    report = api(f"/api/missions/{mid}/report", token=tok)
    print(f"\nREPORT: {report['title']}")
    print(f"Summary: {report['executive_summary'][:200]}...")
    content = report["structured_content"]
    print(f"\nKey findings: {len(content.get('key_findings', []))}")
    print(f"Competitor rows: {len(content.get('competitor_comparison', []))}")
    print(f"Recommendations: {len(content.get('recommendations', []))}")
except Exception as e:
    print(f"\nReport: not available ({e})")

# Monitors
monitors = api("/api/monitors", token=tok)["monitors"]
print(f"\nMONITORS CREATED: {len(monitors)}")
for m in monitors:
    print(f"  • {m['name']} [{m['status']}]")

print("\n✓ Demo mission complete!")
