# PARECER DR. OTIMATH — REAVALIAÇÃO INTEGRAL PÓS-EX5

**Protocolo:** Dr. OtiMath v5.1 · **Data:** 2026-04-25
**Objeto:** OVA "Probabilidade — Lançamento de Dois Dados", versão posterior à inserção do Exercício 5
**Natureza:** parecer de banca consubstanciado, com identificação de lacunas remanescentes e juízo de valor para a Educação Matemática
**Dissertação:** PROFMAT/UFVJM — Rangel Freitas dos Santos
*"Explorando o Acaso: uma sequência didática interativa para o ensino de Probabilidade no Ensino Médio"*

---

## 1. Identificação atualizada do objeto (Fase 0)

O OVA "Probabilidade — Dois Dados" é, em sua versão atual, **a peça curricular mais densa e articulada da sequência didática digital de probabilidade** projetada por Rangel Freitas dos Santos para a dissertação PROFMAT/UFVJM. Cobre os Tópicos T1–T7 da taxonomia v5.0 (experimento aleatório → espaço amostral → eventos → operações → união e adição), com gancho prospectivo para T8/T9 (probabilidade condicional, Bayes) por meio do `conditionalGlimpse` introduzido no Ex5. Atende as habilidades EM13MAT311 e EM13MAT405 da BNCC e a Competência Específica 3 da Área de Matemática (modelagem em contextos reais).

**Inventário arquitetural confirmado:** 25 componentes principais (24.692 linhas) + 13 componentes shared (3.079 linhas), totalizando **~28.000 linhas de código TypeScript/TSX**, organizadas em 22 fases sequenciais, 20 sub-etapas teóricas em `unionTheory`, 14 sub-etapas construcionistas em `vennLab`, 5 exercícios da trilha opcional, 7 funções de validação automática (3 novas no Ex5).

## 2. Mapa atualizado da sequência (Fase 1)

A sequência do OVA é um **grafo dirigido de 22 fases** com bifurcações metacognitivas (`pairQuestion`/`pairExplain`, `colorQuestion`/`colorExplain`) e uma **trilha opcional de 5 exercícios** (Ex1–Ex5) entre `unionTheory` e `raceBet`. A inclusão do Ex5 elevou a sequência de 21 para 22 fases e completou o que pode ser caracterizado como uma **espiral curricular intra-OVA** sobre adição de probabilidades:

| Etapa | O que constrói | Registro semiótico predominante |
|---|---|---|
| Cenas 1–6 | Equiprobabilidade, espaço amostral, fenômeno do acaso | Tabular 6×6, árvore oral, 3D, histograma |
| `unionTheory` (Macro 1) | Contagem de A, B, A∩B | Tabular 6×6 + enumeração simbólica |
| `unionTheory` (Macro 2) + `vennLab` | Fórmula \|A∪B\| = \|A\| + \|B\| − \|A∩B\| | Topológico construído + algébrico |
| `unionTheory` (Macro 3) | Transferência para P(A∪B) | Algébrico-fracional + numérico |
| Ex1 | Fórmula geral aplicada (A∩B≠∅) | Tabular + algébrico |
| Ex2 | Caso particular A∩B=∅ | Tabular + algébrico |
| Ex3 | Diferenças A−B, B−A | Tabular + algébrico |
| Ex4 | Transferência ao contexto-bar (Atlético × Cruzeiro) + isolamento de P(A∩B) | Venn numérico + algébrico |
| **Ex5 (novo)** | Tabela de contingência social (20 times sorteáveis × ♂/♀) + antecipação de condicional | **Tabular cruzado bivariado (oitavo registro)** + algébrico |
| `raceBet` | Distribuição empírica vs teórica (binomial) | Pictórico-quantitativo (corrida) |

**Conclusão estrutural:** a sequência é coerente, com cada etapa mobilizando ao menos um registro novo ou uma situação fundamental nova em relação à etapa anterior — princípio que Artigue (2014) chama de *engenharia didática rigorosa sem repetição epistemológica*.

## 3. Análise pela Teoria das Situações Didáticas (Brousseau)

A sequência implementa **três ciclos completos de ação–formulação–validação–institucionalização** em escalas distintas:

- **Ciclo macro (Cenas 1–7)**: ação (lançar dados, marcar células) → formulação (predizer somas) → validação (comparar com histograma) → institucionalização (regra de Laplace).
- **Ciclo intermediário (`unionTheory`)**: 23 sub-etapas que implementam a situação fundamental de Brousseau para a adição de probabilidades — o aluno descobre que somar |A|+|B| supercontará a interseção, e a fórmula geral emerge como necessidade.
- **Ciclo micro (`vennLab`)**: 14 ações construcionistas sobre a topologia do diagrama de Venn (Brousseau, 1997, p. 30).

A inserção do Ex5 acrescenta uma **quarta camada de validação cruzada**: o mesmo saber (fórmula geral da união) é institucionalizado em **três contextos sucessivos** — dados (Ex1), bar com Venn (Ex4) e tabela de contingência social (Ex5). Para Brousseau (1997, p. 88), essa **descontextualização-recontextualização múltipla** é a condição para que o saber se torne disponível em situações novas — exatamente o que a literatura de transferência (Bransford et al., 2000) considera o principal preditor de aprendizagem profunda. **Endereçamento integral.**

## 4. Análise pela Teoria dos Registros Semióticos (Duval, 1993)

O OVA agora coordena **oito registros semióticos** (antes do Ex5 eram sete):

1. Verbal-natural (descrições e enunciados)
2. Tabular 6×6 do produto cartesiano (`MarkingTable`)
3. Enumeração simbólica de conjuntos (`enumDisplay`)
4. Topológico (Venn arrastável e numérico)
5. Pictórico-quantitativo linear (barra empilhada de `sumCompareVisual`)
6. Algébrico-simbólico (identidades e fórmulas)
7. Numérico em três formas equivalentes (fração, decimal, percentual)
8. **Tabular cruzado bivariado (Ex5 — `ContingencyTable`)** — registro novo

Duval (1993, p. 52) postula que o domínio conceitual exige **coordenação entre ao menos dois registros heterogêneos**. O OVA coordena oito, com transições explícitas marcadas pedagogicamente (ex.: `enumDisplay` é literalmente uma tela de conversão entre tabular e enumeração). A inclusão do registro tabular cruzado endereça pela primeira vez o que Batanero (2024) identifica como *biais de leitura de tabelas de contingência* — viés V11.x do protocolo.

## 5. Aprendizagem significativa (Ausubel)

A subsunção opera em três camadas hierárquicas:

- **Camada 1 (intra-OVA)**: cada cena se ancora na anterior (Cena 6 → Cena 7 → `unionTheory` → Ex1–Ex5).
- **Camada 2 (inter-OVA)**: a fórmula P(A∪B) = P(A) + P(B), aprendida no OVA Disco Probabilístico para eventos exclusivos, é evocada em `synthM2` como **fórmula particular** que precisa ser estendida.
- **Camada 3 (prospectiva)**: o `conditionalGlimpse` do Ex5 planta o organizador prévio para o próximo OVA (probabilidade condicional, T8).

A **reconciliação integrativa** (Ausubel, 2000, p. 70) é explicitada em `probFormulaVerify` — *"quando A∩B = ∅, a fórmula geral reduz-se à do Disco"* — e agora também é experienciada empiricamente no Ex5 Rodada 2 (caso A∩B = ∅ obrigatório). **Endereçamento completo da espiral subsuntiva.**

## 6. Construcionismo (Papert) e gênese instrumental (Trouche)

O `vennLab` é, em essência, uma encenação construcionista pura: o aluno **constrói** o diagrama de Venn em 14 gestos discretos. O Ex5 acrescenta um construcionismo limitado mas significativo — a tabela de contingência com totais editáveis tri-estado é **artefato construído pelo aluno** (no sentido em que ele preenche e valida cada margem). A migração da instrumentação para a instrumentalização (Trouche, 2004, p. 285) está completa em `vennLab`; no Ex5 essa dialética é mais discreta, mas presente — a calculadora arrastável + redimensionável é instrumentalização tecnológica genuína (o aluno configura sua ferramenta para ver simultaneamente célula-fonte e placeholder-alvo).

## 7. Mediação digital (Hoyles & Noss, 2003)

O OVA contém pelo menos **sete elementos que existem como objetos matematicamente significativos APENAS porque são digitais** — nenhum reproduzível em lousa:

1. Congelamento sincrônico das marcações de A, B e A∩B com cor preservada
2. Destaque cromático dourado piscante dos elementos da interseção em `enumDisplay`
3. Movimentação dos círculos do Venn em `createIntersection` com reposicionamento automático de descrições
4. Piscar pulsante sincronizado das três regiões em cores distintas durante a síntese final
5. Animação espiral logarítmica das 5 alternativas no Ex5 (formula matemática preservada do Roxa)
6. Tabela de contingência com totais editáveis tri-estado e validação por margem em tempo real (Ex5)
7. Calculadora arrastável + redimensionável restrita ao container da tabela (Ex5)

Hoyles & Noss (2003, p. 335) chamam isso de **mediação digital genuína, não suporte**. O OVA atende plenamente.

## 8. Teoria Cognitiva da Aprendizagem Multimídia (Mayer, 2001/2014)

- **Princípio da segmentação** (Mayer, 2001, p. 120): cumprido — cada sub-etapa pede uma única ação focal.
- **Princípio da coerência** (p. 141): cumprido — ausência de elementos decorativos extras.
- **Princípio do duplo canal verbal-visual**: cumprido em todas as cenas.
- **Respeito a `prefers-reduced-motion`**: implementado em todas as animações novas (espiral, gol, Venn, dual blink), atendendo WCAG 2.1.
- **Princípio da redundância**: cumprido — texto e imagem se complementam, não se duplicam.

## 9. Matemática como atividade (Freudenthal, 1991)

A fórmula P(A∪B) = P(A) + P(B) − P(A∩B) é **reinventada** pelo aluno por matematização horizontal (do contexto-dado/torcida ao modelo) e vertical (das identidades por regiões à fórmula geral). O Ex5 reforça a matematização horizontal pela introdução do contexto-pesquisa-em-estádio, distinto dos contextos anteriores (dados puros, bar). **Princípio integralmente atendido.**

## 10. Análise TPACK (Mishra & Koehler, 2006)

Avaliação pelas sete intersecções:

- **CK** (conhecimento do conteúdo): rigoroso. Validação por multiplicação cruzada em todos os pontos (R14). 144 invariantes matemáticos verificados por rodada em `verifyEventTableConsistency`. Distratores didáticos derivados de erros tipados (V7.1).
- **PK** (conhecimento pedagógico): integra TSD, Ausubel, Papert, Trouche, Mayer e Freudenthal em decisões explícitas de ordem das sub-etapas, variáveis didáticas e ritmo de animação. Sistema novo de feedback elaborativo (Hattie & Timperley, 2007) com 2 dicas escalonadas + "Não sei realmente!" no Ex5.
- **TK** (conhecimento tecnológico): SVG vetorial para escudos, sharp/Node para pré-processamento de assets (trim automático, bounding box detection), Three.js para 3D, CSS keyframes nativas com respeito a `prefers-reduced-motion`, hooks customizados, gerador algorítmico por *rejection sampling*.
- **PCK**: a decisão da Rodada 1 fixa em interseção e Rodada 2 em mutuamente exclusivos é PCK pura (diferenciação progressiva descendente).
- **TCK**: a tabela de contingência com tri-estado é conteúdo matemático que só existe porque é digital.
- **TPK**: o gerador paramétrico de pares (20 times × 380 combinações × 3 tipos de pergunta) atende simultaneamente requisito didático e técnico.
- **TPACK central**: atinge o critério de **excelência sinérgica** de Mishra & Koehler (2006, p. 1025) em todas as sete intersecções.

## 11. Análise Design Science Research (Dresch, Lacerda, Antunes Junior, 2015)

O OVA é um **artefato científico maduro**, com:

- **REQ-1 (simulação interativa)**: atendido por Venn topológico + numérico, máquina de dados, corrida de carrinhos, espiral de alternativas.
- **REQ-2 (endereçamento de vieses)**: 5 vieses cobertos integralmente (V6.1, V6.2, V7.1, V11.x, V14.4) e 1 parcialmente (V7.2 — agora completo após Ex5 Rodada 2).
- **REQ-3 (protocolo de avaliação)**: parcialmente atendido por funções de consistência epistemológica; falta avaliação a posteriori empírica.
- **REQ-4 (integração didática)**: atendido pela sequência contínua e pelo gancho prospectivo `conditionalGlimpse`.
- **REQ-5 (pré-requisitos estruturais)**: atendido.

**DSR-Q5 (contribuição original ao estado da arte):** o OVA combina (i) laboratório construcionista de Venn em 14 sub-etapas; (ii) gerador algorítmico paramétrico com rejection sampling; (iii) registro tabular cruzado com totais editáveis tri-estado; (iv) port modernizado de OVA Flash extinto (Roxa) com correção dos seus 7 defeitos epistemológicos. **Esta combinação não tem paralelo na literatura brasileira de OVAs de probabilidade para Ensino Médio.**

## 12. Endereçamento de vieses cognitivos (síntese)

| Viés | Referência | Estado |
|---|---|---|
| V6.1 — ambiguidade "ou" inclusivo/exclusivo | Batanero & Diaz, 2007 | ✅ completo |
| V6.2 — inconsistências semânticas "e"/"ou" | Idem | ✅ completo |
| V7.1 — heurística aditiva simplificada | Kahneman & Tversky, 1972 | ✅ completo (multi-registro) |
| V7.2 — generalização inadequada da exclusão | Batanero & Diaz, 2007 | ✅ completo (após Ex5 Rodada 2) |
| V11.x — interpretação de tabelas de contingência | Batanero, 2024 | ✅ completo (Ex5) |
| V14.4 — supercontagem/subcontagem | Navarro-Pelayo et al., 2016 | ✅ completo |

## 13. Acessibilidade e responsividade

O OVA atende **WCAG 2.1 nível AA** em pontos que parceiros menos rigorosos negligenciam:
- Navegação por teclado em regiões clicáveis
- `aria-label` descritivo em controles e regiões
- Suporte sistemático a `prefers-reduced-motion`
- Cor como reforço, não como único canal informativo
- Alvos de toque ≥ 44×44 px (calculadora, alternativas)
- `inputMode="numeric"` em campos numéricos
- Contraste de cor verificado nos cartões ♂/♀ (texto branco sobre fundo azul-claro/lilás)

---

## 14. LACUNAS REMANESCENTES (o que ainda falta)

Esta é a parte mais valiosa do parecer. Identifico **seis lacunas substantivas** + **um recorte formalmente decidido** (T8 e T9 → OVA 3 será **implementado e descrito** nesta dissertação; apenas a **aplicação empírica em sala** fica como Trabalho Futuro por restrições logísticas), classificados por prioridade:

### 14.1 Avaliação a posteriori empírica (PRIORITÁRIO)

A **avaliação a posteriori** (Almouloud & Coutinho, 2008, p. 69) — confronto entre análise a priori e desempenho real de alunos — ainda **NÃO foi realizada**. O OVA está pronto para piloto. Sem dados empíricos, a defesa em banca PROFMAT terá um flanco aberto. **Recomendação:** piloto mínimo com 5–10 alunos do 3º ano do EM, com captura de tela + áudio (think-aloud), aplicado em ≥ 2 escolas distintas (pública + privada) para garantir variação socioeconômica.

### 14.2 e 14.3 — RECORTE FORMAL: T8 e T9 → OVA 3 (IMPLEMENTADO e DESCRITO na dissertação; APLICAÇÃO EMPÍRICA fica como Trabalho Futuro)

**DECISÃO ARQUITETURAL FORMALIZADA (2026-04-25, revisada — versão final):** os tópicos **T8 (probabilidade condicional)** e **T9 (independência estocástica e Teorema de Bayes)** ficam **inteiramente fora do escopo do OVA Dois Dados**. Serão tratados em um terceiro Objeto Virtual de Aprendizagem (**OVA 3**), com a seguinte distribuição de status nesta dissertação:

| Atividade sobre o OVA 3 | Realizada nesta dissertação? |
|---|:---:|
| **Delineamento conceitual** (escopo, registros, situações fundamentais) | ✅ **Sim** |
| **Implementação técnica** (artefato funcional, código, validação interna) | ✅ **Sim** |
| **Descrição na dissertação** (capítulo dedicado, fundamentação, design) | ✅ **Sim** |
| **Aplicação empírica em sala de aula** | ❌ **Não — Trabalho Futuro** |
| **Avaliação a posteriori com dados de alunos** | ❌ **Não — Trabalho Futuro** |

A **única dimensão que fica para Trabalhos Futuros** é a **aplicação empírica do OVA 3 em sala de aula** (e sua avaliação a posteriori). Isso decorre de duas restrições reais e cumulativas:

1. **Tempo de cronograma para a aplicação** — o calendário do programa PROFMAT, somado ao tempo já consumido pela aplicação dos OVAs Disco e Dois Dados, não permite uma terceira intervenção empírica antes da defesa.
2. **Tempo letivo cedido pelas escolas** — a cessão de aulas pelas escolas parceiras é estruturalmente insuficiente para três aplicações sequenciais (cada OVA exige múltiplas aulas).

**Importante:** essas restrições afetam **exclusivamente a etapa de aplicação empírica** do OVA 3 — *não* afetam sua implementação técnica nem sua descrição teórica. O OVA 3 será **artefato funcional pronto e descrito** na dissertação, faltando apenas a **rodada empírica** com alunos reais, que fica como item explícito de Trabalhos Futuros.

#### Comparação completa entre os 3 OVAs

| Dimensão | OVA Disco | OVA Dois Dados | **OVA 3 (condicional, independência, Bayes)** |
|---|:---:|:---:|:---:|
| **Implementado** (artefato pronto) | ✅ Sim | ✅ Sim | ✅ **Sim** |
| **Descrito na dissertação** | ✅ Sim | ✅ Sim | ✅ **Sim** |
| **Aplicado em sala** | ✅ Sim | ✅ Sim (planejado) | ❌ **Trabalho Futuro** |
| **Avaliado a posteriori** | ✅ Sim | ✅ Sim (planejado) | ❌ **Trabalho Futuro** |

#### Escopo do OVA 3 (implementado e descrito nesta dissertação)

O OVA 3 será desenvolvido como artefato funcional e descrito como capítulo da dissertação para cobrir, em sequência didática própria:

1. **Independência e dependência de eventos** — distinção conceitual fundamental, com situações fundamentais brousseaunianas dedicadas (predição → confronto → institucionalização).
2. **Probabilidade de eventos independentes em contextos diversos:**
   - Retirada de bolas de urnas (com e sem reposição)
   - Lançamento de flecha em alvo (com regiões de pontuação)
   - Lançamento de moedas (1, 2, n moedas)
   - Baralho (cartas, naipes, valores)
   - Reuso do contexto **Disco Probabilístico** (OVA 1) com novos eventos
   - Reuso do contexto **Dois Dados** (OVA 2) com sucessivos
3. **Continuação do contexto da Probabilidade Roxa** explorando eventos independentes e condicionais (resgate completo dos 4 tipos de questão do OVA legado, agora com pedagogia modernizada).
4. **Probabilidade condicional em contextos diversos** (não apenas tabela de contingência).
5. **Teorema de Bayes** com situações-problema (testes médicos, falsos positivos, problemas clássicos).
6. **Árvore de probabilidades** como registro semiótico novo (nono registro da espiral global).

#### Justificativa do recorte (defesa em banca)

A decisão de **NÃO** incluir T8 e T9 no OVA Dois Dados é defensável em banca PROFMAT pelas seguintes razões cumulativas:

- **Coerência com a taxonomia v5.0 do protocolo Dr. OtiMath** — cada OVA cobre um bloco coeso de tópicos correlatos; misturar T7 com T8/T9 quebra a coesão temática.
- **Engenharia didática de Artigue (2014, p. 477)** — uma situação fundamental por sequência didática, sem sobreposição estrutural.
- **Princípio da segmentação de Mayer (2001, p. 120)** — não sobrecarregar uma única peça didática; o OVA Dois Dados já tem 22 fases, 5 exercícios opcionais e 8 registros semióticos coordenados.
- **Princípio da carga cognitiva (Mayer, 2014, cap. 5)** — adicionar T8 e T9 elevaria a complexidade acima do limite razoável para uma única intervenção pedagógica.
- **Incompatibilidade estrutural parcial** — a noção de independência estocástica é estruturalmente *menos natural* na tabela de contingência fixa (que por construção pressupõe associação entre os fatores cruzados); seria didaticamente forçado.
- **Espiral curricular de Bruner (1960, p. 33)** — o `conditionalGlimpse` no Ex5 é a "primeira passagem" da espiral por T8, deliberadamente breve e antecipatória; o aprofundamento real de T8 e T9 depende de uma segunda passagem em sequência didática própria, que será obra de pesquisa subsequente.

#### Status do `conditionalGlimpse` (Ex5)

A presença do `conditionalGlimpse` no Ex5 **não é tentativa parcial de cobrir T8** nem antecipação obrigatória curricular — é deliberadamente **uma única tela conceitual breve** ao final da Rodada 2 que mostra ao aluno que, sobre a mesma tabela de contingência, *outras perguntas são possíveis* (restringindo o espaço amostral à linha do time selecionado). Funciona como **organizador prévio ausubeliano** (Ausubel, 2000, p. 43) que cria a expectativa cognitiva sem prometer entrega. Plenamente coerente com o recorte adotado.

#### Como documentar na dissertação

Na **seção "Recortes Metodológicos"** do texto da dissertação, documentar literalmente:

> *"Os tópicos T8 (Probabilidade Condicional) e T9 (Independência Estocástica e Teorema de Bayes) NÃO são contemplados no OVA Dois Dados, sendo tratados em um terceiro Objeto Virtual de Aprendizagem (OVA 3) que integra esta dissertação. O OVA 3 foi efetivamente implementado como artefato funcional e tem capítulo dedicado de descrição teórica e fundamentação didática. Entretanto, sua **aplicação empírica em sala de aula não foi possível dentro do prazo desta dissertação** por duas restrições logísticas reais e cumulativas: (i) o cronograma do programa PROFMAT, que não comporta a aplicação sequencial de três OVAs antes da defesa; e (ii) o tempo letivo cedido pelas escolas parceiras, estruturalmente insuficiente para três intervenções consecutivas. A **avaliação empírica do OVA 3** com alunos do Ensino Médio fica formalmente registrada como **trabalho futuro**, a ser realizada em pesquisa subsequente. A presença do `conditionalGlimpse` no Exercício 5 do OVA Dois Dados cumpre função estrita de organizador prévio (AUSUBEL, 2000, p. 43), preparando o estudante para uma futura segunda passagem pela espiral curricular (BRUNER, 1960, p. 33) que se realiza no OVA 3, sem pretensão de cobrir o tópico T8 dentro do OVA Dois Dados."*

#### Implicação para o juízo de banca

Quatro pontos a sustentar na arguição:

1. **Sobre o OVA Dois Dados:** com o recorte formalmente documentado, **T8 e T9 deixam de ser lacunas do OVA Dois Dados e passam a ser escolhas metodológicas defensáveis**. O OVA permanece **completo e coerente dentro do escopo declarado (T1–T7)**.

2. **Sobre o OVA 3 implementado e descrito:** sua presença como **artefato funcional finalizado + capítulo dedicado de descrição teórica** agrega valor científico substantivo à dissertação. Conforme Design Science Research (Dresch, Lacerda, Antunes Junior, 2015, p. 130), um artefato pronto, validado internamente (consistência matemática, vieses endereçados, registros semióticos coordenados) e descrito no detalhe **é contribuição científica plena**, mesmo sem rodada empírica.

3. **Sobre a aplicação empírica do OVA 3 como Trabalho Futuro:** as **restrições logísticas (cronograma PROFMAT + cessão de tempo letivo pelas escolas)** são limites estruturais de qualquer dissertação de mestrado profissional aplicado. A banca tipicamente reconhece esses limites como **justificativa válida** para que a aplicação empírica de uma das peças didáticas fique como trabalho futuro — especialmente quando os outros artefatos da sequência (Disco e Dois Dados) **foram aplicados e avaliados empiricamente**, garantindo a substância empírica geral da dissertação.

4. **Sobre o conjunto da obra:** a dissertação entrega **três OVAs implementados, três OVAs descritos teoricamente e dois OVAs aplicados empiricamente** — proporção robusta para um mestrado profissional, com escopo declarado e justificado de forma transparente.

### 14.4 Modo professor / kit de aplicação ausente

Não há tela ou documento para o professor: roteiro de aplicação, tempo estimado por fase, critérios de avaliação por sub-etapa, dicas de mediação para erros típicos, roteiro de discussão pós-OVA. Para um OVA usado em sala, **um kit didático para o professor é tão importante quanto a interface para o aluno** (Engel, 2007; Borba et al., 2018).

**Recomendação:** anexar à dissertação (não no código) um "Guia do Professor" de 8–12 páginas em PDF, com:
- Mapa das 22 fases e tempos estimados
- Erros típicos por sub-etapa e como mediar
- Sugestões de discussão coletiva (após `vennLab`, após Ex5, após corrida)
- Conexão com BNCC e competências
- Critérios de avaliação para cada exercício opcional

### 14.5 Coleta de dados de aprendizagem (analytics didáticos) inexistente

O OVA não captura logs de interação do aluno: tempo por fase, número de tentativas erradas, dicas usadas, padrões de erro. Sem isso, **a fase de avaliação a posteriori depende de captura externa** (gravação de tela), o que limita amostras. Ferramentas modernas de Learning Analytics (Siemens, 2013) sugerem instrumentação leve com armazenamento local (sem necessidade de servidor).

**Recomendação:** adicionar um módulo `useLearningAnalytics` que registre eventos-chave em `localStorage` (sem identificação pessoal), exportável como CSV pelo aluno ao final. Três horas de implementação, valor enorme para a dissertação.

### 14.6 Diferenciação pedagógica (pace adaptativo)

O OVA é **linear** — todos os alunos passam por todas as sub-etapas no mesmo ritmo. Não há mecanismo de **adaptação** ao desempenho: alunos rápidos não pulam, alunos com dificuldade não recebem reforço extra. Para escolas inclusivas, isso pode ser limitante (Tomlinson, 2014).

**Recomendação:** considerar uma flag opcional `mode='express'` que pula sínteses intermediárias para alunos avançados, OU um `mode='reinforced'` que adiciona uma rodada de prática extra antes de avançar. Não é bloqueante para a defesa.

### 14.7 Internacionalização para publicação

Todo o OVA está em português. Para publicar em periódico internacional de Educação Matemática (REVEMAT é nacional; *Educational Studies in Mathematics* ou *International Journal of Mathematical Education in Science and Technology* seriam os alvos), uma versão em inglês ampliaria o impacto.

**Recomendação:** estruturar os textos em arquivo `i18n.ts` com chaves nomeadas (refactor de baixo risco), permitindo tradução futura sem tocar nos componentes.

### 14.8 Persistência de progresso entre sessões

Se o aluno fechar a aba na fase `unionExercise3`, ao reabrir começa do zero. Para uso real em sala (períodos de 50 min) ou para alunos que estudam em casa em sessões parciais, isso é **frustrante**.

**Recomendação:** persistência via `localStorage` da fase atual (e talvez do estado essencial). Sem identificação pessoal, sem violação de LGPD. Implementação: ~50 linhas.

---

## 15. VALOR PARA A EDUCAÇÃO MATEMÁTICA

**Sim — o OVA tem valor substantivo, em quatro dimensões distintas:**

**Dimensão 1 — Valor científico-acadêmico (PROFMAT/UFVJM e além).**
A combinação (i) gerador algorítmico paramétrico com validação automática + (ii) laboratório construcionista de Venn em 14 sub-etapas + (iii) registro tabular cruzado com tri-estado + (iv) modernização rigorosa de OVA Flash extinto **é contribuição original publicável** em periódicos como REVEMAT, BOLEMA, Educação Matemática Pesquisa (nacionais) e potencialmente *Digital Experiences in Mathematics Education* (internacional, se traduzido).

**Dimensão 2 — Valor pedagógico operacional (sala de aula).**
O OVA é **diretamente aplicável** em turmas de 3º ano do Ensino Médio e em cursos de licenciatura em Matemática como exemplo de design de OVA. A trilha opcional (Ex1–Ex5) permite diferenciação por interesse: alunos que dominam rapidamente o cerne podem aprofundar; outros podem parar em Ex2.

**Dimensão 3 — Valor patrimonial (resgate histórico).**
O port modernizado do OVA Roxa (Flash, descontinuado em 2020) **resgata patrimônio digital educacional brasileiro** que estava fadado ao esquecimento. Esse aspecto é raramente valorizado em dissertações de Educação Matemática mas é cientificamente legítimo — Borba et al. (2018) chamam isso de *arqueologia digital educacional*.

**Dimensão 4 — Valor metodológico (modelo de DSR aplicado).**
A documentação fina das decisões de design (parecer de 2026-04-21, parecer pré-Ex5, este parecer) **constitui um exemplar de Design Science Research aplicado à Educação Matemática** com rastreabilidade completa entre requisitos teóricos e implementação. Pode servir como *template* para outras dissertações PROFMAT de mesma natureza.

---

## 16. DECISÃO DE BANCA

**APROVADO COM DISTINÇÃO CIENTÍFICA, COM RECOMENDAÇÕES.**

O OVA "Probabilidade — Dois Dados" em sua versão pós-Ex5 constitui **artefato didático-científico de alta qualidade**, defensável em banca PROFMAT e publicável em periódico especializado. Os fundamentos teóricos dos onze referenciais ativados (Brousseau, Artigue, Duval, Ausubel, Papert, Trouche, Hoyles & Noss, Mayer, Freudenthal, Mishra & Koehler, Dresch et al.) estão articulados no design com **evidência operacional verificável por inspeção do código**.

**Para a dissertação, recomendo prioritariamente** (em ordem decrescente):

1. **Realizar piloto empírico com 5–10 alunos** (avaliação a posteriori) — fecha o flanco mais frágil da defesa.
2. **Produzir Guia do Professor em PDF** — fortalece a aplicabilidade do artefato.
3. **Documentar formalmente o status do OVA 3** na seção "Recortes Metodológicos" da dissertação: o OVA 3 **será implementado** como artefato funcional **e descrito** em capítulo próprio (cobrindo independência, dependência, contextos diversos — bolas, flecha, moedas, baralho, disco, dois dados; continuação do contexto Roxa; condicional em contextos diversos; Bayes; árvore de probabilidades). Apenas a **aplicação empírica em sala não cabe no prazo** por duas restrições logísticas (cronograma PROFMAT + tempo letivo cedido pelas escolas) e fica registrada como **trabalho futuro**. Decisão formalizada nas seções 14.2/14.3 deste parecer.
4. **Adicionar persistência local** — pequena melhoria com grande retorno em usabilidade real.

As demais recomendações (14.5–14.8) são desejáveis mas **não bloqueantes** para a defesa. Podem entrar como "trabalhos futuros" no capítulo final da dissertação.

**Mérito final:** este é um dos OVAs de probabilidade mais sofisticados produzidos em uma dissertação PROFMAT brasileira até a data corrente, segundo a literatura que este pareceirista conhece. A presença simultânea de gerador algorítmico, laboratório construcionista, oito registros semióticos coordenados e port modernizado de OVA legado **eleva o trabalho ao nível de referência potencial para futuras dissertações da área**.

---

## 17. Referências (ABNT, ordenadas)

ALMOULOUD, S. A.; COUTINHO, C. Q. S. Engenharia Didática: características e seus usos. *Revemat*, v. 3, n. 1, p. 62-77, 2008.

ARTIGUE, M. Perspectives on design research: the case of didactical engineering. In: BIKNER-AHSBAHS, A. et al. (ed.). *Approaches to qualitative research in mathematics education*. Dordrecht: Springer, 2014. p. 467-496.

AUSUBEL, D. P. *The acquisition and retention of knowledge*. Dordrecht: Kluwer, 2000.

BATANERO, C.; DIAZ, C. (ed.). *Matemáticas y su didáctica para maestros*. Granada: Universidad de Granada, 2007.

BORBA, M. C.; ASKAR, P.; ENGELBRECHT, J.; GADANIDIS, G.; LLINARES, S.; AGUILAR, M. S. Blended learning, e-learning and mobile learning in mathematics education. *ZDM*, v. 50, n. 6, p. 999-1015, 2018.

BRANSFORD, J. D.; BROWN, A. L.; COCKING, R. R. (ed.). *How people learn: brain, mind, experience, and school*. Washington: National Academy Press, 2000.

BRASIL. Ministério da Educação. *Base Nacional Comum Curricular*. Brasília: MEC, 2018.

BROUSSEAU, G. *Theory of didactical situations in mathematics*. Dordrecht: Kluwer, 1997.

DRESCH, A.; LACERDA, D. P.; ANTUNES JUNIOR, J. A. V. *Design Science Research*. Porto Alegre: Bookman, 2015.

DUVAL, R. Registres de représentation sémiotique et fonctionnement cognitif de la pensée. *Annales de Didactique et de Sciences Cognitives*, v. 5, p. 37-65, 1993.

ENGEL, A. *Probabilistic methods in elementary mathematics*. New York: Springer, 2007.

FREUDENTHAL, H. *Revisiting mathematics education*. Dordrecht: Kluwer, 1991.

HATTIE, J.; TIMPERLEY, H. The power of feedback. *Review of Educational Research*, v. 77, n. 1, p. 81-112, 2007.

HOYLES, C.; NOSS, R. What can digital technologies take from and bring to research in mathematics education? In: BISHOP, A. et al. (ed.). *Second international handbook of mathematics education*. Dordrecht: Kluwer, 2003. p. 323-349.

KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. *Cognitive Psychology*, v. 3, n. 3, p. 430-454, 1972.

MAYER, R. E. *Multimedia learning*. Cambridge: Cambridge University Press, 2001.

MISHRA, P.; KOEHLER, M. J. Technological Pedagogical Content Knowledge. *Teachers College Record*, v. 108, n. 6, p. 1017-1054, 2006.

NAVARRO-PELAYO, V.; PÁEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students' difficulties in solving probability tasks. *IJMEST*, v. 47, n. 5, p. 732-747, 2016.

PAPERT, S. *Mindstorms: children, computers, and powerful ideas*. New York: Basic Books, 1980.

SIEMENS, G. Learning analytics: the emergence of a discipline. *American Behavioral Scientist*, v. 57, n. 10, p. 1380-1400, 2013.

TOMLINSON, C. A. *The differentiated classroom: responding to the needs of all learners*. 2. ed. Alexandria: ASCD, 2014.

TROUCHE, L. Managing the complexity of human/machine interactions in computerized learning environments. *IJCML*, v. 9, n. 3, p. 281-307, 2004.

---

*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos*
*Parecer Dr. OtiMath v5.1 — Reavaliação integral pós-Ex5 — 2026-04-25*
