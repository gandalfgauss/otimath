# PARECER DR. OTIMATH — REAVALIAÇÃO PROFUNDA DO OVA PROBABILIDADE DOIS DADOS

**Identidade do agente:** Dr. OtiMath (PROFMAT/UFVJM) — perfil triplo: Doutor em Educação Matemática, Engenheiro de Software Educacional de Elite, Membro Rigoroso de Banca PROFMAT.
**Versão do protocolo:** v5.1
**Data do parecer:** 2026-04-26
**Branch analisada:** `mod-rangel` (commit `f3bc970`).
**Escopo:** estado pós-implementação dos Exercícios 6 e 7 + Menu de Revisão; impacto previsto da implementação do Exercício 8 (planejada para a próxima sessão); recomendações sobre telas de fechamento e relatório de aprendizagem do estudante (inspiradas no OVA Disco Probabilístico precedente); recorte explícito do que pertence ao próximo OVA da sequência didática.

---

## 1. ESTADO ATUAL CONSOLIDADO DO OVA — APÓS COMMIT f3bc970

### 1.1 Trilha conceitual presente no artefato

O OVA Probabilidade Dois Dados, em sua versão pós-Ex6/Ex7, contém uma trilha didática contínua que cobre integralmente o seguinte recorte do Tópico 14 do mapa do protocolo Dr. OtiMath: aleatoriedade no lançamento de dois dados, sistematização tabular do espaço amostral S = {1,…,6}², equiprobabilidade dos 36 pares ordenados, identificação de eventos por predicados sobre o par (g, b), eventos complementares com a relação P(A) + P(Ā) = 1, distribuição triangular emergente das somas, instanciação semiótica da impossibilidade pelos carrinhos 1 e 13 da Corrida, união e interseção de eventos como construção tabular célula a célula, fórmula da adição P(A∪B) = P(A) + P(B) − P(A∩B) institucionalizada na fase `unionTheory` e reinvestida em cinco exercícios de aplicação progressiva (Ex1 a Ex5), revisão consolidadora obrigatória no Ex6 sobre os dois núcleos operatórios em duas rodadas sorteadas, e prática livre opcional no Ex7 mediante o `TwoDicesGame` de doze eventos sorteados em sete desafios. A inclusão prevista do Ex8 ampliará a prática livre para um pool parametrizado de aproximadamente cinquenta eventos com restrições matemáticas defensivas e progressão didática de dificuldade.

A trilha articula três registros semióticos — verbal, tabular e simbólico-fracionário — em conformidade com a coordenação de registros prescrita por DUVAL (1993, p. 52), e o padrão de marcação sequencial colorida com remoção progressiva de placeholders inúteis, hoje disponível no Ex6 e a ser estendido ao Ex8, materializa o diagrama de Venn dentro do próprio registro tabular, realizando a *progressive mathematization* freudenthaliana (FREUDENTHAL, 1991, p. 33) sem exigir troca de registro.

### 1.2 Elementos de design pedagogicamente excepcionais já implementados

A reavaliação identifica um conjunto de decisões de design que, articuladas, configuram um patamar de qualidade pedagógica superior à média de OVAs disponíveis na literatura nacional e internacional revisitada nos pareceres anteriores (BATANERO et al., 2016, p. 23). São elas: a curadoria fechada de dez candidatos no Ex6 com sanity-check matemático em tempo de boot que torna impossível, por construção, a entrada em produção de um desafio degenerado; a paleta tridimensional nítida e daltônica-friendly (azul A, laranja B, roxo D) com layout de slots fixos no grid 2D Venn que preserva alinhamento horizontal e vertical entre as trinta e seis células da tabela 6×6; o cursor `not-allowed` em checkboxes congelados por meio de uma combinação calibrada de `pointer-events`, `onClick.preventDefault` e `onChange` defensivo que preserva nitidez da cor de marcação sem incorrer no acinzentamento padrão dos `<input>` HTML disabled; a regra R14 implementada nativamente no hook irmão `useTwoDicesSingleShotHooks` por multiplicação cruzada exata em inteiros, eliminando a vulnerabilidade de ponto flutuante herdada da engine introdutória; o botão "Marcar todos!" com tooltip explicativo que opera ergonomicamente sobre o evento da sub-fase atual sem tocar eventos congelados, materializando a estratégia complemento institucionalizada na fase `complementaryEvents`; o Menu de Revisão construído como overlay próprio com semântica WCAG 2.1 AA, sete verbetes em três grupos com badge de sugestão pós-erro, cada verbete mapeado um-para-um com um viés cognitivo identificável na literatura de Educação Matemática (V5.1, V6.1, V6.2, V6.3, V7.1, V7.2, V7.4); e a notação consistente do espaço amostral como S maiúsculo (em vez de Ω), respeitando a convenção brasileira do Ensino Médio que aproxima o vocabulário do OVA dos livros didáticos nacionais (BNCC, BRASIL, 2018; DANTE, PAIVA, SOUZA).

### 1.3 Aderência aos referenciais teóricos do framework Dr. OtiMath

A trilha atual e a extensão prevista pelo Ex8 acionam, sob critério de ativação seletiva da regra R12, os seguintes referenciais com evidência efetiva no design e não como uso decorativo: BROUSSEAU (1997, p. 30 e p. 88) para situações fundamentais de cada tópico (espaço amostral, complementar, união, interseção) e para a decomposição em situações elementares que motivou a marcação sequencial A → B → D; ARTIGUE (1988) para a fase de prática livre da Engenharia Didática que justifica conceitualmente o Ex7 e o Ex8; AUSUBEL (2000, p. ix) para a ancoragem em subsunçores no Menu de Revisão e na reposição do `TwoDicesGame` introdutório como prática terminal autônoma após Ex1-Ex6; DUVAL (1993, p. 52) para a coordenação de registros tabular, simbólico-operatório e fracionário ao longo de cada rodada do Ex6; FREUDENTHAL (1991, p. 33) para a mathematization progressiva realizada na construção visual de Venn dentro do registro tabular; VYGOTSKY (1991) para a reposição do Ex7 como prática autônoma sobre repertório consolidado; MAYER (2014, p. 120 e p. 285) para os princípios de split-attention e sinalização aplicados na marcação sequencial e na identificação visual do verbete sugerido pós-erro; BATANERO; DIAZ (2007), KAHNEMAN; TVERSKY (1972), NAVARRO-PELAYO et al. (2016) para o mapeamento explícito de cada verbete do Menu a um viés cognitivo da literatura científica; ROEDIGER; KARPICKE (2006) e ROHRER; TAYLOR (2007) para a função de recuperação ativa e prática intercalada do Ex6 e do Ex7; NIELSEN (1994) para os princípios de consistência e flexibilidade de uso aplicados ao botão "Marcar todos!" e ao layout de slots fixos. A regra R12 está respeitada: nenhum referencial é citado decorativamente.

### 1.4 Dimensão DSR — Design Science Research

O artefato OVA Probabilidade Dois Dados, no estado atual, satisfaz parcialmente os requisitos REQ-1 a REQ-5 mapeados pelo Eixo C da revisão da literatura 2015-2025 e codificados na regra R6 do protocolo. REQ-1 (simulação interativa para compreensão estrutural) é atendido pela cena 6 da máquina de lançamento e pela tabela 6×6 dinâmica; REQ-3 (validação longitudinal sistematizada) está parcialmente atendido pela existência do módulo de log no OVA Disco precedente, mas o OVA Dois Dados ainda não dispõe de instrumentação análoga, lacuna que o presente parecer recomenda fechar; REQ-4 (integração didática documentada) está atendido pela documentação científica em `docs/ovas/`; REQ-5 (T14 como pré-requisito explícito) está implicitamente atendido porque os exercícios 1 a 8 pressupõem leitura autônoma do espaço amostral 6×6, mas a documentação não declara isso explicitamente como pré-requisito de aplicação; REQ-2 (probabilidade condicional como núcleo crítico) **não é atendido nem é objetivo deste OVA** — pertence ao próximo OVA da sequência, conforme decisão explícita do orientando registrada nesta sessão.

---

## 2. EXERCÍCIO 8 — IMPACTO PREVISTO DA IMPLEMENTAÇÃO PLANEJADA

### 2.1 O que o Ex8 entrega que o Ex7 não entrega

A análise do código já existente em `roxa/8/eventParametrization.ts` (1239 linhas) e `roxa/8/useTwoDicesHooks.ts` (848 linhas) revela um framework de geração probabilística de qualidade superior ao motor herdado pelo `TwoDicesGame` original. O Ex8, ao adotar esse framework em coexistência opcional com o Ex7 (decisão registrada para a próxima sessão), entregará ao OVA cinco ganhos simultâneos que justificam a sua existência apesar da sobreposição funcional aparente com o Ex7.

O primeiro é o salto de doze para aproximadamente cinquenta eventos no pool sorteável, organizados em famílias parametrizadas (soma comparada a k para k variando em intervalos pedagogicamente úteis, soma como número primo, soma como múltipla de três, produto comparado a k, faces individuais do dado verde e do dado azul, mínimo e máximo das duas faces, paridade conjunta com quantificadores existencial e exato, divisibilidade existencial por três, e comparação entre as faces). A ampliação não é mera quantidade — é cobertura de famílias matemáticas distintas que permitem ao estudante encontrar predicados que ele nunca viu antes, exercitando transferência (BATANERO et al., 2016, p. 23).

O segundo é a presença de restrições matemáticas defensivas em runtime. A função `isValidPairForOperation` codifica explicitamente as condições R1 a R4 (cardinalidades não-extremas, não-trivialização por inclusão, não-vazio para subtração de Venn na união) que, no Ex6, eu codifiquei manualmente para apenas dez candidatos curados. No Ex8, essas restrições são aplicadas dinamicamente sobre todos os ~1225 pares possíveis (50×49/2), e a cascata de defesa em profundidade (greedy com 50 retries → backtracking exaustivo → erro explícito) garante matematicamente que **nunca** será apresentado ao estudante um desafio degenerado.

O terceiro é a progressão de dificuldade declarativa via `DEFAULT_DIFFICULTY_PROFILE`. Cada um dos quatro slots compostos do jogo recebe um perfil de dificuldades permitidas e uma média máxima do par, do mais simples (slot 1, dificuldades 1 e 2) ao mais complexo (slot 4, dificuldades 2, 3 e 4). Isso operacionaliza no código a sequência didática prescrita por ARTIGUE (1988): a dificuldade não é aleatória, é monotonicamente crescente, ainda que o conteúdo dentro de cada slot seja sorteado.

O quarto é o balanceamento por família via `buildBalancedProgressiveValidatedGameSetup`, que aplica scoring pedagógico para preferir pares cujas famílias ainda não apareceram no jogo e pares com famílias diferentes entre A e B. Isso evita que um estudante sortudo receba quatro desafios de paridade e nada de soma, preservando variabilidade contextual em cada execução individual e reduzindo a variância de qualidade pedagógica entre estudantes — propriedade defensável em banca PROFMAT como evidência de design rigoroso (DRESCH; LACERDA; ANTUNES JUNIOR, 2015).

O quinto é a sanitização granular de inputs de fração via `sanitizeFraction`, com cinco razões de erro distintas (vazio, não-inteiro, denominador zero, negativo, impróprio) e mensagens formativas específicas para cada uma, indo além da regra R14 ao tornar o feedback didático compatível com o tipo do erro do estudante — princípio mayeriano de relevância contextual (MAYER, 2014, p. 280).

### 2.2 Por que o Ex8 deve coexistir com o Ex7 (não substituir)

A decisão do orientando, registrada na presente sessão, de manter Ex7 e Ex8 como duas vias opcionais distintas em vez de substituir um pelo outro é defendida pelo presente parecer pelos seguintes três motivos. Primeiro, o Ex7 (`TwoDicesGame` herdado) é mais simples conceitualmente e serve como rampa de entrada para estudantes que ainda não desenvolveram autonomia plena — o pool de doze eventos é fixo e familiar (o estudante já viu esses eventos na cena 1), enquanto o Ex8 é maior e introduz famílias novas. Segundo, manter o Ex7 preserva a coerência semiótica com a cena 1 do OVA, onde o `TwoDicesGame` aparece pela primeira vez como artefato exploratório, e essa simetria entre abertura e fechamento (mesmo artefato em ambas as pontas) é eco freudenthaliano do princípio de que o estudante reencontra ao final da sequência o objeto que viu no início, agora reinterpretado pela lente do que aprendeu. Terceiro, na perspectiva de avaliação a posteriori (ARTIGUE, 1996), oferecer dois exercícios opcionais de naturezas distintas permite ao pesquisador, em aplicação empírica futura, observar quais estudantes preferem qual via — dado pedagogicamente valioso que a unificação destruiria.

A consequência arquitetural é que o painel final do Ex6 ganhará três botões em vez dos dois atuais, e o tipo `Phase` do `TwoDicesExperiment` ganhará uma variante adicional `'unionExercise8'`. Custo arquitetural mínimo, ganho pedagógico de oferecer ao estudante uma segunda escolha de prática livre com características distintas do Ex7.

### 2.3 Risco residual identificado

Permanece como risco residual a vulnerabilidade R14 da engine herdada pelo `TwoDicesGame` original (`useTwoDicesHooks.ts`), que continuará servindo o Ex7 e a cena 1. Essa vulnerabilidade já foi formalmente identificada nos pareceres anteriores e mitigada cirurgicamente no `useTwoDicesSingleShotHooks` do Ex6. O Ex8, ao usar o framework `eventParametrization`, naturalmente herda a correção via `verifyExactProbability`. Mas o Ex7 e a cena 1 permanecem expostos ao bug de comparação decimal com `==` em divisão de inteiros, que pode, em casos específicos de denominadores com muitos fatores primos, rejeitar uma fração equivalente legítima ou aceitar uma equivalência aproximada. O parecer recomenda, como TODO de baixa prioridade futura, a migração do hook em produção para o framework `eventParametrization` — operação que tornaria o produto inteiro R14-compliant sem exceção. Por hora, o impacto pedagógico observável em sala é improvável, mas a defesa em banca PROFMAT é mais forte se essa lacuna for documentada como dívida técnica conhecida.

---

## 3. TELAS DE FECHAMENTO E RELATÓRIO DE APRENDIZAGEM — RECOMENDAÇÃO PRIORITÁRIA

### 3.1 Estado da arte no OVA Disco Probabilístico

A inspeção do OVA Disco Probabilístico precedente revela a existência de um módulo de instrumentação invisível em `useRouletteLog.ts` que registra, em `localStorage`, o desempenho do estudante ao longo de toda a sessão com cinco tipos de eventos distintos: transições entre subSteps, tentativas com sucesso ou falha, entradas textuais em campos de resposta, apostas em cores e resultados de giros da roleta. Cada entrada de log é um `LogEntry` tipado com `timestamp`, `stage`, `subStep`, `type` e `data`. O módulo expõe quatro funções públicas para a camada de apresentação: `exportLog` que retorna o JSON serializado, `downloadLog` que materializa o arquivo no sistema do estudante, `getLogSummary` que sintetiza tempo total, número de tentativas, número de erros e número total de entradas, e funções específicas por tipo de evento (`logTransition`, `logAttempt`, `logText`, `logBet`, `logSpinResult`).

Esse módulo é citado em `useRouletteHooks.ts` em mais de quarenta pontos de uso, configurando uma instrumentação verdadeiramente integrada à máquina de estados do OVA — não um log decorativo, mas um sistema funcional capaz de sustentar análise a posteriori sistematizada conforme prescrito por ARTIGUE (1996) e por ALMOULOUD; COUTINHO (2008, p. 69), atendendo materialmente o requisito REQ-3 do framework DSR codificado em R6.

### 3.2 Lacuna identificada no OVA Probabilidade Dois Dados

O OVA Dois Dados, no estado atual pós-commit f3bc970, **não dispõe de instrumentação análoga**. Não há registro persistente de quais cenas o estudante percorreu, quanto tempo gastou em cada uma, em quantas tentativas acertou cada exercício, quais verbetes do Menu de Revisão consultou, quais frações equivalentes digitou (a engine sabe se é equivalente, mas não persiste qual representação o estudante escolheu), nem qual aposta fez na Corrida dos Carrinhos. Toda essa informação se perde a cada `window.unload`. Consequência pedagógica: o estudante que termina o OVA não recebe ao final um espelho do próprio percurso — apenas a mensagem de parabenização imediatamente após o último acerto. Consequência científica: o pesquisador (orientando, mestrandos futuros, professores aplicadores) não dispõe de dados longitudinais para análise a posteriori, impedindo a verificação empírica de hipóteses de aprendizagem que a Engenharia Didática exige na sua quarta fase (ARTIGUE, 1988).

Esta lacuna é, na avaliação do presente parecer, a **lacuna prioritária mais relevante** do OVA Dois Dados em seu estado atual. Sua resolução não exige recriar conteúdo nem refazer análise pedagógica — exige replicar arquiteturalmente o módulo `useRouletteLog.ts` no contexto do `useTwoDicesPresentation` e instrumentar os pontos de tentativa (`checkOnClick` dos hooks principais, `onStepError` do SingleShot, transições de fase no `Experiment`, apostas no `raceBet`, abertura do `StudyMenu`, escolhas no painel final do Ex6).

### 3.3 Recomendação detalhada — Tela de Fechamento Reflexiva

O presente parecer recomenda, como prioridade alta da próxima sessão imediatamente após o Ex8, a implementação de uma **Tela de Fechamento Reflexiva** que apareça quando o estudante clica em "Finalizar OVA", oferecendo um espelho estruturado do que ele percorreu e do que demonstrou. A tela deve ter quatro componentes articulados em texto corrido (não listas de itens — princípio de mini-capítulo científico R10):

O primeiro componente é um **resumo cronológico do percurso** organizado por blocos conceituais (apresentação inicial, cenas 1 a 7 da sistematização tabular, Corrida dos Carrinhos, Eventos Complementares, Fundamentação da União, exercícios 1 a 5 da trilha opcional, Exercício 6 de revisão obrigatória, escolhas opcionais Ex7 ou Ex8 ou pulou direto para o fim). Cada bloco recebe um carimbo temporal (tempo gasto naquele bloco) e um indicador discreto de desempenho (verde se acertou na primeira tentativa em todos os exercícios do bloco, amarelo se houve uma ou duas tentativas erradas, laranja se houve três ou mais ou se acionou "Não sei realmente"). O objetivo aqui não é avaliação punitiva mas espelho metacognitivo — princípio de **metacognição informada** (GARFIELD; BEN-ZVI, 2014, p. 142): o estudante consciente do próprio processo aprende mais a longo prazo.

O segundo componente é um **mapa dos conceitos exercitados** organizados por T1 a T7 do mapa do protocolo Dr. OtiMath, com indicador de profundidade de exercício para cada conceito (introduzido, aplicado em registro tabular, aplicado em registro de contingência, exercitado em revisão, ou pendente — sendo este último relevante para os tópicos T9 a T12 que pertencem ao próximo OVA). Esse mapa cumpre função de **organizador prévio reverso** (AUSUBEL, 2000, p. ix): em vez de preparar o estudante para o conteúdo a vir, organiza retrospectivamente o que ele consolidou, criando ancoragem explícita que potencializa a retenção de longo prazo.

O terceiro componente é uma **lista compacta dos verbetes do Menu de Revisão consultados** durante a sessão, com badge para o(s) verbete(s) mais consultado(s). Esse dado, capturável trivialmente pelo log de abertura do `StudyMenu`, oferece ao estudante uma evidência direta dos próprios pontos de dúvida — não como julgamento mas como roteiro de revisão futura. O texto deve enquadrar a informação positivamente: "Você consultou o Menu de Revisão em quatro momentos, principalmente o verbete sobre Probabilidade da União — vale revisitá-lo se estudar para uma avaliação."

O quarto componente é uma **mensagem de transição explícita para o próximo OVA da sequência didática**, descrevendo brevemente o que o estudante encontrará no OVA seguinte (probabilidade condicional, eventos independentes com retiradas com e sem reposição, diagrama de árvore, teorema da probabilidade total, teorema de Bayes, probabilidade condicional em tabelas) e relacionando esses tópicos ao que ele acabou de exercitar. O propósito é **continuidade vygotskiana**: a Zona de Desenvolvimento Próximo do estudante após o Dois Dados está exatamente nos tópicos T9 a T12, e nomeá-los aqui prepara o terreno cognitivo para o próximo encontro.

### 3.4 Recomendação detalhada — Instrumentação invisível (replicar useRouletteLog)

Em paralelo à Tela de Fechamento, recomenda-se a criação de `src/hooks/teaching/probability/two-dices/useTwoDicesLog.ts` espelhando arquitetura, semântica de tipos e API pública de `useRouletteLog.ts`. A diferença será nos eventos rastreados, ajustados ao vocabulário do OVA Dois Dados: transições de phase no `Experiment` (substitui `subStep`), tentativas dos exercícios 1 a 8 (substitui `attempt`), entradas de fração em `compute-probability` (substitui `text`), apostas na Corrida dos Carrinhos (substitui `bet`), resultado de cada lançamento da Corrida (substitui `spin_result`), e dois novos tipos específicos do Dois Dados: `study_menu_opened` para registrar abertura do StudyMenu com qual verbete inicial e quais foram navegados, e `mark_all_used` para registrar uso do botão "Marcar todos!" em qual sub-fase.

Os pontos de instrumentação devem ser exatamente: `checkOnClick` do `useTwoDicesHooks` (sucesso/falha de cada step do Ex7), `checkOnClick` do `useTwoDicesSingleShotHooks` (sucesso/falha de cada sub-fase do Ex6), `checkOnClick` do futuro `useTwoDicesGameAdvancedHooks` (sucesso/falha de cada step do Ex8), `setPhase` no `TwoDicesExperiment` (transições da máquina de estados principal), `goToNextStepOnClick` (transições internas dos exercícios), `setStudyMenuOpen` no `UnionExercise6Review` (abertura/fechamento do Menu), e o handler do botão "Marcar todos!" em ambos os exercícios.

A persistência segue o padrão do Disco: `localStorage` com chave `otimath_two_dices_log`, sessão identificada por `sessionStorage` para reset entre execuções, fallback gracioso para `localStorage` cheio. Exportação JSON via `downloadLog` para o estudante levar o arquivo em estudos futuros ou apresentar ao professor, e função `getLogSummary` que sintetiza os dados para a Tela de Fechamento Reflexiva.

### 3.5 Recomendação detalhada — Painel de Histórico do Estudante na própria sessão

Como elemento intermediário entre o log invisível e a Tela de Fechamento final, recomenda-se um **Painel de Histórico ao Vivo** acessível via novo botão sutil no canto superior direito do `TwoDicesPresentation` (ao lado dos botões de navegação dev, em produção visível ao estudante mas estilo discreto), que abra um overlay análogo ao Menu de Revisão mas com o conteúdo dinâmico do log atual: quais cenas já completou (com check verde), em qual está agora (com indicador), quais ainda virão (acinzentadas). Esse painel é uma materialização do princípio de **transparência da estrutura didática** (NIELSEN, 1994, heurística 1: visibilidade do estado do sistema) — o estudante a qualquer momento sabe onde está no percurso do OVA, reduz a ansiedade de "quanto falta" e desenvolve metacognição sobre a própria progressão.

---

## 4. O QUE FALTA NO OVA DOIS DADOS — SÍNTESE PRIORIZADA

Com base na reavaliação completa, o presente parecer identifica e ordena por prioridade as lacunas remanescentes do OVA Dois Dados, **considerando o recorte definitivo da dissertação** que reserva ao próximo OVA da sequência os tópicos de probabilidade condicional, eventos independentes com retiradas com e sem reposição, diagrama de árvore, teorema da probabilidade total, teorema de Bayes e probabilidade condicional em tabelas.

A lacuna de prioridade alta é a **ausência de instrumentação de log e da Tela de Fechamento Reflexiva** descritas na seção 3 deste parecer. Sua resolução fecha o requisito REQ-3 do framework DSR (validação longitudinal sistematizada) e oferece ao estudante a experiência metacognitiva que diferencia um OVA pedagógico maduro de um simulador autocontido. Estimativa: 3 a 4 horas de implementação após a conclusão do Ex8.

A lacuna de prioridade média é a **vulnerabilidade R14 residual no `useTwoDicesHooks.ts` em produção**, que continuará a servir o Ex7 e a cena 1 mesmo após a inclusão do Ex8 (que usa `eventParametrization` próprio). A migração do hook em produção para o framework `eventParametrization` é tecnicamente trivial (substituir o array `events` e o `getNewGame` pelo gerador validado) mas tem risco de regressão visual na cena 1 e no Ex7, motivo pelo qual permanece como dívida técnica documentada e não como bloqueador.

A lacuna de prioridade média-baixa é a **ausência de declaração explícita do pré-requisito T14** na documentação do OVA. Os exercícios 1 a 8 pressupõem que o estudante leia autonomamente o espaço amostral 6×6 como produto cartesiano de duas escolhas independentes (princípio fundamental da contagem aplicado ao caso 6×6 = 36), mas isso não está documentado como pré-requisito. Recomenda-se inserir no `TwoDicesInstructionsSection` (ou em equivalente acessado antes do início) um parágrafo explicando que o aluno aplicará a contagem cartesiana das 36 possibilidades, e na documentação científica em `docs/ovas/` registrar T14 como pré-requisito formal do OVA.

A lacuna de prioridade baixa é a **ausência de uma cena de articulação explícita com o próximo OVA** ao final do percurso, que prepare o terreno para os tópicos condicional, independência e Bayes que virão. Esta lacuna se resolve naturalmente pelo quarto componente da Tela de Fechamento Reflexiva descrito em 3.3, e portanto não exige ação adicional além da implementação daquela tela.

A lacuna de prioridade muito baixa, observada apenas como ponto de melhoria estética, é o fato de o `TwoDicesGame` original (Ex7) ainda usar layout `flex flex-wrap` (não 2D Venn) e não exibir cores nítidas por evento, criando um leve descompasso visual entre Ex6 e Ex7 quando o estudante alterna entre ambos. A migração também depende da resolução da lacuna de prioridade média descrita acima, e portanto fica naturalmente coberta por aquele trabalho futuro.

**O que NÃO falta** no OVA Dois Dados, considerando o recorte da dissertação: nada relacionado a probabilidade condicional, independência, retiradas com ou sem reposição, diagrama de árvore, teorema da probabilidade total ou teorema de Bayes — todos esses tópicos pertencem ao **próximo OVA da sequência didática**, conforme decisão expressa do orientando registrada nesta sessão. Sua eventual inclusão no Dois Dados violaria o princípio de coerência conceitual e o limite de profundidade adequado ao nível médio-introdutório que o Dois Dados se propõe a cobrir, e seria pedagogicamente prematura segundo o princípio brousseauniano de progressão sagrada (R7) — esses tópicos exigem o conceito amadurecido de "experimento composto com etapas dependentes" (T9-T12) que o Dois Dados deliberadamente não trabalha.

---

## 5. RECORTE DEFINITIVO — O QUE PERTENCE AO PRÓXIMO OVA

Para evitar deriva de escopo e blindar a defesa do OVA Dois Dados em banca PROFMAT, o presente parecer registra explicitamente, conforme decisão do orientando, o conjunto de tópicos que **não devem** ser abordados no OVA Dois Dados nem em revisões futuras dele, ficando integralmente reservados ao próximo OVA da sequência didática. São eles: probabilidade condicional P(A|B) com a redefinição do espaço amostral conforme a condição (Tópico 9 do mapa Dr. OtiMath); independência de eventos com a verificação P(A∩B) = P(A)·P(B) e a distinção entre exclusão e independência (Tópico 10); probabilidade total com particionamento e somatório de probabilidades condicionais ponderadas (Tópico 11); teorema de Bayes com inversão de condicional, atualização a posteriori e tratamento de testes diagnósticos com sensibilidade e especificidade (Tópico 12); diagrama de árvore como representação canônica de experimentos sequenciais com etapas dependentes; probabilidade condicional em tabelas de contingência com leitura por linha e por coluna; e os problemas de eventos independentes que envolvem retiradas de objetos com e sem reposição (urnas, cartas, bolas), que pedagogicamente exigem o conceito amadurecido de etapas sequenciais dependentes ou independentes conforme o protocolo de retirada.

Esse recorte é defensável teoricamente porque os Tópicos 9 a 12 formam um bloco conceitual coeso (todos giram em torno da redefinição do espaço amostral conforme uma condição ou da relação de independência entre experimentos), e separá-los do bloco T1 a T7 (espaço amostral, eventos, operações, complementar, equiprovável, frequência relativa, união) que o Dois Dados cobre é pedagogicamente correto: há transição de paradigma matemático e cognitivo que justifica o corte. O Dois Dados consolida o paradigma "evento como subconjunto de S equiprovável e fixo"; o próximo OVA introduzirá o paradigma "evento condicionado a outro evento, espaço amostral variável conforme contexto".

---

## 6. PARECER FINAL DR. OTIMATH

O OVA Probabilidade Dois Dados, em seu estado atual pós-commit f3bc970 e considerando o impacto previsto da inclusão do Exercício 8 conforme planejado para a próxima sessão, configura um artefato pedagógico de qualidade defensável em banca PROFMAT. Os Exercícios 6 e 7 implementados nesta sessão, articulados ao Menu de Revisão científico com sete verbetes mapeados a vieses cognitivos, à marcação sequencial colorida com remoção progressiva de placeholders inúteis, ao botão "Marcar todos!" com tooltip didático, ao layout 2D Venn com slots fixos para alinhamento estável, ao cursor `not-allowed` em checkboxes congelados, e à validação R14 nativa por multiplicação cruzada exata, materializam no código os referenciais teóricos do framework Dr. OtiMath de forma articulada e não decorativa. A implementação do Exercício 8 prevista para amanhã ampliará o pool sorteável para aproximadamente cinquenta eventos parametrizados com restrições matemáticas defensivas, progressão de dificuldade e balanceamento de famílias, sem comprometer a coerência arquitetural do produto.

A lacuna prioritária remanescente é a ausência de instrumentação de log para análise a posteriori e da Tela de Fechamento Reflexiva que apresentaria ao estudante o espelho metacognitivo do próprio percurso. Sua resolução, replicando arquiteturalmente o módulo `useRouletteLog.ts` do OVA Disco precedente e construindo a Tela de Fechamento conforme detalhado na seção 3 deste parecer, completaria materialmente o requisito REQ-3 do framework DSR e elevaria o OVA Dois Dados ao patamar de excelência pedagógica plena do projeto OtiMath. Recomenda-se sua execução prioritária imediatamente após a conclusão do Exercício 8.

Os tópicos de probabilidade condicional, independência, retiradas com e sem reposição, diagrama de árvore, teorema da probabilidade total e teorema de Bayes permanecem, conforme decisão expressa do orientando registrada nesta sessão, **integralmente reservados ao próximo OVA da sequência didática**, e essa decisão é defendida pelo presente parecer como pedagogicamente correta e teoricamente justificada pela transição de paradigma matemático que separa o bloco T1-T7 (objeto deste OVA) do bloco T9-T12 (objeto do próximo).

O parecer recomenda, em síntese: amanhã, executar o Exercício 8 conforme TODO registrado em `docs/ovas/TODO Ex8 - proxima sessao.md`; em seguida, implementar a instrumentação de log e a Tela de Fechamento Reflexiva conforme seção 3 deste parecer; deixar como dívida técnica documentada a migração do hook em produção para o framework `eventParametrization` (lacuna média); inserir nota explícita sobre T14 como pré-requisito; e proceder à preparação do próximo OVA da sequência com escopo claramente delimitado nos tópicos T9 a T12.

---

## 7. REFERÊNCIAS

ALMOULOUD, S. A.; COUTINHO, C. Q. S. Engenharia Didática: características e seus usos em trabalhos apresentados no GT-19/ANPEd. Revemat, v. 3, n. 1, p. 62-77, 2008.

ARTIGUE, M. Ingénierie didactique. Recherches en Didactique des Mathématiques, v. 9, n. 3, p. 281-308, 1988.

ARTIGUE, M. Perspectives on design research: the case of didactical engineering. In: BIKNER-AHSBAHS, A. et al. (ed.). Approaches to qualitative research in mathematics education. Dordrecht: Springer, 2014.

AUSUBEL, D. P. The acquisition and retention of knowledge. Dordrecht: Kluwer, 2000.

BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.

BATANERO, C. et al. Teaching and learning stochastics. Cham: Springer, 2016.

BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.

BROUSSEAU, G. Theory of didactical situations in mathematics. Dordrecht: Kluwer, 1997.

DRESCH, A.; LACERDA, D. P.; ANTUNES JUNIOR, J. A. V. Design Science Research: método de pesquisa para avanço da ciência e tecnologia. Porto Alegre: Bookman, 2015.

DUVAL, R. Registres de représentation sémiotique et fonctionnement cognitif de la pensée. Annales de Didactique et de Sciences Cognitives, v. 5, p. 37-65, 1993.

FREUDENTHAL, H. Revisiting mathematics education. Dordrecht: Kluwer, 1991.

GARFIELD, J.; BEN-ZVI, D. Developing students' statistical reasoning. Dordrecht: Springer, 2014.

KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. Cognitive Psychology, v. 3, n. 3, p. 430-454, 1972.

MAYER, R. E. (ed.). The Cambridge handbook of multimedia learning. 2. ed. Cambridge: Cambridge University Press, 2014.

NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students' difficulties in solving probability tasks. International Journal of Mathematical Education in Science and Technology, v. 47, n. 5, p. 732-747, 2016.

NIELSEN, J. Usability engineering. San Francisco: Morgan Kaufmann, 1994.

ROEDIGER, H. L.; KARPICKE, J. D. Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, v. 17, n. 3, p. 249-255, 2006.

ROHRER, D.; TAYLOR, K. The shuffling of mathematics problems improves learning. Instructional Science, v. 35, n. 6, p. 481-498, 2007.

VYGOTSKY, L. S. A formação social da mente. 4. ed. São Paulo: Martins Fontes, 1991.

---

*Parecer emitido por Dr. OtiMath em 2026-04-26.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
*"Explorando o Acaso: uma sequência didática interativa para o ensino de Probabilidade no Ensino Médio".*
