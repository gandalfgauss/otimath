/* ═══════════════════════════════════════════════════════════════════
   studyMenuContent.ts — Conteúdo dos 7 verbetes do Menu de Revisão (Ex6)

   Cada verbete segue anatomia uniforme (consistência — NIELSEN, 1994):
     • Definição formal (símbolos + linguagem natural)
     • Exemplo no contexto do OVA (eventos sobre par verde×azul)
     • Para que serve
     • Atenção (viés cognitivo mapeado pela literatura científica)

   Mapeamento conceito ↔ viés ↔ literatura
     1 União           V6.1 — "ou" exclusivo (Batanero & Diaz, 2007)
     2 Interseção      V6.2 — ambiguidade "e" (Batanero & Diaz, 2007)
     3 Diferença       V10.1 — exclusão vs independência (Batanero & Diaz, 2007)
     4 Complementar    V5.1 — preferência pelo direto (Batanero & Diaz, 2007)
     5 Equiprovável    V3.4 — negligência do espaço amostral (Navarro-Pelayo et al., 2016)
     6 Cardinalidade   V7.1 — heurística aditiva (Kahneman & Tversky, 1972)
     7 Prob. da união  V7.2 — generalização da exclusão (Batanero & Diaz, 2007)
   ═══════════════════════════════════════════════════════════════════ */

export type VerbeteId =
  | 'uniao'
  | 'intersecao'
  | 'diferenca'
  | 'complementar'
  | 'equiprovavel'
  | 'cardinalidade-uniao'
  | 'probabilidade-uniao';

export interface Verbete {
  readonly id: VerbeteId;
  readonly titulo: string;
  readonly grupo: 'operacoes' | 'eventos-especiais' | 'probabilidade';
  readonly grupoTitulo: string;
  readonly definicaoFormal: string;
  readonly definicaoNatural: string;
  readonly exemploContexto: string;
  readonly exemploCalculo: string;
  readonly paraQueServe: string;
  readonly atencao: string;
  readonly referencia: string;
}

export const VERBETES: readonly Verbete[] = [
  {
    id: 'uniao',
    titulo: 'União (A ∪ B)',
    grupo: 'operacoes',
    grupoTitulo: 'Operações entre eventos',
    definicaoFormal:
      'A ∪ B = { x ∈ S | x ∈ A ou x ∈ B } — conjunto dos resultados que pertencem a A, a B, ou a ambos.',
    definicaoNatural:
      'A união reúne em um único evento TODOS os resultados que satisfazem o evento A OU o evento B (ou ambos). Aqui, "ou" é INCLUSIVO — quem está nos dois também conta.',
    exemploContexto:
      'Considere A = "Soma maior que 8" e B = "Face par no dado verde" no lançamento de dois dados (verde × azul). O evento A ∪ B contém todos os pares ordenados (g, b) em que a soma é maior que 8 OU o dado verde mostra face par (ou as duas coisas).',
    exemploCalculo:
      'n(A) = 10; n(B) = 18; n(A ∩ B) = 6 (pares que satisfazem AS DUAS condições). Logo n(A ∪ B) = 10 + 18 − 6 = 22 pares ordenados em 36 possíveis.',
    paraQueServe:
      'Quando o problema pergunta "qual a probabilidade de OCORRER A OU B?", você precisa do evento A ∪ B. É a operação que aparece em quase todo problema de probabilidade que envolve duas condições alternativas.',
    atencao:
      'Em linguagem cotidiana, "ou" às vezes significa "uma OU outra, mas não as duas" (ou exclusivo). Em Matemática, A ∪ B é SEMPRE inclusivo — quem está em A ∩ B também está em A ∪ B. Confundir isso é o viés mais comum (BATANERO; DIAZ, 2007, p. 123).',
    referencia: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'intersecao',
    titulo: 'Interseção (A ∩ B)',
    grupo: 'operacoes',
    grupoTitulo: 'Operações entre eventos',
    definicaoFormal:
      'A ∩ B = { x ∈ S | x ∈ A e x ∈ B } — conjunto dos resultados que pertencem SIMULTANEAMENTE a A e a B.',
    definicaoNatural:
      'A interseção reúne apenas os resultados que satisfazem AO MESMO TEMPO o evento A E o evento B. Quem está em só um dos dois fica de fora.',
    exemploContexto:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde", o evento A ∩ B contém os pares (g, b) em que a soma é maior que 8 E o dado verde é par. Por exemplo, (4, 5): soma = 9 > 8 ✓ e verde = 4 é par ✓. Já (3, 6): soma = 9 > 8 ✓ mas verde = 3 não é par ✗ — fica de fora.',
    exemploCalculo:
      'Os pares (g, b) com soma > 8 E verde par são: (4,5), (4,6), (6,3), (6,4), (6,5), (6,6) — total n(A ∩ B) = 6 em 36 possíveis. P(A ∩ B) = 6/36 = 1/6.',
    paraQueServe:
      'Quando o problema pergunta "qual a probabilidade de OCORRER A E B AO MESMO TEMPO?", você precisa do evento A ∩ B. Também aparece como termo dentro da fórmula da união: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
    atencao:
      'Não confunda "e" da linguagem comum com o "e" matemático. Para estar em A ∩ B, é PRECISO satisfazer as DUAS condições — basta uma falhar e o resultado fica fora. Ambiguidade na palavra "e" é fonte recorrente de erro (BATANERO; DIAZ, 2007, p. 123).',
    referencia: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'diferenca',
    titulo: 'Diferença (A − B)',
    grupo: 'operacoes',
    grupoTitulo: 'Operações entre eventos',
    definicaoFormal:
      'A − B = { x ∈ S | x ∈ A e x ∉ B } = A ∩ B̄ — conjunto dos resultados que pertencem a A MAS NÃO a B (S é o espaço amostral).',
    definicaoNatural:
      'A diferença A − B pega tudo o que está em A e REMOVE o que também esteja em B. É equivalente a "A interseção com o complementar de B".',
    exemploContexto:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde", o evento A − B contém os pares com soma > 8 EXCETO aqueles em que o verde é par. Por exemplo, (3,6) tem soma = 9 > 8 e verde = 3 (ímpar) → está em A − B. Já (4,5) tem soma = 9 > 8 mas verde = 4 (par) → fica fora.',
    exemploCalculo:
      'n(A) = 10; n(A ∩ B) = 6. Logo n(A − B) = n(A) − n(A ∩ B) = 10 − 6 = 4 pares: (3,6), (5,4), (5,5), (5,6). P(A − B) = 4/36 = 1/9.',
    paraQueServe:
      'Útil quando o problema pede "ocorre A mas NÃO ocorre B". Também aparece quando uma operação de interseção pode ser reescrita como diferença com complementar: A ∩ B = A − B̄.',
    atencao:
      'A − B NÃO é o mesmo que B − A (a operação não é comutativa). Verifique sempre qual conjunto é o "principal" (de onde se remove) e qual é o "subtraído" (BATANERO; DIAZ, 2007, p. 126).',
    referencia: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'complementar',
    titulo: 'Evento Complementar (Ā)',
    grupo: 'eventos-especiais',
    grupoTitulo: 'Eventos especiais',
    definicaoFormal:
      'Ā = { x ∈ S | x ∉ A } = S − A — conjunto dos resultados do espaço amostral S que NÃO pertencem a A. Vale P(A) + P(Ā) = 1.',
    definicaoNatural:
      'O complementar de A é tudo o que está no espaço amostral S menos o que está em A. Em palavras: "o evento de A NÃO ocorrer".',
    exemploContexto:
      'Se A = "Soma maior que 8", então Ā = "Soma menor ou igual a 8". A cobre 10 dos 36 pares; Ā cobre os outros 26. Note que A ∪ Ā = S e A ∩ Ā = ∅.',
    exemploCalculo:
      'P(A) = 10/36 = 5/18. P(Ā) = 1 − 5/18 = 13/18 = 26/36. Verificação: 10 + 26 = 36 ✓.',
    paraQueServe:
      'Quando calcular P(A) é difícil mas P(Ā) é fácil, use P(A) = 1 − P(Ā). Especialmente útil em problemas com "pelo menos um(a)" — o complementar costuma ser "nenhum(a)", muito mais fácil de contar.',
    atencao:
      'Estudantes tendem a calcular sempre direto, mesmo quando o complementar seria mais simples (BATANERO; DIAZ, 2007, p. 127). Habitue-se a perguntar: "é mais fácil contar o que ocorre OU o que NÃO ocorre?" antes de escolher a estratégia.',
    referencia: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
  {
    id: 'equiprovavel',
    titulo: 'Probabilidade em espaço amostral equiprovável',
    grupo: 'probabilidade',
    grupoTitulo: 'Probabilidade',
    definicaoFormal:
      'Seja S o espaço amostral (conjunto de TODOS os resultados possíveis do experimento). Se S é finito e todos os resultados elementares são igualmente prováveis, então P(A) = n(A) / n(S) para qualquer evento A ⊆ S. Esta é a definição clássica de probabilidade (Laplace).',
    definicaoNatural:
      'Em um espaço amostral em que cada resultado tem a mesma chance de sair, a probabilidade de um evento é a razão entre quantos resultados favorecem o evento e quantos resultados são possíveis no total.',
    exemploContexto:
      'No lançamento de dois dados (verde × azul), o espaço amostral S é o conjunto dos 36 pares ordenados (g, b) com g, b ∈ {1, 2, 3, 4, 5, 6}. Cada par é igualmente provável (1/36).',
    exemploCalculo:
      'Para o evento A = "Soma maior que 8", contam-se os pares favoráveis: (3,6), (4,5), (4,6), (5,4), (5,5), (5,6), (6,3), (6,4), (6,5), (6,6) → n(A) = 10. Logo P(A) = 10/36 = 5/18.',
    paraQueServe:
      'É a fórmula básica para calcular probabilidade em qualquer experimento clássico — dados, moedas, baralhos, sorteios — em que a simetria garante que todos os resultados elementares têm a mesma chance.',
    atencao:
      'Antes de aplicar a fórmula, VERIFIQUE se S (o espaço amostral) é mesmo equiprovável. Se não for, n(A)/n(S) está errado. E nunca esqueça de identificar n(S) corretamente — esse é o erro mais frequente em probabilidade clássica (NAVARRO-PELAYO et al., 2016, p. 734).',
    referencia: 'NAVARRO-PELAYO, V.; PAEZ-MONTIEL, J. C.; AMADOR-CRUZ, J. A. Secondary school students\' difficulties in solving probability tasks. IJMEST, v. 47, n. 5, p. 732-747, 2016.',
  },
  {
    id: 'cardinalidade-uniao',
    titulo: 'Cardinalidade da União: n(A ∪ B) = n(A) + n(B) − n(A ∩ B)',
    grupo: 'probabilidade',
    grupoTitulo: 'Probabilidade',
    definicaoFormal:
      'Para quaisquer eventos finitos A e B, vale o princípio da inclusão-exclusão: n(A ∪ B) = n(A) + n(B) − n(A ∩ B). A subtração de n(A ∩ B) corrige a contagem dupla dos elementos que pertencem aos dois conjuntos.',
    definicaoNatural:
      'Para contar quantos resultados estão em A ∪ B, somamos n(A) e n(B), MAS subtraímos n(A ∩ B) — porque os elementos da interseção foram contados duas vezes (uma em A, outra em B).',
    exemploContexto:
      'Com A = "Soma maior que 8" (n(A) = 10) e B = "Face par no dado verde" (n(B) = 18), há 6 pares que estão em ambos (n(A ∩ B) = 6). Se somássemos direto, contaríamos esses 6 pares duas vezes.',
    exemploCalculo:
      'n(A ∪ B) = n(A) + n(B) − n(A ∩ B) = 10 + 18 − 6 = 22. Sem subtrair a interseção, daria 28 — errado.',
    paraQueServe:
      'É o passo intermediário entre saber n(A), n(B), n(A ∩ B) e calcular P(A ∪ B). Sempre que você precisar de "quantos estão em A ou em B", use esta fórmula.',
    atencao:
      'O erro clássico é fazer n(A) + n(B) sem subtrair a interseção — chamado de heurística aditiva simplificada (KAHNEMAN; TVERSKY, 1972, p. 432). Resulta em SUPERESTIMAÇÃO da cardinalidade (e, em probabilidade, em valores possivelmente acima de 1, o que é matematicamente impossível).',
    referencia: 'KAHNEMAN, D.; TVERSKY, A. Subjective probability: a judgment of representativeness. Cognitive Psychology, v. 3, n. 3, p. 430-454, 1972.',
  },
  {
    id: 'probabilidade-uniao',
    titulo: 'Probabilidade da União — duas formas equivalentes',
    grupo: 'probabilidade',
    grupoTitulo: 'Probabilidade',
    definicaoFormal:
      'Sendo S o espaço amostral, a probabilidade do evento A ∪ B pode ser calculada de DUAS formas equivalentes:\n\n  (a) Forma direta:    P(A ∪ B) = n(A ∪ B) / n(S)\n  (b) Forma composta:  P(A ∪ B) = P(A) + P(B) − P(A ∩ B)\n\nAmbas dão o mesmo resultado. A forma (b) é consequência direta da fórmula da inclusão-exclusão dividida por n(S).',
    definicaoNatural:
      'Você tem DOIS caminhos para calcular P(A ∪ B): contar diretamente quantos pares estão em A ∪ B e dividir por 36, OU somar P(A) + P(B) e subtrair P(A ∩ B). Os dois caminhos chegam ao mesmo número.',
    exemploContexto:
      'Com A = "Soma maior que 8" e B = "Face par no dado verde": n(A) = 10, n(B) = 18, n(A ∩ B) = 6, n(A ∪ B) = 22.',
    exemploCalculo:
      'Forma direta:   P(A ∪ B) = 22/36 = 11/18 ≈ 0,611\nForma composta: P(A ∪ B) = 10/36 + 18/36 − 6/36 = (10 + 18 − 6)/36 = 22/36 = 11/18 ✓\n\nResultado idêntico.',
    paraQueServe:
      'A forma direta é melhor quando você já marcou A ∪ B na tabela e contou as células. A forma composta é melhor quando você conhece P(A), P(B) e P(A ∩ B) separadamente — situação típica em problemas de palavras.',
    atencao:
      'NÃO use P(A ∪ B) = P(A) + P(B) sem subtrair P(A ∩ B), a menos que A e B sejam MUTUAMENTE EXCLUSIVOS (A ∩ B = ∅). Generalizar a regra dos exclusivos para eventos quaisquer é erro frequente (BATANERO; DIAZ, 2007, p. 125).',
    referencia: 'BATANERO, C.; DIAZ, C. (eds.). Matemáticas y su didáctica para maestros. Granada: Universidad de Granada, 2007.',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Mapeamento step-do-erro → verbetes sugeridos
   Princípio da relevância contextual (MAYER, 2014, p. 280):
   o feedback após erro deve apontar exatamente o que estudar.
   ═══════════════════════════════════════════════════════════════════ */

export type Ex6StepKind = 'mark-A' | 'mark-B' | 'mark-D' | 'identify-operation' | 'compute-probability';

export function getSuggestedVerbetes(
  step: Ex6StepKind,
  operation: 'Union' | 'Intersection',
): readonly VerbeteId[] {
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
