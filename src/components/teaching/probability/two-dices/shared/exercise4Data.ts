/* ═══════════════════════════════════════════════════════════════
   Gerador paramétrico de dados para o Exercício 4 —
   contexto: torcedores em bar (Atlético × Cruzeiro).

   Variáveis:
     S = total de pessoas
     b = n(A) — torcedores do time escolhido
     d = n(B) — pessoas do sexo escolhido
     e = n(A ∩ B) — pessoas que são ambos
     c = n(A ∪ B) = b + d − e
     w = S − c — torcedores de outros times (fora de A∪B)

   Restrições obrigatórias:
     80 ≤ S ≤ 120
     1 ≤ b < S
     1 ≤ d < S
     0 ≤ e ≤ min(b, d)
     c = b + d − e ≤ S
   ═══════════════════════════════════════════════════════════════ */

export type Team = 'atletico' | 'cruzeiro';
export type Sex = 'feminino' | 'masculino';

export interface Exercise4Data {
  id: string;
  S: number;
  b: number;
  d: number;
  e: number;
  c: number;
  w: number;
  team: Team;
  sex: Sex;
  /** Descrição do evento A em 3ª pessoa do plural — "torcem para o Atlético Mineiro"
   *  Usada no enunciado em listas ("X pessoas torcem para..."). */
  descA: string;
  /** Descrição do evento B em 3ª pessoa do plural — "são do sexo feminino" */
  descB: string;
  /** Descrição do evento A no infinitivo — "torcer para o Atlético Mineiro"
   *  Usada na pergunta final ("probabilidade de a pessoa torcer..."). */
  descAInfinitive: string;
  /** Descrição do evento B no infinitivo — "ser do sexo feminino"
   *  IMPORTANTE: quando invertB é true, este valor é o COMPLEMENTAR de descB.
   *  Ex.: descB = "são do sexo masculino", descBInfinitive = "ser do sexo feminino". */
  descBInfinitive: string;
  /** Notação de conjunto de A para sugestão didática ("torcedor do Cruzeiro").
   *  SEMPRE refere-se ao evento dos DADOS (nunca ao invertido da pergunta) —
   *  A e B como variáveis de trabalho na fórmula de cardinalidade. */
  descASetNotation: string;
  /** Notação de conjunto de B para sugestão didática ("Mulheres" ou "Homens"). */
  descBSetNotation: string;
  /** S > c — existe grupo de "outros times"? */
  hasOthers: boolean;

  // ──── Sistema de inversão (A e B independentemente) ─────────
  /** Se true, a pergunta pede sobre Ā (complementar de A): "não torcer para o [time]".
   *  Ā = S − A inclui torcedores do outro time + "outros times". */
  invertA: boolean;
  /** Se true, a pergunta pede sobre B̄ (complementar de sexo). Para B (sexo),
   *  B̄ = o outro sexo (bimodal). */
  invertB: boolean;
  /** Cardinalidade-alvo da interseção pedida. Depende dos 4 casos de inversão:
   *  • (F, F): e        = n(A ∩ B)
   *  • (F, T): b − e    = n(A ∩ B̄) = n(A − B)
   *  • (T, F): d − e    = n(Ā ∩ B) = n(B − A)
   *  • (T, T): S − c    = n(Ā ∩ B̄) = n((A ∪ B)^c) */
  targetCardinality: number;
  /** Rótulo legível do evento-alvo: "A ∩ B", "A ∩ B̄", "Ā ∩ B" ou "Ā ∩ B̄". */
  targetLabel: string;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickTeam(): Team {
  return Math.random() < 0.5 ? 'atletico' : 'cruzeiro';
}
function pickSex(): Sex {
  return Math.random() < 0.5 ? 'feminino' : 'masculino';
}

function teamDescription(t: Team): string {
  return t === 'atletico' ? 'torcem para o Atlético Mineiro' : 'torcem para o Cruzeiro';
}
function sexDescription(s: Sex): string {
  return s === 'feminino' ? 'são do sexo feminino' : 'são do sexo masculino';
}
function sexDescriptionInfinitive(s: Sex): string {
  return s === 'feminino' ? 'ser do sexo feminino' : 'ser do sexo masculino';
}
/** Retorna o complementar do sexo (para pergunta invertida). */
function oppositeSex(s: Sex): Sex {
  return s === 'feminino' ? 'masculino' : 'feminino';
}
/** Descrição infinitiva considerando inversão de A.
 *  Inversão de A usa "não torcer para..." porque Ā = complementar
 *  matemático (inclui outros times, não só o oponente). */
function teamInfinitiveWithInversion(t: Team, invert: boolean): string {
  const base = t === 'atletico' ? 'o Atlético Mineiro' : 'o Cruzeiro';
  return invert ? `não torcer para ${base}` : `torcer para ${base}`;
}

/** Notação de conjunto para o time (sugestão didática de variável de trabalho).
 *  Sempre se refere ao time DOS DADOS, independente de invertA. */
function teamSetNotation(t: Team): string {
  return t === 'atletico' ? 'torcedores do Atlético' : 'torcedores do Cruzeiro';
}
/** Notação de conjunto para o sexo (sugestão didática). Sempre dos DADOS. */
function sexSetNotation(s: Sex): string {
  return s === 'feminino' ? 'Feminino' : 'Masculino';
}

/**
 * Seleciona um conjunto de dados pedagogicamente razoável para o exercício.
 *
 * Critérios pedagógicos adicionais (além das restrições formais):
 *   - b e d "razoáveis": nem extremamente pequenos nem quase iguais a S,
 *     para que as probabilidades individuais sejam expressivas.
 *   - e ≥ 1: garante P(A ∩ B) > 0 (foco do exercício seria trivial se e=0).
 *   - evita-se A ⊂ B (b = e) e B ⊂ A (d = e), que degeneram o problema.
 *   - preferência por hasOthers = true (S > c) em ~70% dos casos, para
 *     exercitar a leitura do enunciado completo ("além disso, w pessoas...").
 */
/**
 * @param round rodada atual (0 = primeira tentativa, 1+ = repetições).
 *   • rodada 0 → sempre invertA=false, invertB=false (pergunta direta — mesmo
 *     time/sexo dos dados). O aluno aprende primeiro o mecanismo básico.
 *   • rodada ≥ 1 → inversões aleatórias (40% cada, independentes).
 *     Variável didática escalonada (ARTIGUE, 2014).
 */
export function selectExercise4Data(round: number = 0): Exercise4Data {
  const allowInversion = round >= 1;
  for (let attempt = 0; attempt < 200; attempt++) {
    const S = randomInt(80, 120);

    // b e d em faixa pedagógica razoável
    const b = randomInt(20, S - 15);
    const d = randomInt(20, S - 15);

    // e com restrição de não-degeneração (evita A⊂B e B⊂A)
    const minE = 1;
    const maxE = Math.min(b, d) - 1;
    if (maxE < minE) continue;
    const e = randomInt(minE, maxE);

    const c = b + d - e;
    if (c > S) continue;

    const w = S - c;

    // Preferência por cenários com "outros torcedores" — mais rico pedagogicamente
    // Tenta 3 vezes; após isso, aceita qualquer caso válido
    const preferOthers = attempt < 150;
    if (preferOthers && w === 0) continue;

    const team = pickTeam();
    const sex = pickSex();

    // Inversões independentes (40% cada) — somente quando allowInversion
    // (a partir da rodada ≥ 1). Na rodada 0 (primeira tentativa do aluno),
    // ambas são false, garantindo que a pergunta seja a mais direta possível.
    //   (F, F) → P(A ∩ B)    — ambos "normais"       (ÚNICO caso na rodada 0)
    //   (F, T) → P(A ∩ B̄)    — B invertido
    //   (T, F) → P(Ā ∩ B)    — A invertido
    //   (T, T) → P(Ā ∩ B̄)    — ambos invertidos
    const invertA = allowInversion && Math.random() < 0.4;
    const invertB = allowInversion && Math.random() < 0.4;
    const effectiveSexForQuestion = invertB ? oppositeSex(sex) : sex;

    // Cardinalidade-alvo da interseção pedida (em todos os 4 casos).
    let targetCardinality: number;
    let targetLabel: string;
    if (!invertA && !invertB) {
      targetCardinality = e;           // n(A ∩ B)
      targetLabel = 'A ∩ B';
    } else if (!invertA && invertB) {
      targetCardinality = b - e;       // n(A ∩ B̄) = n(A) − n(A ∩ B)
      targetLabel = 'A ∩ B̄';
    } else if (invertA && !invertB) {
      targetCardinality = d - e;       // n(Ā ∩ B) = n(B) − n(A ∩ B)
      targetLabel = 'Ā ∩ B';
    } else {
      targetCardinality = S - c;       // n(Ā ∩ B̄) = n(Ω) − n(A ∪ B)
      targetLabel = 'Ā ∩ B̄';
    }

    return {
      id: `ex4-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      S, b, d, e, c, w,
      team, sex,
      descA: teamDescription(team),
      descB: sexDescription(sex),
      descAInfinitive: teamInfinitiveWithInversion(team, invertA),
      descBInfinitive: sexDescriptionInfinitive(effectiveSexForQuestion),
      descASetNotation: teamSetNotation(team),
      descBSetNotation: sexSetNotation(sex),
      hasOthers: w > 0,
      invertA,
      invertB,
      targetCardinality,
      targetLabel,
    };
  }
  throw new Error('selectExercise4Data: espaço paramétrico inesperadamente vazio');
}
