# TODO — Exercício 8 (próxima sessão)

**Data da decisão:** 2026-04-26
**Status:** decisão arquitetural acordada, implementação pendente.

---

## Decisões fechadas

1. **Caminho arquitetural C — Híbrido** (não substituir hook em produção):
   - Mover `roxa/8/eventParametrization.ts` → `src/lib/probability/eventParametrization.ts` (criar pasta).
   - Criar `src/hooks/teaching/probability/two-dices/useTwoDicesGameAdvancedHooks.ts` (baseado em `roxa/8/useTwoDicesHooks.ts`, adaptado para o caminho de import correto).
   - Criar `src/components/teaching/probability/two-dices/TwoDicesGameAdvanced.tsx`.
   - Adicionar phase `'unionExercise8'` no `TwoDicesExperiment.tsx`.
   - Registrar refs no `TwoDicesPresentation.tsx`.

2. **Leitura β — Ex7 e Ex8 COEXISTEM** (decisão do usuário):
   - Ex7 (Exercícios de Fixação básicos, 12 eventos fixos) PERMANECE como hoje.
   - Ex8 (Exercícios de Fixação avançados, ~50 eventos parametrizados com progressão de dificuldade + balanceamento de famílias) é uma TERCEIRA via opcional.
   - Painel final do Ex6 ganha 3 botões em vez de 2: "Finalizar OVA" / "Ex7 — Fixação básica (opcional)" / "Ex8 — Fixação avançada (opcional)".
   - Cada um leva para sua própria phase (`twoDicesGameFree` para Ex7; `unionExercise8` para Ex8).
   - Botão "Finalizar OVA" externo no Ex8 também (igual ao Ex7).

3. **Opção (i) — marcação sequencial A → B → D no Ex8** (espelha Ex6):
   - Subdividir `mark-A-and-B` em `mark-A` + `mark-B` na função `getNewGame` do hook avançado.
   - Aplicar mesmo padrão de congelamento em cor nítida + remoção de placeholders inúteis.
   - Padrão arquitetural: hook avançado deriva `hideIfUnchecked` análogo ao `useTwoDicesSingleShotHooks`.

4. **Recursos visuais Ex6/Ex7 aplicados ao Ex8** (todos):
   - `eventColors` (A azul info-darkest, B laranja warning-darkest, D roxo brand-pure) — propagado à `TwoDicesTable` e `TwoDicesFormulation`.
   - `hideIfUnchecked` progressivo após cada validação.
   - Cursor `not-allowed` em congelados (já vem da `TwoDicesTable`).
   - Layout 2D Venn com slots fixos (já vem da `TwoDicesTable`).
   - Botão "Marcar todos!" com tooltip idêntico ao Ex6/Ex7.
   - StudyMenu integrado (reuso direto de `shared/StudyMenu.tsx` + `shared/studyMenuContent.ts`).
   - Feedback didático específico por step (reuso de `getFeedbackMessage` + `getSuggestedVerbetes`).

## Critérios técnicos do Ex8

- **Pool ampliado:** ~50 eventos parametrizados via famílias (soma>k, soma<k, soma=k, soma primo, soma múltipla de 3, produto>k, produto<k, faces verde/azul, min/max, paridade, múltiplos, comparação entre faces).
- **Geração validada:** `buildBalancedProgressiveValidatedGameSetup` — cascata de 4 níveis (diversidade forte → sem diversidade → progressão → fallback básico). Garante setup matematicamente válido sempre.
- **Restrições matemáticas estritas:** `isValidPairForOperation` codifica R1-R4 (cardinalidades não-extremas, não-trivialização, não-vazio para Venn).
- **Progressão de dificuldade:** slot 1 (mais fácil, dificuldades 1-2) → slot 4 (mais difícil, dificuldades 2-3-4).
- **Balanceamento de famílias:** scoring pedagógico (+3 família nova, +2 famílias diferentes A vs B, -2 mesma família).
- **R14 nativo:** `verifyExactProbability` por multiplicação cruzada inteira (sem ponto flutuante).
- **Sanitização granular:** `sanitizeFraction` com 5 razões de erro distintas (`empty`, `non-integer`, `zero-denominator`, `negative`, `improper`).
- **Memoização WeakMap** transparente em `countEvent` / `countComposite`.

## Pendências de inspeção antes de codificar

1. Conferir se `roxa/8/eventParametrization.ts` exporta tudo o que `roxa/8/useTwoDicesHooks.ts` importa.
2. Conferir se há colisões de nomes entre tipos do `eventParametrization` (`Event`, `Operation`) e os tipos do hook em produção atual (`useTwoDicesHooks` exporta `Event`, `Operation` próprios).
3. Validar `src/lib/probability/` como caminho de import absoluto via `tsconfig.json` baseUrl + paths.
4. Conferir se a marcação sequencial A → B → D pode ser implementada **dentro** do `getNewGame` (subdividindo o step `mark-A-and-B` em dois) sem quebrar a navegação `nextStep` do hook avançado.

## Checklist da próxima sessão

- [ ] Criar `src/lib/probability/eventParametrization.ts` (mover de `roxa/8/`).
- [ ] Criar `src/hooks/teaching/probability/two-dices/useTwoDicesGameAdvancedHooks.ts`.
- [ ] Adaptar `getNewGame` do hook avançado para sequenciar `mark-A` e `mark-B` (espelhar SingleShot).
- [ ] Adicionar `markAllOnClick` ao hook avançado (regra "só evento atual não-disabled").
- [ ] Derivar `hideIfUnchecked` no hook avançado (após validação de cada step de marcação).
- [ ] Expor `eventColors` e `hideIfUnchecked` no return do hook avançado.
- [ ] Criar `TwoDicesGameAdvanced.tsx` com botão "Marcar todos!" + StudyMenu integrado + feedback específico por step.
- [ ] Adicionar phase `'unionExercise8'` ao tipo `Phase` e ao `DEV_PHASE_ORDER` em `TwoDicesExperiment.tsx`.
- [ ] Adicionar bloco render de `'unionExercise8'` no `TwoDicesExperiment.tsx`.
- [ ] No `UnionExercise6Review.tsx`, adicionar terceiro botão no painel final: "Ex8 — Fixação avançada (opcional)" + prop `onRequestAdvancedFreePlay`.
- [ ] Conectar `onRequestAdvancedFreePlay` em `TwoDicesExperiment.tsx` para `setPhase('unionExercise8')`.
- [ ] Registrar `unionExercise8Ref` em `TwoDicesPresentation.tsx` (back/advance).
- [ ] Estender `studyMenuContent.ts` se necessário (mensagens específicas para `mark-A`, `mark-B`, `mark-D` do Ex8 — provavelmente reuso direto sem adição).
- [ ] Validar `npx tsc --noEmit` → EXIT=0.
- [ ] Teste manual: percorrer Ex6 → painel final → Ex8 → marcar A com cor azul congelando → marcar B → marcar D → identificar operação → calcular P(D) com fração equivalente. Repetir 3-5 vezes para ver variabilidade do pool.
- [ ] Commit + push para `mod-rangel`.
- [ ] Atualizar `docs/ovas/descri OVA Dois Dados - Exercicio 6 e 7.md` (renomear para incluir Ex8) com nova subseção sobre o framework parametrizado, restrições matemáticas, balanceamento, progressão.

---

*Estimativa: ~5-6 horas para fechar Ex8 com todos os recursos visuais Ex6/Ex7 aplicados.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
