# PRD — OpenMontage SaaS

**Date:** 2026-06-24
**Version:** 1.0
**Status:** Complete

---

## Product Objective (One Sentence)

Permitir que qualquer pessoa crie vídeos profissionais para redes sociais descrevendo o que quer em linguagem natural, sem instalar nada, sem saber editar, e sem pagar por GPU.

## Product Name

**Montage** — _"AI video production. No terminal. No config. Just describe your video."_

## Target Audience

| Persona | Descritivo | Job-to-be-done |
|---|---|---|
| **Criador solo** | YouTuber/TikToker iniciante, 18-35 anos | "Quero 1 vídeo por dia sem passar 3h editando" |
| **Small business** | Dono de loja, restaurante, consultório | "Preciso de conteúdo pro Instagram mas não tenho orçamento pra agência" |
| **Marketer júnior** | Profissional de marketing em empresa pequena | "Meu chefe pede 5 vídeos por semana, não 5 dias de edição" |
| **Developer-criador** | Dev que também faz conteúdo | "Sei programar, não quero abrir Premiere. Me dá API." |

## Value Proposition

| Alternativa atual | Montage |
|---|---|
| CapCut / Premiere: 2-3h por vídeo | 5 minutos prompt → download |
| HeyGen / Synthesia: $22-24/mês, só avatar | $19/mês, qualquer estilo de vídeo |
| OpenMontage open-source: requer terminal, config, AI assistant | Zero setup, navegador apenas |
| Contratar freela: $50-200/vídeo | $0.63/vídeo no plano Pro |

## Monetização

| Tier | Preço | Vídeos/mês | Features |
|---|---|---|---|
| **Free** | $0 | 3 vídeos | Animated explainer, social clip, Piper TTS, 3 playbooks, marca d'água |
| **Pro** | $19/mês | Ilimitado | Sem marca d'água, prioridade na fila, export 4K, templates premium, Google TTS |

*Futuro:* Enterprise ($99/mês) — multi-usuário, API, white-label, GPU video gen

## Core Features (MVP)

### Must-Have (P0)
- [ ] **Input de vídeo:** Formulário web — título, tópico, duração, plataforma alvo (9:16/16:9/1:1)
- [ ] **Pipeline Animated Explainer:** Pesquisa web → script → imagens (Pexels/Pixabay/Unsplash) → narração Piper TTS → Remotion → MP4
- [ ] **Pipeline Social Clip:** Prompt curto → imagens → narração → legenda karaokê → vertical 9:16
- [ ] **Auth:** Email/senha + Google OAuth
- [ ] **Job queue:** Submissão assíncrona, polling de status, notificação de conclusão
- [ ] **Galeria:** Lista de vídeos gerados com thumbnail, status, download
- [ ] **Download:** MP4 com ou sem marca d'água (por tier)
- [ ] **Landing page:** Explicação do produto, exemplos, pricing, CTA

### Should-Have (P1)
- [ ] **Templates de estilo:** 3 playbooks visuais (Clean Professional, Flat Motion, Minimalist)
- [ ] **Histórico de scripts:** Reutilizar script anterior como base
- [ ] **Preview frame:** Thumbnail + informações antes de iniciar render

### Nice-to-Have (P2)
- [ ] **Persona mode:** Salvar persona, programar posts (ideia do InfluencerAI)
- [ ] **Multi-platform export:** Gerar 3 versões (9:16 TikTok, 16:9 YouTube, 1:1 Feed) de uma vez
- [ ] **Audio upload:** Usar áudio próprio em vez de TTS

## Explicit Non-Scope (MVP)

- Geração de vídeo com IA (Kling, Runway, WAN, Hunyuan)
- Avatar digital / lip-sync / talking head
- Edição de vídeo existente (upload → editar)
- API pública
- Multi-tenant / times
- Música Suno AI (usar Pixabay Music gratuito)
- Pipeline documentary montage
- Clip factory (extrair shorts de vídeo longo)

## Success Metrics

| Métrica | Alvo M1 (30 dias) |
|---|---|
| Usuários cadastrados | 100 |
| Vídeos gerados | 300 |
| Conversão free → Pro | > 5% |
| Tempo médio prompt → vídeo | < 5 min |
| Custo médio por vídeo | < $0.05 |
| NPS | > 30 |

## Business Rules

- **Free tier:** 3 vídeos/mês, marca d'água "Made with Montage" (canto inferior, 10% opacidade, últimos 5s)
- **Pro tier:** Ilimitado, sem marca d'água, 4K, Google TTS
- **Rate limit:** 1 job simultâneo por usuário (free), 3 simultâneos (Pro)
- **Retenção:** Vídeos expiram após 7 dias (free) / 30 dias (Pro)
- **Compliance:** OpenMontage é AGPL-3.0; modificações no pipeline core publicadas em fork público
