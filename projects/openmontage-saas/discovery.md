# Discovery — OpenMontage SaaS

**Date:** 2026-06-24
**Status:** Complete
**Author:** Penhall

---

## Problem Statement

Criar vídeos profissionais para redes sociais exige ou (a) habilidades técnicas de edição + equipamento, ou (b) pagar caro por ferramentas/agências. OpenMontage resolve a parte técnica como sistema open-source, mas **requer um AI coding assistant e conhecimento de linha de comando para operar** — barreira intransponível para 99% dos criadores de conteúdo.

**O problema real:** Existe um sistema de produção de vídeo de classe mundial (OpenMontage, 17.5k ⭐), mas ele é inacessível para não-devs. Transformá-lo em SaaS resolve a última milha: qualquer pessoa com um navegador pode criar vídeos profissionais.

## Context & Background

- **OpenMontage:** 12 pipelines, 52 ferramentas, 546 skills, arquitetura agent-first, AGPL-3.0
- **InfluencerAI (projeto próprio):** Pipeline de avatar digital (TTS → Wan2.2 → face verify → publish), focado em persona-driven content
- **Mercado:** Criadores de conteúdo, pequenas empresas, agências de marketing — todos precisam de vídeos para TikTok, Instagram, YouTube
- **Concorrência:** Synthesia ($22/mês), HeyGen ($24/mês), Runway ($12/mês) — todos caros e com limitações
- **Diferencial:** OpenMontage é gratuito e completo; o SaaS cobra pela conveniência (sem terminal, sem config, sem GPUs próprias)

## Affected Users

| Persona | Problema atual |
|---|---|
| Criador de conteúdo solo | Passa 3h editando 1 short no CapCut |
| Small business owner | Não tem orçamento para agência, não sabe editar |
| Agência de marketing júnior | Gasta $200+/mês em ferramentas de vídeo separadas |
| Developer criando conteúdo | Quer automatizar, não quer abrir Premiere |

## Core Pain Point

**Fricção.** Entre "ter uma ideia de vídeo" e "postar o vídeo pronto" existem 15+ passos manuais envolvendo 5+ ferramentas diferentes. O OpenMontage elimina isso para devs. O SaaS elimina para todos.

## Constraints

| Tipo | Constraint |
|---|---|
| Técnica | OpenMontage depende de subprocessos (FFmpeg, Node.js, Python tools) — não roda nativamente em serverless |
| Técnica | Geração de vídeo (WAN, Hunyuan, LTX) requer GPU — custo significativo em cloud |
| Técnica | AGPL-3.0: código aberto, SaaS permitido, mas modificações devem ser públicas |
| Negócio | MVP deve rodar com zero API keys pagas (Piper TTS + Remotion + stock gratuito) |
| Tempo | Entrega contínua, primeira versão funcional ASAP |
| UX | Usuário NUNCA vê terminal, YAML, JSON, ou pipeline manifests |

## Risks & Unknowns

| Risco | Severidade | Mitigação |
|---|---|---|
| Custo GPU (video gen) | Alta | MVP sem GPU — usar Remotion (imagens → vídeo) + stock footage gratuito |
| Latência de renderização | Média | Jobs assíncronos + fila (BullMQ/Redis) + polling UI |
| Complexidade do OpenMontage | Alta | Não replicar tudo. Selecionar 2-3 pipelines core pro MVP |
| AGPL compliance | Baixa | SaaS não distribui binário; alterações publicadas no GitHub fork |
| Rate limiting de APIs gratuitas | Média | Cache agressivo de stock footage, fallback para Piper TTS local |
| Timeouts em renders longos | Média | Background jobs com heartbeat, timeout generoso (10 min) |

## Hypotheses to Validate

1. **H1:** Usuários pagam $9-19/mês pela conveniência de não precisar configurar OpenMontage localmente
2. **H2:** O pipeline "animated explainer" (imagens + narração + Remotion) cobre 80% dos casos de uso iniciais
3. **H3:** Piper TTS + Remotion + Pexels/Pixabay = qualidade "boa o suficiente" para social media sem custo de GPU
4. **H4:** Interface de 3 passos (tema → revisar script → assistir vídeo) gera conversão melhor que prompt livre

## Success Criteria

| Critério | Target | Medição |
|---|---|---|
| Tempo prompt → vídeo | < 5 min | Métrica interna |
| Custo por vídeo | < $0.05 (MVP sem GPU) | Cost tracker |
| Qualidade percebida | NPS > 30 | Survey pós-primeiro vídeo |
| Retenção D7 | > 40% | Analytics |
| Conversão free → paid | > 5% | Stripe |
| Usuários ativos W1 | 50 | Analytics |

## What We're NOT Building (MVP)

- ❌ Geração de vídeo com GPU (WAN, Hunyuan, Kling, Runway)
- ❌ Múltiplos provedores de TTS premium (ElevenLabs, Google, OpenAI)
- ❌ Avatar/lip-sync
- ❌ Documentary montage com footage real
- ❌ Clip factory (extração batch)
- ❌ Localization/dub
- ❌ Character animation
- ❌ Suno AI music generation
- ❌ Multi-tenant B2B (vai ser single-tenant inicialmente)
- ❌ White-label
- ❌ API pública

## What We ARE Building (MVP)

- ✅ Pipeline "animated explainer": tema → pesquisa web → script → imagens → narração Piper → Remotion → MP4
- ✅ Pipeline "social clip": prompt curto → imagens → narração → legenda karaokê → vertical 9:16
- ✅ Interface web simples: formulário de input → preview → download
- ✅ Auth (email/senha + Google OAuth)
- ✅ Jobs assíncronos com fila
- ✅ Galeria de vídeos gerados
- ✅ Templates de estilo (3 playbooks)
- ✅ Free tier (3 vídeos/mês) + Pro ($19/mês ilimitado)
