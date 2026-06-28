# UI/UX — Montage

**Date:** 2026-06-24
**Version:** 1.0
**Status:** Complete

---

## Design System

### Typography
- **Headings:** Space Grotesk (300-700)
- **Body:** Space Grotesk (400)
- **Accent/Serif:** Instrument Serif (italic, for quotes/testimonials)

### Colors (Brutalist Palette)
```
--bg-primary:      #0a0a0a   (near-black)
--bg-secondary:    #141414   (card backgrounds)
--bg-tertiary:     #1a1a1a   (hover states)
--border:          #2a2a2a   (all borders)
--border-active:   #ffffff   (focus/active)
--text-primary:    #f5f5f5   (main text)
--text-secondary:  #888888   (muted/labels)
--text-tertiary:   #555555   (placeholders)
--accent:          #ff4500   (orange-red, CTAs, progress)
--accent-green:    #00ff88   (success states)
--accent-red:      #ff3333   (errors)
--accent-blue:     #3388ff   (links)
```

### Brutalist Rules
- Zero border-radius (`border-radius: 0`)
- Hard 1px borders on all interactive elements
- High density — maximize information per screen
- No shadows, no gradients, no glassmorphism
- Monospace for data/metrics (JetBrains Mono)
- Whitespace as structure, not decoration

---

## Screen Inventory

### 1. Landing Page `/`

**Purpose:** Converter visitantes → signup.

**Sections (single page, scroll):**
1. **Hero:** Título "AI Video Production" + subtítulo "No terminal. No config. Just describe your video." + CTA "Start free" + video demo (autoplay, muted)
2. **How it works:** 3 steps — Describe → Review → Download (icons + 1-liner each)
3. **Example videos:** 3 embedded video players (animated explainer, social clip, product teaser)
4. **Pricing:** 2-column comparison (Free vs Pro)
5. **Footer:** "Built on OpenMontage" + GitHub link + AGPL notice

**States:**
- Default
- After scroll: sticky nav with "Montage" logo + "Sign in" / "Start free"

### 2. Login `/login`

**Purpose:** Auth.

- Email input + Password input + "Sign in" button
- "or continue with Google" button (Google OAuth)
- Link: "Don't have an account? Sign up"
- Error state: inline red border on fields + message below form

### 3. Signup `/signup`

- Email input + Password input + "Create account" button
- "or continue with Google"
- Link: "Already have an account? Sign in"
- Password requirements tooltip (min 8 chars)

### 4. Dashboard `/dashboard`

**Purpose:** Home base pós-login. Galeria + ação primária.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ MON†AGE                          [User avatar] [Logout]  │
├──────────────────────────────────────────────────────────┤
│ [Free tier · 2/3 videos this month]        [UPGRADE→PRO] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────┐                │
│  │  Create New Video                    │                │
│  │  Describe your video...              │  [GENERATE →]  │
│  └─────────────────────────────────────┘                │
│                                                           │
│  Your Videos (3)                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │██████████│ │██████████│ │          │                │
│  │ thumb    │ │ thumb    │ │  empty   │                │
│  │ title    │ │ title    │ │  slot    │                │
│  │ 42s · 2d │ │ 58s · 1w │ │          │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Empty state (first visit):**
- Mensagem: "No videos yet. Create your first one above."
- Exemplo de prompt placeholder: "Try: '60-second explainer about how AI works'"

**Card states:**
- `processing`: Thumbnail com spinner overlay + progress bar + status label
- `done`: Thumbnail + title + duration + "2 days ago" + download icon
- `failed`: Red-tinted thumbnail + error icon + "Failed" label + retry button

### 5. Create Flow `/dashboard?create=true`

**Purpose:** Formulário de criação de vídeo. 2 passos.

**Step 1 — Input:**
```
┌──────────────────────────────────────────────────────────┐
│ New Video                                    [× close]   │
├──────────────────────────────────────────────────────────┤
│ Pipeline: [Animated Explainer ▾] [Social Clip ▾]         │
│                                                           │
│ Title:  [How Neural Networks Learn               ]       │
│ Topic:  [Explain neural networks for beginners   ]       │
│          (optional — we can research for you)             │
│                                                           │
│ Duration: [30s] [60s ▾] [90s]                            │
│ Platform: [TikTok (9:16) ▾]                              │
│ Style:   [Clean Professional ▾] [Flat ▾] [Minimalist ▾]   │
│                                                           │
│                                  [Cancel] [NEXT →]        │
└──────────────────────────────────────────────────────────┘
```

**Step 2 — Review & Confirm:**
```
┌──────────────────────────────────────────────────────────┐
│ Review Script                                  [× close] │
├──────────────────────────────────────────────────────────┤
│ Video: "How Neural Networks Learn"                        │
│ 60s · TikTok (9:16) · Clean Professional                  │
│ Estimated cost: $0.02                                     │
│                                                           │
│ ┌─── Script Preview ──────────────────────────────────┐  │
│ │ Scene 1 (4s): "What if I told you your brain..."     │  │
│ │ Visual: Close-up of glowing neural network          │  │
│ │ Scene 2 (20s): "Neural networks work by..."          │  │
│ │ Visual: Diagram of layers, animated arrows          │  │
│ │ Scene 3 (20s): "Each connection has a weight..."     │  │
│ │ Visual: Zoom into synapse, weight numbers           │  │
│ │ Scene 4 (5s): "Want to learn more? Link in bio"     │  │
│ │ Visual: CTA card with link                          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ [Regenerate script]    [← Back]    [GENERATE VIDEO →]    │
└──────────────────────────────────────────────────────────┘
```

**Loading state (after submit):**
```
┌──────────────────────────────────────────────────────────┐
│ Creating your video...                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   ████████████████░░░░░░░░  65%                           │
│   Rendering compositing...                                │
│                                                           │
│   Your video will be ready in ~2 minutes                  │
│   You can close this — we'll notify you when done.        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Success state:**
```
┌──────────────────────────────────────────────────────────┐
│ ✓ Video ready!                                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   ┌─────────────────────────────────────┐                │
│   │          ▶ Video Player             │                │
│   │          (60s · 12MB MP4)           │                │
│   └─────────────────────────────────────┘                │
│                                                           │
│   [Download MP4]    [Create Another]    [Share →]        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 6. Video Detail `/videos/[id]`

- Video player (full width)
- Metadata: title, duration, created, style, platform, size
- Download button
- Delete button (with confirmation dialog)
- "Create similar" button (pre-fills form with same params)

### 7. Settings `/settings`

- Email (read-only)
- Current tier + usage (2/3 this month)
- Upgrade to Pro button (Stripe checkout)
- Delete account (with confirmation)

### 8. Error States (genéricos, aplicam em toda app)

- **Network error:** Toast "Connection lost. Retrying..." com retry automático
- **Auth expired:** Redirect to /login com toast "Session expired"
- **Rate limited:** Card with "You've used all 3 free videos. Upgrade to Pro for unlimited."
- **Job failed:** Red card in gallery com botão "Retry"

---

## User Journeys

### Primary Flow: First Video
1. Landing page → "Start free" → Signup (email + password)
2. Redirect to Dashboard (empty state)
3. Fill "Create New Video" form inline (title + topic)
4. Click Generate
5. See script preview → Approve
6. Progress bar (2 min render)
7. Video player appears → Watch → Download
8. Gallery updates with first entry

### Edge Cases
- **User closes tab during render:** Job continua no backend. Ao reabrir dashboard, job aparece com status atualizado (polling a cada 5s).
- **Duplicate submit:** Botão "Generate" desabilita após primeiro clique. Backend deduplica por user_id + title hash.
- **Piper TTS unavailable:** Fallback para Google TTS (se configurado) ou erro explícito "TTS service unavailable. Try again later."
- **Pexels API rate limited:** Usar cache de imagens ou fallback para Pixabay/Unsplash.

---

## Permission Model

| Ação | Free | Pro |
|---|---|---|
| Criar vídeo | 3/mês | Ilimitado |
| Download MP4 | Sim (com marca d'água) | Sim (sem marca) |
| 4K export | Não | Sim |
| Prioridade na fila | Normal | Alta |
| Retenção de vídeo | 7 dias | 30 dias |
| Suporte | Email (48h) | Email (24h) |
