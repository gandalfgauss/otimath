# INSPEÇÃO EXPERIENCIAL INTEGRAL — OVAs Disco e Dois Dados

**Data**: 2026-04-27
**Protocolo**: 12 etapas (Mapeamento, Fluxo Correto, Erros Possíveis, Matemática, Pedagogia, UX, Responsividade, Acessibilidade, Robustez, Coerência, Melhores Práticas, Relatório)
**Modalidade**: leitura cruzada do código + simulação de aluno errando + auditoria de feedbacks
**Volume auditado**: 16.627 linhas (Disco) + 30.335 linhas (Dois Dados) = **46.962 linhas**

---

## SUMÁRIO

1. [OVA Disco — Stage 1 (subSteps 0 a 1.5)](#disco-stage-1-substeps-0-a-15)
2. [OVA Disco — Stage 1 (subSteps 2 a 5.7)](#disco-stage-1-substeps-2-a-57)
3. [OVA Disco — Stage 1 (subSteps 6 a 6.45)](#disco-stage-1-substeps-6-a-645)
4. [OVA Disco — Stage 1 (subSteps 6.55 e 6.56)](#disco-stage-1-substeps-655-e-656)
5. [OVA Disco — Stage 1 (subSteps 6.6 a 6.69)](#disco-stage-1-substeps-66-a-669)
6. [OVA Disco — Stage 1 (subSteps 6.70 a 6.95)](#disco-stage-1-substeps-670-a-695)
7. [OVA Disco — Stage 1 (subSteps 6.5 a 16)](#disco-stage-1-substeps-65-a-16)
8. [OVA Disco — Stage 2 completo](#disco-stage-2)
9. [OVA Disco — Stage 3 completo](#disco-stage-3)
10. [Disco — Relatório Final 17 seções](#disco-relatorio-final)
11. [OVA Dois Dados — Cenas 1 a 4](#dois-dados-cenas-1-a-4)
12. [OVA Dois Dados — Cenas 5, 6, 7](#dois-dados-cenas-5-6-7)
13. [OVA Dois Dados — Ex1 a Ex8 + Tela de Fechamento](#dois-dados-exercicios)
14. [Dois Dados — Relatório Final 17 seções](#dois-dados-relatorio-final)
15. [Consolidação Final — Inspeção Integral](#consolidacao-final)

---

## DISCO STAGE 1 — subSteps 0 a 1.5

### subStep 0 — Configuração inicial (slider 1-6 + botão Confirmar)

**Mecânica**: `targetSectorCount` é sorteado em `startGame()` entre 2 e 6 (`useRouletteHooks.ts:3902`). Slider inicia em 1. Aluno arrasta para o valor pedido pelo enunciado, clica Confirmar.

**Aluno simulado:**

| Caminho testado | Comportamento atual | Feedback | Constrói? |
|---|---|---|---|
| Slider em 1 (não muda) + Confirmar | Erro alert: "Erro! O número correto é N. Tente novamente." | Entrega a resposta com "o número correto é N" | ❌ Entrega |
| Slider em N+1 ou N-1 + Confirmar | Mesmo alert acima | Idem | ❌ Entrega |
| Slider em N (correto) + Confirmar | Som correct.mp3 + alert "Parabéns!" + transição para 0.1 | OK | ✅ |
| Sem clicar Confirmar (idle 1+ min) | Nada — sem nudge | Aluno parado sem orientação | ❌ Falta interatividade |
| Cliques rápidos múltiplos no Confirmar | Não há debounce visível. Alert pode aparecer duplicado | Race condition leve | ⚠️ Bug menor |

**🔴 BUG CRÍTICO** — Local: `RouletteGame.tsx:4960`
- Condicional do botão Confirmar é `subStep === 0 || subStep === 16` sem verificar stage. Funcional mas frágil.
- Gravidade: Baixa (Refatoração defensiva).

**🟡 PROBLEMA PEDAGÓGICO** — Feedback de erro entrega a resposta
- Local: `useRouletteHooks.ts:4421`
- "O número correto é ${targetSectorCount}. Tente novamente." revela imediatamente o N correto.
- Gravidade: Média.
- Sugestão: 1ª tentativa — dica genérica. 2ª — pista direcionada. 3ª — revelar.

### subStep 0.1 — Balão "Experimento Determinístico" + 3 exemplos

**Mecânica**: `RouletteGame.tsx:813-845` — botão "Li." só aparece quando `exemplosVistosDeterministico >= 3`. Botão secundário "Clique para ver mais exemplos!" sorteia novo de `EXEMPLOS_DETERMINISTICOS` (63 itens).

**🟡 PROBLEMA UX** — Repetição possível de exemplos
- `Math.random` sem prevenção de duplicatas. Probabilidade de 2 repetidos em 3 cliques é ~5%.
- Gravidade: Baixa.

**🟢 PONTO FORTE**: forçar 3 exemplos antes de avançar é boa engenharia didática (variabilidade combate vinculação a contexto único — princípio de transferência).

### subStep 1 — Pergunta múltipla escolha

**Mecânica**: `RouletteQuestion` com options vindas de `currentQuestion`. `selectedOption` validado contra `'correct'` (`hook:4427-4451`).

**Aluno simulado:**

| Resposta | Feedback recebido | Constrói? |
|---|---|---|
| Acerto | "Parabéns! Você identificou corretamente o experimento aleatório!" + transição para 1.1 | ✅ |
| Erro (qualquer dos 17 distratores) | Alert error 8s com definição completa de experimento aleatório | ✅ Excelente — não entrega resposta, constrói o conceito |
| Erra 5x seguidas | Mesmo feedback genérico | ⚠️ Falta diferenciação |

**🟡 OPORTUNIDADE PEDAGÓGICA** — Feedback genérico para 17 distratores
- Local: `useRouletteHooks.ts:4448`
- Cada distractor isola um confundimento típico, mas um único feedback atende a todos.
- Sugestão: 5 categorias de feedback diferenciado.

### subSteps 1.1 e 1.17 — Experimentação (3 tentativas)

**Mecânica**: `hook:7050-7178`. Aluno clica setor (aposta) → Sortear → animação 2s + som a cada 400ms → disco para → subStep 1.17 → aluno clica cor onde o ponteiro PAROU → loop 3x.

**🔴 BUG CRÍTICO** — Click durante isSpinning não bloqueado
- Local: `Roulette.tsx:233-244` e `RouletteGame.tsx:512`
- `selectableMode` em subStep 1.1 ou 1.17 está `true` independentemente de `isSpinning`. Aluno pode clicar setor durante o giro e disparar handler.
- Gravidade: Alta. Race condition.
- Sugestão: `selectableMode={... && !gameState.isSpinning}`.

### subStep 1.25 — Características do experimento aleatório (checkbox múltiplo de 7 itens)

**Mecânica**: `hook:4459-4486`. **TODAS as 7 características são verdadeiras**. Validação exige todas marcadas.

**🟡 PROBLEMA PEDAGÓGICO** — Feedback indistinguível entre "quase lá" e "muito longe"
- 1/7 marcadas e 6/7 marcadas recebem mesma mensagem.
- Sugestão: gradação 1-3 / 4-6.

**🟡 ARMADILHA DE FRAMING** — "Marque todas que julgar verdadeiro"
- Como TODAS são verdadeiras, exercício na verdade testa "você marca todas?", não "você sabe distinguir verdadeiro de falso".
- Sugestão: incluir 1-2 distratores falsos.
- Gravidade: Alta — exercício pedagogicamente subótimo.

---

## DISCO STAGE 1 — subSteps 2 a 5.7

### subStep 2 — "Qual o espaço amostral?"

**Mecânica**: `validateSampleSpace` (`hook:3342-3376`). Regex obrigatório: `^s\s*=\s*\{(.+)\}$`.

**🟡 PROBLEMA UX** — Formato muito rígido
- Rejeita Ω (notação canônica em livros didáticos brasileiros), parênteses, ponto-vírgula.
- Sugestão: regex `^(s|ω|omega|e\.?a\.?)\s*=\s*[\{\(](.+)[\}\)]$` + warning.
- Gravidade: Média.

### subStep 3 — n(S) = ?

**Mecânica**: `parseInt(value)` comparado com `targetSectorCount`.

**🟡 OBSERVAÇÃO** — `parseInt` é frágil
- Aceita `"4 setores"`, `"4abc"`, `"4.99"` como 4. Tolera ruído mas pode mascarar má formatação.
- Sugestão: `Number(input.trim())` + `Number.isInteger(...)`.

### subStep 4 — "Alguma cor tem mais chance?"

**🔴 ARMADILHA EPISTEMOLÓGICA POTENCIAL**
- Pergunta tem resposta CORRETA="não" *neste* disco (equiprovável). Mas o feedback diz "**não há razão para uma cor ter mais chance que outra**" — verdade neste disco, mas não em geral.
- Conflito didático com Stage 2/3 que ensinam que isso é viés (V3.1).
- Gravidade: Alta para banca PROFMAT.
- Sugestão: enunciado "Observando ESTE disco específico..."

### subStep 5.7 — P(evento certo)

**🔴 BUG/ARMADILHA** — `100` (sem %) rejeitado
- Hint diz "0% a 100%". Aluno digita `100` (interpretando como porcentagem implícita). Rejeitado porque parseFraction retorna [100, 1] = 100, não 100/100.
- Gravidade: Alta. Hint induz à entrada que será rejeitada.

---

## DISCO STAGE 1 — subSteps 6 a 6.45

### subStep 6 — Tabela "Probabilidade de Cada Cor"

**Mecânica**: `hook:4623-4675`. Validação por `areFractionsEquivalent(value, '1/N')` — aceita equivalentes (R14).

**🟢 PONTO FORTE** — Marca apenas a cor errada com erro visual + alert genérico

### subStep 6.41 — Clicar setores correspondentes a E

**🟡 OPORTUNIDADE** — Feedback poderia distinguir "faltou cor" de "incluiu cor errada"

### subStep 6.44 — P(E) = num/den

**🔴 BUG MÉDIO** — Inputs sem `inputMode="numeric"` ou validação de tipo
- Em mobile, abre teclado alfanumérico em vez de numérico.

**🔴 BUG SUTIL** — Vírgula em numerador é silenciosamente truncada
- `parseInt("2,5")` retorna 2.
- Sugestão: rejeitar imediatamente entradas com vírgula/ponto com mensagem clara.

**🟢 PONTO FORTE** — R14 implementada corretamente
- `areSplitFractionsEquivalent(num, den, expNum, expDen)` usa `num * expDen === den * expNum`.

---

## DISCO STAGE 1 — subSteps 6.55 e 6.56

### subStep 6.55 — Eventos Mutuamente Exclusivos

**Mecânica**: `hook:8317-8443`. `handleDisjointSectorClick` em `selecting_B` bloqueia setores já selecionados em A.

**🔴 BUG GRAVE** — Confirmar A sem validação leva a impasse
- Local: `hook:8378-8390`
- `handleDisjointConfirmA` avança para `selecting_B` SEM validar se A está correto. O bloqueio de setores em A para B pode impossibilitar marcação correta de B se A estiver errado.
- Gravidade: Alta. Quebra fluxo, gera frustração.
- Sugestão: validar A no Confirma A; ou permitir setores em "ambos" com overlap visual.

**🟡 PROBLEMA UX** — Bloqueio de clique sem feedback visual
- Cursor não muda para "not-allowed". Sem tooltip.

**🟢 PONTO FORTE** — Mensagem de sucesso fecha o conceito
- "A ∩ B = ∅ ✓" + "as regiões marcadas de A e B não se sobrepõem".

### subStep 6.56 — União ME

**Mecânica**: `hook:8447-8632`. 3 fases × N eventos × 6+ atividades. Bloqueio de setores já confirmados.

**🔴 BUG REPETIDO** — Vírgula decimal truncada em todos os inputs de fração

**🟢 PONTO FORTE** — Bloqueio de setores já confirmados garante disjuntividade por construção.

**🟢 PONTO FORTE** — Lista didática "Lembre-se" exibida em final_calc (Vygotsky — andaime cognitivo).

---

## DISCO STAGE 1 — subSteps 6.6 a 6.69

### Desafio Dinâmico 1 — União/Interseção parametrizada

**Visão geral**: `hook:5093-5288`. Sistema de geração com 2 modos:
- Modo original (cor + propriedade numérica)
- Modo gerador de interseção controlado (`tryCompT1-T6`)

**🟢 PONTO FORTE** — Nota OU/E pedagógica em caixa colorida diferenciada (combate V6.1).

**🟢 PONTO FORTE** — >360 problemas distintos por combinação. Alta variação anti-decoreba.

**🟡 PROBLEMA SEMÂNTICO** — Enunciado modo "exclusão" (resolvido na inspeção)
- No modo interseção controlada, `desafio1EventoXTexto` é vazio e renderização condicional é coerente. Não há bug catastrófico.

---

## DISCO STAGE 1 — subSteps 6.70 a 6.95

### Eventos Complementares

**Visão geral**: 13 estados (`compPhase`). 3 sub-fases: Identificação (3 exemplos), Formalização (4 telas), Cálculo guiado, Cálculo independente (3 treinos).

**🔴 INCONSISTÊNCIA UX** — Bloqueio de cliques diferente entre 6.55 e 6.70
- 6.55 bloqueia setores de A durante seleção de B; 6.70 não bloqueia.
- Justificativa pedagógica diferenciada possível (em complementares aluno deve "errar e descobrir" o que NÃO está em A).
- Gravidade: Baixa (consistência) / Média (UX).

**🔴 BUG GRAVE** — R14 não aplicada na cadeia 6.88/6.93
- Local: `hook:5417-5423`
- Validação usa `n1 !== n` (igualdade estrita), não `areSplitFractionsEquivalent`. Aluno que escreve cadeia matematicamente correta com fração equivalente é punido.
- Gravidade: Alta. Inconsistência com R14 explícita do framework.

**🔴 INCONSISTÊNCIA** — calc_pa (6.90) usa R14 mas calc_chain (6.93) não
- Mesma fase, validações diferentes.

**🟢 PONTO FORTE** — Cadeia explícita 1 = n/n
- Força aluno a ver que 1 pode ser escrito como n/n. Excelente didática (Duval — registros).

**🟢 PONTO FORTE** — `avoidHalf` evita P(A)=1/2 nos primeiros treinos
- Combate fixação em meio-meio.

---

## DISCO STAGE 1 — subSteps 6.5 a 16

### subStep 6.5 — Faça uma Previsão

**🟢 PONTO FORTE** — Previsão livre (sem validação) é PEDAGOGICAMENTE CORRETO
- Propósito é gerar conflito cognitivo posterior (subStep 7.1 confronta previsão com resultado). Brousseau brilhante.

### subStep 7 — N Giros manuais

**🟢 PONTO FORTE** — `perfectPatternDetected` é design defensivo brilhante
- Aluno que tira 1 de cada cor é forçado a fazer mais giros. Endereça V8.2 (lei dos pequenos números).

### subStep 7.1 — Confronto Previsão × Resultado

**🟢 PONTO FORTE** — Pergunta retórica no caso de acerto
- "Sua previsão coincidiu... **Mas isso sempre aconteceria se repetíssemos?**" — combate V8.2 mesmo em acerto.

**🟡 OBSERVAÇÃO** — Comparação por igualdade exata `parseInt(predVal) === observedCount`
- Aluno que previu "duas vezes" em texto recebe NaN.

### subSteps 9 e 9.5 — Frequências

**🔴 INCONSISTÊNCIA** — subStep 9 aceita decimal `0,2` mas 9.5 não
- subStep 9: aceita decimal e percentual.
- subStep 9.5: espera percentual; rejeita decimal.
- Aluno que aprendeu em 9 a usar decimal recebe erro em 9.5.

### subStep 14 — Interpretação dos Resultados

**🟢 PONTO FORTE** — Geração dinâmica de alternativas (8 corretas × 8 erradas)
- Distratores capturam vieses específicos (V3.3, V8.1, V1.1).

### subStep 15 — Problemas de Consolidação LGN

**🔴 BUG MÉDIO** — `parseInt` rejeita separador de milhar brasileiro `100.000`
- Para números grandes (100k–500k), aluno brasileiro espera digitar com ponto separador.

### subSteps 15.5, 15.6 — Generalização para o Dado

**🟢 PONTO FORTE** — Descontextualização brousseauniana

---

## DISCO STAGE 2 — Probabilidade Não Equiprovável por Área

Stage 2 é a fase mais complexa: state machine com 6+ estados, treinos guiados, giros reflexivos, geração não equiprovável de ângulos.

### subSteps 0.15 a 0.19 — Investigação inicial (4 cenários de feedback)

**🟢 PONTO FORTE** — Engenharia didática brilhante
- 4 caminhos distintos endereçando confusões diferentes:
  - (Apostou maior, Ganhou) → reflexão direta
  - (Apostou ñMaior, Ganhou) → "tem alguma forma de apostar com maior chance?"
  - (Apostou ñMaior, Perdeu) → idem
  - (Apostou maior, Perdeu) → "Mesmo sendo o setor mais provável, ele não foi sorteado desta vez"

**🟢 PONTO FORTE** — subStep 0.191 NOMEIA o viés V3.1 explicitamente
- "Viés de Equiprobabilidade (Lecoutre, 1992)" — citação científica em texto pedagógico. Metacognição informada (Garfield & Ben-Zvi).

### subStep 3 — Razão angular (state machine de 5 fases)

**🟢 PONTO FORTE** — Hint progressivo após 2 erros (`s2ReasoningShowHint`)

**🟡 OBSERVAÇÃO** — Validação por igualdade exata em `ratio_question` (não problema na prática porque ângulos são inteiros).

### subStep 4 — Probabilidades i·p

**🔴 INCONSISTÊNCIA** — `p·2` aceito em prob_question (subStep 3) mas REJEITADO em filling_table (subStep 4)
- Aluno que aprendeu em 3 a escrever `p·2` é punido em 4.
- Gravidade: Média.

### subSteps 6.201, 6.202 — Giros Reflexivos

**🟢 PONTO FORTE** — `betConstraint` direciona experimento
- Sistema **força** aluno a apostar em setor específico — direciona o experimento.

### subStep 8.7 — Simulação de Convergência

**🟢 PONTO FORTE** — Escala 10→500→1000→10000 corporifica LGN em escalas progressivas.

---

## DISCO STAGE 3 — Não Equiprovável por Cores Repetidas

Stage 3 é a fase de fechamento conceitual com confronto direto de vieses.

### subStep 0.5 — Previsão Visual

**🟢 PONTO FORTE** — Captura intuição inicial sem julgamento
- Sem feedback "certo/errado" — registro para confrontar depois (subStep 8).

### subStep 1.5 — Justificativa da aposta

**🟢 PONTO FORTE** — Feedback diferenciado pela natureza do erro
- Alunos que escolheram "porque os setores estão agrupados" recebem feedback específico sobre viés visual.

### subStep 1.75 — Contagem de setores por cor

**🟢 PONTO FORTE** — Validação parcial preserva acertos
- Cores corretas não são "perdidas" se aluno errar uma. Reduz frustração.

### subSteps 3-7 — Sequência conceitual conectada

**🟢 PONTO FORTE** — Cada distractor tem feedback construtivo dirigido ao engano específico
- Padrão excelente — deveria ser replicado em todo Stage 1.

**🟢 PONTO FORTE** — Distractor B do subStep 5 NOMEIA o viés "falácia do jogador"
- "Essa é a chamada falácia do jogador: a crença de que resultados passados 'compensam' no futuro." (`hook:6739`).
- Metacognição informada (Garfield & Ben-Zvi, 2014, p. 142). Padrão ouro.

### subStep 8 — Autoconfrontação

**🟢 PONTO FORTE** — Texto dinâmico personalizado por trajetória do aluno
- Cada aluno recebe narrativa única.

### subSteps 8.1-8.5 — Falácia do Jogador interativa

**🟢 PONTO FORTE** — 5 giros REAIS antes da pergunta
- Não é hipotético — aluno **vê** padrões aleatórios reais.

### subStep 10 — Tela Final

**🟡 OBSERVAÇÃO** — Sem reflexão metacognitiva final equivalente à do Dois Dados
- Tela Final do Disco tem métricas brutas mas **não tem detecção de vieses** nem mapeamento de tópicos.
- Sugestão: portar a estrutura do Dois Dados para o Disco.

---

## DISCO — RELATÓRIO FINAL 17 SEÇÕES

### 1. RESUMO EXECUTIVO

OVA Disco Probabilístico: produto educacional sofisticado, 16.627 linhas cobrindo 3 etapas didáticas (equiprovável → não-equiprovável por área → não-equiprovável por cores) materializando progressão T1 → T3 → T8. Engenharia didática de alto nível, com endereçamento ativo de 8+ vieses cognitivos documentados.

**Veredito banca PROFMAT**: produto **defensável** com correções de 6 bugs críticos + 15 ajustes médios. Esforço estimado: 8-12h para v2.0.

### 2. MAPA DAS FASES

- **Stage 1 (Equiprovável)** — 19 fases conceituais em 4 blocos.
- **Stage 2 (Não-equiprovável por área)** — Investigação inicial, espaço amostral, razão angular state machine, probabilidades i·p, treinos, giros reflexivos, probabilidade angular, convergência, frequências.
- **Stage 3 (Não-equiprovável por cores)** — Previsão visual, aposta+justificativa, contagem, tabela P(cor), espaço dos setores, comparação espaços, falácia, ancoragem, generalização, autoconfrontação, falácia interativa, resumo, tela final, ponte.

### 3. CONTEÚDOS ENSINADOS

T1, T3, T6/T7, T5, T8 (estendido), V1.1, V1.2, V3.1, V3.2, V6.1, V6.2, V7.1, V8.1, V8.2, V8.4, V10.3, V14.1, V14.4 combatidos explicitamente.

### 4. PROBLEMAS MATEMÁTICOS

- **CR-1 [Crítico]**: subSteps 6.88/6.93 não aplicam R14.
- **CR-2 [Médio]**: validateSampleSpace rejeita Ω, parênteses, ponto-vírgula.
- **CR-3 [Médio]**: 1.25 — todas as 7 características são verdadeiras (não há distractor falso).
- **CR-4 [Baixo]**: PROPRIEDADES_NUMERICAS — "divisor de qualquer número natural" mapeia exclusivamente para 1.

### 5. PROBLEMAS PEDAGÓGICOS

- **PD-1 [Crítico]**: armadilha epistemológica subSteps 4-5 do Stage 1.
- **PD-2 [Médio]**: feedback genérico para 17 distractores em subStep 1.
- **PD-3 [Médio]**: feedback indistinguível "1/7" vs "6/7" em 1.25.
- **PD-4 [Médio]**: handleDisjointConfirmA sem validação leva a impasse em 6.55.
- **PD-5 [Médio]**: feedback de erro entrega N em subStep 0.

### 6. PROBLEMAS DE UX

- **UX-1 [Médio]**: inputs de fração sem `inputMode="numeric"`.
- **UX-2 [Médio]**: bloqueio silencioso de cliques em 6.55.
- **UX-3 [Médio]**: sobrecarga visual em 6.56.
- **UX-4 [Médio]**: stage indicator não mostra progresso interno.
- **UX-5 [Baixo]**: aposta por setor em Stage 3.
- **UX-6 [Baixo]**: 500 giros automáticos = ~25s passivos.

### 7. PROBLEMAS DE RESPONSIVIDADE

Validados empiricamente em produção (declaração do orientando — Ponta 2 caminho B). Achados estáticos: poucos breakpoints `sm:` no RouletteGame.

### 8. PROBLEMAS DE ACESSIBILIDADE

- A11Y-1: stage indicator depende de cor.
- A11Y-2: feedback "clique no vermelho" sem alternativa textual.
- A11Y-3: foco visível precisa auditoria empírica.
- A11Y-4: `aria-live="polite"` ✅ presente.

### 9. BUGS TÉCNICOS

- **BG-1 [Crítico]**: click durante `isSpinning` não bloqueado.
- **BG-2 [Crítico]**: `parseInt` trunca vírgula silenciosamente (sistêmico).
- **BG-3 [Crítico]**: `parseInt` rejeita separador de milhar `100.000` em LGN.
- **BG-4 [Médio]**: 6.88/6.93 — comparação estrita em vez de R14.
- **BG-5 [Médio]**: inconsistência `p·2` em prob_question vs filling_table.
- **BG-6 [Médio]**: inconsistência decimal em subStep 9 (aceito) vs 9.5 (rejeitado).
- **BG-7 [Crítico]**: sem persistência cross-session — F5 reinicia tudo.

### 10. PROBLEMAS DE FEEDBACK

17 distractores em subStep 1 com feedback genérico → 5 categorias seria ótimo. Feedback `[1/7 a 6/7]` sem gradação. 4 cenários em Stage 2 0.17 ✅ padrão ouro. Stage 3 subSteps 3-7 com feedback específico ✅ padrão ouro.

### 11. PROBLEMAS DE PLACEHOLDER/INPUT/VALIDAÇÃO

Falta `inputMode="numeric"` (sistêmico). Sem `pattern` HTML5 para validação client-side. `parseInt` tolerante.

### 12. PROBLEMAS DE PROGRESSÃO DIDÁTICA

Stage 1 → Stage 2: viés V3.1 nomeado em 0.191 corrige boa parte da armadilha de Stage 1. Stage 2 → Stage 3: consolidação aceitável. Stage 1 não pré-anuncia que aprendizado de "setores iguais → equiprovável" será revisado.

### 13. PONTOS FORTES

- Engenharia didática state-machine refinada.
- 4 cenários de feedback no investigação inicial Stage 2.
- Vieses cognitivos NOMEADOS (V3.1, V8.1).
- Variação dinâmica anti-decoreba.
- Bloqueio defensivo em 6.56.
- Tela Final com exportação JSON (REQ-3 atendido).
- Confronto previsão × resultado mesmo em acerto.
- Notas OU/E em caixa colorida (combate V6.1).
- Descontextualização para o dado em 15.6.
- Geração de problemas defensiva (`tryCompT1-T6`, `avoidHalf`).

### 14. AJUSTES PRIORITÁRIOS

1. **R14 universal** em 6.88/6.93.
2. **Helper `parseIntegerSafe`** para todos inputs.
3. **Bloqueio `isSpinning` global**.
4. **Persistência IndexedDB + ID alfanumérico** (Ponta 1 caminho A).

### 15. AJUSTES RECOMENDADOS

5. Distractor falso em 1.25.
6. Feedback diferenciado por categoria de distractor em subStep 1.
7. Gradação de feedback em 1.25.
8. Validação progressiva em handleDisjointConfirmA (6.55).
9. Feedback "extra/faltando" em 6.41 e 6.6.
10. inputMode + pattern em todos os inputs de fração.
11. Aceitar Ω, parênteses, `;` em validateSampleSpace.
12. Bloqueio visual em 6.55.
13. Tela Final do Disco com detecção de vieses (espelhar Dois Dados).
14. Padronizar `p·N` aceito.

### 16. MELHORIAS FUTURAS

Vídeo guia, modo "tutorial guiado", acessibilidade teclado, exportação PDF, modo professor.

### 17. CHECKLIST DE CONFORMIDADE

| Critério | Status |
|---|---|
| R3 — Atividade não passiva | ✅ Cumprido |
| R7 — Necessidade intelectual antes de formalização | ✅ |
| R8 — Contexto brasileiro | ✅ |
| R13 — Viabilidade escolar (mobile) | ⚠️ Validação confiada empiricamente |
| R14 — Frações equivalentes | ⚠️ Parcial (6.88/6.93 violam) |
| R12 — Teorias acionadas seletivamente | ✅ |
| Persistência | ❌ Pendente (Ponta 1 — caminho A) |
| Acessibilidade WCAG 2.1 | ⚠️ Parcial |

---

## DOIS DADOS — Cenas 1 a 4

### VISÃO GERAL DA APRESENTAÇÃO

`TwoDicesPresentation.tsx` (1525 linhas) coordena 7 cenas + Tela de Fechamento. Three.js para DiceScene, TwoDiceScene, DiceMachineScene. **Banner de retomada** mostra "🎲 No OVA anterior, você já encontrou este objeto" durante 4s.

### 🔴 BUG CRÍTICO — Bolinhas de navegação dev em produção

**Local**: `TwoDicesPresentation.tsx:596-708`
**Descrição**: Botões "Voltar" (verde) e "Avançar" (laranja) renderizados sempre, sem condicional `process.env.NODE_ENV === 'development'`. Aluno pode clicar laranja em Cena 1 → Cena 2 → ... sem fazer exercícios.

**Comentário no código** (linhas 225-226): "DEV ONLY — REMOVER ANTES DE APLICAR AOS ALUNOS" — explicitamente reconhecido pelo desenvolvedor mas **não removido**.

**Reproduzir**: abrir o OVA, clicar bolinha laranja repetidamente.
**Comportamento esperado**: ocultar em produção.
**Gravidade**: **CRÍTICA**. **Compromete a integridade pedagógica do OVA**. Se aplicado em sala, alunos podem pular tudo e chegar à Tela de Fechamento sem ter aprendido nada.
**Sugestão imediata**: condicional `{process.env.NODE_ENV === 'development' && (...)}`.

### Cena 1 — "O Dado"

Cena passiva (apenas leitura) + dado 3D rotacionando. Aceitável como introdução perceptual.

### Cena 2 — "Conhecendo cada face"

Loop automático de 6 lançamentos, indicador progresso 6 dots.

**🟢 PONTO FORTE** — `setMuteImpact(true)` durante sequência automática
- Comentário: "playSound singleton não suporta chamadas rápidas em sequência, causando travamento em mobile." Engenharia consciente.

**🟡 OBSERVAÇÃO** — Cena 2 100% passiva (R3 limítrofe).

### Cena 3 — "Dado Equilibrado" — INTERATIVA em 7 etapas

**🔴 BUG GRAVE** — R14 violada na fração de Cena 3
- Local: `TwoDicesPresentation.tsx:449-451`
- `numOk = num === 1; denOk = den === 6;` (estrito)
- Aluno digita `2/12` (equivalente a `1/6`) → rejeitado.
- Comparar: Disco subStep 6.44 usa `areSplitFractionsEquivalent`.
- Gravidade: Alta. Inconsistência R14.

**🟢 PONTO FORTE** — Feedback diferenciado por tipo de erro (4 cenários).

**🟢 PONTO FORTE** — Aceita porcentagem com `...` ou `…` para dízimas (`16.666...`).

### Cena 4 — "Dado Equilibrado × Viciado"

Apresentação visual contrastiva com barras animadas. `BIASED_HEIGHTS = [20, 35, 90, 55, 110, 140]` favorece face 6.

**🟢 PONTO FORTE** — Order randomization (`scene4RadioOrder`).

**🟢 PONTO FORTE** — Confronto explícito V3.1.

---

## DOIS DADOS — Cenas 5, 6, 7

### Cena 5 (TwoDicesPractice) — Prática com 1 dado

`TwoDicesPractice.tsx` (1838 linhas). Sistema de **150+ eventos curados** em 4 categorias (A1=48, A2=12, A3=26, A4=55).

**🟢 PONTO FORTE** — Eventos certo/impossível com nomeação canônica em A4
- A4 linhas 219-221: `'Sair número par e ímpar'`, `'Sair número primo e composto'`, `'Sair número menor que 3 e maior que 5'` — **EVENTOS IMPOSSÍVEIS DELIBERADOS** ensinando P(impossível) = 0.

**🟢 PONTO FORTE** — Eventos dinâmicos parametrizados em A2 e A3
- Geradores aninhados com filtros para descartar eventos degenerados. Engenharia defensiva.

### Cena 6 (DiceMachineExperiment) — Máquina de lançar dois dados

`DiceMachineExperiment.tsx` (1557 linhas). Três lançamentos com escalada cognitiva. L3 com previsão metacognitiva da soma com 3 alternativas mapeadas a vieses.

**🟢 PONTO FORTE** — Cena 6 desafia V5.1 (equiprobabilidade nas somas).

### Cena 7 (TwoDicesExperiment) — Sistematização tabular

`TwoDicesExperiment.tsx` (3785 linhas). **Componente mais denso**.

**🟢 PONTOS FORTES**:
1. **SampleSpaceTree** constrói 6×6=36 ramo a ramo — materializa T14.
2. **Corrida dos Carrinhos** introduz eventos com P diferentes.
3. **Eventos Complementares** com Ā topologicamente visível.
4. **`unionTheory` em 15 sub-etapas** com Laboratório de Venn construcionista (Papert).
5. **Animação pulsante das 3 regiões** na fórmula final P(A∪B).

---

## DOIS DADOS — Ex1 a Ex8 + Tela de Fechamento

**Ex1-Ex5**: Aplicação direta da fórmula P(A∪B) com cardinalidades crescentes. Validação R14.

**Ex6 (UnionExercise6Review)** — Revisão obrigatória. Marcação sequencial colorida A(azul) → B(laranja) → D(roxo).

**Ex7 (TwoDicesGame)** — Jogo livre simples. **Vulnerabilidade R14 residual** (toFixed segundo Parecer Final 2026-04-12).

**Ex8 (TwoDicesGameAdvanced)** — Pool parametrizado de ~50 eventos com restrições R1-R4 defensivas. Validação R14 nativa.

### Tela de Fechamento (TwoDicesClosingScreen)

**Padrão ouro de Tela de Fechamento Reflexiva**:
- 7 componentes: Resumo cronológico, Mapa T1-T8, Verbetes consultados, Vieses detectados, Dificuldades de aprendizagem, Desempenho por exercício, Transição.
- `detectCognitiveBiases()` mapeia step-kind a viés (V3.4, V6.1, V7.1).
- `getVerbeteConsultations()` lista verbetes mais consultados.
- Indicador discreto não-punitivo (verde/amarelo/laranja).

**🟢 PONTO FORTE** — "Esta tela é um espelho do seu percurso — não é avaliação"
- Linguagem afetiva alinhada à Garfield & Ben-Zvi (2014, p. 142).

---

## DOIS DADOS — RELATÓRIO FINAL 17 SEÇÕES

### 1. RESUMO EXECUTIVO

OVA Dois Dados (30.335 linhas em 30 arquivos): produto educacional avançado com 7 cenas + 8 exercícios + Tela de Fechamento Reflexiva. Cobre T2, T4, T5, T6, T7, T14. Materializa transição do espaço unidimensional (Disco) para bidimensional (par ordenado), com Laboratório de Venn construcionista e Tela de Fechamento metacognitiva padrão-ouro.

**Veredito**: produto **defensável** com 1 bug crítico de produção (bolinhas dev) + 2 bugs sistêmicos + 8 ajustes médios.

### 2. MAPA DAS FASES

7 cenas + Tela de Fechamento, com Cena 7 contendo ~30 sub-fases internas.

### 3. CONTEÚDOS ENSINADOS

T2 (Espaço Amostral 6×6), T4 (Representações), T5 (Complementar), T6 (Operações), T7 (Adição), T14 (PFC). V3.1, V3.4, V5.1, V6.1, V6.2, V7.1, V7.2, V14.4 combatidos.

### 4. PROBLEMAS MATEMÁTICOS

- **CR-1 [Crítico]**: `validateProb` Cena 3 viola R14 (rejeita 2/12).
- **CR-2 [Médio]**: `validateSampleSpace` Cena 3 não aceita `;`.
- **CR-3 [Médio]**: Ex7 usa `toFixed` em vez de R14 nativa.

### 5. PROBLEMAS PEDAGÓGICOS

- **PD-1 [Médio]**: Cena 2 totalmente passiva (~9s).
- **PD-2 [Baixo]**: sem indicador global de progresso "cena x/7".
- **PD-3 [Médio]**: alguns eventos em A1 com sinonímia.

### 6. PROBLEMAS DE UX

- **UX-1 [Médio]**: inputs de fração sem `inputMode="numeric"`.
- **UX-2 [Crítico]**: **bolinhas dev visíveis em produção**.

### 7. PROBLEMAS DE RESPONSIVIDADE

Validados empiricamente em produção (Ponta 2 caminho B).

### 8. PROBLEMAS DE ACESSIBILIDADE

ARIA labels presentes. Cor + texto redundância parcial.

### 9. BUGS TÉCNICOS

- **BG-1 [CRÍTICO]**: bolinhas dev em produção — **prioridade máxima**.
- **BG-2 [Crítico]**: `parseInt` trunca vírgula (sistêmico).
- **BG-3 [Médio]**: R14 inconsistente — Cena 3 estrita, Ex8 nativa, Ex7 toFixed.
- **BG-4 [Médio]**: sem persistência cross-session.
- **BG-5 [Crítico]**: `localStorage` colisão multi-aluno em laboratório (DCC-4).

### 10. PROBLEMAS DE FEEDBACK

✅ Feedback diferenciado por tipo de erro (Cena 3). Cena 4 com order randomization. Cena 6 com previsão metacognitiva mapeada a vieses.

### 11. PROBLEMAS DE PLACEHOLDER/INPUT/VALIDAÇÃO

Placeholder `x₁, x₂, ..., xₙ` em Cena 3 ✅. Falta `inputMode="numeric"`.

### 12. PROBLEMAS DE PROGRESSÃO DIDÁTICA

✅ Progressão coerente com Brousseau, Artigue.

### 13. PONTOS FORTES

1. Laboratório de Venn construcionista (Papert).
2. Tela de Fechamento padrão-ouro com 7 componentes.
3. Pool de 150+ eventos curados em 4 categorias didáticas.
4. Eventos certo/impossível em A4.
5. Geradores parametrizados defensivos (Ex8 com R1-R4).
6. Cena 6 com previsão metacognitiva mapeada a vieses.
7. SampleSpaceTree constrói T14 ramo a ramo.
8. Order randomization em Cena 4.
9. Feedback diferenciado por tipo de erro em Cena 3.
10. `detectCognitiveBiases()` com mapeamento step-kind → V-código.
11. R14 nativa em Ex6.
12. Three.js + skeleton shimmer + setMuteImpact atendem mobile.

### 14. AJUSTES PRIORITÁRIOS

1. **REMOVER bolinhas dev** ou condicionar a `process.env.NODE_ENV === 'development'`.
2. **Helper `parseIntegerSafe`** unificado.
3. **R14 universal**: corrigir `validateProb` Cena 3 + Ex7.
4. **Identificação por código alfanumérico** + IndexedDB (Ponta 1 caminho A).

### 15. AJUSTES RECOMENDADOS

5. Aceitar `;` em validateSampleSpace Cena 3.
6. Indicador global de progresso "cena x/7".
7. Cena 2 com micro-interação.
8. `inputMode="numeric"` em todos inputs.

### 16. MELHORIAS FUTURAS

Modo professor com dashboard agregado. Vídeo guia narrando Tela de Fechamento. Exportação PDF além de JSON. Audio descrição em Cenas 1-3. Tutorial guiado opcional.

### 17. CHECKLIST DE CONFORMIDADE

| Critério | Status |
|---|---|
| R3 — Atividade não passiva | ⚠️ Cena 2 limítrofe |
| R7 — Necessidade intelectual antes de formalização | ✅ |
| R8 — Contexto brasileiro | ✅ Aceita dízimas, mas rejeita `;` |
| R13 — Viabilidade escolar | ✅ Validado empiricamente |
| R14 — Frações equivalentes | ⚠️ Parcial (Cena 3 e Ex7 violam) |
| R12 — Teorias acionadas seletivamente | ✅ |
| Persistência | ❌ Pendente (Ponta 1 caminho A) |
| **Bolinhas dev em produção** | 🔴 **BLOQUEIO PARA PRODUÇÃO** |
| ABNT em VERSALETE (Tela de Fechamento) | ✅ |
| Acessibilidade WCAG 2.1 | ⚠️ Parcial |

---

## CONSOLIDAÇÃO FINAL

| Aspecto | Disco | Dois Dados |
|---|---|---|
| **Linhas de código** | 16.627 | 30.335 |
| **Cenas/Stages** | 3 stages | 7 cenas + 8 exercícios |
| **Tópicos cobertos** | T1, T3, T8 | T2, T4, T5, T6, T7, T14 |
| **Vieses combatidos** | 8+ (V1, V3, V8, V10, V14) | 8+ (V3, V5, V6, V7, V14) |
| **Bug crítico exclusivo** | Cadeia 6.88 viola R14 | **Bolinhas dev em produção** |
| **Ponto forte exclusivo** | Stage 3 com falácia interativa nomeada | **Tela de Fechamento padrão-ouro** |
| **Bug sistêmico compartilhado** | parseInt vírgula + sem persistência |  |
| **R14 conformidade** | Parcial (6.88/6.93 violam) | Parcial (Cena 3 + Ex7 violam) |

### 3 BUGS CRÍTICOS COMPARTILHADOS

1. `parseInt` trunca vírgula → criar `parseIntegerSafe` helper.
2. Sem persistência cross-session → Ponta 1 caminho A (IndexedDB + ID alfanumérico).
3. Click durante isSpinning não bloqueado (Disco) + bolinhas dev (Dois Dados).

### ESTIMATIVA DE ESFORÇO

12-18 horas de correções nos dois OVAs para v2.0 publicável.

### VEREDITO FINAL

Ambos os OVAs são **defensáveis em banca PROFMAT** com correção dos críticos.

- **Tela de Fechamento do Dois Dados** é candidata a referência publicável (BOLEMA, REMAT).
- **Stage 3 do Disco** com nomeação explícita da "falácia do jogador" é também referência.

---

*Inspeção experiencial integral concluída em 2026-04-27.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
