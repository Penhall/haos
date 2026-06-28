# Execution Log — Montage MVP

**Date:** 2026-06-24
**Agent:** Hermes (orchestrator) + CodeWhale (executor)

---

## Phase 1 — Foundation

| Task | Status | Agent | Notes |
|---|---|---|---|
| T1.1 — Criar repositório | ✅ Done | Hermes | `gh repo create Penhall/montage` |
| T1.2 — Supabase schema | ✅ Done | Hermes | Schema SQL criado, execução pendente (precisa service_role key) |
| T4.1 — Next.js setup | ✅ Done | CodeWhale | Frontend criado com create-next-app, brutalist theme |

## Phase 2 — Backend

| Task | Status | Agent | Notes |
|---|---|---|---|
| T2.1 — FastAPI skeleton | ✅ Done | CodeWhale | 24 arquivos, structlog, CORS, auth middleware |
| T2.2 — DB schema | ✅ Done | Hermes | 001_initial.sql com RLS, trigger, storage bucket |
| T2.3 — Jobs API | ✅ Done | CodeWhale | CRUD completo, BackgroundTasks, tier validation |
| T2.4 — Videos API | ✅ Done | CodeWhale | List/download com signed URLs, delete com storage cleanup |
| T2.5 — Tier management | ✅ Done | CodeWhale | Middleware rate limiting, auto-create on signup |

## Phase 3 — Pipeline Engine

| Task | Status | Agent | Notes |
|---|---|---|---|
| T3.1 — Pipeline orchestrator | ✅ Done | CodeWhale | 235 linhas, 6 estágios, error handling |
| T3.2 — Research | ✅ Done | CodeWhale | DuckDuckGo search + stub fallback |
| T3.3 — Script generation | ✅ Done | CodeWhale | DeepSeek API + fallback stub |
| T3.4 — Image gathering | ✅ Done | CodeWhale | Pexels → Pixabay → Unsplash cascade |
| T3.5 — TTS | ✅ Done | CodeWhale | Piper TTS → espeak-ng → stub |
| T3.6 — Render | ✅ Done | CodeWhale + Hermes | Remotion via subprocess + FFmpeg stub |
| T3.7 — Upload | ✅ Done | CodeWhale | Supabase Storage + signed URLs |

## Phase 4 — Frontend Core

| Task | Status | Agent | Notes |
|---|---|---|---|
| T4.2 — Auth integration | ✅ Done | CodeWhale | Email+password+Google OAuth, middleware |
| T4.3 — Landing page | ✅ Done | CodeWhale | 5 seções, brutalist design |
| T4.4 — Dashboard | ✅ Done | CodeWhale | Galeria + create form + polling + todos estados |
| T4.5 — Video detail | ✅ Done | CodeWhale | Player + metadata + download/delete |
| T4.6 — Settings | ✅ Done | CodeWhale | Tier info + upgrade CTA + danger zone |

## Phase 5 — Remotion

| Task | Status | Agent | Notes |
|---|---|---|---|
| Remotion init | ✅ Done | Hermes | CodeWhale travou no prompt interativo; feito manualmente |
| AnimatedExplainer | ✅ Done | Hermes | Ken Burns + subtitles + CTA + watermark |
| SocialClip | ✅ Done | Hermes | TikTok word captions + fast pacing |

## Final Stats

- **75 files** committed
- **5,664 lines** of code (2,395 BE + 2,338 FE + 593 Remotion + 84 SQL + docs)
- **22 Python files** — all syntax-valid
- **1 commit:** `5a4d217` pushed to `github.com/Penhall/montage`

---

## Session 2026-06-26 — Local Migration & Auth Refactor

**Agent:** Hermes (orchestrator) + CodeWhale (frontend executor)

| Task | Status | Agent | Notes |
|---|---|---|---|
| Migrate DB Supabase → PostgreSQL local | ✅ Done | Hermes | Docker PostgreSQL 17, asyncpg pool, schema executado |
| Auth refactor JWKS → HS256 JWT + bcrypt | ✅ Done | Hermes | Removeu supabase-py, passlib; bcrypt direto |
| Storage Supabase → filesystem local | ✅ Done | Hermes | data/videos/ substitui buckets |
| Backend is_admin + seed users | ✅ Done | Hermes | admin@montage.local / Admin!234, tester@montage.local / Test!234 |
| Frontend Supabase → local JWT auth | ✅ Done | CodeWhale | 46 refs migradas, useAuth() cookie→localStorage |
| Tailscale Funnel + Vercel deploy | ✅ Testado | Hermes | Funcionou mas latência alta; removido por decisão do usuário |
| CORS + bare path aliases (funnel compat) | ✅ Done | Hermes | /health, /auth/* aliases para stripped paths |
| Fix JWT secret 32 bytes | ✅ Done | Hermes | HS256 mín 32 bytes; corrigido warning InsecureKeyLengthWarning |

---

## Session 2026-06-26 (evening) — Pipeline Debugging & Remotion Fixes

**Agent:** Hermes (orchestrator + hands-on debug)

### Pipeline end-to-end debugging
| Issue | Status | Notes |
|---|---|---|
| asyncpg datetime coercion | ✅ Fixed | ISO string → datetime object em db.py `_coerce_value()` |
| Remotion `could not determine executable` | ✅ Fixed | Adicionado nome composição `AnimatedExplainer`, cwd correto |
| Remotion staticFile() paths absolutos | ✅ Fixed | Substituído por paths relativos ou props diretas |
| zod version (3.25→4.3.6) | ✅ Fixed | npm install zod@4.3.6 no remotion/ |
| Render props camelCase | ✅ Fixed | `_build_render_props()` gera title, scenes, audioUrl, durationInFrames, fps |
| Imagem placeholder 1x1 pixel | ✅ Fixed | FFmpeg gera placeholder 1080x1920 colorido |
| Assets copiados para remotion/public/ | ✅ Done | Imagens + áudio copiados antes do render |

### Frontend-Backend integration debugging
| Issue | Status | Notes |
|---|---|---|
| Next.js chunks hardcoded localhost:8000 | ✅ Fixed | Implementado rewrite em next.config.ts + paths relativos |
| Processo zumbi Next.js porta 3000 | ✅ Fixed | kill -9 em PIDs antigos; rebuild limpo |
| Formulário valores não mapeados (422) | ✅ Fixed | PLATFORM_MAP + STYLE_MAP em api.ts convertem form→enum |
| Vídeos sem status no frontend | ✅ Fixed | Campo `status: "done"` adicionado ao VideoSummary |
| dynamicParams=false quebrando rotas | ✅ Fixed | Trocado para true em videos/[id]/page.tsx |
| CTA overlay causando durationInFrames negativo | ✅ Fixed | Condição `ctaFrame < totalFrames` antes de renderizar overlay |

### Resultado
- Pipeline 100% funcional: 6 estágios executam com sucesso
- Remotion gera MP4 2.6 MB em ~60s com stubs
- Frontend build limpo, sem referências a localhost:8000
- Fluxo end-to-end: login → criar job → pipeline → vídeo no dashboard

### Commits
- `d54ff3a` — fix: pipeline Remotion CTA overlay + frontend-backend alignment

---

## Session 2026-06-28 — Real-time Progress Tracking

**Agent:** Hermes (full-stack)

### Database
| Change | Notes |
|---|---|
| ADD COLUMN progress_message TEXT | Mensagem descritiva do estágio atual |
| ADD COLUMN stage_started_at TIMESTAMPTZ | Timestamp de início de cada estágio |
| Schema init.sql atualizado | docker/init.sql reflete novas colunas |

### Backend
| Change | File | Notes |
|---|---|---|
| Models atualizados | models.py | Job, JobDetail, JobSummary com progress_message + stage_started_at |
| Routes atualizadas | routes/jobs.py | _row_to_job_detail + list_jobs retornam novos campos |
| Pipeline engine refatorado | pipeline/engine.py | Novo método `_stage_start()` grava timestamp + mensagem |
| Stage labels mapping | pipeline/engine.py | STAGE_LABELS dict: pending→"Preparing", researching→"Researching topic", etc. |
| Mensagens por estágio | pipeline/engine.py | "Searching images for 3 scenes...", "Audio: 3/3 slides voiced", etc. |
| _set_progress_msg() | pipeline/engine.py | Atualiza progress + message em uma chamada |

### Frontend
| Change | File | Notes |
|---|---|---|
| API types | api.ts | Video + Job interfaces com progress_message + stage_started_at |
| JobProgress turbo | JobProgress.tsx | Cronômetro por estágio (elapsed timer), barra de progresso, mensagem detalhada |
| ProgressOverlay (novo) | ProgressOverlay.tsx | Modal full-screen que faz polling a cada 1.5s do GET /api/jobs/{id} |
| VideoCard atualizado | VideoCard.tsx | Passa progress_message + stage_started_at para JobProgress |
| Dashboard integrado | dashboard/page.tsx | activeJobId state → mostra overlay ao criar job |

### Teste end-to-end
- Job criado → progressão visível em tempo real:
  - Researching (0-20%): "Searching the web..."
  - Scripting (20-40%): "Script ready: 3 scenes, 30s"
  - Images (40-60%): "Images: 3/3 found"
  - TTS (60-75%): "Audio: 3/3 slides voiced"
  - Rendering (75-95%): "Rendering 3-scene video with Remotion..."
  - Completed (100%): "Complete!"
- Overlay fecha automaticamente ao finalizar
- Botão "View Video" aparece para navegar ao vídeo

### Commit
- `61ecf92` — feat: real-time progress tracking with stage messages + timer

---

## Current State (2026-06-28)

- **Backend:** FastAPI :8000, asyncpg, HS256 JWT, 6-stage pipeline functional
- **Frontend:** Next.js :3000 produção (next start), brutalist theme, progress overlay
- **Database:** PostgreSQL 17 Docker, 3 users, jobs com progress_message + stage_started_at
- **Pipeline:** 100% funcional com stubs (sem API keys para pesquisa/imagens/TTS)
- **Remotion:** AnimatedExplainer renderiza MP4 válido (~2.6 MB, ~60s)
- **Auth:** Local JWT + bcrypt, admin@montage.local / Admin!234
- **Deploy:** Nenhum ativo. Desenvolvimento 100% local.

## Pending (priorizado)

| Item | Priority | Notes |
|---|---|---|
| API keys (DEEPSEEK, PEXELS) para produção real | P0 | Stubs funcionam mas qualidade é placeholder |
| Melhorar progresso intra-estágio (per-scene) | P1 | Hoje atualiza só entre estágios |
| Upload de assets customizados | P1 | Endpoints existem, UI não testada |
| Tauri: conectar ao mesmo PostgreSQL | P1 | Reutilizar auth JWT, adaptar para SQLite local |
| Stripe integration | P2 | Checkout + webhooks |
| Background music para Remotion | P2 | Pixabay música gratuita |
| VPS deploy | P2 | Hetzner CX22, nginx + systemd |

---

## Session 2026-06-28 — Bug Fixes + UX Sprint (HAOS delegation)

**Agent:** Hermes (orchestrator) + CodeWhale (P0-A, P0-B, P1-A, P1-B executor) + CodeWhale (auditor)

### Methodology
First full HAOS delegation cycle:
1. Hermes: wrote specs in tasks.md with acceptance criteria
2. CodeWhale: implemented 4 tasks in parallel batches
3. CodeWhale: auditing all changes (in progress)
4. Hermes: validating outputs, updating HAOS

### Batch 1 — P0 Fixes (parallel)
| Task | Agent | Status | Notes |
|---|---|---|---|
| P0-A: Fix video player + VideoDetailClient | CodeWhale | ✅ Done | Fixed broken video source (was string-replace on thumbnail URL), added downloadUrl state, metadata field alignment (duration_s, style_playbook, platform_profile) |
| P0-B: Dashboard bugs + jobs feed | CodeWhale | ✅ Done | tierUsed from /api/me, doneCount uses real value, processing jobs in gallery, settings shows real count, polling at 3s |

### Batch 2 — P1 Features (parallel)
| Task | Agent | Status | Notes |
|---|---|---|---|
| P1-A: Per-scene progress in pipeline | CodeWhale | ✅ Done | images.py + tts.py changed from asyncio.gather to sequential loop with progress_callback. Engine interpolates progress within stage ranges: Images 1/3→46%, 2/3→53%, 3/3→60% |
| P1-B: Landing page redirect | CodeWhale | ✅ Done | Logged-in users redirected to /dashboard. Spinner during auth check, zero flicker. |

### Files changed
- 10 files: 3 backend (pipeline), 7 frontend (pages, components, types)
- 169 insertions, 77 deletions
- TypeScript: 0 errors
- Build: clean

### Test Results
- Pipeline e2e: ✅ Completed (per-scene progress verified)
- Frontend build: ✅ 0 errors
- Backend imports: ✅ All modules load

### Audit
| Finding | Severity | Description | Status |
|---|---|---|---|
| Video model missing `status` field | HIGH | Backend Video model didn't include status; all videos showed "Generation failed" | ✅ Fixed (added status="done") |
| Type narrowing in VideoDetailClient | LOW | TypeScript type guards for video states | ✅ Handled |
| Pipeline fallback behavior | LOW | Silent WAV durations documented correctly | ✅ Documented |

### Commit
- `1e00152` — 12 files, +172/-78, pushed to Penhall/montage

