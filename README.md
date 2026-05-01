# MindGuard

**Behavioural pattern detection and early intervention for youth mental health.**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

🔗 **Live:** [mindguard-frontend.onrender.com](https://mindguard-frontend.onrender.com) &nbsp;|&nbsp; 📖 **API Docs:** [mindguard-1x3w.onrender.com/api/docs](https://mindguard-1x3w.onrender.com/api/docs)

---

## Overview

MindGuard is a full-stack web application I built to help young people (ages 10–25) track their emotional wellbeing through daily check-ins. What makes it different from a basic mood journal is the ML layer underneath — a custom-trained sentiment classifier runs on every note, and a Z-score anomaly detector compares each check-in against the user's personal 30-day baseline to surface early warning signs automatically.

I built this as my capstone portfolio project after graduating with a CS Honours degree from the University of Guelph in April 2026. The goal was to build something technically serious — not a CRUD app dressed up as ML.

---

## What it does

Users check in daily by rating their mood, energy, sleep, and optionally writing a private journal note. The system then:

- Runs sentiment analysis on the note using a custom scikit-learn classifier trained on mental health language
- Calculates a Z-score comparing today's mood against their 30-day personal baseline
- Generates an anomaly alert if the mood drops significantly (configurable thresholds: LOW / MEDIUM / HIGH / CRITICAL)
- Shows interactive trend charts on the dashboard so users can see patterns over time
- Provides access to an AI companion (Llama 3.3 via Groq) for supportive conversation

All journal notes are encrypted at rest using Fernet symmetric encryption — even with full database access, notes are unreadable without the encryption key.

---

## Tech stack

**Backend** — FastAPI (Python 3.12), SQLAlchemy async, PostgreSQL 16, Redis, JWT + bcrypt auth, Fernet field encryption

**ML** — Custom TF-IDF + Voting Ensemble classifier (scikit-learn), Z-score anomaly detection, lexicon fallback

**Frontend** — Next.js 14 (TypeScript), Tailwind CSS, Recharts, Zustand, React Hook Form + Zod

**DevOps** — Docker Compose, GitHub Actions CI/CD, Render (production)

---

## Architecture

```
Browser (Next.js)
       │
       ▼ HTTPS
FastAPI Backend
  ├── Auth router         (JWT + bcrypt)
  ├── Check-ins router    (encrypted notes, background tasks)
  ├── Analytics router    (aggregated trends, streak calc)
  ├── Alerts router       (anomaly management)
  └── Companion router    (Groq / Llama 3.3)
       │
       ├── Background: Sentiment classifier (TF-IDF + Ensemble)
       └── Background: Z-score anomaly detection
       │
  ┌────┴────┐
  │         │
PostgreSQL  Redis
```

---

## The ML model

I trained a 3-class sentiment classifier specifically for mental health text — general sentiment models (like VADER) don't handle words like "empty", "numb", or "flat" correctly in this context.

**Architecture:** TF-IDF vectorizer (bigrams, 10k features) → soft-voting ensemble of Logistic Regression, LinearSVC (calibrated), and Complement Naive Bayes

**Results on hold-out test set:**

| Metric | Score |
|--------|-------|
| Accuracy | 95.2% |
| F1 macro | 0.957 |
| 5-fold CV F1 | 0.991 ± 0.036 |
| Inference time | < 10ms |

The model is a proof-of-concept trained on 168 curated samples. A production version would use 5,000+ samples or a fine-tuned DistilBERT — see `MODEL_CARD.md` for the full writeup.

---

## Running locally

**Prerequisites:** Docker Desktop, Git

```bash
git clone https://github.com/filza-shah/mindguard.git
cd mindguard
cp .env.example .env
```

Generate your keys and paste them into `.env`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Start everything:

```bash
docker-compose up --build
```

Train the sentiment model (first time only):

```bash
docker exec -it mindguard-backend-1 bash
python -m app.ml.train
exit
```

| URL | What's there |
|-----|-------------|
| http://localhost:3000 | Frontend |
| http://localhost:8000/api/docs | API documentation |
| http://localhost:8000/health | Health check |

---

## Tests

```bash
docker exec -it --user root mindguard-backend-1 bash
pytest tests/ -v
```

14 integration tests covering auth, check-ins, and sentiment analysis — all passing.

---

## API

Full interactive docs at `/api/docs`. Key endpoints:

```
POST  /api/v1/auth/register
POST  /api/v1/auth/login
POST  /api/v1/checkins/
GET   /api/v1/checkins/
GET   /api/v1/analytics/summary
GET   /api/v1/analytics/trends
GET   /api/v1/alerts/
POST  /api/v1/companion/chat
```

---

## Project structure

```
mindguard/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB, security, auth middleware
│   │   ├── models/        # SQLAlchemy: User, MoodCheckIn, AnomalyAlert
│   │   ├── schemas/       # Pydantic validators
│   │   ├── routers/       # Auth, check-ins, analytics, alerts, companion
│   │   ├── services/      # Anomaly detection, sentiment inference
│   │   └── ml/            # Dataset, training, evaluation scripts
│   └── tests/             # 14 integration tests
├── frontend/
│   └── src/
│       ├── app/           # Next.js pages (dashboard, checkin, companion, alerts)
│       ├── components/    # AppShell, charts
│       └── lib/           # API client, auth store
├── .github/workflows/     # GitHub Actions CI/CD
├── docker-compose.yml
├── MODEL_CARD.md
└── DEPLOYMENT.md
```

---

## Milestones

- [x] Full-stack scaffold + Docker
- [x] JWT auth + protected routes
- [x] Z-score anomaly detection + background tasks
- [x] Custom NLP sentiment classifier
- [x] GitHub Actions CI/CD + 14 integration tests
- [x] AI companion (Llama 3.3 via Groq)
- [x] Deployed to Render
- [ ] DistilBERT fine-tuning on larger dataset

---

## Some decisions worth explaining

**Why a custom classifier instead of calling an LLM?** Every check-in triggers inference. At LLM API pricing that adds up fast and adds latency. A local scikit-learn model runs in under 10ms with zero marginal cost — which is how production ML systems are actually built.

**Why async SQLAlchemy?** FastAPI is built on async Python. Synchronous DB calls block the event loop, meaning one slow query stalls every other request. Async means the server can handle hundreds of concurrent users without adding servers.

**Why field-level encryption?** We're handling sensitive mental health data. If the database is ever compromised, encrypted notes are still unreadable without the key. Defence in depth.

---

## Author

**Filza Shah** — CS Honours Graduate, University of Guelph (April 2026)

[GitHub](https://github.com/filza-shah) · [LinkedIn](https://linkedin.com/in/filza-shah)

---

*MindGuard is not a medical device and does not provide clinical advice. If you are in crisis, please contact the 988 Suicide & Crisis Lifeline (call or text 988) or text HOME to 741741.*
