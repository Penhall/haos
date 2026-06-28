# Tasks — Montage

**Date:** 2026-06-24 (updated 2026-06-28)
**Agent Assignments:** Hermes (orchestrator), CodeWhale (executor), Codex (auditor)

---

## Epic 1: Project Setup

### T1.1 — Criar repositório e estrutura base ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T1.2 — Configurar Supabase project ❌ (substituído)
**Priority:** P0 (was) | **Status:** Superseded by D001 (PostgreSQL local)
**Nota:** Schema SQL migrado para PostgreSQL local. Supabase não é mais utilizado.

### T1.3 — Configurar Vercel project ❌ (removido)
**Priority:** P0 (was) | **Status:** Removido (D005 — next start local)
**Nota:** Vercel deploy testado, funcional, mas removido por decisão do usuário (foco local).

---

## Epic 2: Backend Core

### T2.1 — FastAPI app skeleton ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T2.2 — Database migrations ✅
**Priority:** P0 | **Agent:** Hermes
**Nota:** Schema executado em PostgreSQL local (Docker). init.sql + migrations/001_initial.sql.

### T2.3 — Jobs API endpoints ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T2.4 — Videos API endpoints ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T2.5 — Tier management ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

---

## Epic 3: Pipeline Engine

### T3.1 — Pipeline orchestrator ✅
**Priority:** P0 | **Agent:** CodeWhale + Hermes | **Commit:** 5a4d217, 61ecf92
**Nota:** Refatorado em 2026-06-28 para progress tracking granular.

### T3.2 — Research stage ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T3.3 — Script generation ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T3.4 — Image gathering ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T3.5 — TTS stage ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T3.6 — Remotion render stage ✅
**Priority:** P0 | **Agent:** CodeWhale + Hermes | **Commit:** d54ff3a
**Nota:** Diversos bugs corrigidos: zod 4.3.6, CTA condicional, staticFile, placeholder images.

### T3.7 — Upload & finalize stage ✅
**Priority:** P0 | **Agent:** CodeWhale + Hermes
**Nota:** Adaptado para filesystem local (D003).

---

## Epic 4: Frontend Core

### T4.1 — Next.js app setup ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T4.2 — Auth integration ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 6b90996
**Nota:** Migrado de Supabase Auth para JWT local. 46 referências substituídas.

### T4.3 — Landing page ✅
**Priority:** P0 | **Agent:** CodeWhale | **Commit:** 5a4d217

### T4.4 — Dashboard page ✅
**Priority:** P0 | **Agent:** CodeWhale + Hermes | **Commit:** 61ecf92
**Nota:** ProgressOverlay adicionado em 2026-06-28 para tracking em tempo real.

### T4.5 — Video detail page ✅
**Priority:** P1 | **Agent:** CodeWhale + Hermes | **Commit:** d54ff3a
**Nota:** dynamicParams corrigido para true; status "done" adicionado.

### T4.6 — Settings page ✅
**Priority:** P1 | **Agent:** CodeWhale | **Commit:** 5a4d217

---

## Epic 5: Payment & Tiers

### T5.1 — Stripe integration 🔄
**Priority:** P1 | **Status:** Estrutura existe (rotas, modelos), não testada
**Próximo:** Configurar Stripe test mode, testar checkout flow

### T5.2 — Watermark system 🔄
**Priority:** P1 | **Status:** Parcial — Remotion tem estrutura para overlay, não testado por tier
**Próximo:** Condicionar watermark ao tier do usuário

---

## Epic 6: VPS Provisioning & Deploy

### T6.1 — VPS setup script ⬜
**Priority:** P2 | **Status:** Não iniciado (foco local)

### T6.2 — Backend deploy ⬜
**Priority:** P2 | **Status:** Não iniciado

### T6.3 — Frontend deploy ⬜
**Priority:** P2 | **Status:** Não iniciado

---

## Epic 7: Polish & Launch

### T7.1 — Error handling & edge cases 🔄
**Priority:** P1 | **Status:** Parcial — auth errors, rate limit, connection lost cobertos
**Próximo:** Retry automático, timeout handling no pipeline

### T7.2 — SEO & meta tags ⬜
**Priority:** P2 | **Status:** Não iniciado

### T7.3 — Analytics ⬜
**Priority:** P2 | **Status:** Não iniciado

---

## Novas Tasks (pós-MVP)

### T8.1 — Configurar API keys reais
**Priority:** P0 | **Agent:** Hermes
**AC:** DEEPSEEK_API_KEY, PEXELS_API_KEY configurados no .env. Pipeline gera conteúdo real.
**Subtasks:**
- Obter/verificar DEEPSEEK_API_KEY
- Obter/verificar PEXELS_API_KEY (gratuita, 200 req/h)
- Testar pipeline com keys reais (script com IA, imagens reais)

### T8.2 — Progresso intra-estágio (per-scene)
**Priority:** P1 | **Agent:** CodeWhale
**AC:** Durante images/TTS, progresso atualiza a cada cena processada, não só no final.
**Subtasks:**
- images.py: callback de progresso após cada download
- tts.py: callback após cada arquivo gerado
- engine.py: interpolar progresso dentro do range do estágio

### T8.3 — Upload de assets customizados
**Priority:** P1 | **Agent:** CodeWhale
**AC:** Usuário pode fazer upload de imagens/áudio próprios para usar no vídeo.
**Subtasks:**
- Frontend: componente de upload (drag & drop)
- Backend: endpoint POST /api/assets (já existe estrutura)
- Pipeline: usar assets do usuário em vez de search

### T8.4 — Tauri desktop: conectar ao PostgreSQL ou SQLite
**Priority:** P1 | **Agent:** Hermes
**AC:** App desktop Tauri funcional com autenticação.
**Alternativas:**
- Conectar ao mesmo PostgreSQL local (reutilizar backend)
- SQLite local com schema espelhado (offline-first)
**Decisão pendente (ver D009)**

### T8.5 — Background music para Remotion
**Priority:** P2 | **Agent:** CodeWhale
**AC:** Trilha sonora de fundo nos vídeos (Pixabay música gratuita).
