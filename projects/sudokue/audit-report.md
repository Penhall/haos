# Audit Report: Sudokue v1.0.0

**Date:** 2026-06-23
**Auditor:** Codex (Hermes Agent)
**Scope:** Full codebase audit against PRD, architecture.md, ui.md, tasks.md
**Repository:** https://github.com/Penhall/Sudokue
**Commit:** 420142b

---

## Executive Summary

| Category | Verdict | Notes |
|----------|---------|-------|
| **1. Spec Compliance (PRD)** | ⚠️ WARN | 8/10 P0 items pass; 2 have material issues |
| **2. Architecture Compliance** | ✅ PASS | All security boundaries and architectural decisions respected |
| **3. Edge Cases** | ⚠️ WARN | Several edge cases lack handling; uniqueness guarantee is probabilistic |
| **4. UI Compliance** | ⚠️ WARN | Core brutalist vision achieved; minor deviations in timer font and CSS conflict |
| **5. Security** | ⚠️ WARN | Good Electron hardening; CSP weakened by `'unsafe-inline'` |
| **6. Code Quality** | ⚠️ WARN | Clean overall; 2 `console.log` left; duplicate `@keyframes`; missing cleanup |

---

## 1. Spec Compliance (vs PRD)

### 1.1 Puzzle Generation 16×16 with Unique Solution
**Files:** `renderer/js/solver.js:319-393`

**Finding: ⚠️ WARN — Uniqueness is probabilistic, not guaranteed.**

`generatePuzzle()` (line 319) calls `hasUniqueSolution()` (line 184) which calls `countSolutions(grid, 2)` (line 130). The `countSolutions` function uses a **dual-solve heuristic** — solving once with normal candidate order and once with reversed — rather than an exhaustive enumeration. The code's own comment admits (line 127-128):
> *"This is NOT an exhaustive counter but is highly reliable for Sudoku uniqueness detection (different traversal orders find different solutions)."*

This means a puzzle could theoretically pass the uniqueness check while having 2+ solutions, if both candidate orderings converge to the same first solution. The PRD (line 69) mandates: *"Sempre gerar puzzle com solução única (NUNCA mais de uma solução)"*. This heuristic violates that absolute guarantee.

**Recommendation:** Replace dual-solve with a true exhaustive counter (branch-and-bound that stops at 2 solutions). Given MRV already prunes aggressively, exhaustive 2-count on a puzzle with ~120-200 holes should complete within the 2-second target for nearly all puzzles.

#### 1.1.1 Difficulty Targets Mismatch
**File:** `renderer/js/solver.js:320-325`

The PRD/tasks specify target cells removed as: Fácil=80, Médio=110, Difícil=140, Expert=160. But the code at line 320-325 sets:
```js
easy: 80, medium: 120, hard: 160, expert: 200
```
- **Médio:** 120 (spec says 110) — 10 more holes than spec
- **Difícil:** 160 (spec says 140) — 20 more holes than spec
- **Expert:** 200 (spec says 160) — **40 more holes than spec**

This means all non-Easy difficulties are hardened beyond spec. Expert at 200 removed cells (56 remaining from 256) may also cause generation to fall back more aggressively (line 365-374 reduces target by 10 repeatedly until hitting minimum 60).

### 1.2 4 Difficulty Levels Calibrated
**Files:** `renderer/js/game.js:24-29`, `renderer/js/solver.js:320-325`

**Finding: ⚠️ WARN — Calibration uses hole-count only, not resolution-step metrics.**

The PRD (lines 70-72) specifies:
- Fácil: ~80% solvable by simple techniques
- Expert: requires advanced techniques (naked pairs, hidden singles, pointing pairs)

The current implementation uses only a fixed target of removed cells per difficulty. There is no `estimateDifficulty(solution, holes)` function that measures resolution-step complexity. The `solve()` function uses MRV heuristic but doesn't export a difficulty estimator.

The `DIFFICULTY_CONFIG` (game.js:24-29) correctly sets mistake limits per PRD: Easy=Infinity, Medium=5, Hard=3, Expert=1. Hints fixed at 3 across all levels.

### 1.3 Brutalist CSS
**Files:** `renderer/css/style.css`, `renderer/css/effects.css`

**Finding: ✅ PASS — Core brutalist vision achieved.**

Verified all checks:
- ✅ Zero `border-radius` on all 15 elements where it's explicitly set (all `border-radius: 0`). No element has a non-zero border-radius.
- ✅ No gradients found (0 matches for `gradient`, `linear-gradient`).
- ✅ No `backdrop-filter` found.
- ✅ No glassmorphism.
- ✅ Hard borders: 1px internal, 2px block separators, 3px grid outer border.
- ✅ Color palette matches ui.md exactly (all 16 CSS variables at style.css:1-19 match).
- ✅ Hover transitions are instant (no `transition` properties on interactive elements).
- ✅ `user-select: none` on grid.

**Minor issues:**
- ⚠️ **Timer font:** CSS uses `'Space Grotesk', sans-serif` (style.css:338). Spec requires `'Space Grotesk Mono'` for timer. Google Fonts import (index.html:10) includes `Space+Mono` but it is never referenced in CSS. The mono font would give tabular-nums better alignment.
- ⚠️ `'Space Grotesk'` used on numpad `.num-btn` (style.css:477) instead of `'Instrument Serif'` for the character/number. However, the inner `.char` span (style.css:484) correctly uses Instrument Serif. The button container font is acceptable.

### 1.4 Electron Packaging
**Files:** `package.json`, `main.js`, `dist/sudokue-portable.zip`

**Finding: ✅ PASS**

- ✅ `package.json` has Electron 33, electron-builder 25.
- ✅ `npm run build:win` target produces portable ZIP (verified: `dist/sudokue-portable.zip` exists at 109.6 MB).
- ✅ ZIP size: 110 MB — well under 200 MB spec limit.
- ✅ Repo exists with 1 commit (`420142b`).
- ✅ `.gitignore` present (confirmed).
- ✅ `README.md` present (confirmed).

### 1.5 LocalStorage Persistence
**Files:** `renderer/js/storage.js`, `renderer/js/game.js:539-677`

**Finding: ✅ PASS**

- ✅ `saveGameState()` serializes and saves to localStorage key `sudokue-save`.
- ✅ `loadGameState()` recovers state; validates required fields; deserializes pencilMarks from arrays back to Sets.
- ✅ `hasSavedGame()` / `clearGameState()` present.
- ✅ Auto-save on `beforeunload` (game.js:670-672).
- ✅ Auto-save every 30 seconds via `setInterval` (game.js:675-677).
- ✅ Saved game modal shown on init if save exists (game.js:660, 612-630).
- ✅ Timer resumes with delta calculation: `secondsElapsed + (now - savedAt)` (game.js:572-575).

### 1.6 Timer + Error Counter
**Files:** `renderer/js/game.js:133-161, 429-437`

**Finding: ✅ PASS**

- ✅ `startTimer()` / `stopTimer()` / `updateTimerDisplay()` all implemented.
- ✅ `formatTime()` supports hours:minutes:seconds format for long games.
- ✅ `updateMistakesUI()` shows errors with limit (or without when Infinity).
- ✅ Game over triggered when `mistakes >= mistakeLimit` (game.js:372-375).

### 1.7 Pencil Marks Mode
**Files:** `renderer/js/game.js:387-397, 336-346, 315-329`

**Finding: ✅ PASS**

- ✅ `togglePencilMode()` toggles `isPencilMode` with UI changes.
- ✅ `handleInput()` branches on `isPencilMode`: adds/removes from `Set` per cell.
- ✅ `removePencilMarkFromRelated()` clears related pencil marks in row/col/block on correct placement.
- ✅ Pencil marks rendered as 4×4 mini-grid inside cells (game.js:291-302) and in preview (game.js:218-230).
- ✅ UI correctly toggles button text between "Rascunho: ON" / "Rascunho: OFF".

### 1.8 3 Hints Per Game
**Files:** `renderer/js/game.js:399-427`

**Finding: ✅ PASS**

- ✅ `useHint()` places correct value, marks cell as fixed, decrements `hintsLeft`.
- ✅ Hint button hidden when `hintsLeft <= 0` (game.js:422-423).
- ✅ Hints reset to 3 on new game (game.js:62) and restart (game.js:109).
- ✅ Hint ignores fixed cells (game.js:402).

### 1.9 Sound Effects (Web Audio API)
**Files:** `renderer/js/effects.js`

**Finding: ✅ PASS**

- ✅ `playVictorySound()` — ascending C-E-G-C melody via oscillators.
- ✅ `playDefeatSound()` — descending sawtooth.
- ✅ `playBlockCompleteSound()` — chord (A4+C#5+E5).
- ✅ `playLineCompleteSound()` — two-tone triangle wave.
- ✅ `playNumberCompleteSound()` — short A5 pop.
- ✅ All use Web Audio API with `AudioContext`, no external audio files.

### 1.10 Visual Effects
**Files:** `renderer/js/effects.js:77-158`, `renderer/css/effects.css`

**Finding: ✅ PASS**

- ✅ `showVictoryAnimation()` — 50 confetti particles + grid pulse animation.
- ✅ `showDefeatAnimation()` — shake + red flash on body.
- ✅ `showBlockCompleteAnimation()` — golden glow on 4×4 block.
- ✅ `showLineCompleteAnimation()` — green glow on row/column.
- ✅ `isBlockComplete()`, `isRowComplete()`, `isColComplete()` detection logic.
- ✅ `triggerEffectsAfterMove()` chains block → line → col checks with staggered timing.

---

## 2. Architecture Compliance

### 2.1 Electron Security Config
**File:** `main.js:14-19`

**Finding: ✅ PASS**

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}
```

All three security flags correctly set per architecture.md:108-109.

### 2.2 preload.js uses contextBridge
**File:** `preload.js`

**Finding: ✅ PASS**

- ✅ Uses `contextBridge.exposeInMainWorld()`.
- ✅ Exposes only 4 APIs: `getAppVersion`, `platform`, `onMenuNewGame`, `onMenuSaveGame`, `onMenuDifficulty`.
- ✅ IPC listener callbacks are whitelisted wrappers.
- ⚠️ `require('electron')` called inside callback functions (lines 8, 12, 17). While this works, it loads the `electron` module multiple times. Minor efficiency concern, not a security issue since this is preload (Trusted).

### 2.3 Vanilla JS Only
**Finding: ✅ PASS**

- ✅ Zero framework imports detected (no React, Vue, Angular, Svelte, jQuery).
- ✅ All DOM manipulation is direct (createElement, appendChild, classList).
- ✅ No bundler, no transpiler, no build step for renderer code.

### 2.4 localStorage Used
**Finding: ✅ PASS**

- ✅ Only `localStorage` API used (confirmed: no IndexedDB, no File API).
- ✅ Key: `'sudokue-save'`.

### 2.5 Solver Algorithm
**File:** `renderer/js/solver.js`

**Finding: ⚠️ WARN — Backtracking with MRV but forward-checking is only candidate filtering, not propagation.**

The architecture (line 53) specifies *"backtracking com forward checking"*.

The solver uses:
- MRV (Minimum Remaining Values) — `findMRVCell()` at line 76.
- Candidate collection — `getCandidates()` at line 37 (filters used values in row/col/block).
- Simple backtracking — `solveHelper()` at line 107.

This is **backtracking with MRV**, but lacks true forward checking (propagating constraints to reduce domains of unassigned variables on each assignment). The `getCandidates()` function only filters based on CURRENT assignments, not future implications. This is still effective for the scale but doesn't match the architectural claim of "forward checking."

**Recommendation:** Either implement constraint propagation (update candidate domains on each assignment) or update architecture.md to say "backtracking with MRV heuristic."

### 2.6 CSP Header
**File:** `renderer/index.html:6`

**Finding: ⚠️ WARN — CSP uses `'unsafe-inline'` for scripts.**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  script-src 'self' 'unsafe-inline'
">
```

The CSP is present but weakened:
- `script-src 'unsafe-inline'` is required because the HTML uses inline event handlers (`onclick="..."`, `onchange="..."`). This undermines XSS protection.
- `style-src 'unsafe-inline'` is needed for inline styles (confetti positioning via `confetti.style.left`).
- Font and default-src are properly restricted.

**Recommendation:** Move all inline event handlers to `addEventListener` calls in JS, then remove `'unsafe-inline'` from `script-src`. Use nonces or hashes if some inline scripts are unavoidable.

---

## 3. Edge Cases

### 3.1 localStorage Full / Quota Exceeded
**Files:** `renderer/js/storage.js:53-73`, `renderer/js/game.js:555-558`

**Finding: ⚠️ WARN — Silent failure.**

`saveGameState()` wraps `localStorage.setItem()` in try/catch and returns `false` on error (line 70-72). However, `autoSave()` at game.js:555-558 **never checks the return value**. If quota is exceeded, the game silently fails to save with no user feedback. The user's progress would be lost on app close without warning.

**Recommendation:** Check `autoSave()` return and show a non-intrusive warning (e.g., "Falha ao salvar — armazenamento cheio"). Also consider catching `QuotaExceededError` specifically.

### 3.2 Corrupted Save Data
**File:** `renderer/js/storage.js:79-113`

**Finding: ✅ PASS — Handled correctly.**

`loadGameState()` validates that `board`, `solution`, and `fixed` exist (line 87). If invalid, it calls `clearGameState()` and returns `null` (lines 88-91). The calling code (`checkForSavedGame()` at game.js:614-615, `continueSavedGame()` at game.js:598-599) falls back to a fresh game on null. All other fields have defaults (lines 99-105).

### 3.3 Puzzle Generation Timeout
**File:** `renderer/js/solver.js:319-393`

**Finding: ❌ FAIL — No timeout mechanism.**

`generatePuzzle()` runs synchronously in the main thread. For Expert difficulty (target: 200 cells removed), it could iterate through all 256 positions, calling `hasUniqueSolution()` on each removal. Each uniqueness check runs two full backtracking solves on a 16×16 grid. With MRV, this is typically fast, but there is **no timeout or Web Worker**. If the solver gets stuck on a pathological puzzle, the UI freezes indefinitely.

The `setTimeout(fn, 50)` wrapper in `newGame()` (game.js:48) is only 50ms — it just lets the modal render before blocking the thread.

**Recommendation:** (a) Add a timeout counter in `hasUniqueSolution()` that throws after 2 seconds, or (b) move puzzle generation to a Web Worker, or (c) add a maximum iteration limit.

### 3.4 Expert Difficulty Generation Failure
**File:** `renderer/js/solver.js:364-374`

**Finding: ⚠️ WARN — Graceful degradation but could produce Easy puzzle labeled Expert.**

When `positions` are exhausted before reaching target:
```js
if (targetRemoved > 60) {
  targetRemoved -= 10;
  break;
}
```
This reduces target by 10 and breaks out of the loop — it does NOT retry with the reduced target. It simply accepts whatever was removed so far. The result is a puzzle with fewer holes than intended, still labeled "expert" in difficulty.

The reduction happens only once (from 200 down to at most 190 in one step), then breaks. If even 190 is too many, the final puzzle might have as few as ~60 cells removed but still be labeled "expert."

**Recommendation:** Loop the reduction: `while (removed < targetRemoved && targetRemoved > 60) { targetRemoved -= 5; /* retry remaining positions */ }`. Or surface the actual difficulty level in the result.

### 3.5 Fixed Cells Immutability
**File:** `renderer/js/game.js:331-385`

**Finding: ✅ PASS — Fixed cells protected.**

`handleInput()` at line 334: `if (fixed[r][c]) return;` — immediately exits.

BUT: `useHint()` at line 405 sets `fixed[r][c] = true` on a hinted cell, making it permanently immutable. This is intentional (hinted cells shouldn't be changed) but worth documenting — the `fixed` array serves dual purpose: original puzzle clues AND hint-revealed cells.

Additionally, `restartGame()` at line 102 only clears cells where `!fixed[r][c]`. Hint-revealed cells (now fixed) are NOT cleared on restart, which is semantically correct: hints are permanent within a puzzle session.

### 3.6 All Hints Used
**File:** `renderer/js/game.js:399-415`

**Finding: ✅ PASS — Properly handled.**

- `useHint()` line 400: `if (!selectedCell || hintsLeft <= 0) return;` — early return.
- `updateHintsUI()` line 422-423: Hint button hidden entirely when `hintsLeft <= 0`.
- Button reappears on new game / restart (hintsLeft reset to 3).

### 3.7 Timer Resume from Saved State
**File:** `renderer/js/game.js:560-575`

**Finding: ✅ PASS — Correctly implemented.**

`loadGameState()` calculates:
```js
const additionalSeconds = Math.floor((now - savedAt) / 1000);
secondsElapsed = state.secondsElapsed + additionalSeconds;
```
This preserves elapsed time from the original session plus wall-clock time since last save. The PRD requirement (line 74) is satisfied.

---

## 4. UI Compliance (vs ui.md)

### 4.1 Fonts
**Finding: ⚠️ WARN — Timer misses mono font.**

| Element | Spec | Actual | Verdict |
|---------|------|--------|---------|
| Title "SUDOKUE" | Space Grotesk 1.2rem 700 | Space Grotesk 1.2rem 700 ✅ | PASS |
| Headers sidebar | Space Grotesk 0.7rem 600 | Space Grotesk 0.7rem 600 ✅ | PASS |
| Grid values | Instrument Serif clamp(16px,2.5vw,40px) 600 | Instrument Serif clamp(16px,2.5vw,40px) 600 ✅ | PASS |
| Preview value | Instrument Serif clamp(60px,8vw,100px) 800 | Instrument Serif clamp(60px,8vw,100px) 800 ✅ | PASS |
| Buttons | Space Grotesk 0.85rem 600 | Space Grotesk 0.85rem 600 ✅ | PASS |
| **Timer** | **Space Grotesk Mono 1.4rem 700** | **Space Grotesk 1.4rem 700 ⚠️** | **WARN** |
| Error counter | Space Grotesk 0.9rem 600 | Space Grotesk 0.9rem 600 ✅ | PASS |
| Pencil marks | Space Grotesk clamp(6px,0.9vw,10px) 700 | Space Grotesk clamp(6px,0.9vw,10px) 700 ✅ | PASS |

Timer discrepancy: CSS uses `'Space Grotesk'` (style.css:338). Spec requires `'Space Grotesk Mono'` for tabular-nums alignment (ui.md:188). The `Space+Mono` font IS loaded (index.html:10) but never referenced.

### 4.2 Colors
**Finding: ✅ PASS — All 16 tokens from ui.md matched.**

All CSS custom properties at style.css:1-19 directly match the palette in ui.md:19-39.

### 4.3 Zero Border-Radius
**Finding: ✅ PASS — 15 explicit `border-radius: 0` declarations, zero non-zero.**

Verified across both CSS files. No element has rounded corners.

### 4.4 Box-Shadow
**Finding: ✅ PASS — Only hard functional shadows.**

- `0 0 0 2px #ffffff` — selection outline (style.css:89, 242).
- `inset 0 0 30px rgba(255,204,0,0.8)` — block-complete glow animation (effects.css:54).
- `inset 0 0 20px rgba(0,255,102,0.6)` — line-complete glow animation (effects.css:66).
- `0 0 20px rgba(0,255,102,0.6)` — number-complete pop animation (effects.css:78, style.css:500).

All are either selection indicators or temporary animation states. No soft decorative shadows. ✅

### 4.5 No Gradients / Backdrop-Filter
**Finding: ✅ PASS — Zero violations.**

Confirmed: 0 matches for `gradient`, `backdrop-filter`, `linear-gradient`.

### 4.6 Responsive Breakpoints
**Finding: ✅ PASS — Two breakpoints correctly implemented.**

- `@media (max-width: 1100px)` — hides preview panel, adjusts grid sizing (style.css:648-656). ✅
- `@media (max-width: 900px)` — vertical layout, grid → sidebar below, board title visible, numpad 8-column (style.css:658-690). ✅

### 4.7 Layout
**Finding: ✅ PASS — Three-panel layout preserved.**

Preview 220px + Grid (flex) + Sidebar 320px. Matches ui.md wireframe.

---

## 5. Security

### 5.1 Content-Security-Policy
**File:** `renderer/index.html:6`

**Finding: ⚠️ WARN — `'unsafe-inline'` weakens script-src.**

Covered in §2.6. The CSP exists but the `'unsafe-inline'` directive for scripts and styles significantly reduces its effectiveness against XSS.

### 5.2 eval() / innerHTML
**Finding: ✅ PASS — No eval(), innerHTML usage is safe.**

- Zero `eval()` calls in renderer (confirmed).
- `innerHTML` used in 6 places (game.js:177,180,232,258,501,507), all with **hardcoded literal strings** or the `CHARS` constant array. No user-controlled input flows into innerHTML.

### 5.3 require() in Renderer Process
**Finding: ✅ PASS — Zero require() calls in renderer.**

Confirmed: 0 matches for `require(` in `/root/Sudokue/renderer/`. The renderer accesses Node APIs only through the contextBridge-exposed `window.electronAPI`.

### 5.4 preload.js API Surface
**File:** `preload.js`

**Finding: ✅ PASS — Minimal and whitelisted.**

Exposes only:
- `getAppVersion()` — returns static string.
- `platform` — static property.
- `onMenuNewGame(callback)` — IPC listener wrapper.
- `onMenuSaveGame(callback)` — IPC listener wrapper.
- `onMenuDifficulty(callback)` — IPC listener wrapper.

No file system access, no shell, no arbitrary IPC channel exposure.

---

## 6. Code Quality

### 6.1 console.log / console.error Left in Production
**Files:** Multiple

**Finding: ⚠️ WARN — 8 console statements present.**

| File | Line | Statement | Severity |
|------|------|-----------|----------|
| solver.js | 368 | `console.log('generatePuzzle: reducing target...')` | Low |
| storage.js | 71 | `console.error('Failed to save...')` | Medium — useful for debugging |
| storage.js | 88 | `console.warn('Invalid save data, clearing')` | Medium — useful for debugging |
| storage.js | 110 | `console.error('Failed to load...')` | Medium — useful for debugging |
| storage.js | 133 | `console.error('Failed to clear...')` | Medium — useful for debugging |
| game.js | 86 | `console.error('Failed to generate puzzle...')` | Medium — useful for debugging |
| game.js | 656 | `console.log('Sudokue: Inicializando...')` | Low — startup noise |
| effects.js | 34 | `console.error('Erro ao reproduzir som...')` | Medium — useful for debugging |

The architecture.md (line 117) says: *"console.log no renderer para debugging durante desenvolvimento"*. This suggests `console.log` for development is acceptable. However, the game.js:656 init log and solver.js:368 difficulty reduction log are development artifacts.

**Recommendation:** Keep the `.error` and `.warn` calls (they help diagnose issues). Remove the two `.log` calls (init message and difficulty reduction) or gate them behind a debug flag.

### 6.2 TODO / FIXME / HACK Comments
**Finding: ✅ PASS — Zero detected.**

No TODO, FIXME, HACK, or XXX tags found in source files.

### 6.3 Error Handling in try/catch
**Files:** `storage.js`, `game.js`, `effects.js`

**Finding: ✅ PASS — Adequate error handling.**

- `storage.js`: All 4 operations wrapped in try/catch with `console.error` logging (lines 54-74, 80-113, 119-124, 130-135).
- `game.js`: `newGame()` wraps generation in try/catch (lines 49, 85-90); shows error in generating modal status.
- `effects.js`: `playTone()` wraps audio in try/catch (lines 17, 33-35). AudioContext creation is NOT wrapped but `new AudioContext()` rarely throws.

### 6.4 Memory Leaks
**Files:** `renderer/js/game.js`, `renderer/js/effects.js`

**Finding: ⚠️ WARN — `autoSaveInterval` not cleared on beforeunload.**

`init()` starts `autoSaveInterval` (line 675-677):
```js
autoSaveInterval = setInterval(() => { autoSave(); }, 30000);
```

While `stopTimer()` clears `timerInterval` (line 152-155), there is **no corresponding cleanup for `autoSaveInterval`**. On page unload, the interval is lost but since the page is destroyed, this is not a practical memory leak. However, if the page were ever dynamically unloaded (e.g., in a multi-page Electron app), it would leak.

Additionally:
- Confetti elements: created in `showVictoryAnimation()` (effects.js:82-88), cleaned up via `setTimeout(() => confetti.remove(), 3500)` (line 90). ✅
- Cell click listeners: created fresh on each `renderGrid()` call (game.js:304-308). This is acceptable since `renderGrid` calls `gridEl.innerHTML = ''` first (line 258), which garbage-collects old listeners. ✅

**Recommendation:** Add `clearInterval(autoSaveInterval)` in a `beforeunload` handler for completeness.

### 6.5 Duplicate CSS @keyframes
**Files:** `renderer/css/style.css:498-502`, `renderer/css/effects.css:76-80`

**Finding: ⚠️ WARN — `@keyframes completePop` defined twice.**

Both files define identical `completePop` keyframes. The last one loaded (effects.css) wins. This is a maintenance hazard — if one is updated and the other isn't, the behavior becomes unpredictable.

**Recommendation:** Delete the duplicate from either style.css or effects.css. Keep it in effects.css (where all other effect keyframes live).

---

## 7. Blocking Issues (Must Fix Before Release)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| **B1** | **Uniqueness check is probabilistic, not guaranteed** | 🔴 CRITICAL | `solver.js:130-161` |
| | `countSolutions()` uses dual-solve heuristic which can miss multiple solutions. Violates PRD requirement of *"NUNCA mais de uma solução"*. Fix: implement true exhaustive 2-count. | | |
| **B2** | **Difficulty target cells deviate from spec** | 🟠 HIGH | `solver.js:320-325` |
| | Medium=120 (spec 110), Hard=160 (spec 140), Expert=200 (spec 160). Expert is 25% harder than specified. | | |
| **B3** | **No puzzle generation timeout** | 🟠 HIGH | `solver.js:319-393`, `game.js:38-97` |
| | Synchronous infinite loop risk — solver can hang UI forever on pathological inputs. | | |

## 8. Non-Blocking Issues (Should Fix, Not Urgent)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| **N1** | Timer uses Space Grotesk instead of Space Grotesk Mono | 🟡 MEDIUM | `style.css:338` |
| **N2** | CSP `'unsafe-inline'` on script-src | 🟡 MEDIUM | `index.html:6` |
| | Inline event handlers (`onclick`, `onchange`) force this. Move to addEventListener. | | |
| **N3** | `autoSave()` ignores save failure | 🟡 MEDIUM | `game.js:555-558` |
| | If localStorage is full, user gets no warning and may lose progress. | | |
| **N4** | Duplicate `@keyframes completePop` | 🟢 LOW | `style.css:498` + `effects.css:76` |
| **N5** | 2 `console.log` left in production | 🟢 LOW | `solver.js:368`, `game.js:656` |
| **N6** | `autoSaveInterval` never explicitly cleared | 🟢 LOW | `game.js:675` |
| **N7** | Expert difficulty fallback doesn't loop-reduce | 🟢 LOW | `solver.js:364-374` |
| | Falls back once (-10) then breaks. Could produce puzzle with far fewer holes than expected. | | |
| **N8** | `countSolutions` clones grid with `cloneGrid(grid)` on solve call, then again on solveHelperReversed — double clone waste | 🟢 LOW | `solver.js:134,151` |
| **N9** | `findMRVCell` early-returns on bestCount===1 but computes candidates a second time in the return object | 🟢 LOW | `solver.js:86,92` |
| **N10** | Architecture claims "forward checking" but implementation uses only MRV + candidate filtering | 🟢 LOW | `architecture.md:53` vs `solver.js:107-120` |

---

## 9. Recommendations

### Immediate (Before Release)
1. **Fix uniqueness guarantee (B1):** Replace `countSolutions` dual-solve with a true branch-and-bound counter that stops at 2. The MRV heuristic already prunes heavily — exhaustive 2-count on a 16×16 puzzle with 56-176 filled cells should complete well under 2 seconds.

2. **Align difficulty targets (B2):** Change solver.js:320-325 to match spec:
   ```
   easy: 80, medium: 110, hard: 140, expert: 160
   ```

3. **Add generation guard (B3):** Wrap `hasUniqueSolution()` calls in `generatePuzzle()` with a timeout counter (e.g., max 2M node visits). If exceeded, restore the cell and continue.

### Short-Term (Next Iteration)
4. **Implement true difficulty calibration:** Add `estimateDifficulty()` that counts resolution steps by technique class (naked singles, hidden singles, pointing pairs, etc.) rather than relying on hole count alone.

5. **Fix timer font:** Change style.css:338 to `font-family: 'Space Mono', monospace`.

6. **Harden CSP:** Move inline event handlers to `addEventListener` in `init()`, remove `'unsafe-inline'` from script-src.

7. **Handle save failures:** Check `autoSave()` return value, surface warning to user.

### Nice-to-Have
8. **Web Worker for puzzle generation** to keep UI responsive during long generations.
9. **Add localStorage quota check** before save attempt.
10. **Bundle fonts locally** (renderer/fonts/) to eliminate Google Fonts dependency (per tasks.md risk mitigation line 154).
11. **Add dark/light mode toggle** (P1 from PRD).

---

## Appendix A: File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `main.js` | 88 | Electron main process |
| `preload.js` | 19 | contextBridge APIs |
| `renderer/index.html` | 114 | Single-page UI shell |
| `renderer/css/style.css` | 690 | Brutalist theme + layout |
| `renderer/css/effects.css` | 82 | Animation keyframes |
| `renderer/js/solver.js` | 404 | Puzzle generation + solving |
| `renderer/js/game.js` | 685 | Game engine (UI + logic) |
| `renderer/js/effects.js` | 227 | Sound + visual effects |
| `renderer/js/storage.js` | 145 | localStorage persistence |
| `package.json` | 34 | Electron + build config |
| **Total source** | **~2,488** | |

## Appendix B: Build Artifact

- **File:** `dist/sudokue-portable.zip`
- **Size:** 109.6 MB (109,599,348 bytes)
- **Status:** Generated. Under 200 MB limit ✅

---

**Audit completed:** 2026-06-23
**Overall assessment:** The Sudokue app delivers on its core promises — brutalist 16×16 Sudoku with Electron packaging, persistence, effects, and 4 difficulty levels. The three blocking issues (probabilistic uniqueness, off-spec difficulty targets, no generation timeout) must be addressed before release. The remaining issues are cosmetic or quality-of-life improvements.
