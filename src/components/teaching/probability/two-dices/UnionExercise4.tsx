'use client';

/* ═══════════════════════════════════════════════════════════════
   UnionExercise4 — Exercício 4 da trilha opcional.

   CONTEXTO: torcedores em bar durante Atlético × Cruzeiro.
   Gerador produz S, b, d, e (→ c, w) com restrições formais.

   OBJETIVO: calcular P(A ∩ B) por um dos três caminhos escolhidos
   pelo aluno — metacognição da seleção de estratégia.

   CAMINHOS:
     1.1 — Laplace + Fórmula de cardinalidade de união
     1.2 — Laplace + Diagrama de Venn numérico
     2   — Fórmula geral da probabilidade da união

   PEDAGOGIA DO AUXÍLIO:
     • Botão "Ajuda" — até 4 vezes, revela o próximo micro-passo
     • Após 4 ajudas: botão "Não sei realmente!" dispara
       animação lenta com toda a derivação (institucionalização
       brousseauniana terminal).

   Este é o exercício que fecha a ressalva V14.4 do parecer
   Dr. OtiMath — transferência contextual para fora do contexto
   de lançamento de dados.
   ═══════════════════════════════════════════════════════════════ */

import React, {
  useState, useCallback, useMemo, useEffect, useRef,
  forwardRef, useImperativeHandle,
} from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import { useTelemetryExercise, useReadingTelemetry, telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';
import { selectExercise4Data, type Exercise4Data } from './shared/exercise4Data';
import { EVENT_COLORS, isEquivalentFraction } from './shared/eventPair';
import { FractionInput, FracH, formatDecimal, formatPercent } from './shared/FractionInput';
import { VennNumericPanel } from './shared/VennNumericPanel';
import { ReasoningPlaybackPanel, type ReasoningLine } from './shared/ReasoningPlaybackPanel';
import { SimpleCalculator } from './shared/SimpleCalculator';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

type Step =
  | 'intro'
  | 'menu'
  | 'lapMenu'
  // Caminho 1.1 — Laplace + Cardinalidade
  | 'lapCard1'   // escolher fórmula de cardinalidade
  | 'lapCard2'   // substituir valores (c = b + d − x)
  | 'lapCard3'   // isolar n(A∩B) = b + d − c
  | 'lapCard3b'  // (só se invertB) calcular n(A − B) = n(A) − n(A∩B)
  | 'lapCard4'   // aplicar Laplace → P(alvo)
  // Caminho 1.2 — Laplace + Venn
  | 'lapVenn1'   // preencher interseção (x)
  | 'lapVenn2'   // preencher A-B, B-A, outros
  | 'lapVenn3'   // aplicar Laplace
  // Caminho 2 — Fórmula Geral
  | 'general1'   // preencher P(A∪B), P(A), P(B) na equação
  | 'general2'   // isolar P(A∩B)
  | 'general3'   // (só se invertB) P(A ∩ B̄) = P(A) − P(A ∩ B)
  // Finalização
  | 'reasoningPlayback' // animação "Não sei realmente!"
  | 'correct';

type ExprId = '' | 'A' | 'B' | 'AnB' | 'AmB' | 'BmA' | 'AuB' | 'AuB_minus_AnB';

interface UnionExercise4Props {
  onFinished: () => void;
  onRequestPreviousPhase?: () => void;
  initialStep?: Step;
  /** Toast alert do OVA (propagado pelo TwoDicesExperiment). */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number, userResponse?: string) => void;
  /** Emite snapshot JSON v2 completo pro pai. */
  onPhaseChange?: (phaseId: string) => void;
  /** Snapshot pra restauração pós-F5 no mount. */
  initialPhaseSnapshot?: string;
}

export interface UnionExercise4Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
  getCurrentPhaseId: () => string;
  setCurrentPhaseId: (phaseId: string) => void;
}

// Sequência principal (usada pela navegação dev com setinhas)
const STEP_SEQUENCE: Step[] = [
  'intro', 'menu', 'correct',
];

// ═══════════════════════════════════════════════════════════════
// HELPER — validação de fração separada num/den (R14)
// ═══════════════════════════════════════════════════════════════

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Avalia uma expressão linear na variável `varLetter` (uma letra), com
 *  possíveis símbolos `b` → bValue, `d` → dValue, `c` → cValue.
 *  Retorna a forma canônica { constant, coefficient } se a expressão for
 *  linear válida nessa variável, ou `null` se inválida.
 *
 *  Aceita ordens de parcelas arbitrárias, espaços, parênteses simples,
 *  sinais Unicode (− U+2212) e letras em qualquer caixa.
 *
 *  Exemplos (varLetter='x', b=80, d=58, c=89):
 *    "80-x+x+58-x" → { constant: 138, coefficient: -1 }
 *    "-x+58+x+80-x" → { constant: 138, coefficient: -1 }   (ordem diferente, mesmo valor)
 *    "b+d-x" → { constant: 138, coefficient: -1 }
 *    "138-x" → { constant: 138, coefficient: -1 }
 *    "2x-y" → null (y não é a varLetter)
 */
function evaluateLinearExpression(
  expr: string,
  varLetter: string,
  bValue: number,
  dValue: number,
  cValue: number,
): { constant: number; coefficient: number } | null {
  let e = expr
    .trim()
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/[()]/g, '')  // remove parênteses simples (não aninhados)
    .toLowerCase();

  if (e === '') return null;

  // Substitui símbolos reservados por valores. A letra da variável NÃO é
  // substituída (ela é consumida pela regex de termos).
  e = e.replace(/b/g, String(bValue))
       .replace(/d/g, String(dValue))
       .replace(/c/g, String(cValue));

  // Valida caracteres permitidos: dígitos, sinais e a letra da variável.
  const allowedRe = new RegExp(`^[+\\-0-9${varLetter}]+$`);
  if (!allowedRe.test(e)) return null;

  // Garante sinal inicial explícito
  if (e[0] !== '+' && e[0] !== '-') e = '+' + e;

  // Regex: cada termo é "<sinal><digitos opcionais><variavel opcional>"
  const termRe = new RegExp(`([+-])(\\d*)(${varLetter})?`, 'g');
  let constant = 0;
  let coefficient = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = termRe.exec(e)) !== null) {
    if (match.index !== cursor) return null; // lacuna na entrada
    const [full, sign, digits, letter] = match;
    if (full === '') return null;
    cursor = match.index + full.length;
    const s = sign === '-' ? -1 : 1;
    if (letter) {
      const coef = digits === '' ? 1 : parseInt(digits, 10);
      coefficient += s * coef;
    } else {
      if (digits === '') return null;
      constant += s * parseInt(digits, 10);
    }
  }
  if (cursor !== e.length) return null;
  return { constant, coefficient };
}

type FracVal = { numError: boolean; denError: boolean; ok: boolean };

function validateFracSep(
  numStr: string, denStr: string,
  expectedNum: number, expectedDen: number,
): FracVal {
  const num = parseInt(numStr.trim(), 10);
  const den = parseInt(denStr.trim(), 10);
  const numValid = Number.isInteger(num) && num >= 0;
  const denPositive = Number.isInteger(den) && den > 0;
  if (expectedNum === 0) {
    return {
      numError: !numValid || num !== 0,
      denError: !denPositive,
      ok: numValid && num === 0 && denPositive,
    };
  }
  const g = gcd(expectedNum, expectedDen);
  const irreducibleDen = expectedDen / g;
  const denOk = denPositive && den % irreducibleDen === 0;
  const equivalent = numValid && denPositive && num * expectedDen === den * expectedNum;
  if (equivalent) return { numError: false, denError: false, ok: true };
  const denFailed = !denOk;
  return { numError: !denFailed || !numValid, denError: denFailed, ok: false };
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES DE APOIO
// ═══════════════════════════════════════════════════════════════

// Input numérico único (para b, d, c, x nas substituições)
function NumberBox({
  value, setValue, error, onEnter, width = 56, ariaLabel,
}: {
  value: string; setValue: (v: string) => void;
  error?: boolean; onEnter?: () => void;
  width?: number; ariaLabel?: string;
}) {
  const border = error ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)';
  return (
    <input
      type="number" inputMode="numeric" value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      placeholder="?" aria-label={ariaLabel ?? 'Valor'}
      aria-invalid={!!error}
      style={{
        border: `2px solid ${border}`, borderRadius: 6, padding: '4px',
        width, textAlign: 'center', outline: 'none', fontWeight: 700,
      }}
    />
  );
}

// Input de texto para expressões algébricas (ex.: "b-x", "64-x", "b+d-c").
function TextBox({
  value, setValue, error, onEnter, width = 110, ariaLabel, placeholder = '?',
}: {
  value: string; setValue: (v: string) => void;
  error?: boolean; onEnter?: () => void;
  width?: number; ariaLabel?: string; placeholder?: string;
}) {
  const border = error ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)';
  return (
    <input
      type="text"
      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      placeholder={placeholder}
      aria-label={ariaLabel ?? 'Expressão'}
      aria-invalid={!!error}
      style={{
        border: `2px solid ${border}`, borderRadius: 6, padding: '6px 10px',
        width, textAlign: 'center', outline: 'none', fontWeight: 700,
        fontSize: '1rem',
      }}
    />
  );
}

// Dropdown de expressão (reuso da estética do FormulaSelect do Ex1)
function ExprSelect({
  value, onChange, expected, options, telemetryContext,
}: Readonly<{
  value: ExprId;
  onChange: (v: ExprId) => void;
  expected: ExprId;
  options: Array<{ v: ExprId; label: string }>;
  /** Rótulo passado ao `telemetryRecordInteracaoExercicio` sempre que o
   *  aluno troca a opção do select. Sem isso, mudanças intermediárias
   *  ficavam mudas — só o clique em Validar aparecia na coleta. */
  telemetryContext?: string;
}>) {
  const isEmpty = value === '';
  const isCorrect = !isEmpty && value === expected;
  const color = isEmpty
    ? 'var(--color-neutral-dark)'
    : isCorrect
      ? 'var(--color-feedback-success-dark)'
      : 'var(--color-feedback-error-dark)';
  return (
    <select
      value={value}
      onChange={e => {
        const v = e.target.value as ExprId;
        if (telemetryContext) {
          const chosenLbl = options.find(o => o.v === v)?.label ?? v ?? '?';
          const expectedLbl = options.find(o => o.v === expected)?.label ?? expected;
          telemetryRecordInteracaoExercicio(
            `${telemetryContext} — escolheu "${chosenLbl}" (id=${v || '?'}) (esperado: "${expectedLbl}")`,
          );
        }
        onChange(v);
      }}
      aria-label="Expressão"
      style={{
        padding: '3px 8px', borderRadius: 5, border: `2px solid ${color}`,
        fontWeight: 700, fontSize: '0.95rem', color,
        background: 'var(--color-neutral-white)', minWidth: 76, outline: 'none',
        flexShrink: 0,
      }}
    >
      <option value="" disabled hidden>?</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
    </select>
  );
}

const CARD_OPTIONS = [
  { v: 'AuB' as ExprId, label: 'A ∪ B' },
  { v: 'A' as ExprId, label: 'A' },
  { v: 'B' as ExprId, label: 'B' },
  { v: 'AnB' as ExprId, label: 'A ∩ B' },
  { v: 'AmB' as ExprId, label: 'A − B' },
  { v: 'BmA' as ExprId, label: 'B − A' },
  { v: 'AuB_minus_AnB' as ExprId, label: '(A ∪ B) − (A ∩ B)' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const UnionExercise4 = forwardRef<UnionExercise4Handle, UnionExercise4Props>(
  function UnionExercise4({ onFinished, onRequestPreviousPhase, initialStep, createAlert, onPhaseChange, initialPhaseSnapshot }, ref) {
    const initialStepFromSnapshot = (() => {
      if (!initialPhaseSnapshot) return null;
      try {
        const obj = JSON.parse(initialPhaseSnapshot);
        if (obj && typeof obj === 'object' && typeof obj.step === 'string') return obj.step as Step;
      } catch { /* ignore */ }
      return null;
    })();
    const [step, setStep] = useState<Step>(initialStepFromSnapshot ?? initialStep ?? 'intro');
    // Telemetria — leitura do enunciado do Ex.4.
    const confirmReadIntro = useReadingTelemetry(
      step === 'intro',
      'twoDices-cena7-unionExercise4-intro',
      'Leitura — Enunciado do Exercício 4 (torcedores no bar, P(A∩B))',
      'Painel inicial — contexto do problema e três estratégias de resolução disponíveis.',
      'confirmou leitura do enunciado e clicou em "Começar"',
    );
    // Telemetria — descrição mostra a ETAPA atual do exercício pra
    // facilitar análise posterior. Cada step do fluxo gera um exercício
    // com a descrição correspondente.
    const ex4StepDescriptions: Record<Step, string> = {
      intro: 'Apresentação do problema dos torcedores no bar — leitura do enunciado.',
      menu: 'Escolha do caminho: Cardinalidade, Diagrama de Venn ou Fórmula Geral.',
      lapMenu: 'Abordagem Laplaciana — escolha entre Cardinalidade da União ou Diagrama de Venn.',
      lapCard1: 'Etapa 1 — Complete a fórmula da cardinalidade da união n(A∪B) = n(A) + n(B) − n(A∩B).',
      lapCard2: 'Etapa 2 — Substitua n(A∪B), n(A), n(B) pelos valores numéricos do enunciado.',
      lapCard3: 'Etapa 3 — Isole n(A∩B) na equação da etapa anterior.',
      lapCard3b: 'Etapa 3b — Calcule n(A − B) = n(A) − n(A∩B) para a região pedida.',
      lapCard4: 'Etapa 4 — Aplique Laplace: divida pelo total para obter a probabilidade.',
      lapVenn1: 'Etapa 1 (Venn) — Preencha a região de interseção do diagrama com a variável x.',
      lapVenn2: 'Etapa 2 (Venn) — Preencha as regiões A−B, B−A e fora dos conjuntos.',
      lapVenn3: 'Etapa 3 (Venn) — Identifique n(S) e aplique Laplace para a probabilidade pedida.',
      general1: 'Etapa 1 (Fórmula Geral) — Substitua as 3 frações em P(A∪B) = P(A) + P(B) − P(A∩B).',
      general2: 'Etapa 2 (Fórmula Geral) — Isole P(A∩B) e simplifique.',
      general3: 'Etapa 3 (Fórmula Geral) — Ajuste para a pergunta: calcule P(A ∩ B̄) usando P(A) − P(A∩B).',
      reasoningPlayback: 'Animação "Não sei realmente!" — replay do raciocínio passo a passo.',
      correct: 'Resolução concluída — escolha próximo caminho ou avance.',
    };
    // SEÇÃO POR STEP — descricao já era step-aware via
    // `ex4StepDescriptions`, mas o `id` era estático: várias telas
    // compartilhavam a mesma seção. Agora id também muda por step.
    // Título DINÂMICO com label legível por step.
    const stepLabelUE4 = step === 'intro' ? 'Enunciado'
      : step === 'menu' ? 'Menu — escolha do caminho'
      : step === 'lapMenu' ? 'Sub-menu Laplaciana'
      : step === 'lapCard1' ? 'Caminho 1.1 — Escolher fórmula de cardinalidade'
      : step === 'lapCard2' ? 'Caminho 1.1 — Substituir valores em n(A ∪ B)'
      : step === 'lapCard3' ? 'Caminho 1.1 — Isolar n(A ∩ B)'
      : step === 'lapCard3b' ? 'Caminho 1.1 — Calcular n(A − B)'
      : step === 'lapCard4' ? 'Caminho 1.1 — Aplicar Laplace para obter P(alvo)'
      : step === 'lapVenn1' ? 'Caminho 1.2 — Preencher x = n(A ∩ B) no Venn'
      : step === 'lapVenn2' ? 'Caminho 1.2 — Preencher demais regiões do Venn'
      : step === 'lapVenn3' ? 'Caminho 1.2 — Aplicar Laplace para obter P(alvo)'
      : step === 'reasoningPlayback' ? 'Replay do raciocínio passo a passo'
      : step === 'correct' ? 'Concluído — escolher próximo caminho'
      : String(step);
    const [round, setRound] = useState(0);
    const [data, setData] = useState<Exercise4Data>(() => selectExercise4Data(0));
    // ─── Descrição dos eventos do problema atual (torcedores no bar) ───
    const eventosBlocoUE4 =
      `Evento A: "${data.descAInfinitive}" (n(A) = ${data.b} pessoas) | ` +
      `Evento B: "${data.descBInfinitive}" (n(B) = ${data.d} pessoas) | ` +
      `Total no bar (universo S): ${data.S} pessoas | ` +
      `n(A ∩ B) = ${data.e} | n(A ∪ B) = ${data.c} | n(outros sem time/sexo declarado): ${data.S - data.c} | ` +
      `Alvo do problema: P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}` +
      (data.invertA || data.invertB ? ` (com inversão${data.invertA ? ' em A → Ā' : ''}${data.invertB ? ' em B → B̄' : ''})` : '');
    const oQueCalculaUE4 =
      step === 'intro' ? `Leitura do enunciado dos torcedores. O aluno será solicitado a calcular P(${data.targetLabel}).`
      : step === 'menu' ? 'Decisão metacognitiva: escolher Abordagem Laplaciana (via cardinalidades) ou Fórmula Geral da União.'
      : step === 'lapMenu' ? 'Sub-decisão dentro da Laplaciana: usar fórmula de cardinalidade (Caminho 1.1) ou Venn numérico (Caminho 1.2).'
      : step === 'lapCard1' ? 'Escolher fórmula correta de cardinalidade: n(A ∪ B) = n(A) + n(B) − n(A ∩ B).'
      : step === 'lapCard2' ? `Substituir valores: ${data.c} = ${data.b} + ${data.d} − x, onde x = n(A ∩ B).`
      : step === 'lapCard3' ? `Isolar n(A ∩ B): x = ${data.b} + ${data.d} − ${data.c} = ${data.e}.`
      : step === 'lapCard3b' ? `Calcular n(A − B) = n(A) − n(A ∩ B) = ${data.b} − ${data.e} = ${data.b - data.e}.`
      : step === 'lapCard4' ? `Aplicar Laplace: P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}.`
      : step === 'lapVenn1' ? `Preencher x = n(A ∩ B) = ${data.e} na região central do diagrama de Venn.`
      : step === 'lapVenn2' ? `Preencher demais regiões: A − B = ${data.b - data.e}, B − A = ${data.d - data.e}, fora de A ∪ B = ${data.S - data.c}.`
      : step === 'lapVenn3' ? `Aplicar Laplace: P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}.`
      : step === 'reasoningPlayback' ? 'Animação replay do raciocínio passo a passo (aluno solicitou "Não sei realmente").'
      : step === 'correct' ? `Resolvido: P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}. Pode escolher próximo caminho ou avançar.`
      : '';
    useTelemetryExercise(
      `twoDices-cena7-unionExercise4-${step}`,
      `Exercício 4 — Torcedores no bar (P(${data.targetLabel})) — ${stepLabelUE4}`,
      `Atividade global: contexto de torcedores em bar — Aluno calcula P(${data.targetLabel}) escolhendo entre caminhos Laplaciana (cardinalidade ou Venn) ou Fórmula Geral. | Eventos do problema atual: ${eventosBlocoUE4} | Fase atual: ${stepLabelUE4}. | Ação atual do aluno / cálculo: ${oQueCalculaUE4} | Texto base da fase: ${ex4StepDescriptions[step] ?? 'Cálculo de P(A∩B).'}`,
    );

    // ── Estado do Caminho 1.1 (Cardinalidade) ────────────────────
    const [card1Pos1, setCard1Pos1] = useState<ExprId>('');
    const [card1Pos2, setCard1Pos2] = useState<ExprId>('');
    const [card1Pos3, setCard1Pos3] = useState<ExprId>('');
    const [card1Pos4, setCard1Pos4] = useState<ExprId>('');

    // Helpers de feedback pros 4 ExprSelect da fórmula de cardinalidade
    // n(?) = n(?) + n(?) − n(?). Antes os onChange eram setCardNPosM direto,
    // sem som/alert — aluno escolhia opção e nada acontecia até validar.
    const exprLabelCard = useCallback((id: ExprId): string => {
      switch (id) {
        case 'A':   return 'A';
        case 'B':   return 'B';
        case 'AnB': return 'A ∩ B';
        case 'AmB': return 'A − B';
        case 'BmA': return 'B − A';
        case 'AuB': return 'A ∪ B';
        case 'AuB_minus_AnB': return '(A ∪ B) − (A ∩ B)';
        default: return '';
      }
    }, []);
    const playCardPosFeedback = useCallback((v: ExprId, expected: ExprId, posLabel: string) => {
      if (v === '') return;
      const respPos = `Montagem fórmula cardinalidade — posição ${posLabel} = "${exprLabelCard(v) || v}" (esperado: ${exprLabelCard(expected)})`;
      if (v === expected) {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `${posLabel}: ${exprLabelCard(expected)}.`, 'success', 2500, respPos);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', `Releia a posição ${posLabel} da fórmula da cardinalidade.`, 'error', 3500, respPos);
      }
    }, [createAlert, exprLabelCard]);
    const handleCard1Pos1Change = useCallback((v: ExprId) => {
      setCard1Pos1(v); playCardPosFeedback(v, 'AuB', 'n(...)');
    }, [playCardPosFeedback]);
    const handleCard1Pos2Change = useCallback((v: ExprId) => {
      setCard1Pos2(v); playCardPosFeedback(v, 'A', 'n(A)');
    }, [playCardPosFeedback]);
    const handleCard1Pos3Change = useCallback((v: ExprId) => {
      setCard1Pos3(v); playCardPosFeedback(v, 'B', 'n(B)');
    }, [playCardPosFeedback]);
    const handleCard1Pos4Change = useCallback((v: ExprId) => {
      setCard1Pos4(v); playCardPosFeedback(v, 'AnB', 'n(A ∩ B)');
    }, [playCardPosFeedback]);

    const [card2CInput, setCard2CInput] = useState('');
    const [card2BInput, setCard2BInput] = useState('');
    const [card2DInput, setCard2DInput] = useState('');
    const [card2Error, setCard2Error] = useState(false);

    const [card3Num, setCard3Num] = useState('');   // n(A∩B) = b+d−c → aluno digita o valor
    const [card3Error, setCard3Error] = useState(false);

    // Passo extra quando invertB: calcular n(A ∩ B̄) = n(A) − n(A ∩ B) = b − e
    const [card3bNum, setCard3bNum] = useState('');
    const [card3bError, setCard3bError] = useState(false);

    const [card4Num, setCard4Num] = useState('');
    const [card4Den, setCard4Den] = useState('');
    const [card4NumError, setCard4NumError] = useState(false);
    const [card4DenError, setCard4DenError] = useState(false);

    // ── Estado do Caminho 1.2 (Venn) ─────────────────────────────
    const [vennX, setVennX] = useState('');
    const [vennAmB, setVennAmB] = useState('');
    const [vennBmA, setVennBmA] = useState('');
    const [vennW, setVennW] = useState('');
    const [vennXError, setVennXError] = useState(false);
    const [vennAmBError, setVennAmBError] = useState(false);
    const [vennBmAError, setVennBmAError] = useState(false);
    const [vennWError, setVennWError] = useState(false);
    const [vennLocked, setVennLocked] = useState(false);

    // Variável escolhida pelo aluno no lapVenn1 (ex.: "x", "y", "z"...).
    // Propagada para lapVenn2 para validar consistência com a mesma letra.
    const [vennVar, setVennVar] = useState<string>('x');

    // Etapa 2 — Construção da equação e resolução
    //   Sub-passo A: n(A ∪ B) = ? (leitura do enunciado)
    const [vennAUnionB, setVennAUnionB] = useState('');
    const [vennAUnionBError, setVennAUnionBError] = useState(false);
    //   Sub-passo B: n(A∪B) = [n(A-B)] + [n(A∩B)] + [n(B-A)]
    const [vennEqAmB, setVennEqAmB] = useState('');
    const [vennEqAnB, setVennEqAnB] = useState('');
    const [vennEqBmA, setVennEqBmA] = useState('');
    const [vennEqAmBError, setVennEqAmBError] = useState(false);
    const [vennEqAnBError, setVennEqAnBError] = useState(false);
    const [vennEqBmAError, setVennEqBmAError] = useState(false);
    //   Sub-passo B.2: substituir n(A∪B) pelo valor numérico e simplificar
    //   Ex.: 95 = 34-x+x+64-x ou 95 = 98-x (equivalente simplificado)
    //   O aluno digita tanto o lado esquerdo (valor) quanto o direito (expressão)
    //   como ato deliberado de substituição algébrica.
    const [vennEqLhsValue, setVennEqLhsValue] = useState('');
    const [vennEqLhsValueError, setVennEqLhsValueError] = useState(false);
    const [vennEqSimplified, setVennEqSimplified] = useState('');
    const [vennEqSimplifiedError, setVennEqSimplifiedError] = useState(false);
    //   Sub-passo C: resolver a equação → x = ...
    const [vennXExpr, setVennXExpr] = useState('');
    const [vennXExprError, setVennXExprError] = useState(false);
    //   Sub-passo D: n(A ∩ B) = x = [valor numérico]
    const [vennXValue, setVennXValue] = useState('');
    const [vennXValueError, setVennXValueError] = useState(false);

    // Etapa 3 (lapVenn3): primeiro aluno identifica n(S) — espaço amostral —
    // e depois aplica Laplace com a fração P(target) = n(target)/n(S).
    const [vennNS, setVennNS] = useState('');
    const [vennNSError, setVennNSError] = useState(false);
    const [venn3Num, setVenn3Num] = useState('');
    const [venn3Den, setVenn3Den] = useState('');
    const [venn3NumError, setVenn3NumError] = useState(false);
    const [venn3DenError, setVenn3DenError] = useState(false);

    // ── Estado do Caminho 2 (Fórmula Geral) ──────────────────────
    const [g1CNum, setG1CNum] = useState('');
    const [g1CDen, setG1CDen] = useState('');
    const [g1BNum, setG1BNum] = useState('');
    const [g1BDen, setG1BDen] = useState('');
    const [g1DNum, setG1DNum] = useState('');
    const [g1DDen, setG1DDen] = useState('');
    const [g1Error, setG1Error] = useState(false);

    const [g2Num, setG2Num] = useState('');
    const [g2Den, setG2Den] = useState('');
    const [g2NumError, setG2NumError] = useState(false);
    const [g2DenError, setG2DenError] = useState(false);

    // Passo extra quando há inversão — P(target) = derivação de P(A ∩ B)
    const [g3Num, setG3Num] = useState('');
    const [g3Den, setG3Den] = useState('');
    const [g3NumError, setG3NumError] = useState(false);
    const [g3DenError, setG3DenError] = useState(false);

    // ── Sistema de ajuda ─────────────────────────────────────────
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showHint, setShowHint] = useState(false);

    // ── Qual caminho foi escolhido (para a animação final) ───────
    const [chosenPath, setChosenPath] = useState<'lapCard' | 'lapVenn' | 'general' | null>(null);
    const [completedPaths, setCompletedPaths] = useState<Set<'lapCard' | 'lapVenn' | 'general'>>(new Set());

    // ── Navegação dev ────────────────────────────────────────────
    const advanceStep = useCallback(() => {
      const idx = STEP_SEQUENCE.indexOf(step);
      if (idx < 0) return;
      if (idx === STEP_SEQUENCE.length - 1) { onFinished(); return; }
      playSound('/sounds/nextChallenge.mp3');
      setStep(STEP_SEQUENCE[idx + 1]);
    }, [step, onFinished]);

    const backStep = useCallback(() => {
      const idx = STEP_SEQUENCE.indexOf(step);
      if (idx > 0) {
        playSound('/sounds/clear.mp3');
        setStep(STEP_SEQUENCE[idx - 1]);
        return;
      }
      if (onRequestPreviousPhase) {
        playSound('/sounds/clear.mp3');
        onRequestPreviousPhase();
      }
    }, [step, onRequestPreviousPhase]);

    // Snapshot JSON v2 completo — Ex4 tem 3 paths (lapCard/lapVenn/general)
    // + Venn interativo com várias variáveis. Persiste TUDO menos *Error
    // (UI transitória) e showHint (animação). vennLocked É persistido pra
    // que F5 após validar lapVenn1 mantenha os inputs travados (sem isso,
    // F5 desbloqueia inputs já validados e o aluno pode invalidar a prova).
    const snapshotPayload = JSON.stringify({
      v: 2,
      step, round, data, hintsUsed, chosenPath,
      completedPaths: Array.from(completedPaths),
      card1Pos1, card1Pos2, card1Pos3, card1Pos4,
      card2CInput, card2BInput, card2DInput,
      card3Num, card3bNum,
      card4Num, card4Den,
      vennX, vennAmB, vennBmA, vennW, vennVar, vennLocked,
      vennAUnionB, vennEqAmB, vennEqAnB, vennEqBmA,
      vennEqLhsValue, vennEqSimplified,
      vennXExpr, vennXValue, vennNS,
      venn3Num, venn3Den,
      g1CNum, g1CDen, g1BNum, g1BDen, g1DNum, g1DDen,
      g2Num, g2Den, g3Num, g3Den,
    });
    useEffect(() => {
      onPhaseChange?.(snapshotPayload);
    }, [snapshotPayload, onPhaseChange]);

    // Suprime os useEffects de telemetria debouncada (prevVennInputsRef /
    // prevVenn2InputsRef) durante a janela do restore F5 — sem isso, F5
    // era interpretado como "aluno digitou" e gerava exercício fantasma.
    const isRestoringSnapshotRef = useRef(false);
    const applyPhaseId = useCallback((phaseId: string) => {
      isRestoringSnapshotRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => { isRestoringSnapshotRef.current = false; }, 700);
        });
      });
      try {
        const obj = JSON.parse(phaseId);
        if (obj && typeof obj === 'object') {
          if (typeof obj.step === 'string') setStep(obj.step as Step);
          if (typeof obj.round === 'number') setRound(obj.round);
          if (obj.data && typeof obj.data === 'object') setData(obj.data as Exercise4Data);
          if (typeof obj.hintsUsed === 'number') setHintsUsed(obj.hintsUsed);
          if (obj.chosenPath === null || obj.chosenPath === 'lapCard' || obj.chosenPath === 'lapVenn' || obj.chosenPath === 'general') setChosenPath(obj.chosenPath);
          if (Array.isArray(obj.completedPaths)) setCompletedPaths(new Set(obj.completedPaths));
          if (typeof obj.card1Pos1 === 'string') setCard1Pos1(obj.card1Pos1 as ExprId);
          if (typeof obj.card1Pos2 === 'string') setCard1Pos2(obj.card1Pos2 as ExprId);
          if (typeof obj.card1Pos3 === 'string') setCard1Pos3(obj.card1Pos3 as ExprId);
          if (typeof obj.card1Pos4 === 'string') setCard1Pos4(obj.card1Pos4 as ExprId);
          if (typeof obj.card2CInput === 'string') setCard2CInput(obj.card2CInput);
          if (typeof obj.card2BInput === 'string') setCard2BInput(obj.card2BInput);
          if (typeof obj.card2DInput === 'string') setCard2DInput(obj.card2DInput);
          if (typeof obj.card3Num === 'string') setCard3Num(obj.card3Num);
          if (typeof obj.card3bNum === 'string') setCard3bNum(obj.card3bNum);
          if (typeof obj.card4Num === 'string') setCard4Num(obj.card4Num);
          if (typeof obj.card4Den === 'string') setCard4Den(obj.card4Den);
          if (typeof obj.vennX === 'string') setVennX(obj.vennX);
          if (typeof obj.vennAmB === 'string') setVennAmB(obj.vennAmB);
          if (typeof obj.vennBmA === 'string') setVennBmA(obj.vennBmA);
          if (typeof obj.vennW === 'string') setVennW(obj.vennW);
          if (typeof obj.vennVar === 'string') setVennVar(obj.vennVar);
          if (typeof obj.vennLocked === 'boolean') setVennLocked(obj.vennLocked);
          if (typeof obj.vennAUnionB === 'string') setVennAUnionB(obj.vennAUnionB);
          if (typeof obj.vennEqAmB === 'string') setVennEqAmB(obj.vennEqAmB);
          if (typeof obj.vennEqAnB === 'string') setVennEqAnB(obj.vennEqAnB);
          if (typeof obj.vennEqBmA === 'string') setVennEqBmA(obj.vennEqBmA);
          if (typeof obj.vennEqLhsValue === 'string') setVennEqLhsValue(obj.vennEqLhsValue);
          if (typeof obj.vennEqSimplified === 'string') setVennEqSimplified(obj.vennEqSimplified);
          if (typeof obj.vennXExpr === 'string') setVennXExpr(obj.vennXExpr);
          if (typeof obj.vennXValue === 'string') setVennXValue(obj.vennXValue);
          if (typeof obj.vennNS === 'string') setVennNS(obj.vennNS);
          if (typeof obj.venn3Num === 'string') setVenn3Num(obj.venn3Num);
          if (typeof obj.venn3Den === 'string') setVenn3Den(obj.venn3Den);
          if (typeof obj.g1CNum === 'string') setG1CNum(obj.g1CNum);
          if (typeof obj.g1CDen === 'string') setG1CDen(obj.g1CDen);
          if (typeof obj.g1BNum === 'string') setG1BNum(obj.g1BNum);
          if (typeof obj.g1BDen === 'string') setG1BDen(obj.g1BDen);
          if (typeof obj.g1DNum === 'string') setG1DNum(obj.g1DNum);
          if (typeof obj.g1DDen === 'string') setG1DDen(obj.g1DDen);
          if (typeof obj.g2Num === 'string') setG2Num(obj.g2Num);
          if (typeof obj.g2Den === 'string') setG2Den(obj.g2Den);
          if (typeof obj.g3Num === 'string') setG3Num(obj.g3Num);
          if (typeof obj.g3Den === 'string') setG3Den(obj.g3Den);
          return;
        }
      } catch { /* formato antigo */ }
      setStep(phaseId as Step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const didInitialRestoreRef = useRef(false);
    useEffect(() => {
      if (didInitialRestoreRef.current) return;
      didInitialRestoreRef.current = true;
      if (initialPhaseSnapshot) applyPhaseId(initialPhaseSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      advance: advanceStep,
      back: backStep,
      canAdvance: () => true,
      canBack: () => step !== 'intro' || !!onRequestPreviousPhase,
      getCurrentPhaseId: () => snapshotPayload,
      setCurrentPhaseId: applyPhaseId,
    }), [advanceStep, backStep, step, onRequestPreviousPhase, snapshotPayload, applyPhaseId]);

    // ── Helpers de reset ────────────────────────────────────────
    const resetCardState = useCallback(() => {
      setCard1Pos1(''); setCard1Pos2(''); setCard1Pos3(''); setCard1Pos4('');
      setCard2CInput(''); setCard2BInput(''); setCard2DInput(''); setCard2Error(false);
      setCard3Num(''); setCard3Error(false);
      setCard3bNum(''); setCard3bError(false);
      setCard4Num(''); setCard4Den(''); setCard4NumError(false); setCard4DenError(false);
    }, []);
    const resetVennState = useCallback(() => {
      setVennX(''); setVennAmB(''); setVennBmA(''); setVennW('');
      setVennXError(false); setVennAmBError(false); setVennBmAError(false); setVennWError(false);
      setVennLocked(false);
      setVennVar('x');
      setVennAUnionB(''); setVennAUnionBError(false);
      setVennEqAmB(''); setVennEqAnB(''); setVennEqBmA('');
      setVennEqAmBError(false); setVennEqAnBError(false); setVennEqBmAError(false);
      setVennEqLhsValue(''); setVennEqLhsValueError(false);
      setVennEqSimplified(''); setVennEqSimplifiedError(false);
      setVennXExpr(''); setVennXExprError(false);
      setVennXValue(''); setVennXValueError(false);
      setVennNS(''); setVennNSError(false);
      setVenn3Num(''); setVenn3Den(''); setVenn3NumError(false); setVenn3DenError(false);
    }, []);
    const resetGeneralState = useCallback(() => {
      setG1CNum(''); setG1CDen(''); setG1BNum(''); setG1BDen(''); setG1DNum(''); setG1DDen('');
      setG1Error(false);
      setG2Num(''); setG2Den(''); setG2NumError(false); setG2DenError(false);
      setG3Num(''); setG3Den(''); setG3NumError(false); setG3DenError(false);
    }, []);

    // Telemetria debouncada — registra digitação dos 4 campos do diagrama
    // Venn no lapVenn1 (variável x, A−B, B−A, C/w). Sem isso, só o clique em
    // "Validar diagrama" aparecia na coleta; mudanças intermediárias ficavam
    // mudas. Guard `step === 'lapVenn1'` evita falsos positivos quando o
    // resetVennState zera os campos ao trocar de problema.
    const prevVennInputsRef = useRef<{ x: string; amb: string; bma: string; w: string } | null>(null);
    useEffect(() => {
      const cur = { x: vennX, amb: vennAmB, bma: vennBmA, w: vennW };
      const prev = prevVennInputsRef.current;
      if (prev === null) { prevVennInputsRef.current = cur; return; }
      if (prev.x === cur.x && prev.amb === cur.amb && prev.bma === cur.bma && prev.w === cur.w) return;
      prevVennInputsRef.current = cur;
      if (isRestoringSnapshotRef.current) return;
      if (step !== 'lapVenn1') return;
      const handle = window.setTimeout(() => {
        const parts: string[] = [];
        if (prev.x !== cur.x) parts.push(`variável n(A ∩ B) = "${cur.x || '_'}"`);
        if (prev.amb !== cur.amb) parts.push(`n(A − B) = "${cur.amb || '_'}"`);
        if (prev.bma !== cur.bma) parts.push(`n(B − A) = "${cur.bma || '_'}"`);
        if (prev.w !== cur.w) parts.push(`C = "${cur.w || '_'}"`);
        if (parts.length === 0) return;
        telemetryRecordInteracaoExercicio(
          `UE4 lapVenn1 — digitou ${parts.join(' ; ')}`,
        );
      }, 600);
      return () => window.clearTimeout(handle);
    }, [vennX, vennAmB, vennBmA, vennW, step]);

    // Telemetria debouncada — mesma técnica, agora para os 8 campos do
    // lapVenn2 (n(A∪B), 3 expressões da equação, LHS substituído, RHS
    // simplificado, expressão opcional p/ x, valor final de x). Guard de
    // step evita falsos positivos no reset entre rodadas.
    const prevVenn2InputsRef = useRef<{
      union: string; amb: string; anb: string; bma: string;
      lhs: string; simpl: string; xExpr: string; xVal: string;
    } | null>(null);
    useEffect(() => {
      const cur = {
        union: vennAUnionB, amb: vennEqAmB, anb: vennEqAnB, bma: vennEqBmA,
        lhs: vennEqLhsValue, simpl: vennEqSimplified, xExpr: vennXExpr, xVal: vennXValue,
      };
      const prev = prevVenn2InputsRef.current;
      if (prev === null) { prevVenn2InputsRef.current = cur; return; }
      const changed = (Object.keys(cur) as Array<keyof typeof cur>).some(k => prev[k] !== cur[k]);
      if (!changed) return;
      prevVenn2InputsRef.current = cur;
      if (isRestoringSnapshotRef.current) return;
      if (step !== 'lapVenn2') return;
      const handle = window.setTimeout(() => {
        const parts: string[] = [];
        if (prev.union !== cur.union) parts.push(`n(A ∪ B) [enunciado] = "${cur.union || '_'}"`);
        if (prev.amb !== cur.amb) parts.push(`equação n(A−B) = "${cur.amb || '_'}"`);
        if (prev.anb !== cur.anb) parts.push(`equação n(A∩B) = "${cur.anb || '_'}"`);
        if (prev.bma !== cur.bma) parts.push(`equação n(B−A) = "${cur.bma || '_'}"`);
        if (prev.lhs !== cur.lhs) parts.push(`substituição LHS = "${cur.lhs || '_'}"`);
        if (prev.simpl !== cur.simpl) parts.push(`RHS simplificado = "${cur.simpl || '_'}"`);
        if (prev.xExpr !== cur.xExpr) parts.push(`expressão p/ ${vennVar} (opcional) = "${cur.xExpr || '_'}"`);
        if (prev.xVal !== cur.xVal) parts.push(`valor final ${vennVar} = "${cur.xVal || '_'}"`);
        if (parts.length === 0) return;
        telemetryRecordInteracaoExercicio(`UE4 lapVenn2 — digitou ${parts.join(' ; ')}`);
      }, 600);
      return () => window.clearTimeout(handle);
    }, [
      vennAUnionB, vennEqAmB, vennEqAnB, vennEqBmA,
      vennEqLhsValue, vennEqSimplified, vennXExpr, vennXValue,
      step, vennVar,
    ]);

    const resetAllPaths = useCallback(() => {
      resetCardState(); resetVennState(); resetGeneralState();
      setHintsUsed(0); setShowHint(false); setChosenPath(null);
    }, [resetCardState, resetVennState, resetGeneralState]);

    const resetForNewRound = useCallback(() => {
      const newData = selectExercise4Data(round + 1);
      setData(newData);
      setRound(r => r + 1);
      setStep('intro');
      resetAllPaths();
      setCompletedPaths(new Set());
    }, [round, resetAllPaths]);

    useEffect(() => { void data; }, [data]); // noop para silenciar linters

    // ── Sistema de ajuda (quando mostrar botão "Não sei realmente") ──
    const maxHints = 4;
    const showNoIdeaButton = hintsUsed >= maxHints;
    const useHint = useCallback(() => {
      if (hintsUsed >= maxHints) return;
      const nextN = hintsUsed + 1;
      telemetryRecordInteracaoExercicio(
        `UE4 — clicou em "Ajuda" no step "${step}" — pediu dica ${nextN} de ${maxHints} (restam ${maxHints - nextN})`,
      );
      setHintsUsed(h => h + 1);
      setShowHint(true);
      playSound('/sounds/clear.mp3');
    }, [hintsUsed, step]);

    // Rola pro topo do OVA em todo Conferir. Mirror do checkAnswer do Disco.
    const scrollDiceToTop = () => {
      requestAnimationFrame(() => {
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    // ── Validações de cada sub-passo ────────────────────────────

    // Caminho 1.1 — Etapa 1: fórmula n(A∪B) = n(A) + n(B) − n(A∩B)
    const card1Ok = card1Pos1 === 'AuB' && card1Pos2 === 'A' && card1Pos3 === 'B' && card1Pos4 === 'AnB';
    const validateCard1 = () => {
      scrollDiceToTop();
      const respSnap =
        `UE4 lapCard1 Validar — montou n("${exprLabelCard(card1Pos1) || '?'}") = ` +
        `n("${exprLabelCard(card1Pos2) || '?'}") + ` +
        `n("${exprLabelCard(card1Pos3) || '?'}") − ` +
        `n("${exprLabelCard(card1Pos4) || '?'}") ` +
        `(esperado: n(A ∪ B) = n(A) + n(B) − n(A ∩ B))`;
      if (card1Ok) {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Fórmula montada: n(A ∪ B) = n(A) + n(B) − n(A ∩ B).', 'success', 3500, respSnap);
        setStep('lapCard2');
        setShowHint(false);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Reposicione as cartas para formar a fórmula da cardinalidade.', 'error', 4500, respSnap);
      }
    };

    // Caminho 1.1 — Etapa 2: c = b + d − n(A∩B)
    const validateCard2 = () => {
      scrollDiceToTop();
      const cOk = parseInt(card2CInput, 10) === data.c;
      const bOk = parseInt(card2BInput, 10) === data.b;
      const dOk = parseInt(card2DInput, 10) === data.d;
      const respSnap = `UE4 lapCard2 Validar — substituiu n(A ∪ B)="${card2CInput || '_'}", n(A)="${card2BInput || '_'}", n(B)="${card2DInput || '_'}" (esperado: ${data.c}, ${data.b}, ${data.d})`;
      if (cOk && bOk && dOk) {
        setCard2Error(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Valores substituídos na fórmula.', 'success', 3000, respSnap);
        setStep('lapCard3');
        setShowHint(false);
      } else {
        setCard2Error(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Releia o enunciado e substitua n(A ∪ B), n(A) e n(B) pelos valores numéricos.', 'error', 5000, respSnap);
      }
    };

    // Caminho 1.1 — Etapa 3: n(A∩B) = b + d − c (valor: data.e)
    const validateCard3 = () => {
      scrollDiceToTop();
      const parsed = parseInt(card3Num, 10);
      const respSnap = `UE4 lapCard3 Validar — digitou n(A ∩ B) = "${card3Num || '_'}" (esperado: ${data.e})`;
      if (parsed === data.e) {
        setCard3Error(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `n(A ∩ B) = ${data.e}.`, 'success', 3000, respSnap);
        // Se há inversão (A ou B), precisa etapa 3b; senão, vai direto ao Laplace
        setStep((data.invertA || data.invertB) ? 'lapCard3b' : 'lapCard4');
        setShowHint(false);
      } else {
        setCard3Error(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Isole n(A ∩ B) na equação da etapa anterior.', 'error', 4500, respSnap);
      }
    };

    // Caminho 1.1 — Etapa 3b (SÓ quando invertA || invertB):
    // calcular n(target) a partir de n(A ∩ B) já obtido.
    //   (F, T): n(A ∩ B̄) = b − e
    //   (T, F): n(Ā ∩ B) = d − e
    //   (T, T): n(Ā ∩ B̄) = S − c
    const validateCard3b = () => {
      scrollDiceToTop();
      const parsed = parseInt(card3bNum, 10);
      const respSnap = `UE4 lapCard3b Validar — digitou n(${data.targetLabel}) = "${card3bNum || '_'}" (esperado: ${data.targetCardinality})`;
      if (parsed === data.targetCardinality) {
        setCard3bError(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `n(${data.targetLabel}) = ${data.targetCardinality}.`, 'success', 3000, respSnap);
        setStep('lapCard4');
        setShowHint(false);
      } else {
        setCard3bError(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', `Calcule n(${data.targetLabel}) a partir de n(A ∩ B) que você acabou de obter.`, 'error', 5000, respSnap);
      }
    };

    // Caminho 1.1 — Etapa 4: P(target) = targetCardinality / S
    const validateCard4 = () => {
      scrollDiceToTop();
      const v = validateFracSep(card4Num, card4Den, data.targetCardinality, data.S);
      setCard4NumError(v.numError); setCard4DenError(v.denError);
      const respFrac = `Caminho Cardinalidade — P(${data.targetLabel}) = ${card4Num || '_'}/${card4Den || '_'} (esperado: ${data.targetCardinality}/${data.S})`;
      if (v.ok) {
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}. Caminho concluído.`, 'success', 4000, respFrac);
        setCompletedPaths(prev => new Set(prev).add('lapCard'));
        setStep('correct');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', `Aplique Laplace: n(${data.targetLabel}) sobre n(S). Frações equivalentes são aceitas.`, 'error', 5000, respFrac);
      }
    };

    // Caminho 1.2 — Etapa 1 (Venn): o aluno preenche com EXPRESSÕES ALGÉBRICAS
    // para modelar o problema. Convenção: chame a variável desconhecida de x,
    // y, z, t... (qualquer letra, exceto as reservadas do problema b, d, s, c, w).
    //
    // Passo 1: detecta a variável escolhida a partir do campo A ∩ B
    //   (por convenção, o aluno escreve apenas uma letra nesse campo).
    // Passo 2: valida os outros campos usando essa letra.
    //
    //   Região A ∩ B:  aceita qualquer letra não-reservada ("x", "y", "t", "k"...)
    //   Região A − B:  aceita "b-<letra>" ou "<b>-<letra>"
    //   Região B − A:  aceita "d-<letra>" ou "<d>-<letra>"
    //   Região fora (C): aceita "S-c", números equivalentes, "w" ou o próprio valor
    //
    // Normaliza espaços e unifica traços Unicode (− U+2212) com hífen ASCII.
    const validateVenn1 = () => {
      scrollDiceToTop();
      const normalize = (s: string) =>
        s.trim()
         .replace(/\s+/g, '')
         .replace(/[−–—]/g, '-')  // unifica sinais de menos Unicode → hífen ASCII
         .toLowerCase();

      const nX = normalize(vennX);
      const nW = data.hasOthers ? normalize(vennW) : '';

      // A variável de n(A ∩ B) é qualquer letra (ou palavra curta) que
      // não conflite com os símbolos reservados do problema.
      const reservedLetters = new Set(['b', 'd', 's', 'c', 'w']);
      const isLetterOnly = /^[a-z]+$/.test(nX);
      const xVar = isLetterOnly && !reservedLetters.has(nX) ? nX : null;
      const xOk = xVar !== null;

      // Validação semântica das regiões — aceita qualquer ordem de parcelas
      // ou reescrita algébrica equivalente.
      //   n(A − B) = b − xVar  →  constant = b, coefficient = −1
      //   n(B − A) = d − xVar  →  constant = d, coefficient = −1
      let amBOk = false;
      let bmAOk = false;
      if (xOk) {
        const amBEval = evaluateLinearExpression(vennAmB, xVar, data.b, data.d, data.c);
        amBOk = amBEval !== null &&
          amBEval.constant === data.b &&
          amBEval.coefficient === -1;
        const bmAEval = evaluateLinearExpression(vennBmA, xVar, data.b, data.d, data.c);
        bmAOk = bmAEval !== null &&
          bmAEval.constant === data.d &&
          bmAEval.coefficient === -1;
      }

      const acceptableW = ['s-c', `${data.S}-${data.c}`, 'w', `${data.w}`];
      const wOk = !data.hasOthers || acceptableW.includes(nW);

      setVennXError(!xOk);
      setVennAmBError(!amBOk);
      setVennBmAError(!bmAOk);
      setVennWError(!wOk);

      const respVenn1 =
        `UE4 lapVenn1 Validar diagrama — aluno preencheu: ` +
        `n(A ∩ B) variável = "${vennX || '(vazio)'}" ${xOk ? '✓' : `✗ (esperado: uma letra única, ex. x — não pode ser ${[...reservedLetters].join('/')})`}, ` +
        `n(A − B) = "${vennAmB || '(vazio)'}" ${amBOk ? '✓' : `✗ (esperado: ${data.b} − ${xVar ?? 'x'} ou equivalente)`}, ` +
        `n(B − A) = "${vennBmA || '(vazio)'}" ${bmAOk ? '✓' : `✗ (esperado: ${data.d} − ${xVar ?? 'x'} ou equivalente)`}` +
        (data.hasOthers ? `, C = "${vennW || '(vazio)'}" ${wOk ? '✓' : `✗ (esperado: ${data.S} − ${data.c} = ${data.w}, ou "w", ou "${data.w}")`}` : '');
      if (xOk && amBOk && bmAOk && wOk) {
        setVennVar(xVar!);       // propaga a letra escolhida para lapVenn2
        setVennLocked(true);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `Diagrama modelado com a variável "${xVar!}".`, 'success', 3500, respVenn1);
        setStep('lapVenn2');
        setShowHint(false);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Use uma letra para n(A ∩ B) e expresse as outras regiões em função dela.', 'error', 5500, respVenn1);
      }
    };

    // Caminho 1.2 — Etapa 2: monta a equação e resolve para a variável.
    //   Sub-passo A: aluno identifica n(A ∪ B) no enunciado.
    //   Sub-passo B: repete as expressões do diagrama na equação.
    //   Sub-passo C (OPCIONAL): expressão de resolução para x. Aluno avançado
    //     pode pular, indo direto para D. Respeita TOMLINSON (diferenciação).
    //   Sub-passo D: valor numérico final de x = n(A ∩ B).
    const validateVenn2 = () => {
      scrollDiceToTop();
      const v = vennVar; // letra escolhida no lapVenn1 (propagada)

      // A: n(A ∪ B) deve ser o valor c do enunciado
      const unionParsed = parseInt(vennAUnionB.trim(), 10);
      const unionOk = unionParsed === data.c;

      // B: equação com as 3 expressões (mesma letra v). Validação semântica —
      // aceita qualquer ordem de parcelas ou reescrita algébrica equivalente.
      //   n(A−B) = b − v   →  constant = b, coefficient = −1
      //   n(A∩B) = v       →  constant = 0, coefficient = +1
      //   n(B−A) = d − v   →  constant = d, coefficient = −1
      const eqAmBEval = evaluateLinearExpression(vennEqAmB, v, data.b, data.d, data.c);
      const eqAmBOk = eqAmBEval !== null &&
        eqAmBEval.constant === data.b &&
        eqAmBEval.coefficient === -1;

      const eqAnBEval = evaluateLinearExpression(vennEqAnB, v, data.b, data.d, data.c);
      const eqAnBOk = eqAnBEval !== null &&
        eqAnBEval.constant === 0 &&
        eqAnBEval.coefficient === 1;

      const eqBmAEval = evaluateLinearExpression(vennEqBmA, v, data.b, data.d, data.c);
      const eqBmAOk = eqBmAEval !== null &&
        eqBmAEval.constant === data.d &&
        eqBmAEval.coefficient === -1;

      // B.2: substituição de n(A∪B) pelo valor numérico e simplificação.
      //   Lado esquerdo (LHS): aluno digita o valor de n(A∪B) = c (ato de substituição)
      //   Lado direito (RHS): expressão linear equivalente a b + d − v
      //     (valida por forma canônica: constant = b+d, coefficient de v = -1;
      //      ordem das parcelas não importa).
      const lhsParsed = parseInt(vennEqLhsValue.trim(), 10);
      const eqLhsOk = lhsParsed === data.c;

      const simplEval = evaluateLinearExpression(vennEqSimplified, v, data.b, data.d, data.c);
      const eqSimplOk =
        simplEval !== null &&
        simplEval.constant === data.b + data.d &&
        simplEval.coefficient === -1;

      // C: resolução (OPCIONAL). Aceita qualquer expressão que avalie ao valor data.e
      //    (que é b + d − c). Suporta expressões como "b+d-c", "80+58-89",
      //    "138-89", "49", ou mesmo formas com a variável como "c-(b-x+d-x)"
      //    que simplifica para b+d-c = const + 0·v.
      const nXExprRaw = vennXExpr.trim();
      const exprEmpty = nXExprRaw === '';
      let exprOk = exprEmpty;
      if (!exprOk) {
        const xExprEval = evaluateLinearExpression(nXExprRaw, v, data.b, data.d, data.c);
        exprOk =
          xExprEval !== null &&
          xExprEval.constant === data.e &&
          xExprEval.coefficient === 0;
      }

      // D: valor numérico final de x (OBRIGATÓRIO)
      const xValueParsed = parseInt(vennXValue.trim(), 10);
      const xValueOk = xValueParsed === data.e;

      setVennAUnionBError(!unionOk);
      setVennEqAmBError(!eqAmBOk);
      setVennEqAnBError(!eqAnBOk);
      setVennEqBmAError(!eqBmAOk);
      setVennEqLhsValueError(!eqLhsOk);
      setVennEqSimplifiedError(!eqSimplOk);
      setVennXExprError(!exprOk);
      setVennXValueError(!xValueOk);

      // Snapshot completo dos 8 campos do lapVenn2 com status por campo (✓/✗
      // + esperado). Antes a resposta_usuario só dizia "Tente novamente" ou
      // "Equação resolvida: x = N", sem indicar QUAL campo o aluno errou nem
      // o que ele digitou em cada um — perdíamos rastro pedagógico.
      const respVenn2 =
        `UE4 lapVenn2 Validar — ` +
        `n(A ∪ B) [valor do enunciado] = "${vennAUnionB || '_'}" ${unionOk ? '✓' : `✗ (esperado: ${data.c})`} | ` +
        `equação RHS: n(A−B) = "${vennEqAmB || '_'}" ${eqAmBOk ? '✓' : `✗ (esperado: ${data.b} − ${v} ou equivalente)`}, ` +
        `n(A∩B) = "${vennEqAnB || '_'}" ${eqAnBOk ? '✓' : `✗ (esperado: ${v})`}, ` +
        `n(B−A) = "${vennEqBmA || '_'}" ${eqBmAOk ? '✓' : `✗ (esperado: ${data.d} − ${v} ou equivalente)`} | ` +
        `substituição: LHS = "${vennEqLhsValue || '_'}" ${eqLhsOk ? '✓' : `✗ (esperado: ${data.c})`}, ` +
        `RHS simplificado = "${vennEqSimplified || '_'}" ${eqSimplOk ? '✓' : `✗ (esperado: ${data.b} + ${data.d} − ${v} = ${data.b + data.d} − ${v} ou equivalente)`} | ` +
        `${v} (expressão opcional) = "${vennXExpr || '(em branco)'}" ${exprOk ? '✓' : `✗ (esperado: expressão que avalia para ${data.e}, ex. ${data.b} + ${data.d} − ${data.c})`} | ` +
        `${v} (valor final OBRIGATÓRIO) = "${vennXValue || '_'}" ${xValueOk ? '✓' : `✗ (esperado: ${data.e})`}`;
      if (unionOk && eqAmBOk && eqAnBOk && eqBmAOk && eqLhsOk && eqSimplOk && exprOk && xValueOk) {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `Equação resolvida: ${v} = ${data.e}.`, 'success', 3500, respVenn2);
        setStep('lapVenn3');
        setShowHint(false);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Confira as expressões, a substituição e o valor da variável.', 'error', 5000, respVenn2);
      }
    };

    // Caminho 1.2 — Etapa 3: identifica n(S) e aplica Laplace.
    //   Sub-passo 3.a: aluno digita n(S) — o total de pessoas no bar
    //                  (identificação do espaço amostral).
    //   Sub-passo 3.b: aplica Laplace P(target) = n(target)/n(S).
    const validateVenn3 = () => {
      scrollDiceToTop();
      const nsParsed = parseInt(vennNS.trim(), 10);
      const nsOk = nsParsed === data.S;
      setVennNSError(!nsOk);

      const v = validateFracSep(venn3Num, venn3Den, data.targetCardinality, data.S);
      setVenn3NumError(v.numError); setVenn3DenError(v.denError);
      const respFrac = `Caminho Venn — n(S)=${vennNS || '_'} (esperado ${data.S}); P(${data.targetLabel}) = ${venn3Num || '_'}/${venn3Den || '_'} (esperado: ${data.targetCardinality}/${data.S})`;

      if (nsOk && v.ok) {
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}. Caminho do Venn concluído.`, 'success', 4000, respFrac);
        setCompletedPaths(prev => new Set(prev).add('lapVenn'));
        setStep('correct');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Identifique n(S) e aplique Laplace.', 'error', 5000, respFrac);
      }
    };

    // Caminho 2 — Etapa 1: substituição das 3 frações em P(A∪B)=P(A)+P(B)−P(A∩B)
    const validateG1 = () => {
      scrollDiceToTop();
      const cOk = isEquivalentFraction(g1CNum, g1CDen, data.c, data.S);
      const bOk = isEquivalentFraction(g1BNum, g1BDen, data.b, data.S);
      const dOk = isEquivalentFraction(g1DNum, g1DDen, data.d, data.S);
      const respFrac =
        `Caminho Geral G1 (substituições) — ` +
        `P(A∪B)=${g1CNum || '_'}/${g1CDen || '_'}, ` +
        `P(A)=${g1BNum || '_'}/${g1BDen || '_'}, ` +
        `P(B)=${g1DNum || '_'}/${g1DDen || '_'} ` +
        `(esperado: ${data.c}/${data.S}, ${data.b}/${data.S}, ${data.d}/${data.S})`;
      if (cOk && bOk && dOk) {
        setG1Error(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'As 3 probabilidades foram substituídas na fórmula.', 'success', 3500, respFrac);
        setStep('general2');
        setShowHint(false);
      } else {
        setG1Error(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', `Substitua P(A ∪ B), P(A) e P(B) por valores sobre ${data.S}.`, 'error', 5000, respFrac);
      }
    };

    // Caminho 2 — Etapa 2: P(A∩B) = e/S (sempre calcula a interseção original;
    // se há inversão, o ajuste vem no passo general3 a seguir).
    const validateG2 = () => {
      scrollDiceToTop();
      const v = validateFracSep(g2Num, g2Den, data.e, data.S);
      setG2NumError(v.numError); setG2DenError(v.denError);
      const respFrac = `Caminho Geral G2 — P(A ∩ B) = ${g2Num || '_'}/${g2Den || '_'} (esperado: ${data.e}/${data.S})`;
      if (v.ok) {
        playSound('/sounds/correct.mp3');
        // Se há inversão, faz passo 3; senão, finaliza
        if (data.invertA || data.invertB) {
          createAlert?.('Correto!', `P(A ∩ B) = ${data.e}/${data.S}. Falta ajustar para o evento pedido.`, 'success', 3500, respFrac);
          setStep('general3');
        } else {
          playSound('/sounds/challengeFinished.mp3');
          createAlert?.('Excelente!', `P(A ∪ B) = ${data.e}/${data.S}. Caminho geral concluído.`, 'success', 4000, respFrac);
          setCompletedPaths(prev => new Set(prev).add('general'));
          setStep('correct');
        }
        setShowHint(false);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Isole P(A ∩ B) na equação e simplifique.', 'error', 4500, respFrac);
      }
    };

    // Caminho 2 — Etapa 3 (SÓ quando invertA || invertB):
    // ajuste final da probabilidade a partir de P(A ∩ B).
    //   (F, T): P(A ∩ B̄) = P(A) − P(A ∩ B)       = (b − e)/S
    //   (T, F): P(Ā ∩ B) = P(B) − P(A ∩ B)       = (d − e)/S
    //   (T, T): P(Ā ∩ B̄) = 1 − P(A ∪ B)          = (S − c)/S = w/S
    const validateG3 = () => {
      scrollDiceToTop();
      const v = validateFracSep(g3Num, g3Den, data.targetCardinality, data.S);
      setG3NumError(v.numError); setG3DenError(v.denError);
      const respFrac = `Caminho Geral G3 — P(${data.targetLabel}) = ${g3Num || '_'}/${g3Den || '_'} (esperado: ${data.targetCardinality}/${data.S})`;
      if (v.ok) {
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}. Caminho geral concluído.`, 'success', 4000, respFrac);
        setCompletedPaths(prev => new Set(prev).add('general'));
        setStep('correct');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', `Use a relação entre P(A ∩ B) e P(${data.targetLabel}).`, 'error', 5000, respFrac);
      }
    };

    // ── Helpers de entrada em caminhos ──────────────────────────
    const choosePath = (p: 'lapCard' | 'lapVenn' | 'general') => {
      const lbl = p === 'lapCard' ? 'Cardinalidade da União (Abordagem Laplaciana)'
                : p === 'lapVenn' ? 'Diagrama de Venn (Abordagem Laplaciana)'
                : 'Fórmula Geral da Probabilidade da União';
      telemetryRecordInteracaoExercicio(`UE4 — escolheu caminho: "${lbl}" (id=${p}) — entrou no primeiro passo dessa estratégia`);
      setChosenPath(p);
      setHintsUsed(0);
      setShowHint(false);
      if (p === 'lapCard') setStep('lapCard1');
      else if (p === 'lapVenn') setStep('lapVenn1');
      else setStep('general1');
      playSound('/sounds/nextChallenge.mp3');
    };

    // ── Dicas por step (sistema de ajuda) ───────────────────────
    const currentHint = useMemo((): string | null => {
      if (!showHint) return null;
      // Cada step tem até 4 dicas escalonadas
      const hints: Record<string, string[]> = {
        lapCard1: [
          'Pense: o que a fórmula da cardinalidade da união relaciona?',
          'O lado esquerdo da fórmula é o número de elementos da união.',
          'À direita, some as cardinalidades individuais e subtraia a da interseção.',
          'A fórmula é: n(A ∪ B) = n(A) + n(B) − n(A ∩ B).',
        ],
        lapCard2: [
          `n(A ∪ B) corresponde ao valor c do enunciado.`,
          `n(A) corresponde ao valor b e n(B) ao valor d.`,
          `Substitua diretamente: c = b + d − n(A ∩ B).`,
          `No seu problema: ${data.c} = ${data.b} + ${data.d} − n(A ∩ B).`,
        ],
        lapCard3: [
          'Isole n(A ∩ B) na equação anterior.',
          'n(A ∩ B) = b + d − c.',
          `Substitua: n(A ∩ B) = ${data.b} + ${data.d} − ${data.c}.`,
          `Então n(A ∩ B) = ${data.e}.`,
        ],
        lapCard3b: buildCard3bHints(data),
        lapCard4: [
          'Aplique Laplace: P(E) = n(E)/n(S).',
          `n(S) = ${data.S}.`,
          `Numerador é o n(${data.targetLabel}) que você acabou de calcular.`,
          `P(${data.targetLabel}) = ${data.targetCardinality}/${data.S}.`,
        ],
        lapVenn1: [
          'Chame x = n(A ∩ B). No Venn, x vai na região central.',
          'A região A − B tem b − x elementos; B − A tem d − x.',
          'Fora: w = S − c elementos. A soma dos 4 deve dar S.',
          `No seu problema: x = ${data.e}, A − B = ${data.b - data.e}, B − A = ${data.d - data.e}${data.hasOthers ? `, outros = ${data.w}` : ''}.`,
        ],
        lapVenn2: [
          `Primeiro identifique n(A ∪ B) no enunciado — é o valor c.`,
          `Na equação, repita no lado direito as mesmas expressões que preencheu no diagrama.`,
          `Ao substituir n(A ∪ B) pelo valor, você pode simplificar: ${data.b} − ${vennVar} + ${vennVar} + ${data.d} − ${vennVar} = ${data.b + data.d} − ${vennVar}.`,
          `Então ${data.c} = ${data.b + data.d} − ${vennVar}, logo ${vennVar} = ${data.b + data.d} − ${data.c} = ${data.e}.`,
        ],
        lapVenn3: buildLapVenn3Hints(data),
        general1: [
          'A fórmula geral: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
          'P(A ∪ B) = c/S, P(A) = b/S, P(B) = d/S.',
          `Substitua as frações: ${data.c}/${data.S} = ${data.b}/${data.S} + ${data.d}/${data.S} − P(A ∩ B).`,
          'Preencha os três campos de fração com esses valores.',
        ],
        general2: [
          'Isole P(A ∩ B): P(A ∩ B) = P(A) + P(B) − P(A ∪ B).',
          `Substitua: P(A ∩ B) = ${data.b}/${data.S} + ${data.d}/${data.S} − ${data.c}/${data.S}.`,
          `Some no numerador comum: P(A ∩ B) = (b + d − c)/S.`,
          `Resposta: ${data.e}/${data.S}.`,
        ],
        general3: buildGeneral3Hints(data),
      };
      const arr = hints[step];
      if (!arr) return null;
      const idx = Math.min(hintsUsed - 1, arr.length - 1);
      return idx >= 0 ? arr[idx] : null;
    }, [showHint, step, hintsUsed, data, vennVar]);

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    const Enunciado = (
      <>
      <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter mb-micro">
        <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
          Problema
        </p>
        <p className="ds-body text-neutral-black text-justify leading-relaxed">
          Em dia de jogo entre o <strong>Clube Atlético Mineiro</strong> e o{' '}
          <strong>Cruzeiro Esporte Clube</strong>, <strong>{data.S}</strong> torcedores se
          reúnem em um bar para assistir à partida no telão. Sabe-se que:
        </p>
        <ul className="ds-body text-neutral-black pl-xxs list-disc leading-relaxed">
          <li><strong>{data.b} pessoas</strong> <em>{data.descA}</em>;</li>
          <li><strong>{data.d} pessoas</strong> <em>{data.descB}</em>;</li>
          <li><strong>{data.c} pessoas</strong> pertencem a pelo menos um desses dois grupos.</li>
        </ul>
        {data.hasOthers && (
          <p className="ds-body text-neutral-black mt-nano text-justify leading-relaxed">
            Além disso, <strong>{data.w} pessoas</strong> torcem para outros times que não
            fazem parte dessa partida.
          </p>
        )}
        <p className="ds-body-bold text-neutral-black mt-micro" style={{ textAlign: 'justify', color: 'var(--color-brand-otimath-dark)' }}>
          Qual a probabilidade de uma pessoa sorteada ao acaso{' '}
          <em>{data.descAInfinitive}</em> e também <em>{data.descBInfinitive}</em>?
        </p>
        <p
          className="ds-small text-neutral-dark mt-nano"
          style={{ textAlign: 'center', fontStyle: 'italic', lineHeight: 1.55 }}
        >
          (Sugestão: adote S = espaço amostral.
          <br />
          A = {'{'}
          {data.descASetNotation}
          {'}'}; B = {'{'}
          {data.descBSetNotation}
          {'}'}
          {data.hasOthers && <>; C = {'{'}não torcem para nenhum dos dois times{'}'}</>}
          .)
        </p>
      </div>
      {/* key={round} força remount a cada nova rodada — fecha a calculadora
          se o aluno terminou a rodada anterior com ela aberta. */}
      <SimpleCalculator key={round} />
      </>
    );

    const HintArea = (step !== 'intro' && step !== 'menu' && step !== 'lapMenu' && step !== 'correct' && step !== 'reasoningPlayback') ? (
      <div className="mt-micro">
        {currentHint && (
          <div
            className="rounded-md p-micro mb-nano"
            style={{
              background: 'var(--color-feedback-info-lightest)',
              border: '2px solid var(--color-feedback-info-dark)',
            }}
          >
            <p className="ds-small" style={{ color: 'var(--color-feedback-info-darkest)' }}>
              💡 <strong>Dica {hintsUsed} de {maxHints}:</strong> {currentHint}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-x-micro gap-y-nano justify-center">
          {hintsUsed < maxHints && (
            <Button style="secondary" size="small" onClick={useHint}>
              Ajuda ({maxHints - hintsUsed} {maxHints - hintsUsed === 1 ? 'restante' : 'restantes'})
            </Button>
          )}
          {showNoIdeaButton && (
            <Button
              style="secondary"
              size="small"
              onClick={() => {
                telemetryRecordInteracaoExercicio(
                  `UE4 — clicou em "Não sei realmente!" no step "${step}" (depois de esgotar as ${maxHints} dicas) — entrou no playback do raciocínio completo`,
                );
                playSound('/sounds/clear.mp3');
                setStep('reasoningPlayback');
              }}
            >
              Não sei realmente!
            </Button>
          )}
        </div>
      </div>
    ) : null;

    return (
      <div className="w-full max-w-[1216px] mx-auto">
        <style>{`
          @keyframes exerciseFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          [data-ex-panel] { animation: exerciseFadeIn 0.28s ease-out both; }
          @keyframes slowReveal {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          [data-playback-line] {
            animation: slowReveal 0.6s ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            [data-ex-panel], [data-playback-line] { animation: none !important; }
          }
        `}</style>

        <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-micro">
          Exercício 4 — Torcedores no bar (<span className="whitespace-nowrap">P(A ∩ B)</span>)
        </h2>

        {/* Intro */}
        {step === 'intro' && (
          <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto" data-ex-panel>
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Probabilidade em contexto social
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              Este exercício sai do contexto dos dois dados. Você vai aplicar a fórmula da
              probabilidade da união em um problema com torcedores em um bar — testando
              sua capacidade de <strong>transferir</strong> o raciocínio aprendido.
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              Você poderá escolher entre <strong>três estratégias</strong> de resolução.
            </p>
            <div className="flex justify-center mt-macro">
              <Button
                style="primary"
                size="medium"
                onClick={() => { confirmReadIntro(); playSound('/sounds/nextChallenge.mp3'); setStep('menu'); }}
              >
                Começar
              </Button>
            </div>
          </div>
        )}

        {/* Menu principal */}
        {step === 'menu' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Você decide: qual estratégia quer usar?
              </p>
              <div className="flex flex-col gap-y-micro mt-micro items-center">
                <Button
                  style={completedPaths.has('general') ? 'secondary' : 'primary'}
                  size="small"
                  onClick={() => {
                    telemetryRecordInteracaoExercicio('UE4 menu — clicou em "Abordagem Laplaciana da Probabilidade" — avançou para o submenu de escolha da ferramenta (Cardinalidade ou Venn)');
                    playSound('/sounds/nextChallenge.mp3');
                    setStep('lapMenu');
                  }}
                >
                  {completedPaths.has('lapCard') || completedPaths.has('lapVenn') ? '✓ ' : ''}
                  Abordagem Laplaciana da Probabilidade
                </Button>
                <Button
                  style={completedPaths.has('lapCard') || completedPaths.has('lapVenn') ? 'secondary' : 'primary'}
                  size="small"
                  onClick={() => choosePath('general')}
                >
                  {completedPaths.has('general') ? '✓ ' : ''}
                  Fórmula geral da Probabilidade da União
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submenu Laplace */}
        {step === 'lapMenu' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Abordagem Laplaciana — escolha a ferramenta
              </p>
              <div className="flex flex-col gap-y-micro mt-micro items-center">
                <Button
                  style={completedPaths.has('lapCard') ? 'secondary' : 'primary'}
                  size="small"
                  onClick={() => choosePath('lapCard')}
                >
                  {completedPaths.has('lapCard') ? '✓ ' : ''}
                  Usar a fórmula da cardinalidade da união
                </Button>
                <Button
                  style={completedPaths.has('lapVenn') ? 'secondary' : 'primary'}
                  size="small"
                  onClick={() => choosePath('lapVenn')}
                >
                  {completedPaths.has('lapVenn') ? '✓ ' : ''}
                  Usar o diagrama de Venn
                </Button>
              </div>
              <div className="flex justify-center mt-micro">
                <Button style="secondary" size="small" onClick={() => {
                  telemetryRecordInteracaoExercicio('UE4 lapMenu — clicou em "← Voltar ao menu" — retornou para a escolha principal entre Abordagem Laplaciana e Fórmula Geral');
                  setStep('menu');
                }}>
                  ← Voltar ao menu
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ Caminho 1.1 — Cardinalidade ═══════ */}
        {step === 'lapCard1' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 1 — Complete a fórmula da cardinalidade da união
              </p>
              <div className="flex justify-center mt-micro" style={{ maxWidth: '100%' }}>
                <div className="flex flex-nowrap items-center gap-x-nano overflow-x-auto text-[1.1rem] font-bold" style={{ maxWidth: '100%' }}>
                  <span style={{ flexShrink: 0 }}>n(</span>
                  <ExprSelect value={card1Pos1} onChange={handleCard1Pos1Change} expected="AuB" options={CARD_OPTIONS}
                    telemetryContext="UE4 lapCard1 — posição n(_) = … (1ª)" />
                  <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>) = n(</span>
                  <ExprSelect value={card1Pos2} onChange={handleCard1Pos2Change} expected="A" options={CARD_OPTIONS}
                    telemetryContext="UE4 lapCard1 — posição = n(_) + … (2ª)" />
                  <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>) + n(</span>
                  <ExprSelect value={card1Pos3} onChange={handleCard1Pos3Change} expected="B" options={CARD_OPTIONS}
                    telemetryContext="UE4 lapCard1 — posição + n(_) − … (3ª)" />
                  <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>) − n(</span>
                  <ExprSelect value={card1Pos4} onChange={handleCard1Pos4Change} expected="AnB" options={CARD_OPTIONS}
                    telemetryContext="UE4 lapCard1 — posição − n(_) (4ª)" />
                  <span style={{ flexShrink: 0 }}>)</span>
                </div>
              </div>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateCard1}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {step === 'lapCard2' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 2 — Substitua pelos valores do problema
              </p>
              <p className="ds-small text-center text-neutral-dark mt-nano italic whitespace-nowrap">
                n(A ∪ B) = n(A) + n(B) − n(A ∩ B)
              </p>
              <div className="flex justify-center mt-micro" style={{ maxWidth: '100%' }}>
                <div className="flex flex-nowrap items-center gap-x-nano overflow-x-auto text-[1.1rem] font-bold" style={{ maxWidth: '100%' }}>
                  <NumberBox value={card2CInput} setValue={setCard2CInput} error={card2Error} ariaLabel="n(A ∪ B)" />
                  <span style={{ flexShrink: 0 }}>= </span>
                  <NumberBox value={card2BInput} setValue={setCard2BInput} error={card2Error} ariaLabel="n(A)" />
                  <span style={{ flexShrink: 0 }}> + </span>
                  <NumberBox value={card2DInput} setValue={setCard2DInput} error={card2Error} ariaLabel="n(B)" />
                  <span className="whitespace-nowrap" style={{ flexShrink: 0 }}> − n(A ∩ B)</span>
                </div>
              </div>
              {card2Error && (
                <p className="ds-small text-center mt-nano text-feedback-error-dark font-medium">
                  Confira os valores do enunciado.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateCard2}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {step === 'lapCard3' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 3 — Isole n(A ∩ B) e calcule
              </p>
              <p className="ds-small text-center text-neutral-dark mt-nano italic">
                Da equação <span className="whitespace-nowrap">{data.c} = {data.b} + {data.d} − n(A ∩ B)</span>, obtemos <span className="whitespace-nowrap">n(A ∩ B) = b + d − c</span>.
              </p>
              <div className="flex items-center justify-center gap-x-nano mt-micro text-[1.1rem] font-bold">
                <span className="whitespace-nowrap">n(A ∩ B) = </span>
                <NumberBox value={card3Num} setValue={setCard3Num} error={card3Error} ariaLabel="n(A ∩ B)" onEnter={validateCard3} />
              </div>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateCard3}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* lapCard3b: etapa extra quando há inversão — calcular n(target). */}
        {step === 'lapCard3b' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 4 — Calcule n({data.targetLabel})
              </p>
              <p className="ds-body text-neutral-black mt-nano text-justify">
                Você já encontrou <strong className="whitespace-nowrap">n(A ∩ B) = {data.e}</strong>. Agora relacione
                esse valor com os dados do enunciado para obter o que a pergunta realmente
                pede.
              </p>
              <div className="flex items-center justify-center gap-x-nano mt-micro text-[1.1rem] font-bold">
                <span className="whitespace-nowrap">n({data.targetLabel}) = </span>
                <NumberBox value={card3bNum} setValue={setCard3bNum} error={card3bError} onEnter={validateCard3b} ariaLabel={`Cardinalidade de ${data.targetLabel}`} />
              </div>
              {card3bError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Valor incorreto. Pense: como obter n({data.targetLabel}) a partir de n(A ∩ B) e dos dados?
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateCard3b}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {step === 'lapCard4' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa {(data.invertA || data.invertB) ? '5' : '4'} — Aplique Laplace para obter P({data.targetLabel})
              </p>
              <p className="ds-small text-center text-neutral-dark mt-nano italic">
                <span className="whitespace-nowrap">P(E) = n(E) / n(S)</span>, com <span className="whitespace-nowrap">n(S) = {data.S}</span>.
              </p>
              <div className="flex items-center justify-center gap-x-micro mt-micro">
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>P({data.targetLabel}) =</span>
                <FractionInput
                  num={card4Num} den={card4Den}
                  setNum={setCard4Num} setDen={setCard4Den}
                  error={card4NumError || card4DenError}
                  onEnter={validateCard4}
                />
              </div>
              {card4NumError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Numerador incorreto — use o valor de n({data.targetLabel}) calculado.
                </p>
              )}
              {card4DenError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Denominador incorreto — o espaço amostral tem S pessoas.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateCard4}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* ═══════ Caminho 1.2 — Venn ═══════ */}
        {step === 'lapVenn1' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 1 — Modele o diagrama de Venn com expressões
              </p>
              <p className="ds-small text-center text-neutral-dark mt-nano italic">
                Chame <span className="whitespace-nowrap">n(A ∩ B)</span> de uma variável (por exemplo, x). Em cada região,
                escreva a expressão correspondente: <span className="whitespace-nowrap">n(A − B)</span> = <span className="whitespace-nowrap">n(A)</span> − x e
                <span className="whitespace-nowrap"> n(B − A)</span> = <span className="whitespace-nowrap">n(B)</span> − x.
              </p>
              <VennNumericPanel
                totalLabel={String(data.S)}
                xValue={vennX} setXValue={setVennX} xError={vennXError}
                amBValue={vennAmB} setAmBValue={setVennAmB} amBError={vennAmBError}
                bmAValue={vennBmA} setBmAValue={setVennBmA} bmAError={vennBmAError}
                wValue={vennW} setWValue={setVennW} wError={vennWError}
                showW={data.hasOthers}
                locked={vennLocked}
              />
              <p className="ds-small text-center text-neutral-dark mt-nano">
                Depois de preencher, vamos usar a soma das 4 regiões para encontrar
                o valor da variável e calcular a probabilidade.
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateVenn1}>Validar diagrama</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* ───── lapVenn2: monta equação e resolve para a variável ───── */}
        {step === 'lapVenn2' && (() => {
          const teamName = data.team === 'atletico' ? 'Atlético Mineiro' : 'Cruzeiro';
          const sexAdj = data.sex === 'feminino' ? 'feminino' : 'masculino';
          return (
            <div data-ex-panel>
              {Enunciado}
              <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[900px] mx-auto">
                <p className="ds-body-bold text-center text-brand-otimath-dark">
                  Etapa 2 — Monte a equação e resolva
                </p>

                {/* Diagrama travado para referência */}
                <div className="mt-micro">
                  <VennNumericPanel
                    totalLabel={String(data.S)}
                    xValue={vennX} amBValue={vennAmB} bmAValue={vennBmA} wValue={vennW}
                    showW={data.hasOthers}
                    locked
                  />
                </div>

                {/* ── Sub-passo A: n(A ∪ B) ───────────────────────── */}
                <div className="mt-micro p-micro rounded-md bg-neutral-lightest">
                  <p className="ds-body text-neutral-black text-justify">
                    Quantas pessoas <em>{data.descA}</em> ou <em>{data.descB}</em>?
                  </p>
                  <div className="flex items-center justify-center gap-x-nano mt-nano text-[1.05rem] font-bold">
                    <span style={{ color: EVENT_COLORS['A∪B'], whiteSpace: 'nowrap' }}>n(A ∪ B) =</span>
                    <NumberBox
                      value={vennAUnionB}
                      setValue={setVennAUnionB}
                      error={vennAUnionBError}
                      width={72}
                      ariaLabel="n(A ∪ B)"
                    />
                  </div>
                  {vennAUnionBError && (
                    <p className="ds-small text-center mt-nano text-feedback-error-dark font-medium">
                      Esse valor está no enunciado — procure por &quot;pertencem a pelo menos um desses dois grupos&quot;.
                    </p>
                  )}
                </div>

                {/* ── Sub-passo B: equação com 3 placeholders ─────── */}
                <div className="mt-micro p-micro rounded-md bg-neutral-lightest">
                  <p className="ds-body text-neutral-black text-justify">
                    Observando o diagrama apresentado, escreva a equação que permite calcular n(A ∪ B):
                  </p>
                  <div className="flex justify-center mt-nano" style={{ maxWidth: '100%' }}>
                    <div className="flex flex-nowrap items-center gap-x-nano overflow-x-auto text-[1.05rem] font-bold" style={{ maxWidth: '100%' }}>
                      <span style={{ color: EVENT_COLORS['A∪B'], whiteSpace: 'nowrap', flexShrink: 0 }}>n(A ∪ B) =</span>
                      <TextBox value={vennEqAmB} setValue={setVennEqAmB} error={vennEqAmBError} ariaLabel="n(A − B)" />
                      <span style={{ flexShrink: 0 }}>+</span>
                      <TextBox value={vennEqAnB} setValue={setVennEqAnB} error={vennEqAnBError} ariaLabel="n(A ∩ B)" width={70} />
                      <span style={{ flexShrink: 0 }}>+</span>
                      <TextBox value={vennEqBmA} setValue={setVennEqBmA} error={vennEqBmAError} ariaLabel="n(B − A)" />
                    </div>
                  </div>
                  {vennEqAmBError && (
                    <p className="ds-small mt-nano text-feedback-error-dark font-medium">
                      Primeira região: pessoas que <strong>torcem para o {teamName}</strong> e <strong>não são do sexo {sexAdj}</strong>.
                    </p>
                  )}
                  {vennEqAnBError && (
                    <p className="ds-small mt-nano text-feedback-error-dark font-medium">
                      Região central: pessoas que <strong>torcem para o {teamName}</strong> e <strong>são do sexo {sexAdj}</strong> ao mesmo tempo — a variável que você escolheu.
                    </p>
                  )}
                  {vennEqBmAError && (
                    <p className="ds-small mt-nano text-feedback-error-dark font-medium">
                      Terceira região: pessoas que <strong>são do sexo {sexAdj}</strong> e <strong>não torcem para o {teamName}</strong>.
                    </p>
                  )}
                </div>

                {/* ── Sub-passo B.2: substituir valor de n(A∪B) e simplificar ── */}
                <div className="mt-micro p-micro rounded-md bg-neutral-lightest">
                  <p className="ds-body text-neutral-black text-justify">
                    Substitua n(A ∪ B) pelo valor e escreva o lado direito da equação
                    (pode ser a soma direta ou já simplificada algebricamente):
                  </p>
                  <div className="flex items-center justify-center gap-x-nano gap-y-nano flex-wrap mt-nano text-[1.05rem] font-bold">
                    <NumberBox
                      value={vennEqLhsValue}
                      setValue={setVennEqLhsValue}
                      error={vennEqLhsValueError}
                      width={72}
                      ariaLabel="Valor de n(A ∪ B) substituído"
                    />
                    <span>=</span>
                    <TextBox
                      value={vennEqSimplified}
                      setValue={setVennEqSimplified}
                      error={vennEqSimplifiedError}
                      ariaLabel="Lado direito da equação após substituir n(A ∪ B)"
                      width={220}
                    />
                  </div>
                  {vennEqLhsValueError && (
                    <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                      Substitua n(A ∪ B) pelo valor encontrado anteriormente (o número que você identificou no enunciado).
                    </p>
                  )}
                  {vennEqSimplifiedError && (
                    <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                      Expressão não equivalente. Qualquer forma algébrica correta é aceita,
                      em qualquer ordem: por exemplo, {data.b}−{vennVar}+{vennVar}+{data.d}−{vennVar},
                      −{vennVar}+{data.d}+{vennVar}+{data.b}−{vennVar}, ou {data.b + data.d}−{vennVar}.
                    </p>
                  )}
                </div>

                {/* ── Sub-passo C: resolução (opcional) ───────────── */}
                <div className="mt-micro p-micro rounded-md bg-neutral-lightest">
                  <p className="ds-body text-neutral-black text-justify">
                    Resolva a equação anterior para encontrar o valor de <strong>{vennVar}</strong>.
                    <span className="ds-caption text-neutral-dark" style={{ fontStyle: 'italic', marginLeft: 8 }}>
                      (opcional — pode ser deixado em branco se preferir ir direto ao valor)
                    </span>
                  </p>
                  <div className="flex items-center justify-center gap-x-nano gap-y-nano flex-wrap mt-nano text-[1.05rem] font-bold">
                    <span className="whitespace-nowrap">{vennVar} =</span>
                    <TextBox
                      value={vennXExpr}
                      setValue={setVennXExpr}
                      error={vennXExprError}
                      ariaLabel={`Resolução de ${vennVar}`}
                      width={200}
                      placeholder="opcional"
                    />
                  </div>
                  {vennXExprError && (
                    <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                      Expressão não confere. Tente b + d − c, ou os valores numéricos correspondentes.
                    </p>
                  )}
                </div>

                {/* ── Sub-passo D: valor numérico final ──────────── */}
                <div className="mt-micro p-micro rounded-md" style={{ background: 'var(--color-brand-otimath-lightest)', border: '1px solid var(--color-brand-otimath-light)' }}>
                  <p className="ds-body text-neutral-black text-justify">
                    Portanto, o valor da cardinalidade da interseção é:
                  </p>
                  <div className="flex items-center justify-center gap-x-nano mt-nano text-[1.1rem] font-bold">
                    <span style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>n(A ∩ B) = {vennVar} =</span>
                    <NumberBox
                      value={vennXValue}
                      setValue={setVennXValue}
                      error={vennXValueError}
                      onEnter={validateVenn2}
                      width={72}
                      ariaLabel="Valor de n(A ∩ B)"
                    />
                  </div>
                  {vennXValueError && (
                    <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                      Valor incorreto. Use a calculadora se precisar — o resultado é um inteiro não-negativo.
                    </p>
                  )}
                </div>

                <div className="flex justify-center mt-micro">
                  <Button style="primary" size="small" onClick={validateVenn2}>Validar</Button>
                </div>
                {HintArea}
              </div>
            </div>
          );
        })()}

        {step === 'lapVenn3' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
              {/* Retomada: valor encontrado na etapa anterior */}
              <div
                className="p-micro rounded-md mb-micro"
                style={{
                  background: 'var(--color-brand-otimath-lightest)',
                  border: '1px solid var(--color-brand-otimath-light)',
                }}
              >
                <p
                  className="ds-caption-bold text-center"
                  style={{ color: 'var(--color-neutral-dark)', fontSize: '0.78rem' }}
                >
                  Valor calculado na etapa anterior:
                </p>
                <p
                  className="ds-body-bold text-center mt-nano"
                  style={{ color: EVENT_COLORS['A∩B'], fontSize: '1.05rem' }}
                >
                  n(A ∩ B) = {vennVar} = {data.e}
                </p>
              </div>
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 3 — Aplique Laplace para obter P({data.targetLabel})
              </p>

              {/* Identificação do espaço amostral n(S) */}
              <div
                className="mt-micro p-micro rounded-md bg-neutral-lightest"
              >
                <p className="ds-body text-neutral-black text-justify">
                  Quantos resultados são possíveis para o experimento aleatório de
                  sortear uma pessoa no bar e verificar o sexo e para qual time torce?
                </p>
                <div
                  className="flex items-center justify-center gap-x-nano mt-nano text-[1.05rem] font-bold"
                >
                  <span className="whitespace-nowrap">n(S) =</span>
                  <NumberBox
                    value={vennNS}
                    setValue={setVennNS}
                    error={vennNSError}
                    width={72}
                    ariaLabel="Cardinalidade do espaço amostral"
                  />
                </div>
                {vennNSError && (
                  <p
                    className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
                  >
                    n(S) é o total de pessoas reunidas no bar — esse número está no
                    início do enunciado.
                  </p>
                )}
              </div>

              <VennNumericPanel
                totalLabel={String(data.S)}
                xValue={vennX} amBValue={vennAmB} bmAValue={vennBmA} wValue={vennW}
                showW={data.hasOthers}
                locked
              />
              <p className="ds-small text-center text-neutral-dark mt-nano italic">
                Identifique no diagrama apresentado a região que representa {data.targetLabel} e
                aplique <span className="whitespace-nowrap">P(E) = n(E)/S</span>.
              </p>
              <div className="flex items-center justify-center gap-x-micro mt-micro">
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>P({data.targetLabel}) =</span>
                <FractionInput
                  num={venn3Num} den={venn3Den}
                  setNum={setVenn3Num} setDen={setVenn3Den}
                  error={venn3NumError || venn3DenError}
                  onEnter={validateVenn3}
                />
              </div>
              {venn3NumError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Numerador incorreto — observe qual região no diagrama corresponde a {data.targetLabel}.
                </p>
              )}
              {venn3DenError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Denominador incorreto — o total de pessoas é S.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateVenn3}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* ═══════ Caminho 2 — Fórmula Geral ═══════ */}
        {step === 'general1' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[900px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 1 — Aplique a fórmula geral e substitua pelas probabilidades
              </p>
              {/* Fórmula com quebra POR GRUPOS atômicos. Antes era um `<p>`
                  com whitespace-nowrap que estourava no mobile. */}
              <div className="ds-heading-large mt-micro text-brand-otimath-dark flex flex-wrap items-center justify-center gap-x-micro gap-y-nano">
                <span className="whitespace-nowrap">P(A ∪ B)</span>
                <span className="whitespace-nowrap">=</span>
                <span className="whitespace-nowrap">P(A)</span>
                <span className="whitespace-nowrap">+</span>
                <span className="whitespace-nowrap">P(B)</span>
                <span className="whitespace-nowrap">−</span>
                <span className="whitespace-nowrap">P(A ∩ B)</span>
              </div>
              <div className="flex items-center justify-center gap-x-micro gap-y-nano flex-wrap mt-micro">
                <FractionInput
                  num={g1CNum} den={g1CDen}
                  setNum={setG1CNum} setDen={setG1CDen}
                  error={g1Error}
                />
                <span className="ds-body-bold">=</span>
                <FractionInput
                  num={g1BNum} den={g1BDen}
                  setNum={setG1BNum} setDen={setG1BDen}
                  error={g1Error}
                />
                <span className="ds-body-bold">+</span>
                <FractionInput
                  num={g1DNum} den={g1DDen}
                  setNum={setG1DNum} setDen={setG1DDen}
                  error={g1Error}
                />
                <span className="ds-body-bold whitespace-nowrap">− P(A ∩ B)</span>
              </div>
              {g1Error && (
                <p className="ds-small text-center mt-nano text-feedback-error-dark font-medium">
                  Alguma fração não confere com os dados do enunciado.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateG1}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {step === 'general2' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[900px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 2 — Isole P(A ∩ B) e calcule
              </p>

              {/* Linha preenchida na Etapa 1 (preservada para continuidade do raciocínio) */}
              <div
                className="mt-micro p-micro rounded-md"
                style={{
                  background: 'var(--color-brand-otimath-lightest)',
                  border: '1px solid var(--color-brand-otimath-light)',
                }}
              >
                <p className="ds-caption-bold text-center mb-nano" style={{ color: 'var(--color-neutral-dark)', fontSize: '0.78rem' }}>
                  Você preencheu na etapa anterior:
                </p>
                <div className="flex items-center justify-center gap-x-nano gap-y-nano flex-wrap">
                  <FracH top={g1CNum || '?'} bottom={g1CDen || '?'} color={EVENT_COLORS['A∪B']} size="1rem" />
                  <span className="ds-body-bold">=</span>
                  <FracH top={g1BNum || '?'} bottom={g1BDen || '?'} color={EVENT_COLORS['A']} size="1rem" />
                  <span className="ds-body-bold">+</span>
                  <FracH top={g1DNum || '?'} bottom={g1DDen || '?'} color={EVENT_COLORS['B']} size="1rem" />
                  <span className="ds-body-bold whitespace-nowrap">− P(A ∩ B)</span>
                </div>
              </div>

              {/* Transição para o isolamento */}
              <p className="ds-small text-center text-neutral-dark mt-micro italic">
                Agora isole P(A ∩ B): passe P(A) e P(B) para o outro lado e deixe P(A ∩ B)
                sozinho. Some as frações no numerador comum e calcule o resultado.
              </p>

              <div className="flex items-center justify-center gap-x-micro mt-micro">
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>P(A ∩ B) =</span>
                <FractionInput
                  num={g2Num} den={g2Den}
                  setNum={setG2Num} setDen={setG2Den}
                  error={g2NumError || g2DenError}
                  onEnter={validateG2}
                />
              </div>
              {g2NumError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Numerador incorreto.
                </p>
              )}
              {g2DenError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Denominador incorreto — o total é S.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateG2}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* general3: etapa extra quando há inversão no Caminho 2 */}
        {step === 'general3' && (
          <div data-ex-panel>
            {Enunciado}
            <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[900px] mx-auto">
              <p className="ds-body-bold text-center text-brand-otimath-dark">
                Etapa 3 — Calcule P({data.targetLabel}) a partir de P(A ∩ B)
              </p>

              {/* Lembrete do que já foi calculado */}
              <div
                className="mt-micro p-micro rounded-md"
                style={{
                  background: 'var(--color-brand-otimath-lightest)',
                  border: '1px solid var(--color-brand-otimath-light)',
                }}
              >
                <p className="ds-caption-bold text-center mb-nano" style={{ color: 'var(--color-neutral-dark)', fontSize: '0.78rem' }}>
                  Você já obteve:
                </p>
                <div className="flex items-center justify-center gap-x-nano">
                  <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>P(A ∩ B) =</span>
                  <FracH top={g2Num || '?'} bottom={g2Den || '?'} color={EVENT_COLORS['A∩B']} size="1rem" />
                </div>
              </div>

              <p className="ds-body text-neutral-black mt-micro text-justify">
                Agora relacione P(A ∩ B) com os dados do enunciado para calcular
                P({data.targetLabel}).
              </p>

              <div className="flex items-center justify-center gap-x-micro mt-micro">
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], whiteSpace: 'nowrap' }}>P({data.targetLabel}) =</span>
                <FractionInput
                  num={g3Num} den={g3Den}
                  setNum={setG3Num} setDen={setG3Den}
                  error={g3NumError || g3DenError}
                  onEnter={validateG3}
                />
              </div>
              {g3NumError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Numerador incorreto.
                </p>
              )}
              {g3DenError && (
                <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                  Denominador incorreto — o total é S.
                </p>
              )}
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={validateG3}>Validar</Button>
              </div>
              {HintArea}
            </div>
          </div>
        )}

        {/* ═══════ Não sei realmente — Animação lenta guiada ═══════ */}
        {step === 'reasoningPlayback' && (
          <ReasoningPlaybackPanel
            title="Resolução passo a passo"
            strategy={
              chosenPath === 'lapCard'
                ? 'Abordagem Laplaciana usando a fórmula da cardinalidade da união.'
                : chosenPath === 'lapVenn'
                  ? 'Abordagem Laplaciana usando o diagrama de Venn.'
                  : 'Fórmula geral da probabilidade da união.'
            }
            lines={buildReasoningLines(chosenPath, data)}
            onFinish={() => {
              setCompletedPaths(prev => {
                const next = new Set(prev);
                if (chosenPath) next.add(chosenPath);
                return next;
              });
              setStep('correct');
            }}
          />
        )}

        {/* ═══════ Correct ═══════ */}
        {step === 'correct' && (
          <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto" data-ex-panel>
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎉 Parabéns!
            </p>
            <div className="bg-neutral-white rounded-md p-micro mb-micro border-2 border-brand-otimath-pure">
              <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
                Probabilidade da interseção encontrada
              </p>
              <div className="flex justify-center mt-nano">
                <div
                  className="flex items-center flex-wrap gap-x-nano gap-y-nano"
                  style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--color-neutral-white)',
                    border: `2px solid ${EVENT_COLORS['A∩B']}`,
                  }}
                >
                  <span aria-hidden style={{ color: EVENT_COLORS['A∩B'], fontWeight: 800 }}>✓</span>
                  <span style={{ color: EVENT_COLORS['A∩B'], fontWeight: 700, fontSize: '0.82rem' }}>
                    P({data.targetLabel}) =
                  </span>
                  <FracH top={data.targetCardinality} bottom={data.S} color={EVENT_COLORS['A∩B']} size="0.9rem" />
                  <span className="text-neutral-darkest text-[0.8rem]">
                    ≈ {formatDecimal(data.targetCardinality, data.S, 3)}
                  </span>
                  <span className="text-neutral-darkest text-[0.8rem]">
                    ≈ {formatPercent(data.targetCardinality, data.S, 1)}
                  </span>
                </div>
              </div>
            </div>
            {completedPaths.size < 3 && (
              <p className="ds-body text-neutral-black mt-micro text-justify">
                Você resolveu o problema por uma estratégia. Que tal tentar resolver pelo
                mesmo problema usando outra abordagem?
              </p>
            )}
            {completedPaths.size === 3 && (
              <p className="ds-body text-neutral-black mt-micro text-justify">
                Você explorou as três estratégias e encontrou o mesmo resultado —
                confirmando que a matemática é consistente qualquer que seja o caminho.
              </p>
            )}
            <div className="flex flex-col items-center gap-y-micro mt-macro">
              {completedPaths.size < 3 && (
                <Button
                  style="secondary"
                  size="small"
                  onClick={() => {
                    telemetryRecordInteracaoExercicio(
                      `UE4 tela "correct" — clicou em "Fazer a outra escolha" (caminhos já completos: [${[...completedPaths].join(', ') || 'nenhum'}]) — voltou ao menu para tentar outra estratégia`,
                    );
                    playSound('/sounds/nextChallenge.mp3');
                    resetAllPaths();
                    setStep('menu');
                  }}
                >
                  Fazer a outra escolha
                </Button>
              )}
              <Button
                style="secondary"
                size="small"
                onClick={() => {
                  telemetryRecordInteracaoExercicio(
                    `UE4 tela "correct" — clicou em "Praticar com novo problema" (caminhos resolvidos no problema atual: [${[...completedPaths].join(', ') || 'nenhum'}]) — sorteou novo enunciado`,
                  );
                  playSound('/sounds/nextChallenge.mp3');
                  resetForNewRound();
                }}
              >
                Praticar com novo problema
              </Button>
              <Button
                style="primary"
                size="small"
                onClick={() => {
                  telemetryRecordInteracaoExercicio(
                    `UE4 tela "correct" — clicou em "Finalizar exercício" (caminhos completos: [${[...completedPaths].join(', ') || 'nenhum'}]) — encerrou o exercício 4`,
                  );
                  playSound('/sounds/gameFinished.mp3');
                  onFinished();
                }}
              >
                Finalizar exercício
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

// ═══════════════════════════════════════════════════════════════
// HELPERS DE DICAS DOS PASSOS CONDICIONAIS (lapCard3b, general3, lapVenn3)
// ═══════════════════════════════════════════════════════════════

function buildCard3bHints(data: Exercise4Data): string[] {
  // Caminho 1.1 — passo extra para calcular n(target) a partir de n(A ∩ B).
  if (!data.invertA && data.invertB) {
    // A ∩ B̄ = A − B  →  n(A) − n(A ∩ B)
    return [
      'A pergunta envolve “não ocorrer B”, então use a diferença.',
      'n(A ∩ B̄) = n(A) − n(A ∩ B).',
      `Substitua: n(A ∩ B̄) = ${data.b} − ${data.e}.`,
      `Então n(A ∩ B̄) = ${data.targetCardinality}.`,
    ];
  }
  if (data.invertA && !data.invertB) {
    // Ā ∩ B = B − A  →  n(B) − n(A ∩ B)
    return [
      'A pergunta envolve “não ocorrer A”, então use a diferença.',
      'n(Ā ∩ B) = n(B) − n(A ∩ B).',
      `Substitua: n(Ā ∩ B) = ${data.d} − ${data.e}.`,
      `Então n(Ā ∩ B) = ${data.targetCardinality}.`,
    ];
  }
  // Ā ∩ B̄ = complementar da união = S − n(A ∪ B)
  return [
    'A pergunta envolve “não ocorrer A e não ocorrer B” — é o complementar da união.',
    'n(Ā ∩ B̄) = n(S) − n(A ∪ B) = S − c.',
    `Substitua: n(Ā ∩ B̄) = ${data.S} − ${data.c}.`,
    `Então n(Ā ∩ B̄) = ${data.targetCardinality}.`,
  ];
}

function buildLapVenn3Hints(data: Exercise4Data): string[] {
  const label = data.targetLabel;
  if (!data.invertA && !data.invertB) {
    return [
      'Aplique Laplace à região central (interseção).',
      `P(${label}) = n(${label}) / S.`,
      `No diagrama, essa é a região onde A e B se sobrepõem.`,
      `Resposta: ${data.targetCardinality}/${data.S}.`,
    ];
  }
  if (!data.invertA && data.invertB) {
    return [
      'A pergunta pede a região onde A ocorre mas B não.',
      'Essa é a lunete esquerda do diagrama (região exclusiva de A).',
      `P(${label}) = (b − x) / S.`,
      `Resposta: ${data.targetCardinality}/${data.S}.`,
    ];
  }
  if (data.invertA && !data.invertB) {
    return [
      'A pergunta pede a região onde B ocorre mas A não.',
      'Essa é a lunete direita do diagrama (região exclusiva de B).',
      `P(${label}) = (d − x) / S.`,
      `Resposta: ${data.targetCardinality}/${data.S}.`,
    ];
  }
  return [
    'A pergunta pede a região fora dos dois círculos.',
    'É o complementar da união — pessoas que não estão em A nem em B.',
    `P(${label}) = (S − c) / S.`,
    `Resposta: ${data.targetCardinality}/${data.S}.`,
  ];
}

function buildGeneral3Hints(data: Exercise4Data): string[] {
  const label = data.targetLabel;
  if (!data.invertA && data.invertB) {
    return [
      'A pergunta envolve “não ocorrer B” — use a relação com a diferença.',
      'P(A ∩ B̄) = P(A) − P(A ∩ B).',
      `Substitua: P(${label}) = ${data.b}/${data.S} − ${data.e}/${data.S}.`,
      `Resposta: ${data.targetCardinality}/${data.S}.`,
    ];
  }
  if (data.invertA && !data.invertB) {
    return [
      'A pergunta envolve “não ocorrer A” — use a relação com a diferença.',
      'P(Ā ∩ B) = P(B) − P(A ∩ B).',
      `Substitua: P(${label}) = ${data.d}/${data.S} − ${data.e}/${data.S}.`,
      `Resposta: ${data.targetCardinality}/${data.S}.`,
    ];
  }
  return [
    'A pergunta pede o complementar da união.',
    'P(Ā ∩ B̄) = 1 − P(A ∪ B).',
    `Substitua: P(${label}) = 1 − ${data.c}/${data.S}.`,
    `Resposta: ${data.targetCardinality}/${data.S}.`,
  ];
}

// ═══════════════════════════════════════════════════════════════
// LINHAS DA ANIMAÇÃO "NÃO SEI REALMENTE!" — com FracH e destaques
// ═══════════════════════════════════════════════════════════════

const COLOR_I = EVENT_COLORS['A∩B'];
const COLOR_A_ = EVENT_COLORS['A'];
const COLOR_B_ = EVENT_COLORS['B'];
const COLOR_U = EVENT_COLORS['A∪B'];

function Hi({ children, color }: { children: React.ReactNode; color?: string }) {
  // whiteSpace: 'nowrap' garante que notações como `n(A ∩ B)` ou `P(A ∪ B)`
  // não se quebrem em duas linhas (regra: módulos atômicos da expressão
  // ficam grudados; quebras só são aceitas ENTRE grupos).
  return (
    <strong style={{ color: color ?? 'var(--color-brand-otimath-dark)', whiteSpace: 'nowrap' }}>
      {children}
    </strong>
  );
}

function buildReasoningLines(
  path: 'lapCard' | 'lapVenn' | 'general' | null,
  data: Exercise4Data,
): ReasoningLine[] {
  const target = data.targetLabel;
  const tCard = data.targetCardinality;

  // Linhas condicionais de "ajuste para target" quando há inversão
  const lapCardAdjustLine = (): ReasoningLine | null => {
    if (!data.invertA && !data.invertB) return null;
    if (!data.invertA && data.invertB) {
      return { content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>n(A ∩ B̄)</Hi> = n(A) − n(A ∩ B) = {data.b} − {data.e} = <Hi color={COLOR_I}>{tCard}</Hi>.</> };
    }
    if (data.invertA && !data.invertB) {
      return { content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>n(Ā ∩ B)</Hi> = n(B) − n(A ∩ B) = {data.d} − {data.e} = <Hi color={COLOR_I}>{tCard}</Hi>.</> };
    }
    return { content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>n(Ā ∩ B̄)</Hi> = n(S) − n(A ∪ B) = {data.S} − {data.c} = <Hi color={COLOR_I}>{tCard}</Hi>.</> };
  };

  if (path === 'lapCard') {
    const lines: ReasoningLine[] = [
      { content: <>Partimos da fórmula da cardinalidade: <Hi color={COLOR_U}>n(A ∪ B)</Hi> = <Hi color={COLOR_A_}>n(A)</Hi> + <Hi color={COLOR_B_}>n(B)</Hi> − <Hi color={COLOR_I}>n(A ∩ B)</Hi>.</> },
      { content: <>Substituindo os valores do enunciado: <Hi color={COLOR_U}>{data.c}</Hi> = <Hi color={COLOR_A_}>{data.b}</Hi> + <Hi color={COLOR_B_}>{data.d}</Hi> − <span className="whitespace-nowrap">n(A ∩ B)</span>.</> },
      { content: <>Isolando <span className="whitespace-nowrap">n(A ∩ B)</span>: <Hi color={COLOR_I}>n(A ∩ B)</Hi> = {data.b} + {data.d} − {data.c} = <Hi color={COLOR_I}>{data.e}</Hi>.</> },
    ];
    const adj = lapCardAdjustLine();
    if (adj) lines.push(adj);
    lines.push(
      { content: <>Aplicando Laplace: P({target}) = <FracH top={<span style={{ color: COLOR_I }}>n({target})</span>} bottom="S" color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> },
      {
        emphasis: true,
        content: <>Resposta final: <Hi color={COLOR_I}>P({target}) = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1.05rem" /></Hi> ≈ {formatDecimal(tCard, data.S, 3)} ≈ {formatPercent(tCard, data.S, 1)}.</>,
      },
    );
    return lines;
  }

  if (path === 'lapVenn') {
    const regionLine = (): ReasoningLine => {
      if (!data.invertA && !data.invertB) {
        return { content: <>A pergunta corresponde à região central: P({target}) = <FracH top={<span style={{ color: COLOR_I }}>x</span>} bottom="S" color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> };
      }
      if (!data.invertA && data.invertB) {
        return { content: <>A pergunta corresponde à região exclusiva de A: P({target}) = <FracH top={`${data.b} − ${data.e}`} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> };
      }
      if (data.invertA && !data.invertB) {
        return { content: <>A pergunta corresponde à região exclusiva de B: P({target}) = <FracH top={`${data.d} − ${data.e}`} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> };
      }
      return { content: <>A pergunta corresponde à região fora dos dois círculos: P({target}) = <FracH top={`${data.S} − ${data.c}`} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> };
    };

    return [
      { content: <>No diagrama de Venn, seja <Hi color={COLOR_I}>x = n(A ∩ B)</Hi>.</> },
      { content: <>A região <Hi color={COLOR_A_}>A − B</Hi> tem {data.b} − x pessoas; <Hi color={COLOR_B_}>B − A</Hi> tem {data.d} − x pessoas.</> },
      { content: <>A união cobre as três regiões: ({data.b} − x) + x + ({data.d} − x) = <Hi color={COLOR_U}>{data.c}</Hi>.</> },
      { content: <>Resolvendo: x = {data.b} + {data.d} − {data.c} = <Hi color={COLOR_I}>{data.e}</Hi>.</> },
      regionLine(),
      {
        emphasis: true,
        content: <>Resposta final: <Hi color={COLOR_I}>P({target}) = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1.05rem" /></Hi> ≈ {formatDecimal(tCard, data.S, 3)} ≈ {formatPercent(tCard, data.S, 1)}.</>,
      },
    ];
  }

  if (path === 'general') {
    const lines: ReasoningLine[] = [
      { content: <>Começamos com a fórmula geral: <Hi color={COLOR_U}>P(A ∪ B)</Hi> = <Hi color={COLOR_A_}>P(A)</Hi> + <Hi color={COLOR_B_}>P(B)</Hi> − <Hi color={COLOR_I}>P(A ∩ B)</Hi>.</> },
      { content: <>Substituindo pelas probabilidades: <FracH top={data.c} bottom={data.S} color={COLOR_U} size="1rem" /> = <FracH top={data.b} bottom={data.S} color={COLOR_A_} size="1rem" /> + <FracH top={data.d} bottom={data.S} color={COLOR_B_} size="1rem" /> − <span className="whitespace-nowrap">P(A ∩ B)</span>.</> },
      { content: <>Isolando <span className="whitespace-nowrap">P(A ∩ B)</span>: <Hi color={COLOR_I}>P(A ∩ B)</Hi> = <FracH top={`${data.b} + ${data.d} − ${data.c}`} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={data.e} bottom={data.S} color={COLOR_I} size="1rem" />.</> },
    ];
    if (!data.invertA && data.invertB) {
      lines.push({ content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>P(A ∩ B̄)</Hi> = <span className="whitespace-nowrap">P(A)</span> − <span className="whitespace-nowrap">P(A ∩ B)</span> = <FracH top={data.b} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> − <FracH top={data.e} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> });
    } else if (data.invertA && !data.invertB) {
      lines.push({ content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>P(Ā ∩ B)</Hi> = P(B) − P(A ∩ B) = <FracH top={data.d} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> − <FracH top={data.e} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> });
    } else if (data.invertA && data.invertB) {
      lines.push({ content: <>Ajuste para a pergunta: <Hi color={COLOR_I}>P(Ā ∩ B̄)</Hi> = 1 − P(A ∪ B) = 1 − <FracH top={data.c} bottom={data.S} color="var(--color-neutral-darkest)" size="1rem" /> = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1rem" />.</> });
    }
    lines.push({
      emphasis: true,
      content: <>Resposta final: <Hi color={COLOR_I}>P({target}) = <FracH top={tCard} bottom={data.S} color={COLOR_I} size="1.05rem" /></Hi> ≈ {formatDecimal(tCard, data.S, 3)} ≈ {formatPercent(tCard, data.S, 1)}.</>,
    });
    return lines;
  }
  return [{ content: 'Nenhum caminho escolhido.' }];
}
