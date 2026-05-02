/* ═══════════════════════════════════════════════════════════════
   exercise5Data.ts — Gerador paramétrico do Exercício 5
   (tabela de contingência social: time × sexo).

   Variáveis:
     H1, M1 = ♂ e ♀ torcedores do Time1     (linha 1)
     H2, M2 = ♂ e ♀ torcedores do Time2     (linha 2)
     t1 = H1 + M1                            (margem linha 1)
     t2 = H2 + M2                            (margem linha 2)
     th = H1 + H2                            (margem coluna ♂)
     tm = M1 + M2                            (margem coluna ♀)
     tg = H1 + H2 + M1 + M2 = t1+t2 = th+tm  (total geral)

   Restrições obrigatórias:
     30 ≤ {H1,H2,M1,M2} ≤ 80
     todas as 9 quantidades distintas (unicidade)
     A ∩ B (interseção do tipo de questão) controlada por categoria

   Categorias didáticas (ordem fixa por rodada):
     Rodada 0 (1ª obrigatória): "interseção" — qualquer célula > 0
     Rodada 1 (2ª obrigatória): "mutuamente exclusivos" — célula
       da interseção da pergunta = 0; isso exige construir a
       pergunta sobre eventos disjuntos (ex.: "ser do Time1 OU
       ser do Time2", já que H1∩H2 = ∅ por construção da tabela).
     Rodada ≥ 2 (modo "Continuar estudando"): aleatório alternando
       categorias e tipos de pergunta.

   Tipo de pergunta (sorteado):
     'union'        → P(A ∪ B) com A,B não-exclusivos       (rodada 0)
     'union_excl'   → P(A ∪ B) com A,B exclusivos            (rodada 1)
     'intersection' → P(A ∩ B) com A,B não-independentes     (rodada 0 alt)
   ═══════════════════════════════════════════════════════════════ */

import { TEAMS, type Team, pickTwoTeams } from './teamsData';

export type Sex = 'masculino' | 'feminino';
export type QuestionType = 'union' | 'union_excl' | 'intersection';

/** Distrator com semântica didática (deriva de erro típico). */
export interface Distractor {
  num: number;
  den: number;
  /** Erro típico que produziria esta resposta (usado no debug e em dicas). */
  rationale: string;
}

export interface Exercise5Data {
  id: string;
  /** Times sorteados (sempre dois distintos, fora Atlético-MG e Cruzeiro). */
  team1: Team;
  team2: Team;
  /** Células da tabela 2×2. */
  H1: number; H2: number;
  M1: number; M2: number;
  /** Margens corretas (calculadas pelo aluno na fase fillTotals). */
  t1: number; t2: number;
  th: number; tm: number;
  tg: number;
  /** Tipo de questão sorteado para esta instância. */
  questionType: QuestionType;
  /** Enunciado em português, gerado dinamicamente. */
  statement: string;
  /** Numerador e denominador da resposta correta P(target). */
  answerNum: number;
  answerDen: number;
  /** Rótulo legível do alvo da pergunta (ex.: "P(A ∪ B)"). */
  targetLabel: string;
  /** Eventos A e B textualmente para uso nas dicas. */
  descA: string;
  descB: string;
  /** n(A), n(B), n(A∩B) — usados na exibição dos passos e dicas. */
  nA: number; nB: number; nAB: number;
  /** 4 distratores didáticos (junto com a resposta dão 5 alternativas). */
  distractors: Distractor[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSex(): Sex {
  return Math.random() < 0.5 ? 'masculino' : 'feminino';
}

function sexLabelInfinitive(s: Sex): string {
  return s === 'masculino' ? 'ser do sexo masculino' : 'ser do sexo feminino';
}

function ninePresentDistinct(H1: number, H2: number, M1: number, M2: number): boolean {
  const t1 = H1 + M1, t2 = H2 + M2, th = H1 + H2, tm = M1 + M2, tg = th + tm;
  const set = new Set([H1, H2, M1, M2, t1, t2, th, tm, tg]);
  return set.size === 9;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function makeDistractors(
  correctNum: number,
  correctDen: number,
  ctx: { H1: number; H2: number; M1: number; M2: number; tg: number; type: QuestionType },
): Distractor[] {
  const { H1, H2, M1, M2, tg, type } = ctx;
  const out: Distractor[] = [];

  // Distrator 1: usar como numerador apenas uma das parcelas (esquecer a outra)
  if (type === 'union' || type === 'union_excl') {
    out.push({
      num: H1 + M1,
      den: tg,
      rationale: 'somou apenas as células do Time1 e esqueceu a coluna do sexo',
    });
  } else {
    out.push({
      num: H1,
      den: tg,
      rationale: 'pegou outra célula da tabela (não a interseção pedida)',
    });
  }

  // Distrator 2: somar P(A) + P(B) sem subtrair P(A∩B) (heurística aditiva V7.1)
  if (type === 'union') {
    out.push({
      num: (H1 + M1) + (H1 + H2),
      den: tg,
      rationale: 'aplicou P(A) + P(B) sem subtrair P(A ∩ B) — heurística aditiva',
    });
  } else if (type === 'intersection') {
    out.push({
      num: M2,
      den: tg,
      rationale: 'inverteu o sexo na interseção pedida',
    });
  } else {
    out.push({
      num: H1 + H2 + M1 + M2,
      den: tg,
      rationale: 'usou todos os torcedores como favoráveis',
    });
  }

  // Distrator 3: trocar denominador (usar t1 ou tm em vez de tg)
  out.push({
    num: correctNum,
    den: H1 + M1, // total do Time1 (denominador errado)
    rationale: 'usou o total do Time1 como denominador, em vez do total geral',
  });

  // Distrator 4: numerador correto, denominador trocado por outro total
  out.push({
    num: correctNum,
    den: H1 + H2, // total dos homens (denominador errado)
    rationale: 'usou o total dos homens como denominador, em vez do total geral',
  });

  // Garante que nenhum distrator coincide com a resposta correta (multiplicação cruzada)
  const isCorrect = (d: Distractor) => d.num * correctDen === correctNum * d.den;
  // Garante distratores distintos entre si
  const distinctKey = (d: Distractor) => `${d.num}/${d.den}`;
  const seen = new Set<string>();
  const filtered = out.filter(d => {
    if (isCorrect(d)) return false;
    const k = distinctKey(d);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Se algum distrator foi descartado, gera substitutos didáticos genéricos
  while (filtered.length < 4) {
    const candidate: Distractor = {
      num: correctNum + filtered.length + 1,
      den: tg,
      rationale: 'erro de contagem em uma das parcelas',
    };
    if (!isCorrect(candidate) && !seen.has(distinctKey(candidate))) {
      filtered.push(candidate);
      seen.add(distinctKey(candidate));
    } else {
      // fallback final
      filtered.push({
        num: correctNum + filtered.length + 7,
        den: tg,
        rationale: 'erro de aritmética',
      });
    }
  }

  return filtered.slice(0, 4);
}

/**
 * Seleciona um conjunto de dados pedagogicamente razoável para o exercício 5.
 *
 * @param round — rodada atual (0-indexed):
 *    0 = primeira rodada obrigatória (interseção, e ≥ 1)
 *    1 = segunda rodada obrigatória (mutuamente exclusivos, e = 0 da pergunta)
 *    2+ = modo "Continuar estudando" (categoria alternada)
 */
export function selectExercise5Data(round: number = 0): Exercise5Data {
  const isExclusive = round === 1 || (round >= 2 && round % 2 === 1);
  const askIntersection = round >= 2 && round % 3 === 2;

  for (let attempt = 0; attempt < 500; attempt++) {
    const H1 = randInt(30, 80);
    const H2 = randInt(30, 80);
    const M1 = randInt(30, 80);
    const M2 = randInt(30, 80);

    if (!ninePresentDistinct(H1, H2, M1, M2)) continue;

    const t1 = H1 + M1;
    const t2 = H2 + M2;
    const th = H1 + H2;
    const tm = M1 + M2;
    const tg = th + tm;

    const [team1, team2] = pickTwoTeams();
    const sex = pickSex();

    let questionType: QuestionType;
    let statement: string;
    let answerNum: number;
    const answerDen: number = tg;
    let targetLabel: string;
    let descA: string;
    let descB: string;
    let nA: number;
    let nB: number;
    let nAB: number;

    if (isExclusive) {
      // Rodada 1: união de eventos mutuamente exclusivos.
      // A = "torcer pelo Time1", B = "torcer pelo Time2" → A ∩ B = ∅ por construção.
      questionType = 'union_excl';
      const askedSex = sex; // sem efeito didático no caso exclusivo, mas mantém narrativa
      void askedSex;
      const numA = t1;
      const numB = t2;
      const numAB = 0;
      const numUnion = numA + numB - numAB;
      statement = `Se uma pessoa é entrevistada ao acaso entre os ${tg} torcedores presentes, qual é a probabilidade de ela torcer pelo ${team1.name} OU torcer pelo ${team2.name}?`;
      answerNum = numUnion;
      targetLabel = 'P(A ∪ B)';
      descA = `torcer pelo ${team1.name}`;
      descB = `torcer pelo ${team2.name}`;
      nA = numA; nB = numB; nAB = numAB;
    } else if (askIntersection) {
      // Modo opcional: interseção não-independente.
      // A = "torcer pelo Time2", B = "ser do sexo X" → A ∩ B = célula correspondente.
      questionType = 'intersection';
      const cellAB = sex === 'masculino' ? H2 : M2;
      const numA = t2;
      const numB = sex === 'masculino' ? th : tm;
      statement = `Se uma pessoa é entrevistada ao acaso entre os ${tg} torcedores presentes, qual é a probabilidade de ela torcer pelo ${team2.name} E ${sexLabelInfinitive(sex)}?`;
      answerNum = cellAB;
      targetLabel = 'P(A ∩ B)';
      descA = `torcer pelo ${team2.name}`;
      descB = sexLabelInfinitive(sex);
      nA = numA; nB = numB; nAB = cellAB;
    } else {
      // Rodada 0 (e modo opcional alt): união não-exclusiva.
      // A = "torcer pelo Time1", B = "ser do sexo X" → A ∩ B = célula H1 ou M1.
      questionType = 'union';
      const cellAB = sex === 'masculino' ? H1 : M1;
      if (cellAB === 0) continue; // garante necessidade da subtração
      const numA = t1;
      const numB = sex === 'masculino' ? th : tm;
      const numUnion = numA + numB - cellAB;
      statement = `Se uma pessoa é entrevistada ao acaso entre os ${tg} torcedores presentes, qual é a probabilidade de ela torcer pelo ${team1.name} OU ${sexLabelInfinitive(sex)}?`;
      answerNum = numUnion;
      targetLabel = 'P(A ∪ B)';
      descA = `torcer pelo ${team1.name}`;
      descB = sexLabelInfinitive(sex);
      nA = numA; nB = numB; nAB = cellAB;
    }

    const distractors = makeDistractors(answerNum, answerDen, {
      H1, H2, M1, M2, tg, type: questionType,
    });

    return {
      id: `ex5-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      team1, team2,
      H1, H2, M1, M2,
      t1, t2, th, tm, tg,
      questionType,
      statement,
      answerNum, answerDen,
      targetLabel,
      descA, descB,
      nA, nB, nAB,
      distractors,
    };
  }

  throw new Error('selectExercise5Data: espaço paramétrico esgotado (500 tentativas).');
}

/** Simplifica fração para exibição (não para validação — validação usa cruz). */
export function reduceFraction(num: number, den: number): { n: number; d: number } {
  if (den === 0) return { n: num, d: den };
  const g = gcd(Math.abs(num), Math.abs(den));
  return { n: num / g, d: den / g };
}

/** Aceita n1/d1 ≡ n2/d2 sem floating point. R14 conformante. */
export function fractionsEquivalent(n1: number, d1: number, n2: number, d2: number): boolean {
  return n1 * d2 === n2 * d1;
}

export { TEAMS };
