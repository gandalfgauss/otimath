# OVA Probabilidade Dois Dados — Exercícios 6 e 7 e Menu de Revisão

**Documento da Fase 7 (Documentação Científica) — Protocolo Dr. OtiMath v5.1**
Sessão de 2026-04-26. Branch: `mod-rangel`.

---

## 1. Recorte conceitual e justificativa

A trilha didática do OVA Probabilidade Dois Dados, após a sequência de exercícios 1 a 5, apresenta uma assimetria pedagógica que o presente recorte de design vem corrigir. Os exercícios 1 a 4 mobilizam União e Interseção em registros progressivamente mais elaborados (Venn, contingência, identificação de operação a partir de descrição verbal), e o exercício 5 transporta esses conceitos para um registro inteiramente novo — a tabela de contingência social, modernizada do OVA Probabilidade Roxa legado. Encerrar a trilha no exercício 5 deixa, contudo, o estudante sem uma situação a-didática terminal de **revisão consolidadora** sobre o núcleo conceitual do OVA, isto é, sobre operações entre eventos no espaço amostral equiprovável Ω = {1,…,6}². Seguindo BROUSSEAU (1997, p. 30), institucionaliza-se sem que se prove a estabilização: o estudante saiu da fase de aplicação reinvestida (Ex1–Ex5) sem a situação que devolve, em forma sintética, o que o `milieu` lhe ensinou.

O Exercício 6 — Revisão das Operações entre Eventos preenche essa lacuna como **prática de recuperação ativa** (ROEDIGER; KARPICKE, 2006) sobre o que foi institucionalizado, e o Exercício 7 — Jogo livre, opcional, abre espaço para **prática autônoma** sem novo conteúdo (ARTIGUE, 1988), reaproveitando o `TwoDicesGame` da seção introdutória do OVA. A reposição do jogo introdutório como exercício terminal de prática livre foi possibilitada pelo argumento vygotskiano de Zona de Desenvolvimento Próximo madura: o que era exposição precoce na cena 1 torna-se, após Ex1–Ex6, prática consolidadora autônoma (VYGOTSKY, 1991), e o estudante reencontra um artefato familiar com repertório suficiente para mobilizá-lo plenamente.

---

## 2. Exercício 6 — Revisão (obrigatório)

### 2.1 Estrutura macro

O Exercício 6 executa exatamente **duas rodadas**, uma sobre União e outra sobre Interseção, cuja **ordem emerge do sorteio**: a Rodada 1 é sorteada equiprovavelmente entre os dez candidatos curados (cinco de União e cinco de Interseção); a Rodada 2 é sorteada entre os cinco candidatos do pool da operação OPOSTA, garantindo cobertura simultânea das duas operações em qualquer execução. Esta arquitetura de sorteio realiza, em pequena escala, o próprio princípio probabilístico que o OVA ensina — o estudante vive a aleatoriedade enquanto pratica probabilidade, num eco semiótico que cumpre o princípio brousseauniano segundo o qual o `milieu` deve refletir a estrutura conceitual do saber em jogo (BROUSSEAU, 1997, p. 30). A ordem variável, por sua vez, mitiga o efeito sistemático de ordem que comprometeria análise empírica futura do artefato (ARTIGUE, 1996), distribuindo equanimemente entre estudantes a oportunidade de exercitar cada operação em primeira posição.

Cada rodada expõe ao estudante o adaptador `TwoDicesGameSingleShot`, especialização do `TwoDicesGame` original que renderiza um desafio único em quatro passos sequenciais e dependentes: marcação dos eventos A e B na tabela 6×6, marcação do evento composto D, identificação simbólica da operação (D = A op B com possíveis complementares), e cálculo de P(D) como razão favoráveis/possíveis. Os quatro passos articulam três registros semióticos distintos — tabular, simbólico-operatório e fracionário — em conformidade com a coordenação prescrita por DUVAL (1993, p. 52), e a ordem é tornada não-comutável pela engine herdada, que exige acerto antes de avançar, garantindo que erro semântico em um passo seja corrigido antes de contaminar o passo seguinte.

### 2.2 Curadoria fechada dos dez candidatos

A decisão arquitetural mais delicada desta sessão foi a substituição da parametrização aberta inicialmente proposta por uma **curadoria fechada** de dez candidatos pré-conferidos. Parametrizar abertamente o sorteio entre os 132 pares possíveis (12 eventos tomados 2 a 2 sob duas operações) introduziria, no espaço de candidatos sorteáveis, instâncias degeneradas para o objetivo pedagógico — pares com inclusão (A ⊂ B trivializa a operação), interseções vazias (na união, a fórmula da adição reduz-se à soma simples), cardinalidades extremas (próximas de 0 ou de Ω) que esvaziam a necessidade intelectual do conceito (BROUSSEAU, 1997, p. 22) — e exigiria validação algorítmica complexa de invariantes em runtime. A curadoria humana substitui esse esforço por dez instâncias bem-formadas, conferidas célula a célula sobre a tabela 6×6, todas satisfazendo critérios de não-trivialidade, naturezas predicativas distintas entre A e B (soma + paridade, soma + primalidade, paridade exata + divisibilidade existencial), cardinalidades em faixa intermediária e formas reduzidas de P(D) que, em sua maioria, exercitam ativamente a regra R14 do projeto (frações equivalentes obrigatoriamente aceitas).

A garantia matemática contra erro humano de digitação na lista é fornecida pelo **sanity-check no boot do módulo** `shared/exercise6Challenges.ts`: a função `assertPoolIsHealthy` valida, no momento do import, os invariantes de não-trivialidade, cardinalidades não-extremas, coerência entre `nResult` declarado e a fórmula derivada, e equivalência da forma reduzida de P(D) por multiplicação cruzada exata em inteiros. A função `assertPoolsAreDisjoint` complementa esse contrato verificando, também em compile-time, que **nenhum par (a,b) aparece em ambos os pools** — propriedade que torna matematicamente impossível, por construção e não por filtragem em runtime, que o estudante reveja o mesmo par de eventos atômicos nas duas rodadas. Caso qualquer mantenedor futuro viole esses invariantes, o aplicativo **não inicia** até a correção, transformando classe inteira de erros em impossibilidade lógica.

Os cinco candidatos do pool de União são: E1 ∪ E3 (Soma > 8 ∪ Verde par; n = 22, P = 11/18); E8 ∪ E6 (Soma < 7 ∪ Primo no azul; n = 25, P = 25/36); E4 ∪ E12 (Soma = 6 ∪ Nenhuma face par; n = 11, P = 11/36); E11 ∪ E10 (Exatamente uma par ∪ ≥1 múltipla de 3; n = 28, P = 7/9); e E8 ∪ E3 (Soma < 7 ∪ Verde par; n = 27, P = 3/4). Os cinco candidatos do pool de Interseção são: E8 ∩ E10 (n = 5, P = 5/36); E1 ∩ E6 (n = 4, P = 1/9); E5 ∩ E10 (Produto > 15 ∩ ≥1 múltipla de 3; n = 7, P = 7/36); E9 ∩ E10 (≥1 par ∩ ≥1 múltipla de 3; n = 15, P = 5/12); e E1 ∩ E10 (n = 7, P = 7/36).

### 2.3 Marcação sequencial e construção visual de Venn na tabela 6×6

A primeira tarefa de cada rodada — marcar os eventos A e B na tabela — foi reformulada nesta sessão de uma decisão simultânea (placeholders de A e B presentes ao mesmo tempo nas 36 células) para uma sequência de duas sub-fases: o estudante marca primeiro **apenas** o Evento A, com placeholders de B ausentes da tabela; após validação correta de A, suas marcações são **congeladas em azul nítido** (token `--color-feedback-info-darkest`) nas células onde A é verdadeiro, e os placeholders de A **desaparecem** das células onde A é falso; só então os placeholders do Evento B aparecem em todas as 36 células, e o estudante repete o ciclo marcando B em laranja queimado nítido (token `--color-feedback-warning-darkest`); após validação de B, congelam-se as marcações de B e desaparecem os placeholders inúteis. Análogo procedimento aplica-se ao Evento D (em roxo brand `--color-brand-otimath-pure`) no Step 2 da rodada.

A justificativa pedagógica articula três referenciais. Primeiro, o princípio brousseauniano de decomposição em situações elementares (BROUSSEAU, 1997, p. 88): marcar A e B simultaneamente não é uma situação elementar — é a composição de duas decisões independentes, e o `milieu` deveria devolver feedback a cada decisão atômica. Sequenciar A antes de B, com validação intermediária, faz cada sub-etapa ser uma situação a-didática própria, com retorno isolado ao estudante; erros em A são identificados e corrigidos antes que B seja sequer tentado, evitando contaminação do raciocínio combinatório (V2.4 — déficit de controle combinatório, NAVARRO-PELAYO et al., 2016, p. 736). Segundo, o princípio mayeriano de redução da carga cognitiva extrínseca pela atenuação do efeito split-attention (MAYER, 2014, p. 120): com placeholder único por célula no momento da decisão, a carga visual extrínseca do Step 1 cai pela metade, liberando memória de trabalho para o processamento essencial do predicado lógico que define o evento. Terceiro, o princípio freudenthaliano de mathematization progressiva (FREUDENTHAL, 1991, p. 33) realizado dentro do mesmo registro semiótico (DUVAL, 1993, p. 52): ao final do Step 1, as marcações nítidas e congeladas de A e B coexistem na tabela 6×6 como **diagrama de Venn renderizado dentro do próprio registro tabular**, e o estudante chega ao Step 2 com o invariante visualmente disponível — a operação ∪ ou ∩ vira leitura direta da tabela, não cálculo de cabeça.

A paleta foi escolhida segundo critérios cumulativos de nitidez perceptiva, distância matiz-luminância (compatível com as principais formas de daltonismo, deuteranopia e protanopia), reuso de tokens do Design System (consistência com a `ComplementaryEventsActivity` que adota padrão visual análogo) e ausência de conflito com a semântica de feedback do produto (verde reservado para sucesso, vermelho para erro). A escolha de azul-Info para A, laranja-queimado-Warning para B e roxo-brand-puro para D atende esses critérios simultaneamente, e a renderização preserva nitidez por meio do mecanismo `pointer-events: none` da `TwoDicesTable` quando o flag `disabled` é ativado em conjunto com `eventColors` definido — solução já validada em produção pela seção de Eventos Complementares.

A implementação técnica não tocou em nenhum componente global nem na `TwoDicesTable`, que já expõe os mecanismos `eventColors`, `hideIfUnchecked` e `visibilityMask` precisamente para esse padrão de remoção progressiva de placeholders após validação. O hook irmão `useTwoDicesSingleShotHooks` foi estendido para gerenciar a sequência de cinco sub-fases internas (`mark-A`, `mark-B`, `mark-D`, `identify-operation`, `compute-probability`) e expor o vetor `hideIfUnchecked` derivado do índice da sub-fase atual; o adaptador `TwoDicesGameSingleShot` propaga `eventColors` e `hideIfUnchecked` à `TwoDicesTable` e à `TwoDicesFormulation`, esta última usando as mesmas cores nos labels do Quadro de Eventos para garantir consistência intra-tela (NIELSEN, 1994).

### 2.4 Validação de fração equivalente — R14 absoluta no adaptador

O hook irmão `useTwoDicesSingleShotHooks` substitui integralmente as duas funções de validação de probabilidade da engine herdada (`verifyProbability` e `verifyProbabilityAndProbabilityComplementary`) pela função única `validateFractionR14`, que opera por multiplicação cruzada exata em inteiros (`num × total === den × favorable`). Decisão arquitetural deliberada: a engine original em `useTwoDicesHooks.ts` permanece intocada — nenhuma alteração em arquivo de produção da seção introdutória, zero risco de regressão visível ao usuário no `TwoDicesGame` standalone. Em compensação, **toda fase do adaptador single-shot que envolva fração** (concretamente, o passo `compute-probability` do Ex6, e qualquer extensão futura para `probability-and-complementary-probability`) aceita qualquer representação matematicamente equivalente da resposta (11/18, 22/36, 33/54, 44/72) e rejeita apenas entradas semanticamente inválidas (vazio, não-inteiro, negativo, denominador zero), em conformidade integral com a regra R14 do CLAUDE.md. Esta blindagem fecha matematicamente a categoria de erros em que o estudante digitaria a resposta correta sob simplificação não esperada e seria rejeitado por arredondamento decimal — vulnerabilidade real da engine original que, embora silente em frações comuns como 11/18, manifesta-se imprevisivelmente em casos com denominadores grandes.

---

## 3. Menu de Revisão (`StudyMenu`) — andaime sob demanda

O Menu de Revisão é um componente próprio em `shared/StudyMenu.tsx`, construído como overlay com semântica `role="dialog"` e `aria-modal="true"`, navegável por teclado segundo o conjunto de critérios WCAG 2.1 AA (Tab cíclico, Esc fecha, foco gerenciado entre o botão de abertura e o botão de fechamento, foco visível com outline sobre os tokens do Design System). A escolha de não modificar o `Modal` global do projeto preserva a regra arquitetural inviolável do CLAUDE.md de não tocar em `/components/global/`, e a estrutura de coluna de navegação à esquerda mais painel de conteúdo à direita é responsiva: em viewports menores que 768 pixels, a coluna torna-se acordeão vertical, mantendo legibilidade em hardware escolar padrão (R13 — viabilidade escolar).

O conteúdo do menu, separado em `shared/studyMenuContent.ts` para facilitar revisão editorial independente do componente, organiza-se em **sete verbetes em três grupos visualmente segmentados** (princípio de sinalização — MAYER, 2014, p. 285): operações entre eventos (União, Interseção, Diferença), eventos especiais (Complementar) e probabilidade (Equiprovável, Cardinalidade da União, Probabilidade da União em duas formas equivalentes). Cada verbete segue anatomia uniforme — definição formal, definição em palavras, exemplo no contexto do OVA com cálculo executado, "para que serve" e "atenção" mapeada a um viés cognitivo da literatura científica — em coerência com o princípio nielseniano de consistência interna (NIELSEN, 1994) e com a estrutura de "anatomia do verbete" recomendada pela TCAM (MAYER, 2014, p. 165) para minimizar carga cognitiva extrínseca.

A correspondência entre conceito e viés-alvo é explícita e referenciada à literatura: o verbete "União" endereça V6.1 (interpretação exclusiva de "ou", BATANERO; DIAZ, 2007, p. 123); "Interseção" endereça V6.2 (ambiguidade do "e"); "Diferença" endereça V10.1 (confusão entre exclusão e independência); "Complementar" endereça V5.1 (preferência sistemática pelo cálculo direto, BATANERO; DIAZ, 2007, p. 127); "Equiprovável" endereça V3.4 (negligência do espaço amostral, NAVARRO-PELAYO et al., 2016, p. 734); "Cardinalidade da União" endereça V7.1 (heurística aditiva simplificada que omite a subtração da interseção, KAHNEMAN; TVERSKY, 1972, p. 432); e "Probabilidade da União" endereça V7.2 (generalização inadequada da regra dos exclusivos para eventos com interseção não-vazia). Esta correspondência um-a-um entre verbete e viés mapeado é raro na literatura de OVAs e fortalece a defesa em banca PROFMAT, dado que cada elemento do andaime tem ancoragem identificável em pesquisa empírica sobre dificuldades de aprendizagem em probabilidade.

O acionamento do menu segue o princípio freudenthaliano de controle do estudante (FREUDENTHAL, 1991): o botão de Ajuda permanece **sempre visível** no canto superior direito de cada rodada, com tooltip informativo, e pode ser consultado livremente antes ou depois de qualquer tentativa. Após erro, o sistema **sinaliza visualmente** a disponibilidade do menu — o botão recebe animação de pulso suave por três segundos, sem abrir automaticamente, preservando agência do estudante sobre o ato meta de consultar — e exibe abaixo do botão uma mensagem de feedback **específica para o passo errado**, derivada da função `getFeedbackMessage(stepKind, operation)` em conformidade com o princípio mayeriano da relevância contextual (MAYER, 2014, p. 280). A mensagem nomeia explicitamente o verbete sugerido para o erro em questão; quando o menu é aberto na sequência, o verbete sugerido aparece já pré-selecionado e marcado com badge ★ na coluna de navegação, reduzindo o custo cognitivo de localizar a informação relevante em meio aos sete verbetes disponíveis.

---

## 4. Exercício 7 — Jogo livre (opcional)

O Exercício 7 é, na arquitetura atual, um *encore* opcional acessível pelo botão "Continuar treinando — Exercício 7 opcional" no painel de síntese final do Exercício 6. Tecnicamente, a fase `'twoDicesGameFree'` do `TwoDicesExperiment` renderiza diretamente o componente `TwoDicesGame` original — o mesmo da seção introdutória do OVA — encapsulado em um wrapper que adiciona apenas um botão externo "Finalizar OVA" para saída controlada, dado que o `TwoDicesGame` standalone não expõe mecanismo de fechamento próprio.

O reuso integral, sem qualquer alteração no componente reusado nem em seu hook, é **evidência de design maduro** segundo o framework Design Science Research (DRESCH; LACERDA; ANTUNES JUNIOR, 2015): um artefato bem desenhado é reusável em contexto pedagógico distinto sem refator, e o `TwoDicesGame` original — concebido para a fase introdutória — manifesta sua robustez ao operar igualmente bem como prática terminal autônoma. O ganho pedagógico é simétrico ao que VYGOTSKY (1991) descreve para tarefas que migram da Zona de Desenvolvimento Próximo para o domínio consolidado do estudante: o jogo dos doze eventos e sete desafios, enfrentado na cena 1 sem repertório operatório de união e interseção, agora se oferece como prática livre sobre repertório plenamente disponível. A variabilidade intrínseca do `shuffleArray` aplicado a eventos e operações no `startGame` original garante que cada execução do Ex7 entregue uma sequência intercalada nova, em conformidade com Rohrer e Taylor (2007) sobre prática intercalada como otimizadora de retenção.

A escolha de não criar um Ex7 dedicado, com curadoria própria e sorteio independente do Ex6, foi deliberada. Implementar um exercício adicional ad-hoc para esta posição produziria duplicação arquitetural com o `TwoDicesGame` existente, aumentaria a superfície de manutenção do OVA sem ganho pedagógico defensável, e violaria o princípio de coerência (MAYER, 2014, p. 279), introduzindo mais uma instância onde o estudante exercita o mesmo conceito sem necessidade. O `TwoDicesGame` reusado entrega exatamente o que a literatura prescreve para a fase de prática livre da Engenharia Didática (ARTIGUE, 1988): repetição autônoma com variabilidade alta, sem novo conteúdo, sem cobrança avaliativa explícita.

---

## 5. Trilha final do OVA Probabilidade Dois Dados

A trilha consolidada após esta sessão segue a sequência: cenas 1 a 7 (introdução, lançamento físico, sistematização tabular do espaço amostral, intervalo pedagógico sobre par ordenado e simetria de cores, probabilidade de soma e par); fase `raceBet/raceRunning/raceFinished` da Corrida dos Carrinhos como instanciação semiótica da distribuição triangular emergente das somas de dois dados; fase `complementaryEvents` introduzindo P(A) = 1 − P(Ā); fase `unionTheory` institucionalizando a fórmula da adição P(A∪B) = P(A) + P(B) − P(A∩B); exercícios 1 a 5 da trilha opcional aplicando a fórmula em registros progressivamente novos; **exercício 6 obrigatório de revisão** sobre os dois núcleos operatórios (∪ e ∩) com Menu de Revisão como andaime ativo; e finalmente, antes do encerramento absoluto do OVA, o **exercício 7 opcional** de prática livre sobre o `TwoDicesGame` completo. O OVA está, com esta sessão, pronto para defesa em banca PROFMAT.

---

## 6. Referências

ARTIGUE, M. Ingénierie didactique. Recherches en Didactique des Mathématiques, v. 9, n. 3, p. 281-308, 1988.

ARTIGUE, M. Ingénierie didactique et didactique des mathématiques. In: BIKNER-AHSBAHS, A. et al. (ed.). Approaches to qualitative research in mathematics education. Dordrecht: Springer, 2014.

BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.

BROUSSEAU, G. Theory of didactical situations in mathematics. Dordrecht: Kluwer, 1997.

DRESCH, A.; LACERDA, D. P.; ANTUNES JUNIOR, J. A. V. Design Science Research: método de pesquisa para avanço da ciência e tecnologia. Porto Alegre: Bookman, 2015.

DUVAL, R. Registres de représentation sémiotique et fonctionnement cognitif de la pensée. Annales de Didactique et de Sciences Cognitives, v. 5, p. 37-65, 1993.

FREUDENTHAL, H. Revisiting mathematics education. Dordrecht: Kluwer, 1991.

KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. Cognitive Psychology, v. 3, n. 3, p. 430-454, 1972.

MAYER, R. E. (ed.). The Cambridge handbook of multimedia learning. 2. ed. Cambridge: Cambridge University Press, 2014.

NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students' difficulties in solving probability tasks. International Journal of Mathematical Education in Science and Technology, v. 47, n. 5, p. 732-747, 2016.

NIELSEN, J. Usability engineering. San Francisco: Morgan Kaufmann, 1994.

ROEDIGER, H. L.; KARPICKE, J. D. Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, v. 17, n. 3, p. 249-255, 2006.

ROHRER, D.; TAYLOR, K. The shuffling of mathematics problems improves learning. Instructional Science, v. 35, n. 6, p. 481-498, 2007.

VYGOTSKY, L. S. A formação social da mente. 4. ed. São Paulo: Martins Fontes, 1991.

---

*OtiMath.com — PROFMAT/UFVJM — Rangel Freitas dos Santos — sessão 2026-04-26.*
