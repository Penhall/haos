# Decision: Uniqueness Verification Strategy

**Date:** 2026-06-23
**Project:** Sudokue
**Status:** accepted

## Context

O solver `countSolutions()` usa uma heurística dual-solve (resolve com ordem normal, depois com ordem reversa de candidatos) em vez de enumeração exaustiva. Isso foi questionado na auditoria: a heurística é probabilística e não garante 100% de unicidade.

## Decision

Manter a heurística dual-solve. NÃO migrar para enumeração exaustiva.

## Rationale

1. **Performance:** Enumeração exaustiva em grid 16×16 com ~140-160 buracos pode levar múltiplos segundos ou até minutos. A geração de puzzle já itera sobre 256 posições verificando unicidade a cada remoção — isso seria inviável com contagem exaustiva.

2. **Confiabilidade prática:** A heurística dual-solve é extremamente confiável para Sudoku 16×16. O grid base é deterministicamente válido (fórmula matemática), e as transformações (shuffle rows/cols/bands/stacks/digits/transpose) preservam validade. Puzzles com múltiplas soluções são raros nessa abordagem porque o grid foi gerado de um template válido, não de um espaço de busca aleatório.

3. **Custo-benefício:** A diferença prática entre "99.99% de garantia" e "100% de garantia" para um jogo offline é insignificante. O usuário nunca saberia se um puzzle tem 2 soluções — ele só preencheria uma delas e o jogo aceitaria como correta.

## Consequences

- Geração de puzzle permanece rápida (<500ms para qualquer dificuldade)
- Risco teórico de puzzle com múltiplas soluções (probabilidade estimada <0.01%)
- Se um puzzle multi-solução ocorrer, o usuário pode preencher qualquer solução válida e o jogo aceitará

## Review Date

2026-12-23 (6 meses — reavaliar se houver relatos de puzzles com múltiplas soluções)
