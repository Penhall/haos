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

## Agent Delegation Rules (mandatory)

**Regra de ouro:** Hermes (DeepSeek V4 Pro, caro) NÃO implementa features. Hermes orquestra.
Feature → delegar. Integração/debug/arquitetura → Hermes.

### Matriz de delegação

| Tipo de tarefa | Executor | Custo estimado | Auditor | Quando |
|---|---|---|---|---|
| **Feature multi-arquivo** (>3 arquivos) | CodeWhale | ~$0.02-0.05 | Codex | Sempre que escopos disjuntos |
| **Feature isolada** (≤3 arquivos) | Codex | ~$0.05-0.15 | CodeWhale | Tarefa bem especificada |
| **Correção cirúrgica** | Codex | ~$0.05-0.15 | Hermes | ≤2 arquivos, bug bem definido |
| **Refatoração paralelizável** | CodeWhale (batch) | ~$0.05-0.10 | Codex | Escopos disjuntos em paralelo |
| **Auditoria de segurança** | Codex | ~$0.05-0.15 | Hermes | Command-oriented (grep, lint, build) |
| **Auditoria E2E/specs** | Hermes ou Claude Code | ~$0.70-1.10 | N/A | Codex trava em cross-reference |
| **Integração entre subsistemas** | Hermes | DeepSeek V4 Pro | Codex pós-integração | Contexto complexo |
| **Decisão de arquitetura** | Hermes | DeepSeek V4 Pro | HAOS decisions.md | Sempre |

### Ciclo de implementação padrão

```
1. Hermes: especifica tarefa no tasks.md (acceptance criteria)
2. CodeWhale ou Codex: implementa
3. Codex ou CodeWhale (oposto ao executor): audita
4. Hermes: valida output, testa e2e, atualiza HAOS, commit
```

### Restrições de toolsets

| Função | Toolsets | Justificativa |
|---|---|---|
| Executor | terminal, file, web | Precisa instalar deps, buscar docs |
| Auditor | terminal, file | Sem web — não deve buscar soluções externas |
| Hermes | Todos | Orquestrador precisa de contexto completo |

**Nunca:** dar `skills` toolset a subagentes. **Nunca:** `browser` + `terminal` juntos a subagentes.

Reference: `safe-delegate` skill para padrões detalhados de delegação segura.

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
