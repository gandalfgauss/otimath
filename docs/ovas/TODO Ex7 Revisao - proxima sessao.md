# TODO — Ex7-Revisão (próxima sessão)

**Data da decisão:** 2026-04-25
**Status:** decisão acordada, implementação pendente para a próxima sessão de trabalho

---

## Decisão tomada

Implementar **Exercício 7 — Revisão**, no OVA Probabilidade Dois Dados, sorteando aleatoriamente entre os **8 eventos pré-definidos da fase `TwoDicesGame`** ([TwoDicesGame.tsx](../../src/components/teaching/probability/two-dices/TwoDicesGame.tsx)) — atividade já existente no OVA com tabela 6×6 (dado verde × dado azul), eventos sobre soma/produto/paridade e operações entre eventos (∪, ∩, −).

**Função pedagógica:** revisão consolidadora do núcleo conceitual do OVA (probabilidade clássica em Ω = {1,...,6}² equiprovável), aplicando recuperação ativa (Roediger & Karpicke, 2006) e prática intercalada (Rohrer & Taylor, 2007).

**NÃO envolve** o universo da tabela de contingência social (Ex5) — apenas o universo dos dados.

---

## Especificação acordada

### Estrutura
- **3 rodadas obrigatórias** (revisão enxuta)
- Em cada rodada:
  - Sorteia 1 dos 8 eventos pré-definidos do `TwoDicesGame` (sem repetição na sessão)
  - Sorteia operação compatível (∪, ∩, − quando aplicável)
  - Renderiza usando engine do `TwoDicesGame` em modo **single-shot** (uma rodada isolada, sem cadeia de 8)
- **Sem dicas escalonadas** automáticas (apela à memória consolidada)
- Botão **"Não sei realmente!"** disponível desde a primeira tentativa errada → reasoning playback
- **Painel final de síntese**: "Você acertou X de 3. Eventos dominados: [lista]. Conceitos a revisar: [lista]"
- **Posição na trilha**: imediatamente antes de `raceBet`
- **Opcional** com botão "Pular revisão final"

### Implementação técnica estimada (6–8 horas + 1h de teste)

1. **Adaptador single-shot do `TwoDicesGame`** (~2-3 h)
   - Atualmente percorre 8 eventos em sequência fixa
   - Criar modo `<TwoDicesGameSingleShot eventIndex={k} operation={op}>` que renderiza apenas o evento sorteado
   - Preservar TODA a validação atual (marcação 6×6 + cálculo de probabilidade)

2. **Componente `UnionExercise7Review.tsx`** (~3-4 h)
   - Espelhar padrão arquitetural do Ex5 (forwardRef + Handle + STEP_SEQUENCE)
   - Orquestrar 3 rodadas com sorteio sem repetição dentro da sessão
   - Painel de síntese final com lista de eventos dominados/a revisar

3. **Integração** (~1 h)
   - Adicionar `'unionExercise7'` ao tipo `Phase` em [TwoDicesExperiment.tsx](../../src/components/teaching/probability/two-dices/TwoDicesExperiment.tsx)
   - Adicionar ao `DEV_PHASE_ORDER`
   - Registrar `unionExercise7Ref` em [TwoDicesPresentation.tsx](../../src/components/teaching/probability/two-dices/TwoDicesPresentation.tsx)
   - Fluxo: Ex5 → Ex7 → raceBet (com botão "Pular revisão final" no Ex7)

---

## Trilha final esperada do OVA

```
Cenas 1–6 → unionTheory → Ex1 → Ex2 → Ex3 → Ex4 → Ex5 → Ex7-Revisão (opcional) → raceBet → finished
```

**Observação:** Ex6 (sorteado entre tipos do Ex5) **NÃO** será implementado — ficou descartado em favor do Ex7-Revisão sobre `TwoDicesGame`.

---

## Pendências de inspeção antes de codificar

Antes de iniciar, ler [TwoDicesGame.tsx](../../src/components/teaching/probability/two-dices/TwoDicesGame.tsx) para:

1. Listar exatamente os **8 eventos pré-definidos** (predicados sobre verde × azul)
2. Identificar quais aceitam operação (∪/∩/−) e quais são puros
3. Mapear a engine de validação (`useTwoDicesHooks.ts`) para o adaptador single-shot
4. Verificar se há estado partilhado entre os 8 eventos que precise ser isolado no single-shot

---

## Checklist da próxima sessão

- [ ] Ler `TwoDicesGame.tsx` e mapear os 8 eventos
- [ ] Criar `TwoDicesGameSingleShot.tsx` (adaptador)
- [ ] Criar `UnionExercise7Review.tsx`
- [ ] Integrar `unionExercise7` em `TwoDicesExperiment.tsx` e `TwoDicesPresentation.tsx`
- [ ] Validar `npx tsc --noEmit` → EXIT=0
- [ ] Teste manual no browser
- [ ] Commit + push para `mod-rangel`
- [ ] **FECHAMENTO DO OVA** — após Ex7, o OVA Dois Dados está pronto para defesa

---

*Próxima sessão: estimativa de 1 dia para fechar o OVA com a inclusão do Ex7-Revisão.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos*
