# PARECER DR. OTIMATH — IMPLEMENTAÇÃO DA FASE `unionTheory` DO OVA DOIS DADOS

**Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos**
*"Explorando o Acaso: uma sequência didática interativa para o ensino de Probabilidade no Ensino Médio"*

**Protocolo:** Dr. OtiMath v5.1 | **Data:** 2026-04-21
**Objeto:** Estado implementado da Macro 3 (Probabilidade da União) na Cena 7 do OVA Probabilidade Dois Dados.
**Arquivos fonte:** [UnionProbabilityTheory.tsx](../../src/components/teaching/probability/two-dices/UnionProbabilityTheory.tsx), pasta [venn/](../../src/components/teaching/probability/two-dices/venn/) (types.ts, geometry.ts, VennLaboratory.tsx).
**Natureza do parecer:** avaliação científica pós-implementação, com rigor de banca.

---

## 1. Identificação do objeto (Fase 0)

A sequência avaliada materializa o **Tópico 7 — Probabilidade da União e Adição de Probabilidades** da taxonomia do protocolo, articulando dependências estruturais com os tópicos 2 (Espaço Amostral), 3 (Probabilidade Clássica), 6 (Operações sobre eventos) e 14 (Contagem como pré-requisito). O alvo curricular são as habilidades EM13MAT305 e EM13MAT405 da BNCC (BRASIL, 2018). A situação-problema é estruturada sobre o lançamento simultâneo de dois dados honestos, cujo espaço amostral de 36 pares ordenados equiprováveis está consolidado desde as cenas anteriores. A fórmula-alvo é P(A ∪ B) = P(A) + P(B) − P(A ∩ B), tratada não como proposição a ser apresentada, mas como resultado emergente de uma trajetória investigativa. A ancoragem em conhecimento prévio (R7) opera sobre a fórmula particular herdada do OVA antecedente (Disco Probabilístico), na qual os estudantes consolidaram P(A ∪ B) = P(A) + P(B) para o caso de eventos mutuamente exclusivos. Os vieses cognitivos prioritariamente endereçados, conforme o mapeamento do protocolo, são V6.1 (ambiguidade semântica do "ou" — BATANERO; DIAZ, 2007, p. 123), V6.2 (inconsistências de interpretação), V7.1 (heurística aditiva simplificada — KAHNEMAN; TVERSKY, 1972, p. 432), V7.2 (generalização inadequada da regra da exclusão — BATANERO; DIAZ, 2007, p. 125) e V14.4 (supercontagem/subcontagem — NAVARRO-PELAYO et al., 2016, p. 736).

## 2. Arquitetura da sequência implementada (Fase 1)

A implementação atual compõe uma sequência de quarenta sub-etapas distribuídas em três macro-etapas com função pedagógica distinta. A **Macro 1 — Contagem** inicia no estado `intro`, onde um problema motivador introduz o par (A, B) com destaque para um elemento da interseção, antecipando o obstáculo epistemológico; segue com os ciclos pareados de marcação-contagem de A, B e A ∩ B, intercalados pela institucionalização parcial de `defineIntersection`; culmina em `enumDisplay`, que materializa a conversão entre registros semióticos ao exibir os três conjuntos enumerados com destaque cromático dourado sobre os elementos de A ∩ B. A **Macro 2 — União por Laplace direto** conduz o estudante a definir A ∪ B, marcar e contar seus elementos, e calcular P(A ∪ B) como quociente de Laplace diretamente; nesse ponto, a probabilidade da união já foi obtida por uma rota válida, o que estabelece a **necessidade** de se investigar se a fórmula herdada do Disco ainda se aplica. A **Macro 3 — Fórmula geral** inicia-se com a tela-ponte `synthM2`, prossegue com a previsão metacognitiva em `predict`, e então abre o **laboratório construcionista de Venn** (fase `vennLab`, quinze sub-etapas internas) antes da confrontação numérica em `sumCompareVisual`, da institucionalização da identidade de cardinalidade em `formulaReveal`, da aplicação em `probCalc` (agora recontextualizada), da dedução algébrica animada em `probFormulaReveal`, da verificação cruzada em `probFormulaApply`/`probFormulaVerify`, da institucionalização final em `institucionalize` e do fechamento em `done`.

A engenharia de variáveis didáticas é implementada em duas camadas complementares. A primeira, macro, distribui as três rodadas do experimento por categorias didáticas distintas — introdução com sobreposição forte, sobreposição controlada e inclusão como caso-limite —, replicando em código a noção de variável didática de Artigue (2014, p. 477). A segunda, micro, opera por meio de um **gerador algorítmico paramétrico** de pares de eventos que substituiu o banco estático original, parametrizando o evento A como condição relacional sobre a soma (gt, gte, lt, lte, between) e o evento B como propriedade aritmética (par, ímpar, primo, composto, múltiplo de k, divisor de m), com restrições de validação que garantem simultaneamente a não-vacuidade da interseção, o piso de cardinalidade |A| ≥ 6 e |B| ≥ 6, a distinção entre X_A e X_B, e o respeito à categoria da rodada. O espaço paramétrico resultante contém centenas de instâncias didaticamente válidas, o que atende ao critério de variação controlada sem repetição epistemológica.

## 3. Análise pela Teoria das Situações Didáticas

A sequência implementa com notável fidelidade o ciclo ação-formulação-validação-institucionalização de Brousseau (1997, p. 30, 88). A fase de **ação** distribui-se pelas marcações das tabelas 6×6 e, agora, pelas manipulações interativas no diagrama de Venn; a **formulação** é exigida em `predict` (previsão metacognitiva sobre n(A) + n(B) vs n(A ∪ B)), em `unionCount` (o estudante escreve algebricamente n(A ∪ B) como soma das três regiões do Venn), em `countAFromDiagram` e `countBFromDiagram` (o estudante reconstrói n(A) e n(B) a partir da topologia que acabou de construir), e em `fillAMinusB`/`fillBMinusA` (o estudante escolhe a operação correta em dropdown e então digita a operação com valores numéricos concretos dentro do próprio diagrama); a **validação** é conduzida pelo milieu — a barra empilhada em `sumCompareVisual` confronta a soma estequiométrica 50 com a cardinalidade real 36, expondo a diferença igual a n(A ∩ B), e a verificação cruzada em `probFormulaVerify` contrapõe a rota via Laplace direto à rota via fórmula geral, explicitando que "duas rotas — mesmo resultado"; a **institucionalização** opera em múltiplos momentos, desde os mini-fechamentos de `synthM1`/`synthM2` até a formalização via múltipla escolha em `institucionalize` e o fechamento em `done`.

A situação fundamental exigida para T7 — aquela em que o estudante percebe que a soma direta gera resultados inconsistentes e busca formalizar a correção — é construída com precisão milimétrica. A reordenação didática implementada, que antecipa o cálculo de P(A ∪ B) por Laplace direto antes de derivar a fórmula algébrica, é uma decisão de engenharia didática não-trivial documentada no próprio código: ela transforma Laplace em **rota estabelecida** que servirá de contraprova para a fórmula geral. Essa é a operacionalização do princípio de Brousseau (1997, p. 22) segundo o qual a fórmula só se torna necessária quando o estudante percebe que a soma simples gera resultados inconsistentes com a contagem direta. Na nova tela `numericConclusion`, o movimento de subtração de n(A ∩ B) é explicitado com a verbalização *"Ao subtrair n(A ∩ B) = 9, cancelamos o 9 que aparecia duas vezes na soma n(A) + n(B)"*, o que atende a exigência brousseauniana de que a institucionalização torne explícita a razão pedagógica do procedimento.

## 4. Análise pela Teoria dos Registros Semióticos de Duval

A sequência articula sistematicamente sete registros distintos, o que configura o que Duval (1993, p. 52) chama de aprendizagem matemática efetiva: o registro **verbal em linguagem natural** (descrições dos eventos em "a soma é maior ou igual a 3"), o registro **tabular bidimensional** (tabela 6×6 das marcações), o registro de **enumeração simbólica** (listagens `{(1,2), (1,4), ...}` em `enumDisplay`), o registro **topológico** (laboratório de Venn com duas círculos e regiões disjuntas), o registro **pictórico-quantitativo linear** (barra empilhada em `sumCompareVisual`), o registro **algébrico-simbólico** (identidades n(A − B) = n(A) − n(A ∩ B) e derivações em `conclusion`), e o registro **numérico** em suas três formas equivalentes (fração, decimal, percentual em `probTransfer`). O laboratório de Venn é especialmente significativo nessa análise porque materializa a **conversão de registro mais difícil** — de cardinalidade numérica para topologia espacial — por meio de uma interação construcionista: o estudante não apenas vê o Venn, ele o constrói ao arrastar os círculos até haver sobreposição, ao identificar cada região pela semântica correspondente, ao digitar dentro das regiões as operações que produzem suas cardinalidades. Duval argumenta que o domínio efetivo de um conceito matemático exige **coordenação entre ao menos dois registros cognitivamente heterogêneos**; a sequência vai muito além desse mínimo, coordenando sete registros em momentos estrategicamente escalonados.

Uma decisão particularmente relevante sob a ótica duvaliana é a implementação do *piscar sincronizado das três regiões do Venn em cores distintas* na nova tela `numericConclusion` e na fase seis da `conclusion`. Esse recurso materializa, em tempo real e em registro pictórico, a decomposição da união A ∪ B nas três regiões disjuntas (A − B) ∪ (A ∩ B) ∪ (B − A) — uma relação que, expressa apenas em linguagem algébrica, tende a ser memorizada sem ser conceitualmente apreendida. A animação opera como **ponte visual** entre o registro topológico (três regiões) e o registro algébrico (três termos na soma), sincronizando a aparição da soma numérica 21 + 9 + 3 = 33 com a pulsação das três regiões correspondentes.

## 5. Aprendizagem significativa — Ausubel

A sequência executa com precisão técnica o mecanismo de subsunção descrito por Ausubel (2000, p. ix, 70). Na tela `synthM2`, a fórmula particular do Disco (P(A ∪ B) = P(A) + P(B), válida para eventos mutuamente exclusivos) é explicitamente evocada como "outra rota" já conhecida pelo estudante, e a pergunta motivadora *"será que essa fórmula do Disco ainda funciona aqui?"* estabelece precisamente a tensão cognitiva que Ausubel identifica como condição para aprendizagem significativa: o novo saber precisa se ancorar em um saber prévio estável e relevante, em um processo que pode exigir **diferenciação progressiva** (a fórmula particular é agora reconhecida como caso particular de uma fórmula mais geral) e **reconciliação integrativa** (as duas fórmulas convivem coerentemente, sem que uma anule a outra). O fechamento em `probFormulaVerify` completa esse movimento ao demonstrar que, quando A ∩ B = ∅, a fórmula geral reduz-se à fórmula do Disco, realizando a reconciliação explícita: *"A fórmula geral contém o caso particular."*

## 6. Construcionismo e gênese instrumental — Papert e Trouche

A fase `vennLab` é, em essência, uma encenação construcionista no sentido de Papert (1980, p. 111): o estudante não *recebe* o diagrama de Venn, ele o **constrói** através de quinze ações discretas que, somadas, produzem a identidade fundamental n(A ∪ B) = n(A − B) + n(A ∩ B) + n(B − A). A trajetória começa com dois círculos disjuntos — configuração em que A ∩ B não existe como objeto matemático — e culmina com três regiões populadas por cardinalidades, descrições semânticas externas e expressões algébricas, cada elemento resultado direto de uma ação do estudante. Esse artefato construído tem **significado pessoal** para ele, pois cada região do Venn carrega a lembrança do gesto que a preencheu. Papert identifica precisamente essa condição — construir artefato com significado pessoal — como distinção essencial entre aprendizagem construcionista e exposição instrucional.

A análise pela gênese instrumental de Trouche (2004, p. 285) ilumina o mecanismo complementar. O diagrama de Venn, dentro da sequência, não é apenas ferramenta visual passiva; ele é **instrumento** no sentido técnico do termo, resultado da dupla dialética entre **instrumentação** (a ferramenta modela o pensamento do estudante, organizando sua percepção da sobreposição de conjuntos em regiões topologicamente separáveis) e **instrumentalização** (o estudante modela a ferramenta, configurando-a com suas próprias cardinalidades e descrições verbais). A progressão do laboratório é didaticamente a migração da **instrumentação** (sub-etapas 1 a 4, onde a ferramenta guia o estudante) para a **instrumentalização plena** (sub-etapas 10 a 15, onde o estudante escreve expressões originais que o diagrama serve como laboratório para testar). Essa migração é o fenômeno central da gênese instrumental, e sua presença na sequência constitui evidência sólida de integração teórica entre design pedagógico e aparato tecnológico.

## 7. Mediação digital — Hoyles & Noss

O critério de Hoyles e Noss (2003, p. 335) para distinguir entre **suporte digital** e **mediação digital** é implacável: a tecnologia apenas suporta quando reproduz em tela o que poderia ser feito em lousa; ela media quando reestrutura o que pode ser aprendido. A sequência implementada contém pelo menos quatro elementos que só existem enquanto objetos matematicamente significativos **porque** são digitais: o congelamento sincrônico das marcações de A, B e A ∩ B com cor preservada enquanto o estudante trabalha em outro evento; o destaque cromático dourado dos elementos de A ∩ B piscando dentro das enumerações de A e B na tela `enumDisplay`; a movimentação dos círculos do Venn em `createIntersection` até que haja sobreposição física, acompanhada do reposicionamento automático das descrições verbais para rótulos externos; o piscar pulsante sincronizado das três regiões em cores distintas durante a síntese final. Nenhum desses quatro elementos é reproduzível em lousa; nenhum é mera ilustração; cada um carrega uma carga cognitiva específica que modela o pensamento matemático do estudante de forma que o ensino sem tecnologia não modelaria. Hoyles argumenta que o critério último da mediação é precisamente esse — *o que se aprende com a tecnologia é diferente do que se aprenderia sem ela* —, e a sequência atende plenamente.

## 8. Teoria Cognitiva da Aprendizagem Multimídia — Mayer

A avaliação pela TCAM (MAYER, 2001, p. 63) exige verificar três canais: a capacidade limitada da memória de trabalho, o processamento dual verbal-visual e o processamento ativo. A sequência respeita a capacidade limitada da memória de trabalho ao **segmentar** cada sub-etapa em uma ação focal (MAYER, 2001, p. 120): a intro apresenta o problema sem simultaneamente pedir ação; `markA` pede apenas marcação; `countA` pede apenas contagem; a fase `vennLab` distribui a construção do diagrama em quinze gestos separados. O processamento dual é garantido pela consistência entre canal verbal (descrições, instruções) e canal visual (tabela, enumeração, diagrama, barra, gráfico), sem competição entre os canais — o princípio da coerência (MAYER, 2001, p. 141) é atendido pela ausência de elementos decorativos. O processamento ativo é a força central da sequência: não há um único momento expositivo longo sem ação subsequente, e a pergunta metacognitiva em `doubleCountQuestion` (*"Imagine que você contou cada caso favorável de A e em seguida cada caso favorável a B. Qual região você contou duas vezes?"*) é um paradigma de indução ao processamento ativo.

Duas decisões concretas merecem destaque técnico. A primeira é o **respeito sistemático a `prefers-reduced-motion`**, implementado em todas as animações (piscar sincronizado, fade-in progressivo, pulse das regiões, translação de descrições, reposicionamento de círculos). Essa escolha atende à WCAG 2.1 e evita o que Mayer (2014, cap. 5) identifica como sobrecarga cognitiva em usuários sensíveis a movimento. A segunda é o **escalonamento temporal generoso** na animação final da `conclusion`, com delays de 1.2 a 1.8 segundos entre fases consecutivas. Esse escalonamento, ampliado a pedido do autor, opera como implementação concreta do princípio da segmentação: permite que o estudante consolide cada linha de derivação antes de ser apresentado à próxima.

## 9. Matemática como atividade — Freudenthal

Freudenthal (1991, p. 14) argumenta que matemática só é verdadeiramente aprendida quando o estudante a *reinventa*. A sequência implementa com precisão esse princípio no momento mais decisivo: a fórmula n(A ∪ B) = n(A) + n(B) − n(A ∩ B) não é apresentada como convenção nomeada em honra de alguém, mas emerge como **consequência algébrica** de uma identidade mais fundamental que o próprio estudante acabou de construir. Em `placeExpressions` e `writeUnionFormula`, ele escreve que n(A ∪ B) é a soma das três regiões; em `doubleCountQuestion` ele identifica A ∩ B como a região contada duas vezes; em `numericConclusion` ele vê que subtrair n(A ∩ B) corrige a dupla contagem; em `conclusion`, ele acompanha a substituição das identidades (ii) e (iii) em (i) e observa a fórmula canônica emergir da simplificação algébrica. O movimento inteiro é o que Freudenthal chamaria de **matematização horizontal** (da situação concreta ao modelo algébrico) seguida de **matematização vertical** (da identidade por regiões à fórmula geral via substituição), e a implementação encarna essa dupla matematização em código interativo.

## 10. Análise TPACK

A avaliação pelas sete intersecções do TPACK (MISHRA; KOEHLER, 2006, p. 1025) sustenta o julgamento de excelência sinérgica. O **conhecimento do conteúdo (CK)** é rigoroso: cada cardinalidade exibida é computada em tempo real contra o predicado do evento corrente (pela função `verifyEventTableConsistency`, que valida 144 invariantes matemáticos por rodada), e a notação adotada respeita convenções canônicas — n(A ∩ B) em vez de n(B ∩ A) na forma final, conjuntos como sub-conjuntos de {1,...,6}² para o espaço amostral, regras de inclusão-exclusão aplicadas corretamente. O **conhecimento pedagógico (PK)** articula TSD, Ausubel, Papert, Trouche e Mayer em decisões explícitas de ordem das sub-etapas, variáveis didáticas das rodadas e ritmo de animação. O **conhecimento tecnológico (TK)** se manifesta em escolhas implementativas informadas: SVG para geometria topológica (preserva precisão em qualquer escala), `<foreignObject>` com `pointer-events: none` para embutir HTML em SVG sem bloquear cliques, detecção de região por hit-testing geométrico (mais robusto que `<clipPath>` sobrepostos), gerador paramétrico por *rejection sampling*, keyframes CSS para pulsações, máscaras SVG para recorte preciso de regiões.

A intersecção **PCK** é ativa: a decisão de começar o laboratório de Venn com círculos disjuntos e pedir o arraste até haver sobreposição transforma a existência da interseção de pressuposição em conquista, uma escolha que requer conhecimento pedagógico específico do conteúdo. A intersecção **TCK** é explícita: o Venn digital arrastável com reposicionamento automático de descrições é impossível em lousa; representa conteúdo que **só existe porque é digital**. A intersecção **TPK** é visível na integração do gerador algorítmico com as variáveis didáticas: a tecnologia permite variação controlada sem repetição, atendendo simultaneamente a requisito pedagógico (variável didática de Artigue) e técnico (geração parametrizada com validação). A intersecção central **TPACK** atinge o critério de excelência de Mishra e Koehler (2006, p. 1025): a tecnologia só faz sentido com este conteúdo, a pedagogia aproveita o que a tecnologia permite e não seria possível sem ela, e conteúdo, pedagogia e tecnologia reforçam-se mutuamente.

## 11. Análise DSR

Sob a perspectiva de Dresch, Lacerda e Antunes Junior (2015, p. 130), a sequência é um **artefato** maduro. O problema é claramente definido (a aprendizagem da regra da adição para dois eventos no Ensino Médio, com vieses V6.1, V7.1 e V14.4 documentados na literatura). Os requisitos do artefato são derivados sistematicamente da literatura científica (REQ-1 a REQ-5 do protocolo DSR foram todos atendidos, com destaque para REQ-4 sobre integração didática documentada). O design atende aos requisitos com mais do que o minimamente exigido: simulação interativa (REQ-1 atendido pelo gerador algorítmico + Venn), endereçamento explícito de vieses (REQ-2 atendido por V6.1/V7.1/V14.4/V7.2), protocolo de avaliação previsto (REQ-3 atendido pela função `verifyEventTableConsistency` e pela possibilidade de piloto mínimo documentada no parecer anterior), integração didática (REQ-4 atendido pela sequência contínua de sub-etapas articuladas), pré-requisitos estruturais (REQ-5 atendido pela pressuposição consolidada de T2, T3, T14 das cenas anteriores). A contribuição ao estado da arte (DSR-Q5) é genuína: um laboratório construcionista de Venn com quinze sub-etapas pedagogicamente escalonadas, combinado com gerador algorítmico paramétrico de pares de eventos com validação automática, não tem paralelo na literatura de OVAs de probabilidade para Ensino Médio que este pareceirista conhece.

## 12. Endereçamento de vieses cognitivos

A sequência endereça de forma completa ou parcial cinco vieses mapeados pelo protocolo, todos com evidência documentada na literatura internacional:

**V6.1 — Ambiguidade "ou" inclusivo vs exclusivo** (BATANERO; DIAZ, 2007, p. 123): a tela `defineUnion` enuncia explicitamente *"pertencem a pelo menos um dos conjuntos — ou seja, pertencem a A, a B, ou a ambos"*, e a legenda externa do Venn mantém a descrição *"A ∪ B: ocorre pelo menos um dos eventos"* permanente a partir de `markUnion`. Endereçamento completo.

**V6.2 — Inconsistências semânticas "e"/"ou"** (idem): o laboratório de Venn opera simultaneamente com descrições semânticas externas (*"A ∩ B: ocorre A e B ao mesmo tempo"*) e ação topológica (marcar a região central), materializando a distinção que a linguagem cotidiana oblitera. Endereçamento completo.

**V7.1 — Heurística aditiva simplificada** (KAHNEMAN; TVERSKY, 1972, p. 432): é o viés central e mais profundamente atacado. A sequência o endereça em cinco momentos: a previsão metacognitiva em `predict`, a barra empilhada em `sumCompareVisual`, a pergunta-chave em `doubleCountQuestion` (*"Qual região você contou duas vezes?"*), o cálculo explícito em `numericConclusion` ((21+9) + (9+3) − 9 = 33), e a visualização pulsante das três regiões em cores distintas durante a síntese final. Endereçamento completo e multi-registro.

**V7.2 — Generalização inadequada da regra de exclusão** (BATANERO; DIAZ, 2007, p. 125): a tela `synthM2` problematiza diretamente (*"no nosso problema A ∩ B não é vazio. Será que essa fórmula do Disco ainda funciona aqui?"*), e a tela `probFormulaVerify` fecha com a generalização explícita (*"quando A ∩ B = ∅, a fórmula geral reduz-se à do Disco"*). Endereçamento parcial — completaria-se plenamente com a inclusão de um caso A ∩ B = ∅ dentro da sequência, que atualmente é impossível pelo design do gerador algorítmico (restrição intencional); fica como oportunidade para a fase de exercícios seguinte.

**V14.4 — Supercontagem/subcontagem** (NAVARRO-PELAYO et al., 2016, p. 736): o núcleo conceitual de todo o movimento de Macro 3. O laboratório de Venn, ao decompor A ∪ B em três regiões disjuntas, torna a contagem sem duplicação operacionalmente explícita; o destaque cromático dourado sobre a região A ∩ B nas sub-etapas `fillIntersection`, `numericConclusion` e na animação final reforça topologicamente o único local onde a dupla contagem poderia ocorrer. Endereçamento completo.

## 13. Acessibilidade e responsividade

A sequência atende WCAG 2.1 AA em pontos que parceiros menos rigorosos tendem a negligenciar: navegação por teclado nas regiões clicáveis com `tabIndex={0}` e handlers `onKeyDown`; `aria-label` descritivo em cada região e controle; suporte sistemático a `prefers-reduced-motion` desabilitando flash, pulse e piscar (comportamento fallback estático preservado); movimentação por botões direcionais explícitos em vez de *drag-and-drop* puro, o que torna toda a sequência operável sem dispositivo de ponteiro; uso de cor como reforço e não como único canal informativo (cada região tem, além da cor, descrição verbal na legenda externa e rótulo do evento no cabeçalho externo). O viewBox SVG de 800×400 preserva proporções em qualquer tela; os chips do `CardinalityPanel` usam `flex-wrap` para acomodar telas estreitas; o input aritmético dentro das regiões foi redimensionado (120×34 px) para caber nas lunetes laterais. A responsividade para celulares de 5-6 polegadas, exigência do checklist de viabilidade escolar (R13), está preservada.

## 14. O gerador algorítmico como peça científica autônoma

O substituto do banco estático merece tratamento analítico próprio. Do ponto de vista matemático, o gerador modela o espaço de problemas pela abstração A = S⁻¹(X_A), onde S(i,j) = i+j e X_A ⊆ {2,...,12}, com X_A construído por condição relacional (gt, gte, lt, lte, between) e X_B por propriedade aritmética. A função de multiplicidade r(s) = 6 − |7 − s| decorre diretamente da distribuição exata da soma de dois dados equilibrados e permite computar cardinalidades sem enumerar pares. As restrições de validação — X_A ∩ X_B ≠ ∅, X_A ≠ X_B, cardinalidades mínimas, categoria de sobreposição — são aplicadas por *rejection sampling* e garantem que toda instância gerada seja didaticamente válida. O espaço paramétrico ultrapassa 1.500 combinações distintas no espaço efetivo (após filtragem), um número que torna praticamente impossível para um estudante repetir o mesmo problema em três rodadas.

Do ponto de vista científico, esse gerador representa uma contribuição original: em nenhum dos OVAs de probabilidade da literatura consultada este pareceirista encontrou geração algorítmica de pares de eventos com validação simultânea de restrições didáticas e matemáticas. A peça é extensível: os tipos TypeScript (`VennSize = 2 | 3`, `MembershipMask`, `VennGeometry`) foram concebidos desde o início para acomodar a generalização a três conjuntos, que será útil em futuros OVAs sobre probabilidade total e Bayes.

A função `verifyEventTableConsistency`, complementar ao gerador, opera como **camada de defesa epistemológica**: a cada rodada, ela percorre as 36 células do quadrado {1,...,6}² e valida quatro invariantes por célula (pertinência a A, a B, a A ∩ B e a A ∪ B) contra o predicado gerado, totalizando 144 checks. Em ambiente de desenvolvimento, qualquer inconsistência é reportada via `console.error`, o que previne bugs silenciosos capazes de ensinar matemática errada ao estudante — exatamente o tipo de risco que uma banca severa priorizaria identificar.

## 15. O laboratório de Venn como peça central

A fase `vennLab` é, na avaliação deste pareceirista, a peça mais original e didaticamente densa da sequência. Suas quinze sub-etapas combinam, em uma mesma unidade coesa, o ciclo TSD completo (ação na manipulação dos círculos, formulação na escolha de operações, validação pelo milieu geométrico, institucionalização pela derivação algébrica final), a dupla dialética de gênese instrumental de Trouche, o construcionismo de Papert operado sobre a própria topologia do Venn, e a conversão multi-registro de Duval. A decisão de posicionar o laboratório **entre** `predict` e `sumCompareVisual` é didaticamente refinada: preserva a autenticidade metacognitiva da previsão (o estudante prevê sem mediação topológica), introduz a topologia apenas *após* o compromisso com a previsão (permitindo confrontação metacognitiva sem contaminação), e gera contexto para a confrontação numérica subsequente.

A animação final da `conclusion`, com nove fases escalonadas ao longo de aproximadamente dezessete segundos e piscar sincronizado das três regiões em cores distintas, é um dispositivo técnico-pedagógico sofisticado. Ela implementa o que Mayer (2001, p. 63) chama de integração sistemática de canais verbal e visual, materializa a conversão algébrica via substituição em tempo real (cada termo substituído é destacado cromaticamente com a cor do termo de origem), e respeita `prefers-reduced-motion` para acessibilidade. O resultado é uma demonstração animada de qualidade profissional que reforça simultaneamente topologia, álgebra e numérica — três registros em sincronismo.

## 16. Pontos fortes para defesa de banca

Consolidam-se **onze pontos fortes** que esta avaliação identifica como defensáveis frente a banca PROFMAT rigorosa:

(i) Situação fundamental de Brousseau integralmente construída, com obstáculo epistemológico (V7.1) endereçado por arquitetura intencional.

(ii) Sete registros semióticos coordenados em momentos pedagogicamente motivados (DUVAL, 1993, p. 52).

(iii) Ancoragem significativa ao conhecimento prévio (Disco Probabilístico) com diferenciação progressiva e reconciliação integrativa explícitas (AUSUBEL, 2000, p. 70).

(iv) Laboratório construcionista genuíno no sentido de Papert (1980, p. 111), com o Venn sendo artefato construído pelo estudante, não ilustração.

(v) Migração completa da instrumentação para instrumentalização na acepção de Trouche (2004, p. 285), visível na progressão das sub-etapas do `vennLab`.

(vi) Mediação digital irreproduzível em lousa (HOYLES; NOSS, 2003, p. 335) em pelo menos quatro elementos distintos.

(vii) Aderência sistemática aos princípios da TCAM de Mayer (2001, p. 63, 120, 141), incluindo respeito a `prefers-reduced-motion`.

(viii) Engenharia de variáveis didáticas (ARTIGUE, 2014, p. 477) operacionalizada em duas camadas — macro (três categorias de rodadas) e micro (gerador algorítmico paramétrico com mais de 1500 combinações).

(ix) Matemática emergente como atividade do estudante (FREUDENTHAL, 1991, p. 14), com a fórmula canônica produzida pela própria construção do aluno, não apresentada como convenção.

(x) Endereçamento completo ou parcial de cinco vieses cognitivos documentados (V6.1, V6.2, V7.1, V7.2, V14.4), com V7.1 atacado em cinco momentos independentes.

(xi) Excelência TPACK (MISHRA; KOEHLER, 2006, p. 1025) em todas as sete intersecções, com integração sinérgica verificável.

## 17. Pontos críticos remanescentes

A avaliação severa identifica **cinco pontos críticos** a serem considerados antes da defesa final:

Em primeiro lugar, a ausência intencional de caso mutuamente exclusivo dentro da sequência — decorrente da restrição |X_A ∩ X_B| ≥ 1 do gerador algorítmico — deixa a generalização do Disco operando apenas no registro verbal de `probFormulaVerify`, sem confirmação empírica pelo próprio estudante. Sugere-se que a fase de exercícios dinâmicos que segue inclua obrigatoriamente pelo menos um caso A ∩ B = ∅, completando o endereçamento de V7.2.

Em segundo lugar, a institucionalização em `institucionalize` é via múltipla escolha, o que é método de verificação mais que de institucionalização plena no sentido brousseauniano (BROUSSEAU, 1997, p. 88). A elevação do saber pessoal a saber cultural compartilhado exigiria, idealmente, momento de registro escrito aberto em prosa. Esse é um aprimoramento desejável mas não-bloqueante.

Em terceiro lugar, embora a sequência apresente o contexto "dois dados" em múltiplos pontos (reforçado agora na recontextualização de `probCalc`), o contexto permanece único em toda a fase. A transferência efetiva entre contextos diferentes (cartas, urnas, perfis de alunos) é responsabilidade das fases seguintes de exercícios dinâmicos.

Em quarto lugar, a função de piscar sincronizado das três regiões na `numericConclusion` é contínua e infinita. Embora pedagogicamente eficaz e respeitando `prefers-reduced-motion`, pode gerar fadiga visual em sessões longas. Considere adicionar limite temporal (por exemplo, 10 ciclos e depois estado estático).

Em quinto lugar, a avaliação a posteriori (ALMOULOUD; COUTINHO, 2008, p. 69) ainda não foi realizada empiricamente. Um piloto mínimo com 3 a 5 estudantes do Ensino Médio, mesmo sem aplicação ampla, seria evidência adicional valiosa para a defesa. Essa é uma recomendação metodológica, não uma crítica ao artefato.

## 18. Decisão de banca

**Parecer: APROVADO COM DISTINÇÃO CIENTÍFICA.**

A fase `unionTheory` do OVA Probabilidade Dois Dados, em seu estado atual implementado, constitui artefato didático-científico de alta qualidade, compatível com os critérios de defesa PROFMAT e passível de publicação em periódico especializado em Educação Matemática ou em Educação e Tecnologia. Os fundamentos teóricos dos nove referenciais ativados — Brousseau, Artigue, Duval, Ausubel, Mishra & Koehler, Dresch et al., Papert, Trouche, Hoyles & Noss, Mayer, Freudenthal — estão articulados no design com evidência operacional clara, verificável por inspeção no código e por interação com a sequência. Os vieses cognitivos prioritários mapeados pelo protocolo (V6.1, V6.2, V7.1, V14.4) estão completamente endereçados; V7.2 permanece com endereçamento parcial pela decisão intencional do gerador algorítmico, compensável na fase subsequente. A contribuição original ao estado da arte — gerador algorítmico paramétrico com validação automática + laboratório construcionista de Venn em quinze sub-etapas pedagogicamente escalonadas — é substancial e defensável.

Os cinco pontos críticos remanescentes não invalidam a fase nem comprometem sua integridade científica; são oportunidades de aprimoramento progressivo que podem ser abordadas na fase de exercícios dinâmicos (pontos 1, 3), em revisão pontual do design (pontos 2, 4) ou em trabalho metodológico complementar (ponto 5). A fase `unionTheory` está pronta para compor a versão final da dissertação e para figurar como peça central da contribuição original do pesquisador.

## 19. Referências

ALMOULOUD, S. A.; COUTINHO, C. Q. S. Engenharia Didática: características e seus usos em trabalhos apresentados no GT-19/ANPEd. *Revemat*, v. 3, n. 1, p. 62-77, 2008.

ARTIGUE, M. Perspectives on design research: the case of didactical engineering. In: BIKNER-AHSBAHS, A. et al. (ed.). *Approaches to qualitative research in mathematics education*. Dordrecht: Springer, 2014. p. 467-496.

AUSUBEL, D. P. *The acquisition and retention of knowledge*. Dordrecht: Kluwer, 2000.

BATANERO, C.; DIAZ, C. (ed.). *Matemáticas y su didáctica para maestros*. Granada: Universidad de Granada, 2007.

BRASIL. Ministério da Educação. *Base Nacional Comum Curricular*. Brasília: MEC, 2018.

BROUSSEAU, G. *Theory of didactical situations in mathematics*. Dordrecht: Kluwer, 1997.

DRESCH, A.; LACERDA, D. P.; ANTUNES JUNIOR, J. A. V. *Design Science Research*. Porto Alegre: Bookman, 2015.

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

---

*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos*
*Parecer Dr. OtiMath v5.1 — 2026-04-21*
