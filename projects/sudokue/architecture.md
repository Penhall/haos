# Architecture: Sudokue

**Date:** 2026-06-23
**Status:** draft
**Author:** Hermes (Penhall)
**PRD:** prd.md

## System Overview

Sudokue é um app Electron single-window. O processo main gerencia a janela e fornece APIs mínimas via preload. Toda a lógica do jogo roda no renderer em vanilla JS. O empacotamento usa electron-builder com target portable (ZIP).

```
┌─────────────────────────────────────────────┐
│              Electron Main Process           │
│  main.js: cria BrowserWindow, menu mínimo    │
├─────────────────────────────────────────────┤
│  preload.js: contextBridge (save/load file)  │
├─────────────────────────────────────────────┤
│              Renderer Process                │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ game.js │ │ solver.js│ │  effects.js  │  │
│  │ (UI+    │ │ (back-   │ │  (sound+     │  │
│  │  logic) │ │ tracking)│ │   visual)    │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌────────────────────────┐    │
│  │storage.js│ │  index.html + CSS      │    │
│  │(localSt) │ │  (brutalist theme)     │    │
│  └──────────┘ └────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Components

### Component: Electron Main (main.js)
- **Responsibility:** Criar BrowserWindow 1280×800, definir menu application (Novo Jogo, Salvar, Carregar, Sair), carregar index.html
- **Technology:** Electron 33, Node.js
- **Interfaces:** IPC via preload.js para operações de arquivo
- **Dependencies:** Nenhuma além do Electron

### Component: Preload (preload.js)
- **Responsibility:** Expor APIs seguras ao renderer via contextBridge (saveGame, loadGame, getAppVersion)
- **Technology:** Electron contextBridge
- **Interfaces:** window.electronAPI.saveGame(data), window.electronAPI.loadGame()

### Component: Game Engine (game.js)
- **Responsibility:** Geração de grid, gestão de estado (board[][], solution[][], fixed[][]), input handling, renderização do grid, timer, dicas, modo rascunho, verificação de vitória/derrota
- **Technology:** Vanilla JS, DOM API
- **Interfaces:** Funções exportadas globalmente para acesso pelo HTML e teclado
- **Dependencies:** solver.js, effects.js, storage.js

### Component: Solver (solver.js)
- **Responsibility:** Resolver grid 16×16 via backtracking otimizado, verificar unicidade de solução, contar passos de resolução para calibrar dificuldade
- **Technology:** Vanilla JS, algoritmo backtracking com forward checking
- **Interfaces:** solve(grid) → solution | null, countSolutions(grid, limit=2) → count, hasUniqueSolution(grid) → boolean, estimateDifficulty(solution, holes) → 'easy'|'medium'|'hard'|'expert'

### Component: Effects (effects.js)
- **Responsibility:** Efeitos sonoros (Web Audio API) e visuais (animações CSS, confetes, shake)
- **Technology:** Web Audio API, CSS animations
- **Interfaces:** playVictorySound(), playDefeatSound(), showVictoryAnimation(), showDefeatAnimation(), etc.
- **Dependencies:** effects.css

### Component: Storage (storage.js)
- **Responsibility:** Salvar/carregar estado do jogo em localStorage, gerenciar high scores
- **Technology:** localStorage API
- **Interfaces:** saveGameState(state), loadGameState() → state | null, clearGameState()

## Data Model

### Entity: GameState
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| board | number[][] | 16×16, 0-16 | Estado atual do tabuleiro |
| solution | number[][] | 16×16, 1-16 | Solução completa |
| fixed | boolean[][] | 16×16 | Células fixas (pista inicial) |
| pencilMarks | Set<number>[][] | 16×16 | Marcas de rascunho |
| mistakes | number | ≥0 | Contagem de erros |
| mistakeLimit | number | 1-∞ | Limite por dificuldade |
| hintsLeft | number | 0-3 | Dicas restantes |
| secondsElapsed | number | ≥0 | Tempo em segundos |
| difficulty | string | easy\|medium\|hard\|expert | Nível atual |
| startedAt | ISO timestamp | | Quando o jogo começou |
| savedAt | ISO timestamp | | Último save |

### Entity: HighScore
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| difficulty | string | easy\|medium\|hard\|expert | |
| time | number | >0 | Segundos para completar |
| mistakes | number | ≥0 | Erros cometidos |
| date | ISO timestamp | | Quando completou |

## API Surface

O app é offline e self-contained. Não há API REST. A comunicação é:

1. **Renderer → Main (IPC):** via contextBridge para salvar/carregar arquivos (se implementado futuramente)
2. **localStorage:** API síncrona do navegador para persistência de estado

## Authentication / Authorization

Não se aplica — app single-user offline.

## External Integrations

Nenhuma. Zero dependências de servidor.

## Security Considerations

- Electron: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
- preload.js expõe apenas APIs whitelistadas via contextBridge
- Content-Security-Policy no HTML para prevenir XSS
- Nenhum dado de usuário sai do app

## Observability

- console.log no renderer para debugging durante desenvolvimento
- Log de erros no main process para crashes do Electron
- Sem telemetria ou analytics (offline-first)

## Deployment Architecture

```
Desenvolvimento:  npm start (electron .)
Build Windows:    npm run build:win → electron-builder --win portable
Distribuição:     sudokue-portable.zip (extrair e executar sudokue.exe)
```

## Key Architectural Decisions

- **Decision:** Electron (e não Tauri) → **Rationale:** Toolchain mais madura, build Windows sem toolchain Rust, JS nativo sem ponte Rust↔JS → **Alternatives considered:** Tauri (mais leve mas requer Rust), NW.js (menos popular que Electron), PWA (usuário quer app desktop nativo)

- **Decision:** Vanilla JS (e não React/Vue) → **Rationale:** App de tela única com estado simples, ~600 linhas de lógica, React seria overkill. Manter o código existente com refatoração mínima → **Alternatives considered:** React (complexidade desnecessária), Svelte (curva de aprendizado)

- **Decision:** localStorage (e não IndexedDB ou arquivos) → **Rationale:** Estado de jogo é pequeno (<5KB), localStorage é síncrono e simples, sem necessidade de queries complexas → **Alternatives considered:** IndexedDB (complexo demais para um save), arquivos em disco (requer IPC, mais código)

- **Decision:** Solver backtracking com forward checking → **Rationale:** Grid 16×16 vazio é computacionalmente pesado, mas com ~130-150 células preenchidas (puzzle inicial) o espaço de busca é drasticamente reduzido. Forward checking (eliminar candidatos inválidos ao preencher) reduz branching factor → **Alternatives considered:** Dancing Links / Algorithm X (mais eficiente para grids vazios, mas complexidade de implementação não justifica para grids quase completos)
