# UX/UI: Sudokue

**Date:** 2026-06-23
**Status:** draft
**Author:** Hermes (Penhall)
**PRD:** prd.md
**Architecture:** architecture.md

## Design Philosophy

Brutalista / ledger: alta densidade de informação, bordas duras, zero border-radius, sem glassmorphism, sem sombras suaves (apenas shadows duras e funcionais). A interface parece uma ferramenta operacional, não um app mobile genérico. Cada pixel tem função.

**Tipografia:**
- UI elements (botões, labels, headers, sidebar): **Space Grotesk** (sans-serif, geométrica, autoritária)
- Números do grid e preview: **Instrument Serif** (serifada, numérica, contraste alto)
- Fallback: system-ui, monospace para timer/contadores

**Paleta de Cores:**
| Token | Hex | Uso |
|-------|-----|-----|
| bg-primary | #0a0a0a | Fundo principal |
| bg-surface | #141414 | Sidebar, preview panel |
| bg-cell | #1a1a1a | Célula vazia do grid |
| bg-cell-fixed | #0d0d0d | Célula fixa (pista) |
| bg-cell-selected | #ffffff | Célula selecionada |
| bg-cell-highlight | #1f1f1f | Highlight (mesma linha/col/bloco) |
| bg-cell-same-number | #252525 | Células com mesmo número |
| bg-cell-error | #ff0000 | Erro (fundo vermelho) |
| border-primary | #333333 | Bordas internas do grid |
| border-thick | #ffffff | Bordas de bloco 4x4 |
| border-section | #2a2a2a | Bordas de painéis |
| text-primary | #e0e0e0 | Texto principal |
| text-secondary | #888888 | Texto secundário |
| text-inverse | #000000 | Texto em fundo claro (célula selecionada) |
| text-error | #ff3333 | Texto de erro |
| accent-blue | #ffffff | Ações primárias (botão Novo Jogo) |
| accent-green | #00ff66 | Sucesso, número completo |
| accent-yellow | #ffcc00 | Dicas, atenção |
| accent-red | #ff0000 | Erros, game over |

## User Journeys

### Journey 1: Novo Jogo
**User:** Jogador
**Goal:** Iniciar um puzzle fresco

1. Abre o app → tela de jogo com grid gerado automaticamente (dificuldade padrão: Médio)
2. Seleciona dificuldade no dropdown → grid regenera com nova dificuldade
3. Ou clica "Novo Jogo" → grid regenera na dificuldade atual

### Journey 2: Resolver Puzzle
**User:** Jogador
**Goal:** Completar o Sudoku

1. Clica em célula vazia → célula selecionada (branca), preview atualizado
2. Clica no numpad ou pressiona tecla → valor inserido
3. Se correto: célula preenchida, efeito sonoro, rascunhos relacionados removidos
4. Se errado: shake + flash vermelho, contador de erros incrementa
5. Usa setas para navegar entre células
6. Ativa modo rascunho → insere múltiplos candidatos por célula
7. Usa dica → revela valor correto na célula selecionada
8. Erros excedem limite → modal de game over com opção Reiniciar/Novo Jogo
9. Grid completo → confetes + som de vitória + mensagem

### Journey 3: Continuar Jogo Salvo
**User:** Jogador
**Goal:** Retomar partida anterior

1. Abre o app → detecta jogo salvo no localStorage
2. Opção: "Continuar jogo salvo" ou "Novo Jogo"
3. Se continuar: carrega board, timer, erros, dicas do estado salvo

## Screen Inventory

### Screen: Tela de Jogo (única tela)
**Route:** / (index.html)
**Purpose:** Interface principal — grid, controles, preview

**Layout (1280×800+):**
```
┌──────────────┬─────────────────────────┬──────────────┐
│   PREVIEW    │                         │   SIDEBAR    │
│   220px      │       GRID 16×16        │   320px      │
│              │                         │              │
│ ┌──────────┐ │  ┌───────────────────┐  │ Dificuldade  │
│ │ Célula   │ │  │                   │  │ [dropdown]  │
│ │ Ampliada │ │  │   Tabuleiro       │  │              │
│ │          │ │  │   Sudoku 16×16    │  │ [Novo Jogo] │
│ │          │ │  │                   │  │              │
│ └──────────┘ │  │                   │  │ ⏱ 00:00     │
│              │  │                   │  │ Erros: 0/5   │
│ Pos: L1/C1   │  │                   │  │              │
│ Bloco: B1-1  │  │                   │  │ [Rascunho]  │
│ Status: Fixo │  │                   │  │ [Dica (3)]  │
│              │  │                   │  │              │
│              │  │                   │  │ NUMPAD 4×4  │
│              │  │                   │  │ 1 2 3 4     │
│              │  │                   │  │ 5 6 7 8     │
│              │  │                   │  │ 9 A B C     │
│              │  └───────────────────┘  │ D E F G     │
│              │                         │ [Limpar]    │
└──────────────┴─────────────────────────┴──────────────┘
```

**Responsivo (<1100px):** Preview panel oculto, grid expande
**Responsivo (<900px):** Layout vertical: grid → sidebar abaixo

**States:**

- **Loading:** Grid vazio com células em bg-cell (#1a1a1a), sem valores, spinner mínimo no canto
- **Empty:** Não se aplica — sempre há um puzzle gerado ao abrir
- **Error (game over):** Modal overlay com fundo #0a0a0a 90% opacity, texto "LIMITE DE ERROS ATINGIDO", botões Reiniciar / Novo Jogo
- **Victory:** Confetes animados, grid com animação de pulso, mensagem "PARABÉNS" no centro
- **No cell selected:** Preview mostra "CLIQUE EM UMA CÉLULA", sem destaque no grid
- **Cell selected (vazia):** Célula branca (#ffffff), preview ampliado mostra grid vazio ou rascunhos
- **Cell selected (fixa):** Célula fixa destacada com borda branca, preview mostra valor fixo
- **Cell selected (com valor inserido):** Preview mostra valor, indica se correto/errado
- **Modo rascunho ativo:** Botão Rascunho invertido (fundo branco, texto preto)

### Modal: Game Over
**Trigger:** mistakes >= mistakeLimit
**Content:** overlay escuro, caixa central com bordas duras brancas
```
┌──────────────────────────┐
│                          │
│   LIMITE DE ERROS        │
│   ATINGIDO               │
│                          │
│   Você cometeu o número  │
│   máximo de erros.       │
│                          │
│   [REINICIAR] [NOVO JOGO]│
│                          │
└──────────────────────────┘
```

### Modal: Continuar Jogo (se houver save)
**Trigger:** App detecta localStorage com jogo salvo
**Content:** overlay escuro, opção de continuar ou começar novo
```
┌──────────────────────────┐
│   JOGO SALVO ENCONTRADO  │
│                          │
│   Dificuldade: Médio     │
│   Tempo: 12:34           │
│   Erros: 1/5             │
│                          │
│   [CONTINUAR] [NOVO JOGO]│
└──────────────────────────┘
```

## Error Messages & Copy

| Context | Message |
|---------|---------|
| Célula fixa clicada + input | Silenciosamente ignorado (célula fixa) |
| Input inválido (fora 1-9, A-G) | Ignorado |
| Erro ao inserir valor errado | Shake visual + som de erro, sem mensagem de texto |
| Game Over | "LIMITE DE ERROS ATINGIDO" |
| Vitória | "PARABÉNS" |
| Sem dicas restantes | Botão de dica oculto |
| Modo rascunho toggle | Botão mostra "RASCUNHO: ON" ou "RASCUNHO: OFF" |

## Permission Model

Não se aplica — app single-user sem autenticação.

## Interaction Patterns

- **Clique em célula:** Seleciona célula, atualiza preview, destaca linha/coluna/bloco/números iguais
- **Clique no numpad:** Insere valor na célula selecionada
- **Teclado:** 1-9, A-G inserem valor; Backspace/Delete limpam; Setas navegam
- **Dropdown:** Seleciona dificuldade, regenera puzzle imediatamente
- **Botão Novo Jogo:** Regenera puzzle na dificuldade atual
- **Botão Rascunho:** Toggle modo rascunho (ON/OFF)
- **Botão Dica:** Revela valor correto na célula selecionada, decrementa contador
- **Botão Limpar:** Limpa célula selecionada (0)

## Typography Scale

| Element | Font | Size | Weight | Letter-spacing |
|---------|------|------|--------|---------------|
| Título "SUDOKUE" | Space Grotesk | 1.2rem | 700 | 0.1em |
| Headers sidebar | Space Grotesk | 0.7rem | 600 | 0.15em (uppercase) |
| Valores no grid | Instrument Serif | clamp(16px,2.5vw,40px) | 600 | normal |
| Preview valor | Instrument Serif | clamp(60px,8vw,100px) | 800 | normal |
| Botões | Space Grotesk | 0.85rem | 600 | 0.05em (uppercase) |
| Timer | Space Grotesk Mono | 1.4rem | 700 | 0.05em |
| Contador erros | Space Grotesk | 0.9rem | 600 | normal |
| Rascunhos | Space Grotesk | clamp(6px,0.9vw,10px) | 700 | normal |

## Design Constraints

- Zero border-radius em todos os elementos (nem em botões, nem modais, nem inputs)
- Bordas: 1px solid para internas, 2px solid para separação de blocos 4×4, 3px solid para borda externa do grid
- Sem box-shadow em estado normal. Somente sombras duras em estados de erro/seleção (ex: 0 0 0 2px #ffffff na seleção)
- Sem gradientes, sem blur, sem backdrop-filter
- Dropdown e botões sem hover-transition de cor (troca instantânea)
- Scrollbar estilizada mínima (fina, escura) na sidebar
- Cursor: default na maioria, pointer em células e botões
- Seleção de texto desabilitada no grid (user-select: none)
