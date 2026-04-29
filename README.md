# MindGuard 🧠
### Behavioural Pattern Detection & Early Intervention Platform for Youth Mental Health

> **Portfolio project** — built to demonstrate full-stack engineering + ML skills for software development and ML engineering roles.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · Recharts |
| Backend | FastAPI (Python 3.12) · SQLAlchemy (async) |
| Database | PostgreSQL 16 · Redis 7 |
| ML | scikit-learn · HuggingFace Transformers |
| Auth | JWT · bcrypt · Fernet encryption |
| AI Layer | Anthropic Claude API |
| DevOps | Docker · Docker Compose · GitHub Actions |

---

## Project Structure

```
mindguard/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py       ← All env config (Pydantic Settings)
│   │   │   ├── database.py     ← Async SQLAlchemy engine + session factory
│   │   │   └── security.py     ← JWT · bcrypt · Fernet encryption
│   │   ├── models/
│   │   │   └── user.py         ← DB tables: User, MoodCheckIn, AnomalyAlert
│   │   ├── schemas/
│   │   │   └── user.py         ← Pydantic request/response validators
│   │   ├── routers/
│   │   │   ├── auth.py         ← POST /auth/register, /auth/login
│   │   │   ├── checkins.py     ← POST/GET /checkins
│   │   │   ├── analytics.py    ← GET /analytics/summary, /trends
│   │   │   └── companion.py    ← POST /companion/chat (Claude API)
│   │   ├── services/           ← Business logic (anomaly detection, sentiment) [Milestone 3]
│   │   ├── ml/                 ← ML model training + inference [Milestone 4]
│   │   └── main.py             ← FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            ← Landing page
│   │   │   ├── dashboard/          ← Main dashboard (charts + summary)
│   │   │   ├── checkin/            ← Multi-step check-in form
│   │   │   └── (auth)/login/       ← Login page
│   │   ├── components/
│   │   │   └── charts/
│   │   │       └── MoodTrendChart.tsx  ← Recharts line chart
│   │   ├── lib/
│   │   │   ├── api.ts              ← Axios client + all API functions
│   │   │   └── auth-store.ts       ← Zustand global auth state
│   │   └── types/
│   │       └── index.ts            ← All TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml          ← Runs all 4 services together
├── .env.example                ← Copy to .env and fill in your values
└── .gitignore
```

---

## Milestone Roadmap

| # | Milestone | Score | Status |
|---|-----------|-------|--------|
| 1 | **Folder structure + running locally** | 4/10 | ✅ This milestone |
| 2 | JWT auth middleware + protected routes | — | Next |
| 3 | Anomaly detection engine (Z-score) | — | |
| 4 | Sentiment classifier training | — | |
| 5 | AI companion (Claude API integration) | — | |
| 6 | Deployed on AWS (ECS or EC2) | 7/10 | |
| 7 | ML model trained + documented | 8/10 | |
| 8 | Real users + polished README | 9/10 | |

---

## 🚀 Getting Started (Milestone 1)

### Prerequisites
- Docker Desktop installed and running
- Git

### Step 1 — Clone and configure
```bash
git clone <your-repo-url>
cd mindguard

# Create your .env file from the template
cp .env.example .env
```

### Step 2 — Generate security keys
Open a terminal and run these commands. Copy each output into your `.env`:

```bash
# Generate SECRET_KEY (paste into SECRET_KEY= in .env)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate ENCRYPTION_KEY (paste into ENCRYPTION_KEY= in .env)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Get your Anthropic API key at https://console.anthropic.com and add it to `ANTHROPIC_API_KEY=`.

### Step 3 — Build and run
```bash
# Build all images and start all 4 services
docker-compose up --build

# You'll see logs from all services. Wait for:
# ✅  Database tables verified / created
# ✅  MindGuard API starting in development mode
```

First build takes 3-5 minutes (downloading Docker layers + installing packages). Subsequent starts take ~30 seconds.

### Step 4 — Verify everything works

| Service | URL | What to check |
|---------|-----|---------------|
| **API** | http://localhost:8000 | Should return `{"message": "Welcome to MindGuard API"}` |
| **API Docs** | http://localhost:8000/api/docs | Interactive Swagger UI |
| **Frontend** | http://localhost:3000 | Landing page |
| **Health** | http://localhost:8000/health | Should return `{"status": "healthy"}` |

### Useful Docker commands
```bash
# Run in background (detached mode)
docker-compose up -d

# View logs for a specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a single service after code change
docker-compose restart backend

# Stop everything
docker-compose down

# Stop AND delete all data (fresh start)
docker-compose down -v
```

---

## API Reference

The interactive Swagger docs at `/api/docs` are the best reference.
All endpoints are prefixed with `/api/v1/`.

### Auth
```
POST /api/v1/auth/register    Create account
POST /api/v1/auth/login       Login → returns JWT token
GET  /api/v1/auth/me          Get current user (requires auth)
```

### Check-ins
```
POST /api/v1/checkins/        Submit a check-in
GET  /api/v1/checkins/        List check-ins (paginated)
GET  /api/v1/checkins/{id}    Get specific check-in
```

### Analytics
```
GET /api/v1/analytics/summary     Dashboard summary cards
GET /api/v1/analytics/trends      Mood trend data for charts
```

### AI Companion
```
POST /api/v1/companion/chat   Chat with AI companion
```

---

## Architecture Decisions

**Why FastAPI over Django/Flask?**
FastAPI is async-native, has automatic OpenAPI docs, and uses Pydantic for validation. It's the modern Python choice for ML-heavy APIs.

**Why async SQLAlchemy?**
Blocking DB calls would pause all requests. Async lets the server handle many concurrent users efficiently.

**Why encrypt check-in notes?**
We're handling sensitive mental health data. Encrypted fields mean that even if the DB is compromised, the notes are unreadable without the encryption key.

**Why Zustand over Redux?**
Redux is overkill for this app size. Zustand is 1KB, no boilerplate, and uses React hooks naturally.

---

## Security Features
- Passwords: bcrypt hashed (irreversible)
- Auth: JWT with expiry
- Sensitive fields: Fernet-encrypted at rest
- CORS: configured for specific origins only
- Non-root Docker containers
- Generic error messages (prevent user enumeration)

---

## What's Next (Milestone 2)
- [ ] JWT auth middleware (protect all routes)
- [ ] Register page UI
- [ ] Dashboard connected to real data
- [ ] Alembic database migrations
- [ ] Redis session caching
