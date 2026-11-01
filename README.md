# ScoutOS

**Autonomous Business Intelligence Platform**

> From business questions to actionable intelligence.

ScoutOS is a full-stack AI research workspace that orchestrates five TinyFish capabilities — search, fetch, agent, browser, and monitor — to turn a natural-language business objective into a source-backed intelligence report with continuous monitoring.

---

## Architecture

```
frontend/          Next.js 14 + TypeScript + Tailwind CSS
backend/           FastAPI + SQLAlchemy + SQLite (dev)
  app/
    adapters/      One adapter per TinyFish product
      tinysearch.py    → search.query()
      tinyfetch.py     → POST api.fetch.tinyfish.ai
      tinyagent.py     → AsyncTinyFish.agent.run()
      tinybrowser.py   → POST api.browser.tinyfish.ai (CDP session)
      tinymonitor.py   → POST agent.tinyfish.ai/v1/monitors
    routers/       REST API routes (auth, missions, monitors, actions, research)
    orchestrator.py    Mission pipeline coordinator
    models/        SQLAlchemy ORM models
    auth.py        JWT + bcrypt authentication
```

## Five TinyFish Capabilities

| Product | Role in ScoutOS |
|---------|----------------|
| **TinySearch** | Discovers relevant competitor websites, product pages, and market sources from a query |
| **TinyFetch** | Extracts clean content from discovered URLs — prices, features, descriptions |
| **TinyAgent** | Runs goal-directed autonomous research on each competitor; extracts structured findings |
| **TinyBrowser** | Executes approved browser workflows via Playwright CDP (pending user approval) |
| **TinyMonitor** | Creates scheduled page/topic monitors so pricing changes are detected automatically |

---

## Quick Start

### Prerequisites

- Python 3.11+ 
- Node.js 18+
- A TinyFish API key from [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys)

### 1. Backend setup

```powershell
cd scoutos/backend

# Copy and fill in environment variables
copy .env.example .env
# Edit .env and paste your TINYFISH_API_KEY

# Install dependencies
python -m pip install -r requirements.txt
python -m pip install "pydantic[email]" bcrypt==4.2.0

# Start the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend setup

```powershell
cd scoutos/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```

### 3. Open the app

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Create an account, then click **New Mission** and describe your business research goal.

---

## Environment Variables

### Backend (`backend/.env`)

```env
TINYFISH_API_KEY=sk-tinyfish-...        # Required — get from agent.tinyfish.ai/api-keys
SECRET_KEY=change-this-in-production    # JWT signing secret
DATABASE_URL=sqlite+aiosqlite:///./scoutos.db
FRONTEND_URL=http://localhost:3000
DEBUG=true
```

### Frontend (`frontend/.env.local`) — optional

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The frontend proxies `/api/*` to the backend by default (configured in `next.config.js`).

---

## Primary Demo Mission

The application is built around this demonstration scenario:

> "Analyze the market for AI-powered meeting assistants. Identify competitors, compare their pricing and features, identify market gaps, and monitor selected competitors for changes."

**What happens when you run it:**

1. **TinySearch** queries the web for AI meeting assistant competitors, pricing pages, and market research.
2. **TinyFetch** extracts content from up to 6 discovered URLs in parallel.
3. **TinyAgent** investigates each competitor site with a goal-directed browser agent, extracting pricing, features, target audience, and positioning as structured JSON.
4. An **analysis engine** normalises findings, distinguishes facts from inferences, and builds a competitor comparison table.
5. A **structured report** is generated with key findings, recommendations, evidence citations, and data quality indicators.
6. **TinyMonitor** creates page monitors on pricing/product pages so future changes are detected automatically.
7. A **TinyBrowser** action is queued for user approval — once approved, it opens a real browser session via Playwright CDP.

---

## API Reference

```
POST /api/auth/register       Create account
POST /api/auth/login          Sign in → JWT token
GET  /api/auth/me             Current user

POST /api/missions            Create mission
GET  /api/missions            List missions
GET  /api/missions/{id}       Get mission + status
POST /api/missions/{id}/start Execute mission (background)
POST /api/missions/{id}/cancel Cancel running mission
GET  /api/missions/{id}/steps Execution pipeline steps
GET  /api/missions/{id}/sources Discovered sources
GET  /api/missions/{id}/findings Extracted findings
GET  /api/missions/{id}/report  Intelligence report

POST /api/research/search     TinySearch (direct)
POST /api/research/fetch      TinyFetch (direct)

POST /api/monitors            Create page/topic monitor
GET  /api/monitors            List monitors
POST /api/monitors/{id}/pause Pause schedule
POST /api/monitors/{id}/resume Resume schedule
GET  /api/monitors/{id}/events Monitor event history

GET  /api/actions             List browser actions
POST /api/actions/{id}/approve Approve + execute
POST /api/actions/{id}/reject  Reject action
```

---

## Data Quality Model

ScoutOS distinguishes four evidence types in every finding:

| Label | Meaning |
|-------|---------|
| `FACT` | Value directly extracted from a source page |
| `INFERENCE` | Interpretation derived from available evidence |
| `HYPOTHESIS` | Possible opportunity that needs further validation |
| `UNKNOWN` | Could not be established from available sources |

Confidence levels (`high` / `medium` / `low`) reflect source quality and corroboration, not a statistically calibrated probability.

---

## Security Notes

- TinyFish API keys are stored **server-side only** — never sent to the browser.
- Browser actions require **explicit user approval** before execution.
- The browser adapter terminates sessions after each workflow.
- JWT tokens expire after 7 days.
- All mission and monitor access is scoped to the authenticated user.

---

## Project Structure

```
scoutos/
├── README.md
├── run_demo_mission.py         End-to-end integration test
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py             FastAPI app + CORS + lifespan
│       ├── config.py           Pydantic settings
│       ├── database.py         SQLAlchemy async engine
│       ├── auth.py             JWT + bcrypt
│       ├── schemas.py          Pydantic request/response models
│       ├── orchestrator.py     Mission pipeline (all 5 adapters)
│       ├── adapters/
│       │   ├── tinysearch.py
│       │   ├── tinyfetch.py
│       │   ├── tinyagent.py
│       │   ├── tinybrowser.py
│       │   └── tinymonitor.py
│       ├── models/
│       │   └── db.py           SQLAlchemy ORM models
│       └── routers/
│           ├── auth.py
│           ├── missions.py
│           ├── monitors.py
│           ├── actions.py
│           └── research.py
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx              Landing page
        │   ├── (auth)/login/         Login
        │   ├── (auth)/signup/        Sign up
        │   └── (app)/
        │       ├── dashboard/        Overview + metrics
        │       ├── missions/         Mission list + creation
        │       ├── missions/[id]/    Mission workspace (5 tabs)
        │       ├── research/         TinySearch explorer
        │       ├── reports/          Intelligence reports
        │       ├── monitors/         Monitoring center
        │       ├── actions/          Browser action approvals
        │       └── settings/
        ├── components/
        │   ├── layout/               Sidebar + Topbar
        │   └── ui/                   Button, Card, Badge, Input, etc.
        ├── lib/
        │   ├── api.ts                Typed API client
        │   └── utils.ts
        └── types/index.ts            All domain types
```

---

## Known Limitations

- Database: SQLite is used for development. For production, replace `DATABASE_URL` with a PostgreSQL connection string and install `asyncpg`.
- TinyAgent runs are slow (15–90 seconds each). For 4 concurrent runs the investigation step may take 2–4 minutes.
- TinyBrowser requires `playwright` and `playwright install chromium` to actually execute steps. Without it the workflow will fail gracefully with a clear error message.
- TinyMonitor `run_now` results are not yet stored as `MonitorEvent` records — this is a straightforward extension.
- The frontend rewrite proxy (`next.config.js`) only works in dev mode. In production, set `NEXT_PUBLIC_API_URL` and deploy the backend separately.
