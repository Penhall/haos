# Tasks — Montage

**Date:** 2026-06-24 (updated 2026-06-28)
**Agent Assignments:** Hermes (orchestrator), CodeWhale (executor), Codex (auditor), Claude Code (complex)

---

## Sprint Atual: Bug Fixes + UX (2026-06-28)

### P0-A — Consertar player de vídeo + VideoDetailClient

**Priority:** P0 | **Agent:** CodeWhale | **Auditor:** Codex
**Scope:** frontend only
**Files:** `VideoDetailClient.tsx`, `api.ts`

**AC:**
- Player de vídeo carrega o MP4 correto (usar `getVideoDownloadUrl(id)`)
- Video source NÃO depende da existência de thumbnail
- JobProgress recebe os 3 novos props (progressMessage, stageStartedAt, createdAt)
- Estados cobertos: done (player visível), processing (JobProgress completo), failed (mensagem)
- Thumbnail aparece como poster do player quando disponível
- Download via `getVideoDownloadUrl` — não string replace

**Contexto técnico:**
- Backend retorna `/api/videos/{id}/download` → FileResponse com o MP4
- Backend retorna `/api/videos/{id}/thumbnail` → FileResponse com JPEG
- `getVideoDownloadUrl(id)` já existe em `api.ts` e funciona
- `getVideo(id)` retorna `Video` com campos `thumbnail_url` (string URL), `download_url` (já incluso na resposta mas não no tipo)
- Atualizar interface `Video` em `api.ts` para incluir `download_url: string`

---

### P0-B — Dashboard bugs (tierUsed, doneCount, jobs visíveis)

**Priority:** P0 | **Agent:** CodeWhale | **Auditor:** Codex
**Scope:** frontend only
**Files:** `dashboard/page.tsx`, `settings/page.tsx`, `api.ts`

**AC:**
- `tierUsed` usa `videos_this_month` do `/api/me` (não 0 hardcoded)
- `doneCount` conta corretamente vídeos do mês (via `/api/me`)
- Settings page mostra o valor real de `videos_this_month`
- Rate limiting usa o valor real (não `allItems.length`)
- Jobs em processamento aparecem na galeria como cards com JobProgress
- Polling unificado: jobs em processamento + vídeos, a cada 3s

**Contexto técnico:**
- `/api/me` retorna `{videos_this_month: int, tier: string, videos_limit: int}`
- `/api/jobs` retorna `[{id, status, progress, progress_message, stage_started_at, title, created_at}]`
- `/api/videos` retorna `[{id, title, status, thumbnail_url, duration_s, created_at, download_url}]`
- Dashboard atual só chama `getVideos()`, nunca `getJobs()`
- `tierUsed` state existe mas nunca é atualizado no modo web
- Settings page linha 24: `setUsed(0)` — precisa buscar de `/api/me`

---

### P1-A — Progresso per-scene no pipeline

**Priority:** P1 | **Agent:** CodeWhale | **Auditor:** Codex
**Scope:** backend only
**Files:** `pipeline/engine.py`, `pipeline/images.py`, `pipeline/tts.py`

**AC:**
- Durante estágio de imagens, progresso atualiza após cada imagem baixada
- Durante estágio de TTS, progresso atualiza após cada arquivo de áudio gerado
- Progresso interpolado dentro do range do estágio (ex: images 40-60%, 5 cenas → 40→44→48→52→56→60)
- progress_message atualiza: "Images: 1/5", "Images: 2/5", etc.
- Estágio de render mantém progresso atual (não tem como granularizar Remotion subprocess)

**Contexto técnico:**
- images.py usa `asyncio.gather` para baixar todas imagens em paralelo
- TTS.py também usa `asyncio.gather`
- Para granularizar, trocar `asyncio.gather` por loop sequencial com callback
- engine.py já tem `_set_progress_msg()` que atualiza progress + message
- engine.py precisa passar um callback `progress_callback(scene_index, total)` para images.py e tts.py
- Ranges: IMAGES_RANGE (40, 60), TTS_RANGE (60, 75)
- Fórmula de interpolação: `range_start + (scene_index / total_scenes) * (range_end - range_start)`

---

### P1-B — Landing page: redirect logged-in users

**Priority:** P1 | **Agent:** Codex | **Auditor:** CodeWhale
**Scope:** frontend only
**Files:** `app/page.tsx`

**AC:**
- Usuário logado que acessa `/` é redirecionado para `/dashboard`
- Usuário não logado vê a landing page normal
- Nav bar mostra "Dashboard" em vez de "Sign in" para logged-in
- Sem flicker — verificar auth antes de renderizar

**Contexto técnico:**
- `getUser()` de `@/lib/auth-client` retorna `null` se não logado
- Usar `useEffect` + `useRouter` para redirect
- Adicionar estado de loading enquanto verifica auth
