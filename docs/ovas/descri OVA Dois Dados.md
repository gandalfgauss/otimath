# DESCRIÇÃO CIENTÍFICA DO OVA: DOIS DADOS
## Projeto OtiMath.com — Sequência Didática Digital de Probabilidade
## Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos
## Arquivo: descri OVA Dois Dados.md
## Gerado em: 2026-04-02
## Tópicos: T2 (Espaço Amostral e Eventos), T3 (Probabilidade Clássica), T5 (Eventos Complementares), T6 (União, Interseção e Diferença)
## Posição na sequência: 2º OVA (após Disco Probabilístico Aleatório)

---

## 0. CONTEXTUALIZAÇÃO DO OVA NA SEQUÊNCIA DIDÁTICA

O OVA "Dois Dados" ocupa a segunda posição na sequência didática digital do projeto OtiMath.com, cumprindo a função de desenvolvimento conceitual dos tópicos de espaço amostral, probabilidade clássica e operações entre eventos. Essa posição é pedagogicamente necessária porque o estudante que chega a este OVA já consolidou, por meio do OVA anterior (Disco Probabilístico Aleatório), a noção intuitiva de aleatoriedade, experimento aleatório e frequência relativa — conceitos que servem de âncora cognitiva para a formalização que este OVA propõe. Conforme Artigue (2014, p. 160), a progressão conceitual de uma sequência didática deve respeitar a lógica interna do saber, e a transição do empírico (frequência relativa observada no disco) para o teórico (probabilidade clássica calculada na tabela de dois dados) atende a esse requisito. Zabala (1998, p. 38) reforça que a organização dos conteúdos condiciona o tipo de aprendizagem, e a decisão de posicionar o cálculo formal de probabilidade somente após a experiência com aleatoriedade garante que a formalização emerge como resposta a uma necessidade já percebida pelo estudante.

A progressão conceitual deste OVA parte da construção do espaço amostral Ω = {(i,j) : i,j ∈ {1,...,6}} com |Ω| = 36 resultados, avança para a identificação de eventos como subconjuntos de Ω, introduz o cálculo de P(A) = n(A)/n(Ω) sob condição de equiprobabilidade, trabalha eventos complementares e culmina nas operações entre eventos (interseção, união e diferença). Essa sequência reflete o que Brousseau (1997, p. 231) denomina estrutura processual e progressiva, na qual cada conceito torna-se ferramenta necessária para o seguinte. Almouloud e Silva (2012, p. 28) enfatizam que a análise a priori deve delimitar o campo de possibilidades do estudante, e o design deste OVA restringe esse campo por meio de desafios sequenciados que gradualmente aumentam a complexidade conceitual.

Em termos de competências específicas de Matemática previstas na BNCC (BRASIL, 2018, p. 531), este OVA desenvolve as habilidades EM13MAT105 (compreender a noção de experimento aleatório e espaço amostral), EM13MAT205 (resolver e elaborar problemas com base na contagem de possibilidades) e EM13MAT305 (resolver problemas que envolvam a probabilidade de eventos equiprováveis). A proposta da BNCC para o ensino de Probabilidade no Ensino Médio — compreensão de fenômenos aleatórios, raciocínio em contextos de incerteza e tomada de decisão fundamentada (BRASIL, 2018, p. 520, 523) — é concretizada nas situações que o OVA propõe, nas quais o estudante identifica eventos, opera com eles e calcula probabilidades em um espaço amostral explícito e manipulável.

---

## 1. IDENTIFICAÇÃO DO OVA

**Nome:** Dois Dados: cálculo de probabilidade em espaços amostrais equiprováveis
**Tópicos de Probabilidade:** T2 (Espaço Amostral e Eventos), T3 (Probabilidade Clássica), T5 (Eventos Complementares), T6 (União, Interseção e Diferença de Eventos)
**Posição na Sequência Didática:** 2º OVA — desenvolvimento conceitual
**Habilidades BNCC desenvolvidas:** EM13MAT105, EM13MAT205, EM13MAT305
**Pré-requisitos:** Conceito de experimento aleatório e aleatoriedade (T1, consolidado no OVA 1), noção intuitiva de frequência relativa (T8, consolidada no OVA 1), operações básicas com conjuntos (nível intuitivo)
**Pós-requisitos habilitados:** Probabilidade condicional (T9), independência de eventos (T10), probabilidade da união com fórmula da adição (T7)

---

## 2. OBJETIVOS DE APRENDIZAGEM

**Objetivo geral:** Desenvolver no estudante a capacidade de construir espaços amostrais de experimentos compostos, identificar eventos como subconjuntos desse espaço, calcular probabilidades pela definição clássica e operar com eventos por meio de interseção, união e diferença.

**Objetivos específicos:**
1. Conceitual: Compreender que o espaço amostral de dois dados é o produto cartesiano {1,...,6}×{1,...,6} com 36 elementos equiprováveis, e que um evento é um subconjunto desse espaço.
2. Procedimental: Calcular P(A) = n(A)/36 e P(Ā) = 1 − P(A), identificar A ∩ B, A ∪ B e A − B na tabela de dupla entrada, e expressar eventos compostos em notação de operações entre conjuntos.
3. Atitudinal: Reconhecer que a contagem sistemática é mais confiável que a intuição para determinar probabilidades, e que a fórmula clássica exige verificação prévia da condição de equiprobabilidade.

---

## 3. FUNDAMENTAÇÃO EM EDUCAÇÃO MATEMÁTICA

### 3.1 — Teoria das Situações Didáticas (Brousseau, 1997, 2002)

O OVA "Dois Dados" foi concebido como um milieu — ambiente que devolve retornos ao estudante sem a intervenção direta do professor (BROUSSEAU, 1997, p. 30). A situação fundamental que torna o espaço amostral necessário emerge quando o estudante percebe que listagens informais de resultados levam a omissões ou duplicações, e que uma estrutura organizada — a tabela 6×6 de dupla entrada — reduz erros e permite contagem confiável (BROUSSEAU, 1997, p. 88). A situação de ação ocorre quando o estudante marca os checkboxes da tabela correspondentes ao evento definido: ele age diretamente sobre o milieu, que responde com validação sem revelar a solução. A situação de formulação manifesta-se quando o estudante precisa expressar o evento composto D em termos de operações entre A e B (por exemplo, D = A ∩ B), convertendo sua compreensão intuitiva da tabela em linguagem simbólica formal. A situação de validação é parcialmente sustentada pelo feedback do sistema, que confirma ou rejeita a resposta sem entregar a correção, forçando o estudante a revisar sua estratégia. A institucionalização, ausente na versão atual, deverá ser inserida como tela de síntese ao final dos desafios, momento em que o saber construído recebe status matemático formal (BROUSSEAU, 1997, p. 56).

### 3.2 — Engenharia Didática (Artigue, 1988, 2014; Almouloud & Coutinho, 2008; Almouloud & Silva, 2012)

A análise preliminar deste OVA considerou três dimensões conforme Almouloud e Coutinho (2008, p. 68-69): a dimensão epistemológica, identificando que o conceito de espaço amostral em experimentos compostos é historicamente associado ao produto cartesiano e à contagem sistemática; a dimensão didática, reconhecendo que a prática escolar frequentemente apresenta a fórmula P = n/N antes de construir a necessidade intelectual; e a dimensão cognitiva, mapeando as concepções espontâneas dos estudantes — particularmente o viés de equiprobabilidade automática (LECOUTRE, 1992) e a dificuldade de listagem exaustiva (NAVARRO-PELAYO et al., 2016, p. 732). As hipóteses da análise a priori preveem que os estudantes terão dificuldade maior nos desafios que envolvem "menor face" e "maior face" (pois exigem comparação entre os dois dados, não apenas operação aritmética), que o erro mais frequente será a omissão de pares na fronteira do evento (por exemplo, incluir (3,6) mas esquecer (6,3) em "soma igual a 9"), e que a operação de diferença será a mais difícil de expressar simbolicamente. As variáveis didáticas identificadas são: o tipo de evento (aritmético, relacional, de paridade), o número de eventos simultâneos (1 ou 2), e o tipo de operação (interseção, união, diferença, diferença reversa), cada uma controlando o nível de complexidade conceitual (ALMOULOUD; SILVA, 2012, p. 28).

### 3.3 — Teoria dos Registros de Representação Semiótica (Duval, 1993)

O OVA mobiliza três registros de representação de forma obrigatória: o registro verbal (descrição do evento em linguagem natural, como "Soma maior que 8"), o registro tabular (tabela 6×6 onde o estudante identifica visualmente os pares que satisfazem o evento) e o registro algébrico-simbólico (expressão P(A) = n(A)/36 e notação de operações A ∩ B, A ∪ B, A − B). A conversão entre registros é condição para a compreensão, não apenas para o desempenho procedimental (DUVAL, 1993, p. 45): o estudante deve converter a descrição verbal em seleções na tabela (verbal→tabular), contar as seleções e expressá-las como fração (tabular→algébrico), e traduzir a relação entre dois eventos tabulares em operação simbólica (tabular→algébrico). A proposta de inserção de um diagrama de Venn dinâmico nos desafios com dois eventos acrescentará um quarto registro (figural) e uma conversão adicional (tabular→figural), fortalecendo a compreensão das operações entre eventos por meio da visualização simultânea da sobreposição entre A e B (DUVAL, 1993, p. 52).

### 3.4 — Aprendizagem Significativa (Ausubel, 2000)

O estudante que chega ao OVA "Dois Dados" traz consigo a experiência do OVA anterior, no qual manipulou o disco probabilístico e observou empiricamente a frequência relativa estabilizando-se em torno de probabilidades teóricas. Essa experiência constitui a âncora cognitiva sobre a qual o novo conceito — probabilidade clássica calculada — será ancorado. Conforme Ausubel (2000, p. ix), "o fator mais importante que influencia a aprendizagem é o que o aprendiz já sabe", e a proposta de inserção da "Armadilha da Equiprobabilidade" antes do primeiro desafio tem precisamente a função de ativar e revelar essas concepções prévias. Ao perguntar "Qual soma é mais provável: 7 ou 12?", o OVA força o estudante a explicitar sua intuição, que será confrontada pela evidência da tabela — criando o conflito cognitivo necessário para a reorganização do saber.

### 3.5 — Perspectiva Socioconstrutivista (Vygotsky, 1991)

Embora o OVA funcione como atividade individual, o roteiro de aplicação prevê momentos de interação social mediados pelo professor: antes do OVA, o professor conduz a discussão sobre a pergunta provocativa ("Qual soma é mais provável?") coletivamente, permitindo que os estudantes confrontem suas intuições entre si; durante o OVA, o professor circula observando estratégias e intervindo apenas quando o estudante está na zona de desenvolvimento proximal — capaz de avançar com apoio, mas não sozinho (VYGOTSKY, 1991, p. 58-61); após o OVA, o professor conduz a institucionalização coletiva, comparando estratégias e formalizando os conceitos.

### 3.6 — Tipologia de Conteúdos e Coerência Interna (Zabala, 1998)

Os conteúdos conceituais trabalhados pelo OVA incluem as definições de espaço amostral, evento, evento complementar e operações entre eventos, apresentados não como enunciados a memorizar, mas como ferramentas necessárias para resolver os desafios propostos. Os conteúdos procedimentais incluem a contagem sistemática na tabela, o cálculo de probabilidades por meio de frações, e a expressão de eventos compostos em notação simbólica. Os conteúdos atitudinais — reconhecer a superioridade da contagem sistemática sobre a intuição, e verificar a condição de equiprobabilidade antes de aplicar fórmulas — serão fortalecidos pela inserção da "Armadilha da Equiprobabilidade" e das perguntas reflexivas de fechamento. A avaliação está integrada às atividades por meio dos feedbacks do sistema, que verificam cada etapa sem separar "momento de aprender" de "momento de avaliar" (ZABALA, 1998, p. 30, 38, 63).

### 3.7 — Raciocínio Probabilístico e Ensino de Probabilidade (Batanero & Díaz, 2007; Batanero et al., 2016; Garfield & Ben-Zvi, 2014)

O ensino de probabilidade com dois dados é documentado na literatura como campo privilegiado para o confronto de vieses cognitivos. Batanero e Díaz (2007, p. 124) identificam que estudantes frequentemente aplicam a fórmula clássica sem verificar a condição de equiprobabilidade — o viés V3.2 — e que a confusão entre "e" e "ou" na descrição de eventos compostos — o viés V6.1 — é persistente mesmo após instrução formal (BATANERO; DÍAZ, 2007, p. 123). Navarro-Pelayo et al. (2016, p. 732) documentam que a construção do espaço amostral completo em experimentos compostos é a dificuldade mais frequente, com estudantes omitindo pares simétricos (como (2,5) e (5,2)) por não perceberem que a ordem importa. O OVA enfrenta essas dificuldades por meio da tabela 6×6 que explicita todos os 36 resultados, impossibilitando omissões estruturais, e por meio das operações entre eventos que forçam a distinção operacional entre interseção e união. A formalização emerge ao final como síntese da experiência — não como ponto de partida —, respeitando o princípio de que a construção de necessidade intelectual precede a apresentação da ferramenta matemática (BROUSSEAU, 1997, p. 22-23).

### 3.8 — Tecnologias Digitais na Educação Matemática (Borba, Scucuglia & Gadanidis, 2014; Clark-Wilson et al., 2020)

A tabela interativa 6×6 com checkboxes torna possível algo que seria impraticável em papel: explorar dezenas de eventos diferentes no mesmo espaço amostral, verificar respostas instantaneamente e visualizar a sobreposição entre dois eventos na mesma grade. Essa capacidade não apenas acelera o processo — ela altera qualitativamente o que pode ser aprendido. Conforme Borba, Scucuglia e Gadanidis (2014, p. 45), "as tecnologias digitais não apenas mudam a forma de ensinar Matemática; alteram o que pode ser ensinado e como os estudantes aprendem". A geração aleatória de desafios a cada sessão impede a memorização e garante que o raciocínio genuíno seja exercitado repetidamente. Clark-Wilson, Robutti e Thomas (2020, p. 1225) enfatizam o papel mediador da tecnologia nos processos cognitivos, e a tabela interativa cumpre exatamente essa função: media entre o estudante e o conceito abstrato de espaço amostral, tornando-o manipulável, visível e verificável.

### 3.9 — TPACK (Mishra & Koehler, 2006)

O OVA atinge integração entre conteúdo (CK), pedagogia (PK) e tecnologia (TK) quando a tabela 6×6 interativa só faz sentido para o conteúdo de espaço amostral de dois dados (TCK), a pedagogia de desafios progressivos aproveita a verificação instantânea que a tecnologia oferece (TPK), e o conteúdo é ensinado de forma que tecnologia e pedagogia se reforçam mutuamente — sem a tabela interativa, a quantidade de desafios e a diversidade de eventos seria inviável em uma aula de 50 minutos (MISHRA; KOEHLER, 2006, p. 1025).

### 3.10 — Letramento Probabilístico (Engel, 2017)

O OVA desenvolve a capacidade de calcular e interpretar probabilidades de eventos compostos, competência fundamental para o letramento probabilístico. Embora o contexto imediato seja o lançamento de dados — e não uma situação cotidiana — a competência de identificar eventos, operar com eles e calcular probabilidades é transferível para contextos reais de risco e incerteza (ENGEL, 2017, p. 1006). A inserção de perguntas reflexivas ao final dos desafios fortalecerá essa dimensão ao exigir que o estudante comunique e argumente sobre probabilidades, não apenas as calcule.

### 3.11 — Design Science Research (Dresch, Lacerda & Antunes Jr., 2015)

O OVA é um artefato concebido para resolver um problema educacional documentado: a dificuldade dos estudantes em construir espaços amostrais de experimentos compostos e calcular probabilidades clássicas sem recorrer a vieses intuitivos (BATANERO; DÍAZ, 2007, p. 124; NAVARRO-PELAYO et al., 2016, p. 732). Os requisitos do artefato derivam da literatura: permitir manipulação direta do espaço amostral (GARFIELD; BEN-ZVI, 2014, p. 136), confrontar vieses de equiprobabilidade (LECOUTRE, 1992), e estar inserido em sequência didática documentada (BATANERO, 2024, p. 13). O ciclo DSR está em fase de design (Fase 3), com avaliação prevista por meio de análise a posteriori conforme protocolo documentado na Fase 5.4 (DRESCH; LACERDA; ANTUNES JÚNIOR, 2015, p. 47, 63, 89).

### 3.12 — Construcionismo (Papert, 1980, 1994)

Ao marcar os checkboxes da tabela, o estudante não executa um procedimento prescrito — ele constrói, resultado a resultado, a representação de um evento dentro do espaço amostral. Essa construção difere da execução mecânica porque exige decisão: para cada par (i,j), o estudante avalia se a condição do evento é satisfeita e marca ou não. A proposta de inserção do diagrama de Venn dinâmico amplia essa dimensão construcionista, pois o estudante verá, em tempo real, o artefato visual que está construindo com suas marcações — concretizando o pensamento abstrato sobre operações entre conjuntos (PAPERT, 1980).

### 3.13 — Gênese Instrumental (Trouche, 2004)

A tabela 6×6 interativa é um artefato que se torna instrumento cognitivo pelo duplo processo descrito por Trouche (2004, p. 285): a instrumentação ocorre quando a estrutura da tabela molda o pensamento do estudante — ele passa a raciocinar em termos de pares ordenados (i,j) organizados em linhas e colunas, internalizando a lógica do produto cartesiano; a instrumentalização ocorre quando o estudante adapta a ferramenta aos seus objetivos, por exemplo, percebendo que pode verificar a condição "soma maior que 8" percorrendo diagonais da tabela em vez de verificar célula a célula. Essa relação estudante-ferramenta-conhecimento é o que distingue o uso instrumental produtivo do uso mecânico.

### 3.14 — Mediação Digital e Reestruturação do Pensamento (Hoyles & Noss, 2003)

A tecnologia usada neste OVA reestrutura o pensamento probabilístico do estudante de forma qualitativa: sem a tabela interativa, o espaço amostral de 36 elementos seria uma abstração; com ela, torna-se um objeto manipulável onde padrões emergem visualmente — o estudante percebe, por exemplo, que "soma igual a 7" forma uma diagonal na tabela, enquanto "soma igual a 12" é um único ponto no canto. Essa percepção visual-estrutural seria inacessível na abordagem puramente simbólica (HOYLES; NOSS, 2003, p. 330).

### 3.15 — Teoria Cognitiva da Aprendizagem Multimídia — TCAM (Mayer, 2001, 2014)

O design do OVA aplica os princípios de Mayer na organização das telas: a segmentação divide a atividade em etapas gerenciáveis (primeiro marcar, depois calcular, depois operar); a contiguidade espacial posiciona o Quadro de Eventos ao lado da tabela, permitindo consulta visual imediata; a interatividade garante que o estudante controle o ritmo, avançando apenas quando está pronto. A carga cognitiva estranha foi minimizada pela interface limpa com checkboxes claros e feedback visual (bordas vermelhas em caso de erro). A proposta de redução das instruções iniciais e inserção de tooltips contextuais visa maximizar a carga cognitiva gerativa — processamento ativo de significados — em detrimento da estranha — causada por excesso de informação prévia (MAYER, 2014).

---

## 4. DIFICULDADES DE APRENDIZAGEM ENDEREÇADAS

### 4.1 — Construção do espaço amostral completo em experimentos compostos
**Referência:** (NAVARRO-PELAYO et al., 2016, p. 732)
**Como o OVA enfrenta:** A tabela 6×6 explicita todos os 36 resultados. Cada célula é um par ordenado (i,j). A estrutura impede omissões e duplicações. O estudante que esquece de verificar um par recebe feedback de erro, forçando revisão completa.
**Momento:** Desafios 1–5, Etapa 1 (checkbox).

### 4.2 — Distinção entre evento e resultado elementar
**Referência:** (BATANERO; DÍAZ, 2007, p. 122)
**Como o OVA enfrenta:** Parcialmente — o estudante marca subconjuntos de resultados para cada evento, o que implicitamente distingue evento (subconjunto) de resultado (elemento). Porém, essa distinção não é verbalizada explicitamente no OVA.
**Adequação proposta:** Inserir texto breve no Quadro de Eventos: "Um evento é o conjunto de todos os resultados que satisfazem uma condição."

### 4.3 — Verificação da condição de equiprobabilidade
**Referência:** (LECOUTRE, 1992 apud BATANERO; DÍAZ, 2007, p. 124)
**Como o OVA enfrenta:** Atualmente ausente. O estudante usa P = n/36 sem questionar por que 36.
**Adequação proposta:** Inserir "Armadilha da Equiprobabilidade" antes do Desafio 1, confrontando V3.1 e V3.2.

### 4.4 — Tradução entre linguagem natural e linguagem matemática de eventos
**Referência:** (BATANERO; DÍAZ, 2007, p. 122-123)
**Como o OVA enfrenta:** O estudante converte a descrição verbal ("Soma maior que 8") em seleções na tabela, e depois em fração P(A) = n/36. Conversão obrigatória em cada desafio.
**Momento:** Todos os desafios, todas as etapas.

---

## 5. VIESES COGNITIVOS MOBILIZADOS E CONFRONTADOS

### 5.1 — V2.1 Viés de omissão
**Referência:** (NAVARRO-PELAYO et al., 2016, p. 732)
**Como o OVA torna visível:** A tabela 6×6 força o estudante a considerar cada um dos 36 pares. Se omitir algum, o feedback de erro sinaliza incompletude.
**Conflito cognitivo:** O estudante que marca intuitivamente apenas alguns pares descobre que faltam outros ao receber "Ops! Tente novamente!", forçando revisão sistemática.

### 5.2 — V3.1 / V3.2 Viés de equiprobabilidade automática
**Referência:** (LECOUTRE, 1992 apud BATANERO; DÍAZ, 2007, p. 124)
**Status atual:** ⛔ Ausente — o OVA aplica P = n/36 sem confrontar.
**Adequação proposta:** "Armadilha da Equiprobabilidade" — pergunta provocativa que revela o viés antes da instrução, seguida de revelação visual pela tabela.

### 5.3 — V6.1 Confusão "e" / "ou"
**Referência:** (BATANERO; DÍAZ, 2007, p. 123)
**Como o OVA torna visível:** Nos desafios 3–5, o estudante precisa selecionar a operação (∩ ou ∪ ou −) que transforma dois eventos em um terceiro. A seleção errada gera feedback imediato, forçando distinção operacional.
**Adequação proposta:** Diagrama de Venn dinâmico que torna visualmente inequívoca a diferença entre ∩ (sobreposição) e ∪ (área total).

---

## 6. ARQUITETURA DIDÁTICA

### 6.1 — Estrutura Interna

| Etapa | Nome | Tipo TSD | Conteúdo (Zabala) | Duração |
|-------|------|----------|-------------------|---------|
| 0 | Apresentação do Dado | — (passiva, a ser melhorada) | Conceitual | 3 min |
| 0.5 | Armadilha da Equiprobabilidade (proposta) | Ação | Atitudinal | 2 min |
| 1–2 | Desafios com 1 evento | Ação + Formulação | Conceitual + Procedimental | 8 min |
| 3–5 | Desafios com 2 eventos | Ação + Formulação + Validação | Conceitual + Procedimental | 15 min |
| 6 | Institucionalização (proposta) | Institucionalização | Conceitual + Atitudinal | 3 min |

### 6.2 — Lógica Pedagógica da Progressão

A progressão parte do evento simples (um subconjunto de Ω) para o evento composto (combinação de dois subconjuntos), e do cálculo direto de P(A) para a expressão simbólica de operações entre eventos. Cada etapa torna necessária a seguinte: calcular P(A ∩ B) exige saber identificar A e B separadamente; expressar D = A ∩ B exige ter marcado D na tabela e percebido a relação com A e B. Essa progressão fundamenta-se em Artigue (2014, p. 160) e Brousseau (1997, p. 231).

---

## 7. INTERATIVIDADE COM FUNÇÃO EPISTEMOLÓGICA

| # | Interação | Nível | Função Epistemológica |
|---|-----------|-------|-----------------------|
| 1 | Marcar checkboxes do evento A | EXPLORATÓRIA | Construir a extensão do evento no espaço amostral |
| 2 | Digitar P(A) e P(Ā) | EXPRESSIVA | Quantificar e formalizar a relação evento/espaço amostral |
| 3 | Marcar checkboxes de A e B | EXPLORATÓRIA | Visualizar a sobreposição entre dois eventos |
| 4 | Marcar checkboxes de D | EXPLORATÓRIA | Descobrir que D é combinação de A e B |
| 5 | Selecionar operação D = A ○ B | EXPRESSIVA | Formalizar relação conjuntista entre eventos |
| 6 | Calcular P(D) | EXPRESSIVA | Aplicar a definição clássica ao resultado da operação |

Cada interação é condição para a aprendizagem: remover a marcação de checkboxes tornaria o espaço amostral abstrato e não manipulável; remover o cálculo de P reduziria o OVA a exercício de identificação sem quantificação; remover a seleção de operação eliminaria a ponte entre o visual (tabela) e o formal (notação conjuntista). A tecnologia altera o que pode ser ensinado, não apenas como se apresenta o conteúdo (BORBA; SCUCUGLIA; GADANIDIS, 2014, p. 45-51).

---

## 8. ARQUITETURA TECNOLÓGICA

### 8.1 — Tecnologias Utilizadas

| Tecnologia | Função | Justificativa |
|------------|--------|---------------|
| Next.js + React | Framework principal | Renderização eficiente de componentes interativos |
| Checkboxes interativos | Marcação na tabela 6×6 | Manipulação direta do espaço amostral |
| SelectInput | Seleção de operações | Expressão simbólica de operações conjuntistas |
| TextInput (número) | Cálculo de P | Entrada de numerador/denominador |
| Three.js (apresentação) | Dado 3D realista | Visualização imersiva do objeto probabilístico |
| SVG (proposto: Venn) | Diagrama de Venn dinâmico | 4º registro de representação |

### 8.2 — Aprendizagem Impossível sem a Tecnologia

Sem a tabela interativa, o estudante precisaria desenhar manualmente uma grade 6×6 em papel, marcar resultados com caneta (sem possibilidade de desfazer), e contar manualmente — processo tão lento que limitaria a exploração a 1–2 eventos por aula. Com a tecnologia, o estudante explora 10+ eventos em 30 minutos, verificando cada resposta instantaneamente. A quantidade de prática deliberada possibilitada pela tecnologia é condição para a consolidação do conceito, não mera conveniência (CLARK-WILSON; ROBUTTI; THOMAS, 2020, p. 1225).

---

## 9. INTEGRAÇÃO NA SEQUÊNCIA DIDÁTICA

### 9.1 — Articulação com o OVA Anterior (Disco Probabilístico)
O estudante chega com: noção de aleatoriedade, experiência com frequência relativa, percepção intuitiva de que eventos mais prováveis ocorrem com mais frequência. Este OVA formaliza: por que alguns eventos são mais prováveis (têm mais resultados favoráveis em Ω).

### 9.2 — Articulação com o OVA Posterior
Este OVA prepara: a noção de evento, operações entre eventos, e cálculo de P — conceitos necessários para probabilidade condicional (T9) e fórmula da adição (T7).

### 9.3 — Papel do Professor
**Antes:** conduz discussão coletiva sobre a pergunta provocativa.
**Durante:** circula, observa estratégias, intervém apenas na ZDP (VYGOTSKY, 1991, p. 58-61).
**Após:** conduz institucionalização coletiva, comparando estratégias e formalizando (BROUSSEAU, 1997, p. 56, 230).

---

## 10. FUNCIONAMENTO DETALHADO — ver docs/ovas/analise OVA Dois Dados.md, Seção 1.1

---

## 11. DECISÕES DE DESIGN JUSTIFICADAS

### 11.1 — Por que tabela 6×6 e não listagem
A tabela organiza o produto cartesiano visualmente, impedindo omissões e duplicações que são a dificuldade mais documentada em experimentos compostos (NAVARRO-PELAYO et al., 2016, p. 732). A representação tabular é também o registro mais adequado para visualizar operações entre eventos definidos por condições sobre linhas e colunas (DUVAL, 1993, p. 45).

### 11.2 — Por que geração aleatória de desafios
A aleatorização dos 12 eventos e 4 operações a cada sessão impede a memorização e garante prática deliberada com diversidade conceitual. Cada sessão confronta o estudante com combinações diferentes, fortalecendo a generalização (GARFIELD; BEN-ZVI, 2014, p. 136).

### 11.3 — Por que aceitação de equivalências nas operações
A validação aceita A ∩ B = A − B̄ porque demonstra compreensão das relações entre operações, não memorização de uma única forma (BATANERO; DÍAZ, 2007, p. 125).

---

## 12. CONTRIBUIÇÃO PARA O RACIOCÍNIO PROBABILÍSTICO

### 12.1 — O que muda no pensamento do estudante
O estudante chega com a concepção ingênua de que probabilidade é "adivinhar" ou "ter sorte". Após o OVA, reorganiza seu raciocínio: probabilidade é razão entre casos favoráveis e casos possíveis, calculável por contagem sistemática em um espaço amostral explícito, e manipulável por operações entre eventos (AUSUBEL, 2000, p. ix; BROUSSEAU, 1997, p. 88).

### 12.2 — Qual conceito é reconstruído
A noção de "chance" é reconstruída como probabilidade formal: P(A) = n(A)/n(Ω), com Ω explícito e equiprobabilidade verificável. A noção de "e"/"ou" do cotidiano é reconstruída como ∩/∪ com significado conjuntista preciso.

### 12.3 — Evidência de que o design produz esse avanço
Garfield e Ben-Zvi (2014, p. 136) documentam que simulações interativas com controle de parâmetros favorecem a compreensão estrutural da probabilidade. Nilsson (2022, p. 5) demonstra que a visibilidade estrutural — tornar visível o que é abstrato — é condição para a aprendizagem em ambientes digitais de probabilidade. Batanero et al. (2016, p. 23) confirmam que a construção ativa do espaço amostral supera a dificuldade de listagem assistemática.

---

## 13. REFERÊNCIAS

ALMOULOUD, S. A.; COUTINHO, C. Q. S. Engenharia Didática: características e seus usos em trabalhos apresentados no GT-19/ANPEd. Revemat, v. 3, n. 1, p. 62–77, 2008.

ALMOULOUD, S. A.; SILVA, M. J. F. da. Engenharia didática: evolução e diversidade. Revemat, v. 7, n. 2, p. 22–52, 2012.

ARTIGUE, M. Perspectives on design research: the case of didactical engineering. In: BIKNER-AHSBAHS, A. et al. (ed.). Approaches to qualitative research in mathematics education. Dordrecht: Springer, 2014. p. 467–496.

AUSUBEL, D. P. The acquisition and retention of knowledge. Dordrecht: Kluwer, 2000.

BATANERO, C. Teaching probability in secondary education. Education Sciences, v. 14, n. 2, 2024.

BATANERO, C.; DÍAZ, C. (ed.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.

BATANERO, C. et al. Teaching and learning stochastics. Cham: Springer, 2016.

BORBA, M. C.; SCUCUGLIA, R.; GADANIDIS, G. Fases das tecnologias digitais em Educação Matemática. 2. ed. Belo Horizonte: Autêntica, 2014.

BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.

BROUSSEAU, G. Theory of didactical situations in mathematics. Dordrecht: Kluwer, 1997.

CLARK-WILSON, A.; ROBUTTI, O.; THOMAS, M. Teaching with digital technology. ZDM Mathematics Education, v. 52, n. 7, p. 1223–1242, 2020.

DRESCH, A.; LACERDA, D. P.; ANTUNES JÚNIOR, J. A. V. Design Science Research. Porto Alegre: Bookman, 2015.

DUVAL, R. Registres de représentation sémiotique et fonctionnement cognitif de la pensée. Annales de Didactique et de Sciences Cognitives, v. 5, p. 37–65, 1993.

ENGEL, J. Statistical literacy for active citizenship. Statistics Education Research Journal, v. 16, n. 1, p. 44–49, 2017.

GARFIELD, J.; BEN-ZVI, D. Developing students' statistical reasoning. Dordrecht: Springer, 2014.

HOYLES, C.; NOSS, R. What can digital technologies take from and bring to research in mathematics education? In: BISHOP, A. et al. (ed.). Second international handbook of mathematics education. Dordrecht: Kluwer, 2003. p. 323–349.

LECOUTRE, M. P. Cognitive models and problem spaces in "purely random" situations. Educational Studies in Mathematics, v. 23, n. 6, p. 557–568, 1992.

MAYER, R. E. Multimedia learning. Cambridge: Cambridge University Press, 2001.

MAYER, R. E. (ed.). The Cambridge handbook of multimedia learning. 2. ed. Cambridge: Cambridge University Press, 2014.

MISHRA, P.; KOEHLER, M. J. Technological Pedagogical Content Knowledge. Teachers College Record, v. 108, n. 6, p. 1017–1054, 2006.

NAVARRO-PELAYO, V.; PÁEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students' difficulties in solving probability tasks. IJMEST, v. 47, n. 5, p. 732–747, 2016.

NILSSON, P. Designing simulation-based environments for probability learning. Education Sciences, v. 12, n. 5, 2022.

PAPERT, S. Mindstorms: children, computers, and powerful ideas. New York: Basic Books, 1980.

TROUCHE, L. Managing the complexity of human/machine interactions in computerized learning environments. IJCML, v. 9, n. 3, p. 281–307, 2004.

VYGOTSKY, L. S. A formação social da mente. 4. ed. São Paulo: Martins Fontes, 1991.

ZABALA, A. A prática educativa: como ensinar. Porto Alegre: Artmed, 1998.
