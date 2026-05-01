# REVISÃO INTEGRAL — Capítulo "Fundamentação Teórica — Sequências Didáticas"

**Data**: 2026-04-28
**Branch**: `mod-rangel`
**Protocolo**: Dr. OtiMath v5.1 — corte radical com núcleo duro de 7-8 autores
**Estado do `.tex`**: operações 1-19 majoritariamente aplicadas; pendentes Op. 9 (apagar `Estrutura padrão`) + 5 mexidas do corte radical + 7 ajustes tipográficos.

---

## ÍNDICE

1. [Resumo didático real dos 2 OVAs](#resumo-didatico-real-dos-2-ovas)
2. [Núcleo duro defensável — 8 autores teóricos](#nucleo-duro-defensavel-8-autores-teoricos)
3. [Periferia indispensável — Papert](#periferia-indispensavel-papert)
4. [Institucionais — 4 referências](#institucionais-4-referencias)
5. [Frase de descarte da ABP — 3 referências](#frase-de-descarte-da-abp-3-referencias)
6. [Autores que saem do capítulo](#autores-que-saem-do-capitulo)
7. [Subseções eliminadas e mantidas](#subsecoes-eliminadas-e-mantidas)
8. [Histórico das 19 operações Dr. OtiMath](#historico-das-19-operacoes-dr-otimath)
9. [5 mexidas do corte radical](#5-mexidas-do-corte-radical)
10. [Decisão sobre Borba — manter consolidada](#decisao-sobre-borba-manter-consolidada)
11. [7 ajustes tipográficos pendentes](#7-ajustes-tipograficos-pendentes)
12. [Saldo de páginas e referências](#saldo-de-paginas-e-referencias)
13. [Pendências `.bib`](#pendencias-bib)
14. [Veredito final Dr. OtiMath](#veredito-final-dr-otimath)

---

## Resumo didático real dos 2 OVAs

### OVA 1 — Disco Probabilístico Aleatório (16.627 linhas, 3 stages)

- **Stage 1 (Equiprovável)**: configuração do disco (slider 1-6) → conceitos de aleatoriedade → espaço amostral S = {…} → P(cor) → eventos compostos → eventos disjuntos → eventos complementares com cadeia 1 = n/n → previsão → 3 giros → confronto previsão × resultado → frequência relativa → LGN com problemas em escalas 100-100.000 → generalização para o dado.
- **Stage 2 (Não-equiprovável por área)**: 4 cenários de feedback diferenciado → balão "Viés de Equiprobabilidade (Lecoutre, 1992)" → state machine de razão angular → tabela numérica → giros reflexivos com `betConstraint` → simulação de convergência 50→500→1000→10000 (subStep 8.7).
- **Stage 3 (Não-equiprovável por cores)**: previsão visual → aposta + justificativa textual → "falácia do jogador" nomeada literalmente no feedback → autoconfrontação personalizada → 5 giros reais antes da pergunta → ponte para Dois Dados.

### OVA 2 — Probabilidade Dois Dados (30.335 linhas, 7 cenas + 8 exercícios + Tela de Fechamento)

- **Cenas 1-2**: dado 3D + loop de 6 lançamentos.
- **Cena 3**: 7 etapas interativas — S = {…} → n(S) → P(face) com fração + porcentagem → generalização.
- **Cena 4**: barras BIASED_HEIGHTS=[20,35,90,55,110,140] em contraste com equilibrado.
- **Cena 5**: pool de 150+ eventos curados em 4 categorias com **eventos certo/impossível deliberados** em A4.
- **Cena 6**: previsão metacognitiva da soma com 3 alternativas mapeadas a vieses.
- **Cena 7** (~30 sub-fases): SampleSpaceTree 6×6 ramo a ramo → tabela 6×6 → complementaryEvents → unionTheory com **Laboratório de Venn em 15 sub-etapas** → unionExercises 1-5 → Ex6 → Ex7/Ex8.
- **Tela de Fechamento Reflexiva**: 7 componentes com `detectCognitiveBiases()`, mapa T1-T8, "espelho do seu percurso — não é avaliação".

**Tópicos cobertos**: T1, T2, T3, T4, T5, T6, T7, T8, T14.
**Vieses combatidos**: V1.1, V1.2, V3.1, V3.2, V3.4, V5.1, V6.1, V6.2, V7.1, V7.2, V8.1, V8.2, V8.4, V10.3, V14.1, V14.4.

---

## Núcleo duro defensável — 8 autores teóricos

| # | Autor | Obras citadas | Função única e indispensável | Decisão de design observável |
|---|---|---|---|---|
| 1 | **Brousseau** | (1997, p. 22, 23, 30, 31, 56, 88, 230, 231); (2002, p. 31, 58) | Núcleo TSD: milieu, devolução, situação adidática, institucionalização, obstáculo epistemológico, erro como lógica do meio, mediação por retornos progressivos | Disco subStep 7.1 (confronto previsão × resultado); Cena 6 (DiceMachineExperiment); feedback que NÃO entrega resposta nos 17 distratores; Stage 2 subStep 5.1 ("Princípio Fundamental"); Cenas 3-4 do Dois Dados (formalização P=1/6 após exploração); hint progressivo como retorno do milieu (substitui Vygotsky) |
| 2 | **Artigue** | (1988, 1996, 2014, p. 45, 159-161) | Engenharia Didática (4 etapas), validação interna, valor didático da situação, progressão epistemológica + cognitiva | Análise a posteriori via `getPhasePerformance`/JSON; análise a priori dos 17 distratores e 4 cenários; sequência T1→T3→T8→T2→T4-T7 ordenada por análise epistemológica |
| 3 | **Almouloud** (& Coutinho 2008; & Silva 2012) | Almouloud e Coutinho (2008, p. 68); Almouloud e Silva (2012) | Operacionaliza as 4 etapas de Artigue; **dimensão cognitiva da análise preliminar = ancoragem em conhecimento prévio** (substitui Ausubel) | Mapeamento curado de vieses V1.1-V14.4; análise a priori dos distratores; banner de retomada Disco→Dois Dados |
| 4 | **Zabala** | (1998, p. 18, 38, 42, 63) | Definição p. 18 (atividades ordenadas com início e fim); tríade objetivos/atividades/avaliação; avaliação integrada como instrumento regulador | PHASE_REGISTRY do Dois Dados; Tela de Fechamento Reflexiva com 7 componentes; reflexão e confronto de estratégias em Stage 3 subStep 1.5 e Cena 6 |
| 5 | **Duval** | (2003, p. 21) | Coordenação entre registros de representação semiótica; conversão como indicador de compreensão | Cena 7 do Dois Dados: SampleSpaceTree (árvore) → tabela 6×6 (numérica) → Laboratório de Venn (gráfica) → fração e fórmula (algébrica) → linguagem verbal — 4 registros articulados |
| 6 | **Batanero** (& Diaz 2007) | Batanero (2016, p. 9, 16, 23); Batanero e Diaz (2007, p. 128) | Natureza contraintuitiva da Probabilidade; vieses intuitivos vs raciocínio normativo; **distinção certo/impossível/provável** (substitui Cazorla) | `detectCognitiveBiases()`; pool de 150+ eventos curados; A4 da Cena 5 com eventos certo/impossível deliberados |
| 7 | **Trouche** | (2004) | Gênese instrumental — instrumentação + instrumentalização — a tecnologia como instrumento que se constitui em uso (substitui Clark-Wilson) | Slider 1-6 do Disco molda pensamento sobre cardinalidade variável; aluno preenche tabela 6×6 célula a célula; marca regiões coloridas A(azul) → B(laranja) → A∩B(roxo) no Laboratório de Venn |
| 8 | **Borba, Scucuglia e Gadanidis** | (2014) | Tecnologias digitais transformam o que pode ser ensinado; simulação reiterada como ferramenta didática inviável manualmente | Disco subStep 8.7 (simulação 50→500→1000→10000 giros); Three.js 3D no Dois Dados; ambientes interativos de experimentação. **Consolidar em 1 ocorrência** apenas (parágrafo `OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM`) |

---

## Periferia indispensável — Papert

| # | Autor | Obra | Onde aparece | Por que é indispensável |
|---|---|---|---|---|
| 9 | **Papert** | (1994) | Subseção `Papel da mediação docente`, parágrafo `MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO` | Construcionismo — única teoria que fundamenta a edificação progressiva do **Laboratório de Venn em 15 sub-etapas** (Cena 7 do Dois Dados, fase `vennLab`). Brousseau cobre milieu, Vygotsky cobre andaime (já saiu), Duval cobre conversão; nenhum cobre construção de artefato matemático com significado pessoal pelo aluno |

---

## Institucionais — 4 referências

| # | Referência | Onde aparece | Função |
|---|---|---|---|
| 10 | **BNCC** (Brasil, 2018, p. 520, 523, 528, 531) | Subseção `BNCC e recursos digitais` | Currículo declarado em PHASE_REGISTRY/RouletteInstructionsSection (EM13MAT105/205/305/405) |
| 11 | **Dresch, Lacerda e Antunes Júnior** (2015) | Introdução do capítulo | DSR — método da pesquisa |
| 12 | **Gil** (2008) | Introdução do capítulo | Função estruturante do referencial teórico |
| 13 | **Lakatos e Marconi** (2017) | Introdução do capítulo | Função estruturante do referencial teórico |

---

## Frase de descarte da ABP — 3 referências

| # | Referência | Onde aparece | Função |
|---|---|---|---|
| 14 | **Viana e Lozada** (2020) | Frase de descarte da ABP, parágrafo `DIFERENTES ABORDAGENS` | Reconhece ABP como abordagem ativa relevante |
| 15 | **Borochovicius e Tassoni** (2021) | Mesma frase de descarte | Adaptações cuidadosas à Educação Básica |
| 16 | **Souza e Dourado** (2015) | Mesma frase de descarte | Adaptações cuidadosas à Educação Básica |

---

## Autores que saem do capítulo

| Autor | Razão da saída | Quem cobre a função | Para onde vai |
|---|---|---|---|
| **Vygotsky (1991)** | Hint progressivo é melhor explicado como retorno do milieu | Brousseau (1997, p. 30) | Sai do `.bib` se órfã; senão fica disponível para outros capítulos |
| **Ausubel (2000)** | Conhecimento prévio cabe na dimensão cognitiva da análise preliminar | Almouloud e Coutinho (2008, p. 68) | Sai do `.bib` se órfã |
| **Cazorla, Kataoka e Silva (2010)** | Distinção certo/impossível/provável + regularidade emergente já cobertas | Batanero (2016, p. 16) | Cap. de Probabilidade |
| **Bortoletto e Melo (2022)** | Polissemia é meta-discussão sem decisão de design | Zabala p. 18 já define com rigor | Sai do `.bib` se órfã |
| **Lopes et al. (2020) / Delizoicov** | OVAs não operam 5 momentos (sem questionário inicial/final, sem discussão coletiva); ontologia delizoiciana incompatível com TSD | — | Sai do `.bib` |
| **Lopes (2008) — pensamento crítico** | Refere-se a T13 (letramento de mídia); OVAs trabalham T1-T8 | — | Sai do `.bib` (avaliação diagnóstica e questionário final dos OVAs vão para Cap. de Metodologia, fundamentados por Engenharia Didática) |
| **Freudenthal (1991)** | OVAs partem de artefato abstrato, não de contexto realístico (RME) | Brousseau (1997, p. 22-23) sustenta sozinho | Sai do `.bib` |
| **Clark-Wilson (2020)** | Citação genérica sobre "tecnologia mediadora" | Trouche (2004) — gênese instrumental | Sai do `.bib` |
| **Diaz (2009)** | Redundante com Batanero e Diaz (2007) | Batanero e Diaz (2007) | Sai do `.bib` |
| **Ausubel (1963)** | Substituída por Ausubel (2000) na operação 12 e depois removido inteiro pela Mexida 2 | — | Sai do `.bib` |

---

## Subseções eliminadas e mantidas

### 2 subseções eliminadas

| Subseção | Status | Operação |
|---|---|---|
| `\subsection{Aprendizagem baseada em problemas}` | ✅ Eliminada (já apagada do `.tex`) | Op. 6 |
| `\subsection{Estrutura padrão}` | ❌ Pendente (apagar do `.tex`) | Op. 9 |

### 11 subseções mantidas

| # | Subseção | Função |
|---|---|---|
| 1 | `\section{Sequências Didáticas}` (introdução) | Define o conceito; Zabala p. 18; Brousseau; Artigue; Batanero |
| 2 | `\subsection{Abordagens Metodológicas}` | Frase de descarte da ABP |
| 3 | `\subsection{Engenharia Didática}` | 4 etapas: análise preliminar, a priori, experimentação, a posteriori |
| 4 | `\subsection{Teoria das Situações didáticas}` | Núcleo TSD: milieu, devolução, mediação, limite epistemológico, institucionalização, TSD em Probabilidade |
| 5 | `\subsection{Particularidades das abordagens com OVAS}` | Borba consolidado em 1 ocorrência + Trouche em outra subseção |
| 6 | `\subsection{Como elaborar uma Sequência didática no Ensino de Matemática}` | Duval (registros) + identificação dos elementos padrão |
| 7 | `\subsection{Progressão conceitual}` | Artigue (progressão epistemológica + cognitiva) + Batanero (substitui Cazorla) + Brousseau (substitui Vygotsky) + Trouche |
| 8 | `\subsection{Problematização}` | Almouloud (substitui Ausubel) + Brousseau (obstáculos epistemológicos) + Artigue + Zabala (tríade) + Batanero e Diaz |
| 9 | `\subsection{Coerência}` | Zabala (avaliação integrada p. 63) + Brousseau (erro como lógica do meio) + Duval |
| 10 | `\subsection{Papel da mediação docente na aprendizagem}` | Brousseau (devolução, contenção docente) + Papert (Laboratório de Venn) |
| 11 | `\subsection{Sequências Didáticas para o Ensino de Probabilidade: BNCC e recursos digitais}` (corrigir hierarquia de `\subsubsection` para `\subsection`) | BNCC + Borba (1 ocorrência) |

---

## Histórico das 19 operações Dr. OtiMath

### Concluídas no `.tex` atual

| Op | Descrição | Status |
|---|---|---|
| 1 | Manter introdução (4 parágrafos azuis com Gil, Lakatos e Marconi, Dresch) | ✅ |
| 2 | Manter parágrafos iniciais da seção `Sequências Didáticas` (Zabala definição, Brousseau, Artigue, Batanero) | ✅ |
| 3 | Reduzir `DIFERENTES ABORDAGENS` (Bortoletto e Melo a 1 frase + frase de descarte da ABP) | ✅ |
| 4 | Manter subseção `Engenharia Didática` integralmente | ✅ |
| 5 | Manter subseção `Teoria das Situações didáticas` integralmente | ✅ |
| 6 | Remover subseção ABP (`\sout{...}` + parágrafo) | ✅ |
| 7 | Manter subseção `Particularidades das abordagens com OVAS` | ✅ (a consolidar de Borba) |
| 8 | Reduzir Cazorla em `O QUE AS SEQUÊNCIAS DEVEM TER` (apagar 2 frases) | ✅ |
| 10 | Manter parágrafos `PROGRESSÃO CONCEITUAL` + `RACIOCÍNIO PROBABILÍSTICO` | ✅ |
| 11 | Substituir Clark-Wilson por Trouche + remover Diaz 2009 + ancorar Vygotsky em hint progressivo | ✅ |
| 12 | Reduzir Ausubel a 1 frase ancorada no banner + apagar Cazorla repetida em `A BAGAGEM DO ALUNO` | ✅ |
| 13 | Substituir exemplos do parágrafo `APLICAÇÃO MECÂNICA DE FÓRMULAS` por exemplos dos OVAs (LGN + dado equilibrado×viciado + eventos compostos) | ✅ |
| 14 | Remover parágrafo `ENSINO DE PROBABILIDADE DEVE FAVORECER PENSAMENTO CRÍTICO SEGUNDO LOPES` (Lopes 2008) | ✅ |
| 15 | Manter `ELEMENTO DE PROBLEMATIZAÇÃO PARA O PROFESSOR` + `SIMULAÇÕES COMPUTACIONAIS` | ✅ |
| 16 | Apagar frase final de Freudenthal em `NECESSIDADE LEGÍTIMA` | ✅ |
| 17 | Manter parágrafos `ELEMENTO DE PROBLEMATIZAÇÃO`, `VALORIZAÇÃO`, `ATIVIDADES OBJETIVOS E AVALIAÇÃO` | ✅ |
| 18 | Manter subseção `Coerência` (Zabala p. 63 + Brousseau erro + Duval) | ✅ |
| 19 | Inserir Papert no parágrafo `MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO` | ✅ |

### Pendentes

| Op | Descrição | Status |
|---|---|---|
| 9 | Apagar `\subsection{Estrutura padrão}` + parágrafo único (Lopes et al. 2020 / Delizoicov 5 momentos) | ❌ Pendente |
| 20 | Manter subsubseção BNCC e recursos digitais integralmente (corrigir hierarquia para `\subsection`) | ❌ Ajuste pendente |
| 21 | Limpar `.bib` (entradas órfãs) | ❌ Pendente após executar todas as outras |

---

## 5 mexidas do corte radical

### Mexida 1 — Vygotsky → Brousseau

**Onde**: Subseção `Progressão conceitual`, parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA`.

**Antes**:
> *"A organização progressiva das situações de aprendizagem encontra respaldo na perspectiva socioconstrutivista de Vygotsky (1991, p. 58, 60-61), segundo a qual o estudante avança do que já sabe em direção ao que pode aprender com o apoio de um mediador — princípio operacionalizado..."*

**Depois**:
> *"A organização progressiva das situações de aprendizagem encontra respaldo na própria Teoria das Situações Didáticas, na medida em que o milieu devolve retornos progressivamente mais informativos à medida que o estudante avança no problema (Brousseau, 1997, p. 30) — princípio operacionalizado..."*

(Resto do parágrafo igual; Trouche permanece.)

### Mexida 2 — Ausubel → Almouloud

**Onde**: Subseção `Problematização`, parágrafo `A BAGAGEM DO ALUNO`.

**Antes**:
> *"Do ponto de vista da aprendizagem significativa, Ausubel (2000, p. ix) afirma que o fator mais importante que influencia a aprendizagem é aquilo que o aluno já sabe — princípio operacionalizado nesta sequência pela retomada explícita do experimento aleatório do disco antes da introdução do dado."*

**Depois**:
> *"A análise preliminar da Engenharia Didática, em sua dimensão cognitiva (Almouloud e Coutinho, 2008, p. 68), exige considerar conhecimentos prévios e concepções espontâneas dos estudantes — princípio operacionalizado nesta sequência pela retomada explícita do experimento aleatório do disco antes da introdução do dado."*

### Mexida 3 — Cazorla → Batanero

**Onde**: Subseção `Progressão conceitual`, parágrafo `RACIOCÍNIO PROBABILÍSTICO`.

**Antes**:
> *"Cazorla, Kataoka e Silva (2010, p. 25) indicam que o desenvolvimento do raciocínio probabilístico requer, como ponto de partida, a compreensão de que nem todos os fenômenos são determinísticos."*

**Depois**:
> *"Batanero (2016, p. 16) indica que o desenvolvimento do raciocínio probabilístico requer, como ponto de partida, a compreensão de que nem todos os fenômenos são determinísticos."*

(Resto do parágrafo igual.)

### Mexida 4 (REVISADA — Borba mantido consolidado, NÃO removido)

**Onde**: Subseção `Particularidades das abordagens com OVAS` + subsubseção `BNCC e recursos digitais`.

**Ação**: consolidar 3 ocorrências em 1.

- **Mantém** (1 ocorrência única): parágrafo `OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM EM PROBABILIDADE` — esta é a ocorrência mais ancorada (Disco subStep 8.7 com simulação 50→500→1000→10000 giros).
- **Apagar**: parágrafo `TECNOLOGIA DIGITAL E CICLOS DE AJUSTE NO ENSINO DE MATEMÁTICA` (argumento de "ciclos iterativos" é redundante com Engenharia Didática).
- **Apagar**: parágrafo `TDICS TRANSFORMAM o ENSINO E APRENDIZADO DE MATEMÁTICA` da subsubseção BNCC (repete literalmente Borba já citada).

**Saldo**: ~250 palavras a menos sem perder Borba.

### Mexida 5 — Apagar Bortoletto e Melo

**Onde**: Subseção `Abordagens Metodológicas`, parágrafo `DIFERENTES ABORDAGENS`.

**Antes**:
> *"...distintos níveis de formalização. **Bortoletto e Melo (2022) registram a polissemia do termo no contexto brasileiro, alertando que a falta de explicitação da compreensão adotada torna opacos os critérios de análise e validação.** A Aprendizagem Baseada em Problemas..."*

**Depois**:
> *"...distintos níveis de formalização. A Aprendizagem Baseada em Problemas..."*

(Apaga uma frase. Frase de descarte da ABP fica.)

---

## Decisão sobre Borba — manter consolidada

**Sugestão inicial errada**: remover Borba inteiramente do capítulo.
**Decisão revisada**: **manter Borba consolidada em 1 ocorrência única**.

### Por que reverter a remoção integral de Borba

1. **Borba cobre função que Trouche NÃO cobre**: "tecnologias digitais transformam o que pode ser ensinado" + "simulação reiterada inviável manualmente" + "ciclos iterativos de design didático".
2. **Borba é referência canônica brasileira do tema**: Borba, Scucuglia e Gadanidis (2014) é praticamente obrigatório em PROFMAT quando o trabalho usa tecnologia digital.
3. **Argumento "Borba pertence ao Cap. de OVAs" não é forte**: a subseção `Particularidades das abordagens com OVAS` precisa fundamentar a integração da tecnologia à sequência.
4. **Custo de manter é baixo**: 0,5 página adicional pelo ganho em segurança de banca.

---

## 7 ajustes tipográficos pendentes

| # | Onde | Erro | Correção |
|---|---|---|---|
| 1 | Apagar marcador `\hl{FALTA CONECTAR PROBLEMATIZAÇÃO COM O PARÁGRAFO SEGUINTE}` | Anotação interna no `.tex` que não pode aparecer no PDF | Apagar a linha |
| 2 | Adicionar `\hl{...}` em `VALORIZAÇÃO DA PROBLEMATIZAÇÃO NÃO É O SUFICIENTE` | Falta `\hl` na abertura | Trocar `{VALORIZAÇÃO...}` por `\hl{VALORIZAÇÃO...}` |
| 3 | Trocar `\subsubsection` por `\subsection` na seção sobre BNCC | Hierarquia indevida (perdeu hierarquia ao ficar dentro de "Papel da mediação docente") | Trocar `\subsubsection` por `\subsection` |
| 4 | Apagar `\textcolor{blue}` órfão após título de `Como elaborar...` | Comando sem argumento — gera erro silencioso na compilação | Apagar a linha |
| 5 | Corrigir grafia "Borba, Silva e Gadanidis" → "Borba, Scucuglia e Gadanidis" | Autor errado | Trocar nome; usar mesmo `\cite{...}` das outras ocorrências |
| 6 | Aspas órfãs após "construcionismo." (introdução, parágrafo 2) | Aspas fechadas sem aspas abertas | Remover `."` |
| 7 | Múltiplos erros tipográficos | "(Brasil, 2018,)" com vírgula órfã; ".Assim," sem espaço; "requentemente" → "frequentemente"; "TDS" → "TSD"; ponto final em `O ERRO E RETORNO` | Aplicar correções pontuais |

---

## Saldo de páginas e referências

| | Estado atual (`.tex` enviado) | Após corte radical |
|---|---|---|
| Autores teóricos | 13 | **8** (núcleo) + Papert (periferia) = **9** |
| Autores institucionais | 4 | 4 |
| Autores da frase de descarte | 3 | 3 |
| **TOTAL DE REFERÊNCIAS** | **20** | **16** |
| Subseções | 12 (Estrutura padrão ainda presente) | **11** |
| Páginas estimadas | 17,5 | **~14,5** |

### Onde estão as ~3 páginas que somem

| Bloco | Páginas |
|---|---|
| Subseção `Estrutura padrão` (Op. 9) | ~0,5 |
| Bortoletto e Melo (Mexida 5) | ~0,2 |
| Ausubel → Almouloud (Mexida 2) | ~0,3 |
| Borba 3 ocorrências → 1 (Mexida 4) | ~1,5 |
| Vygotsky → Brousseau (Mexida 1) | ~0,2 |
| Cazorla → Batanero (Mexida 3) | ≈ 0 |
| Ajustes tipográficos | desprezível |

---

## Pendências `.bib`

### Acrescentar
- `papert1994` — Papert, S. *A máquina das crianças: repensando a escola na era da informática*. Porto Alegre: Artmed, 1994.
- `trouche2004` — Trouche, L. Managing the complexity of human/machine interactions in computerized learning environments. *International Journal of Computers for Mathematical Learning*, v. 9, n. 3, p. 281-307, 2004.

### Remover (verificar se ficam órfãs após executar todas as operações)
- `vygotsky1991` (após Mexida 1)
- `ausubel2000` e `ausubel1963` (após Mexida 2)
- `cazorlaKataokaSilva2010` (após Mexida 3, vai para Cap. de Probabilidade — pode manter no `.bib` parado)
- `bortoletto2022` (após Mexida 5)
- `lopesetal2020` (após Op. 9)
- `lopes2008` (após Op. 14)
- `freudenthal1991` (após Op. 16)
- `clarkwilson2020` (após Op. 11)
- `diaz2009` (após Op. 11)

### Manter
- `viana2020abp`, `borochovicius2021abp`, `souza2015abp` (frase de descarte da ABP)
- `brousseau1997`, `brousseau2002`, `artigue1988`, `artigue1996`, `artigue2014`
- `almouloud2008`, `almouloud2012`, `zabala1998`, `duval2003`
- `batanero2016`, `batanerodiaz2007`
- `borba2014` (consolidado em 1 ocorrência)
- `papert1994`, `trouche2004`
- `brasil2018`, `dresch2015`, `gil2008`, `lakatosmarconi2017`

---

## Veredito final Dr. OtiMath

**Capítulo defensável em banca PROFMAT após corte radical**:

- **9 autores teóricos** (8 núcleo + 1 periferia Papert) com correspondência observável em decisões de design dos OVAs.
- **4 institucionais** (BNCC + DSR + Gil + Lakatos e Marconi).
- **3 da frase de descarte da ABP** (Viana e Lozada + Borochovicius e Tassoni + Souza e Dourado).
- **Total: 16 referências em ~14,5 páginas**.

### Eixo teórico claro

Brousseauniano-zabaliano-duvaliano com periferia ancorada (Trouche, Borba, Almouloud, Batanero, Papert).

### Riscos eliminados

- ABP citada sem operação no produto → frase de descarte.
- Delizoicov 5 momentos incompatível com TSD → subseção apagada.
- Freudenthal sugerindo RME onde há escolha brousseauniana → frase apagada.
- Lopes 2008 prometendo letramento de mídia que produto não trabalha → parágrafo apagado.
- Clark-Wilson genérico onde Trouche específico opera → substituição.
- Vygotsky genérico → substituído por Brousseau (retornos do milieu).
- Ausubel inflado para 4s de banner → substituído por Almouloud (dimensão cognitiva da análise preliminar).
- Cazorla repetida 3x → substituída por Batanero (mais robusta).
- Borba 3 ocorrências redundantes → consolidada em 1.
- Bortoletto e Melo (polissemia) → apagada.
- Diaz 2009 redundante com Batanero e Diaz 2007 → apagada.

### Frase-guia atendida

> *"Cada autor citado no capítulo explica uma decisão real da sequência didática implementada nos dois OVAs — sem excesso, sem lacunas e com coerência total."*

Após executar Op. 9 + 5 mexidas + 7 ajustes tipográficos, o capítulo passa em qualquer banca PROFMAT rigorosa.

---

## Ordem de execução recomendada

1. Apagar `\subsection{Estrutura padrão}` + parágrafo único (Op. 9)
2. Mexida 1 — Vygotsky → Brousseau no parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA`
3. Mexida 2 — Ausubel → Almouloud no parágrafo `A BAGAGEM DO ALUNO`
4. Mexida 3 — Cazorla → Batanero no parágrafo `RACIOCÍNIO PROBABILÍSTICO`
5. Mexida 4 — Consolidar Borba (apagar `TECNOLOGIA DIGITAL E CICLOS` + `TDICS TRANSFORMAM`; manter `OVAs E SIMULAÇÕES`)
6. Mexida 5 — Apagar Bortoletto e Melo do parágrafo `DIFERENTES ABORDAGENS`
7. Apagar `\hl{FALTA CONECTAR PROBLEMATIZAÇÃO COM O PARÁGRAFO SEGUINTE}`
8. Adicionar `\hl{}` em `VALORIZAÇÃO DA PROBLEMATIZAÇÃO`
9. Trocar `\subsubsection` por `\subsection` na seção sobre BNCC
10. Apagar `\textcolor{blue}` órfão
11. Corrigir "Borba, Silva e Gadanidis" → "Borba, Scucuglia e Gadanidis"
12. Aplicar correções tipográficas finais
13. Limpar `.bib` (acrescentar `papert1994` + `trouche2004`; verificar órfãos)

**Estimativa de execução**: ~1h30 de trabalho focado no Overleaf.

---

*Análise integral salva em 2026-04-28.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
*Branch: `mod-rangel`.*
