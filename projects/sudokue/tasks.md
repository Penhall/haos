# Tasks: Sudokue

**Date:** 2026-06-23
**Status:** active
**Architecture:** architecture.md
**UI:** ui.md

## Epic 1: Scaffold Electron
**Goal:** Projeto Electron funcional com build Windows

### Task: T1 — Inicializar projeto Electron
- **Priority:** P0
- **Agent:** Claude Code
- **Depends on:** none
- **Files affected:** package.json, main.js, preload.js, .gitignore
- **Acceptance criteria:**
  - [ ] `package.json` com Electron 33, electron-builder, scripts start/build
  - [ ] `main.js` cria BrowserWindow 1280×800, carrega renderer/index.html
  - [ ] `preload.js` com contextBridge (stubs para save/load futuros)
  - [ ] `npm start` abre janela Electron com página em branco
  - [ ] `npm run build:win` gera ZIP portátil funcional (mesmo com app vazio)

## Epic 2: Portar Jogo Existente
**Goal:** Código original funcionando dentro do Electron

### Task: T2 — Estruturar renderer com código original
- **Priority:** P0
- **Agent:** Claude Code
- **Depends on:** T1
- **Files affected:** renderer/index.html, renderer/css/style.css, renderer/css/effects.css, renderer/js/game.js, renderer/js/effects.js
- **Acceptance criteria:**
  - [ ] HTML original adaptado para estrutura renderer/
  - [ ] CSS e JS originais copiados e funcionais
  - [ ] Jogo jogável dentro do Electron (grid, clique, input, timer, dicas)
  - [ ] Referências de caminho (css/, js/) ajustadas para nova estrutura

## Epic 3: Tema Brutalista
**Goal:** Identidade visual completa conforme ui.md

### Task: T3 — Reescrever CSS com tema brutalista
- **Priority:** P0
- **Agent:** CodeWhale
- **Depends on:** T2
- **Files affected:** renderer/css/style.css, renderer/css/effects.css
- **Acceptance criteria:**
  - [ ] Paleta de cores aplicada (bg-primary #0a0a0a, células, bordas)
  - [ ] Tipografia: Space Grotesk (UI) + Instrument Serif (números)
  - [ ] Zero border-radius em todos os elementos
  - [ ] Bordas duras: 1px/2px/3px conforme spec
  - [ ] Sem box-shadow (exceto seleção: 0 0 0 2px white)
  - [ ] Sem gradientes, sem backdrop-filter, sem glassmorphism
  - [ ] Layout preservado: preview (220px) + grid (flex) + sidebar (320px)
  - [ ] Responsivo nos 3 breakpoints especificados
  - [ ] Hover sem transição (troca instantânea)
  - [ ] Google Fonts carregados (Space Grotesk + Instrument Serif)

## Epic 4: Solver + Dificuldade
**Goal:** Geração de puzzle com solução única e dificuldade real

### Task: T4 — Implementar solver com verificação de unicidade
- **Priority:** P0
- **Agent:** Claude Code
- **Depends on:** T2
- **Files affected:** renderer/js/solver.js, renderer/js/game.js
- **Acceptance criteria:**
  - [ ] `solve(grid)` resolve grid 16×16 via backtracking em <500ms
  - [ ] `hasUniqueSolution(grid)` verifica unicidade (resolve duas vezes, segunda com ordem reversa)
  - [ ] `generatePuzzle(difficulty)` gera grid completo → remove células → verifica unicidade após cada remoção → para quando atinge densidade alvo
  - [ ] Substituir `shuffleDigits`/aleatório do código original por solver deterministico
  - [ ] Puzzle gerado sempre tem solução única
  - [ ] game.js atualizado para usar solver.js (remover getBaseGrid/shuffle*)

### Task: T5 — Implementar níveis de dificuldade calibrada
- **Priority:** P0
- **Agent:** CodeWhale
- **Depends on:** T4
- **Files affected:** renderer/js/solver.js, renderer/js/game.js
- **Acceptance criteria:**
  - [ ] 4 níveis: Fácil (~80 células vazias), Médio (~110), Difícil (~140), Expert (~160)
  - [ ] Geração iterativa: tenta gerar no nível alvo, se falhar unicidade, reduz 5 buracos e tenta de novo
  - [ ] Dropdown de dificuldade atualizado: Fácil, Médio, Difícil, Expert
  - [ ] Limites de erro por nível: Fácil=ilimitado, Médio=5, Difícil=3, Expert=1
  - [ ] Dicas fixas: 3 por jogo em todos os níveis
  - [ ] Mudar dificuldade regenera puzzle imediatamente

## Epic 5: Persistência
**Goal:** Salvar e carregar estado do jogo

### Task: T6 — Implementar save/load com localStorage
- **Priority:** P0
- **Agent:** Claude Code
- **Depends on:** T2
- **Files affected:** renderer/js/storage.js, renderer/js/game.js
- **Acceptance criteria:**
  - [ ] `saveGameState(state)` serializa GameState → JSON → localStorage
  - [ ] `loadGameState()` recupera e desserializa GameState
  - [ ] `hasSavedGame()` verifica existência de save
  - [ ] `clearGameState()` remove save
  - [ ] Auto-save ao fechar app (window beforeunload)
  - [ ] Auto-save a cada 30 segundos durante o jogo
  - [ ] Modal "Continuar jogo salvo?" ao abrir app se houver save
  - [ ] Timer preserva timestamp original (calcula elapsed = saved.elapsed + (now - saved.savedAt))

## Epic 6: Build + GitHub
**Goal:** App distribuível e versionado

### Task: T7 — Build Windows portátil + criar repo GitHub
- **Priority:** P0
- **Agent:** Claude Code
- **Depends on:** T3, T5, T6
- **Files affected:** package.json, .gitignore, README.md
- **Acceptance criteria:**
  - [ ] `npm run build:win` gera `dist/sudokue-portable.zip`
  - [ ] ZIP contém sudokue.exe + assets, funcional ao extrair
  - [ ] README.md com instruções de instalação e uso
  - [ ] .gitignore configurado (node_modules, dist, .env)
  - [ ] Repo GitHub criado (Penhall/Sudokue)
  - [ ] Commit inicial com todos os arquivos
  - [ ] Push para main

### Task: T8 — Ajustes finais e auditoria
- **Priority:** P1
- **Agent:** Codex (auditor)
- **Depends on:** T7
- **Files affected:** todos
- **Acceptance criteria:**
  - [ ] Verificar se efeitos sonoros funcionam (Web Audio API)
  - [ ] Verificar efeitos visuais (confetes, shake, glow) com novo tema
  - [ ] Verificar navegação por teclado (setas, input, backspace)
  - [ ] Verificar responsividade nos 3 breakpoints
  - [ ] Verificar se não há regressões do código original
  - [ ] Verificar tamanho do ZIP final (<200MB)

## Dependency Graph

```
T1 (scaffold Electron) ──┬── T2 (portar jogo) ──┬── T3 (tema CSS)
                         │                      │
                         │                      ├── T4 (solver) ── T5 (dificuldade)
                         │                      │
                         │                      └── T6 (persistência)
                         │
                         └── T7 (build + GitHub) ←── T3, T5, T6
                              │
                              └── T8 (auditoria)
```

## Risk Assessment

| Task | Risk | Mitigation |
|------|------|------------|
| T4 (solver) | Backtracking 16×16 pode ser lento | Forward checking + MRV heurística. Se >2s, usar Web Worker |
| T4 (unicidade) | Verificar unicidade em puzzle quase vazio é caro | Gerar com grid completo, remover 1 por 1, verificar a cada remoção |
| T7 (build) | electron-builder pode falhar no Linux cross-compilando pra Windows | Usar wine ou GitHub Actions com Windows runner |
| T3 (tema) | Google Fonts pode não carregar offline | Bundlar fontes no app (copiar para renderer/fonts/) |
| T7 (GitHub) | Token/two-factor pode bloquear push | Usar gh CLI já autenticado (verificar github-auth skill) |
