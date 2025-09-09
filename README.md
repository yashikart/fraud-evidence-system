# Fraud Evidence System

Production-oriented, end-to-end cybercrime fraud detection and evidence custody platform.

This repository contains:
- A Node.js/Express backend (MongoDB) for fraud reports, evidence custody (hybrid IPFS/S3 + cache), chain-of-custody timeline, authority escalation, ML analysis, and PDF reporting.
- A React frontend (CRA-compatible) with Tailwind for dashboards, evidence library, timelines, and live RL feedback.

The system is designed for real-world operations: immutable evidence integrity, role-based access, automated and manual escalation, and investigation workflows.

---

## Table of Contents
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local)](#quick-start-local)
- [Environment Configuration](#environment-configuration)
- [Running with Docker Compose](#running-with-docker-compose)
- [Core APIs](#core-apis)
- [Frontend Usage](#frontend-usage)
- [Real-time (WebSocket)](#real-time-websocket)
- [Security & Observability](#security--observability)
- [Development Notes](#development-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features
- Evidence custody with hybrid storage (Local cache + IPFS + S3) and integrity verification across layers + blockchain hash anchoring.
- Chain-of-Custody timeline combining Reports, Evidence, Risk assessments, Escalations, and significant API actions with GeoIP enrichment.
- Styled PDF reports (Puppeteer) for case/entity with executive summary, evidence listing, risk evolution, timeline, and escalation trail.
- Role-Based Access Control (RBAC): Investigator/Admin capabilities, gate Evidence Library actions (view/export/share/delete).
- Authority Escalation: webhook-based notifications, MongoDB EscalationLog, and pipeline from UI → backend.
- RL + Human-in-the-loop: record model decisions and investigator feedback.
- Real-time UI: WebSocket server broadcasts live RL decisions and escalations to the frontend.
- Case Linking: linked timeline across multiple entities for clustered investigations.

---

## Project Structure
```
fraud-evidence-system/
├─ Backend/
│  ├─ controllers/          # REST controllers
│  ├─ listeners/            # blockchain/event listeners
│  ├─ middleware/           # auth, RBAC, audit, rate limit
│  ├─ models/               # Mongoose schemas (Evidence, Report, EscalationLog, RLLog, etc.)
│  ├─ routes/               # API routes (reports, evidence, escalation, ML, etc.)
│  ├─ services/             # business services (hybrid storage, chain-of-custody, reporting)
│  ├─ storage/              # local cache + generated reports
│  ├─ utils/                # helpers: event bus, email, kafka, logger
│  ├─ .env.example          # sample env
│  └─ server.js             # app bootstrap (Express + WebSocket)
│
├─ Frontend/
│  ├─ src/                  # React app (CRA compatible)
│  │  ├─ components/        # UI components
│  │  ├─ Pages/             # pages (Admin, dashboards, etc.)
│  │  ├─ hooks/ utils/      # custom hooks & utilities
│  │  └─ styles/            # Tailwind + CSS
│  ├─ public/               # CRA public
│  ├─ tailwind.config.js    # Tailwind theme tokens
│  └─ package.json          # CRA scripts
│
├─ docker-compose.fullstack.yml
├─ README.md                # this file
└─ package.json             # root (optional)
```

---

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB 6+ (local or remote)
- Optional: IPFS node (HTTP API port, default 5001)
- Optional: AWS S3 bucket and credentials (for hybrid storage)

---

## Quick Start (Local)

1) Clone
```
# Using your GitHub fork or the upstream repo
git clone https://github.com/yashikart/fraud-evidence-system.git
cd fraud-evidence-system
```

2) Backend setup
```
cd Backend
cp .env.example .env
# Edit .env with your values (see Environment Configuration below)

npm install
npm start
# Backend on http://localhost:5050
# WebSocket on ws://localhost:5051 (API port + 1)
```

3) Frontend setup
```
cd ../Frontend
# Choose one of the following variables depending on your tooling
# CRA: REACT_APP_BACKEND_URL=http://localhost:5050
# Vite: VITE_BACKEND_URL=http://localhost:5050
# Optional WS: REACT_APP_WS_URL=ws://localhost:5051 or VITE_WS_URL=ws://localhost:5051

npm install
npm start
# Frontend on http://localhost:3000
```

---

## Environment Configuration

### Backend (.env)
See `Backend/.env.example` and set at least:
```
MONGO_URI=mongodb://localhost:27017/fraudDB
PORT=5050
JWT_SECRET=your-secure-jwt-secret

# Hybrid Storage
ENABLE_S3=false
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=fraud-evidence-system

ENABLE_IPFS=false
IPFS_API_URL=http://localhost:5001

# Webhooks / Alerts
WEBHOOK_URL=https://webhook.site/...
RBI_WEBHOOK_URL=http://localhost:5050/simulate-rbi-alert
ALERT_WEBHOOK_URL=http://localhost:5050/simulate-rbi-alert

# Supabase (optional)
supabaseUrl=...
SUPABASE_JWT_SECRET=...
SUPABASE_PROJECT_REF=...
REACT_APP_SUPABASE_ANON_KEY=...
```

### Frontend (.env)
For CRA:
```
REACT_APP_BACKEND_URL=http://localhost:5050
REACT_APP_WS_URL=ws://localhost:5051
```
For Vite:
```
VITE_BACKEND_URL=http://localhost:5050
VITE_WS_URL=ws://localhost:5051
```
Note: The codebase guards access to `import.meta.env` to support CRA and Vite. Prefer centralizing env resolution if extending.

---

## Running with Docker Compose
A full-stack `docker-compose.fullstack.yml` is available at repo root. Update environment variables, then:
```
docker compose -f docker-compose.fullstack.yml up --build
```
This will build and run Backend and Frontend services. Ensure MongoDB and any required external services (IPFS/S3) are reachable.

---

## Core APIs
- Health: `GET /health`
- Reports:
  - Create: `POST /api/reports`  (body: { wallet|entityId, reason, user_email, [severity] })
  - List (by user): `GET /api/reports?user_email=...` → `{ results, count }`
- Evidence:
  - Upload: `POST /api/evidence/upload` (multipart: evidenceFile, fields: caseId, entity)
  - Verify: `POST /api/evidence/verify/:evidenceId` (integrity across cache/S3/IPFS + blockchain)
  - Timeline: `GET /api/evidence/timeline/:entity`
  - Linked Trail: `POST /api/evidence/linked-trail` (entities: [...])
  - Admin Stats: `GET /api/evidence/admin/stats`
- Escalation:
  - Manual escalation: `POST /api/escalation` (body: { entity, riskScore, caseId })
- ML / RL:
  - Analyze: `POST /api/ml/analyze` (body: { address, reason })
  - RL Feedback: `GET/POST /api/feedback/rl`

(Authentication: Most endpoints require JWT; login endpoints exist under `/api/auth`.)

---

## Frontend Usage
- Login with a valid account; roles control access:
  - Admin: full access to Evidence Library, user management, and settings.
  - Investigator: access to Evidence Library (view/export/share), timelines, reports.
  - Public: limited features (e.g., report submissions).
- Dashboard Highlights:
  - Report & Analyze: submit wallet reports, trigger ML analysis.
  - Evidence Library: upload, list, download, verify; export timelines.
  - Timeline Analysis: visualize entity/case timelines; linked analysis supported.
  - RL Feedback Panel: live RL decisions and investigator feedback (Correct/Wrong).

---

## Real-time (WebSocket)
- WebSocket server listens on `ws://<backend-host>:<api-port+1>` (default: ws://localhost:5051).
- RL decisions and escalations can be broadcast for live UI updates.
- Frontend provides a WebSocket-aware RL panel; Risk Dial/live widgets can subscribe similarly.

---

## Security & Observability
- RBAC enforced for sensitive routes (investigator/admin).
- Audit logging, rate limiting, and log utilities included.
- Recommended: set up centralized logs/metrics (ELK/Loki/Prom/Grafana) and a CI/CD pipeline for deployment.

---

## Development Notes
- CRA & Vite compatibility: code guards access to `import.meta.env` and supports `REACT_APP_*` variables.
- Hybrid storage defaults are disabled; enable IPFS/S3 in `.env` for production-grade evidence custody.
- Authority map/resolver: by default a single webhook is used; integrate a global authority map (GeoIP → authority endpoints/emails) and route escalations accordingly.
- Blockchain hooks: extend listeners to persist events and broadcast via WebSocket as needed.

---

## Contributing
- Branch from `main` and open PRs with clear descriptions.
- Add tests where possible and update documentation for new features.
- Proposed ownership (example):
  - Backend infra (RL, IP resolver, hooks): Keval
  - Frontend dashboards (threat map, risk dial, RL feedback, escalation UI): Aryan
  - Evidence custody (upload → blockchain, chain visualizer, library, PDF logs): Yashika

---

## License
Copyright © 2025. All rights reserved.
