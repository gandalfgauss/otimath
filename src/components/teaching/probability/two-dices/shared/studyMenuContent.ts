/* ═══════════════════════════════════════════════════════════════════
   studyMenuContent.ts — Glossários do Menu de Revisão

   DUAS COLEÇÕES distintas para o Menu de Revisão da sequência didática:
     • DOIS_DADOS_GLOSSARY — focado no espaço amostral 6×6 dos dados,
       operações entre eventos sobre pares ordenados, soma de dados.
       Usado por Ex6, Ex8 e pelo botão "Revisar conceitos" do OVA Dois Dados.
     • DISCO_GLOSSARY — focado no disco aleatório: experimento aleatório,
       frequência relativa, Lei dos Grandes Números, espaços não
       equiprováveis (por ângulo e por repetição de cores), probabilidade
       angular θ/360°. Usado pelo botão "Revisar conceitos" do OVA do Disco.

   Os verbetes seguem anatomia uniforme (consistência — NIELSEN, 1994):
     • Definição formal (símbolos + linguagem natural)
     • Exemplo no contexto do OVA correspondente
     • Para que serve
     • Atenção (viés cognitivo mapeado pela literatura científica)

   Por que separar?
     Os conceitos se sobrepõem (união, complementar, equiprovável, etc.)
     mas os EXEMPLOS são radicalmente diferentes — no Disco os
     resultados são setores coloridos; no Dois Dados são pares ordenados
     (verde, azul). Confundir os contextos no card de revisão
     prejudica a aprendizagem ao invés de auxiliá-la.
   ═══════════════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────────────
   IDs usados pelo Ex6 / Ex8 para sugerir verbetes após erros.
   Pertencem ao DOIS_DADOS_GLOSSARY — mantidos como tipo restrito para
   o roteamento por `getSuggestedEntries`/`getFeedbackMessage`.
   ─────────────────────────────────────────────────────────────────── */
export type GlossaryEntryId =
  | 'uniao'
  | 'intersecao'
  | 'diferenca'
  | 'complementar'
  | 'equiprovavel'
  | 'cardinalidade-uniao'
  | 'probabilidade-uniao';

/* Grupo do verbete — string livre para que cada glossário use os seus.
   `StudyMenu` deriva GROUP_ORDER do prop `groups` (vide StudyMenu.tsx). */
export type GlossaryGroup = string;

export interface GlossaryEntry {
  /** ID único do verbete (livre — só precisa ser único dentro do glossário). */
  readonly id: string;
  readonly title: string;
  readonly group: GlossaryGroup;
  readonly groupTitle: string;
  readonly formalDefinition: string;
  readonly naturalDefinition: string;
  readonly exampleContext: string;
  readonly exampleCalculation: string;
  readonly useCase: string;
  readonly attention: string;
  readonly reference: string;
}

/* ───────────────────────────────────────────────────────────────────
   DOIS_DADOS_GLOSSARY — Espaço amostral 6×6, operações sobre pares
   ordenados (verde × azul), soma de dois dados. Usado por Ex6/Ex8 e
   pelo botão "Revisar conceitos" do OVA Dois Dados.
   ─────────────────────────────────────────────────────────────────── */
export const DOIS_DADOS_GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: 'uniao',
    title: 'União (A ∪ B)',
    group: 'operacoes',
    groupTitle: 'Operações entre eventos',
    formalDefinition:
      'A ∪ B = { x ∈ S | x ∈ A ou x ∈ B } — conjunto dos resultados que pertencem a A, a B, ou a ambos.',
    naturalDefinition:
      'A união agrupa em um único evento TODOS os resultados que pertencem a A, a B, ou a ambos. Importante: o "ou" matemático é sempre INCLUSIVO — quem está na interseção também faz parte da união.',
    exampleContext:
      'Considere A = "Soma maior que 8" e B = "Face par no dado verde" no lançamento de dois dados (verde × azul). O evento A ∪ B contém todos os pares ordenados (g, b) em que a soma é maior que 8 OU o dado verde mostra face par (ou as duas coisas).',
    exampleCalculation:
      'n(A) = 10; n(B) = 18; n(A ∩ B) = 6 (pares que satisfazem AS DUAS condições). Logo n(A ∪ B) = 10 + 18 − 6 = 22 pares ordenados em 36 possíveis.',
    useCase:
      'Quando o problema pergunta "qual a probabilidade de OCORRER A OU B?", você precisa do evento A ∪ B. É a operação que aparece em quase todo problema de probabilidade que envolve duas condições alternativas.',
    attention:
      'Em linguagem cotidiana, "ou" às vezes significa "uma OU outra, mas não as duas" (ou exclusivo). Em Matemática, A ∪ B é SEMPRE inclusivo — quem está em A ∩ B também está em A ∪ B. Confundir isso é o viés mais comum (BATANERO; DIAZ, 2007, p. 123).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'intersecao',
    title: 'Interseção (A ∩ B)',
    group: 'operacoes',
    groupTitle: 'Operações entre eventos',
    formalDefinition:
      'A ∩ B = { x ∈ S | x ∈ A e x ∈ B } — conjunto dos resultados que pertencem SIMULTANEAMENTE a A e a B.',
    naturalDefinition:
      'A interseção reúne apenas os resultados que satisfazem AO MESMO TEMPO o evento A E o evento B. Quem está em só um dos dois fica de fora.',
    exampleContext:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde", o evento A ∩ B contém os pares (g, b) em que a soma é maior que 8 E o dado verde é par. Por exemplo, (4, 5): soma = 9 > 8 ✓ e verde = 4 é par ✓. Já (3, 6): soma = 9 > 8 ✓ mas verde = 3 não é par ✗ — fica de fora.',
    exampleCalculation:
      'Os pares (g, b) com soma > 8 E verde par são: (4,5), (4,6), (6,3), (6,4), (6,5), (6,6) — total n(A ∩ B) = 6 em 36 possíveis. P(A ∩ B) = 6/36 = 1/6.',
    useCase:
      'Quando o problema pergunta "qual a probabilidade de OCORRER A E B AO MESMO TEMPO?", você precisa do evento A ∩ B. Também aparece como termo dentro da fórmula da união: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
    attention:
      'Não confunda "e" da linguagem comum com o "e" matemático. Para estar em A ∩ B, é PRECISO satisfazer as DUAS condições — basta uma falhar e o resultado fica fora. Ambiguidade na palavra "e" é fonte recorrente de erro (BATANERO; DIAZ, 2007, p. 123).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'diferenca',
    title: 'Diferença (A − B)',
    group: 'operacoes',
    groupTitle: 'Operações entre eventos',
    formalDefinition:
      'A − B = { x ∈ S | x ∈ A e x ∉ B } = A ∩ B̄ — conjunto dos resultados que pertencem a A MAS NÃO a B (S é o espaço amostral).',
    naturalDefinition:
      'A diferença A − B pega tudo o que está em A e REMOVE o que também esteja em B. É equivalente a "A interseção com o complementar de B".',
    exampleContext:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde", o evento A − B contém os pares com soma > 8 EXCETO aqueles em que o verde é par. Por exemplo, (3,6) tem soma = 9 > 8 e verde = 3 (ímpar) → está em A − B. Já (4,5) tem soma = 9 > 8 mas verde = 4 (par) → fica fora.',
    exampleCalculation:
      'n(A) = 10; n(A ∩ B) = 6. Logo n(A − B) = n(A) − n(A ∩ B) = 10 − 6 = 4 pares: (3,6), (5,4), (5,5), (5,6). P(A − B) = 4/36 = 1/9.',
    useCase:
      'Útil quando o problema pede "ocorre A mas NÃO ocorre B". Também aparece quando uma operação de interseção pode ser reescrita como diferença com complementar: A ∩ B = A − B̄.',
    attention:
      'A − B NÃO é o mesmo que B − A (a operação não é comutativa). Verifique sempre qual conjunto é o "principal" (de onde se remove) e qual é o "subtraído" (BATANERO; DIAZ, 2007, p. 126).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'complementar',
    title: 'Evento Complementar (Ā)',
    group: 'eventos-especiais',
    groupTitle: 'Eventos especiais',
    formalDefinition:
      'Ā = { x ∈ S | x ∉ A } = S − A — conjunto dos resultados do espaço amostral S que NÃO pertencem a A. Vale P(A) + P(Ā) = 1.',
    naturalDefinition:
      'O complementar de A é tudo o que está no espaço amostral S menos o que está em A. Em palavras: "o evento de A NÃO ocorrer".',
    exampleContext:
      'Se A = "Soma maior que 8", então Ā = "Soma menor ou igual a 8". A cobre 10 dos 36 pares; Ā cobre os outros 26. Note que A ∪ Ā = S e A ∩ Ā = ∅.',
    exampleCalculation:
      'P(A) = 10/36 = 5/18. P(Ā) = 1 − 5/18 = 13/18 = 26/36. Verificação: 10 + 26 = 36 ✓.',
    useCase:
      'Quando calcular P(A) é difícil mas P(Ā) é fácil, use P(A) = 1 − P(Ā). Especialmente útil em problemas com "pelo menos um(a)" — o complementar costuma ser "nenhum(a)", muito mais fácil de contar.',
    attention:
      'Estudantes tendem a calcular sempre direto, mesmo quando o complementar seria mais simples (BATANERO; DIAZ, 2007, p. 127). Habitue-se a perguntar: "é mais fácil contar o que ocorre OU o que NÃO ocorre?" antes de escolher a estratégia.',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'equiprovavel',
    title: 'Probabilidade em espaço amostral equiprovável',
    group: 'probabilidade',
    groupTitle: 'Probabilidade',
    formalDefinition:
      'Seja S o espaço amostral (conjunto de TODOS os resultados possíveis do experimento). Se S é finito e todos os resultados elementares são igualmente prováveis, então P(A) = n(A) / n(S) para qualquer evento A ⊆ S. Esta é a definição clássica de probabilidade (Laplace).',
    naturalDefinition:
      'Em um espaço amostral em que cada resultado tem a mesma chance de sair, a probabilidade de um evento é a razão entre quantos resultados favorecem o evento e quantos resultados são possíveis no total.',
    exampleContext:
      'No lançamento de dois dados (verde × azul), o espaço amostral S é o conjunto dos 36 pares ordenados (g, b) com g, b ∈ {1, 2, 3, 4, 5, 6}. Cada par é igualmente provável (1/36).',
    exampleCalculation:
      'Para o evento A = "Soma maior que 8", contam-se os pares favoráveis: (3,6), (4,5), (4,6), (5,4), (5,5), (5,6), (6,3), (6,4), (6,5), (6,6) → n(A) = 10. Logo P(A) = 10/36 = 5/18.',
    useCase:
      'É a fórmula básica para calcular probabilidade em qualquer experimento clássico — dados, moedas, baralhos, sorteios — em que a simetria garante que todos os resultados elementares têm a mesma chance.',
    attention:
      'Antes de aplicar a fórmula, VERIFIQUE se S (o espaço amostral) é mesmo equiprovável. Se não for, n(A)/n(S) está errado. E nunca esqueça de identificar n(S) corretamente — esse é o erro mais frequente em probabilidade clássica (NAVARRO-PELAYO et al., 2016, p. 734).',
    reference: 'NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students\' difficulties in solving probability tasks. IJMEST, v. 47, n. 5, p. 732-747, 2016.',
  },
  {
    id: 'cardinalidade-uniao',
    title: 'Cardinalidade da União: n(A ∪ B) = n(A) + n(B) − n(A ∩ B)',
    group: 'probabilidade',
    groupTitle: 'Probabilidade',
    formalDefinition:
      'Para quaisquer eventos finitos A e B, vale o princípio da inclusão-exclusão: n(A ∪ B) = n(A) + n(B) − n(A ∩ B). A subtração de n(A ∩ B) corrige a contagem dupla dos elementos que pertencem aos dois conjuntos.',
    naturalDefinition:
      'Para contar quantos resultados estão em A ∪ B, somamos n(A) e n(B), MAS subtraímos n(A ∩ B) — porque os elementos da interseção foram contados duas vezes (uma em A, outra em B).',
    exampleContext:
      'Com A = "Soma maior que 8" (n(A) = 10) e B = "Face par no dado verde" (n(B) = 18), há 6 pares que estão em ambos (n(A ∩ B) = 6). Se somássemos direto, contaríamos esses 6 pares duas vezes.',
    exampleCalculation:
      'n(A ∪ B) = n(A) + n(B) − n(A ∩ B) = 10 + 18 − 6 = 22. Sem subtrair a interseção, daria 28 — errado.',
    useCase:
      'É o passo intermediário entre saber n(A), n(B), n(A ∩ B) e calcular P(A ∪ B). Sempre que você precisar de "quantos estão em A ou em B", use esta fórmula.',
    attention:
      'O erro clássico é fazer n(A) + n(B) sem subtrair a interseção — chamado de heurística aditiva simplificada (KAHNEMAN; TVERSKY, 1972, p. 432). Resulta em SUPERESTIMAÇÃO da cardinalidade (e, em probabilidade, em valores possivelmente acima de 1, o que é matematicamente impossível).',
    reference: 'KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. Cognitive Psychology, v. 3, n. 3, p. 430-454, 1972.',
  },
  {
    id: 'probabilidade-uniao',
    title: 'Probabilidade da União — duas formas equivalentes',
    group: 'probabilidade',
    groupTitle: 'Probabilidade',
    formalDefinition:
      'Sendo S o espaço amostral, a probabilidade do evento A ∪ B pode ser calculada de DUAS formas equivalentes:\n\n  (a) Forma direta:    P(A ∪ B) = n(A ∪ B) / n(S)\n  (b) Forma composta:  P(A ∪ B) = P(A) + P(B) − P(A ∩ B)\n\nAmbas dão o mesmo resultado. A forma (b) é consequência direta da fórmula da inclusão-exclusão dividida por n(S).',
    naturalDefinition:
      'Você tem DOIS caminhos para calcular P(A ∪ B): contar diretamente quantos pares estão em A ∪ B e dividir por 36, OU somar P(A) + P(B) e subtrair P(A ∩ B). Os dois caminhos chegam ao mesmo número.',
    exampleContext:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde": n(A) = 10, n(B) = 18, n(A ∩ B) = 6, n(A ∪ B) = 22.',
    exampleCalculation:
      'Forma direta:   P(A ∪ B) = 22/36 = 11/18 ≈ 0,611\nForma composta: P(A ∪ B) = 10/36 + 18/36 − 6/36 = (10 + 18 − 6)/36 = 22/36 = 11/18 ✓\n\nResultado idêntico.',
    useCase:
      'A forma direta é melhor quando você já marcou A ∪ B na tabela e contou as células. A forma composta é melhor quando você conhece P(A), P(B) e P(A ∩ B) separadamente — situação típica em problemas de palavras.',
    attention:
      'NÃO use P(A ∪ B) = P(A) + P(B) sem subtrair P(A ∩ B), a menos que A e B sejam MUTUAMENTE EXCLUSIVOS (A ∩ B = ∅). Generalizar a regra dos exclusivos para eventos quaisquer é erro frequente (BATANERO; DIAZ, 2007, p. 125).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
];

/* Compat: o nome antigo `GLOSSARY_ENTRIES` ainda é usado pelos
   componentes Ex6/Ex8 (UnionExercise6Review, TwoDicesClosingScreen,
   TwoDicesGameAdvanced). Apontamos para DOIS_DADOS_GLOSSARY para
   manter o caminho. */
export const GLOSSARY_ENTRIES = DOIS_DADOS_GLOSSARY;

/* ───────────────────────────────────────────────────────────────────
   Grupos do glossário do OVA Dois Dados — ordem visual no StudyMenu.
   ─────────────────────────────────────────────────────────────────── */
export interface GlossaryGroupDef {
  readonly key: string;
  readonly title: string;
}

export const DOIS_DADOS_GROUPS: readonly GlossaryGroupDef[] = [
  { key: 'operacoes',         title: 'Operações entre eventos' },
  { key: 'eventos-especiais', title: 'Eventos especiais' },
  { key: 'probabilidade',     title: 'Probabilidade' },
];

/* ───────────────────────────────────────────────────────────────────
   DISCO_GLOSSARY — Glossário do OVA do Disco Aleatório.
   Cobre o que o disco efetivamente ensina:
     • Experimento aleatório vs determinístico
     • Espaço amostral, evento, evento composto
     • Espaços EQUIPROVÁVEIS (E1: setores iguais) e NÃO EQUIPROVÁVEIS
       (E2: por área; E3: por repetição de cores)
     • Probabilidade clássica (Laplace) e probabilidade angular (θ/360°)
     • Eventos mutuamente exclusivos e probabilidade da união ME
     • Evento complementar
     • Frequência absoluta, frequência relativa, Lei dos Grandes Números
       (definição frequentista de probabilidade)
   Todos os exemplos usam o vocabulário do disco — setores, cores,
   ponteiro, giros — para preservar a contextualização que o aluno acabou
   de viver no OVA.
   ─────────────────────────────────────────────────────────────────── */
export const DISCO_GLOSSARY: readonly GlossaryEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // EXPERIMENTO E ESPAÇO AMOSTRAL
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'disco-experimento-aleatorio',
    title: 'Experimento aleatório',
    group: 'experimento',
    groupTitle: 'Experimento e espaço amostral',
    formalDefinition:
      'Um EXPERIMENTO ALEATÓRIO é aquele em que, mesmo repetido nas mesmas condições, NÃO é possível prever com certeza qual será o resultado, embora se conheçam TODOS os resultados possíveis. Opõe-se ao EXPERIMENTO DETERMINÍSTICO, em que o resultado é completamente previsível a partir das condições.',
    naturalDefinition:
      'Você sabe quais cores PODEM sair em um giro do disco — todas as que aparecem nos setores — mas não consegue prever QUAL delas vai sair antes de o ponteiro parar. Esse "não saber qual antes, mas saber as possibilidades" caracteriza o experimento aleatório.',
    exampleContext:
      'Girar o disco aleatório é o experimento. Os resultados possíveis são as cores presentes nos setores. Antes do giro, sabe-se que sairá alguma dessas cores; só após o ponteiro parar é que se conhece o resultado específico.',
    exampleCalculation:
      'Aleatórios: girar o disco do OVA, lançar dado, sortear bola da urna.\nDeterminísticos: aquecer água a 100°C ao nível do mar (sempre ferve), misturar tinta vermelha com tinta vermelha (sempre vermelho), soltar um objeto no vácuo (sempre cai).',
    useCase:
      'Identificar a aleatoriedade é o PRIMEIRO PASSO para aplicar probabilidade. Só faz sentido falar em "chance" de um resultado quando há genuína incerteza sobre o que vai sair.',
    attention:
      'Aleatório NÃO significa caótico ou sem padrão. Aliás, a Lei dos Grandes Números mostra que a frequência relativa de cada cor se ESTABILIZA em torno da probabilidade teórica após muitos giros — é justamente esse padrão estatístico que a probabilidade estuda (BATANERO; SERRANO, 1999, p. 559).',
    reference: 'BATANERO, C.; SERRANO, L. The meaning of randomness for secondary school students. Journal for Research in Mathematics Education, v. 30, n. 5, p. 558-567, 1999.',
  },
  {
    id: 'disco-espaco-amostral',
    title: 'Espaço amostral (S)',
    group: 'experimento',
    groupTitle: 'Experimento e espaço amostral',
    formalDefinition:
      'O ESPAÇO AMOSTRAL S de um experimento aleatório é o conjunto de TODOS os resultados elementares possíveis. Notação alternativa: Ω. A cardinalidade n(S) é o número de elementos do conjunto.',
    naturalDefinition:
      'É a "lista completa" das saídas possíveis ao girar o disco — todas as cores que aparecem em algum setor, listadas sem repetição.',
    exampleContext:
      'Disco da Etapa 1 com 4 setores iguais (vermelho, azul, amarelo, verde): S = {vermelho, azul, amarelo, verde} e n(S) = 4. Em discos com cores repetidas (Etapa 3), você pode descrever S pelas CORES distintas (n(S) menor) ou pelos SETORES numerados (n(S) maior) — a escolha muda a fórmula a usar.',
    exampleCalculation:
      'Disco 6 setores iguais com 6 cores → n(S) = 6 (espaço pelas cores) ou n(S) = 6 (pelos setores numerados).\nDisco 8 setores com cores: {azul, azul, azul, vermelho, vermelho, amarelo, verde, verde} → pelo setor numerado: n(S) = 8; pelas cores distintas: n(S) = 4, mas espaço NÃO é equiprovável (azul tem mais chance).',
    useCase:
      'Identificar S e contar n(S) corretamente é a base de TUDO em probabilidade clássica. A escolha entre descrever S pelos setores (sempre equiprovável quando setores são iguais) ou pelas cores (pode não ser equiprovável) determina qual fórmula aplicar.',
    attention:
      'Erro clássico no disco da Etapa 3: tomar n(S) = nº de cores distintas e aplicar Laplace direto — ignora a repetição de cores e produz probabilidades erradas. Negligência do espaço amostral é o viés mais frequente em probabilidade clássica (NAVARRO-PELAYO et al., 2016, p. 734).',
    reference: 'NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students\' difficulties in solving probability tasks. IJMEST, v. 47, n. 5, p. 732-747, 2016.',
  },
  {
    id: 'disco-evento',
    title: 'Evento',
    group: 'experimento',
    groupTitle: 'Experimento e espaço amostral',
    formalDefinition:
      'Um EVENTO A é qualquer subconjunto do espaço amostral S — formalmente A ⊆ S. Diz-se que "A ocorreu" quando o resultado do experimento pertence a A.',
    naturalDefinition:
      'Um evento agrupa algumas das saídas possíveis sob uma condição comum. Pode ser uma única cor (evento elementar) ou um grupo de cores (evento composto).',
    exampleContext:
      'No disco com 4 cores (vermelho, azul, amarelo, verde): o evento A = "sair vermelho" tem 1 resultado favorável (n(A) = 1); o evento B = "sair uma cor quente" pode reunir vermelho e amarelo (n(B) = 2). Ambos são subconjuntos de S = {vermelho, azul, amarelo, verde}.',
    exampleCalculation:
      'Disco 6 setores iguais (V, Az, Am, Vd, Lr, Rs):\n  • Evento "sair vermelho" → A = {vermelho} → n(A) = 1\n  • Evento "sair cor quente" → B = {vermelho, amarelo, laranja} → n(B) = 3\n  • Evento "sair cor primária" → C = {vermelho, azul, amarelo} → n(C) = 3',
    useCase:
      'Identificar o que é o EVENTO — qual subconjunto de S ele descreve — é o passo entre ler o enunciado em palavras e aplicar a fórmula P(A) = n(A)/n(S).',
    attention:
      'Não confunda o EVENTO (subconjunto), a CARDINALIDADE n(A) (número) e a PROBABILIDADE P(A) (razão). São três coisas relacionadas mas diferentes; misturá-las é fonte recorrente de erro (BATANERO; DIAZ, 2007, p. 121).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'disco-evento-composto',
    title: 'Evento composto',
    group: 'experimento',
    groupTitle: 'Experimento e espaço amostral',
    formalDefinition:
      'Um EVENTO COMPOSTO é um evento formado por DOIS ou mais resultados elementares (|A| ≥ 2). Opõe-se ao EVENTO ELEMENTAR ou SIMPLES, que reúne UM único resultado.',
    naturalDefinition:
      'Em vez de perguntar "sair vermelho?" (evento simples), pergunta-se "sair vermelho OU azul?" — junta duas cores em um único evento. No disco, isso é frequente: "sair uma cor primária", "sair cor quente", "sair cor diferente de verde" são exemplos de eventos compostos.',
    exampleContext:
      'Disco 6 setores iguais (vermelho, azul, amarelo, verde, laranja, rosa). Evento composto E = "sair cor primária" = {vermelho, azul, amarelo} → n(E) = 3. P(E) = 3/6 = 1/2.',
    exampleCalculation:
      'Disco 4 cores equiprováveis (V, Az, Am, Vd):\n  • E1 = "sair vermelho ou azul" → n(E1) = 2 → P(E1) = 2/4 = 1/2\n  • E2 = "sair qualquer cor" (evento certo) → n(E2) = 4 → P(E2) = 1\n  • E3 = "sair preto" (evento impossível) → n(E3) = 0 → P(E3) = 0',
    useCase:
      'A maioria dos problemas práticos envolve eventos compostos — raramente perguntamos sobre UM resultado isolado. Saber identificar quais resultados elementares formam o evento composto é o passo central para calcular n(E).',
    attention:
      'Distinto de "eventos compostos via operações" (∪, ∩). O composto refere-se a TER VÁRIOS RESULTADOS no mesmo evento; as operações combinam DOIS OU MAIS eventos diferentes.',
    reference: 'BATANERO, C.; GODINO, J. D. Análisis de datos y su didáctica. Granada: Universidad de Granada, 2002.',
  },
  // ═══════════════════════════════════════════════════════════════════
  // ESPAÇOS EQUIPROVÁVEIS E NÃO EQUIPROVÁVEIS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'disco-equiprovavel',
    title: 'Espaço amostral equiprovável',
    group: 'espacos',
    groupTitle: 'Tipos de espaço amostral',
    formalDefinition:
      'Um espaço amostral S é EQUIPROVÁVEL quando TODOS os resultados elementares têm a MESMA probabilidade de ocorrer. Nesse caso vale a fórmula de Laplace: P(A) = n(A)/n(S) para qualquer evento A ⊆ S.',
    naturalDefinition:
      'No disco, é o caso em que TODOS os setores têm o MESMO TAMANHO e CADA cor aparece em UM ÚNICO setor — assim, todas as cores têm a mesma chance de sair em um giro.',
    exampleContext:
      'Etapa 1 do OVA: disco com setores de mesmo ângulo central (ex.: 4 setores de 90° cada). Cada cor tem probabilidade 1/4. Em um disco de 6 setores iguais, cada cor tem 1/6.',
    exampleCalculation:
      'Disco 4 setores iguais (V, Az, Am, Vd):\n  • P(V) = 1/4\n  • P(Az) = 1/4\n  • P("V ou Am") = n(E)/n(S) = 2/4 = 1/2',
    useCase:
      'Sempre que o disco tem setores iguais com cores únicas (Etapa 1), usa-se Laplace direto: conta quantos setores são favoráveis ao evento, divide pelo total. Mesma lógica para dados não viciados, moedas, baralhos.',
    attention:
      'CONFIRME que o espaço é equiprovável ANTES de aplicar a fórmula. Se os setores tiverem tamanhos diferentes (Etapa 2) ou cores se repetirem em vários setores (Etapa 3), Laplace direto leva a respostas erradas.',
    reference: 'NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students\' difficulties in solving probability tasks. IJMEST, v. 47, n. 5, p. 732-747, 2016.',
  },
  {
    id: 'disco-nao-equiprovavel',
    title: 'Espaço amostral NÃO equiprovável',
    group: 'espacos',
    groupTitle: 'Tipos de espaço amostral',
    formalDefinition:
      'Quando os resultados elementares de S NÃO têm a mesma probabilidade, o espaço é dito NÃO EQUIPROVÁVEL. A fórmula de Laplace P(A) = n(A)/n(S) NÃO se aplica diretamente — é preciso somar a probabilidade individual de cada resultado favorável: P(A) = Σ P(xᵢ) para xᵢ ∈ A.',
    naturalDefinition:
      'Algumas saídas têm mais chance do que outras. No disco, isso acontece em DUAS situações: (1) setores com tamanhos DIFERENTES (Etapa 2) — o maior setor tem mais chance; (2) uma mesma cor aparece em VÁRIOS setores (Etapa 3) — essa cor tem mais chance.',
    exampleContext:
      'Etapa 2: setores com ângulos centrais 120°, 90°, 90°, 60° → as 4 cores NÃO têm a mesma chance. Use a probabilidade angular: P(setor) = θ/360°.\nEtapa 3: 8 setores iguais com cores {azul, azul, azul, vermelho, vermelho, amarelo, verde, verde} → P(azul) = 3/8, P(vermelho) = 2/8, etc.',
    exampleCalculation:
      'Etapa 2 (setores desiguais):\n  • P(setor 120°) = 120/360 = 1/3\n  • P(setor 60°) = 60/360 = 1/6\nEtapa 3 (cores repetidas em 8 setores iguais):\n  • P(azul) = nº de setores azuis / 8 = 3/8',
    useCase:
      'Reconhecer a NÃO-equiprobabilidade evita erros graves. Use a probabilidade angular (Etapa 2) ou a contagem pelo NÚMERO de setores favoráveis sobre o total de setores (Etapa 3).',
    attention:
      'Aplicar Laplace pelas CORES distintas em espaços não equiprováveis é o viés de equiprobabilidade — assumir igualdade onde não há (LECOUTRE, 1992, p. 564). Pergunte sempre: "todos os elementos do meu denominador têm a mesma chance?"',
    reference: 'LECOUTRE, M. P. Cognitive models and problem spaces in "purely random" situations. Educational Studies in Mathematics, v. 23, n. 6, p. 557-568, 1992.',
  },
  // ═══════════════════════════════════════════════════════════════════
  // PROBABILIDADE — clássica e angular
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'disco-prob-classica',
    title: 'Definição clássica (Laplace): P(A) = n(A)/n(S)',
    group: 'probabilidade',
    groupTitle: 'Probabilidade',
    formalDefinition:
      'Em um espaço amostral S finito e equiprovável, a probabilidade de um evento A ⊆ S é P(A) = n(A)/n(S), onde n(A) é o número de casos favoráveis ao evento e n(S) é o número total de resultados possíveis.',
    naturalDefinition:
      'Quando todas as saídas têm a mesma chance, a probabilidade de um evento é a razão entre quantos setores favorecem o evento e quantos setores existem no total.',
    exampleContext:
      'Disco 6 setores iguais com cores distintas. Evento E = "sair cor primária" = {vermelho, azul, amarelo}. n(E) = 3, n(S) = 6.',
    exampleCalculation:
      'P(E) = n(E)/n(S) = 3/6 = 1/2 = 0,5 = 50%.\nEvento "sair vermelho" → P = 1/6 ≈ 0,167 ≈ 16,7%.',
    useCase:
      'Fórmula base para todo problema de probabilidade clássica — discos com setores iguais, dados, moedas, baralhos. Sempre que houver simetria garantindo equiprobabilidade.',
    attention:
      'Só vale quando o espaço amostral é EQUIPROVÁVEL. Em discos com setores desiguais (Etapa 2), use a probabilidade angular; em discos com cores repetidas (Etapa 3), use n(setores favoráveis)/n(setores totais), não nº de cores distintas.',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'disco-prob-angular',
    title: 'Probabilidade angular: P(setor) = θ/360°',
    group: 'probabilidade',
    groupTitle: 'Probabilidade',
    formalDefinition:
      'Em um disco cujo ponteiro gira aleatoriamente, a probabilidade de o ponteiro parar em um setor é proporcional ao seu ÂNGULO CENTRAL: P(setor) = θ/360°, onde θ é o ângulo em graus. Para uma cor que ocupa vários setores: P(cor) = (soma dos ângulos dos setores dessa cor) / 360°.',
    naturalDefinition:
      'Quando os setores têm tamanhos diferentes, a chance de cada cor é proporcional ao "pedaço de pizza" que ela ocupa no disco. Setor que cobre metade do disco → P = 1/2. Setor que cobre 1/4 → P = 1/4.',
    exampleContext:
      'Etapa 2 com 4 cores e ângulos 120° (V), 90° (Az), 90° (Am), 60° (Vd):\n  P(V) = 120/360 = 1/3\n  P(Az) = 90/360 = 1/4\n  P(Am) = 90/360 = 1/4\n  P(Vd) = 60/360 = 1/6\nSoma: 1/3 + 1/4 + 1/4 + 1/6 = 1 ✓',
    exampleCalculation:
      'Setor de 90° (1/4 do disco) → P = 90/360 = 1/4.\nDois setores de 45° da mesma cor → P(cor) = (45 + 45)/360 = 90/360 = 1/4.\nSetor de 60° → P = 60/360 = 1/6.',
    useCase:
      'É a única fórmula correta para o disco quando os setores não são iguais. Substitui a contagem n(A)/n(S), que só vale para setores equiprováveis.',
    attention:
      'NÃO use "nº de cores favoráveis / nº de cores totais" em discos com setores desiguais — ignora o tamanho. O número de setores NÃO importa para a probabilidade angular; só o ÂNGULO TOTAL ocupado pela cor.',
    reference: 'LOPES, C. E. O ensino da estatística e da probabilidade. Educação Matemática em Revista, n. 11, p. 47-57, 2002.',
  },
  // ═══════════════════════════════════════════════════════════════════
  // OPERAÇÕES E EVENTOS ESPECIAIS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'disco-eventos-me',
    title: 'Eventos mutuamente exclusivos',
    group: 'operacoes',
    groupTitle: 'Operações e eventos especiais',
    formalDefinition:
      'Dois eventos A e B são MUTUAMENTE EXCLUSIVOS (ou DISJUNTOS) quando A ∩ B = ∅ — não existe nenhum resultado elementar que pertença a ambos. Consequência: a ocorrência de A IMPEDE a ocorrência de B na mesma execução do experimento.',
    naturalDefinition:
      'São eventos que NUNCA acontecem ao mesmo tempo. Em um único giro do disco, se o ponteiro parou em um setor vermelho, não pode ter parado num setor azul — "vermelho" e "azul" são ME.',
    exampleContext:
      'Disco 6 cores distintas: A = "sair vermelho" e B = "sair azul" são mutuamente exclusivos (apenas uma cor sai por giro).\nDisco Etapa 3 (cores repetidas em setores): A = "sair em um setor azul" e B = "sair em um setor vermelho" continuam ME — mesmo com várias ocorrências de cada cor, o ponteiro para em UM setor por giro.',
    exampleCalculation:
      'A = {vermelho}, B = {azul}, no disco 6 cores: A ∩ B = ∅ → MUTUAMENTE EXCLUSIVOS.\nA = "sair cor primária" = {V, Az, Am}, B = "sair cor secundária" = {Lr, Vd, Rs}: A ∩ B = ∅ → ME (em discos onde uma cor não é simultaneamente primária e secundária).',
    useCase:
      'Saber identificar ME determina qual fórmula da união usar:\n  • ME: P(A ∪ B) = P(A) + P(B)\n  • Não ME: P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',
    attention:
      'NÃO confunda mutuamente exclusivos com INDEPENDENTES. ME = "não podem ocorrer juntos"; independentes = "a ocorrência de um não altera a chance do outro". Esta confusão persiste mesmo em alunos avançados (BATANERO; DIAZ, 2007, p. 138).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'disco-uniao-me',
    title: 'Probabilidade da União de eventos ME',
    group: 'operacoes',
    groupTitle: 'Operações e eventos especiais',
    formalDefinition:
      'Se A e B são MUTUAMENTE EXCLUSIVOS (A ∩ B = ∅), então P(A ∪ B) = P(A) + P(B). Generalização para n eventos ME dois a dois: P(A₁ ∪ … ∪ Aₙ) = P(A₁) + … + P(Aₙ).',
    naturalDefinition:
      'Quando os eventos NÃO podem acontecer simultaneamente, a chance da união é a SOMA simples das chances individuais — sem subtrair nada, porque a interseção é vazia.',
    exampleContext:
      'Disco 6 setores iguais (V, Az, Am, Vd, Lr, Rs):\n  P("sair vermelho ou azul") = P(V) + P(Az) = 1/6 + 1/6 = 2/6 = 1/3.\nDisco Etapa 2 (ângulos 120°, 90°, 90°, 60°):\n  P("sair V ou Vd") = 120/360 + 60/360 = 180/360 = 1/2.',
    exampleCalculation:
      'Disco 4 cores equiprováveis:\n  P("V ou Az ou Am") = 1/4 + 1/4 + 1/4 = 3/4.\nA soma das probabilidades de TODAS as cores deve dar 1 (evento certo).',
    useCase:
      'É a versão simplificada da fórmula geral da união, válida só quando há mútua exclusão. No disco isso ocorre quase sempre (cada giro para em um único setor).',
    attention:
      'NÃO use esta fórmula sem CONFIRMAR que A ∩ B = ∅. Aplicar P(A∪B) = P(A) + P(B) em eventos NÃO disjuntos SUPERESTIMA o resultado e pode dar valores acima de 1 (matematicamente impossível para probabilidade).',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'disco-complementar',
    title: 'Evento complementar (Ā)',
    group: 'operacoes',
    groupTitle: 'Operações e eventos especiais',
    formalDefinition:
      'O COMPLEMENTAR de A é Ā = S − A = { x ∈ S | x ∉ A } — todos os resultados de S que NÃO pertencem a A. Vale sempre P(A) + P(Ā) = 1, logo P(A) = 1 − P(Ā).',
    naturalDefinition:
      'Ā é "o evento de A NÃO ocorrer". No disco, se A = "sair vermelho", então Ā = "sair QUALQUER cor diferente de vermelho".',
    exampleContext:
      'Disco 6 cores distintas (V, Az, Am, Vd, Lr, Rs):\n  Se A = "sair vermelho", então Ā = "sair Az, Am, Vd, Lr ou Rs".\n  P(A) = 1/6 → P(Ā) = 1 − 1/6 = 5/6.\nDisco Etapa 2 (ângulos 120°, 90°, 90°, 60°): se A = "sair setor 120°", P(A) = 1/3, P(Ā) = 1 − 1/3 = 2/3.',
    exampleCalculation:
      'Verificação: P(A) + P(Ā) = 1/6 + 5/6 = 1 ✓.',
    useCase:
      'Quando calcular P(A) é difícil mas P(Ā) é fácil, use a fórmula do complementar. Especialmente útil em problemas com "PELO MENOS uma cor X" — o complementar é "NENHUMA cor X", muito mais fácil de contar.',
    attention:
      'Estudantes tendem a calcular sempre direto, mesmo quando o complementar simplifica drasticamente o problema (BATANERO; DIAZ, 2007, p. 127). Antes de iniciar o cálculo, pergunte: "é mais fácil contar o que ocorre OU o que NÃO ocorre?"',
    reference: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  // ═══════════════════════════════════════════════════════════════════
  // FREQUÊNCIA E LEI DOS GRANDES NÚMEROS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'disco-frequencia-absoluta',
    title: 'Frequência absoluta',
    group: 'frequencia',
    groupTitle: 'Frequência e Lei dos Grandes Números',
    formalDefinition:
      'A FREQUÊNCIA ABSOLUTA de um resultado x em n repetições de um experimento aleatório é o NÚMERO de vezes em que x ocorreu. Notação: f(x). É um número natural entre 0 e n.',
    naturalDefinition:
      'É a CONTAGEM bruta: "quantas vezes essa cor saiu?". Sem dividir, sem comparar — só o número de ocorrências.',
    exampleContext:
      'Disco 4 cores iguais, 20 giros, resultados: vermelho 5×, azul 4×, amarelo 7×, verde 4×. As frequências absolutas são 5, 4, 7 e 4.',
    exampleCalculation:
      '100 giros do disco 4 cores: V 23×, Az 28×, Am 25×, Vd 24×.\nFrequências absolutas: f(V) = 23, f(Az) = 28, f(Am) = 25, f(Vd) = 24.\nSoma das frequências = total de giros: 23 + 28 + 25 + 24 = 100 ✓',
    useCase:
      'Ponto de partida para calcular a FREQUÊNCIA RELATIVA, que por sua vez se aproxima da probabilidade teórica (Lei dos Grandes Números).',
    attention:
      'A frequência absoluta isolada NÃO permite comparar entre experimentos com tamanhos diferentes. "Vermelho saiu 5 vezes" significa coisas muito diferentes em 20 giros vs 100 giros.',
    reference: 'BUSSAB, W. O.; MORETTIN, P. A. Estatística básica. 9. ed. São Paulo: Saraiva, 2017.',
  },
  {
    id: 'disco-frequencia-relativa',
    title: 'Frequência relativa',
    group: 'frequencia',
    groupTitle: 'Frequência e Lei dos Grandes Números',
    formalDefinition:
      'A FREQUÊNCIA RELATIVA de x em n repetições é fr(x) = f(x)/n. É um número em [0, 1] que mede a PROPORÇÃO de ocorrências de x no total de tentativas. Pode ser expressa em porcentagem (×100).',
    naturalDefinition:
      'É a frequência absoluta DIVIDIDA pelo número total de giros. Diz "que fração das vezes essa cor saiu". Permite comparar experimentos com tamanhos diferentes.',
    exampleContext:
      'Disco 4 cores iguais, 100 giros: V 23×, Az 28×, Am 25×, Vd 24×.\nFrequências relativas: fr(V) = 0,23 = 23%; fr(Az) = 0,28; fr(Am) = 0,25; fr(Vd) = 0,24.\nObserve: cada cor tem probabilidade TEÓRICA 1/4 = 0,25. As frequências OBSERVADAS oscilam em torno desse valor.',
    exampleCalculation:
      'Soma das frequências relativas é sempre 1 (ou 100%): 0,23 + 0,28 + 0,25 + 0,24 = 1,00 ✓.',
    useCase:
      'É a base EMPÍRICA da probabilidade: se n é grande, fr(x) ≈ P(x) (Lei dos Grandes Números). Quando não se conhece a probabilidade teórica, a fr observada estima a probabilidade real.',
    attention:
      'Frequência relativa NÃO é probabilidade — é um valor empírico que se aproxima da probabilidade quando n cresce. Tratar fr(x) como se fosse P(x) com poucos dados gera estimativas instáveis e conclusões erradas (GARFIELD; BEN-ZVI, 2014, p. 130).',
    reference: 'GARFIELD, J.; BEN-ZVI, D. Developing students\' statistical reasoning. Dordrecht: Springer, 2014.',
  },
  {
    id: 'disco-lei-grandes-numeros',
    title: 'Lei dos Grandes Números (LGN)',
    group: 'frequencia',
    groupTitle: 'Frequência e Lei dos Grandes Números',
    formalDefinition:
      'A LEI DOS GRANDES NÚMEROS (versão fraca, Bernoulli) afirma que, ao repetir indefinidamente um experimento aleatório, a frequência relativa de cada resultado CONVERGE EM PROBABILIDADE para a probabilidade teórica. Formalmente: para todo ε > 0, P(|fr(x) − P(x)| > ε) → 0 quando n → ∞.',
    naturalDefinition:
      'Quanto mais vezes você gira o disco, mais a frequência relativa de cada cor se APROXIMA da sua probabilidade teórica. Por isso experimentos longos revelam a probabilidade "verdadeira" que os curtos só sugerem.',
    exampleContext:
      'Disco 4 setores iguais (P teórica de cada cor = 1/4 = 0,25):\n  • 10 giros: fr pode variar de 0,1 a 0,4 (muita oscilação)\n  • 100 giros: fr fica em [0,18; 0,32]\n  • 1 000 giros: fr fica em [0,23; 0,27]\n  • 10 000 giros: fr ≈ 0,25 (≈ P teórica)',
    exampleCalculation:
      'Disco 6 setores iguais, P(cor) = 1/6 ≈ 0,167:\n  •  10 giros: fr varia muito (0 a 0,5)\n  • 1000 giros: fr ≈ 0,165 (já estabilizou)\n  • 10000 giros: fr ≈ 0,167 (≈ P teórica)',
    useCase:
      'Fundamenta a definição FREQUENTISTA de probabilidade: P(x) é o limite da frequência relativa quando n → ∞. Justifica o uso de simulações e contagens experimentais como estimativas da probabilidade real.',
    attention:
      'A LGN fala de comportamento MÉDIO em LONGO PRAZO, não prevê resultados individuais. Acreditar que "depois de 5 vermelhos seguidos, o próximo TEM que ser azul" é a FALÁCIA DO JOGADOR (KAHNEMAN; TVERSKY, 1972, p. 432) — cada giro é INDEPENDENTE, com mesma probabilidade, independente do histórico.',
    reference: 'KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. Cognitive Psychology, v. 3, n. 3, p. 430-454, 1972.',
  },
];

/* Grupos do glossário do OVA do Disco — ordem visual no StudyMenu. */
export const DISCO_GROUPS: readonly GlossaryGroupDef[] = [
  { key: 'experimento', title: 'Experimento e espaço amostral' },
  { key: 'espacos',     title: 'Tipos de espaço amostral' },
  { key: 'probabilidade', title: 'Probabilidade' },
  { key: 'operacoes',   title: 'Operações e eventos especiais' },
  { key: 'frequencia',  title: 'Frequência e Lei dos Grandes Números' },
];
/* ═══════════════════════════════════════════════════════════════════
   Mapeamento step-do-erro → verbetes sugeridos
   Princípio da relevância contextual (MAYER, 2014, p. 280):
   o feedback após erro deve apontar exatamente o que estudar.
   ═══════════════════════════════════════════════════════════════════ */

export type Ex6StepKind = 'mark-A' | 'mark-B' | 'mark-D' | 'identify-operation' | 'compute-probability';

/* ───────────────────────────────────────────────────────────────────
   Ex8AdvancedStepKind — superconjunto de Ex6StepKind, usado pelo Ex8
   (Fixação avançada). Inclui o step 'compute-probability-and-complementary'
   que aparece nos dois desafios simples do Ex8 (P(A) + P(Ā)). Os verbetes
   sugeridos e a mensagem usam os mesmos princípios pedagógicos (relevância
   contextual — MAYER, 2014, p. 280) com inserção do verbete "complementar".
   Ex8 também opera com Operation ∈ { Union, Intersection, Difference,
   ReverseDifference } — tipo `AdvancedOperation` cobre as quatro.
   ─────────────────────────────────────────────────────────────────── */

export type Ex8AdvancedStepKind = Ex6StepKind | 'compute-probability-and-complementary';
export type AdvancedOperation = 'Union' | 'Intersection' | 'Difference' | 'ReverseDifference';

export function getSuggestedEntries(
  step: Ex6StepKind,
  operation: 'Union' | 'Intersection',
): readonly GlossaryEntryId[] {
  switch (step) {
    case 'mark-A':
    case 'mark-B':
      return ['equiprovavel'];
    case 'mark-D':
      return operation === 'Union' ? ['uniao'] : ['intersecao'];
    case 'identify-operation':
      return operation === 'Union'
        ? ['uniao', 'diferenca']
        : ['intersecao', 'diferenca'];
    case 'compute-probability':
      return operation === 'Union'
        ? ['equiprovavel', 'cardinalidade-uniao', 'probabilidade-uniao']
        : ['equiprovavel', 'intersecao'];
  }
}

export function getFeedbackMessage(
  step: Ex6StepKind,
  operation: 'Union' | 'Intersection',
): string {
  switch (step) {
    case 'mark-A':
      return 'Releia a definição do Evento A no Quadro de Eventos. Para cada par (verde, azul) da tabela 6×6, pergunte: o predicado de A é verdadeiro? Marque apenas onde for. O Evento B só aparecerá depois que A estiver correto. Clique no botão Ajuda e estude o verbete "Probabilidade em espaço amostral equiprovável".';
    case 'mark-B':
      return 'O Evento A já está congelado em azul nas células corretas — use como referência. Agora foque apenas no Evento B: releia sua definição no Quadro de Eventos e marque as células onde o predicado de B é verdadeiro. Clique no botão Ajuda se precisar revisar.';
    case 'mark-D':
      return operation === 'Union'
        ? 'A operação é UNIÃO (∪): marque as células que pertencem a A OU a B (ou às duas). Clique no botão Ajuda e estude o verbete "União".'
        : 'A operação é INTERSEÇÃO (∩): marque apenas as células que pertencem a A E a B simultaneamente. Clique no botão Ajuda e estude o verbete "Interseção".';
    case 'identify-operation':
      return 'Identifique a operação observando como D se relaciona com A e B. Clique no botão Ajuda e estude os verbetes sobre operações entre eventos.';
    case 'compute-probability':
      return 'P(D) = n(D) / n(S), onde S é o espaço amostral. Conte as células marcadas em D e divida pelo total de pares do espaço amostral (S tem 36 pares). Frações equivalentes são aceitas (ex.: 11/18 = 22/36). Clique no botão Ajuda e estude os verbetes sobre operações com eventos e cálculo de probabilidade.';
  }
}

/* ───────────────────────────────────────────────────────────────────
   getSuggestedEntriesAdvanced — versão para o Ex8 (Fixação avançada).
   Cobre as quatro operações (Union, Intersection, Difference,
   ReverseDifference) e o step extra compute-probability-and-complementary.
   Quando a operação é Difference ou ReverseDifference, o verbete sugerido
   inclui "diferenca". Quando o step é compute-probability-and-complementary
   (apenas nos desafios simples do Ex8), sugere "complementar" + "equiprovavel".
   ─────────────────────────────────────────────────────────────────── */

export function getSuggestedEntriesAdvanced(
  step: Ex8AdvancedStepKind,
  operation: AdvancedOperation,
): readonly GlossaryEntryId[] {
  if (step === 'compute-probability-and-complementary') {
    return ['equiprovavel', 'complementar'];
  }
  switch (step) {
    case 'mark-A':
    case 'mark-B':
      return ['equiprovavel'];
    case 'mark-D':
      switch (operation) {
        case 'Union':              return ['uniao'];
        case 'Intersection':       return ['intersecao'];
        case 'Difference':
        case 'ReverseDifference':  return ['diferenca', 'intersecao'];
      }
    case 'identify-operation':
      switch (operation) {
        case 'Union':              return ['uniao', 'diferenca'];
        case 'Intersection':       return ['intersecao', 'diferenca'];
        case 'Difference':
        case 'ReverseDifference':  return ['diferenca', 'intersecao', 'complementar'];
      }
    case 'compute-probability':
      switch (operation) {
        case 'Union':              return ['equiprovavel', 'cardinalidade-uniao', 'probabilidade-uniao'];
        case 'Intersection':       return ['equiprovavel', 'intersecao'];
        case 'Difference':
        case 'ReverseDifference':  return ['equiprovavel', 'diferenca', 'complementar'];
      }
  }
}

export function getFeedbackMessageAdvanced(
  step: Ex8AdvancedStepKind,
  operation: AdvancedOperation,
): string {
  if (step === 'compute-probability-and-complementary') {
    return 'Calcule P(A) = n(A)/n(S) e P(Ā) = 1 − P(A) = (n(S) − n(A))/n(S). Use n(S) = 36 (espaço amostral). Frações equivalentes são aceitas. Clique em Ajuda e estude "Evento Complementar" e "Probabilidade em espaço amostral equiprovável".';
  }
  switch (step) {
    case 'mark-A':
      return 'Releia a definição do Evento A no Quadro de Eventos. Para cada par (verde, azul) da tabela 6×6, pergunte: o predicado de A é verdadeiro? Marque apenas onde for. O Evento B só aparecerá depois que A estiver correto. Clique no botão Ajuda.';
    case 'mark-B':
      return 'O Evento A já está congelado em azul nas células corretas — use como referência. Agora foque apenas no Evento B: releia sua definição no Quadro de Eventos e marque as células onde o predicado de B é verdadeiro.';
    case 'mark-D':
      switch (operation) {
        case 'Union':
          return 'A operação é UNIÃO (∪): marque as células que pertencem a A OU a B (ou às duas). Clique em Ajuda e estude "União".';
        case 'Intersection':
          return 'A operação é INTERSEÇÃO (∩): marque apenas as células que pertencem a A E a B simultaneamente. Clique em Ajuda e estude "Interseção".';
        case 'Difference':
          return 'A operação é DIFERENÇA (A − B): marque as células que pertencem a A MAS NÃO a B. Equivalente a A ∩ B̄. Clique em Ajuda e estude "Diferença".';
        case 'ReverseDifference':
          return 'A operação é DIFERENÇA INVERSA (B − A): marque as células que pertencem a B MAS NÃO a A. Equivalente a B ∩ Ā. Clique em Ajuda e estude "Diferença".';
      }
    case 'identify-operation':
      return 'Identifique a operação observando como D se relaciona com A e B. Clique em Ajuda e estude os verbetes sobre operações entre eventos.';
    case 'compute-probability':
      return 'P(D) = n(D) / n(S), onde S é o espaço amostral (n(S) = 36). Conte as células marcadas em D e divida por 36. Frações equivalentes são aceitas (ex.: 11/18 = 22/36). Clique em Ajuda para revisar a fórmula adequada à operação.';
  }
}
