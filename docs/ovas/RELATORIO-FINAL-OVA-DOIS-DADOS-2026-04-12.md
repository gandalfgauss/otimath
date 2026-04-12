# DR. OTIMATH — RELATÓRIO FINAL DEFINITIVO
# OVA "PROBABILIDADE – DOIS DADOS"
# Atualização Final + Plano Executável de Implementação

**Data:** 2026-04-12
**Status:** ENCERRAMENTO DE AUDITORIA + ENTRADA EM MODO IMPLEMENTAÇÃO

---

# ETAPA 1 — ATUALIZAÇÃO FINAL DO RELATÓRIO COMPARATIVO

## 1.1 — COMPARAÇÃO COM ANÁLISE ANTERIOR

| Item previamente apontado | Status atual | Situação |
|--------------------------|-------------|----------|
| Bug 0.1 — Validação flutuante (toFixed) em useTwoDicesHooks | Código inalterado (linhas 610-611) | **NÃO CORRIGIDO** |
| Bug 0.2 — Complementar evento 12 ("Todas as faces são pares") | Código inalterado (linha 100) | **NÃO CORRIGIDO** |
| Bug 0.3 — Som click.mp3 inexistente | `click.mp3` EXISTE em /public/sounds/ | **FALSO POSITIVO — REMOVIDO** |
| Bug 0.4 — Navegação irrestrita (bolinhas verde/laranja) | Código inalterado (linhas 522-550) | **NÃO CORRIGIDO** |
| Bug 0.5 — Bolinha dev (vermelha) visível em produção | Código inalterado (linhas 1123-1154), sem flag dev | **NÃO CORRIGIDO** |
| Bug 0.6 — Cena 3 não aceita frações equivalentes | Código inalterado (linhas 334-335) | **NÃO CORRIGIDO** |
| Bug 0.7 — Responsividade tabela 6×6 do jogo | Código inalterado (células 116px fixas) | **NÃO CORRIGIDO** |
| Bug 0.8 — Responsividade corrida de carrinhos | Código inalterado | **NÃO CORRIGIDO** |
| Bug 0.9 — DiceFaceIcon duplicada 4 vezes | Código inalterado | **NÃO CORRIGIDO** |
| Bug 0.10 — Corrida revela soma antes do cálculo | Código inalterado (linhas 2958-2961) | **NÃO CORRIGIDO** |
| Lacuna 5.1 — Conceito de evento | Já construído no OVA Disco Probabilístico | **SUPERADO pelo Disco** |
| Lacuna 5.2 — Interseção de eventos | Já construído no Disco (45 tipos) | **SUPERADO pelo Disco** |
| Lacuna 5.3 — União com sobreposição | Já construído no Disco (15+ receitas) | **SUPERADO pelo Disco** |
| Lacuna 5.4 — Diferença A−B | Parcialmente coberto no Disco | **PARCIAL — necessita contextualização** |
| Lacuna 5.5 — Fórmula P(A∪B) | Já construída e praticada no Disco | **SUPERADO pelo Disco** |
| Lacuna 5.6 — Exercício inverso P(A∩B) | Não coberto em nenhum OVA | **NÃO CORRIGIDO** |
| Inserção I6 — Descoberta guiada da fórmula | Redundante (já feita no Disco) | **SUGESTÃO REMOVIDA** |

## 1.2 — DÉBITOS REMANESCENTES

| Lacuna/Pendência | Prioridade | Impacto |
|-----------------|------------|---------|
| Bug 0.1 — Validação flutuante aceita respostas erradas | IMEDIATA | Crítico — reforça erro matemático |
| Bug 0.2 — Complementar errado do evento 12 | IMEDIATA | Alto — induz erro conceitual sobre quantificadores |
| Bug 0.4 — Navegação permite pular cenas incompletas | IMEDIATA | Alto — destrói progressão didática |
| Bug 0.5 — Bolinha dev exposta em produção | IMEDIATA | Médio — agrava Bug 0.4 |
| Bug 0.10 — Corrida revela soma sem aluno calcular | IMEDIATA | Alto — acerto mecânico sem compreensão |
| Bug 0.6 — Cena 3 rejeita frações equivalentes | PRÓXIMA SPRINT | Baixo — inconsistência com R14 |
| Bug 0.7 — Tabela 6×6 não responsiva em mobile | PRÓXIMA SPRINT | Alto — mobile é plataforma primária |
| Bug 0.8 — Corrida comprimida em mobile | PRÓXIMA SPRINT | Médio — ilegível em telas pequenas |
| Bug 0.9 — DiceFaceIcon 4× duplicada | OPCIONAL | Médio — risco de divergência, manutenção |
| Ponte contextual Disco→tabela 6×6 | PRÓXIMA SPRINT | Alto — transferência de conceitos |
| Diferença A−B contextualizada | OPCIONAL | Médio — parcialmente coberta |
| Exercício inverso P(A∩B) | OPCIONAL | Médio — conceito genuinamente novo |

---

# ETAPA 2 — RELATÓRIO DETALHADO DOS PROBLEMAS REMANESCENTES

## PROBLEMA 1: Validação por ponto flutuante no jogo principal

**TIPO:** Matemático / Técnico
**LOCALIZAÇÃO:** `useTwoDicesHooks.ts`, linhas 610-611 (`verifyProbabilityAndProbabilityComplementary`) e linhas 632-634 (`verifyProbability`)
**DESCRIÇÃO:** As funções de validação comparam frações usando `(parseInt(num)/parseInt(den)).toFixed(2) == probabilityOfEventOccurring.toFixed(2)`. Isso cria colisões de arredondamento: 1/7≈0.1428→"0.14" coincide com 5/36≈0.1388→"0.14", então o sistema aceita 1/7 como resposta correta quando a resposta certa é 5/36. Padrão R14 (multiplicação cruzada) já implementado corretamente em TwoDicesPractice.tsx (linhas 734-784).
**IMPACTO NO FUNCIONAMENTO:** O sistema aceita respostas matematicamente erradas como corretas.
**IMPACTO NA APRENDIZAGEM:** Altíssimo — reforça respostas erradas; o aluno acredita ter acertado quando errou.
**GRAVIDADE:** CRÍTICA
**PRIORIDADE:** IMEDIATA
**CORREÇÃO:** Substituir as duas funções por comparação via multiplicação cruzada:

```typescript
// verifyProbability — SUBSTITUIR as linhas 632-634 por:
const equivalent = parseInt(num) * sampleSpace === parseInt(den) * eventOccurrences;
if (equivalent) return true;
return false;

// verifyProbabilityAndProbabilityComplementary — SUBSTITUIR linhas 610-611 por:
const equivA = parseInt(numA) * sampleSpace === parseInt(denA) * eventOccurrences;
const equivComp = parseInt(numComp) * sampleSpace === parseInt(denComp) * (sampleSpace - eventOccurrences);
if (equivA && equivComp) return true;
return false;
```

Validar antes: num e den inteiros, den > 0, campos não vazios.

---

## PROBLEMA 2: Descrição errada do complementar do evento 12

**TIPO:** Matemático
**LOCALIZAÇÃO:** `useTwoDicesHooks.ts`, linha 100
**DESCRIÇÃO:** O evento "Nenhuma face par" (validation: greenDice % 2 === 1 && blueDice % 2 === 1) tem complementaryDescription "Todas as faces são pares". Isso está logicamente errado. O complementar de "nenhuma face é par" (∀ face, face é ímpar) é "existe ao menos uma face par" (∃ face, face é par), ou seja, "Pelo menos uma face par". "Todas pares" seria o complementar de "pelo menos uma ímpar".
**IMPACTO NA APRENDIZAGEM:** Alto — induz erro sobre negação de quantificadores e conceito de complementar.
**GRAVIDADE:** ALTA
**PRIORIDADE:** IMEDIATA
**CORREÇÃO:** Linha 100: trocar `"Todas as faces são pares"` por `"Pelo menos uma face par"`.

---

## PROBLEMA 3: Navegação irrestrita entre cenas

**TIPO:** Pedagógico / UX
**LOCALIZAÇÃO:** `TwoDicesPresentation.tsx`, linhas 482-551 (bolinhas verde/laranja fixas)
**DESCRIÇÃO:** O botão laranja (avançar) e o botão verde (voltar) em position:fixed permitem saltar para qualquer cena sem ter completado a atual. O aluno pode ir da Cena 1 direto para a Cena 7 sem construir nenhum conceito. A condição é apenas `scene < 7` (para avançar) sem verificar conclusão. O rodapé fixo (linha 1112) já implementa a lógica correta de gates por cena.
**IMPACTO NA APRENDIZAGEM:** Alto — destrói a progressão de Brousseau (Ação→Formulação→Institucionalização).
**GRAVIDADE:** ALTA
**PRIORIDADE:** IMEDIATA
**CORREÇÃO:** Aplicar na bolinha laranja a mesma condição de visibilidade do botão do rodapé:

```
{scene !== 2 && !(scene === 3 && scene3Step < 6) && !(scene === 4 && scene4Step < 3) && ...}
```

Ou remover as bolinhas inteiramente e confiar apenas no botão do rodapé (mais simples).

---

## PROBLEMA 4: Bolinha dev visível em produção

**TIPO:** UX
**LOCALIZAÇÃO:** `TwoDicesPresentation.tsx`, linhas 1123-1154
**DESCRIÇÃO:** Botão circular vermelho (22×22px) no rodapé, com rótulo "Pular fase", visível a todos os utilizadores. Permite saltar cenas arbitrariamente.
**GRAVIDADE:** MÉDIA
**PRIORIDADE:** IMEDIATA
**CORREÇÃO:** Envolver em `{process.env.NODE_ENV === 'development' && ( ... )}`.

---

## PROBLEMA 5: Corrida revela a soma sem o aluno calcular

**TIPO:** Pedagógico
**LOCALIZAÇÃO:** `TwoDicesExperiment.tsx`, linhas 2958-2961
**DESCRIÇÃO:** Na fase `raceRunning`, após o lançamento dos dados, o texto exibe diretamente: "A soma foi **{racePendingSum}**. Clique no carrinho **{racePendingSum}** para avançá-lo!" O aluno não precisa calcular — a soma já está pronta. Isso contradiz o design da Cena 6 (onde o aluno calculava a soma) e transforma a corrida em clique mecânico sem cognição.
**IMPACTO NA APRENDIZAGEM:** Alto — acerto sem compreensão; atividade de consolidação perde seu propósito.
**GRAVIDADE:** ALTA
**PRIORIDADE:** IMEDIATA
**CORREÇÃO:** Esconder a soma até o aluno digitá-la. Adicionar um estado `raceSumInput` onde o aluno digita a soma. Só após validação, revelar o carrinho correspondente. Detalhamento na Etapa 4.

---

## PROBLEMA 6: Cena 3 rejeita frações equivalentes

**TIPO:** Validação / Consistência
**LOCALIZAÇÃO:** `TwoDicesPresentation.tsx`, linhas 334-335
**DESCRIÇÃO:** `numOk = num === 1` e `denOk = den === 6` exigem literalmente 1/6. 2/12 é rejeitado.
**GRAVIDADE:** BAIXA
**PRIORIDADE:** PRÓXIMA SPRINT
**CORREÇÃO:** `const fracOk = num * 6 === den * 1;`

---

## PROBLEMA 7: Tabela 6×6 não responsiva

**TIPO:** Responsividade
**LOCALIZAÇÃO:** `TwoDicesTable.tsx`, células com `w-[116px]` fixo e `h-[100px]` fixo
**DESCRIÇÃO:** A tabela tem largura mínima de 746px (6×116 + 50). Em mobile (320-375px), apenas ~2.5 colunas são visíveis. Scroll horizontal obrigatório. Checkboxes comprimidos quando múltiplos eventos ativos.
**GRAVIDADE:** ALTA (mobile é plataforma primária em escola pública)
**PRIORIDADE:** PRÓXIMA SPRINT
**CORREÇÃO:** Substituir `w-[116px]` por `min-w-[80px] w-[min(116px,15vw)]`; reduzir `h-[100px]` para `h-[72px]` em mobile via `max-sm:h-[72px]`.

---

## PROBLEMA 8: Corrida comprimida em mobile

**TIPO:** Responsividade
**LOCALIZAÇÃO:** `TwoDicesExperiment.tsx`, linhas 2800-3082
**DESCRIÇÃO:** 13 linhas de carrinhos com SVGs (width=44) em células flex:1. Em telas < 400px, os carrinhos ficam ilegíveis (número estampado irreconhecível) e alvos de toque < 44px.
**GRAVIDADE:** MÉDIA
**PRIORIDADE:** PRÓXIMA SPRINT
**CORREÇÃO:** Adicionar `overflow-x: auto` no container da pista e `min-width: 480px` na grade interna.

---

## PROBLEMA 9: Ausência de ponte contextual Disco→Tabela 6×6

**TIPO:** Pedagógico / Epistemológico
**LOCALIZAÇÃO:** Transição entre o final da Cena 7 (raceFinished/finished) e o início do Jogo (TwoDicesGame)
**DESCRIÇÃO:** O aluno domina os conceitos de evento, interseção, união e fórmula P(A∪B) no contexto do Disco (setores circulares). Ao chegar ao Jogo do OVA Dois Dados, precisa TRANSFERIR esses conceitos para a representação tabular 6×6. Não há nenhuma mediação de transferência. O símbolo ∩ aparece num dropdown sem ancoragem contextual.
**GRAVIDADE:** ALTA
**PRIORIDADE:** PRÓXIMA SPRINT
**CORREÇÃO:** Inserir 3-4 microetapas de transferência contextual entre a Cena 7 e o Jogo. Detalhamento completo na Etapa 4.

---

# ETAPA 3 — ENCERRAMENTO DO MODO AUDITORIA

A auditoria está encerrada. Nenhuma nova varredura, comparação ou diagnóstico será repetido.

---

# ETAPA 4 — PLANO EXECUTÁVEL DE IMPLEMENTAÇÃO

---

## PRIORIDADE 1 — IMPLEMENTAR IMEDIATAMENTE

---

### IMPL-01: Correção da validação flutuante

**1. O QUE:** Substituir comparação por toFixed(2) por multiplicação cruzada em useTwoDicesHooks.ts
**2. ONDE:** useTwoDicesHooks.ts, funções `verifyProbabilityAndProbabilityComplementary()` (linha 595) e `verifyProbability()` (linha 619)
**3. PROBLEMA QUE RESOLVE:** Bug 0.1 — aceita respostas matematicamente erradas
**4. JUSTIFICATIVA:** Fidelidade matemática é condição mínima de um OVA de probabilidade
**5. OBJETIVO CONCEITUAL:** Garantir que apenas frações equivalentes sejam aceitas

**6. COMO IMPLEMENTAR:**

Função `verifyProbabilityAndProbabilityComplementary` — substituir INTEGRALMENTE linhas 595-617 por:

```typescript
const verifyProbabilityAndProbabilityComplementary = () => {
  const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
  const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE; // 36
  let eventOccurrences = 0;

  for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
    for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
      if (eventToProbability?.validation(diceGreen + 1, diceBlue + 1)) {
        eventOccurrences += 1;
      }
    }
  }

  const numA = parseInt(probabilitiesTextInputs.numerator.value as string, 10);
  const denA = parseInt(probabilitiesTextInputs.denominator.value as string, 10);
  const numComp = parseInt(probabilitiesTextInputs.complementaryNumerator?.value as string, 10);
  const denComp = parseInt(probabilitiesTextInputs.complementaryDenominator?.value as string, 10);

  if (isNaN(numA) || isNaN(denA) || isNaN(numComp) || isNaN(denComp)) return false;
  if (denA <= 0 || denComp <= 0) return false;

  const compOccurrences = sampleSpace - eventOccurrences;
  const equivA = numA * sampleSpace === denA * eventOccurrences;
  const equivComp = numComp * sampleSpace === denComp * compOccurrences;

  return equivA && equivComp;
};
```

Função `verifyProbability` — substituir INTEGRALMENTE linhas 619-639 por:

```typescript
const verifyProbability = () => {
  const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
  const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
  let eventOccurrences = 0;

  for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
    for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
      if (eventToProbability?.validation(diceGreen + 1, diceBlue + 1)) {
        eventOccurrences += 1;
      }
    }
  }

  const num = parseInt(probabilitiesTextInputs.numerator.value as string, 10);
  const den = parseInt(probabilitiesTextInputs.denominator.value as string, 10);

  if (isNaN(num) || isNaN(den) || den <= 0) return false;

  return num * sampleSpace === den * eventOccurrences;
};
```

**7. INTERAÇÃO DO ALUNO:** Nenhuma mudança. O aluno continua digitando fração.
**8. RESPOSTA DO SISTEMA:** Idêntica, mas agora matematicamente correta.
**9. FEEDBACK:** Sem alteração no feedback existente.
**10. VISUAL:** Nenhuma mudança.
**11. TIPO:** Correção de bug, sem UI.
**12. TRANSIÇÃO:** Nenhuma.
**13. UX/ACESSIBILIDADE:** Nenhuma mudança.
**14. NÃO-INFLAÇÃO:** Zero telas adicionais. Correção interna de lógica.

---

### IMPL-02: Correção do complementar do evento 12

**1. O QUE:** Corrigir a string do complementar de "Nenhuma face par"
**2. ONDE:** useTwoDicesHooks.ts, linha 100
**3. PROBLEMA QUE RESOLVE:** Bug 0.2 — descrição matematicamente incorreta
**4. JUSTIFICATIVA:** O complementar de ¬∃par é ∃par, não ∀par
**5. OBJETIVO CONCEITUAL:** Precisão na negação de quantificadores

**6. COMO IMPLEMENTAR:**

Linha 100 — substituir:
```typescript
complementaryDescription: "Todas as faces são pares",
```
por:
```typescript
complementaryDescription: "Pelo menos uma face par",
```

**7-14:** Idêntico ao IMPL-01 — correção interna, zero impacto visual.

---

### IMPL-03: Restrição da navegação entre cenas

**1. O QUE:** Impedir que as bolinhas verde/laranja avancem para cenas não concluídas
**2. ONDE:** TwoDicesPresentation.tsx, linhas 482-551
**3. PROBLEMA QUE RESOLVE:** Bug 0.4 — navegação irrestrita destrói progressão
**4. JUSTIFICATIVA:** Brousseau (TSD) — fase de Ação precede Formulação

**6. COMO IMPLEMENTAR:**

Opção A (recomendada — mais simples): Remover inteiramente o bloco das bolinhas verde/laranja (linhas 482-551). O rodapé fixo já tem botão "Próximo" com gates corretos.

Opção B (se quiser manter): Condicionar a bolinha laranja (avançar) à mesma expressão do botão do rodapé:

```tsx
{scene < 7 && scene !== 2 && !(scene === 3 && scene3Step < 6) && !(scene === 4 && scene4Step < 3) && !(scene === 5 && !scene5Finished) && !(scene === 6 && !scene6Finished) && !(scene === 7 && !scene7Finished) && (
  <button ... onClick={() => goToScene(scene + 1)} ... />
)}
```

**7. INTERAÇÃO:** O aluno perde a capacidade de pular. Precisa completar cada cena.
**8. RESPOSTA:** Bolinha não aparece até a cena estar completa (Opção B) ou não existe (Opção A).
**14. NÃO-INFLAÇÃO:** Remove código. Zero adição.

---

### IMPL-04: Bolinha dev condicionada a desenvolvimento

**1. O QUE:** Esconder a bolinha vermelha de pular fase em produção
**2. ONDE:** TwoDicesPresentation.tsx, linhas 1123-1154
**3. PROBLEMA QUE RESOLVE:** Bug 0.5

**6. COMO IMPLEMENTAR:**

Envolver o `<button>` em:
```tsx
{process.env.NODE_ENV === 'development' && (
  <button type="button" ... > {scene} </button>
)}
```

---

### IMPL-05: Corrida com cálculo obrigatório da soma

**1. O QUE:** O aluno deve digitar a soma dos dados antes de o carrinho ser revelado
**2. ONDE:** TwoDicesExperiment.tsx, fase `raceRunning` (linhas 2947-3083)
**3. PROBLEMA QUE RESOLVE:** Bug 0.10 — acerto mecânico sem compreensão
**4. JUSTIFICATIVA:** Cena 6 e Cena 7 (sumInput) exigem cálculo de soma. A corrida deve ser consistente.
**5. OBJETIVO CONCEITUAL:** Consolidar a habilidade de somar pares ordenados sob pressão temporal

**6. COMO IMPLEMENTAR:**

Adicionar 2 novos estados:
```typescript
const [raceSumUserInput, setRaceSumUserInput] = useState('');
const [raceSumValidated, setRaceSumValidated] = useState(false);
```

No fluxo, após `rollRaceDice()` definir `racePendingSum`:
- NÃO mostrar o valor de `racePendingSum`
- Mostrar: "Qual a soma dos dados?" + input + botão Conferir
- Ao acertar: revelar o carrinho e permitir clique
- Ao errar: "Some os resultados dos dados e tente novamente."

Na fase `raceRunning`, SUBSTITUIR o bloco das linhas 2958-2961 por:

```tsx
{racePendingSum !== null && raceWinner === null && !raceSumValidated && (
  <div className="flex flex-col items-center gap-y-micro">
    <p className="ds-body-bold text-center text-neutral-black">
      Qual a soma dos dois dados?
    </p>
    <div className="flex items-center gap-x-micro">
      <input
        type="number"
        inputMode="numeric"
        min={2}
        max={12}
        value={raceSumUserInput}
        onChange={e => setRaceSumUserInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') validateRaceSum(); }}
        placeholder="?"
        aria-label="Digite a soma dos dois dados"
        className="ds-body-bold"
        style={{
          border: `2px solid var(--color-neutral-lighter)`,
          borderRadius: 8,
          padding: '8px 14px',
          outline: 'none',
          textAlign: 'center',
          width: 72,
          fontWeight: 700,
        }}
      />
      <Button style="primary" size="extra-small" onClick={validateRaceSum}>
        Conferir
      </Button>
    </div>
  </div>
)}
{racePendingSum !== null && raceWinner === null && raceSumValidated && (
  <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-warning-dark)', fontSize: '1.05rem' }}>
    A soma é <strong>{racePendingSum}</strong>. Clique no carrinho <strong>{racePendingSum}</strong> para avançá-lo!
  </p>
)}
```

Adicionar a função:
```typescript
const validateRaceSum = () => {
  const v = parseInt(raceSumUserInput.trim(), 10);
  if (v === racePendingSum) {
    setRaceSumValidated(true);
    playSound('/sounds/correct.mp3');
  } else {
    playSound('/sounds/incorrect.mp3');
  }
};
```

Resetar nos pontos de novo sorteio:
```typescript
// Em rollRaceDice, antes de setRacePendingSum:
setRaceSumUserInput('');
setRaceSumValidated(false);
```

**7. INTERAÇÃO:** Aluno vê os dados 3D → digita a soma → confere → sistema revela o carrinho a clicar.
**8. RESPOSTA:** Se correto: som de acerto + carrinho revelado. Se errado: "Some os resultados dos dados e tente novamente."
**9. FEEDBACK:** Erro: "Some os resultados dos dados e tente novamente." Acerto: carrinho revelado com destaque.
**10. VISUAL:** Input numérico entre o lançamento e a revelação. Nenhuma alteração na pista.
**12. TRANSIÇÃO:** Após acertar a soma, fluxo continua idêntico (clicar no carrinho).
**14. NÃO-INFLAÇÃO:** 1 input de 2 segundos. Transforma ação mecânica em ação cognitiva.

---

## PRIORIDADE 2 — IMPLEMENTAR EM SEGUIDA

---

### IMPL-06: Ponte contextual Disco → Tabela 6×6 (Cena 7b)

**1. O QUE:** 3 microetapas de transferência contextual que conectam os conceitos aprendidos no Disco à representação tabular do OVA Dois Dados
**2. ONDE:** Após a fase `raceFinished` da Cena 7 (TwoDicesExperiment), ANTES do Jogo (TwoDicesGame)
**3. PROBLEMA QUE RESOLVE:** Problema 9 — ausência de ponte de transferência
**4. JUSTIFICATIVA:** Duval (1995) — conversão entre registros semióticos exige mediação explícita. O aluno domina os conceitos em setores circulares; precisa transferi-los para grade retangular.
**5. OBJETIVO CONCEITUAL:** Que o aluno reconheça interseção, união e diferença de eventos no contexto da tabela 6×6 de dois dados, reativando conhecimentos construídos no Disco.

**6. COMO IMPLEMENTAR:**

Criar um novo componente `EventConceptsBridge.tsx` dentro de `src/components/teaching/probability/two-dices/`. Este componente é renderizado entre o final da Cena 7 (`onFinished`) e o início do Jogo, controlado por um novo estado em `TwoDicesPresentation.tsx`.

#### Microetapa 7b.1 — "Eventos na tabela"

**Texto exibido:**

> No Disco Probabilístico, você aprendeu que um **evento** é um subconjunto do espaço amostral. Agora estamos no mundo dos dois dados, onde o espaço amostral tem **36 pares ordenados** organizados numa tabela 6×6.
>
> Veja o evento **A = "Soma maior que 8"**. As células douradas são os pares cuja soma é maior que 8.

**Ação do aluno:**
- A tabela 6×6 é exibida com as 10 células de soma > 8 destacadas em dourado
- Abaixo: "Quantos pares pertencem ao evento A?"
- Input numérico → Validação (resposta: 10)

**Feedback:**
- Acerto: "Correto! n(A) = 10. Portanto, P(A) = 10/36."
- Erro: "Conte as células douradas na tabela."

**Após validação, botão "Próximo".**

#### Microetapa 7b.2 — "Interseção e União na tabela"

**Texto exibido:**

> Agora considere dois eventos ao mesmo tempo:
> - **Evento A** = "Soma maior que 8" (dourado)
> - **Evento B** = "Face par no dado verde" (roxo)
>
> As células que pertencem a **ambos** os eventos estão com **borda dupla** (dourado + roxo).

**Ação do aluno (3 perguntas sequenciais):**

**Pergunta 1:** "Quantos pares pertencem a A **e** a B? (interseção A ∩ B)"
- Input numérico → Validação
- Feedback erro: "Procure as células com borda dupla (satisfazem as duas condições ao mesmo tempo)."
- Feedback acerto: "n(A ∩ B) = [valor]."

**Pergunta 2:** "Quantos pares pertencem a A **ou** a B (ou ambos)? (união A ∪ B)"
- Input numérico → Validação
- Feedback erro: "Conte todas as células com algum destaque (dourado, roxo ou ambos)."
- Feedback acerto: "n(A ∪ B) = [valor]."

**Pergunta 3 (armadilha da dupla contagem):** "Se somarmos n(A) + n(B) = [valor A] + [valor B] = [soma]. Esse valor é igual a n(A ∪ B)?"
- Botões "Sim" / "Não"
- Se "Sim" (errado): "Não! As células na interseção foram contadas duas vezes. Lembre-se da fórmula que você aprendeu no Disco: n(A ∪ B) = n(A) + n(B) − n(A ∩ B)."
- Se "Não" (certo): "Correto! n(A) + n(B) = [soma], mas n(A ∪ B) = [correto]. A diferença existe porque [interseção] pares foram contados duas vezes. É a fórmula que você já conhece: n(A ∪ B) = n(A) + n(B) − n(A ∩ B)."

**Após validação, botão "Próximo".**

#### Microetapa 7b.3 — "Diferença na tabela"

**Texto exibido:**

> E se quisermos os pares que pertencem a A **mas não** a B?
> Ou seja: soma maior que 8, porém dado verde é ímpar.
>
> As células em destaque pertencem a **A − B**.

**Ação do aluno:**
- Tabela com A−B destacado (células douradas SEM borda roxa)
- "Quantos pares pertencem a A − B?"
- Input numérico → Validação
- Feedback erro: "Conte apenas as células douradas que NÃO têm borda roxa."
- Feedback acerto: "n(A − B) = [valor]. Note que A − B = A ∩ B̄ (interseção de A com o complementar de B)."

**Após validação, botão "Iniciar Simulação" → entra no Jogo.**

**7. INTERAÇÃO:** 3 telas com inputs numéricos (contagem) + 1 pergunta sim/não
**8. RESPOSTA:** Validação imediata com feedback direcionado
**9. FEEDBACK IDEAL:** Como descrito acima — sempre referencia a fórmula já conhecida do Disco, nunca a reintroduz como novidade
**10. ANIMAÇÃO:** Tabela 6×6 com destaques bicolores. Ao acertar cada contagem, o número aparece ao lado do símbolo (n(A∩B)=X). Transição suave entre microetapas.
**11. TIPO:** Exercícios de contagem visual + pergunta conceitual
**12. TRANSIÇÃO:** 7b.1 → 7b.2 → 7b.3 → Jogo. Botão "Próximo" em cada. Sem looping.
**13. UX/RESPONSIVIDADE:** Tabela deve ter as mesmas proporções da Cena 7 (cells de 36-44px). Em mobile, scroll horizontal com snap. Destaques bicolores devem ter pista redundante (borda + cor + ícone ✓) para acessibilidade.
**14. NÃO-INFLAÇÃO:** 3 telas, ~2-3 minutos. Não introduz conceito novo — apenas contextualiza conceitos já construídos no Disco para o formato tabular. Sem essa ponte, o Jogo inteiro fica incompreensível.

---

### IMPL-07: Correção da validação da Cena 3 (R14)

**1. O QUE:** Aceitar frações equivalentes em P(face i)
**2. ONDE:** TwoDicesPresentation.tsx, linhas 334-335

**6. COMO IMPLEMENTAR:**

Substituir:
```typescript
const numOk = num === 1;
const denOk = den === 6;
const fracOk = denOk && numOk;
```
por:
```typescript
const fracOk = !isNaN(num) && !isNaN(den) && den > 0 && num * 6 === den * 1;
```

---

### IMPL-08: Responsividade da tabela 6×6 do jogo

**1. O QUE:** Reduzir dimensões das células em viewports pequenos
**2. ONDE:** TwoDicesTable.tsx

**6. COMO IMPLEMENTAR:**

Substituir `w-[116px]` por `w-[116px] max-sm:w-[80px]` nas th/td.
Substituir `h-[100px]` por `h-[100px] max-sm:h-[72px]`.
Substituir `w-[50px]` do header vertical por `w-[50px] max-sm:w-[36px]`.
Reduzir imagens dos dados: `w-[32px] h-[32px]` → `w-[32px] h-[32px] max-sm:w-[24px] max-sm:h-[24px]`.

---

### IMPL-09: Responsividade da corrida de carrinhos

**1. O QUE:** Permitir scroll horizontal na pista em mobile
**2. ONDE:** TwoDicesExperiment.tsx, container da pista (linhas 2816-2898 e 2969-3070)

**6. COMO IMPLEMENTAR:**

No `div` com `role="grid"`, adicionar:
```tsx
style={{
  ...existingStyles,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
}}
```

E no container interno de cada linha, adicionar `min-width: 480px`.

---

## PRIORIDADE 3 — OPCIONAL

---

### IMPL-10: Exercício inverso — deduzir P(A∩B)

**1. O QUE:** 1 exercício onde o aluno calcula P(A∩B) dados P(A), P(B) e P(A∪B)
**2. ONDE:** Após a Microetapa 7b.3 (antes do botão "Iniciar Simulação"), como tela 7b.4 opcional
**3. PROBLEMA QUE RESOLVE:** Lacuna 5.6 — exercício inverso genuinamente ausente em ambos os OVAs

**Texto exibido:**

> No Disco, você aprendeu: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).
>
> Sabendo que P(A) = 10/36, P(B) = 18/36 e P(A ∪ B) = 22/36, calcule P(A ∩ B):

**Ação do aluno:**
- 2 inputs (numerador / denominador)
- Validação R14: num × 36 === den × 6 (pois A∩B = 6 pares)

**Feedback erro:** "Reorganize a fórmula: P(A ∩ B) = P(A) + P(B) − P(A ∪ B). Substitua os valores."
**Feedback acerto:** "P(A ∩ B) = 6/36. Verifique: 10/36 + 18/36 − 6/36 = 22/36 = P(A ∪ B). ✓"

---

### IMPL-11: Extração de DiceFaceIcon compartilhado

**1. O QUE:** Unificar as 4 implementações de DiceFaceIcon
**2. ONDE:** Criar `src/components/teaching/probability/two-dices/DiceFaceIcon.tsx`
**3. PROBLEMA QUE RESOLVE:** Bug 0.9 — duplicação e risco de divergência

**6. COMO IMPLEMENTAR:**

Criar componente unificado com todas as props necessárias:
```tsx
interface DiceFaceIconProps {
  face: number;
  size: number;
  color?: 'blue' | 'green' | 'white';
  ariaHidden?: boolean;
  ariaLabel?: string;
  showShadow?: boolean;
}
```

Importar nos 4 arquivos que atualmente o duplicam.

---

# ROADMAP FINAL DE IMPLEMENTAÇÃO

| Ordem | O que implementar | Complexidade | Impacto pedagógico | Prioridade |
|-------|------------------|-------------|-------------------|------------|
| 1 | IMPL-01: Validação R14 no jogo (multiplicação cruzada) | Baixa (trocar 2 funções) | CRÍTICO — elimina aceitação de respostas erradas | P1 IMEDIATA |
| 2 | IMPL-02: Complementar evento 12 | Trivial (trocar 1 string) | ALTO — corrige erro conceitual | P1 IMEDIATA |
| 3 | IMPL-03: Restrição navegação (remover bolinhas) | Baixa (remover bloco) | ALTO — restaura progressão | P1 IMEDIATA |
| 4 | IMPL-04: Bolinha dev condicionada | Trivial (1 condicional) | MÉDIO — fecha escape | P1 IMEDIATA |
| 5 | IMPL-05: Corrida com cálculo de soma | Média (novo estado + input) | ALTO — transforma mecânico em cognitivo | P1 IMEDIATA |
| 6 | IMPL-06: Ponte Disco→Tabela (3 microetapas) | Alta (novo componente) | ALTO — habilita compreensão do Jogo | P2 PRÓXIMA |
| 7 | IMPL-07: Cena 3 aceitar equivalentes | Trivial (trocar 2 linhas) | BAIXO — consistência R14 | P2 PRÓXIMA |
| 8 | IMPL-08: Responsividade tabela 6×6 | Média (CSS breakpoints) | ALTO — mobile usável | P2 PRÓXIMA |
| 9 | IMPL-09: Responsividade corrida | Baixa (overflow + min-width) | MÉDIO — mobile usável | P2 PRÓXIMA |
| 10 | IMPL-10: Exercício inverso P(A∩B) | Média (1 tela nova) | MÉDIO — conceito genuinamente novo | P3 OPCIONAL |
| 11 | IMPL-11: DiceFaceIcon unificado | Média (refatoração) | BAIXO — qualidade de código | P3 OPCIONAL |

---

**Este relatório encerra o modo auditoria. A partir deste ponto, o foco é exclusivamente implementação.**

*Dr. OtiMath.com — Relatório Final Definitivo — 2026-04-12*
