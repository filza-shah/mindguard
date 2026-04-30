# MindGuard 🧠
### Behavioural Pattern Detection & Early Intervention Platform for Youth Mental Health

> A full-stack ML engineering portfolio project — built to demonstrate production-grade software development, custom model training, and system design skills.

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

---

## What is MindGuard?

MindGuard is a behavioural pattern detection platform that helps young people (ages 10–25) track their mental wellbeing through daily check-ins. It uses machine learning to detect concerning patterns before they escalate, and provides an AI-powered conversational companion for emotional support.

This is not a toy app — it features a custom-trained NLP sentiment classifier, real-time Z-score anomaly detection, field-level encryption for sensitive data, JWT authentication, and a full CI/CD pipeline.

---

## Live Demo

> 🔗 **[mindguard.onrender.com](https://mindguard.onrender.com)** ← add your URL here

**Test credentials:**
```
Email:    demo@mindguard.app
Password: Demo1234!
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** (Python 3.12) | Async REST API framework |
| **SQLAlchemy** (async) | ORM with async PostgreSQL driver |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching and session management |
| **Alembic** | Database schema migrations |
| **JWT + bcrypt** | Authentication and password hashing |
| **Fernet encryption** | Field-level encryption for sensitive data |

### Machine Learning
| Technology | Purpose |
|-----------|---------|
| **scikit-learn** | TF-IDF vectorizer + ensemble classifier |
| **Custom NLP model** | Mental health sentiment analysis (95.2% accuracy) |
| **Z-score algorithm** | Real-time behavioural anomaly detection |
| **HuggingFace** | Model architecture (Milestone 8 upgrade path) |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 14** (TypeScript) | React framework with App Router |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Mood trend data visualizations |
| **Zustand** | Global auth state management |
| **React Hook Form + Zod** | Form validation |
| **Axios** | HTTP client with JWT interceptor |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker + Docker Compose** | Containerization and local orchestration |
| **GitHub Actions** | CI/CD pipeline (test → build → deploy) |
| **AWS ECR + ECS Fargate** | Production container registry and runtime |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│                   Next.js + TypeScript                   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │ Checkins │  │Analytics │  │  AI    │  │
│  │  Router  │  │  Router  │  │  Router  │  │Companion│  │
│  └──────────┘  └────┬─────┘  └──────────┘  └────────┘  │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │              Background Tasks                        │ │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │ │
│  │  │ Sentiment Model │  │  Anomaly Detection Engine │  │ │
│  │  │ TF-IDF+Ensemble │  │  Z-score vs 30d baseline  │  │ │
│  │  └─────────────────┘  └──────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│  PostgreSQL  │         │    Redis     │
│  (primary)   │         │   (cache)    │
└──────────────┘         └──────────────┘
```

---

## Core Features

### 1. Daily Mood Check-in System
Multi-step form capturing mood score (1-5), energy level, anxiety level, sleep hours, activities, and an optional encrypted journal note. Data is validated server-side with Pydantic before persisting.

### 2. Real-time Anomaly Detection Engine
After every check-in, a background task runs Z-score analysis comparing the user's current mood against their personal 30-day baseline. Alerts are generated at four severity levels (LOW/MEDIUM/HIGH/CRITICAL) when the Z-score falls below configurable thresholds. A second detector flags consecutive low-mood days (≥3 days at or below 2/5).

### 3. Custom NLP Sentiment Classifier
A scikit-learn pipeline trained on a curated mental health corpus:
- **Architecture:** TF-IDF vectorizer (bigrams, 10k features) → Voting Ensemble (Logistic Regression + LinearSVC + ComplementNB)
- **Accuracy:** 95.2% on hold-out test set
- **F1 (macro):** 0.957
- **5-fold CV:** 0.991 mean F1
- Falls back to a lexicon-based analyser if the model file isn't present

### 4. AI Conversational Companion
Claude-powered (claude-sonnet-4) chat interface with a carefully engineered system prompt for youth mental health contexts. Includes mood context injection, crisis keyword detection with automatic resource display, and conversation history management.

### 5. Interactive Analytics Dashboard
Recharts-powered mood trend visualizations with 7-day/30-day averages, streak tracking, trend direction detection, and a summary card grid.

### 6. Security
- Passwords: bcrypt hashed (irreversible, salted)
- Auth: JWT tokens with configurable expiry
- Sensitive fields: Fernet symmetric encryption at rest
- CORS: origin allowlist
- Non-root Docker containers
- Generic error messages to prevent user enumeration

---

## ML Model Card

| Property | Details |
|----------|---------|
| Model name | MindGuard Sentiment Classifier v1.0 |
| Task | 3-class sentiment classification |
| Architecture | TF-IDF (bigrams) + Voting Ensemble |
| Training samples | 168 |
| Test samples | 42 |
| Accuracy | 95.2% |
| F1 macro | 0.957 |
| 5-fold CV F1 | 0.991 ± 0.036 |
| Inference time | < 10ms |
| Classes | positive / negative / neutral |

Full model card: [MODEL_CARD.md](./MODEL_CARD.md)

---

## Project Structure

```
mindguard/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings — env var management
│   │   │   ├── database.py        # Async SQLAlchemy engine + session factory
│   │   │   ├── security.py        # JWT + bcrypt + Fernet encryption
│   │   │   └── deps.py            # FastAPI dependency injection (auth guard)
│   │   ├── models/
│   │   │   └── user.py            # SQLAlchemy models: User, MoodCheckIn, AnomalyAlert
│   │   ├── schemas/
│   │   │   └── user.py            # Pydantic request/response validators
│   │   ├── routers/
│   │   │   ├── auth.py            # POST /auth/register, /auth/login, GET /auth/me
│   │   │   ├── checkins.py        # CRUD for mood check-ins + background tasks
│   │   │   ├── analytics.py       # Aggregated trends + streak calculation
│   │   │   ├── companion.py       # Claude API integration
│   │   │   └── alerts.py          # Anomaly alert management
│   │   ├── services/
│   │   │   ├── anomaly_detection.py  # Z-score engine + consecutive low mood detector
│   │   │   └── sentiment_service.py  # ML model inference + lexicon fallback
│   │   └── ml/
│   │       ├── dataset.py         # Training corpus + augmentation pipeline
│   │       ├── train.py           # Model training script
│   │       ├── evaluate.py        # Evaluation: hold-out + 5-fold CV
│   │       └── models/            # Saved .joblib model files (git-ignored)
│   ├── tests/
│   │   └── test_auth.py           # 14 integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Landing page
│       │   ├── dashboard/         # Main analytics dashboard
│       │   ├── checkin/           # Multi-step check-in form
│       │   ├── companion/         # AI companion chat UI
│       │   ├── alerts/            # Anomaly alert dashboard
│       │   └── (auth)/            # Login + register pages
│       ├── components/
│       │   ├── AppShell.tsx       # Sidebar + mobile nav layout
│       │   └── charts/            # Recharts mood visualizations
│       └── lib/
│           ├── api.ts             # Axios client + all API functions
│           └── auth-store.ts      # Zustand global auth state
├── .github/
│   └── workflows/deploy.yml       # GitHub Actions CI/CD pipeline
├── aws/                           # ECS task definitions
├── docker-compose.yml
├── MODEL_CARD.md
├── DEPLOYMENT.md
└── .env.example
```

---

## Getting Started

### Prerequisites
- Docker Desktop (running)
- Git

### 1. Clone and configure
```bash
git clone https://github.com/YOUR_USERNAME/mindguard.git
cd mindguard
cp .env.example .env
```

### 2. Generate security keys
```bash
# SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# ENCRYPTION_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Paste both outputs into your `.env` file.

### 3. Start all services
```bash
docker-compose up --build
```

First build: ~5 minutes. Subsequent starts: ~30 seconds.

### 4. Train the sentiment model
```bash
docker exec -it mindguard-backend-1 bash
python -m app.ml.train
python -m app.ml.evaluate
exit
```

### 5. Verify
| URL | Expected |
|-----|----------|
| http://localhost:3000 | Landing page |
| http://localhost:8000/api/docs | Swagger UI |
| http://localhost:8000/health | `{"status": "healthy"}` |

---

## Running Tests

```bash
docker exec -it --user root mindguard-backend-1 bash
pytest tests/ -v
```

```
14 passed in 10.85s

tests/test_auth.py::test_register_success              PASSED
tests/test_auth.py::test_register_duplicate_email      PASSED
tests/test_auth.py::test_register_weak_password        PASSED
tests/test_auth.py::test_login_success                 PASSED
tests/test_auth.py::test_login_wrong_password          PASSED
tests/test_auth.py::test_get_me_authenticated          PASSED
tests/test_auth.py::test_get_me_unauthenticated        PASSED
tests/test_auth.py::test_create_checkin                PASSED
tests/test_auth.py::test_create_checkin_unauthenticated PASSED
tests/test_auth.py::test_list_checkins                 PASSED
tests/test_auth.py::test_sentiment_positive            PASSED
tests/test_auth.py::test_sentiment_negative            PASSED
tests/test_auth.py::test_sentiment_neutral             PASSED
tests/test_auth.py::test_sentiment_empty               PASSED
```

---

## API Reference

Interactive docs: **http://localhost:8000/api/docs**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create account | — |
| POST | `/api/v1/auth/login` | Login → JWT | — |
| GET | `/api/v1/auth/me` | Current user | ✅ |
| POST | `/api/v1/checkins/` | Submit check-in | ✅ |
| GET | `/api/v1/checkins/` | List check-ins | ✅ |
| GET | `/api/v1/analytics/summary` | Dashboard stats | ✅ |
| GET | `/api/v1/analytics/trends` | Mood trend data | ✅ |
| GET | `/api/v1/alerts/` | Anomaly alerts | ✅ |
| PATCH | `/api/v1/alerts/{id}/acknowledge` | Acknowledge alert | ✅ |
| POST | `/api/v1/companion/chat` | AI companion | ✅ |

---

## CI/CD Pipeline

Every push to `main` triggers a 3-stage GitHub Actions pipeline:

```
Push to main
     │
     ▼
┌─── Test ───────────────────────────────┐
│  Spins up PostgreSQL + Redis in CI     │
│  Runs 14 integration tests             │
│  TypeScript type check                 │
└───────────────────┬────────────────────┘
                    │ (only if tests pass)
                    ▼
┌─── Build ──────────────────────────────┐
│  Builds Docker images                  │
│  Pushes to AWS ECR                     │
│  Tags with git SHA + latest            │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌─── Deploy ─────────────────────────────┐
│  Rolling deploy to AWS ECS Fargate     │
│  Waits for health checks to pass       │
│  Zero downtime                         │
└────────────────────────────────────────┘
```

---

## Key Technical Decisions

**Why FastAPI over Django?**
FastAPI is async-native with automatic OpenAPI documentation and Pydantic validation. Better fit for an ML-heavy API where async matters for throughput.

**Why async SQLAlchemy?**
Blocking DB calls pause all concurrent requests. Async allows the server to handle many users while waiting for DB responses.

**Why a custom sentiment classifier instead of an LLM API?**
Running inference on every check-in submission at LLM API rates would be expensive and slow. A local scikit-learn model runs in < 10ms with zero cost per inference — this is how production ML systems work.

**Why Zustand over Redux?**
Redux adds significant boilerplate for the state management needs of this app. Zustand is 1KB, uses React hooks naturally, and avoids unnecessary re-renders.

**Why field-level encryption?**
We handle sensitive mental health data. Even if the database were compromised, encrypted fields (journal notes) are unreadable without the key — defence in depth.

---

## Roadmap

- [x] Milestone 1 — Full-stack scaffold + Docker
- [x] Milestone 2 — JWT auth + protected routes
- [x] Milestone 3 — Anomaly detection + sentiment analysis
- [x] Milestone 4 — Custom ML classifier training
- [x] Milestone 5 — CI/CD pipeline + test suite
- [x] Milestone 6 — AI companion chat UI
- [ ] Milestone 7 — Production deployment (Koyeb)
- [ ] Milestone 8 — Fine-tuned DistilBERT classifier

---

## Author

**Filza Shah**
Computer Science Honours Graduate — University of Guelph (April 2026)

[![GitHub](https://img.shields.io/badge/GitHub-@filzashah-181717?style=flat&logo=github)](https://github.com/filza-shah)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Filza_Shah-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/filza-shah)

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

*MindGuard is not a medical device and does not provide clinical diagnosis or treatment. 
If you are in crisis, please contact the 988 Suicide & Crisis Lifeline (call or text 988) 
or the Crisis Text Line (text HOME to 741741).*
