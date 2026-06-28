# Product Requirements: Sudokue

**Date:** 2026-06-23
**Status:** draft
**Author:** Hermes (Penhall)
**Discovery:** discovery.md

## Product Objective

Sudokue é um jogo de Sudoku 16×16 para Windows desktop — instalável via ZIP, offline, com design brutalista e 4 níveis de dificuldade calibrada.

## Target Audience

- **Primário:** Jogadores de puzzle que querem algo além do Sudoku 9×9 tradicional
- **Secundário:** Usuários que preferem apps nativos a web apps, especialmente offline

## Value Proposition

O único Sudoku 16×16 desktop com design brutalista (não parece um app mobile genérico), dificuldade real (não só contagem de buracos), e zero dependência de internet.

## Core Features

### Must-Have (P0)

- **Puzzle generation 16×16** com solução única garantida (solver backtracking + verificação de unicidade)
- **4 níveis de dificuldade calibrada:** Fácil, Médio, Difícil, Expert — baseados em passos de resolução, não contagem de buracos
- **Interface brutalista completa:** Space Grotesk (UI) + Instrument Serif (números), hard borders, zero border-radius, alta densidade, sem glassmorphism
- **Empacotamento Electron:** executável Windows portátil dentro de ZIP
- **Persistência local:** salvar/carregar jogo atual (localStorage)
- **Timer + contador de erros** com limite configurável por dificuldade
- **Modo rascunho** (pencil marks) com grid 4×4 por célula
- **Sistema de dicas** (3 por jogo, revela célula selecionada)
- **Efeitos sonoros:** Web Audio API para acerto, erro, bloco completo, vitória, derrota
- **Efeitos visuais:** confetes na vitória, shake na derrota, glow em linhas/blocos completos

### Nice-to-Have (P1)

- **Teclado virtual** (numpad 4×4 com contagem de números restantes)
- **Painel de preview** da célula selecionada (já existe no código original)
- **Navegação por teclado** (setas + teclas para input)
- **Dark mode** (toggle ou automático)

### Future (P2)

- Estatísticas (jogos completados, tempo médio, taxa de erros)
- Histórico de jogos
- Exportação/importação de puzzles
- Modo 9×9 alternativo

## Explicit Non-Scope

- Leaderboards online ou qualquer funcionalidade com servidor
- Versão mobile, web ou macOS (somente Windows)
- Instalador MSI (distribuição ZIP apenas)
- Múltiplos temas visuais (apenas o tema brutalista padrão)
- Tutorial interativo
- Modo multiplayer

## Success Metrics

- App abre em <2 segundos em Windows 10/11
- Geração de puzzle com verificação de unicidade em <2 segundos
- ZIP final <200MB (Electron + assets)
- Layout funcional em resoluções 1366×768 até 1920×1080
- Zero crashes em 30 minutos de jogo contínuo

## Business Rules

- Sempre gerar puzzle com solução única (NUNCA mais de uma solução)
- Dificuldade "Fácil": ~80% das células resolvíveis por técnicas simples (single candidate, single position)
- Dificuldade "Expert": requer técnicas avançadas (naked pairs, hidden singles, pointing pairs)
- Erros: Fácil=ilimitado, Médio=5, Difícil=3, Expert=1
- Dicas: 3 por jogo em qualquer dificuldade
- Timer não pausa ao fechar o app (se salvo, timestamp é preservado)

## Dependencies

- Electron 33+ (Chromium 130+)
- electron-builder para empacotamento Windows
- Nenhuma dependência de servidor ou API externa
