# ANÁLISE DR. OTIMATH — OVA "PROBABILIDADE – DOIS DADOS"

**Analista:** Dr. OtiMath.com
**Data:** 2026-04-12
**Escopo:** Varredura completa + mapa de inserções + bugs + responsividade + acessibilidade

---

## PARTE 0 — VARREDURA DE BUGS, RESPONSIVIDADE E INCONSISTÊNCIAS

### 0.1 — BUG CRÍTICO: Validação por ponto flutuante no jogo principal

**Arquivo:** useTwoDicesHooks.ts:610-616

As funções `verifyProbabilityAndProbabilityComplementary()` e `verifyProbability()` usam divisão com `toFixed(2)` para comparar frações:

```ts
if((parseInt(num) / parseInt(den)).toFixed(2) == probabilityOfEventOccurring.toFixed(2))
```

Isso viola a regra R14 (multiplicação cruzada) documentada no próprio CLAUDE.md e **aceita respostas matematicamente erradas**. Exemplo: se o evento tem 5 favoráveis, P(A)=5/36≈0.1388→`toFixed(2)`="0.14". O aluno pode digitar 1/7≈0.1428→`toFixed(2)`="0.14" e o sistema aceita como correto. Frações com denominadores distantes de 36 podem coincidir no arredondamento e passar pela validação.

- **Tipo:** Bug matemático crítico
- **Gravidade:** CRÍTICA
- **Impacto na aprendizagem:** Altíssimo — reforça respostas erradas como corretas
- **Correção:** Substituir por multiplicação cruzada, idêntico ao padrão já implementado em `validateCalc()` e `validateCompCalc()` na Cena 5 (TwoDicesPractice.tsx:734-784)
- **Precisa corrigir antes de inserir novos elementos?** SIM, obrigatório

### 0.2 — BUG MATEMÁTICO: Descrição do complementar do Evento 12

**Arquivo:** useTwoDicesHooks.ts:98-102

```ts
{
  description: "Nenhuma face par",
  complementaryDescription: "Todas as faces são pares",
  ...
}
```

O complementar de "Nenhuma face par" é "**Pelo menos uma face par**", NÃO "Todas as faces são pares". O complementar de "nenhum x é P" é "existe ao menos um x que é P" (negação do quantificador universal). A descrição atual é logicamente incorreta e pode induzir erro conceitual sobre complementar e quantificadores.

- **Tipo:** Bug matemático
- **Gravidade:** ALTA
- **Impacto:** Induz compreensão errada de complementar e quantificadores
- **Correção:** Trocar para `"Pelo menos uma face par"`
- **Precisa corrigir antes de novos elementos?** SIM

### 0.3 — BUG FUNCIONAL: Som inexistente na corrida de carrinhos

**Arquivo:** TwoDicesExperiment.tsx:1043

```ts
playSound('/sounds/click.mp3');
```

O arquivo `click.mp3` NÃO está entre os 6 sons permitidos em `/public/sounds/`. O CLAUDE.md especifica apenas: correct.mp3, incorrect.mp3, clear.mp3, challengeFinished.mp3, nextChallenge.mp3, gameFinished.mp3. Este som pode falhar silenciosamente ou gerar erro em console.

- **Tipo:** Bug funcional
- **Gravidade:** MÉDIA
- **Correção:** Substituir por `'/sounds/correct.mp3'` ou `'/sounds/nextChallenge.mp3'`
- **Precisa corrigir antes de novos elementos?** SIM

### 0.4 — BUG PEDAGÓGICO: Botões de navegação permitem pular cenas

**Arquivo:** TwoDicesPresentation.tsx:482-551

Os botões "bolinha verde" (voltar) e "bolinha laranja" (avançar) em posição fixa permitem navegar para QUALQUER cena sem ter completado a cena atual. O aluno pode pular da Cena 1 direto para a Cena 7 sem ter construído nenhum conceito. Isso destrói a progressão didática inteira (Brousseau: a fase de Ação precede obrigatoriamente a Formulação).

- **Tipo:** Bug pedagógico
- **Gravidade:** ALTA
- **Impacto:** Quebra total da progressão didática
- **Correção mínima:** Condicionar a bolinha laranja ao estado de conclusão da cena atual (mesma lógica já usada no botão do rodapé em TwoDicesPresentation.tsx:1112)
- **Precisa corrigir antes de novos elementos?** SIM

### 0.5 — BUG DE UX: Bolinha dev (vermelha) visível em produção

**Arquivo:** TwoDicesPresentation.tsx:1124-1154

O botão circular vermelho no rodapé (originalmente para verificação de fases em desenvolvimento) está visível para todos os usuários. Permite pular fases arbitrariamente, agravando o problema 0.4.

- **Tipo:** Bug de UX / consistência
- **Gravidade:** MÉDIA
- **Correção:** Condicionar renderização a `process.env.NODE_ENV === 'development'`
- **Precisa corrigir antes de novos elementos?** SIM

### 0.6 — BUG DE VALIDAÇÃO: Cena 3 não aceita frações equivalentes

**Arquivo:** TwoDicesPresentation.tsx:331-332

```ts
const numOk = num === 1;
const denOk = den === 6;
```

A validação de P(face i) na Cena 3 exige literalmente 1/6. Frações equivalentes como 2/12 ou 3/18 são rejeitadas. Embora num=1 e den=6 seja a forma canônica esperada, isso contradiz o princípio R14 e pode confundir um aluno que pense em equivalências.

- **Tipo:** Bug de validação / inconsistência com R14
- **Gravidade:** BAIXA (no contexto de 1 dado a resposta é quase sempre 1/6)
- **Correção:** Substituir por `num * 6 === den * 1`

### 0.7 — BUG DE RESPONSIVIDADE: Tabela 6×6 do jogo principal

**Arquivo:** TwoDicesTable.tsx:30-91

A tabela usa células de largura fixa 116px. Em 6 colunas + header: 116×6 + 50 = 746px mínimo. Em dispositivos < 768px a tabela exige scroll horizontal obrigatório. O container tem `overflow-auto` e `snap-both`, mas:
- Em mobile (320-375px), o aluno vê menos de 3 colunas por vez
- Os checkboxes ficam apertados dentro de 116px quando múltiplos eventos estão ativos
- Cells de 100px de altura são excessivamente altas em mobile

- **Tipo:** Bug de responsividade
- **Gravidade:** ALTA (mobile é plataforma primária em escola pública brasileira)
- **Correção:** Reduzir largura das células em breakpoints menores; usar min-width ao invés de width fixo

### 0.8 — BUG DE RESPONSIVIDADE: Corrida de carrinhos

**Arquivo:** TwoDicesExperiment.tsx:2800-2945

A pista da corrida renderiza 13 linhas (13 carrinhos), cada uma com 6 células + número + bandeira. Em mobile, os SVGs dos carrinhos (width=44) nas células de `flex: 1` comprimem excessivamente, tornando os números ilegíveis e os alvos de toque < 44px. Não há breakpoint adaptativo.

- **Tipo:** Bug de responsividade
- **Gravidade:** MÉDIA
- **Correção:** Aplicar `overflow-x: auto` no container da pista ou reduzir número de carrinhos visíveis com scroll vertical

### 0.9 — BUG DE CONSISTÊNCIA: DiceFaceIcon duplicada 4 vezes

Os componentes `DiceFaceIcon` e `PIP_PATTERNS` estão duplicados em:
1. TwoDicesPresentation.tsx:34-79
2. TwoDicesPractice.tsx (~787)
3. DiceMachineExperiment.tsx:68-128
4. TwoDicesExperiment.tsx:12-140

Cada versão tem pequenas diferenças (parâmetro `color`, `ariaHidden`, `boxShadow`). Risco de divergência visual e manutenção fragmentada.

- **Tipo:** Bug de consistência arquitetural
- **Gravidade:** MÉDIA
- **Correção:** Extrair para componente compartilhado único (não global — dentro de teaching/probability/two-dices/)

### 0.10 — BUG PEDAGÓGICO: Corrida revela a soma diretamente

**Arquivo:** TwoDicesExperiment.tsx:2958-2961

Na fase raceRunning, a soma dos dados é revelada ao aluno antes que ele a calcule. A instrução inicial diz "some os resultados", mas a soma já aparece pronta. Isso transforma o exercício de cálculo em mero clique mecânico. O aluno acerta sem compreender.

- **Tipo:** Bug pedagógico
- **Gravidade:** ALTA
- **Impacto:** Acerto mecânico sem compreensão; contradiz o design da Cena 6 onde o aluno calculava a soma
- **Correção:** Esconder `racePendingSum` até o aluno digitar/selecionar a soma correta. Só então revelar o carrinho a ser clicado.

### Tabela resumo de bugs

| # | Componente | Tipo | Gravidade | Corrigir antes? |
|---|-----------|------|-----------|-----------------|
| 0.1 | useTwoDicesHooks (verifyProbability*) | Matemático | CRÍTICA | SIM |
| 0.2 | useTwoDicesHooks (evento 12) | Matemático | ALTA | SIM |
| 0.3 | TwoDicesExperiment (click.mp3) | Funcional | MÉDIA | SIM |
| 0.4 | TwoDicesPresentation (nav balls) | Pedagógico | ALTA | SIM |
| 0.5 | TwoDicesPresentation (dev ball) | UX | MÉDIA | SIM |
| 0.6 | TwoDicesPresentation (Cena 3) | Validação | BAIXA | Não |
| 0.7 | TwoDicesTable | Responsividade | ALTA | SIM |
| 0.8 | TwoDicesExperiment (corrida) | Responsividade | MÉDIA | Não |
| 0.9 | DiceFaceIcon ×4 | Consistência | MÉDIA | Não |
| 0.10 | TwoDicesExperiment (race sum) | Pedagógico | ALTA | SIM |

---

## PARTE 1 — VARREDURA DIAGNÓSTICA DO OVA ATUAL

### Arquitetura geral

O OVA está organizado em duas grandes metades:

**Metade A — Apresentação guiada** (TwoDicesPresentation, 7 cenas):
Sequência linear obrigatória que constrói conceitos desde o dado físico até a distribuição de somas de dois dados. Totaliza ~11.000 linhas de código entre os componentes das 7 cenas.

**Metade B — Jogo de prática livre** (TwoDicesGame + useTwoDicesHooks):
Atividade aberta com 12 eventos, operações entre eventos (interseção, união, diferença, diferença reversa) e cálculo de probabilidades na tabela 6×6. Totaliza ~1.050 linhas.

### Cena 1 — O Dado
- **O que faz:** Apresenta o cubo, 6 faces, pintas 1-6, faces opostas somam 7
- **Conceito:** Objeto físico do experimento aleatório
- **Interação:** Nenhuma (leitura + dado 3D em idle)
- **Ponto forte:** Dado 3D interativo (Three.js) dá concretude
- **Limite:** Passiva demais; sem mediação entre o visual e o conceitual

### Cena 2 — Conhecendo cada face
- **O que faz:** Animação automática mostrando cada face sequencialmente
- **Conceito:** Enumeração dos resultados possíveis (pré-espaço amostral)
- **Interação:** Nenhuma (observação passiva)
- **Feedback:** Indicadores visuais de progresso (6 bolinhas)
- **Ponto forte:** Prepara a noção de "todos os resultados possíveis"
- **Limite:** O aluno não age — risco de atenção dispersa

### Cena 3 — Dado Equilibrado (Honesto) — INTERATIVA
- **O que faz:** 7 etapas progressivas: texto → S={1..6} → n(S)=6 → P(S)=1 → P(face i)=1/6 → generalização → fechamento com gráfico de barras
- **Conceito:** Espaço amostral, equiprobabilidade, P(face)=1/6, P(S)=1
- **Interação:** 6 inputs validados progressivamente
- **Feedback:** Erros com mensagens direcionadas por tipo de erro (numerador/denominador/porcentagem)
- **Ponto forte:** Progressão interativa sólida; feedback diferenciado por componente
- **Ponto frágil:** Validação de P(face i) não aceita frações equivalentes (Bug 0.6)

### Cena 4 — Dado Equilibrado × Dado Viciado
- **O que faz:** Comparação visual de barras; perguntas sobre equiprovabilidade; P(Ω)=1
- **Conceito:** Distinção equiprovável/não-equiprovável; axioma P(Ω)=1
- **Interação:** Radios + input numérico
- **Feedback:** Erro por pergunta, com randomização da ordem
- **Ponto forte:** Construção clara da diferença entre modelos; reforço de P(Ω)=1

### Cena 5 — Praticando com um dado (TwoDicesPractice)
- **O que faz:** 3 fases: Intro → Experimentação (2 rodadas com aposta) → Exercícios (4 exercícios com evento, aposta, lançamento, cálculo de P(A))
- **Conceito:** Evento, evento complementar, evento certo, evento impossível, P(A)=n(A)/n(Ω), P(A)+P(Ā)=1
- **Interação:** Aposta por clique no dado 3D; marcação de favoráveis; cálculo de fração; comparação P(A) vs P(Ā)
- **Feedback:** Altamente diferenciado: 3 variantes por caso degenerado (certo/impossível) × 3 apostas × exploração conceitual obrigatória
- **Ponto forte:** Excelente tratamento de casos degenerados; feedback adaptativo por aposta; validação R14 correta
- **Ponto frágil:** Extensão pode causar fadiga (2 rodadas + 4 exercícios completos); eventos aleatorizados podem gerar sequências repetitivas

### Cena 6 — Máquina de lançar dois dados (DiceMachineExperiment)
- **O que faz:** 3 lançamentos com escalada cognitiva: L1 (observar+registrar par), L2 (registrar+somar), L3 (prever+justificar)
- **Conceito:** Percepção do acaso bidimensional; par ordenado; soma; previsão metacognitiva
- **Interação:** FacePicker visual (popover com grid); input de soma; radio de justificativa
- **Feedback:** Adidático na L3 (não julga, questiona: "e se lançar mil vezes?")
- **Ponto forte:** Excelente design bruneriano (enactive→iconic→symbolic); justificativa metacognitiva externaliza vieses; ponte narrativa para Cena 7
- **Ponto frágil:** Máquina 3D pode ter carregamento lento em dispositivos fracos

### Cena 7 — Lançamento de dois dados (TwoDicesExperiment)
- **O que faz:** Sequência muito extensa com ~30 fases
- **Conceito:** Espaço amostral 6×6=36; par ordenado; soma; distribuição triangular; P(par)=1/36; P(soma); evento impossível; axioma da soma
- **Interação:** FacePicker, clique na tabela, inputs numéricos, seleção múltipla, corrida interativa
- **Ponto forte:** Arquitetura cognitiva sofisticada; ancoragem prospectiva via alienígena; visualização síncrona tabela×histograma
- **Ponto frágil:** Extensão (3.400 linhas, 30+ fases); Bug 0.10

### Jogo Principal (TwoDicesGame + useTwoDicesHooks)
- **O que faz:** 2 desafios simples (evento A → checkbox → P(A) e P(Ā)) + 5 desafios compostos (A, B → checkbox A e B → checkbox D=f(A,B) → select operação → P(D))
- **Conceito:** Interseção, união, diferença, diferença reversa entre eventos; cálculo de P(D)
- **Ponto forte:** 12 eventos variados; 4 operações; checkboxes por evento
- **Ponto frágil:** Bug 0.1 (validação flutuante); ausência de mediação conceitual antes do uso operacional; salto conceitual severo

---

## PARTE 2 — MAPEAMENTO TÉCNICO-PEDAGÓGICO

| Etapa | Componente | Objetivo Matemático | Tipo Interação | Mediação | Robustez | Risco superficial |
|-------|-----------|---------------------|----------------|----------|----------|-------------------|
| Cena 1 | TwoDicesPresentation | Objeto dado | Observação | Visual | Sólida | Baixo |
| Cena 2 | TwoDicesPresentation | Enumeração de faces | Observação | Animação | Média | Baixo |
| Cena 3 | TwoDicesPresentation | S, n(S), P(S), P(face) | Input validado | Progressiva | Alta | Baixo |
| Cena 4 | TwoDicesPresentation | Equi. vs não-equi., P(Ω)=1 | Radio + input | Comparativa | Alta | Baixo |
| Cena 5 | TwoDicesPractice | Evento, P(A), Ā, certo, impossível | Aposta+lançamento+cálculo | Exploratória | Muito alta | Baixo |
| Cena 6 | DiceMachineExperiment | Par ordenado, soma, previsão | FacePicker+soma+radio | Adidática | Muito alta | Baixo |
| Cena 7 (tree) | SampleSpaceTree | Ω = 6×6 = 36 | Seleção progressiva | Construtiva | Alta | Baixo |
| Cena 7 (rounds) | TwoDicesExperiment | Par na tabela, soma | Clique+picker+input | Guiada | Alta | Médio |
| Cena 7 (alien) | TwoDicesExperiment | Distribuição de somas | Select+multi-select | Metacognitiva | Alta | Médio |
| Cena 7 (prob) | TwoDicesExperiment | P(par)=1/36, P(soma) | Input de fração | Analítica | Alta | Médio |
| Cena 7 (corrida) | TwoDicesExperiment | Consolidação | Clique+dados 3D | Lúdica | Média (Bug 0.10) | Alto |
| Jogo (simples) | TwoDicesGame | Evento A, P(A), P(Ā) | Checkbox+fração | Nenhuma | Média | Médio |
| Jogo (composto) | TwoDicesGame | A∩B, A∪B, A−B | Checkbox+select+fração | Nenhuma | Fraca (Bug 0.1) | Alto |

---

## PARTE 3 — ANÁLISE DOS PRÉ-REQUISITOS EPISTEMOLÓGICOS

### 3.1 — Transição Cena 7 → Jogo: SALTO CONCEITUAL SEVERO

O Jogo pressupõe: conceito de evento como subconjunto, interseção, união, diferença, notação conjuntista.
A Cena 7 construiu: espaço amostral, par ordenado, distribuição de somas, P(par), P(soma), axioma.
FALTA: tudo sobre eventos compostos.

### 3.2 — Formalização prematura no Jogo: operação "select"

O símbolo ∩ aparece pela primeira vez num dropdown sem mediação prévia.

### 3.3 — Pré-requisitos sólidos dentro da Apresentação

As Cenas 1-7 apresentam progressão epistemológica exemplar. O problema é exclusivamente na ponte entre a Cena 7 e o Jogo.

---

## PARTE 4 — MAPA CIRÚRGICO DE INSERÇÕES

| # | Ponto exato | O que inserir | Tipo | Prioridade |
|---|------------|---------------|------|------------|
| I1 | Após raceFinished, antes do Jogo | Microetapa: "O que é um evento?" | Conceito + visualização | ESSENCIAL |
| I2 | Após I1 | Microetapa: interseção visual | Visualização + exercício guiado | ESSENCIAL |
| I3 | Após I2 | Microetapa: união visual + dupla contagem | Visualização + contagem | ESSENCIAL |
| I4 | Após I3 | Microetapa: diferença visual | Visualização | ESSENCIAL |
| I5 | Após I4 | Diagrama de Venn | Articulação de registros | RECOMENDÁVEL |
| I6 | Após I5 | Descoberta guiada da fórmula P(A∪B) | Exercício descoberto + institucionalização | ESSENCIAL |
| I7 | Após I6 | Exercício inverso (achar P(A∩B)) | Exercício interativo | RECOMENDÁVEL |
| I8 | No Jogo, ao primeiro desafio composto | Microexplicação contextual | Microtransição | RECOMENDÁVEL |

---

## PARTE 5 — LACUNAS CONCEITUAIS E DIDÁTICAS

5.1 — Conceito de evento como subconjunto: AUSENTE
5.2 — Interseção de eventos: AUSENTE
5.3 — União com percepção de sobreposição: AUSENTE
5.4 — Diferença A−B: AUSENTE
5.5 — Fórmula P(A∪B) = P(A)+P(B)−P(A∩B): AUSENTE
5.6 — Exercício inverso (achar P(A∩B)): AUSENTE

---

## PARTE 6 — VIESES COGNITIVOS

6.1 — Viés de equiprobabilidade nas somas: BEM TRATADO
6.2 — Confusão "ou" lógico vs coloquial: NÃO TRATADO
6.3 — Não percepção de sobreposição/dupla contagem: NÃO TRATADO
6.4 — Confusão evento vs resultado: PARCIALMENTE TRATADO
6.5 — Passagem inadequada exemplo→fórmula: NÃO TRATADO
6.6 — Uso mecânico sem compreensão: PARCIALMENTE TRATADO

---

## PARTE 7-9 — SEQUÊNCIA COMPLEMENTAR, EXERCÍCIOS, FÓRMULA

(Detalhados na análise completa de 2026-04-12)

---

## PARTE 10 — SÍNTESE EXECUTIVA

### A. Inserir obrigatoriamente
1-6. Correções de bugs 0.1-0.5, 0.10
7-8. Inserções I1-I4 e I6 (mediações visuais + fórmula)

### B. Desejável
9-12. I5 (Venn), I7 (exercício inverso), I8 (microexplicações), Bug 0.7

### C. Não vale a pena
Generalização 3+ eventos, axiomática Kolmogorov, dados não-equiprováveis extra, animação 3D extra

### D. Manter como está
Cenas 1-4, Cena 5 inteira, Cena 6 inteira, Cena 7 (SampleSpaceTree, intervalo pedagógico, alien, prob*)

### H. Sequência final enxuta
Cenas 1-7 (como estão) + Cena 7b [NOVA: 6-8 telas, ~5-7 min] + Jogo (corrigido)
