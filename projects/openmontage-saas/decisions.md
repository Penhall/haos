# Decisions — Montage

Decisões de arquitetura e design tomadas durante o desenvolvimento.

---

## D001 — PostgreSQL local em vez de Supabase

**Data:** 2026-06-26
**Contexto:** Impossibilidade de obter service_role key do Supabase (403/401 em todas as tentativas: CLI token, API de gestão, logs). Sem essa key, o schema SQL não podia ser executado.
**Alternativas consideradas:**
- Continuar tentando obter a key (bloqueante, sem garantia)
- PostgreSQL local via Docker (controle total, zero dependência externa)
- SQLite (simples mas sem suporte a tipos avançados)
**Decisão:** PostgreSQL 17 via Docker (container `montage-postgres`)
**Consequências:**
- ✅ Schema executado imediatamente, sem bloqueio
- ✅ Desenvolvimento 100% local, sem dependência de cloud
- ✅ asyncpg substitui supabase-py (mais performático)
- ❌ Perde RLS policies (não necessárias com backend monolítico)
- ❌ Precisa gerenciar backups manualmente (pg_dump)
**Review:** Manter até deploy em produção. Para produção, considerar Supabase gerenciado ou RDS.

---

## D002 — Auth HS256 JWT + bcrypt em vez de Supabase Auth (JWKS)

**Data:** 2026-06-26
**Contexto:** Migração do Supabase exigia substituir todo o stack de auth.
**Alternativas:**
- HS256 JWT shared secret (simples, single-service)
- RS256 JWT com par de chaves (mais seguro, overkill para MVP)
- OAuth2 com Google via Supabase (perdeu-se ao migrar)
**Decisão:** HS256 JWT com secret de 32 bytes + bcrypt para hash de senhas
**Consequências:**
- ✅ Implementação simples, sem dependência externa
- ✅ is_admin flag no próprio JWT payload
- ✅ bcrypt direto (sem passlib) evita bug "password too long"
- ❌ Sem refresh tokens (JWT único, expira em 24h)
- ❌ Sem Google OAuth (perdeu-se na migração)
**Review:** Antes de produção, avaliar reintroduzir Google OAuth.

---

## D003 — Storage filesystem local em vez de Supabase Storage

**Data:** 2026-06-26
**Contexto:** Supabase Storage dependia de service_role key. Sem ela, sem buckets.
**Alternativas:**
- Filesystem local (data/videos/)
- S3-compatible (MinIO, overkill)
- NFS / volume compartilhado
**Decisão:** Filesystem local em `/root/montage/data/videos/`
**Consequências:**
- ✅ Zero dependência externa
- ✅ Vídeos acessíveis via path direto (não signed URLs)
- ❌ Sem CDN / cache de borda
- ❌ Backup manual necessário
**Review:** Para produção, migrar para S3 ou Supabase Storage com CDN.

---

## D004 — Pipeline com stubs (sem API keys)

**Data:** 2026-06-26
**Contexto:** DEEPSEEK_API_KEY, PEXELS_API_KEY, PIXABAY_API_KEY não configuradas. Pipeline precisa funcionar para teste.
**Decisão:** Cada estágio tem fallback para stub quando API key ausente:
- Research: DuckDuckGo (sempre funciona)
- Script: stub com título + 3 cenas placeholder
- Images: placeholder 1080x1920 colorido via FFmpeg
- TTS: silent WAV 2s por cena
- Render: Remotion com assets placeholder
**Consequências:**
- ✅ Pipeline 100% testável sem credenciais
- ✅ Desenvolvimento não bloqueado por burocracia de API keys
- ❌ Qualidade do output é placeholder (imagens sólidas, áudio mudo)
**Review:** Configurar API keys reais antes de qualquer demo ou produção.

---

## D005 — Next.js rewrite /api/* → backend (evita CORS)

**Data:** 2026-06-26
**Contexto:** Frontend em localhost:3000 fazendo fetch para localhost:8000 causava problemas de CORS + hardcoded URLs nos chunks de produção.
**Alternativas:**
- Rewrite no next.config.ts (proxy reverso no servidor)
- CORS no backend + URLs relativos
- Variável de ambiente NEXT_PUBLIC_API_URL
**Decisão:** Rewrite em next.config.ts + paths relativos no frontend
**Consequências:**
- ✅ Navegador nunca vê localhost:8000 (elimina CORS)
- ✅ Funciona em qualquer máquina na rede local
- ✅ Build de produção sem chunks hardcoded
- ❌ Next.js production server obrigatório (next start, não static export)
**Review:** Manter. Para deploy estático no futuro, reavaliar.

---

## D006 — Remotion zod 4.3.6 + CTA overlay condicional

**Data:** 2026-06-26
**Contexto:** Remotion package.json usava zod 3.25, incompatível com schema. CTA overlay causava durationInFrames negativo quando CTA começava após o fim do vídeo.
**Decisão:**
- Atualizar zod para 4.3.6 (compatível com schema atual)
- CTA overlay só renderiza se `ctaFrame < totalFrames`
- staticFile() removido em favor de paths relativos
**Consequências:**
- ✅ Render nunca falha por duration negativo
- ✅ Schema validation funciona corretamente
**Review:** Sempre testar durations antes de adicionar overlays condicionais.

---

## D007 — Progress tracking: progress_message + stage_started_at

**Data:** 2026-06-28
**Contexto:** Usuário queria ver percentual, slides, cronômetro durante criação do vídeo.
**Alternativas:**
- WebSocket para progresso em tempo real (complexo, overkill)
- Polling HTTP com progress_message no banco (simples, funcional)
- Server-Sent Events (SSE)
**Decisão:** Polling HTTP a cada 1.5s com progress_message + stage_started_at no PostgreSQL
**Consequências:**
- ✅ Implementação simples (2 colunas novas, 1 endpoint existente)
- ✅ Frontend mostra cronômetro por estágio, mensagem descritiva, percentual
- ✅ ProgressOverlay modal com auto-close ao finalizar
- ❌ Latência de até 1.5s entre atualizações
- ❌ Sem progresso intra-estágio (ex: frame atual do Remotion)
**Review:** Para produção, considerar SSE ou WebSocket para progresso sub-segundo.

---

## D008 — Frontend build de produção (next start)

**Data:** 2026-06-26
**Contexto:** `next dev` com HMR WebSocket quebrava conexões de outras máquinas na rede (Windows).
**Decisão:** Build de produção (`next build` + `next start`) para desenvolvimento
**Consequências:**
- ✅ Sem WebSocket HMR (conexões estáveis de qualquer máquina)
- ✅ Performance de produção durante desenvolvimento
- ❌ Sem hot reload (precisa rebuild a cada alteração no frontend)
**Review:** Aceitável para fase atual. Para desenvolvimento intenso de UI, voltar para dev mode localmente.
