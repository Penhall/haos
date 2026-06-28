# Discovery: Sudokue

**Date:** 2026-06-23
**Status:** draft
**Author:** Hermes (Penhall)

## Problem Statement

O projeto atual (Sudoku16-v2) é um Sudoku 16×16 funcional mas com limitações estruturais que impedem seu uso como produto final: não tem instalação nativa Windows, não persiste estado entre sessões, e o gerador de puzzles é simplista (remoção aleatória de células sem validação de solução única ou gradiente de dificuldade real). O objetivo é transformá-lo em um produto desktop polido, instalável, com progressão de dificuldade real e experiência de usuário completa.

## Context & Background

O código atual é vanilla JS/CSS/HTML (~600 linhas de game.js, ~400 de style.css, ~220 de effects.js, ~100 de effects.css). A geração de puzzle usa um grid base determinístico + 6 operações de embaralhamento (linhas, colunas, bandas, stacks, dígitos, transposição) que garantem validade do grid completo. Os buracos são abertos removendo N células aleatórias — sem backtracking para garantir solução única ou controlar dificuldade real.

O mercado de Sudoku desktop é dominado por apps mobile (Sudoku.com com 100M+ downloads) e alguns apps Electron/Windows Store. O diferencial do Sudokue seria: 16×16 (a maioria é 9×9), interface limpa estilo brutalista (alinhada ao gosto do usuário), e empacotamento nativo Windows.

## Affected Users / Systems

- **Usuário primário:** Penhall — apreciador de puzzles lógicos, prefere interfaces densas e funcionais sem "soft SaaS defaults"
- **Usuário secundário:** Qualquer pessoa que queira Sudoku 16×16 desktop offline
- **Sistemas afetados:** Nenhum legado — é greenfield em termos de produto final

## Core Pain Point

O Sudoku 16×16 atual é um protótipo web. Para jogar, precisa abrir HTML no navegador. Não salva progresso. A dificuldade é artificial (número de buracos não reflete dificuldade real de resolução). Para ser um produto de verdade, precisa de: instalação nativa, persistência, e dificuldade calibrada.

## Constraints

| Tipo | Constraint |
|------|-----------|
| Técnica | Deve rodar em Windows 10/11 como app desktop |
| Técnica | Deve ser offline-first (sem dependência de servidor) |
| Técnica | Manter a essência vanilla JS ou migrar para stack que não introduza complexidade desnecessária |
| Design | Estilo brutalista/ledger: high density, hard borders, zero border-radius, tipografia Space Grotesk + Instrument Serif |
| Prazo | Entrega em uma sessão (horas, não dias) |
| Distribuição | Arquivo zipado, sem instalador MSI (para evitar problemas de download) |

## Risks & Unknowns

- **Risco:** Electron empacota um Chromium inteiro (~150MB) — pode ser overkill para um app de Sudoku
- **Risco:** Gerar puzzles 16×16 com solução única e dificuldade calibrada é computacionalmente não-trivial
- **Desconhecido:** Quão rápido um solver 16×16 roda em JS puro para validação de unicidade?
- **Desconhecido:** O usuário prefere Electron ou Tauri (mais leve, mas requer Rust toolchain)?

## Hypotheses

1. **H1:** Um solver backtracking em JS puro resolve grid 16×16 em <500ms, viabilizando validação de unicidade no client
2. **H2:** Electron é a escolha pragmática — toolchain madura, build para Windows trivial, e o overhead de ~150MB é aceitável para um app desktop
3. **H3:** O estilo brutalista aplicado a um jogo de puzzle cria uma identidade visual única e desejável
4. **H4:** 4 níveis de dificuldade com métrica real (não só contagem de buracos) oferecem progressão satisfatória

## Success Criteria

- [ ] App desktop Windows funcional (abre, joga, fecha)
- [ ] Puzzle 16×16 gerado com solução única garantida
- [ ] 4 níveis de dificuldade com diferença perceptível
- [ ] Persistência local (salvar/carregar jogo)
- [ ] Interface brutalista completa (tipografia, cores, bordas, densidade)
- [ ] Distribuível como .zip único pronto para executar
- [ ] Repositório GitHub com commits organizados
- [ ] Efeitos sonoros e visuais preservados da versão original

## Out of Scope for Discovery

- Leaderboards online
- Múltiplos temas visuais
- Modo 9×9 (foco total no 16×16)
- Versão mobile ou web
- Tutorial interativo (removido em projetos anteriores por "cluttering")
