'use client';

/* ═══════════════════════════════════════════════════════════════
   UnionExercise3 — Exercício 3 da trilha opcional.

   Tema: diferenças de eventos — A − B e B − A.
     A − B = {ω ∈ Ω : A ocorre e B não ocorre}
     B − A = {ω ∈ Ω : B ocorre e A não ocorre}

   Fluxo:
     intro    → enunciado + botão Começar
     markA    → marcar A na tabela
     markB    → A congelado, marcar B
     markAmB  → marcar A − B (definição: A ocorre e B não ocorre)
     markBmA  → marcar B − A (definição: B ocorre e A não ocorre)
     calcPA   → calcular P(A)
     calcPB   → calcular P(B)
     calcPAmB → calcular P(A − B)
     calcPBmA → calcular P(B − A)
     done     → card de síntese

   Gerador alternado por rodada (variável didática — ARTIGUE, 2014):
     rodada 0 → gerador Ex1 (interseção não-vazia)
     rodada 1 → gerador Ex1 (interseção não-vazia)
     rodada 2 → gerador Ex2 (A∩B=∅)
     rodada 3 → gerador Ex1
     rodada 4 → gerador Ex2
     rodada 5 → gerador Ex1
     rodada 6 → gerador Ex2
     ... alterna a partir da 3ª rodada.

   Pedagogia: no caso exclusivo A∩B=∅, observa-se A−B = A e B−A = B.
   Esta coincidência é conteúdo de aprendizagem legítimo — o aluno
   enxerga que diferenças dependem da sobreposição entre A e B.
   ═══════════════════════════════════════════════════════════════ */

import React, {
  useState, useCallback, useMemo, useEffect,
  forwardRef, useImperativeHandle,
} from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import {
  EventPair,
  selectPairForRound, verifyEventTableConsistency,
  pairsMatching, setIntersection,
  MarkMatrix, createEmptyMatrix, matrixToKeySet,
  EVENT_COLORS,
} from './shared/eventPair';
import { selectExclusivePairForRound } from './shared/eventPairExclusive';
import { MarkingTable, EventCard } from './shared/MarkingTable';
import {
  FractionInput, FracH,
  formatDecimal, formatPercent,
} from './shared/FractionInput';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

type ExStep =
  | 'intro'
  | 'markA' | 'markB' | 'markAmB' | 'markBmA'
  | 'calcPAmB' | 'calcPBmA'
  | 'done';

type FeedbackState = 'none' | 'incomplete' | 'wrong';

const STEP_SEQUENCE: ExStep[] = [
  'intro',
  'markA', 'markB', 'markAmB', 'markBmA',
  'calcPAmB', 'calcPBmA',
  'done',
];

interface UnionExercise3Props {
  onFinished: () => void;
  /** Chamado quando o aluno clica em voltar estando no passo inicial. */
  onRequestPreviousPhase?: () => void;
  /** Passo inicial ao montar. Default: 'intro'. */
  initialStep?: ExStep;
  /** Toast alert do OVA (propagado pelo TwoDicesExperiment). */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number) => void;
}

export interface UnionExercise3Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

// Seleção de gerador por rodada:
//   rodada 0, 1 → Ex1 (interseção não-vazia)
//   rodada 2    → Ex2 (mutuamente exclusivos)
//   rodada ≥ 3  → alterna: 3 é Ex1, 4 é Ex2, 5 é Ex1, 6 é Ex2, ...
function selectPairForExercise3(round: number, usedIds: Set<string>): EventPair {
  let useExclusive: boolean;
  if (round <= 1) useExclusive = false;
  else if (round === 2) useExclusive = true;
  else useExclusive = (round - 3) % 2 === 1;
  return useExclusive
    ? selectExclusivePairForRound(round, usedIds)
    : selectPairForRound(round, usedIds);
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════════

function HistoryChip({
  label, num, den, color,
}: { label: string; num: number; den: number; color: string }) {
  return (
    <div
      className="flex items-center flex-wrap gap-x-nano gap-y-nano"
      style={{
        padding: '5px 10px',
        borderRadius: 8,
        background: 'var(--color-neutral-white)',
        border: `2px solid ${color}`,
      }}
    >
      <span aria-hidden style={{ color, fontWeight: 800 }}>✓</span>
      <span style={{ color, fontWeight: 700, fontSize: '0.82rem' }}>
        {label} =
      </span>
      <FracH top={num} bottom={den} color={color} size="0.9rem" />
      <span className="text-neutral-darkest text-[0.8rem]">
        ≈ {formatDecimal(num, den, 3)}
      </span>
      <span className="text-neutral-darkest text-[0.8rem]">
        ≈ {formatPercent(num, den, 1)}
      </span>
    </div>
  );
}

const PROGRESS_LABELS: { step: ExStep; label: string }[] = [
  { step: 'markA', label: 'A' },
  { step: 'markB', label: 'B' },
  { step: 'markAmB', label: 'A−B' },
  { step: 'markBmA', label: 'B−A' },
  { step: 'calcPAmB', label: 'P(A−B)' },
  { step: 'calcPBmA', label: 'P(B−A)' },
];

function ProgressIndicator({ step }: { step: ExStep }) {
  const currentIdx = STEP_SEQUENCE.indexOf(step);
  return (
    <div
      className="flex items-center justify-center gap-x-micro mb-micro flex-wrap gap-y-[6px]"
      aria-label="Progresso do exercício"
    >
      {PROGRESS_LABELS.map(({ step: s, label }) => {
        const idx = STEP_SEQUENCE.indexOf(s);
        const isDone = currentIdx > idx;
        const isCurrent = currentIdx === idx;
        return (
          <div
            key={s}
            className="flex items-center gap-x-nano"
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              background: isCurrent
                ? 'var(--color-brand-otimath-pure)'
                : isDone
                  ? 'var(--color-feedback-success-dark)'
                  : 'var(--color-neutral-lighter)',
              color: isCurrent || isDone ? '#fff' : 'var(--color-neutral-dark)',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {isDone && <span aria-hidden>✓</span>}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER R14 SEPARANDO NUM/DEN
// ═══════════════════════════════════════════════════════════════

type FractionValidation = { numError: boolean; denError: boolean; ok: boolean };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function validateFractionSeparate(
  numStr: string, denStr: string,
  expectedNum: number, expectedDen: number,
): FractionValidation {
  const num = parseInt(numStr.trim(), 10);
  const den = parseInt(denStr.trim(), 10);
  const numValid = Number.isInteger(num) && num >= 0;
  const denPositive = Number.isInteger(den) && den > 0;

  if (expectedNum === 0) {
    // Fração nula — qualquer den > 0 e num = 0 é aceito.
    const ok = numValid && num === 0 && denPositive;
    return {
      numError: !numValid || num !== 0,
      denError: !denPositive,
      ok,
    };
  }

  const g = gcd(expectedNum, expectedDen);
  const irreducibleDen = expectedDen / g;
  const denIsMultipleOfIrreducible = denPositive && den % irreducibleDen === 0;
  const equivalent = numValid && denPositive && num * expectedDen === den * expectedNum;

  if (equivalent) {
    return { numError: false, denError: false, ok: true };
  }
  const denFailed = !denIsMultipleOfIrreducible;
  return {
    numError: !denFailed || !numValid,
    denError: denFailed,
    ok: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const UnionExercise3 = forwardRef<UnionExercise3Handle, UnionExercise3Props>(
  function UnionExercise3({ onFinished, onRequestPreviousPhase, initialStep, createAlert }, ref) {
    const [step, setStep] = useState<ExStep>(initialStep ?? 'intro');
    const [round, setRound] = useState(0);
    const [usedPairIds, setUsedPairIds] = useState<Set<string>>(new Set());
    const [currentPair, setCurrentPair] = useState<EventPair>(
      () => selectPairForExercise3(0, new Set()),
    );

    // ── Marcações ────────────────────────────────────────────────
    const [marksA, setMarksA] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksB, setMarksB] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksAmB, setMarksAmB] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksBmA, setMarksBmA] = useState<MarkMatrix>(createEmptyMatrix);

    const [feedbackA, setFeedbackA] = useState<FeedbackState>('none');
    const [feedbackB, setFeedbackB] = useState<FeedbackState>('none');
    const [feedbackAmB, setFeedbackAmB] = useState<FeedbackState>('none');
    const [feedbackBmA, setFeedbackBmA] = useState<FeedbackState>('none');

    // ── Cálculos: apenas P(A−B) e P(B−A) ─────────────────────────
    const [pAmBNum, setPAmBNum] = useState('');
    const [pAmBDen, setPAmBDen] = useState('');
    const [pAmBNumError, setPAmBNumError] = useState(false);
    const [pAmBDenError, setPAmBDenError] = useState(false);

    const [pBmANum, setPBmANum] = useState('');
    const [pBmADen, setPBmADen] = useState('');
    const [pBmANumError, setPBmANumError] = useState(false);
    const [pBmADenError, setPBmADenError] = useState(false);

    const [historyCollapsed, setHistoryCollapsed] = useState(false);

    // ── Conjuntos corretos ───────────────────────────────────────
    const correctSets = useMemo(() => {
      const A = pairsMatching(currentPair.eventA.predicate);
      const B = pairsMatching(currentPair.eventB.predicate);
      const I = setIntersection(A, B);
      const AmB = new Set<string>([...A].filter(k => !B.has(k)));
      const BmA = new Set<string>([...B].filter(k => !A.has(k)));
      return {
        A, B, I, AmB, BmA,
        nA: A.size, nB: B.size, nI: I.size,
        nAmB: AmB.size, nBmA: BmA.size,
      };
    }, [currentPair]);

    useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      const result = verifyEventTableConsistency(
        currentPair.eventA, currentPair.eventB,
        {
          A: correctSets.A, B: correctSets.B,
          I: correctSets.I, U: new Set([...correctSets.A, ...correctSets.B]),
        },
      );
      if (!result.ok) {
        console.error(`[UnionExercise3] Inconsistência no par "${currentPair.id}":`, result.violations);
      }
    }, [currentPair, correctSets]);

    useEffect(() => {
      if (usedPairIds.size === 0) {
        setUsedPairIds(new Set([currentPair.id]));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers de marcação ─────────────────────────────────────
    const toggleA = useCallback((r: number, c: number) => {
      setMarksA(prev => { const cp = prev.map(row => [...row]); cp[r][c] = !cp[r][c]; return cp; });
      setFeedbackA('none');
    }, []);
    const toggleB = useCallback((r: number, c: number) => {
      setMarksB(prev => { const cp = prev.map(row => [...row]); cp[r][c] = !cp[r][c]; return cp; });
      setFeedbackB('none');
    }, []);
    const toggleAmB = useCallback((r: number, c: number) => {
      setMarksAmB(prev => { const cp = prev.map(row => [...row]); cp[r][c] = !cp[r][c]; return cp; });
      setFeedbackAmB('none');
    }, []);
    const toggleBmA = useCallback((r: number, c: number) => {
      setMarksBmA(prev => { const cp = prev.map(row => [...row]); cp[r][c] = !cp[r][c]; return cp; });
      setFeedbackBmA('none');
    }, []);

    const makeFullMatrix = (): MarkMatrix =>
      Array.from({ length: 6 }, () => Array(6).fill(true));

    const markAllCurrent = useCallback(() => {
      if (step === 'markA') { setMarksA(makeFullMatrix()); setFeedbackA('none'); }
      else if (step === 'markB') { setMarksB(makeFullMatrix()); setFeedbackB('none'); }
      else if (step === 'markAmB') { setMarksAmB(makeFullMatrix()); setFeedbackAmB('none'); }
      else if (step === 'markBmA') { setMarksBmA(makeFullMatrix()); setFeedbackBmA('none'); }
      playSound('/sounds/clear.mp3');
    }, [step]);

    const clearCurrent = useCallback(() => {
      if (step === 'markA') { setMarksA(createEmptyMatrix()); setFeedbackA('none'); }
      else if (step === 'markB') { setMarksB(createEmptyMatrix()); setFeedbackB('none'); }
      else if (step === 'markAmB') { setMarksAmB(createEmptyMatrix()); setFeedbackAmB('none'); }
      else if (step === 'markBmA') { setMarksBmA(createEmptyMatrix()); setFeedbackBmA('none'); }
      playSound('/sounds/clear.mp3');
    }, [step]);

    const evaluateMarks = useCallback(
      (marks: MarkMatrix, correct: Set<string>): FeedbackState => {
        const marked = matrixToKeySet(marks);
        let hasWrong = false;
        marked.forEach(k => { if (!correct.has(k)) hasWrong = true; });
        if (hasWrong) return 'wrong';
        let hasMissing = false;
        correct.forEach(k => { if (!marked.has(k)) hasMissing = true; });
        if (hasMissing) return 'incomplete';
        return 'none';
      },
      [],
    );

    // Rola pro topo do OVA em todo Conferir. Mirror do checkAnswer do Disco.
    const scrollDiceToTop = () => {
      requestAnimationFrame(() => {
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    // ── Validações de marcação ───────────────────────────────────
    const validateMarkA = useCallback(() => {
      scrollDiceToTop();
      const fb = evaluateMarks(marksA, correctSets.A);
      setFeedbackA(fb);
      if (fb === 'none') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Marcação do evento A completa.', 'success', 3000);
        setStep('markB');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'Há marcações que não satisfazem o evento A.', 'error', 4000);
      }
    }, [marksA, correctSets.A, evaluateMarks, createAlert]);

    const validateMarkB = useCallback(() => {
      scrollDiceToTop();
      const fb = evaluateMarks(marksB, correctSets.B);
      setFeedbackB(fb);
      if (fb === 'none') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Marcação do evento B completa.', 'success', 3000);
        setStep('markAmB');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'Há marcações que não satisfazem o evento B.', 'error', 4000);
      }
    }, [marksB, correctSets.B, evaluateMarks, createAlert]);

    const validateMarkAmB = useCallback(() => {
      scrollDiceToTop();
      // Caso A∩B=∅: A−B = A. Ainda assim a validação funciona (correctSets.AmB é calculado).
      // Caso A−B=∅ (quando A ⊂ B), o aluno marca ZERO células.
      const markedCount = matrixToKeySet(marksAmB).size;
      if (correctSets.nAmB === 0) {
        if (markedCount === 0) {
          setFeedbackAmB('none');
          playSound('/sounds/correct.mp3');
          createAlert?.('Correto!', 'A − B = ∅ (A está contido em B).', 'success', 3500);
          setStep('markBmA');
        } else {
          setFeedbackAmB('wrong');
          playSound('/sounds/incorrect.mp3');
          createAlert?.('Tente novamente', 'A − B é vazio neste caso — não marque nenhuma célula.', 'error', 5000);
        }
        return;
      }
      const fb = evaluateMarks(marksAmB, correctSets.AmB);
      setFeedbackAmB(fb);
      if (fb === 'none') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Marcação de A − B completa.', 'success', 3000);
        setStep('markBmA');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares de A − B.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'A − B: pares que satisfazem A mas NÃO satisfazem B.', 'error', 4500);
      }
    }, [marksAmB, correctSets.AmB, correctSets.nAmB, evaluateMarks, createAlert]);

    const validateMarkBmA = useCallback(() => {
      scrollDiceToTop();
      const markedCount = matrixToKeySet(marksBmA).size;
      if (correctSets.nBmA === 0) {
        if (markedCount === 0) {
          setFeedbackBmA('none');
          playSound('/sounds/correct.mp3');
          createAlert?.('Correto!', 'B − A = ∅ (B está contido em A).', 'success', 3500);
          setStep('calcPAmB');
        } else {
          setFeedbackBmA('wrong');
          playSound('/sounds/incorrect.mp3');
          createAlert?.('Tente novamente', 'B − A é vazio neste caso — não marque nenhuma célula.', 'error', 5000);
        }
        return;
      }
      const fb = evaluateMarks(marksBmA, correctSets.BmA);
      setFeedbackBmA(fb);
      if (fb === 'none') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Marcação de B − A completa.', 'success', 3000);
        setStep('calcPAmB');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares de B − A.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'B − A: pares que satisfazem B mas NÃO satisfazem A.', 'error', 4500);
      }
    }, [marksBmA, correctSets.BmA, correctSets.nBmA, evaluateMarks, createAlert]);

    // ── Validações de cálculo ────────────────────────────────────
    const validatePAmB = useCallback(() => {
      scrollDiceToTop();
      const v = validateFractionSeparate(pAmBNum, pAmBDen, correctSets.nAmB, 36);
      setPAmBNumError(v.numError);
      setPAmBDenError(v.denError);
      if (v.ok) {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `P(A − B) = ${correctSets.nAmB}/36.`, 'success', 3000);
        setStep('calcPBmA');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'P(A − B) = n(A − B) / 36. Frações equivalentes são aceitas.', 'error', 4500);
      }
    }, [pAmBNum, pAmBDen, correctSets.nAmB, createAlert]);

    const validatePBmA = useCallback(() => {
      scrollDiceToTop();
      const v = validateFractionSeparate(pBmANum, pBmADen, correctSets.nBmA, 36);
      setPBmANumError(v.numError);
      setPBmADenError(v.denError);
      if (v.ok) {
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(B − A) = ${correctSets.nBmA}/36. Exercício concluído.`, 'success', 4000);
        setStep('done');
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'P(B − A) = n(B − A) / 36. Frações equivalentes são aceitas.', 'error', 4500);
      }
    }, [pBmANum, pBmADen, correctSets.nBmA, createAlert]);

    // ── Reset ────────────────────────────────────────────────────
    const resetForNewRound = useCallback((newRound: number) => {
      const pair = selectPairForExercise3(newRound, usedPairIds);
      setUsedPairIds(prev => new Set(prev).add(pair.id));
      setCurrentPair(pair);
      setRound(newRound);
      setStep('intro');
      setMarksA(createEmptyMatrix()); setMarksB(createEmptyMatrix());
      setMarksAmB(createEmptyMatrix()); setMarksBmA(createEmptyMatrix());
      setFeedbackA('none'); setFeedbackB('none');
      setFeedbackAmB('none'); setFeedbackBmA('none');
      setPAmBNum(''); setPAmBDen(''); setPAmBNumError(false); setPAmBDenError(false);
      setPBmANum(''); setPBmADen(''); setPBmANumError(false); setPBmADenError(false);
    }, [usedPairIds]);

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

    useImperativeHandle(ref, () => ({
      advance: advanceStep,
      back: backStep,
      canAdvance: () => STEP_SEQUENCE.indexOf(step) >= 0,
      canBack: () => STEP_SEQUENCE.indexOf(step) > 0 || !!onRequestPreviousPhase,
    }), [advanceStep, backStep, step, onRequestPreviousPhase]);

    // ── Props do MarkingTable conforme step ──────────────────────
    const tableProps = useMemo(() => {
      switch (step) {
        case 'markA':
          return {
            marks: marksA, onToggle: toggleA, eventLabel: 'A' as string | null,
            readOnlyMarks: [] as { label: string; matrix: MarkMatrix }[],
          };
        case 'markB':
          return {
            marks: marksB, onToggle: toggleB, eventLabel: 'B' as string | null,
            readOnlyMarks: [{ label: 'A', matrix: marksA }],
          };
        case 'markAmB':
          return {
            marks: marksAmB, onToggle: toggleAmB, eventLabel: 'A-B' as string | null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
            ],
          };
        case 'markBmA':
          return {
            marks: marksBmA, onToggle: toggleBmA, eventLabel: 'B-A' as string | null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A-B', matrix: marksAmB },
            ],
          };
        default:
          return {
            marks: marksA, onToggle: () => {}, eventLabel: null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A-B', matrix: marksAmB },
              { label: 'B-A', matrix: marksBmA },
            ],
          };
      }
    }, [step, marksA, marksB, marksAmB, marksBmA, toggleA, toggleB, toggleAmB, toggleBmA]);

    const feedbackMessage = (fb: FeedbackState, expected: number, marked: number) => {
      if (fb === 'none') return null;
      if (fb === 'wrong') {
        return (
          <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
            Há células marcadas que <strong>não pertencem</strong> ao evento. Revise sua seleção.
          </p>
        );
      }
      const diff = expected - marked;
      return (
        <p className="ds-small mt-nano text-center text-feedback-warning-dark font-medium">
          Faltam <strong>{diff}</strong> {diff === 1 ? 'célula' : 'células'} para completar a marcação.
        </p>
      );
    };

    const marksCountByStep = useMemo(() => {
      switch (step) {
        case 'markA': return matrixToKeySet(marksA).size;
        case 'markB': return matrixToKeySet(marksB).size;
        case 'markAmB': return matrixToKeySet(marksAmB).size;
        case 'markBmA': return matrixToKeySet(marksBmA).size;
        default: return 0;
      }
    }, [step, marksA, marksB, marksAmB, marksBmA]);

    // Chips de histórico (somente o que já foi calculado)
    const historyChips = useMemo(() => {
      const chips: Array<{ label: string; num: number; color: string }> = [];
      if (step === 'calcPBmA')
        chips.push({ label: 'P(A−B)', num: correctSets.nAmB, color: EVENT_COLORS['A-B'] });
      return chips;
    }, [step, correctSets]);

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
      <div className="w-full max-w-[1216px] mx-auto">
        <style>{`
          @keyframes exerciseFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          [data-ex-panel] { animation: exerciseFadeIn 0.28s ease-out both; }
          @media (prefers-reduced-motion: reduce) {
            [data-ex-panel] { animation: none !important; }
          }
        `}</style>

        <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-micro">
          Exercício 3 — Diferenças de eventos
        </h2>

        {step !== 'intro' && step !== 'done' && <ProgressIndicator step={step} />}

        {round > 0 && step === 'intro' && (
          <p className="ds-small text-center text-neutral-dark mb-micro">
            Rodada {round + 1} — novo par de eventos
          </p>
        )}

        {/* Enunciado fixo */}
        {step !== 'intro' && step !== 'done' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter mb-micro" data-ex-panel>
            <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
              No lançamento simultâneo de dois dados equilibrados, considere os eventos:
            </p>
            <div className="flex flex-col md:flex-row gap-micro justify-center items-stretch">
              <EventCard label="A" description={currentPair.eventA.description} />
              <EventCard label="B" description={currentPair.eventB.description} />
            </div>
          </div>
        )}

        {/* Intro */}
        {step === 'intro' && (
          <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto" data-ex-panel>
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Diferenças de eventos: <span className="whitespace-nowrap">A − B</span> e <span className="whitespace-nowrap">B − A</span>
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              Neste exercício você vai identificar dois eventos derivados de A e B:
            </p>
            <ul className="ds-body text-neutral-black mb-micro pl-xxs list-disc leading-relaxed">
              <li><strong style={{ color: EVENT_COLORS['A-B'], whiteSpace: 'nowrap' }}>A − B</strong>: casos em que <em>A ocorre</em> e <em>B não ocorre</em></li>
              <li><strong style={{ color: EVENT_COLORS['B-A'], whiteSpace: 'nowrap' }}>B − A</strong>: casos em que <em>B ocorre</em> e <em>A não ocorre</em></li>
            </ul>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              As marcações de A e B servem apenas para você visualizar a estrutura.
              Depois você calculará apenas <strong className="whitespace-nowrap">P(A − B)</strong> e{' '}
              <strong className="whitespace-nowrap">P(B − A)</strong>.
            </p>
            <div className="flex justify-center mt-macro">
              <Button
                style="primary"
                size="medium"
                onClick={() => { playSound('/sounds/nextChallenge.mp3'); setStep('markA'); }}
              >
                Começar
              </Button>
            </div>
          </div>
        )}

        {/* Tabela persistente */}
        {step !== 'intro' && step !== 'done' && (
          <div className="mb-micro" data-ex-panel>
            <MarkingTable
              marks={tableProps.marks}
              onToggle={tableProps.onToggle}
              eventLabel={tableProps.eventLabel}
              readOnlyMarks={tableProps.readOnlyMarks}
            />
          </div>
        )}

        {/* Histórico colapsável — só aparece no último passo de cálculo */}
        {step === 'calcPBmA' && historyChips.length > 0 && (
          <div
            className="mb-micro rounded-md"
            style={{
              background: 'var(--color-brand-otimath-lightest)',
              border: '1px solid var(--color-brand-otimath-light)',
              padding: '8px 12px',
            }}
          >
            <button
              type="button"
              onClick={() => setHistoryCollapsed(v => !v)}
              className="flex items-center justify-between w-full"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-expanded={!historyCollapsed}
            >
              <span className="ds-caption-bold text-[0.78rem]">
                Valores já calculados ({historyChips.length} conquistas)
              </span>
              <span aria-hidden style={{ fontWeight: 700 }}>
                {historyCollapsed ? '▾' : '▴'}
              </span>
            </button>
            {!historyCollapsed && (
              <div className="flex flex-wrap gap-x-micro gap-y-nano mt-nano">
                {historyChips.map(chip => (
                  <HistoryChip
                    key={chip.label}
                    label={chip.label}
                    num={chip.num}
                    den={36}
                    color={chip.color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* markA */}
        {step === 'markA' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A'] }}>
              Passo 1 — Marcar o evento A
            </p>
            <p className="ds-body text-neutral-black text-center mt-nano text-justify">
              Marque na tabela <strong>todas as células</strong> em que ocorre o evento A
              (<em>{currentPair.eventA.description}</em>).
            </p>
            {feedbackMessage(feedbackA, correctSets.nA, marksCountByStep)}
            <p className="ds-small text-center text-neutral-dark mt-nano italic">
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>Marque todos</Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>Limpar</Button>
              <Button style="primary" size="small" onClick={validateMarkA}>Validar</Button>
            </div>
          </div>
        )}

        {/* markB */}
        {step === 'markB' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['B'] }}>
              Passo 2 — Marcar o evento B
            </p>
            <p className="ds-body text-neutral-black text-center mt-nano text-justify">
              Agora marque as células em que ocorre o evento B
              (<em>{currentPair.eventB.description}</em>).
            </p>
            {feedbackMessage(feedbackB, correctSets.nB, marksCountByStep)}
            <p className="ds-small text-center text-neutral-dark mt-nano italic">
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>Marque todos</Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>Limpar</Button>
              <Button style="primary" size="small" onClick={validateMarkB}>Validar</Button>
            </div>
          </div>
        )}

        {/* markAmB */}
        {step === 'markAmB' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A-B'] }}>
              Passo 3 — Marcar <span className="whitespace-nowrap">A − B</span>
            </p>
            <p className="ds-body text-neutral-black text-center mt-nano text-justify">
              Marque os casos favoráveis ao evento <strong className="whitespace-nowrap">A − B</strong>:{' '}
              <em>ocorre A e não ocorre B</em>.
            </p>
            {feedbackAmB !== 'none' && (
              <p
                className="ds-small mt-micro text-center text-feedback-warning-dark font-medium"
              >
                Estamos marcando os casos em que <strong>A ocorre</strong> mas{' '}
                <strong>B não ocorre</strong>.
                {correctSets.nAmB === 0 && ' Neste problema, pode ser que nenhuma célula satisfaça essa condição.'}
              </p>
            )}
            <p className="ds-small text-center text-neutral-dark mt-nano italic">
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>Marque todos</Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>Limpar</Button>
              <Button style="primary" size="small" onClick={validateMarkAmB}>Validar</Button>
            </div>
          </div>
        )}

        {/* markBmA */}
        {step === 'markBmA' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['B-A'] }}>
              Passo 4 — Marcar <span className="whitespace-nowrap">B − A</span>
            </p>
            <p className="ds-body text-neutral-black text-center mt-nano text-justify">
              Marque os casos favoráveis ao evento <strong className="whitespace-nowrap">B − A</strong>:{' '}
              <em>ocorre B e não ocorre A</em>.
            </p>
            {feedbackBmA !== 'none' && (
              <p
                className="ds-small mt-micro text-center text-feedback-warning-dark font-medium"
              >
                Estamos marcando os casos em que <strong>B ocorre</strong> mas{' '}
                <strong>A não ocorre</strong>.
                {correctSets.nBmA === 0 && ' Neste problema, pode ser que nenhuma célula satisfaça essa condição.'}
              </p>
            )}
            <p className="ds-small text-center text-neutral-dark mt-nano italic">
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>Marque todos</Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>Limpar</Button>
              <Button style="primary" size="small" onClick={validateMarkBmA}>Validar</Button>
            </div>
          </div>
        )}

        {/* calcPAmB */}
        {step === 'calcPAmB' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A-B'] }}>
              Passo 5 — Calcular <span className="whitespace-nowrap">P(A − B)</span>
            </p>
            <p className="ds-body text-neutral-black mt-nano text-justify">
              Qual é a probabilidade de ocorrer A e não ocorrer B?
            </p>
            <div className="flex items-center justify-center gap-x-micro mt-micro">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A-B'], whiteSpace: 'nowrap' }}>P(A − B) =</span>
              <FractionInput
                num={pAmBNum} den={pAmBDen}
                setNum={setPAmBNum} setDen={setPAmBDen}
                error={pAmBNumError || pAmBDenError}
                onEnter={validatePAmB}
              />
            </div>
            {pAmBNumError && (
              <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                Digite corretamente o número de casos favoráveis ao evento.
              </p>
            )}
            {pAmBDenError && (
              <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                Digite o total de casos possíveis no lançamento de dois dados.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePAmB}>Validar</Button>
            </div>
          </div>
        )}

        {/* calcPBmA */}
        {step === 'calcPBmA' && (
          <div className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto" data-ex-panel>
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['B-A'] }}>
              Passo 6 — Calcular <span className="whitespace-nowrap">P(B − A)</span>
            </p>
            <p className="ds-body text-neutral-black mt-nano text-justify">
              Qual é a probabilidade de ocorrer B e não ocorrer A?
            </p>
            <div className="flex items-center justify-center gap-x-micro mt-micro">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['B-A'], whiteSpace: 'nowrap' }}>P(B − A) =</span>
              <FractionInput
                num={pBmANum} den={pBmADen}
                setNum={setPBmANum} setDen={setPBmADen}
                error={pBmANumError || pBmADenError}
                onEnter={validatePBmA}
              />
            </div>
            {pBmANumError && (
              <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                Digite corretamente o número de casos favoráveis ao evento.
              </p>
            )}
            {pBmADenError && (
              <p className="ds-small mt-nano text-center text-feedback-error-dark font-medium">
                Digite o total de casos possíveis no lançamento de dois dados.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePBmA}>Validar</Button>
            </div>
          </div>
        )}

        {/* done */}
        {step === 'done' && (
          <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto" data-ex-panel>
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Exercício 3 concluído
            </p>
            <div className="bg-neutral-white rounded-md p-micro mb-micro border-2 border-brand-otimath-pure">
              <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
                Resumo das probabilidades
              </p>
              <div className="flex flex-wrap gap-x-micro gap-y-nano justify-center mt-nano">
                <HistoryChip label="P(A−B)" num={correctSets.nAmB} den={36} color={EVENT_COLORS['A-B']} />
                <HistoryChip label="P(B−A)" num={correctSets.nBmA} den={36} color={EVENT_COLORS['B-A']} />
              </div>
            </div>
            <p className="ds-body text-neutral-black mt-micro text-justify">
              Você explorou as <strong>diferenças de eventos</strong>: os casos em que só A
              ocorre (<span className="whitespace-nowrap">A − B</span>) e os casos em que só B ocorre (<span className="whitespace-nowrap">B − A</span>).
              {correctSets.nI === 0 && (
                <> Neste problema, como <span className="whitespace-nowrap">A ∩ B = ∅</span>, observe que <strong className="whitespace-nowrap">A − B = A</strong> e
                {' '}<strong className="whitespace-nowrap">B − A = B</strong>.</>
              )}
            </p>

            <div className="flex flex-col items-center gap-y-micro mt-macro">
              <Button
                style="secondary"
                size="small"
                onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  resetForNewRound(round + 1);
                }}
              >
                Praticar novamente
              </Button>
              <Button
                style="primary"
                size="small"
                onClick={() => {
                  playSound('/sounds/gameFinished.mp3');
                  onFinished();
                }}
              >
                Concluir exercício
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
