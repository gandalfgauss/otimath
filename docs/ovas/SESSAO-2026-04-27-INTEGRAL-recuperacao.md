# SESSÃO INTEGRAL DE 2026-04-27 — DOCUMENTO DE RECUPERAÇÃO COMPLETA

**Objetivo deste documento**: preservar **todo o conteúdo substantivo** da conversa de hoje para que amanhã (2026-04-28) seja possível retomar a revisão do capítulo de Fundamentação Teórica sem perda de contexto, mesmo que o histórico do chat não esteja disponível.

**Como usar amanhã**: ler integralmente este documento em ordem; depois abrir [`PROXIMA-SESSAO-2026-04-28-revisao-capitulo-sequencias-didaticas.md`](PROXIMA-SESSAO-2026-04-28-revisao-capitulo-sequencias-didaticas.md) para o passo a passo operacional.

---

## ÍNDICE

1. [O que aconteceu hoje (linha do tempo)](#o-que-aconteceu-hoje)
2. [Inspeção integral dos dois OVAs](#inspeção-integral-dos-dois-ovas)
3. [Princípio orientador da revisão do capítulo](#princípio-orientador-da-revisão-do-capítulo)
4. [Matriz autor × uso real nos OVAs](#matriz-autor-uso-real-nos-ovas)
5. [Operações de revisão no capítulo](#operações-de-revisão-no-capítulo)
6. [Trechos exatos para retomada](#trechos-exatos-para-retomada)
7. [Pendências e fila de execução](#pendências-e-fila-de-execução)
8. [Justificativas detalhadas das remoções](#justificativas-detalhadas-das-remoções)
9. [Pontas soltas (Pontas 1, 2, 3) e decisões](#pontas-soltas-pontas-1-2-3-e-decisões)
10. [Bugs críticos detectados na inspeção](#bugs-críticos-detectados-na-inspeção)

---

## O que aconteceu hoje

A sessão começou como produção de manuais do professor, mas o orientando redirecionou para uma **inspeção experiencial profunda dos dois OVAs em 12 etapas** (mapeamento, fluxo correto, erros possíveis, matemática, pedagogia, UX, responsividade, acessibilidade, robustez, coerência, melhores práticas, relatório), simulando aluno errando em cada subStep e auditando feedbacks construtivos vs entrega de resposta.

Após a inspeção integral (46.962 linhas auditadas: 16.627 do Disco + 30.335 do Dois Dados), o orientando apresentou três prints do Miro do capítulo de Sequências Didáticas e o texto completo do capítulo de Fundamentação Teórica, pedindo que o resultado da inspeção fosse usado como base para revisar o capítulo, identificando o que remover, reduzir ou acrescentar para alinhar a fundamentação teórica com o que o produto realmente entrega.

A revisão começou pela ABP (R1), passou pela tipologia de Zabala (R2 — descoberto que não estava no .tex atual), pelos cinco momentos de Delizoicov / Lopes et al. 2020 (R3) e por Freudenthal (R4). Todas as três operações foram tachadas pelo orientando. A sessão pausou no início da R5 (parágrafo Lopes 2008 sobre pensamento crítico).

Commits desta sessão:
- `226c84c` — Inspeção experiencial integral salva como `inspecao-experiencial-integral-Disco-e-Dois-Dados-2026-04-27.md`.
- `2109836` — Mesma análise duplicada como `Verificacao dos OVAs.md` (nome solicitado pelo orientando).
- `675b143` — `PROXIMA-SESSAO-2026-04-28-revisao-capitulo-sequencias-didaticas.md` com status das operações.

---

## Inspeção integral dos dois OVAs

A inspeção experiencial registrada em [`Verificacao dos OVAs.md`](Verificacao%20dos%20OVAs.md) cobre:

### OVA Disco Probabilístico (16.627 linhas — 3 stages)

- **Stage 1 (Equiprovável)** — 19 fases conceituais em 4 blocos: configuração + conceitos (subSteps 0–1.5), espaço amostral + probabilidade clássica (2–6.45), eventos compostos + disjuntos + complementares (6.55–6.95), frequência + LGN (6.5–16).
- **Stage 2 (Não-equiprovável por área)** — investigação inicial (0–0.19), espaço amostral + conceitos (2–2.4), razão angular state machine (3), probabilidades i·p (4), tabela numérica (5–6), treinos (6.1+), giros reflexivos (6.201–6.205), probabilidade angular (7), treinos fração θ/360 (8), simulação de convergência (8.7), frequências (9–10), conclusão (11), concluída (12).
- **Stage 3 (Não-equiprovável por cores)** — previsão visual (0.5), aposta + justificativa (1–1.5), contagem (1.75), tabela P(cor) (2), espaço dos setores (3), comparação espaços (4), falácia (5), ancoragem (6), generalização (7), autoconfrontação (8), falácia interativa (8.1–8.5), resumo (9), tela final (10), ponte com Dois Dados (11).

**Vieses combatidos explicitamente**: V1.1, V1.2, V3.1 (nomeado "Lecoutre 1992" no balão de subStep 0.191), V3.2 (nomeado "falácia do jogador" no Stage 3 subStep 5), V6.1, V6.2, V7.1, V8.1, V8.2, V8.4, V10.3, V14.1, V14.4.

**Bugs críticos do Disco**:
1. Click durante isSpinning não bloqueado em todos os subSteps com `selectableMode`.
2. `parseInt` trunca vírgula silenciosamente em todos inputs de fração (sistêmico).
3. `parseInt` rejeita separador de milhar `100.000` em LGN problem 15.
4. Cadeia 6.88/6.93 não aplica R14 (frações equivalentes rejeitadas) — inconsistência com framework.
5. Inconsistência calc_pa (R14) vs calc_chain (estrito) na mesma fase de complementares.
6. Sem persistência cross-session — F5 reinicia tudo.
7. Inconsistência decimal aceito em subStep 9 mas rejeitado em 9.5.
8. `validateSampleSpace` rejeita Ω, parênteses, ponto-vírgula.
9. `100` (sem %) rejeitado em 5.7 contradiz o hint.
10. handleDisjointConfirmA sem validação leva a impasse em 6.55.

### OVA Probabilidade Dois Dados (30.335 linhas — 7 cenas + 8 exercícios)

- **Cena 1**: "O Dado" — texto informativo + dado 3D (`DiceScene`).
- **Cena 2**: "Conhecendo cada face" — loop automático de 6 lançamentos com indicador de progresso 6 dots.
- **Cena 3**: "Dado Equilibrado (Honesto)" — interativa em 7 etapas (S = {…} → n(S) → P(S) → P(face i) com fração + porcentagem → generalização → fechamento).
- **Cena 4**: "Equilibrado × Viciado" — barras animadas com `BIASED_HEIGHTS = [20, 35, 90, 55, 110, 140]` (favorecendo face 6).
- **Cena 5**: `TwoDicesPractice` — pool de 150+ eventos curados em 4 categorias (A1=48, A2=12, A3=26, A4=55) com eventos certo/impossível deliberados.
- **Cena 6**: `DiceMachineExperiment` — 3 lançamentos com previsão metacognitiva da soma na L3 mapeada a vieses (V5.1).
- **Cena 7**: `TwoDicesExperiment` — componente mais denso, ~30 sub-fases internas (intro → colorQuestion → SampleSpaceTree → probPair → corrida dos carrinhos → complementaryEvents → unionTheory com Laboratório de Venn em 15 sub-etapas → unionExercises 1–5 → Ex6 Revisão → Ex7 ou Ex8).
- **Tela de Fechamento Reflexiva**: 7 componentes (resumo cronológico, mapa T1-T8, verbetes consultados, vieses detectados, dificuldades, desempenho por exercício, transição). Cita literalmente Garfield & Ben-Zvi com a frase "espelho do seu percurso — não é avaliação".

**Vieses combatidos**: V3.1, V3.4, V5.1 (Cena 6), V6.1, V6.2, V7.1 (Cena 7 unionTheory), V7.2, V14.4 (Laboratório de Venn).

**Bugs críticos do Dois Dados**:
1. **Bolinhas dev de navegação visíveis em produção** (`TwoDicesPresentation.tsx:596-708`) — aluno pode pular tudo. Comentário no código (linhas 225-226): "DEV ONLY — REMOVER ANTES DE APLICAR AOS ALUNOS". **PRIORIDADE MÁXIMA — bloqueio para produção.**
2. `validateProb` Cena 3 viola R14 — rejeita 2/12 que é equivalente a 1/6.
3. `validateSampleSpace` Cena 3 não aceita `;`.
4. Ex7 ainda usa `toFixed` em vez de R14 nativa (pendência conhecida do Parecer Final 2026-04-12).
5. `parseInt` trunca vírgula (sistêmico, herdado).
6. `localStorage` colisão multi-aluno em laboratório (DCC-4 conhecido).

### 3 bugs críticos compartilhados pelos dois OVAs

1. `parseInt` trunca vírgula → criar helper `parseIntegerSafe`.
2. Sem persistência cross-session → Ponta 1 caminho A (IndexedDB + ID alfanumérico).
3. Click durante isSpinning não bloqueado (Disco) + bolinhas dev (Dois Dados).

**Estimativa**: 12-18 horas de correções para v2.0 publicável.

---

## Princípio orientador da revisão do capítulo

> **"O referencial teórico de uma pesquisa em Educação Matemática deve estar em correspondência observável com as decisões de design do artefato. Citações que não orientam decisões observáveis são dispensáveis; decisões observáveis sem citação que as fundamente são lacunas a preencher."** (ARTIGUE, 2014, p. 159–160; ALMOULOUD; SILVA, 2012, p. 22, 26)

Cada operação obedece a três argumentos:
1. **Princípio epistemológico** da Educação Matemática.
2. **Evidência empírica** nos OVAs (ou ausência dela).
3. **Risco específico de banca PROFMAT** que a operação enfrenta ou evita.

---

## Matriz autor × uso real nos OVAs

| Autor / Teoria | Disco usa? | Dois Dados usa? | Evidência no código | Status no capítulo |
|---|---|---|---|---|
| **Brousseau (TSD, milieu, devolução)** | ✅ ESTRUTURANTE | ✅ ESTRUTURANTE | Subset 1.1 do Disco; Cena 6 do Dois Dados; conflito cognitivo P(A∪B) na unionTheory | **MANTER em destaque** |
| **Brousseau (institucionalização)** | ✅ | ✅ | Stage 2 subStep 5.1 "Princípio Fundamental"; Cenas 3-4 do Dois Dados | **MANTER** |
| **Brousseau (situação adidática)** | ✅ | ✅ | Aluno opera com retornos do milieu sem intervenção docente | **MANTER** |
| **Engenharia Didática (Artigue)** | ✅ análise a posteriori via log | ✅ análise a posteriori via `getPhasePerformance` | Exportação JSON | **MANTER** |
| **Almouloud & Coutinho/Silva** | ✅ análise preliminar implícita | ✅ | Mapeamento de vieses na construção | **MANTER** |
| **Duval (registros de representação)** | ⚠️ parcial | ✅ ESTRUTURANTE | Lab. Venn → tabela 6×6 → fração → algébrica | **MANTER, dar destaque no Dois Dados** |
| **Borba, Scucuglia, Gadanidis** | ✅ simulação 10.000 giros | ✅ Three.js 3D | Inviável sem tecnologia | **MANTER** |
| **Batanero, Diaz, Navarro-Pelayo** | ✅ vieses mapeados | ✅ `detectCognitiveBiases()` com referência ABNT | Tela de Fechamento exibe biases.descrição | **MANTER** |
| **Garfield & Ben-Zvi (metacognição informada)** | ✅ Tela Final Stage 3 | ✅ TwoDicesClosingScreen.tsx linha 197 | "Espelho do seu percurso, não é avaliação" | **ACRESCENTAR (A4)** |
| **Mayer (TCAM)** | ✅ animação, segmentação | ✅ skeleton shimmer, dual-channel | Animação progressiva 50→500 giros; setMuteImpact | **ACRESCENTAR (A1)** |
| **Papert (construcionismo)** | ⚠️ aluno constrói diagrama | ✅ ESTRUTURANTE Laboratório de Venn 15 sub-etapas | Cena 7 unionTheory phase vennLab | **ACRESCENTAR (A2)** |
| **Trouche (gênese instrumental)** | ✅ aluno usa disco como instrumento | ✅ aluno instrumentaliza tabela 6×6 | Configuração de slider, marcação progressiva | **ACRESCENTAR (A3) — substitui Clark-Wilson** |
| **Lecoutre (1992)** | ✅ NOMEADO em Stage 2 subStep 0.191 | — | "Viés de Equiprobabilidade (Lecoutre, 1992)" no balão | **ACRESCENTAR (A5)** |
| **Kahneman & Tversky** | ✅ NOMEADO em Stage 3 subStep 5 | ✅ V5.1 atacado | "Essa é a chamada falácia do jogador" no feedback | **ACRESCENTAR (A6)** |
| **Vygotsky (ZDP)** | ⚠️ hint progressivo | ⚠️ andaime "Lembre-se" | Uso pontual | **REDUZIR ancorando em evidência (D4)** |
| **Cazorla, Kataoka, Silva** | ⚠️ aleatoriedade | ⚠️ Cenas 1-4 | Implícito | **REDUZIR de 3 para 1 ocorrência (D3)** |
| **BNCC** | ✅ EM13MAT311, 312 | ✅ EM13MAT105, 205, 305, 405 | Declarado em RouletteInstructionsSection e PHASE_REGISTRY | **MANTER** |
| **Ausubel** | ❌ não estruturante | ❌ | Sem evidência de "ancoragem em conhecimentos prévios" como decisão | **REDUZIR a 1 frase (D1)** |
| **Zabala (definição p.18 + tríade p.38, 42, 63)** | ✅ implícito | ✅ PHASE_REGISTRY operacionaliza tríade | **Manter** |
| **Zabala (tipologia tripartite)** | ❌ | ❌ | Não estava no .tex atual — **R2 pulada** |
| **ABP (Viana, Lozada, Borochovicius, Souza)** | ❌ NÃO USA | ❌ NÃO USA | OVAs ancoram em TSD + DSR | **R1 — REMOVER (tachada hoje)** |
| **Lopes et al. 2020 (Delizoicov 5 momentos)** | ❌ não segue | ❌ não segue | OVAs seguem ciclo brousseauniano | **R3 — REMOVER (tachada hoje)** |
| **Freudenthal** | ⚠️ implícito | ⚠️ implícito | Sem decisão de design citável | **R4 — REMOVER (tachada hoje)** |
| **Lopes 2008 (pensamento crítico)** | ❌ | ❌ | Refere-se a T13 (mídia), OVAs não trabalham T13 | **R5 — REMOVER (próxima)** |
| **Bortoletto e Melo 2022 (polissemia)** | ❌ | ❌ | Só referência conceitual | **REDUZIR a 1 frase (D2)** |
| **Clark-Wilson 2020** | ❌ | ❌ | Só citação genérica | **R6 — REMOVER, substituir por Trouche A3** |
| **Diaz 2009** | ❌ | ❌ | Só citação | **R7 — REMOVER (Batanero & Diaz 2007 já cobre)** |
| **Dresch DSR** | ✅ método | ✅ método | Mas pertence ao capítulo metodológico | **MOVER para Método** |

---

## Operações de revisão no capítulo

### REMOÇÕES (7 operações)

| # | O que remover | Onde | Status |
|---|---|---|---|
| **R1** | Subseção `\subsection{Aprendizagem baseada em problemas}` + 2 parágrafos | Entre TSD e Particularidades dos OVAs | ✅ Tachada (falta apagar definitivamente + acrescentar frase de descarte) |
| **R2** | Parágrafo `TIPOLOGIA DE ZABALA` | Subsubseção BNCC | ⏭️ Não estava no .tex — pulada |
| **R3** | Subseção `\subsection{Estrutura padrão}` (cinco momentos Delizoicov) | Entre `Como elaborar` e `Progressão conceitual` | ✅ Tachada |
| **R4** | Frase final do parágrafo `NECESSIDADE LEGÍTIMA` (Freudenthal) | Subseção `Problematização` | ✅ Tachada |
| **R5** | Parágrafo `ENSINO DE PROBABILIDADE DEVE FAVORECER PENSAMENTO CRÍTICO SEGUNDO LOPES` | Subseção `Problematização` | ⏳ Próxima |
| **R6** | Citação Clark-Wilson — substituir por Trouche | Parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` | ⏳ Próxima |
| **R7** | Citação `\cite{diaz2009}` | Mesmo parágrafo de R6 | ⏳ Próxima |

### REDUÇÕES (4 operações)

| # | O que reduzir | Onde | Status |
|---|---|---|---|
| **D1** | Ausubel de 2 parágrafos para 1 frase ancorada | Subseção `Problematização`, parágrafo `A BAGAGEM DO ALUNO` | ⏳ Pendente |
| **D2** | Bortoletto e Melo de 4 linhas para 1 frase | Subseção `Abordagens Metodológicas`, parágrafo `DIFERENTES ABORDAGENS` | ⏳ Pendente |
| **D3** | Cazorla, Kataoka, Silva de 3 ocorrências para 1 (manter apenas a de Progressão Conceitual) | Dispersas | ⏳ Pendente |
| **D4** | Vygotsky com âncora empírica em hint progressivo | Subseção `Progressão conceitual`, parágrafo `PARTICULARIDADES ORGANIZAÇÃO` | ⏳ Pendente |

### ACRÉSCIMOS SUTIS (6 operações — todos integrados a parágrafos existentes, sem novas subseções)

| # | O que acrescentar | Onde | Status |
|---|---|---|---|
| **A1** | Mayer (TCAM) | Parágrafo `OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM` (subseção Particularidades) | ⏳ Pendente |
| **A2** | Papert (construcionismo) | Parágrafo `MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO` | ⏳ Pendente |
| **A3** | Trouche (gênese instrumental) — substitui Clark-Wilson | Parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` | ⏳ Pendente (junto com R6) |
| **A4** | Garfield & Ben-Zvi (metacognição informada) | Parágrafo `AVALIAÇÃO COMO PROCESSO INTERNO` (subseção Coerência) | ⏳ Pendente |
| **A5** | Lecoutre (viés de equiprobabilidade) | Parágrafo de concepções intuitivas (após R7) | ⏳ Pendente |
| **A6** | Kahneman & Tversky (falácia do jogador, lei dos pequenos números) | Parágrafo de concepções prévias na subseção Problematização | ⏳ Pendente |

---

## Trechos exatos para retomada

### Trecho 1 — Frase de Brousseau resgatada da ABP (já realocada na TSD)

Inserida como novo parágrafo na subseção `Teoria das Situações didáticas`, **entre** o parágrafo `MEDIAÇÃO DOCENTE: QUANDO E COMO INTERVIR` e o parágrafo `TSD E INSTITUCIONALIZAÇÃO: DO SABER CONSTRUÍDO AO CONHECIMENTO MATEMÁTICO`:

```latex
\hl{LIMITE EPISTEMOLÓGICO DA SITUAÇÃO ADIDÁTICA} A presença de um problema inicial não garante, por si só, a emergência de necessidades epistemológicas. Para que haja reorganização conceitual, é necessário que os efeitos do meio sobre o estudante sejam suficientes para provocar, por si mesmos, as adaptações esperadas — caso contrário, toda a virtude didática permanece contida no contrato didático, tornando a situação adidática ``totalmente incapaz de provocar qualquer aprendizagem'' \cite[p.~58, tradução nossa]{brousseau2002}. Esse limite epistemológico orienta diretamente o desenho do milieu desta sequência: cada situação proposta foi concebida para que os retornos do Objeto Virtual de Aprendizagem confrontem o estudante com evidências que o cálculo intuitivo não consegue acomodar, garantindo que a necessidade conceitual emerja do funcionamento da situação e não da intervenção docente.
```

### Trecho 2 — Frase de descarte da ABP (PENDENTE de inserção)

Acrescentar ao final do parágrafo `SEQUÊNCIA DIDÁTICA: DIFERENTES ABORDAGENS` (na subseção `Abordagens Metodológicas`), depois da frase *"...tornando opacos os critérios de análise e validação adotados."*:

```latex
A Aprendizagem Baseada em Problemas, embora reconhecida como abordagem ativa relevante \cite{viana2020abp}, foi descartada como referência central por exigir adaptações cuidadosas à Educação Básica \cite{borochovicius2021abp,souza2015abp} e por não dialogar com a estrutura de situação adidática individual mediada por Objeto Virtual de Aprendizagem que orienta esta pesquisa.
```

### Trecho 3 — Acréscimo A1 (Mayer / TCAM)

Acrescentar no parágrafo `OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM` (subseção `Particularidades das abordagens com OVAS`), após a frase *"...simulações permitem observar frequências relativas em muitas repetições, algo inviável manualmente."*:

```latex
Tais decisões de apresentação visual e segmentação progressiva ancoram-se nos princípios da Teoria Cognitiva da Aprendizagem Multimídia \cite{mayer2014}, que articula duplo canal verbal-visual e respeito à capacidade limitada da memória de trabalho.
```

### Trecho 4 — Acréscimo A2 (Papert / construcionismo)

Acrescentar no parágrafo `MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO` (subseção `Papel da mediação docente`), após a frase *"...criar condições para que o estudante construa conhecimento e garantir que esse conhecimento seja reconhecido e formalizado."*:

```latex
Quando essa construção envolve a edificação progressiva de um artefato matemático com significado pessoal — como ocorre no laboratório de diagramas de Venn da sequência aqui apresentada — opera-se também o construcionismo de Papert (1994), em que o aprender se faz pelo fazer com tecnologia.
```

### Trecho 5 — Acréscimo A3 (Trouche substitui Clark-Wilson)

Substituir, no parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` (subseção `Progressão conceitual`), a citação de Clark-Wilson por:

```latex
[...] as pesquisas em Educação Matemática têm reconhecido o duplo processo pelo qual o estudante e o instrumento digital se moldam reciprocamente — a instrumentação e a instrumentalização (TROUCHE, 2004) — o que significa que os recursos digitais funcionam como instrumentos que ampliam as possibilidades de ação do estudante sobre o conhecimento matemático, justificando sua integração intencional a uma sequência didática, para além de suporte técnico.
```

### Trecho 6 — Acréscimo A4 (Garfield & Ben-Zvi)

Acrescentar no parágrafo `AVALIAÇÃO COMO PROCESSO INTERNO À SEQUÊNCIA DIDÁTICA` (subseção `Coerência`), após a citação de Zabala (1998, p. 63):

```latex
Garfield e Ben-Zvi (2014, p.~142) acrescentam que, no campo específico do raciocínio probabilístico, essa regulação se efetiva quando o estudante recebe um espelho metacognitivo de seu próprio percurso, e não um julgamento punitivo de seu desempenho.
```

### Trecho 7 — Acréscimo A5 (Lecoutre)

Acrescentar no parágrafo de concepções intuitivas equivocadas (subseção `Progressão conceitual`, após a remoção R7 de Diaz 2009):

```latex
Entre essas concepções, destaca-se o viés de equiprobabilidade (LECOUTRE, 1992), que consiste em tratar resultados como igualmente prováveis mesmo quando as condições do experimento não autorizam essa hipótese — viés explicitamente confrontado pela sequência aqui apresentada.
```

### Trecho 8 — Acréscimo A6 (Kahneman & Tversky)

Acrescentar no parágrafo `A BAGAGEM DO ALUNO` (subseção `Problematização`), após a frase *"...os estudantes costumam chegar à sala de aula com ideias equivocadas sobre acaso e aleatoriedade."*:

```latex
Essas heurísticas — entre elas a representatividade e a falácia do jogador, sistematizadas por Kahneman e Tversky (1972) — produzem erros previsíveis que a sequência didática deve antecipar e confrontar diretamente.
```

### Trecho 9 — Redução D1 (Ausubel reduzido)

Substituir os ~120 palavras atuais do parágrafo `A BAGAGEM DO ALUNO` referentes a Ausubel por uma única frase:

```latex
Do ponto de vista da aprendizagem significativa, Ausubel (2000, p.~ix) afirma que o fator mais importante que influencia a aprendizagem é aquilo que o aluno já sabe — princípio operacionalizado nesta sequência pela retomada explícita do experimento aleatório do disco antes da introdução do dado.
```

### Trecho 10 — Redução D2 (Bortoletto e Melo reduzido)

Substituir os ~80 palavras atuais sobre Bortoletto e Melo por:

```latex
Bortoletto e Melo (2022) registram a polissemia do termo no contexto brasileiro, alertando que a falta de explicitação da compreensão adotada torna opacos os critérios de análise e validação.
```

### Trecho 11 — Redução D4 (Vygotsky com âncora empírica)

Substituir o parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` (com a parte de Vygotsky) por:

```latex
A organização progressiva das situações de aprendizagem encontra respaldo na perspectiva socioconstrutivista de Vygotsky (1991, p.~58), segundo a qual o estudante avança do que já sabe em direção ao que pode aprender com o apoio de um mediador — princípio operacionalizado na sequência aqui apresentada pela exibição progressiva de pistas após erros sucessivos do estudante e por mensagens de andaime do tipo *Lembre-se* nos momentos de transição conceitual.
```

---

## Pendências e fila de execução

### Pendências da R1 (ABP) que ainda precisam ser fechadas amanhã

1. ⏳ **Apagar definitivamente** o bloco tachado da subseção ABP (atualmente entre `\sout{...}`).
2. ⏳ **Acrescentar frase de descarte** ao final do parágrafo `DIFERENTES ABORDAGENS` (Trecho 2 acima).

### Fila restante de operações (ordem sugerida amanhã)

1. Fechar pendências da R1 (apagar bloco tachado + acrescentar Trecho 2).
2. **R5** — Apagar parágrafo `ENSINO DE PROBABILIDADE DEVE FAVORECER PENSAMENTO CRÍTICO SEGUNDO LOPES` (subseção Problematização).
3. **R6 + A3** — Substituir Clark-Wilson por Trouche (Trecho 5) no parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA`.
4. **R7** — Apagar `\cite{diaz2009}` (mesmo parágrafo de R6).
5. **D1** — Reduzir Ausubel (Trecho 9) no parágrafo `A BAGAGEM DO ALUNO`.
6. **D2** — Reduzir Bortoletto e Melo (Trecho 10).
7. **D3** — Manter apenas 1 ocorrência de Cazorla (a de Progressão Conceitual); apagar as outras 2.
8. **D4** — Vygotsky com âncora empírica (Trecho 11).
9. **A1** — Mayer (Trecho 3).
10. **A2** — Papert (Trecho 4).
11. **A4** — Garfield & Ben-Zvi (Trecho 6).
12. **A5** — Lecoutre (Trecho 7).
13. **A6** — Kahneman & Tversky (Trecho 8).
14. **Verificações no .bib** — entradas órfãs (`viana2020abp`, `borochovicius2021abp`, `souza2015abp` mantidas pela frase de descarte; `lopesetal2020`, `freudenthal1991`, `clarkwilson2020`, `diaz2009`, `lopes2008` se únicas — remover).

### Estimativa de esforço para fechar a revisão

- Pendências da R1: 15 min
- R5: 10 min
- R6 + A3: 15 min
- R7: 5 min
- D1–D4: 30 min
- A1, A2, A4, A5, A6: 45 min
- Verificações no .bib: 15 min
- **Total: ~2h15 de trabalho focado**

---

## Justificativas detalhadas das remoções

### R1 — ABP

**Princípio epistemológico**: ARTIGUE (2014, p. 159) — o referencial teórico cumpre função normativa em pesquisa de design didático, não enciclopédica. Citar tradição metodológica que não orienta decisões observáveis = desalinhamento epistemológico (ALMOULOUD; SILVA, 2012, p. 26).

**Evidência empírica**: a auditoria das 46.962 linhas não encontrou tutorial em grupo, definição compartilhada de problema ou investigação autônoma multidisciplinar. Os OVAs operam com situação adidática individual brousseauniana.

**Risco de banca**: examinador externo perguntaria "como a ABP estrutura sua sequência?" — sem resposta, a defesa cai em ressalvas decorativas. SOUZA e DOURADO (2015, p. 195-196) e BOROCHOVICIUS e TASSONI (2021, p. 19) — citados no próprio capítulo — alertam que a ABP exige adaptações cuidadosas que os OVAs não realizam.

### R3 — Estrutura padrão (Delizoicov / Lopes et al. 2020)

**Razão 1 — Incompatibilidade ontológica**: Delizoicov foi desenvolvido em Educação em Ciências freireana com unidade analítica do tema gerador; TSD opera com unidade analítica da situação fundamental matemática. Ontologias didáticas incompatíveis sem reformulação substancial.

**Razão 2 — OVAs não operacionalizam os cinco momentos**: não há "questionário inicial" nem "questionário final" estruturados; não há "discussão" coletiva (OVAs são individuais). Os marcadores reais são fases brousseaunianas e blocos do PHASE_REGISTRY.

**Razão 3 — Citação *apud* tripla descritiva**: Lopes et al. citando Delizoicov citando trabalhos 2015-2019. Citação tripla é fragilidade reconhecida em banca PROFMAT. A função era descritiva-panorâmica, não fundadora — não sustentava decisão de design.

### R4 — Freudenthal

**Princípio**: Freudenthal (1991) sustenta a Realistic Mathematics Education com matematização horizontal (de contexto a modelo). Conceito específico, não sinônimo de "aluno faz coisa".

**Evidência empírica**: nem o Disco nem o Dois Dados partem de contexto da realidade do aluno matematizado horizontalmente. Partem de artefatos abstratos didáticos (disco, dado) — abordagem mais próxima de Brousseau (situação fundamental matemática).

**Risco de banca**: Freudenthal citado ao lado de Brousseau sugere ecletismo teórico onde há, de fato, escolha brousseauniana clara.

### R5 — Lopes 2008 (pensamento crítico)

**Princípio**: pensamento crítico em Lopes (2008, p. 73) refere-se a leitura crítica de informação probabilística da mídia — competência sustentada por Engel (2017) sob o nome de *statistical literacy for active citizenship*. Camada sociocultural específica (T13 do mapa Dr. OtiMath).

**Evidência empírica**: os dois OVAs não trabalham T13. Não há atividade de "interprete a manchete de jornal sobre risco". Foco é cálculo probabilístico (T1–T8).

**Risco de banca**: citar Lopes (2008) prometendo pensamento crítico que o produto não entrega = promessa não cumprida.

### R6 — Clark-Wilson (substituir por Trouche)

**Princípio**: Clark-Wilson é citação genérica sobre "tecnologia mediadora". Trouche (2004) é o conceito que opera nos OVAs: instrumentação (a ferramenta molda o pensamento) e instrumentalização (estudante configura a ferramenta).

**Evidência empírica**: o disco e a tabela 6×6 são exatamente isso — instrumentos cognitivos.

### R7 — Diaz 2009

**Princípio**: parcimônia teórica (LAKATOS; MARCONI, 2017). Citar autor que não acrescenta argumento próprio dilui o quadro teórico.

**Evidência empírica**: BATANERO e DIAZ (2007) — já citado — cobre o mesmo terreno com mais profundidade.

---

## Pontas soltas (Pontas 1, 2, 3) e decisões

Discutidas no início da sessão, decisões registradas:

### Ponta 1 — Persistência cross-session (banco de dados de retomada offline)

**Decisão do orientando**: caminho **A** — implementar IndexedDB + ID alfanumérico **antes** de publicar manual. Tarefa adicionada como prioridade no relatório Etapa 12 da inspeção.

### Ponta 2 — Responsividade mobile

**Decisão do orientando**: validada empiricamente em produção (https://otimath.com/ensino/probabilidade/dois-dados — orientando confirmou que tabela 6×6 reescala adequadamente). Manual descreve modalidade celular como suportada. **Não alterar implementação atual.** Disco aguarda mesma verificação empírica.

### Ponta 3 — Formato de exportação

**Decisão**: PDF apenas (não DOCX). Markdown como fonte mestre versionada no git, Pandoc gera somente PDF no Bloco 6.

### Constraint adicional do orientando

> "Dr OtiMath não pode aparecer em nenhum lugar no OVA"

Aplicável também aos manuais. Pareceres em `docs/ovas/` permanecem internos (uso pode permanecer). Autoria pública: Rangel Freitas dos Santos.

---

## Bugs críticos detectados na inspeção (a serem corrigidos depois da revisão do capítulo)

### Disco
- **BG-D1 [Crítico]**: click durante `isSpinning` não bloqueado em todos os subSteps com `selectableMode`.
- **BG-D2 [Crítico]**: `parseInt` trunca vírgula silenciosamente (sistêmico).
- **BG-D3 [Crítico]**: `parseInt` rejeita separador de milhar `100.000` em LGN problem 15.
- **BG-D4 [Crítico]**: cadeia 6.88/6.93 não aplica R14.
- **BG-D5 [Crítico]**: sem persistência cross-session.

### Dois Dados
- **BG-DD1 [CRÍTICO MÁXIMO]**: bolinhas dev visíveis em produção (`TwoDicesPresentation.tsx:596-708`) — bloqueio para produção.
- **BG-DD2 [Crítico]**: `validateProb` Cena 3 viola R14 (rejeita 2/12).
- **BG-DD3 [Médio]**: Ex7 usa `toFixed`.
- **BG-DD4 [Crítico]**: `localStorage` colisão multi-aluno.

### Compartilhados
1. `parseInt` vírgula → criar `parseIntegerSafe` helper.
2. Sem persistência cross-session → IndexedDB + ID alfanumérico.
3. Click isSpinning + bolinhas dev.

**Estimativa total de correção**: 12-18h para v2.0 publicável.

---

## Documentos relacionados commitados nesta sessão

- [`docs/ovas/Verificacao dos OVAs.md`](Verificacao%20dos%20OVAs.md) — inspeção integral 12 etapas × 2 OVAs com 17 seções de relatório final.
- [`docs/ovas/inspecao-experiencial-integral-Disco-e-Dois-Dados-2026-04-27.md`](inspecao-experiencial-integral-Disco-e-Dois-Dados-2026-04-27.md) — duplicata da inspeção.
- [`docs/ovas/PROXIMA-SESSAO-2026-04-28-revisao-capitulo-sequencias-didaticas.md`](PROXIMA-SESSAO-2026-04-28-revisao-capitulo-sequencias-didaticas.md) — passo a passo operacional da próxima sessão.

---

## Estado do repositório no fechamento

- Branch: `mod-rangel`
- Último commit: `675b143` (estado da sessão salvo).
- Working tree limpo após este commit.
- Capítulo `.tex` com R1, R3, R4 tachadas; pendências e demais operações listadas acima.

---

*Sessão integral salva em 2026-04-27 ao final do dia.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
