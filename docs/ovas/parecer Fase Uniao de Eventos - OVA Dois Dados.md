# PARECER DR. OTIMATH — FASE `unionTheory` DO OVA DOIS DADOS

**Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos**
*"Explorando o Acaso: uma sequência didática interativa para o ensino de Probabilidade no Ensino Médio"*

**Protocolo:** Dr. OtiMath v5.1 | **Data:** 2026-04-18
**Objeto:** Componente `UnionProbabilityTheory` (Cena 7, sub-fase `unionTheory`)
**Arquivo fonte:** [src/components/teaching/probability/two-dices/UnionProbabilityTheory.tsx](../../src/components/teaching/probability/two-dices/UnionProbabilityTheory.tsx) (3019 linhas)
**Finalidade do parecer:** Avaliação preparatória para a transição à fase subsequente — **exercícios dinâmicos** e **exemplos dinâmicos** da probabilidade da união.

---

## 1. Identificação (Fase 0 — Varredura)

A fase analisada aborda o **Tópico 7 — Probabilidade da União e Adição de Probabilidades** da taxonomia do protocolo, com dependência estrutural do **Tópico 6** (operações sobre eventos) e pressuposição consolidada do **Tópico 3** (Laplace) e do **Tópico 2** (espaço amostral). O objeto de aprendizagem endereça as habilidades EM13MAT305 e EM13MAT405 da BNCC (BRASIL, 2018). A situação é construída sobre o lançamento simultâneo de dois dados equilibrados — espaço amostral de 36 pares ordenados equiprováveis —, e a progressão didática foi desenhada em três macro-etapas: contagem por ação, probabilidade por Laplace direto e descoberta da fórmula geral P(A ∪ B) = P(A) + P(B) − P(A ∩ B).

Os vieses cognitivos explicitamente endereçados pelo design, conforme o mapeamento do protocolo, incluem a **heurística aditiva simplificada** — "somar probabilidades sem considerar interseção" (V7.1, KAHNEMAN; TVERSKY, 1972, p. 432) —, a **generalização inadequada da exclusão** — "aplicar a regra de exclusivos em eventos não exclusivos" (V7.2, BATANERO; DIAZ, 2007, p. 125) —, a **confusão semântica entre "ou" inclusivo e exclusivo** (V6.1, BATANERO; DIAZ, 2007, p. 123) e a **supercontagem/subcontagem** combinatória (V14.4, NAVARRO-PELAYO et al., 2016, p. 736). A ancoragem em conhecimento prévio (R7) é feita sobre o OVA antecedente do Disco Probabilístico — no qual o aluno consolidou a regra da adição para eventos mutuamente exclusivos —, operando o que Ausubel (2000, p. ix) descreve como aprendizagem significativa por subsunção.

---

## 2. Mapa da sequência pedagógica (Fase 1 — Análise de conteúdo)

A implementação atual contempla **25 sub-fases de estado** distribuídas em três macro-etapas visualmente sinalizadas pelo componente `MacroProgressIndicator` (linhas 2983–3019). A sequência é linear, com um único redirecionamento metacognitivo do estado `predict` para `enumDisplay` antes da confirmação (linhas 517–528). A persistência de conhecimento entre rodadas é controlada por um sistema de três rodadas progressivamente mais sutis (linhas 115–127), com categorias `intro`, `strong_overlap`, `small_intersection`, `central_overlap` e `inclusion`, o que configura uma autêntica **variável didática** no sentido de Artigue — variações controladas do problema que forçam o aluno a reorganizar estratégias (ARTIGUE, 2014, p. 477).

### 2.1 Macro 1 — Contagem por ação (`intro` → `enumDisplay`)

A macro-etapa abre com o estado `intro` (linhas 847–922), no qual um texto problematizador apresenta um exemplo dinâmico do par ordenado que pertence simultaneamente a A e a B — uma antecipação concreta da interseção antes de sua definição formal. Em seguida, os estados `markA`, `countA`, `markB`, `countB`, `markIntersection` e `countIntersection` intercalam **ação de marcação** (toggle de checkbox em tabela 6×6) e **contagem numérica** (input de cardinalidade com validação). Entre os pares de marcação, intercala-se o estado `defineIntersection` — institucionalização parcial da definição de A ∩ B antes da marcação do conjunto. Ao final da contagem, o estado `enumDisplay` (linhas 1203–1325) promove a **conversão entre registros semióticos** na acepção de Duval (1993, p. 45): a enumeração verbal dos três conjuntos — A, B, A ∩ B — é apresentada com destaque cromático dourado nos elementos de A ∩ B piscando dentro de A e dentro de B, tornando visível a propriedade estrutural de que um par da interseção aparece duas vezes. O estado fecha com `synthM1`, síntese parcial dos três valores contados. Cada transição da marcação à contagem depende da validação correta da marcação — configurando uma situação a-didática no sentido de Brousseau (1997, p. 30) em que o milieu (tabela + feedback) devolve retornos sem intervenção do professor.

### 2.2 Macro 2 — Probabilidade por Laplace direto (`defineUnion` → `probTransfer`)

A macro-etapa começa com a definição verbal de A ∪ B (`defineUnion`), segue com a marcação interativa `markUnion` — na qual A, B e A ∩ B aparecem congelados como informações de fundo —, avança para `countUnion` (contagem de n(A ∪ B)) e culmina em `probTransfer` (linhas 2081–2417), a tela central desta macro. Nesta tela, a probabilidade é calculada diretamente como quociente de Laplace P(A ∪ B) = n(A ∪ B)/36, com resolução animada em passos — uma legenda por vez (n(A ∪ B), n(S), P(A ∪ B)) aparece com fade-in lateral e seta colorida apontando para o componente correspondente da fração. A construção respeita a arquitetura de canais duplos da Teoria Cognitiva da Aprendizagem Multimídia (MAYER, 2001, p. 63): o registro algébrico (fração estruturada verticalmente) e o registro verbal (legenda em prosa) aparecem simultaneamente mas não sobrepostos, reduzindo a carga cognitiva extrínseca. Após acerto, o valor é apresentado simultaneamente em três registros equivalentes — fração, decimal e percentual —, consolidando a conversão entre representações numéricas que Duval (1993, p. 52) identifica como indicador de aprendizagem genuína.

Observa-se aqui uma decisão deliberada de engenharia didática, explicitamente documentada no comentário do código (linhas 385–389): a reordenação que antecipa o cálculo direto por Laplace antes da descoberta da fórmula. Essa escolha transforma Laplace em **rota estabelecida** que servirá de contraprova para a fórmula geral na macro seguinte. A estrutura cumpre o princípio brousseauniano segundo o qual a fórmula só se torna necessária quando o estudante percebe que a soma direta leva a contradições (BROUSSEAU, 1997, p. 22).

### 2.3 Macro 3 — Descoberta da fórmula geral (`synthM2` → `done`)

A macro-etapa final abre com `synthM2` — ponte pedagógica entre o cálculo por Laplace e a investigação da fórmula algébrica. O texto evoca explicitamente o OVA do Disco ("P(A ∪ B) = P(A) + P(B) para eventos mutuamente exclusivos") e lança o obstáculo: "porém, no nosso problema A ∩ B não é vazio. Será que essa fórmula ainda funciona?" — formulação que corresponde precisamente à situação fundamental de Brousseau para o tópico T7 (descrita no protocolo como "o estudante percebe que a soma simples gera resultados acima de 1 ou inconsistentes com a contagem direta").

Segue-se a fase `predict` (linhas 1464–1527), na qual o aluno marca dois radio-groups metacognitivos: prevê se n(A) + n(B) é maior, igual ou menor que n(A ∪ B), e justifica a escolha. Tão logo os dois radios estejam preenchidos, o sistema executa um **redirecionamento programado** para `enumDisplay` (linhas 517–528) que obriga o aluno a revisitar a evidência visual dos três conjuntos enumerados com o dourado piscando — um dispositivo metacognitivo cuja finalidade, plenamente alinhada à função do milieu em Brousseau (1997, p. 30), é submeter a previsão à verificação antes de confirmá-la. O botão "Voltar para confirmar previsão" devolve o aluno ao `predict` e, dali, avança-se a `sumCompareVisual`.

Em `sumCompareVisual` (linhas 1529–1607), o aluno calcula n(A) + n(B) e, após acerto, é apresentado a uma **barra empilhada** que contrasta visualmente a soma estequiométrica (barra de n(A) + n(B)) com a cardinalidade real da união (barra de n(A ∪ B)), sobrepondo um padrão listrado vermelho que materializa a diferença. O texto abaixo da barra nomeia explicitamente a relação 2n(A ∩ B) − n(A ∩ B) = n(A ∩ B) como a quantidade que foi contada duas vezes — endereçamento direto de V7.1 (KAHNEMAN; TVERSKY, 1972, p. 432). Um seletor de operador (>, =, <) completa a confrontação numérica: o aluno só avança se identificar corretamente que n(A) + n(B) > n(A ∪ B).

O estado `formulaReveal` institucionaliza a identidade de cardinalidade n(A ∪ B) = n(A) + n(B) − n(A ∩ B), seguido por `probCalc` — no qual o aluno calcula P(A), P(B) e P(A ∩ B) individualmente, com validação por fração equivalente (R14, linhas 727–733) — e pelo `probFormulaReveal`, implementado como animação de derivação algébrica em nove passos (linhas 2509–2798) com piscar sincronizado entre o bloco "Sabemos que" (pré-requisitos algébricos) e as linhas da dedução. O piscar respeita `prefers-reduced-motion`, atendendo WCAG 2.1 e ao princípio de coerência da TCAM (MAYER, 2001, p. 98). As telas `probFormulaApply` e `probFormulaVerify` aplicam a fórmula aos valores concretos do problema e confrontam o resultado com o valor obtido por Laplace direto, explicitando que "duas rotas levam ao mesmo resultado"; a mesma tela apresenta a nota de **generalização** — "quando A ∩ B = ∅, P(A ∩ B) = 0 e a fórmula se reduz à do Disco" — articulando a nova fórmula com o conhecimento prévio em movimento diferenciado de subsunção (AUSUBEL, 2000, p. 70). A institucionalização formal ocorre em `institucionalize`: múltipla escolha entre quatro fórmulas (a correta e três distratoras, incluindo P(A) × P(B) — que antecipa V10.1, confusão exclusão/independência — e P(A) − P(B) + P(A ∩ B)).

---

## 3. Parecer científico (Fase 2)

### 3.1 O que está consolidado

O primeiro ponto forte é a construção exemplar de uma **situação fundamental** na acepção de Brousseau (1997, p. 30). A fórmula geral P(A ∪ B) = P(A) + P(B) − P(A ∩ B) não é apresentada como convenção a ser decorada, mas emerge como *resposta* a um obstáculo epistemológico cuidadosamente plantado: o aluno é forçado a perceber, por evidência visual e verificação numérica, que somar diretamente n(A) + n(B) leva a um valor maior que n(A ∪ B) — exatamente o viés V7.1 descrito por Kahneman e Tversky (1972, p. 432). O *design* coincide com o que Freudenthal (1991, p. 14) chamaria de matemática como atividade: o estudante não recebe a fórmula, ele a produz como consequência lógica da dupla contagem que acabou de constatar.

Um segundo ponto forte reside na **articulação sistemática entre registros semióticos** na acepção de Duval (1993, p. 45, 52). A sequência faz o conteúdo circular entre pelo menos seis registros distintos: verbal em linguagem natural ("a soma é maior que 7"), tabular bidimensional (tabela 6×6), enumeração simbólica ({(3,5), (4,4), ...}), algébrico (n(A ∪ B) = n(A) + n(B) − n(A ∩ B)), fracionário (n/36), decimal e percentual. Cada transição entre registros é explícita e ocorre em momentos pedagogicamente motivados — a tabela permite a contagem, a enumeração permite a comparação cromática, o algébrico permite a generalização, as três formas equivalentes da probabilidade permitem a leitura contextual do valor.

Um terceiro ponto forte é a presença de **metacognição estruturalmente integrada** à sequência. A fase `predict` não é decorativa: ela captura a previsão do aluno sobre a relação entre n(A) + n(B) e n(A ∪ B) e, imediatamente após ambos os radios serem marcados, redireciona o aluno à visualização cromática dos três conjuntos (`enumDisplay`) — forçando a revisitação da evidência antes da confirmação. Esse dispositivo opera o que Brousseau (1997, p. 88) descreve como fase de *validação* por confronto com o milieu. A reflexão sobre a própria previsão antes da verificação numérica constitui exatamente o tipo de processamento ativo de significado que Mayer (2001, p. 63) identifica como precondição para aprendizagem significativa em recursos multimídia.

Um quarto ponto forte — e este só faz sentido pela mediação digital — é o uso do **congelamento sincrônico** e do **destaque cromático persistente**. Quando o aluno marca B, as células já marcadas em A aparecem com checkbox "congelado" (componente `FrozenCheckbox`, linhas 232–256) mantendo a cor do evento original e a rotulação "A" visível em cada célula; após a atualização de hoje, o cursor exibe `not-allowed` sobre essas marcações congeladas. Esse recurso é *impossível de reproduzir em papel* — é um exemplo canônico do que Hoyles e Noss (2003, p. 335) nomeiam como mediação digital que **reestrutura** o que pode ser aprendido, não apenas transporta o conteúdo tradicional para outra mídia. A persistência visual dos conjuntos já trabalhados transforma a tabela em um instrumento no sentido de Trouche (2004, p. 285): a ferramenta não é neutra; ela induz o aluno a ver cada célula como potencial elemento simultâneo de múltiplos conjuntos.

Um quinto ponto forte é a **arquitetura TPACK** (MISHRA; KOEHLER, 2006, p. 1025). O conteúdo probabilístico (CK) é rigoroso; a pedagogia (PK) articula Brousseau, Ausubel e Freudenthal em decisões de ordem das sub-fases; a tecnologia (TK) é usada com intencionalidade — cada recurso digital (checkbox congelado, dourado piscante, barra empilhada com padrão listrado, animação de derivação com flash sincronizado, conversão automática fração→decimal→percentual) existe *porque o conteúdo exige*. Não há efeito decorativo. O critério de excelência TPACK está atendido: a tecnologia só faz sentido com este conteúdo; a pedagogia aproveita o que a tecnologia permite e não seria possível sem ela; e conteúdo, pedagogia e tecnologia se reforçam mutuamente.

Um sexto ponto forte é a **engenharia de variáveis didáticas** sobre três rodadas. A rodada 1 usa obrigatoriamente o par P1A ou P1B — categoria `intro`, com sobreposição intuitiva ("soma > 7" e "soma par"). A rodada 2 sorteia entre `strong_overlap`, `small_intersection` e `central_overlap` — variações em que a razão n(A ∩ B)/n(A ∪ B) se move em direções diferentes, submetendo a fórmula a testes distintos. A rodada 3 privilegia `inclusion` (caso-limite B ⊆ A, em que n(A ∩ B) = n(B)), configurando o que Artigue descreve como variação controlada que força a reorganização da estratégia sem invalidar a fórmula. Esta é uma autêntica análise a priori encarnada no código.

Um sétimo ponto forte é o **endereçamento construcionista** (PAPERT, 1980, p. 111): o aluno não apenas segue uma explicação — ele *constrói* cada conjunto marcando células, e a fórmula emerge como consequência da construção. O sistema de validação que aceita marcação "incompleta" com som de correto mas feedback de "ainda faltam pares" (linhas 937–940, 1019–1022) permite construção iterativa sem penalização rígida — o aluno refina a própria obra.

Um oitavo ponto forte é a **validação de frações equivalentes** (R14, linhas 727–733), que libera o aluno de reduzir mentalmente a forma canônica para atender o sistema; 15/36, 5/12 e 10/24 são todas aceitas. Esta decisão preserva a autonomia representacional e evita a situação pedagogicamente danosa de rejeitar uma resposta matematicamente correta por motivo técnico.

### 3.2 O que precisa melhorar antes da fase de exercícios

Embora o parecer reconheça a robustez científica da fase, sete pontos específicos demandam endereçamento antes ou durante a implementação da fase de exercícios dinâmicos.

**Ponto 1 — Contexto único (soma de dois dados).** A totalidade dos dez pares de eventos do banco `EVENT_PAIRS` (linhas 57–113) refere-se à soma de dois dados. Esta escolha é coerente com a Cena 7 e foi didaticamente necessária para manter a continuidade com o experimento, mas implica um risco de **transferência contextual limitada** (DUVAL, 1993, p. 52): o aluno pode consolidar a fórmula como propriedade intrínseca do experimento "dois dados" em vez de como invariante estrutural da probabilidade. A fase seguinte deve quebrar este contrato com contextos variados (cartas, urnas, perfis de alunos, dados distintos, roleta).

**Ponto 2 — Institucionalização frágil.** O estado `institucionalize` (linhas 1785–1837) é hoje uma múltipla escolha entre quatro fórmulas. A escolha da distratora P(A) × P(B) é excelente (antecipa V10.1), e a distratora P(A) − P(B) + P(A ∩ B) testa a compreensão estrutural. Contudo, Brousseau (1997, p. 88) define a institucionalização como momento no qual o saber pessoal construído pelo aluno é **elevado à condição de saber cultural compartilhado**, o que requer registro escrito e argumentação. A múltipla escolha é um instrumento de verificação; não é institucionalização completa. Sugere-se complementar com um campo aberto — "Em suas palavras, explique por que precisamos subtrair P(A ∩ B)" — registrado para avaliação do professor.

**Ponto 3 — Caso mutuamente exclusivo não é *experimentado* dentro da sequência.** A generalização do Disco — "quando A ∩ B = ∅, a fórmula geral se reduz à fórmula particular" — é apresentada textualmente em `probFormulaVerify` (linhas 2949–2967), mas nenhum dos dez pares do banco produz interseção vazia. O aluno nunca *vê*, dentro desta fase, o caso-limite em que P(A ∩ B) = 0 e a fórmula geral se degenera na do Disco. Do ponto de vista da Engenharia Didática, a ausência deste caso obriga o aluno a aceitar a generalização por fé textual, não por experiência. Recomenda-se incluir pelo menos um par com A ∩ B = ∅ (por exemplo, "A: a soma é par" e "B: a soma é ímpar") que sirva como verificação empírica da generalização na rodada 3 ou como primeiro exemplo resolvido da fase seguinte de exercícios.

**Ponto 4 — Ausência de registro escrito aberto.** Nenhum campo da sequência atual aceita resposta livre do aluno em prosa. Todas as entradas são números, checkboxes ou radios. Vygotsky (1991, p. 43) nos lembra que a verbalização escrita é mediadora da organização do pensamento; Freudenthal (1991, p. 39) defende o registro como *produto da atividade matemática*. Dissertativa breve no `institucionalize` (ver Ponto 2) e/ou em um estado opcional "diário de bordo" da rodada endereçaria esta lacuna.

**Ponto 5 — Feedback sonoro ambíguo em marcação incompleta.** Nos estados `markA`, `markB`, `markIntersection` e `markUnion`, o feedback "incomplete" (todas as marcações corretas, mas faltam pares) é acompanhado do som `/sounds/correct.mp3` (linhas 541, 566, 591, 665). A mensagem textual diz "Correto! Mas ainda não terminou". O som positivo pode ser interpretado como sinal de conclusão, não de validação parcial — conflito semântico documentado no design de feedback multimídia (MAYER, 2014, cap. 5). Solução de baixo custo: usar `nextChallenge.mp3` (som neutro de progresso) para o caso incompleto, reservando `correct.mp3` para acerto pleno.

**Ponto 6 — Transferência restrita entre representações contextuais.** A fase opera sobre registro tabular (tabela 6×6 cartesiana) e registro de listagem. Ausente o diagrama de Venn — registro canônico da teoria de conjuntos que Duval (1993, p. 52) trata como registro ideal para operações de união e interseção. Mesmo que a tabela seja superior para *contagem* em espaços equiprováveis, Venn é superior para *visualização estrutural* das relações entre A e B. Sugere-se inserir um Venn esquemático em `synthM1` ou `enumDisplay` que sintetize graficamente o que a tabela mostra por marcações.

**Ponto 7 — Tratamento da resposta "n(A ∪ B) < n(A) + n(B)" pela razão "menor".** O código aceita qualquer combinação de previsão em `predict` como metacognitivamente válida (linhas 684–694, comentário "A previsão é metacognitiva — qualquer resposta é aceita, apenas registra"). Do ponto de vista didático, isso é defensável — a previsão é coleta de concepção espontânea, não avaliação. Contudo, o aluno que prevê "menor: acho que a união tem menos pares que a soma" está exercitando uma intuição correta (n(A ∪ B) ≤ n(A) + n(B)) mas justificada por razão errada ("união tem menos elementos"). A `sumCompareVisual` contestará implicitamente essa justificativa, mas nenhuma tela trata diretamente da confusão subjacente. Avaliar se cabe uma mensagem de retorno específica.

### 3.3 Mapa de endereçamento de vieses

| Código | Viés | Endereçamento na fase | Grau |
|--------|------|------------------------|------|
| V6.1 | "ou" inclusivo/exclusivo (BATANERO; DIAZ, 2007, p. 123) | `defineUnion` define explicitamente "pelo menos um" | Completo |
| V6.2 | Ambiguidade semântica "e"/"ou" (idem) | `markIntersection` e `markUnion` com linguagem explícita | Completo |
| V6.3 | Heurística aditiva simples (KAHNEMAN; TVERSKY, 1972, p. 432) | Ver V7.1 | — |
| V7.1 | P(A ∪ B) = P(A) + P(B) sem subtrair ∩ (idem) | Núcleo da macro 3 — barra empilhada, fórmula, verificação | Completo |
| V7.2 | Generalização inadequada da exclusão (BATANERO; DIAZ, 2007, p. 125) | `synthM2` problematiza; `probFormulaVerify` generaliza | Parcial — ver Ponto 3 |
| V14.4 | Supercontagem/subcontagem (NAVARRO-PELAYO et al., 2016, p. 736) | Dourado piscante em `enumDisplay` tematiza a dupla contagem | Completo |

---

## 4. Requisitos para a próxima fase (Fase 3 — Propostas)

### 4.1 Exercícios dinâmicos — requisitos de design

A fase de exercícios deve operar, na acepção de Trouche (2004, p. 285), a transição da **instrumentação** (o aluno usa a tabela como andaime para contar) para a **instrumentalização** (o aluno aplica a fórmula sem precisar da tabela). O princípio arquitetural é: os exercícios exigem autonomia representacional crescente. Do ponto de vista de requisitos concretos, recomendam-se sete:

**Req-E1. Variação de contexto.** Um banco mínimo de dez exercícios distribuídos em pelo menos quatro contextos (dados diferentes do 2d6, urnas, cartas, perfis de alunos de uma turma). Cada contexto deve trazer seu espaço amostral explícito na enunciação, evitando que o aluno generalize o 36 como invariante.

**Req-E2. Cobertura de casos estruturais.** Obrigatoriamente incluir ao menos um caso com A ∩ B = ∅ (mutuamente exclusivos — validação da generalização do Disco), um com A ⊂ B, um com B ⊂ A, e pelo menos três com sobreposição parcial.

**Req-E3. Dupla rota opcional.** Cada exercício deve permitir ao aluno escolher entre resolver por Laplace direto (se conseguir enumerar A ∪ B) ou pela fórmula geral (se conseguir identificar A, B e A ∩ B separadamente). O sistema confere pelos dois caminhos e sinaliza quando as rotas convergem — sustentando pedagogicamente o insight de `probFormulaVerify`.

**Req-E4. Feedback diagnóstico orientado por viés.** Quando o aluno responde P(A) + P(B) sem subtrair, a resposta de retorno não deve ser genérica ("incorreto"), mas específica: "Observe — dois eventos podem compartilhar resultados. Você somou, mas alguns foram contados duas vezes. Identifique A ∩ B". Ataque direto a V7.1.

**Req-E5. Validação de frações equivalentes.** Reaproveitar `isEquivalentFraction` (R14) — decisão já consolidada e alinhada à prática de Educação Matemática.

**Req-E6. Retirada gradual do andaime.** Os três primeiros exercícios oferecem a tabela 6×6 preenchível (instrumentação); os três seguintes oferecem apenas enunciado + caixas para P(A), P(B), P(A ∩ B) e P(A ∪ B) (instrumentalização parcial); os últimos oferecem apenas enunciado + caixa para P(A ∪ B), exigindo que o aluno conduza a decomposição por conta própria (instrumentalização plena).

**Req-E7. Registro de dificuldade.** Capturar, por exercício, se o aluno chegou na primeira tentativa, após dica, após erro, ou não resolveu. Dados valiosos para a avaliação a posteriori prevista pela DSR (ALMOULOUD; COUTINHO, 2008, p. 69).

### 4.2 Exemplos dinâmicos — requisitos de design

Os exemplos, ao contrário dos exercícios, não exigem que o aluno produza a resposta — eles *mostram* resoluções completas para consolidar padrões. Quatro requisitos:

**Req-X1. Dois exemplos de casos distintos.** Um exemplo com A ∩ B = ∅ (caso do Disco, reduzindo para P(A) + P(B)) e um exemplo com A ∩ B ≠ ∅ (fórmula geral completa). Ambos acompanhados de Venn + tabela, reforçando a conversão entre registros (DUVAL, 1993, p. 45).

**Req-X2. Apresentação passo a passo com controle do aluno.** O exemplo desenrola-se com botão "próximo passo" — nunca automaticamente —, honrando o princípio de segmentação da TCAM (MAYER, 2001, p. 120).

**Req-X3. Narração pedagógica em prosa.** Cada passo do exemplo é acompanhado de uma frase que explicita a *razão* da operação — "subtraímos P(A ∩ B) porque esses resultados foram contados em P(A) e também em P(B)" —, não apenas a mecânica.

**Req-X4. Calculadora interativa.** Um componente acessório em que o aluno ajusta n(A), n(B), n(A ∩ B) e n(S) por *sliders* ou *inputs* e vê imediatamente P(A ∪ B) atualizar, com diagrama de Venn redimensionado proporcionalmente. Esta ferramenta é um *exemplo dinâmico* no sentido pleno — ela transforma o aluno em construtor de infinitos exemplos. Construcionismo puro (PAPERT, 1980, p. 111) e genuína extensão do pensamento matemático pela tecnologia (BORBA; SCUCUGLIA; GADANIDIS, 2014, p. 28).

### 4.3 Viabilidade escolar (R13)

Todas as propostas acima são realizáveis em HTML5 + React + Tailwind puro sem WebGL, sem bibliotecas pesadas — atendendo o *checklist* de viabilidade de escolas públicas brasileiras. O único ponto de atenção é o Venn dinâmico, que deve ser implementado em SVG com geometria circular simples (não em Three.js ou D3 com *force layout*), para garantir execução em hardware de 4 GB RAM.

---

## 5. Decisão de banca (Fase 6 — Relatório executivo)

**Parecer:** A fase `unionTheory` do OVA Dois Dados é considerada **aprovada com ressalvas menores** para transição à fase seguinte de exercícios dinâmicos e exemplos dinâmicos. Os fundamentos teóricos — TSD, Engenharia Didática, Duval, Ausubel, Papert, Trouche, Hoyles, Mayer, Freudenthal — estão articulados no design com evidência operacional clara, não decorativa. Os vieses cognitivos mapeados pelo protocolo (V6.1, V6.2, V7.1, V14.4) estão completamente endereçados; V7.2 requer o complemento do caso mutuamente exclusivo dentro da própria sequência (Ponto 3) ou na abertura da fase de exercícios. Os sete pontos de melhoria identificados não invalidam a fase atual, mas condicionam a robustez científica e pedagógica da fase seguinte. Recomenda-se que o Ponto 5 (som ambíguo em "incomplete") seja corrigido imediatamente — é correção de baixo custo e alto retorno —, e que o Ponto 3 (inclusão de caso com A ∩ B = ∅) seja implementado como parte do primeiro exemplo dinâmico da próxima fase, o que resolve ambos os problemas simultaneamente.

---

## 6. Referências

ALMOULOUD, S. A.; COUTINHO, C. Q. S. Engenharia Didática: características e seus usos em trabalhos apresentados no GT-19/ANPEd. *Revemat*, v. 3, n. 1, p. 62-77, 2008.

ARTIGUE, M. Perspectives on design research: the case of didactical engineering. In: BIKNER-AHSBAHS, A. et al. (ed.). *Approaches to qualitative research in mathematics education*. Dordrecht: Springer, 2014. p. 467-496.

AUSUBEL, D. P. *The acquisition and retention of knowledge*. Dordrecht: Kluwer, 2000.

BATANERO, C.; DIAZ, C. (ed.). *Matemáticas y su didáctica para maestros*. Granada: Universidad de Granada, 2007.

BORBA, M. C.; SCUCUGLIA, R.; GADANIDIS, G. *Fases das tecnologias digitais em Educação Matemática*. 2. ed. Belo Horizonte: Autêntica, 2014.

BRASIL. Ministério da Educação. *Base Nacional Comum Curricular*. Brasília: MEC, 2018.

BROUSSEAU, G. *Theory of didactical situations in mathematics*. Dordrecht: Kluwer, 1997.

DUVAL, R. Registres de représentation sémiotique et fonctionnement cognitif de la pensée. *Annales de Didactique et de Sciences Cognitives*, v. 5, p. 37-65, 1993.

FREUDENTHAL, H. *Revisiting mathematics education*. Dordrecht: Kluwer, 1991.

HOYLES, C.; NOSS, R. What can digital technologies take from and bring to research in mathematics education? In: BISHOP, A. et al. (ed.). *Second international handbook of mathematics education*. Dordrecht: Kluwer, 2003. p. 323-349.

KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. *Cognitive Psychology*, v. 3, n. 3, p. 430-454, 1972.

MAYER, R. E. *Multimedia learning*. Cambridge: Cambridge University Press, 2001.

MAYER, R. E. (ed.). *The Cambridge handbook of multimedia learning*. 2. ed. Cambridge: Cambridge University Press, 2014.

MISHRA, P.; KOEHLER, M. J. Technological Pedagogical Content Knowledge. *Teachers College Record*, v. 108, n. 6, p. 1017-1054, 2006.

NAVARRO-PELAYO, V.; PÁEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students' difficulties in solving probability tasks. *IJMEST*, v. 47, n. 5, p. 732-747, 2016.

PAPERT, S. *Mindstorms: children, computers, and powerful ideas*. New York: Basic Books, 1980.

TROUCHE, L. Managing the complexity of human/machine interactions in computerized learning environments. *IJCML*, v. 9, n. 3, p. 281-307, 2004.

VYGOTSKY, L. S. *A formação social da mente*. 4. ed. São Paulo: Martins Fontes, 1991.

---

*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos*
*Parecer Dr. OtiMath v5.1 — 2026-04-18*
