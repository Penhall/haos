# COMMAND_CENTER — Montage

**Active Project:** Montage (OpenMontage SaaS)
**Current Goal:** Pipeline 100% funcional com progresso em tempo real. Próximo: API keys reais + assets customizados.
**Next Step:** Configurar DEEPSEEK_API_KEY e PEXELS_API_KEY para geração com qualidade real

## Running Processes
| Process | Session ID | Status |
|---|---|---|
| PostgreSQL 17 | Docker montage-postgres | Running (healthy) |
| Backend (uvicorn) | proc_6d63cf73e59a | Running :8000 |
| Frontend (next start) | proc_e04146bbb286 | Running :3000 |

## Architecture (updated 2026-06-28)
- **Database:** PostgreSQL 17 (Docker, porta 5432, DB montage, user authenticator)
- **Backend:** FastAPI (porta 8000), asyncpg, HS256 JWT + bcrypt
- **Frontend:** Next.js 16 (produção `next start`, porta 3000), rewrite /api/* → localhost:8000
- **Auth:** Local — POST /api/auth/{signup,login} → JWT → localStorage
- **Storage:** Local filesystem (/root/montage/data/videos/)
- **Pipeline:** 6 estágios (research → script → images → TTS → render → upload), todos funcionais com stubs
- **Remotion:** AnimatedExplainer.tsx, render via subprocess, gera MP4 1080x1920
- **Progress:** progress_message + stage_started_at no banco, polling frontend a cada 1.5s
- **Deploy:** Nenhum. Desenvolvimento 100% local. Vercel removido.

## Users (PostgreSQL local)
| Email | Password | is_admin | Tier |
|---|---|---|---|
| admin@montage.local | Admin!234 | true | pro |
| tester@montage.local | Test!234 | false | free |

## Context Files
- `/root/haos/projects/openmontage-saas/discovery.md`
- `/root/haos/projects/openmontage-saas/prd.md`
- `/root/haos/projects/openmontage-saas/architecture.md`
- `/root/haos/projects/openmontage-saas/ui.md`
- `/root/haos/projects/openmontage-saas/tasks.md`
- `/root/haos/projects/openmontage-saas/execution-log.md`
- `/root/haos/projects/openmontage-saas/decisions.md`
- `/root/montage/docker/compose.yaml`
- `/root/montage/backend/.env`

## Decisions Log
- ✅ PostgreSQL local Docker substituiu Supabase (2026-06-26)
- ✅ Auth local HS256 JWT + bcrypt substituiu Supabase Auth
- ✅ is_admin flag nos usuários
- ✅ Frontend migrado de Supabase → local JWT auth (CodeWhale)
- ✅ Tailscale Funnel testado e desligado — foco local
- ✅ Vercel removido — desenvolvimento 100% local
- ✅ Pipeline usa stubs (sem API keys) — placeholder images, silent audio
- ✅ Remotion AnimatedExplainer funcional com zod 4.3.6
- ✅ CTA overlay condicional (evita durationInFrames negativo)
- ✅ Next.js rewrite /api/* → backend evita CORS
- ✅ Frontend build de produção (next start, sem HMR WebSocket)
- ✅ Progress tracking granular com stage_started_at + progress_message
- ✅ ProgressOverlay modal com polling 1.5s durante criação
- ↔️ API keys pendentes (DEEPSEEK, PEXELS) para qualidade real
- ↔️ Tauri desktop: SQLite local ou conectar ao PostgreSQL
- MVP sem GPU — Remotion + stubs + Piper TTS
- Frontend brutalist (Space Grotesk + zero border-radius)
- AGPL-3.0 (herda do OpenMontage)
