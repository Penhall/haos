# Architecture — Montage (OpenMontage SaaS)

**Date:** 2026-06-24
**Version:** 1.0
**Status:** Complete

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │             Next.js SPA (Vercel)                              │    │
│  │  / → Landing    /login → Auth    /dashboard → Gallery+Create │    │
│  └───────────────┬─────────────────────────────────────────────┘    │
│                  │ HTTPS                                             │
│  ┌───────────────▼─────────────────────────────────────────────┐    │
│  │          Supabase (Cloud)                                     │    │
│  │  Auth (email+OAuth) │ PostgreSQL │ Storage (videos)           │    │
│  └───────────────┬─────────────────────────────────────────────┘    │
│                  │                                                   │
│  ┌───────────────▼─────────────────────────────────────────────┐    │
│  │          Montage API (FastAPI - VPS)                          │    │
│  │  /api/jobs → CRUD, status    /api/videos → list, download    │    │
│  │  Pipeline Engine: Python orchestration + OpenMontage tools   │    │
│  │  Job Queue: Background tasks (FastAPI BackgroundTasks)       │    │
│  │  Dependencies: FFmpeg, Piper TTS, Node.js (Remotion)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Stack Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React + TypeScript | Mesmo stack do PettoFlow; Vercel deploy; SSR opcional |
| **Styling** | Tailwind CSS + shadcn/ui | Consistência visual, brutalist-friendly |
| **Auth** | Supabase Auth (email/password + Google OAuth) | Gratuito até 50k MAU, SDK maduro |
| **Database** | Supabase PostgreSQL | Mesmo projeto PettoFlow, Row-Level Security |
| **Storage** | Supabase Storage | 1GB gratuito, URLs públicas assinadas |
| **Backend** | Python FastAPI + Uvicorn | OpenMontage tools são Python; async support |
| **Job Queue** | FastAPI BackgroundTasks (MVP) → BullMQ/Redis (scale) | Simples pro MVP, migrável |
| **Pipeline** | OpenMontage tools (subset) + orchestrador próprio | Não usar agent-driven pipeline; usar tools diretamente |
| **TTS** | Piper TTS (local, free) | Zero custo, qualidade aceitável |
| **Images** | Pexels + Pixabay + Unsplash (API gratuita) | Stock images sem custo |
| **Composition** | Remotion (Node.js) via subprocess | React-based, já integrado no OpenMontage |
| **FFmpeg** | System package | Encoding, subtitle burn-in |
| **Deploy (FE)** | Vercel | Já configurado; CDN global |
| **Deploy (BE)** | RunPod / VPS Linux | GPU não necessária pro MVP; FFmpeg + Node.js |
| **CI/CD** | GitHub Actions | Build + test + deploy |
| **Monitoring** | Supabase logs + Vercel Analytics | Simples, já integrado |

## Data Model

### Tables (Supabase PostgreSQL)

```sql
-- Auth: user management via supabase.auth.users (built-in)

-- Jobs: cada requisição de criação de vídeo
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|researching|scripting|gathering|rendering|done|failed
  params JSONB NOT NULL,                   -- {title, topic, duration, platform, style, pipeline}
  script TEXT,                             -- script JSON gerado
  progress INT DEFAULT 0,                  -- 0-100
  result_path TEXT,                        -- path no Supabase Storage
  thumbnail_path TEXT,
  duration_s INT,
  error TEXT,
  cost_estimate REAL,
  cost_actual REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Videos: metadados do vídeo final
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_s INT,
  platform_profile TEXT,  -- youtube_16_9, tiktok_9_16, instagram_1_1
  style_playbook TEXT,    -- clean_professional, flat_motion, minimalist
  size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ  -- NULL = never (Pro)
);

-- user_tier: subscription tracking
CREATE TABLE user_tiers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',  -- free|pro|enterprise
  videos_this_month INT DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT now(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## API Surface

### Public (no auth)
```
GET  /api/health          → {status: "ok"}
```

### Authenticated (Bearer JWT from Supabase)
```
POST   /api/jobs                    → Create video job
GET    /api/jobs                    → List user's jobs
GET    /api/jobs/{job_id}           → Job status + progress
DELETE /api/jobs/{job_id}           → Cancel job

GET    /api/videos                  → List user's videos
GET    /api/videos/{video_id}       → Video metadata
GET    /api/videos/{video_id}/download → Redirect to signed URL
DELETE /api/videos/{video_id}       → Delete video

GET    /api/me                      → User profile + tier + usage
POST   /api/checkout                → Stripe checkout session (Pro)
POST   /api/webhooks/stripe         → Stripe webhook handler
```

### Request/Response Schemas

```json
// POST /api/jobs
{
  "title": "How Neural Networks Learn",
  "topic": "Explain neural networks for beginners",
  "duration": 60,
  "platform": "tiktok",
  "style": "clean_professional",
  "pipeline": "animated_explainer"
}

// GET /api/jobs/{job_id}
{
  "id": "uuid",
  "status": "rendering",
  "progress": 72,
  "params": {...},
  "script": "{...json...}",
  "created_at": "2026-06-24T..."
}
```

## Authentication & Authorization

- **Supabase Auth:** Email/password + Google OAuth
- **JWT:** Supabase issues JWT; frontend passes via `Authorization: Bearer <token>`
- **Backend validation:** FastAPI middleware validates JWT against Supabase JWKS
- **RLS:** Row-Level Security on `jobs` and `videos` — users can only access their own rows
- **Admin:** `user_tiers.tier = 'admin'` bypasses rate limits

## Pipeline Engine

### Simplified Pipeline (MVP — no agent-driven orchestration)

```
1. RECEIVE job (POST /api/jobs)
   → Validate params + tier limits
   → Insert job row (status=pending)
   → Start background task
   → Return job_id

2. RESEARCH (background)
   → Search web for topic (httpx → DuckDuckGo/Brave)
   → Gather key points, data, angles
   → Update job (status=researching, progress=10)

3. SCRIPT (background)
   → LLM call (DeepSeek API) with research data + persona/style context
   → Generate video_script.json (scenes, dialogue, visual prompts)
   → Update job (status=scripting, progress=30)

4. IMAGE GATHERING (background)
   → For each scene: search Pexels/Pixabay/Unsplash
   → Download best match
   → Update job (status=gathering, progress=50)

5. TTS (background)
   → For each scene: Piper TTS on dialogue text
   → Generate .wav files per scene
   → Progress=65

6. RENDER (background)
   → Generate Remotion composition (React component from template)
   → Run: npx remotion render <composition> output.mp4
   → Progress=85
   → Post-render: extract thumbnail, probe duration

7. UPLOAD & FINALIZE
   → Upload MP4 + thumbnail to Supabase Storage
   → Create video row
   → Update job (status=done, progress=100)
   → Email/webhook notification to user
```

### OpenMontage Tools Used (subset)

```
tools/audio/tts_selector.py        → Piper TTS (free path)
tools/audio/piper_tts.py           → Actual TTS execution
tools/graphics/image_selector.py   → Pexels/Pixabay/Unsplash selection
tools/graphics/pexels_image.py     → Stock image download
tools/subtitle/subtitle_gen.py     → SRT generation from timestamps
tools/video/video_stitch.py        → Scene concatenation (if needed)
```

### Remotion Composition

Pre-built Remotion component templates for each pipeline:
- `src/remotion/AnimatedExplainer.tsx` — image scenes + narration + captions
- `src/remotion/SocialClip.tsx` — fast-paced vertical clip with karaoke captions

## Deployment Architecture

```
┌───────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Vercel      │────▶│   Supabase Cloud  │◀────│   VPS (RunPod)    │
│  (Next.js FE) │     │  Auth + DB + Store│     │  FastAPI + Tools  │
│               │     │                   │     │  FFmpeg + Piper   │
│  CDN edge     │     │  Managed service  │     │  Node.js (Remo.)  │
└───────────────┘     └──────────────────┘     └───────────────────┘
```

- **Vercel:** Frontend SPA. Já configurado (proj PettoFlow). Domínio customizado.
- **Supabase:** Projeto `montage`. Auth, DB, Storage. Free tier até escala.
- **VPS (RunPod/alternativa):** Servidor Linux com Python 3.12+, FFmpeg, Node.js 18+, Piper TTS. Expõe FastAPI na porta 8000.

### VPS Setup (script provisionamento)
```bash
# Dependências
apt install ffmpeg python3-pip nodejs npm
pip install fastapi uvicorn httpx python-dotenv piper-tts opencv-python-headless
npm install -g @remotion/cli

# OpenMontage tools (usar direto do clone)
git clone https://github.com/calesthio/OpenMontage.git /opt/openmontage
pip install -r /opt/openmontage/requirements.txt

# Piper TTS voices
# Download pt-BR + en-US voice models
```

## Security Considerations

- **JWT validation:** Validar contra Supabase JWKS endpoint, não hardcoded secret
- **Storage URLs:** Signed URLs com expiry (1h para download, 7d para preview)
- **Rate limiting:** Por user + por IP. 3 jobs/dia free, 30/dia Pro
- **Input sanitization:** Títulos e tópicos escapados antes de LLM prompt
- **File upload:** Tamanho máximo 10MB (futuro: upload de áudio próprio)
- **CORS:** Restrito ao domínio Vercel
- **Secrets:** API keys via variáveis de ambiente, nunca em código
- **AGPL compliance:** Código do backend publicado em `github.com/Penhall/montage-backend`

## Observability

| Sinal | Ferramenta |
|---|---|
| **Logs** | Python logging → stdout → journald |
| **Errors** | Sentry (free tier) ou Supabase error logs |
| **Metrics** | Supabase dashboard + custom counters (jobs created, videos rendered) |
| **Alerts** | UptimeRobot no health endpoint |
| **Cost tracking** | Tabela `jobs.cost_actual` com agregação por user/dia |

## Infrastructure Costs (MVP)

| Recurso | Provider | Custo/mês estimado |
|---|---|---|
| Frontend hosting | Vercel (Hobby) | $0 |
| Database | Supabase (Free) | $0 (500MB) |
| Auth | Supabase (Free) | $0 (50k MAU) |
| Storage | Supabase (Free) | $0 (1GB) |
| Backend server | RunPod / Hetzner | ~$20-40 (CPU-only) |
| LLM API | DeepSeek | ~$5 (scripts) |
| **TOTAL** | | **~$25-45/mês** |

*Nota:* Sem GPU no MVP. Quando GPU for necessária (WAN/Hunyuan), custo sobe para $0.50-2.00/hora.
