# Relatório DETALHADO de propostas, capítulo de Fundamentação Teórica
## Data: 2026-04-29

Cada proposta abaixo mostra o **texto exato antes** e o **texto exato depois**. Você pode aplicar uma a uma no Overleaf e marcar como "feito" à medida que avança.

---

## PROPOSTA 01, Introdução da seção `Sequências Didáticas`

**Localização**: início da seção `\section{Sequências Didáticas}`.
**Tipo**: fusão de 3 parágrafos em 1 + remoção de 1 parágrafo.

### ANTES (4 parágrafos atuais)

```latex
\hl{SEQUÊNCIA DIDÁTICA NA EDUCAÇÃO} A organização do ensino em todas as áreas pedagógicas por meio de sequências didáticas tem se consolidado, nas últimas décadas, como uma estratégia pedagógica que contribui para o planejamento sistemático de situações de ensino e aprendizagem orientadas por objetivos claros, progressão conceitual e articulação entre conteúdos, metodologias e avaliação.

\hl{SEQUÊNCIA DIDÁTICA NO ENSINO DE MATEMÁTICA} A organização do ensino por meio de sequências didáticas firmou-se como uma das abordagens centrais na Educação Matemática contemporânea. Na Educação Matemática, esse conceito foi aprofundado a partir das contribuições da Engenharia Didática e da Teoria das Situações Didáticas que serão abordadas mais adiante. \citeonline{artigue2014} destaca que a elaboração de uma sequência requer análise epistemológica do conteúdo, antecipação de dificuldades cognitivas e controle interno das escolhas didáticas. \citeonline{brousseau2002}, por sua vez, argumenta que o ensino deve organizar situações que produzam necessidade intelectual real para o estudante, superando a lógica expositiva tradicional.

Para o professor de Matemática, essa discussão torna-se particularmente relevante quando se trata do ensino de conteúdos abstratos, como a Probabilidade. A natureza contraintuitiva de muitos conceitos probabilísticos demanda organização progressiva que favoreça a construção de significados antes da formalização conceitual \cite[p.~9, 16, 23]{batanero2016}. Nesse contexto, a sequência didática organiza situações de ensino que partem das concepções informais dos estudantes para avançar progressivamente em direção à formalização matemática \cite[p.~159--160]{artigue2014}\cite{brousseau2002}.

\hl{SEQUÊNCIA DIDÁTICA NO ENSINO DE MATEMÁTICA PARA ALÉM DO ENCADEAMENTO DE EXERCÍCIOS} No âmbito da Educação Matemática, uma sequência de ensino bem estruturada resulta de um processo cuidadoso de planejamento. As situações propostas são escolhidas de acordo com a natureza do conteúdo matemático que se deseja ensinar \cite[p.~66, 88]{brousseau2002}, de forma que cada etapa apresente desafios conceituais que levem o estudante a rever e ampliar sua forma de pensar. Isso significa que o professor precisa antecipar as dificuldades dos alunos, compreender a essência do saber envolvido e avaliar suas próprias escolhas ao longo do caminho \cite[p.~159-161]{artigue2014}. É esse conjunto de decisões intencionais que separa uma sequência didática bem planejada de uma simples organização cronológica de conteúdos.
```

### DEPOIS (1 parágrafo único, mantendo Zabala em parágrafo separado)

```latex
\hl{SEQUÊNCIA DIDÁTICA NA EDUCAÇÃO E NA MATEMÁTICA} A organização do ensino por meio de sequências didáticas firmou-se como uma das abordagens centrais na Educação Matemática contemporânea, contribuindo para o planejamento sistemático de situações orientadas por objetivos claros, progressão conceitual e articulação entre conteúdos, metodologias e avaliação. \citeonline{artigue2014} destaca que a elaboração de uma sequência requer análise epistemológica do conteúdo, antecipação de dificuldades cognitivas e controle interno das escolhas didáticas. \citeonline{brousseau2002}, por sua vez, argumenta que o ensino deve organizar situações que produzam necessidade intelectual real para o estudante, superando a lógica expositiva tradicional. Essa discussão torna-se particularmente relevante no ensino de conteúdos abstratos como a Probabilidade, cuja natureza contraintuitiva demanda organização progressiva que favoreça a construção de significados antes da formalização \cite[p.~9, 16, 23]{batanero2016}.
```

**Justificativa**: três parágrafos repetiam a tese "sequência didática como organização racional"; condensar em um único elimina o martelamento sem perda argumentativa.

---

## PROPOSTA 02, Subseção `Engenharia Didática`

**Localização**: `\subsection{Engenharia Didática}`.
**Tipo**: fusão de 3 parágrafos das etapas 2, 3 e 4 em 1.

### ANTES (3 parágrafos das etapas)

```latex
\hl {ETAPA 2 DA ABORDAGEM DA ENGENHARIA DIDÁTICA: CONCEPÇÃO E ANÁLISE A PRIORI} A etapa seguinte, denominada concepção e análise a priori, corresponde à elaboração das situações didáticas e à antecipação das interações possíveis entre estudante, saber e meio. Segundo Almouloud e Silva (2012), nessa fase o pesquisador delimita um campo de possibilidades e formula hipóteses sobre os comportamentos e estratégias que os alunos podem mobilizar. Essa antecipação não se limita à previsão de respostas corretas ou incorretas. O foco recai sobre os raciocínios prováveis, as representações intermediárias e as condições necessárias para que o estudante avance conceitualmente. A análise a priori funciona, assim, como instrumento de controle interno da sequência, pois permite justificar cada escolha didática realizada antes da implementação.

\hl {ETAPA 3 DA ABORDAGEM DA ENGENHARIA DIDÁTICA: IMPLEMENTAÇÃO DA SEQUÊNCIA} A implementação da sequência, correspondente à fase de experimentação, e coloca essas previsões à prova em contexto real de sala de aula. Nesse momento, o professor assume simultaneamente o papel de mediador do processo e de observador das interações efetivamente produzidas. Almouloud e Coutinho (2008) ressaltam que a experimentação se articula diretamente à análise a posteriori e à validação, uma vez que admite correções, alterações e ajustes nas escolhas didáticas. Longe de representar a aplicação rígida de um plano previamente definido, essa fase explicita o confronto entre previsões teóricas e dinâmica empírica, tornando visíveis elementos imprevistos que exigem reposicionamentos fundamentados.

\hl {ETAPA 4 DA ABORDAGEM DA ENGENHARIA DIDÁTICA: ANÁLISE A POSTERIORI E VALIDAÇÃO} A análise a posteriori e a validação encerram o ciclo metodológico da Engenharia Didática. Artigue (1996) enfatiza que a validação se realiza internamente, por meio da confrontação entre análise a priori e análise a posteriori. Esse princípio reforça a ideia de que a qualidade do design didático depende da consistência das previsões formuladas inicialmente. Quando tais previsões são frágeis ou genéricas, a validação perde força analítica e a sequência tende a se apoiar apenas em impressões subjetivas de funcionamento.
```

### DEPOIS (1 parágrafo único)

```latex
\hl {CONCEPÇÃO, EXPERIMENTAÇÃO E VALIDAÇÃO} As três fases seguintes encadeiam-se em ciclo. Na concepção e análise a priori, o pesquisador delimita um campo de possibilidades e formula hipóteses sobre raciocínios, representações intermediárias e condições necessárias para o avanço conceitual \cite{almoulouSilva2012}, justificando cada escolha didática antes da implementação. Na experimentação, o professor assume simultaneamente o papel de mediador e de observador das interações efetivamente produzidas, admitindo correções e ajustes em diálogo com a análise a posteriori \cite{almoulouCoutinho2008}. Na análise a posteriori e validação, que encerram o ciclo, a validação realiza-se internamente, pela confrontação entre análise a priori e a posteriori \cite{artigue1996}: a qualidade do design depende da consistência das previsões formuladas, e quando estas são frágeis ou genéricas, a sequência tende a apoiar-se apenas em impressões subjetivas de funcionamento.
```

**Justificativa**: o detalhamento operacional das etapas pertence ao Cap. de Metodologia; aqui basta apresentar o ciclo.

---

## PROPOSTA 03, Subseção `Teoria das Situações Didáticas`, fusão A

**Localização**: `\subsection{Teoria das Situações didáticas}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {DEVOLUÇÃO E RUPTURA DO CONTRATO DIDÁTICO EM BROUSSEAU} Para que uma situação adidática funcione, o professor precisa realizar o que Brousseau chama de devolução: transferir ao estudante a responsabilidade pela situação e resistir à tentação de intervir antes da hora (Brousseau, 2002). Isso não significa abandonar o aluno, mas garantir que o conhecimento emerja do confronto com a situação e não de uma explicação prévia. Esse movimento se opõe ao contrato didático implícito que costuma operar nas aulas, no qual o professor apresenta o modelo e o estudante o repete. Brousseau (2002, p. 31) é claro ao afirmar que romper esse contrato é condição para que a aprendizagem ocorra de fato.

\hl {MEDIAÇÃO DOCENTE: QUANDO E COMO INTERVIR} Diante dessa exigência, a mediação docente assume papel decisivo. Intervir em excesso pode comprometer a devolução da situação ao estudante; intervir de menos pode transformar o impasse em estagnação \cite{brousseau2002}. Decidir quando intervir, como intervir e com que intensidade intervir constitui uma competência docente central na gestão de sequências didáticas \cite[p.~159]{artigue2014}. Essa decisão exige atenção contínua às produções dos estudantes, às interações em curso e aos objetivos formativos visados, sobretudo em contextos em que recursos tecnológicos ampliam as possibilidades de interação e impõem novas demandas de regulação didática.
```

### DEPOIS

```latex
\hl {DEVOLUÇÃO E MEDIAÇÃO DOCENTE} Para que uma situação adidática funcione, o professor precisa realizar a \emph{devolução}: transferir ao estudante a responsabilidade pela situação e resistir à tentação de intervir antes da hora \cite[p.~31]{brousseau2002}. Esse movimento opõe-se ao contrato didático implícito em que o professor apresenta o modelo e o estudante o repete; rompê-lo é condição para que a aprendizagem ocorra. A mediação docente assume, então, papel decisivo: intervir em excesso compromete a devolução, intervir de menos transforma o impasse em estagnação \cite{brousseau2002}, e decidir quando, como e com que intensidade intervir constitui competência docente central na gestão de sequências didáticas \cite[p.~159]{artigue2014}.
```

**Justificativa**: ambos sustentam a mesma tese (devolução exige mediação docente equilibrada).

---

## PROPOSTA 04, Subseção `Teoria das Situações Didáticas`, fusão B

**Localização**: `\subsection{Teoria das Situações didáticas}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl{LIMITE EPISTEMOLÓGICO DA SITUAÇÃO ADIDÁTICA} A presença de um problema inicial não garante, por si só, a emergência de necessidades epistemológicas. Para que haja reorganização conceitual, é necessário que os efeitos do meio sobre o estudante sejam suficientes para provocar, por si mesmos, as adaptações esperadas — caso contrário, toda a virtude didática permanece contida no contrato didático, tornando a situação adidática ``totalmente incapaz de provocar qualquer aprendizagem'' \cite[p.~58, tradução nossa]{brousseau2002}. Esse limite epistemológico orienta diretamente o desenho do milieu desta sequência: as situações centrais foram concebidas para que os retornos do Objeto Virtual de Aprendizagem confrontem o estudante com evidências que o cálculo intuitivo não consegue acomodar, garantindo que a necessidade conceitual emerja do funcionamento da situação e não da intervenção docente.

\hl {TSD E INSTITUCIONALIZAÇÃO: DO SABER CONSTRUÍDO AO CONHECIMENTO MATEMÁTICO} A devolução, contudo, não encerra o papel do professor. O ciclo da TDS se encerra apenas com a institucionalização, momento em que o professor reconhece o saber construído e lhe confere significado matemático formal (Brousseau, 2002), conectando a experiência vivida ao conhecimento que a escola precisa ensinar. Assim, depois que o estudante construiu respostas a partir da situação proposta, cabe ao docente conduzir o momento da institucionalização, etapa em que o saber produzido durante a atividade passa a ser reconhecido como conhecimento matemático válido. Brousseau (1997, p. 56) afirma que institucionalizar significa reconhecer, para além da situação que originou o conhecimento, seu valor cultural e científico. Para o professor de Matemática, isso significa ajudar o estudante a perceber que o que ele descobriu na atividade tem nome, forma e significado dentro da Matemática, sem apagar o caminho percorrido, pois é esse caminho que permite ao estudante entender por que o conceito existe, e não apenas como usá-lo.
```

### DEPOIS

```latex
\hl{LIMITE EPISTEMOLÓGICO E INSTITUCIONALIZAÇÃO} A presença de um problema inicial não garante, por si só, a emergência de necessidades epistemológicas: para que haja reorganização conceitual, os efeitos do meio devem ser suficientes para provocar, por si mesmos, as adaptações esperadas, sob pena de tornar a situação adidática ``totalmente incapaz de provocar qualquer aprendizagem'' \cite[p.~58, tradução nossa]{brousseau2002}. As situações centrais desta sequência foram concebidas para que os retornos do Objeto Virtual de Aprendizagem confrontem o estudante com evidências que o cálculo intuitivo não consegue acomodar. O ciclo da TSD encerra-se apenas com a institucionalização, momento em que o professor reconhece o saber construído e lhe confere significado matemático formal \cite[p.~56]{brousseau1997}, conectando a experiência vivida ao conhecimento que a escola precisa ensinar.
```

**Justificativa**: limite epistemológico e institucionalização são polos do mesmo ciclo da TSD.

---

## PROPOSTA 05, Subseção `Teoria das Situações Didáticas`, remoção

**Localização**: `\subsection{Teoria das Situações didáticas}`.
**Tipo**: remoção integral de parágrafo.

### ANTES (parágrafo a apagar)

```latex
\hl {TSD E O ENSINO DE PROBABILIDADE: DA SITUAÇÃO DIDÁTICA À INSTITUCIONALIZAÇÃO} No ensino de Probabilidade, a TSD orienta diretamente a construção das situações didáticas. Conceitos como espaço amostral, frequência relativa e probabilidade condicional podem ser trabalhados em situações em que o estudante precisa tomar decisões, comparar resultados e rever suas intuições sem que o professor antecipe as respostas. Um experimento com dados ou uma simulação computacional só cumpre esse papel quando exige do estudante interpretação e justificativa, ao invés de, simplemente, uma leitura de resultados.
```

### DEPOIS

Parágrafo apagado integralmente.

**Justificativa**: argumento integralmente coberto pela subseção `Particularidades das abordagens com OVAs`.

---

## PROPOSTA 06, Subseção `Particularidades das abordagens com OVAs`

**Localização**: `\subsection{Particularidades das abordagens com OVAS}`.
**Tipo**: fusão de 2 parágrafos + remoção de 1 parágrafo.

### ANTES (3 parágrafos)

```latex
\hl{TECNOLOGIA DIGITAL E CICLOS DE AJUSTE NO ENSINO DE MATEMÁTICA} Além das abordagens anteriores, ciclos iterativos de concepção têm orientado o desenvolvimento de sequências didáticas que integram tecnologias digitais. Sequências mediadas por tecnologia precisam ser concebidas, testadas e ajustadas de forma contínua, e não definidas de uma vez antes da aplicação. Cada ciclo envolve planejar as situações e os recursos digitais, aplicá-los em sala, observar como os estudantes interagem e revisar as escolhas com base nessas evidências. Em comparação com a Engenharia Didática, esses ciclos são menos formalizados, mas exigem o mesmo compromisso: que os ajustes sejam feitos com base no pensamento matemático dos estudantes e não em impressões subjetivas de funcionamento.

\hl {OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM EM PROBABILIDADE} Nesta pesquisa, os ciclos iterativos orientam o desenvolvimento dos Objetos Virtuais de Aprendizagem e das simulações integradas à sequência didática. \citeonline{borbaScucugliaGadanidis2014} destacam que ambientes digitais interativos permitem ao estudante experimentar, visualizar e reformular ideias em tempo real. No ensino de Probabilidade, esse potencial é particularmente decisivo, pois \citeonline{kataokaOliveiraSouza2011} sustentam que a abordagem frequentista no Ensino Básico depende da possibilidade de executar repetições em escala inviável manualmente, observando a estabilização da frequência relativa em direção à probabilidade teórica. A cada ciclo, as situações são avaliadas quanto à sua capacidade de gerar uma necessidade real de aprender, preservando o princípio central da TSD de que a tecnologia fortalece o milieu, mas não substitui o desafio intelectual que deve mover o estudante: um simulador só cumpre função didática se estiver inserido em situação que exija interpretação e tomada de decisão.

\hl {SEQUÊNCIA DIDÁTICA: EXPLICITAÇÃO TEÓRICA E RACIONALIDADE DIDÁTICA} Em síntese, elaborar uma sequência didática implica explicitar a abordagem metodológica que sustenta o percurso e os critérios que orientam sua análise e validação. Seja ancorada na Engenharia Didática, na Aprendizagem Baseada em Problemas ou em ciclos iterativos de concepção, a sequência só adquire consistência quando suas decisões são justificadas teoricamente e seus ajustes se apoiam em evidências do pensamento matemático mobilizado pelos estudantes. É essa explicitação que afasta a prática de soluções intuitivas e a aproxima de uma racionalidade didática consciente, capaz de produzir tanto organização do ensino quanto conhecimento sobre o próprio processo educativo.
```

### DEPOIS (1 parágrafo único, e o terceiro parágrafo é apagado)

```latex
\hl {OVAs, CICLOS ITERATIVOS E SIMULAÇÕES} Além das abordagens anteriores, ciclos iterativos de concepção têm orientado o desenvolvimento de sequências didáticas que integram tecnologias digitais. Sequências mediadas por tecnologia precisam ser concebidas, testadas e ajustadas continuamente, em ciclos que, embora menos formalizados que a Engenharia Didática, exigem o mesmo compromisso com o pensamento matemático dos estudantes. \citeonline{borbaScucugliaGadanidis2014} destacam que ambientes digitais interativos permitem ao estudante experimentar, visualizar e reformular ideias em tempo real. No ensino de Probabilidade, esse potencial é particularmente decisivo, pois \citeonline{kataokaOliveiraSouza2011} sustentam que a abordagem frequentista no Ensino Básico depende da possibilidade de executar repetições em escala inviável manualmente, observando a estabilização da frequência relativa em direção à probabilidade teórica. A cada ciclo, as situações são avaliadas quanto à sua capacidade de gerar uma necessidade real de aprender, preservando o princípio central da TSD de que a tecnologia fortalece o milieu, mas não substitui o desafio intelectual que deve mover o estudante: um simulador só cumpre função didática se estiver inserido em situação que exija interpretação e tomada de decisão.
```

**Justificativa**: os dois primeiros parágrafos sustentam a mesma tese; o terceiro é redundante com a síntese final do capítulo.

---

## PROPOSTA 07, Subseção `Como elaborar`, fusão A

**Localização**: `\subsection{Como elaborar uma Sequência didática no Ensino de Matemática}`.
**Tipo**: fusão de 3 parágrafos em 1.

### ANTES

```latex
\hl {O PORQUÊ DE SE ENTENDER A ESTRUTURA PADRÃO DA SEQUÊNCIA DIDÁTICA} Apresentadas as abordagens metodológicas que sustentam a concepção de uma sequência didática, cabe agora examinar como essa estrutura se concretiza no planejamento do ensino de Matemática. Tal enquadramento permite compreender a sequência didática, no ensino dessa disciplina, como elemento estruturante do percurso formativo, orientado por princípios epistemológicos e cognitivos próprios da área. Diferentemente de outras disciplinas, cujo conteúdo pode ser tratado de forma predominantemente discursiva, a Matemática requer organização progressiva de conceitos interdependentes, cuja compreensão depende da articulação entre diferentes formas de representação.

\hl {PARTICULARIDADE DA MATEMÁTICA DE COORDENAR REGISTROS DE REPRESENTAÇÃO} Duval (2003, p.~21) afirma que a compreensão matemática não se limita à manipulação simbólica. Ela demanda coordenação entre registros de representação. Para o autor, é a capacidade de converter representações entre registros distintos, e não unicamente sua operação interna, que constitui o principal indicador de compreensão genuína. Tal afirmação traz implicações práticas diretas para o planejamento docente: a sequência didática deve prever atividades que integrem linguagem verbal, representação gráfica, notação simbólica e análise tabular, especialmente no ensino de Probabilidade.

\hl{O QUE AS SEQUÊNCIAS DEVEM TER PARA CUMPRIR ESTES REQUISITOS} Além da coordenação de registros, a sequência precisa prever situações que permitam confrontar intuições e evidências empíricas, favorecendo reorganização conceitual antes da formalização. No caso específico da Probabilidade, essa organização é decisiva. Conceitos como independência de eventos ou probabilidade condicional exigem reestruturação do espaço amostral e mudança de perspectiva, sem as quais o conhecimento permanece superficial.
```

### DEPOIS

```latex
\hl {COORDENAÇÃO DE REGISTROS E PROGRESSÃO} Apresentadas as abordagens metodológicas, cabe examinar como a estrutura se concretiza no planejamento. Diferentemente de outras disciplinas, a Matemática requer organização progressiva de conceitos interdependentes cuja compreensão depende da articulação entre formas de representação. Duval (2003, p.~21) afirma que a compreensão matemática não se limita à manipulação simbólica, mas demanda coordenação entre registros: é a capacidade de converter representações entre registros distintos que constitui o principal indicador de compreensão genuína. Daí a necessidade de prever atividades que integrem linguagem verbal, representação gráfica, notação simbólica e análise tabular, especialmente em Probabilidade, em que conceitos como independência de eventos ou probabilidade condicional exigem reestruturação do espaço amostral, sem a qual o conhecimento permanece superficial.
```

**Justificativa**: introdução, argumento de Duval e aplicação à Probabilidade formam um único bloco coeso.

---

## PROPOSTA 08, Subseção `Como elaborar`, fusão B

**Localização**: `\subsection{Como elaborar uma Sequência didática no Ensino de Matemática}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {NECESSIDADE DE SE IDENTIFICAR OS ELEMENTOS PADRÃO DA SEQUÊNCIA DIDÁTICA} Portanto, a identificação dos elementos estruturais que organizam uma sequência didática constitui um passo decisivo para distingui-la de uma simples sucessão de tarefas. O objetivo vai além de reconhecer regularidades superficiais na organização das atividades, e foca em explicitar o princípio de coerência interna que sustenta o percurso formativo. Artigue (2014, p.~160) sustenta que a coerência de uma sequência se fundamenta em análises que consideram, simultaneamente, a progressão conceitual e as interações previstas entre estudantes, conhecimento e meio didático. O que se constrói assume, portanto, a forma de um objeto racional, produzido a partir de decisões deliberadas de concepção e sustentado por um controle interno que ultrapassa a experiência intuitiva acumulada ao longo da prática docente.

\hl{ESTRUTURA PADRÃO DA SEQUÊNCIA DIDÁTICA MAPEADA NA LITERATURA} Estudos de revisão reforçam essa compreensão ao evidenciar configurações relativamente estáveis nas sequências didáticas brasileiras. Ao analisarem trabalhos defendidos entre 2015 e 2019, \citeonline[p.~10]{lopesetal2020} registram a recorrência de um arranjo composto por cinco momentos: questionário inicial, introdução, problematização, discussão e resolução das atividades, e questionário final. Esse arranjo evidencia que a estrutura da sequência não resulta de escolhas arbitrárias, mas de princípios reconhecíveis e avaliáveis, e antecipa, no plano metodológico, o percurso adotado nesta pesquisa, em que a avaliação diagnóstica precede a intervenção com Objetos Virtuais de Aprendizagem e o questionário final encerra o ciclo.
```

### DEPOIS

```latex
\hl{ELEMENTOS ESTRUTURAIS E ESTRUTURA PADRÃO} A identificação dos elementos estruturais que organizam uma sequência didática é passo decisivo para distingui-la de uma simples sucessão de tarefas. Artigue (2014, p.~160) sustenta que a coerência de uma sequência se fundamenta em análises que consideram, simultaneamente, a progressão conceitual e as interações previstas entre estudantes, conhecimento e meio didático. Estudos de revisão reforçam essa compreensão: ao analisarem trabalhos defendidos entre 2015 e 2019, \citeonline[p.~10]{lopesetal2020} registram a recorrência de um arranjo composto por cinco momentos (questionário inicial, introdução, problematização, discussão e resolução das atividades, e questionário final), arranjo que antecipa, no plano metodológico, o percurso adotado nesta pesquisa, em que a avaliação diagnóstica precede a intervenção com Objetos Virtuais de Aprendizagem e o questionário final encerra o ciclo.
```

**Justificativa**: necessidade de identificar elementos (Artigue) e mapeamento literário (Lopes et al.) sustentam o mesmo argumento.

---

## PROPOSTA 09, Subseção `Progressão conceitual`, fusão

**Localização**: `\subsection{Progressão conceitual}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {PROGRESSÃO CONCEITUAL EM PROBABILIDADE: EPISTEMOLOGIA E APRENDIZAGEM} A progressão dos conteúdos matemáticos constitui um ponto sensível nesse processo. Artigue (2014) sustenta que tal progressão não pode ser definida apenas pela ordem de apresentação dos tópicos em livros didáticos ou documentos curriculares. Ela deve fundamentar-se em análises que articulem a lógica interna do saber matemático e a lógica da aprendizagem, considerando simultaneamente dimensões epistemológicas e cognitivas. No campo da Probabilidade, essa exigência impõe reconhecer que certos conceitos precisam ser estabilizados antes de qualquer formalização algébrica, em especial o estatuto da aleatoriedade e o significado do espaço amostral. Ignorar essa etapa compromete a compreensão posterior do cálculo probabilístico, que passa a ser percebido como aplicação mecânica de fórmulas.

\hl {RACIOCÍNIO PROBABILÍSTICO: DA ALEATORIEDADE À FORMALIZAÇÃO} A progressão conceitual nesse campo não pode ser arbitrária nem acelerada artificialmente. \citeonline[p.~25]{cazorlaKataokaSilva2010} indicam que o desenvolvimento do raciocínio probabilístico requer, como ponto de partida, a compreensão de que nem todos os fenômenos são determinísticos e a articulação entre a concepção clássica, em que a probabilidade é calculada a priori sobre o espaço amostral, e a concepção frequentista, em que a probabilidade emerge da estabilização da frequência relativa em grande número de repetições. Antes de qualquer formalização, os estudantes precisam distinguir eventos certos, impossíveis e prováveis, interpretar regularidades empíricas e compreender que a frequência observada em poucas repetições não constitui uma ``lei do acaso''. A passagem para o cálculo só se sustenta quando o estudante consegue justificar o que conta como caso possível e por que certos resultados são equiprováveis ou não.
```

### DEPOIS

```latex
\hl {PROGRESSÃO E RACIOCÍNIO PROBABILÍSTICO} A progressão dos conteúdos matemáticos não pode ser definida apenas pela ordem de apresentação em livros didáticos ou documentos curriculares. Artigue (2014) sustenta que ela deve fundamentar-se em análises que articulem a lógica interna do saber e a lógica da aprendizagem, considerando dimensões epistemológicas e cognitivas. No campo da Probabilidade, certos conceitos precisam ser estabilizados antes de qualquer formalização algébrica, em especial o estatuto da aleatoriedade e o significado do espaço amostral. Nessa direção, \citeonline[p.~25]{cazorlaKataokaSilva2010} indicam que o desenvolvimento do raciocínio probabilístico requer a compreensão de que nem todos os fenômenos são determinísticos e a articulação entre a concepção clássica, em que a probabilidade é calculada a priori sobre o espaço amostral, e a concepção frequentista, em que ela emerge da estabilização da frequência relativa em grande número de repetições. Antes de formalizar, os estudantes precisam distinguir eventos certos, impossíveis e prováveis, interpretar regularidades empíricas e compreender que a frequência observada em poucas repetições não constitui uma ``lei do acaso''.
```

**Justificativa**: ambos sustentam que a progressão em Probabilidade não pode ser arbitrária, com Artigue e Cazorla, Kataoka e Silva como vozes complementares.

---

## PROPOSTA 10, Subseção `Problematização`, fusão A (5 parágrafos em 1)

**Localização**: `\subsection{Problematização}`.
**Tipo**: fusão de 5 parágrafos em 1.

### ANTES

```latex
\hl{A BAGAGEM DO ALUNO DENTRO DA PROBLEMATIZAÇÃO} Do ponto de vista da aprendizagem significativa, \citeonline[p.~ix]{ausubel2000} afirma que o fator mais importante que influencia a aprendizagem é aquilo que o aluno já sabe --- princípio operacionalizado nesta sequência pela retomada explícita do experimento aleatório do disco antes da introdução do dado. No ensino de Probabilidade, esse ponto de partida exige cuidado: os estudantes costumam chegar à sala de aula com ideias equivocadas sobre acaso e aleatoriedade, o que \citeonline{brousseau2002} denomina obstáculos epistemológicos, que comprometem a compreensão de regularidade estatística e precisam ser estruturalmente enfrentados pela sequência. Como enfatiza Artigue (2014, p.~45), o valor didático de uma situação depende da forma como ela é explorada e articulada à construção conceitual subsequente. Por isso, conhecer essas ideias prévias é importante não apenas para aproveitá-las, mas para planejar situações que ajudem o estudante a superá-las.

\hl{APLICAÇÃO MECÂNICA DE FÓRMULAS} No domínio probabilístico, situações como a observação de regularidades estatísticas em muitas repetições de um experimento aleatório, a comparação entre um dado equilibrado e um dado viciado ou a previsão de eventos compostos a partir do espaço amostral só cumprem função estruturante quando geram conflito cognitivo real. Se o estudante apenas aplica fórmula previamente apresentada, não há problematização efetiva.

\hl {ELEMENTO DE PROBLEMATIZAÇÃO PARA O PROFESSOR} No plano docente, a problematização exige planejamento cuidadoso: é necessário antecipar possíveis estratégias dos alunos, prever erros produtivos e estruturar momentos de validação coletiva. Ademais, ela não é evento isolado. Trata-se muito mais de um elemento que inaugura e sustenta o percurso formativo. Como destaca Zabala (1998, p.~42), ``as atividades devem organizar-se de modo a permitir reconstrução progressiva dos significados'', de modo que o problema inicial seja retomado ao longo da sequência, permitindo aprofundamento gradual da compreensão.

\hl {NECESSIDADE QUE AS SEQUÊNCIAS EM MATEMÁTICA TÊM DE INCLUIR PROBLEMATIZAÇÃO LEGÍTIMA} Brousseau (1997, p.~22) sustenta que a situação didática eficaz é aquela que cria para o aluno uma necessidade intelectual real, isto é, uma situação em que o conhecimento matemático emerge como resposta a uma dificuldade concreta. Segundo o autor, ``o saber deve aparecer como solução para um problema que o aluno reconhece como seu'' (Brousseau, 1997, p.~23, tradução nossa). Essa concepção desloca o papel do professor de transmissor de respostas para organizador de situações que provoquem desequilíbrio cognitivo produtivo.

\hl {ELEMENTO DE PROBLEMATIZAÇÃO} A problematização aparece, assim, como elemento recorrente e marca de qualidade estrutural das sequências didáticas. No entanto, essa centralidade não pode ser interpretada de modo acrítico. Uma situação-problema pode funcionar apenas como recurso motivacional, sem criar necessidade epistemológica efetiva para o estudante. Quando isso ocorre, preserva-se a forma externa da sequência, mas perde-se sua força didática. A coerência estrutural exige que a problematização introduza um desequilíbrio cognitivo real, capaz de orientar a reorganização conceitual e conferir sentido às atividades subsequentes. Nem todo problema proposto em sala constitui, de fato, uma problematização no sentido epistemológico: em muitos casos, o que se denomina ``problema'' é apenas um exercício contextualizado cuja resolução já está implicitamente definida pelo modelo previamente apresentado. Reconhecer essa distinção, contudo, é apenas o primeiro passo, pois mesmo uma problematização legítima não sustenta, por si só, a aprendizagem pretendida.
```

### DEPOIS (1 parágrafo único)

```latex
\hl{PROBLEMATIZAÇÃO LEGÍTIMA E CONHECIMENTO PRÉVIO} Do ponto de vista da aprendizagem significativa, \citeonline[p.~ix]{ausubel2000} afirma que o fator mais importante que influencia a aprendizagem é aquilo que o aluno já sabe, princípio operacionalizado nesta sequência pela retomada explícita do experimento aleatório do disco antes da introdução do dado. Esse ponto de partida exige cuidado porque os estudantes costumam chegar à sala de aula com ideias equivocadas sobre acaso e aleatoriedade, o que \citeonline{brousseau2002} denomina obstáculos epistemológicos, que precisam ser estruturalmente enfrentados pela sequência. Brousseau \cite[p.~22-23, tradução nossa]{brousseau1997} sustenta que ``o saber deve aparecer como solução para um problema que o aluno reconhece como seu'', deslocando o papel do professor de transmissor de respostas para organizador de situações que provoquem desequilíbrio cognitivo produtivo. Nem todo problema proposto constitui, contudo, uma problematização no sentido epistemológico: em muitos casos, o que se denomina ``problema'' é apenas exercício contextualizado cuja resolução já está implicitamente definida pelo modelo previamente apresentado.
```

**Justificativa**: cinco parágrafos sustentavam a mesma tese (problematização legítima exige confronto com obstáculos epistemológicos) com formulações próximas; condensar elimina martelamento.

---

## PROPOSTA 11, Subseção `Problematização`, fusão B

**Localização**: `\subsection{Problematização}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl{VALORIZAÇÃO DA PROBLEMATIZAÇÃO NÃO É O SUFICIENTE} Valorizar o problema como ponto de partida, seja na perspectiva da Teoria das Situações Didáticas ou da Aprendizagem Baseada em Problemas, não é suficiente por si só. A aprendizagem só se torna consistente quando o problema está articulado a objetivos claros, atividades bem escolhidas e critérios de avaliação coerentes. Como observa Zabala (1998, p.~38), a forma como esses elementos se organizam é o que determina o tipo de aprendizagem produzida.

\hl {ATIVIDADES, OBJETIVOS E AVALIAÇÃO DA SEQUÊNCIA DIDÁTICA} Essa tríade — objetivos, atividades e avaliação — constitui o núcleo estrutural da sequência didática. Em termos práticos, isso implica formular objetivos conceitualmente precisos — como identificar corretamente o espaço amostral em experimentos compostos ou interpretar a probabilidade condicional como redefinição do espaço amostral — em vez de formulações genéricas. A necessidade dessa precisão é evidenciada por Batanero e Díaz (2007, p.~128), que observam que ``os estudantes frequentemente recorrem a heurísticas intuitivas que entram em conflito com o raciocínio probabilístico normativo'' (tradução nossa), indicando que os objetivos da sequência devem incluir a superação de vieses cognitivos persistentes.
```

### DEPOIS

```latex
\hl {TRÍADE OBJETIVOS, ATIVIDADES E AVALIAÇÃO} Reconhecer essa distinção é apenas o primeiro passo: mesmo uma problematização legítima não sustenta, por si só, a aprendizagem pretendida. Como observa Zabala (1998, p.~38, p.~42), a aprendizagem só se torna consistente quando o problema está articulado a objetivos claros, atividades bem escolhidas e critérios de avaliação coerentes, e as atividades devem organizar-se de modo a permitir reconstrução progressiva dos significados, retomando o problema inicial ao longo da sequência. Em termos práticos, isso implica formular objetivos conceitualmente precisos, como identificar corretamente o espaço amostral em experimentos compostos ou interpretar a probabilidade condicional como redefinição do espaço amostral, em vez de formulações genéricas. Batanero e Díaz (2007, p.~128, tradução nossa) observam que ``os estudantes frequentemente recorrem a heurísticas intuitivas que entram em conflito com o raciocínio probabilístico normativo'', indicando que os objetivos da sequência devem incluir a superação de vieses cognitivos persistentes.
```

**Justificativa**: Zabala (insuficiência da problematização sozinha) e Batanero e Díaz (objetivos precisos) sustentam o mesmo argumento.

---

## PROPOSTA 12, Subseção `Coerência`, fusão A

**Localização**: `\subsection{Coerência}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {ELEMENTO DE COERÊNCIA INTERNA} Assim, a coerência interna de uma sequência didática manifesta-se, de modo particular, na articulação entre os objetivos de aprendizagem, as atividades propostas e os critérios de avaliação mobilizados ao longo do percurso. Tal articulação exige que cada atividade seja concebida em função dos saberes visados. Zabala (1998) destaca que as atividades de ensino não são neutras, pois incorporam concepções implícitas sobre o conhecimento, sobre os modos de aprender e sobre o papel atribuído ao estudante. Quando os objetivos privilegiam a construção conceitual, as atividades devem criar situações em que os conceitos se tornem necessários para a resolução de problemas significativos. Quando envolvem procedimentos, as tarefas devem oferecer oportunidades de uso e refinamento em contextos progressivamente mais complexos. Quando se almeja o desenvolvimento de atitudes — como argumentação e tomada de decisão em situações de incerteza — as atividades precisam favorecer a reflexão e o confronto de estratégias.

\hl {AVALIAÇÃO COMO PROCESSO INTERNO À SEQUÊNCIA DIDÁTICA} Além disso, a avaliação não pode ser concebida como etapa externa ao processo. Zabala (1998, p.~63) argumenta que ela deve estar integrada à sequência, funcionando como instrumento regulador da aprendizagem, e que as tarefas avaliativas devem demandar argumentação e tomada de decisão — e não apenas aplicação mecânica de procedimentos.
```

### DEPOIS

```latex
\hl {COERÊNCIA INTERNA E AVALIAÇÃO} A coerência interna manifesta-se na articulação entre objetivos de aprendizagem, atividades propostas e critérios de avaliação. Zabala (1998) destaca que as atividades não são neutras: incorporam concepções implícitas sobre o conhecimento e o papel atribuído ao estudante. Quando os objetivos privilegiam a construção conceitual, as atividades devem criar situações em que os conceitos se tornem necessários para a resolução de problemas significativos; quando envolvem procedimentos, devem oferecer oportunidades de uso e refinamento em contextos progressivamente mais complexos; quando se almeja o desenvolvimento de atitudes como argumentação e tomada de decisão sob incerteza, devem favorecer a reflexão e o confronto de estratégias. A avaliação, por sua vez, não pode ser concebida como etapa externa: \citeonline[p.~63]{zabala1998} argumenta que ela deve estar integrada à sequência, funcionando como instrumento regulador da aprendizagem, e demandar argumentação e tomada de decisão em vez de aplicação mecânica de procedimentos.
```

**Justificativa**: ambos parágrafos têm Zabala como autor central e tratam de duas faces da mesma articulação.

---

## PROPOSTA 13, Subseção `Coerência`, fusão B

**Localização**: `\subsection{Coerência}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {O ERRO E RETORNO AO PROBLEMA} O erro assim, também assume papel estruturante, pois decorre da lógica interna do meio e não de correções externas que substituam a reflexão do estudante (Brousseau, 1997, p.~88). O funcionamento didático pressupõe que as situações admitam tentativas iniciais e retornos sucessivos ao problema. A sequência didática organiza, assim, situações que se repetem, se transformam e evoluem, preservando uma situação-base comum. Essa organização sustenta a passagem gradual entre a experiência direta e a formalização matemática, sem reduzir o conhecimento a procedimentos descontextualizados (Brousseau, 1997, p.~31; p.~231). É nessa recorrência controlada que o estudante passa a reconhecer regularidades, distinguir invariantes e atribuir sentido às representações formais

\hl {FUNDAMENTO DO ELEMENTO COERÊNCIA ENTRE ATIVIDADES, OBJETIVOS E AVALIAÇÃO DA SEQUÊNCIA DIDÁTICA} Uma sequência didática coerente pressupõe, portanto, a explicitação sistemática das relações entre objetivos, atividades e avaliação. A coerência estrutural exige também articulação entre diferentes registros de representação, princípio já apresentado a partir de Duval (2003, p.~21). No ensino de Probabilidade, isso significa integrar tabelas de contingência, diagramas de árvore, diagramas de Venn, linguagem verbal e expressão algébrica. Uma sequência que privilegie apenas o registro simbólico compromete a construção do significado.
```

### DEPOIS

```latex
\hl {O ERRO E A ARTICULAÇÃO DE REGISTROS} O erro assume papel estruturante, pois decorre da lógica interna do meio e não de correções externas que substituam a reflexão do estudante \cite[p.~88]{brousseau1997}. O funcionamento didático pressupõe situações que admitam tentativas iniciais e retornos sucessivos ao problema, organizando situações que se repetem, se transformam e evoluem, preservando uma situação-base comum, sem reduzir o conhecimento a procedimentos descontextualizados \cite[p.~31, p.~231]{brousseau1997}. É nessa recorrência controlada que o estudante reconhece regularidades, distingue invariantes e atribui sentido às representações formais. A coerência estrutural exige também articulação entre registros de representação, princípio já apresentado a partir de Duval (2003, p.~21), o que, no ensino de Probabilidade, significa integrar tabelas de contingência, diagramas de árvore, diagramas de Venn, linguagem verbal e expressão algébrica.
```

**Justificativa**: Brousseau (erro estruturante) e Duval (articulação de registros) são duas dimensões da coerência interna.

---

## PROPOSTA 14, Subseção `Papel da mediação docente`, fusão A

**Localização**: `\subsection{Papel da mediação docente na aprendizagem}`.
**Tipo**: fusão de 3 parágrafos em 1.

### ANTES

```latex
\hl {PAPEL DO PROFESSOR} Entre a aceitação do problema e a produção de respostas, a docência se caracteriza por uma contenção deliberada. O conhecimento deve emergir do funcionamento da situação e das exigências de justificação que ela impõe. Cada conteúdo matemático pode ser associado a uma ou mais situações adidáticas fundamentais, cujo arranjo, orientado por finalidades de ensino, define tanto o saber mobilizado quanto o significado que ele assume ao longo do percurso.

\hl {Ao professor cabe a devolutiva} A devolução ocupa, portanto, posição central nesse quadro teórico. O professor transfere ao aluno a responsabilidade pela situação adidática, aceita as consequências desse deslocamento e suspende intervenções que antecipem o conhecimento a construir. A aprendizagem passa a depender fundamentalmente da relação estabelecida entre estudante e situação, e não da validação imediata oferecida pelo docente (Brousseau, 1997, p. 30--31; p. 230).

\hl {Objetivo de transferir ao aluno a responsabilidade pela atividade intelectual} Nesse ponto, emerge uma tensão didática que não pode ser ignorada. A devolução, ao transferir ao estudante a responsabilidade pela situação adidática, cria condições para uma atividade intelectual autêntica. Ao mesmo tempo, pode gerar impasses prolongados, dispersão ou soluções de curto alcance. O planejamento da sequência precisa antecipar esse risco e definir critérios de observação do progresso conceitual, evitando que silêncio ou hesitação sejam confundidos com aprendizagem.
```

### DEPOIS

```latex
\hl {DEVOLUÇÃO E TENSÃO DIDÁTICA} Entre a aceitação do problema e a produção de respostas, a docência caracteriza-se por uma contenção deliberada: o conhecimento deve emergir do funcionamento da situação e das exigências de justificação que ela impõe. Cada conteúdo matemático pode ser associado a uma ou mais situações adidáticas fundamentais, cujo arranjo, orientado por finalidades de ensino, define tanto o saber mobilizado quanto o significado que ele assume \cite[p.~30-31, p.~230]{brousseau1997}. Essa contenção, contudo, gera tensão didática que não pode ser ignorada: ao transferir ao estudante a responsabilidade pela situação adidática, cria-se condição para uma atividade intelectual autêntica, mas também risco de impasses prolongados, dispersão ou soluções de curto alcance. O planejamento da sequência precisa antecipar esse risco e definir critérios de observação do progresso conceitual, evitando que silêncio ou hesitação sejam confundidos com aprendizagem.
```

**Justificativa**: três parágrafos sobre devolução brousseauniana (contenção, transferência, tensão) cabem em um único.

---

## PROPOSTA 15, Subseção `Papel da mediação docente`, fusão B

**Localização**: `\subsection{Papel da mediação docente na aprendizagem}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {PAPEL DO PROFESSOR NA GESTÃO} Portanto, cabe também ao professor a gestão do tempo didático e da memória do sistema de ensino. Cabe a ele decidir quando determinados conhecimentos devem ser retomados, transformados ou temporariamente suspensos, conforme as exigências do percurso formativo. Essa gestão incide diretamente no significado atribuído ao conteúdo e no tipo de generalização que o estudante consegue construir.

\hl {MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO} A mediação docente envolve, portanto, duas responsabilidades complementares: criar condições para que o estudante construa conhecimento e garantir que esse conhecimento seja reconhecido e formalizado. Quando essa construção envolve a edificação progressiva de um artefato matemático com significado pessoal --- como ocorre no laboratório de diagramas de Venn da sequência aqui apresentada ---, opera-se também o construcionismo de \citeonline{papert1994}, segundo o qual o aprender se faz pelo fazer com tecnologia. Essa tarefa se torna mais exigente quando a sequência didática é voltada ao ensino de Probabilidade no Ensino Médio, pois as orientações da BNCC estabelecem competências e habilidades específicas que precisam ser contempladas. É essa articulação entre a ação do professor, os conteúdos probabilísticos e as exigências curriculares que a subseção seguinte examina.
```

### DEPOIS

```latex
\hl {GESTÃO, FORMALIZAÇÃO E CONSTRUCIONISMO} Cabe também ao professor a gestão do tempo didático e da memória do sistema de ensino, decidindo quando determinados conhecimentos devem ser retomados, transformados ou temporariamente suspensos. A mediação envolve duas responsabilidades complementares: criar condições para que o estudante construa conhecimento e garantir que esse conhecimento seja reconhecido e formalizado. Quando essa construção envolve a edificação progressiva de um artefato matemático com significado pessoal, como ocorre no laboratório de diagramas de Venn da sequência aqui apresentada, opera-se também o construcionismo de \citeonline{papert1994}, segundo o qual o aprender se faz pelo fazer com tecnologia. Essa articulação entre ação do professor, conteúdos probabilísticos e exigências curriculares é examinada na subseção seguinte.
```

**Justificativa**: gestão do tempo didático e formalização (com Papert) são responsabilidades complementares que cabem em parágrafo único.

---

## PROPOSTA 16, Subseção `BNCC e recursos digitais`, fusão A

**Localização**: `\subsection{Sequências Didáticas para o Ensino de Probabilidade: articulações com a BNCC e recursos digitais}`.
**Tipo**: fusão de 4 parágrafos em 1.

### ANTES

```latex
\hl{IMPORTÂNCIA DA SEQUÊNCIA DIDÁTICA CONFORME BNCC} A Base Nacional Comum Curricular \cite[p.~520, 523, 528]{brasil2018} destaca que o ensino de Probabilidade deve promover a compreensão de fenômenos aleatórios, o raciocínio em contextos de incerteza e a tomada de decisões fundamentadas. Tais competências não se desenvolvem por meio de ensino fragmentado, mas requerem planejamento sistemático e progressivo, considerando os desafios intuitivos e contraintuitivos já presentes nos conceitos elementares da Probabilidade, conforme apresentado anteriormente a partir de \citeonline{batanero2016}. Assim, compreender as sequências didáticas como estrutura organizadora do ensino constitui condição fundamental para enfrentar dificuldades recorrentes no aprendizado de Probabilidade e para fundamentar a proposta pedagógica desenvolvida nesta dissertação.

\hl {COMO DEVE SER UMA SEQUÊNCIA DIDÁTICA EM PROBABILIDADE: ARTICULAÇÃO ENTRE CONTEÚDO, CURRÍCULO E TECNOLOGIA} Nessas condições, uma sequência didática para o ensino de Probabilidade no Ensino Médio deve articular progressão conceitual fundamentada, integração equilibrada de conteúdos conceituais, procedimentais e atitudinais, alinhamento às competências e habilidades previstas na BNCC, contextualização em situações significativas e uso intencional de recursos digitais. Assim, essa articulação não se reduz a um exercício de organização de atividades, tampouco à simples incorporação de recursos tecnológicos. O problema central reside em integrar tais recursos ao núcleo matemático da situação didática, preservando a necessidade conceitual do conhecimento e evitando que a tecnologia se limite a um adorno metodológico.

\hl {BNCC E O ENSINO DE PROBABILIDADE: EXPERIMENTAÇÃO E FORMALIZAÇÃO} As orientações da Base Nacional Comum Curricular oferecem respaldo a esse percurso. O documento afirma que o trabalho com Probabilidade deve promover a compreensão de fenômenos não determinísticos (Brasil, 2018) e prevê, no Ensino Médio, a descrição de espaços amostrais, o cálculo de probabilidades e a resolução de problemas envolvendo eventos sucessivos. A BNCC também recomenda o uso de simulações e a análise de situações do mundo real como meios para desenvolver habilidades matemáticas (BRASIL, 2018, p. 531). Essa orientação favorece sequências didáticas que combinam experimentação e formalização, desde que tal combinação seja pedagogicamente intencional.

\hl {COMPETÊNCIAS MATEMÁTICAS NA BNCC E O ENSINO DE PROBABILIDADE} As competências específicas de Matemática para o Ensino Médio incluem raciocinar em processos de investigação, representar informações quantitativa e qualitativamente e argumentar com base em dados confiáveis (Brasil, 2018). Uma sequência didática de Probabilidade precisa criar situações em que essas competências sejam mobilizadas de forma concreta. Problemas relacionados a jogos, riscos, decisões cotidianas ou interpretação de dados estatísticos podem cumprir esse papel, desde que não sejam reduzidos à aplicação automática de fórmulas.
```

### DEPOIS (V1)

```latex
\hl{BNCC E SEQUÊNCIA DIDÁTICA EM PROBABILIDADE} A Base Nacional Comum Curricular \cite[p.~520, 523, 528, 531]{brasil2018} destaca que o ensino de Probabilidade deve promover a compreensão de fenômenos aleatórios, o raciocínio em contextos de incerteza e a tomada de decisões fundamentadas, prevendo no Ensino Médio a descrição de espaços amostrais, o cálculo de probabilidades, a resolução de problemas envolvendo eventos sucessivos e o uso de simulações e situações do mundo real. Tais competências não se desenvolvem por meio de ensino fragmentado, mas requerem planejamento sistemático e progressivo. Uma sequência didática para o ensino de Probabilidade no Ensino Médio deve, portanto, articular progressão conceitual fundamentada, integração equilibrada de conteúdos conceituais, procedimentais e atitudinais, alinhamento às competências da BNCC, contextualização significativa e uso intencional de recursos digitais. O problema central reside em integrar tais recursos ao núcleo matemático da situação didática, evitando que a tecnologia se limite a um adorno metodológico. Problemas relacionados a jogos, riscos, decisões cotidianas ou interpretação de dados estatísticos podem cumprir esse papel, desde que não sejam reduzidos à aplicação automática de fórmulas.
```

**Justificativa**: 4 parágrafos repetiam o argumento (BNCC sustenta sequência progressiva e contextualizada para Probabilidade) com enumerações sucessivas.

---

## PROPOSTA 17, Subseção `BNCC e recursos digitais`, fusão B

**Localização**: `\subsection{Sequências Didáticas para o Ensino de Probabilidade}`.
**Tipo**: fusão de 2 parágrafos.

### ANTES

```latex
\hl {RECURSOS TECNOLÓGICOS E AMPLIAÇÃO DE EXPERIMENTOS ALEATÓRIOS} Os recursos tecnológicos contemporâneos ampliam as possibilidades de trabalho com experimentos aleatórios. A BNCC reconhece o papel de jogos, vídeos, planilhas eletrônicas, calculadoras e softwares de geometria dinâmica na compreensão de noções matemáticas (Brasil, 2018), favorecendo, no ensino de Probabilidade, a observação de padrões e a discussão da relação entre frequência relativa e probabilidade teórica. Esse potencial, contudo, não se realiza automaticamente.

\hl {INTERATIVIDADE NÃO GARANTE CONSTRUÇÃO CONCEITUAL E EXIGE INTENCIONALIDADE PEDAGÓGICA} Ambientes como o GeoGebra possibilitam a manipulação de variáveis, a visualização dinâmica de espaços amostrais e a testagem de conjecturas. Ainda assim, a interatividade, por si só, não garante construção conceitual: um recurso digital pode acelerar respostas e reduzir reflexão se o design das tarefas não exigir justificativa, comparação de explicações e tomada de posição diante de resultados contraditórios. O meio tecnológico precisa, portanto, ser concebido como parte integrante da situação didática, com intencionalidade pedagógica clara, em que simulações sustentam confrontos produtivos entre intuição e evidência empírica e representações dinâmicas apoiam a formalização gradual dos conceitos \cite{trouche2004}. O ganho efetivo aparece quando o percurso inclui momentos de debate coletivo, sistematização conceitual e validação de argumentos, permitindo ao estudante compreender por que determinado conceito se torna necessário e em que condições ele se aplica.
```

### DEPOIS

```latex
\hl {INTERATIVIDADE E INTENCIONALIDADE PEDAGÓGICA} Os recursos tecnológicos contemporâneos ampliam as possibilidades de trabalho com experimentos aleatórios. Ambientes como o GeoGebra possibilitam a manipulação de variáveis, a visualização dinâmica de espaços amostrais e a testagem de conjecturas. Ainda assim, a interatividade, por si só, não garante construção conceitual: um recurso digital pode acelerar respostas e reduzir reflexão se o design das tarefas não exigir justificativa, comparação de explicações e tomada de posição diante de resultados contraditórios. O meio tecnológico precisa, portanto, ser concebido como parte integrante da situação didática, com intencionalidade pedagógica clara, em que simulações sustentam confrontos produtivos entre intuição e evidência empírica e representações dinâmicas apoiam a formalização gradual dos conceitos \cite{trouche2004}. O ganho efetivo aparece quando o percurso inclui debate coletivo, sistematização conceitual e validação de argumentos, permitindo ao estudante compreender por que determinado conceito se torna necessário e em que condições ele se aplica.
```

**Justificativa**: ambos sustentam que recursos tecnológicos exigem intencionalidade pedagógica.

---

## PROPOSTA 18, Subseção `BNCC e recursos digitais`, fusão C (fechamento)

**Localização**: `\subsection{Sequências Didáticas para o Ensino de Probabilidade}`.
**Tipo**: fusão de 2 parágrafos de fechamento.

### ANTES

```latex
\hl {O RIGOR DO PERCURSO} Decorre, portanto, que o rigor do percurso reside na coerência das escolhas didáticas e na capacidade de o conjunto das situações sustentar a reorganização conceitual do estudante, em vez de apenas na quantidade de atividades propostas. Essa articulação estabelece as bases metodológicas que orientam a sequência didática apresentada nesta dissertação.

\hl {IDENTIDADE DA SEQUÊNCIA DIDÁTICA DESTA PESQUISA} A partir dos fundamentos discutidos, a sequência didática aqui proposta caracteriza-se como uma sequência didática digital, estruturada metodologicamente pela Engenharia Didática \cite{artigue2014} e operacionalizada por situações adidáticas \cite{brousseau2002} mediadas por dois Objetos Virtuais de Aprendizagem autorais para o ensino de Probabilidade no Ensino Médio. A Engenharia Didática orienta a concepção em quatro fases articuladas, da análise preliminar à validação interna, ao passo que a Teoria das Situações Didáticas define o funcionamento do milieu computacional, no qual os retornos do artefato confrontam o estudante com evidências que sustentam a reorganização conceitual. Os Objetos Virtuais de Aprendizagem assumem, nesse arranjo, a dupla função de meio interativo, em que se dá a devolução do problema ao estudante, e de instrumento, no sentido da gênese instrumental de \citeonline{trouche2004}, com momentos pontuais de construcionismo \cite{papert1994} quando o estudante edifica artefatos matemáticos com significado pessoal. A articulação entre essas escolhas configura, portanto, o tipo específico de sequência didática que esta pesquisa desenvolve, valida e analisa.
```

### DEPOIS

```latex
\hl {IDENTIDADE DA SEQUÊNCIA DIDÁTICA DESTA PESQUISA} O rigor do percurso reside na coerência das escolhas didáticas e na capacidade de o conjunto das situações sustentar a reorganização conceitual do estudante, em vez de apenas na quantidade de atividades. A partir dos fundamentos discutidos, a sequência didática aqui proposta caracteriza-se como uma sequência didática digital, estruturada metodologicamente pela Engenharia Didática \cite{artigue2014} e operacionalizada por situações adidáticas \cite{brousseau2002} mediadas por dois Objetos Virtuais de Aprendizagem autorais para o ensino de Probabilidade no Ensino Médio. A Engenharia Didática orienta a concepção em quatro fases articuladas, da análise preliminar à validação interna; a Teoria das Situações Didáticas define o funcionamento do milieu computacional, no qual os retornos do artefato confrontam o estudante com evidências que sustentam a reorganização conceitual; e os Objetos Virtuais de Aprendizagem assumem a dupla função de meio interativo, em que se dá a devolução do problema, e de instrumento, no sentido da gênese instrumental de \citeonline{trouche2004}, com momentos pontuais de construcionismo \cite{papert1994} quando o estudante edifica artefatos matemáticos com significado pessoal. Essa articulação configura o tipo específico de sequência didática que esta pesquisa desenvolve, valida e analisa.
```

**Justificativa**: a frase do `RIGOR DO PERCURSO` funciona como abertura natural do parágrafo de identidade.

---

## PROPOSTA 19, Introdução do capítulo

**Localização**: bloco `{\color{blue} ...}` antes da seção `\section{Sequências Didáticas}`.
**Tipo**: fusão de 2 parágrafos da introdução.

### ANTES

```latex
{\color{blue} A fundamentação teórica representa a base epistemológica e metodológica desta investigação, pois explicita os referenciais que orientam tanto a análise do problema em estudo quanto a elaboração do artefato didático proposto. No âmbito da Educação Matemática, construir um referencial teórico vai além da simples apresentação de autores; envolve compreender de que modo distintas concepções de conhecimento, ensino e aprendizagem repercutem em decisões didáticas concretas (Artigue, 2014; Brousseau, 1997).

O referencial teórico exerce função estruturante ao contribuir para a delimitação do problema, a definição dos objetivos e a seleção dos procedimentos metodológicos, posicionando o objeto investigado em um quadro mais amplo. No contexto desta pesquisa, a fundamentação teórica orienta a elaboração de uma sequência didática digital destinada ao ensino de Probabilidade no Ensino Médio, articulando princípios da Engenharia Didática, da Teoria das Situações Didáticas, dos ciclos iterativos de concepção em ambientes digitais e do construcionismo.
```

### DEPOIS

```latex
{\color{blue} A fundamentação teórica representa a base epistemológica e metodológica desta investigação, pois explicita os referenciais que orientam tanto a análise do problema em estudo quanto a elaboração do artefato didático proposto. No âmbito da Educação Matemática, construir um referencial teórico vai além da simples apresentação de autores; envolve compreender de que modo distintas concepções de conhecimento, ensino e aprendizagem repercutem em decisões didáticas concretas (Artigue, 2014; Brousseau, 1997). No contexto desta pesquisa, esse referencial orienta a elaboração de uma sequência didática digital destinada ao ensino de Probabilidade no Ensino Médio, articulando princípios da Engenharia Didática, da Teoria das Situações Didáticas, dos ciclos iterativos de concepção em ambientes digitais e do construcionismo.
```

**Justificativa**: a frase metodológica genérica sobre função do referencial pode ser absorvida no parágrafo de abertura, deixando apenas a frase programática da pesquisa.

---

## 🅱️ Propostas adicionais V2

### PROPOSTA 20, Remoção da SÍNTESE em `Mediação docente`

**Localização**: `\subsection{Papel da mediação docente na aprendizagem}`.
**Tipo**: remoção integral de parágrafo.
**Versão**: apenas V2.

### ANTES (parágrafo a apagar)

```latex
\hl {SÍNTESE DE COMO DEVE SER ESTRUTURADA A SEQUÊNCIA DIDÁTICA} Em síntese, as características estruturais de uma sequência didática, fundamentadas por Zabala, Brousseau, Duval, Batanero e Cazorla, Kataoka e Silva, revelam que a organização do ensino deve ser concebida como construção racional orientada por coerência interna, progressão conceitual e intencionalidade pedagógica explícita. Como resultado desse arranjo, a sequência didática consolida-se como uma estrutura processual, progressiva e articulada (Brousseau, 1997, p.~231; p.~246). No ensino de Probabilidade, essa estrutura é condição indispensável para enfrentar dificuldades cognitivas recorrentes e promover aprendizagem significativa, especialmente quando a proposta envolve integração de recursos digitais e Objetos Virtuais de Aprendizagem.
```

### DEPOIS

Parágrafo apagado integralmente.

**Justificativa**: a síntese listava autores e dizia que a sequência se consolida como estrutura processual; é integralmente coberta pelo parágrafo `IDENTIDADE DA SEQUÊNCIA DIDÁTICA` na subseção seguinte.

---

### PROPOSTA 21, Enxugamento de `BNCC E SEQUÊNCIA DIDÁTICA EM PROBABILIDADE`

**Localização**: parágrafo já fundido pela Proposta 16.
**Tipo**: enxugamento de enumeração interna.
**Versão**: apenas V2.

### ANTES (versão V1, após Proposta 16 aplicada)

```latex
\hl{BNCC E SEQUÊNCIA DIDÁTICA EM PROBABILIDADE} A Base Nacional Comum Curricular \cite[p.~520, 523, 528, 531]{brasil2018} destaca que o ensino de Probabilidade deve promover a compreensão de fenômenos aleatórios, o raciocínio em contextos de incerteza e a tomada de decisões fundamentadas, prevendo no Ensino Médio a descrição de espaços amostrais, o cálculo de probabilidades, a resolução de problemas envolvendo eventos sucessivos e o uso de simulações e situações do mundo real. Tais competências não se desenvolvem por meio de ensino fragmentado, mas requerem planejamento sistemático e progressivo. Uma sequência didática para o ensino de Probabilidade no Ensino Médio deve, portanto, articular progressão conceitual fundamentada, integração equilibrada de conteúdos conceituais, procedimentais e atitudinais, alinhamento às competências da BNCC, contextualização significativa e uso intencional de recursos digitais. O problema central reside em integrar tais recursos ao núcleo matemático da situação didática, evitando que a tecnologia se limite a um adorno metodológico. Problemas relacionados a jogos, riscos, decisões cotidianas ou interpretação de dados estatísticos podem cumprir esse papel, desde que não sejam reduzidos à aplicação automática de fórmulas.
```

### DEPOIS (V2)

```latex
\hl{BNCC E SEQUÊNCIA DIDÁTICA EM PROBABILIDADE} A Base Nacional Comum Curricular \cite[p.~520, 523, 528, 531]{brasil2018} destaca que o ensino de Probabilidade deve promover a compreensão de fenômenos aleatórios, o raciocínio em contextos de incerteza e a tomada de decisões fundamentadas, prevendo no Ensino Médio o uso de simulações e situações do mundo real. Tais competências não se desenvolvem por meio de ensino fragmentado, mas requerem planejamento sistemático e progressivo, articulado às competências da BNCC, com contextualização significativa e uso intencional de recursos digitais. O problema central reside em integrar tais recursos ao núcleo matemático da situação didática, evitando que a tecnologia se limite a um adorno metodológico, e em garantir que problemas relacionados a jogos, riscos, decisões cotidianas ou interpretação de dados estatísticos não sejam reduzidos à aplicação automática de fórmulas.
```

**Justificativa**: a enumeração curricular detalhada (descrição de espaços amostrais, cálculo, eventos sucessivos) pertence ao Cap. de Metodologia.

---

## 📊 Saldo cumulativo

| Versão | Propostas a aplicar | Páginas finais esperadas |
|---|---|---|
| **V0** (atual) | Nenhuma | 18 a 19 |
| **V1** | Propostas 01 a 19 | 14 a 15 |
| **V2** | Propostas 01 a 19 + 20 + 21 | 13,5 a 14 |

## 🎯 Como controlar a aplicação

1. Aplicar uma proposta de cada vez no Overleaf, marcando como "feito".
2. Pode aprovar em qualquer ordem; cada proposta é independente.
3. Pode rejeitar uma proposta sem afetar as outras.
4. Recompilar o `.tex` após cada conjunto de 3 ou 4 propostas para acompanhar a redução real das páginas.

## 📋 Pendências `.bib`

- Verificar `kataokaOliveiraSouza2011`, `cazorlaKataokaSilva2010`, `borbaScucugliaGadanidis2014`, `papert1994`, `trouche2004`, `ausubel2000`, `almoulouCoutinho2008`, `almoulouSilva2012`.
- Manter `gil2008`, `lakatosMarconi2017` (uso provável no Cap. Metodologia).
- Verificar `borochovicius2021abp`, `souza2015abp` se ainda usados em outros capítulos.
