'use client';

/* ═══════════════════════════════════════════════════════════════
   UnionExercise2 — Exercício 2 da trilha opcional.

   Tema: união de eventos MUTUAMENTE EXCLUSIVOS.
   Gerador: eventPairExclusive (6 famílias paramétricas com A∩B=∅).

   Fluxo didaticamente simplificado em relação ao Ex1:

     intro    → enunciado + botão Começar
     markA    → marcar A na tabela; Validar
     markB    → A congelado, marcar B; Validar
     markI    → aluno DEIXA EM BRANCO e confirma (A∩B = ∅)
     calcPAUB → fórmula dada + substituição direta + resultado final
     done     → card de síntese + botões (nova rodada / concluir)

   Pedagogia: como P(A∩B) = 0, a substituição direta revela o caso
   particular P(A∪B) = P(A) + P(B). O aluno internaliza que a fórmula
   geral se reduz a uma soma quando os eventos são excludentes.
   ═══════════════════════════════════════════════════════════════ */

import React, {
  useState, useCallback, useMemo, useEffect,
  forwardRef, useImperativeHandle,
} from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import { useTelemetryExercise, useReadingTelemetry, telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';
import {
  EventPair,
  verifyEventTableConsistency,
  pairsMatching, setIntersection,
  MarkMatrix, createEmptyMatrix, matrixToKeySet,
  EVENT_COLORS, isEquivalentFraction,
} from './shared/eventPair';
import { selectExclusivePairForRound } from './shared/eventPairExclusive';
import { MarkingTable, EventCard } from './shared/MarkingTable';
import {
  FractionInput,
  formatDecimal, formatPercent,
} from './shared/FractionInput';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

type ExStep =
  | 'intro'
  | 'markA' | 'markB' | 'markI'
  | 'calcPAUB'
  | 'done';

type FeedbackState = 'none' | 'incomplete' | 'wrong';

const STEP_SEQUENCE: ExStep[] = [
  'intro',
  'markA', 'markB', 'markI',
  'calcPAUB',
  'done',
];

interface UnionExercise2Props {
  onFinished: () => void;
  /** Chamado quando o aluno clica em voltar estando no passo inicial ('intro').
   *  Deve navegar para a fase anterior (unionExercises/Ex1) no estado 'done'. */
  onRequestPreviousPhase?: () => void;
  /** Passo inicial ao montar. Default: 'intro'. */
  initialStep?: ExStep;
  /** Toast alert do OVA (propagado pelo TwoDicesExperiment). */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number, userResponse?: string) => void;
}

export interface UnionExercise2Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

// Extrai o predicado curto para combinar descA + descB com conectivo "ou"
// sem repetir "a soma é/está" — mesma técnica usada no Ex1.
function extractSumPredicate(description: string): string {
  return description
    .replace(/^A\s+soma\s+é\s+/i, '')
    .replace(/^A\s+soma\s+está\s+/i, '')
    .replace(/^A\s+soma\s+/i, '')
    .trim();
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS INDICATOR
// ═══════════════════════════════════════════════════════════════

const PROGRESS_LABELS: { step: ExStep; label: string }[] = [
  { step: 'markA', label: 'A' },
  { step: 'markB', label: 'B' },
  { step: 'markI', label: 'A∩B' },
  { step: 'calcPAUB', label: 'P(A∪B)' },
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
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const UnionExercise2 = forwardRef<UnionExercise2Handle, UnionExercise2Props>(
  function UnionExercise2({ onFinished, onRequestPreviousPhase, initialStep, createAlert }, ref) {
    // ── Estado de rodada e par ───────────────────────────────────
    const [step, setStep] = useState<ExStep>(initialStep ?? 'intro');
    // Telemetria — leitura do enunciado do Ex.2 ('intro' → 'markA').
    const confirmReadIntro = useReadingTelemetry(
      step === 'intro',
      'twoDices-cena7-unionExercise2-intro',
      'Leitura — Enunciado do Exercício 2 (eventos mutuamente exclusivos)',
      'Painel inicial com enunciado: validar A∩B=∅ e aplicar P(A∪B) = P(A)+P(B).',
      'confirmou leitura do enunciado e clicou em "Começar"',
    );
    const [round, setRound] = useState(0);
    const [usedPairIds, setUsedPairIds] = useState<Set<string>>(new Set());
    const [currentPair, setCurrentPair] = useState<EventPair>(
      () => selectExclusivePairForRound(0, new Set()),
    );

    // SEÇÃO POR STEP — título DINÂMICO reflete a tela atual.
    // Contas das células favoráveis (no Ex2 são mutuamente exclusivos → nI=0).
    const A_UE2_set = pairsMatching(currentPair.eventA.predicate);
    const B_UE2_set = pairsMatching(currentPair.eventB.predicate);
    const nA_UE2 = A_UE2_set.size;
    const nB_UE2 = B_UE2_set.size;
    const nI_UE2 = setIntersection(A_UE2_set, B_UE2_set).size;
    const nU_UE2 = nA_UE2 + nB_UE2 - nI_UE2;
    const stepLabelUE2 = step === 'intro' ? 'Enunciado'
                       : step === 'markA' ? 'Marcar evento A na tabela'
                       : step === 'markB' ? 'Marcar evento B na tabela'
                       : step === 'markI' ? 'Verificar A∩B = ∅'
                       : step === 'calcPAUB' ? 'Calcular P(A∪B) = P(A) + P(B)'
                       : step === 'done' ? 'Síntese / concluído'
                       : String(step);
    const eventLabelsUE2 = currentPair
      ? `A: "${currentPair.eventA?.description ?? '?'}" (n(A) = ${nA_UE2}) | B: "${currentPair.eventB?.description ?? '?'}" (n(B) = ${nB_UE2}) | A ∩ B: n(A∩B) = ${nI_UE2} (mutuamente exclusivos → vazio) | A ∪ B: n(A∪B) = ${nU_UE2} | Espaço amostral: 36`
      : '';
    const oQueCalculaUE2 =
      step === 'intro' ? 'Leitura do enunciado: validar A∩B=∅ e aplicar fórmula reduzida.'
      : step === 'markA' ? `Marcação das ${nA_UE2} células favoráveis a A.`
      : step === 'markB' ? `Marcação das ${nB_UE2} células favoráveis a B (sem sobreposição).`
      : step === 'markI' ? 'Validação visual de que A∩B = ∅ (nenhuma célula marcada nos dois eventos).'
      : step === 'calcPAUB' ? `Cálculo de P(A∪B) via fórmula reduzida (sem termo de interseção): P(A∪B) = P(A) + P(B) = ${nA_UE2}/36 + ${nB_UE2}/36 = ${nU_UE2}/36.`
      : step === 'done' ? `Síntese: P(A∪B) = ${nU_UE2}/36 (eventos mutuamente exclusivos). Rodada ${round + 1} concluída.`
      : '';
    useTelemetryExercise(
      `twoDices-cena7-unionExercise2-${step}`,
      `Exercício 2 — Eventos mutuamente exclusivos — ${stepLabelUE2} (rodada ${round + 1}; A=${currentPair.eventA?.description ?? '?'})`,
      `Atividade global: Aluno valida que A∩B=∅ e aplica a fórmula reduzida P(A∪B) = P(A) + P(B). | Eventos do problema atual: ${eventLabelsUE2} | Fase atual: ${stepLabelUE2}. | Ação atual do aluno / cálculo: ${oQueCalculaUE2}`,
    );

    // ── Estado de marcações ──────────────────────────────────────
    const [marksA, setMarksA] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksB, setMarksB] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksI, setMarksI] = useState<MarkMatrix>(createEmptyMatrix);

    const [feedbackA, setFeedbackA] = useState<FeedbackState>('none');
    const [feedbackB, setFeedbackB] = useState<FeedbackState>('none');
    const [feedbackI, setFeedbackI] = useState<FeedbackState>('none');

    // ── Estado de cálculo P(A∪B) via fórmula ─────────────────────
    // Substituição das 3 frações (aluno preenche direto)
    const [subANum, setSubANum] = useState('');
    const [subADen, setSubADen] = useState('');
    const [subBNum, setSubBNum] = useState('');
    const [subBDen, setSubBDen] = useState('');
    const [subINum, setSubINum] = useState('');
    const [subIDen, setSubIDen] = useState('');
    const [subError, setSubError] = useState(false);

    // Resultado final
    const [pAUBNum, setPAUBNum] = useState('');
    const [pAUBDen, setPAUBDen] = useState('');
    const [pAUBError, setPAUBError] = useState(false);

    // ── Conjuntos corretos ───────────────────────────────────────
    const correctSets = useMemo(() => {
      const A = pairsMatching(currentPair.eventA.predicate);
      const B = pairsMatching(currentPair.eventB.predicate);
      const I = setIntersection(A, B); // esperado: vazio por construção
      const U = new Set<string>([...A, ...B]);
      return { A, B, I, U, nA: A.size, nB: B.size, nI: I.size, nU: U.size };
    }, [currentPair]);

    // Blindagem DEV: verifica consistência + confirma A ∩ B = ∅
    useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      const result = verifyEventTableConsistency(
        currentPair.eventA,
        currentPair.eventB,
        correctSets,
      );
      if (!result.ok) {
        console.error(
          `[UnionExercise2] Inconsistência no par "${currentPair.id}":`,
          result.violations,
        );
      }
      if (correctSets.nI !== 0) {
        console.error(
          `[UnionExercise2] Par "${currentPair.id}" tem A ∩ B não-vazio ` +
          `(|A∩B|=${correctSets.nI}) — violação do invariante de exclusão mútua.`,
        );
      }
    }, [currentPair, correctSets]);

    useEffect(() => {
      if (usedPairIds.size === 0) {
        setUsedPairIds(new Set([currentPair.id]));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers de marcação ─────────────────────────────────────
    // Telemetria FORA dos updaters de setState — StrictMode em dev dispara
    // o callback duas vezes para detectar side effects, e logar dentro
    // causava dupla coleta por clique. Lemos o estado atual via closure.
    const toggleA = useCallback((r: number, c: number) => {
      const wasMarked = marksA[r][c];
      telemetryRecordInteracaoExercicio(`${wasMarked ? 'desmarcou' : 'marcou'} célula (${r + 1}, ${c + 1}) como evento A`);
      setMarksA(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackA('none');
    }, [marksA]);

    const toggleB = useCallback((r: number, c: number) => {
      const wasMarked = marksB[r][c];
      telemetryRecordInteracaoExercicio(`${wasMarked ? 'desmarcou' : 'marcou'} célula (${r + 1}, ${c + 1}) como evento B`);
      setMarksB(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackB('none');
    }, [marksB]);

    const toggleI = useCallback((r: number, c: number) => {
      const wasMarked = marksI[r][c];
      telemetryRecordInteracaoExercicio(`${wasMarked ? 'desmarcou' : 'marcou'} célula (${r + 1}, ${c + 1}) como A∩B`);
      setMarksI(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackI('none');
    }, [marksI]);

    const makeFullMatrix = (): MarkMatrix =>
      Array.from({ length: 6 }, () => Array(6).fill(true));

    const markAllCurrent = useCallback(() => {
      if (step === 'markA') { setMarksA(makeFullMatrix()); setFeedbackA('none'); }
      else if (step === 'markB') { setMarksB(makeFullMatrix()); setFeedbackB('none'); }
      else if (step === 'markI') { setMarksI(makeFullMatrix()); setFeedbackI('none'); }
      playSound('/sounds/clear.mp3');
    }, [step]);

    const clearCurrent = useCallback(() => {
      if (step === 'markA') { setMarksA(createEmptyMatrix()); setFeedbackA('none'); }
      else if (step === 'markB') { setMarksB(createEmptyMatrix()); setFeedbackB('none'); }
      else if (step === 'markI') { setMarksI(createEmptyMatrix()); setFeedbackI('none'); }
      playSound('/sounds/clear.mp3');
    }, [step]);

    // ── Avaliação de marcação ────────────────────────────────────
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
        setStep('markI');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'Há marcações que não satisfazem o evento B.', 'error', 4000);
      }
    }, [marksB, correctSets.B, evaluateMarks, createAlert]);

    // Validação especial: esperado é ZERO células (A ∩ B = ∅)
    const validateMarkI = useCallback(() => {
      scrollDiceToTop();
      const markedCount = matrixToKeySet(marksI).size;
      if (markedCount === 0) {
        setFeedbackI('none');
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'A e B são mutuamente exclusivos: A ∩ B = ∅.', 'success', 3500);
        setStep('calcPAUB');
      } else {
        setFeedbackI('wrong');
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'A e B são mutuamente exclusivos — nenhum par satisfaz os dois ao mesmo tempo.', 'error', 5000);
      }
    }, [marksI, createAlert]);

    // ── Validação do cálculo final ───────────────────────────────
    const validatePAUB = useCallback(() => {
      scrollDiceToTop();
      // Verifica substituições: P(A)=nA/36, P(B)=nB/36, P(A∩B)=0
      const subAOk = isEquivalentFraction(subANum, subADen, correctSets.nA, 36);
      const subBOk = isEquivalentFraction(subBNum, subBDen, correctSets.nB, 36);
      // P(A∩B) = 0/36 ou equivalente — num=0 e den>0 é aceito
      const subINumParsed = parseInt(subINum.trim(), 10);
      const subIDenParsed = parseInt(subIDen.trim(), 10);
      const subIOk = Number.isInteger(subINumParsed) && subINumParsed === 0
        && Number.isInteger(subIDenParsed) && subIDenParsed > 0;

      const respUnion =
        `Substituições: P(A)=${subANum || '_'}/${subADen || '_'}, ` +
        `P(B)=${subBNum || '_'}/${subBDen || '_'}, ` +
        `P(A∩B)=${subINum || '_'}/${subIDen || '_'} | ` +
        `P(A∪B)=${pAUBNum || '_'}/${pAUBDen || '_'} ` +
        `(esperado: ${correctSets.nA}/36 + ${correctSets.nB}/36 + 0/36 → ${correctSets.nU}/36)`;
      if (!subAOk || !subBOk || !subIOk) {
        setSubError(true);
        setPAUBError(false);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Substitua P(A), P(B) e P(A ∩ B) = 0 (já que A e B são exclusivos).', 'error', 5000, respUnion);
        return;
      }
      setSubError(false);

      if (isEquivalentFraction(pAUBNum, pAUBDen, correctSets.nU, 36)) {
        setPAUBError(false);
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(A ∪ B) = ${correctSets.nU}/36. Exercício concluído.`, 'success', 4000, respUnion);
        setStep('done');
      } else {
        setPAUBError(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Como A ∩ B = ∅, basta somar P(A) + P(B).', 'error', 4500, respUnion);
      }
    }, [
      subANum, subADen, subBNum, subBDen, subINum, subIDen,
      pAUBNum, pAUBDen,
      correctSets.nA, correctSets.nB, correctSets.nU,
      createAlert,
    ]);

    // ── Reset para nova rodada ───────────────────────────────────
    const resetForNewRound = useCallback((newRound: number) => {
      const pair = selectExclusivePairForRound(newRound, usedPairIds);
      setUsedPairIds(prev => new Set(prev).add(pair.id));
      setCurrentPair(pair);
      setRound(newRound);
      setStep('intro');
      setMarksA(createEmptyMatrix());
      setMarksB(createEmptyMatrix());
      setMarksI(createEmptyMatrix());
      setFeedbackA('none'); setFeedbackB('none'); setFeedbackI('none');
      setSubANum(''); setSubADen('');
      setSubBNum(''); setSubBDen('');
      setSubINum(''); setSubIDen('');
      setSubError(false);
      setPAUBNum(''); setPAUBDen(''); setPAUBError(false);
    }, [usedPairIds]);

    // ── Navegação dev ────────────────────────────────────────────
    const advanceStep = useCallback(() => {
      const idx = STEP_SEQUENCE.indexOf(step);
      if (idx < 0) return;
      if (idx === STEP_SEQUENCE.length - 1) {
        onFinished();
        return;
      }
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

    // ── Props do MarkingTable por step ───────────────────────────
    const tableProps = useMemo(() => {
      switch (step) {
        case 'markA':
          return {
            marks: marksA, onToggle: toggleA,
            eventLabel: 'A' as string | null,
            readOnlyMarks: [] as { label: string; matrix: MarkMatrix }[],
          };
        case 'markB':
          return {
            marks: marksB, onToggle: toggleB,
            eventLabel: 'B' as string | null,
            readOnlyMarks: [{ label: 'A', matrix: marksA }],
          };
        case 'markI':
          return {
            marks: marksI, onToggle: toggleI,
            eventLabel: 'A∩B' as string | null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
            ],
          };
        default:
          return {
            marks: marksI, onToggle: () => {},
            eventLabel: null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
            ],
          };
      }
    }, [step, marksA, marksB, marksI, toggleA, toggleB, toggleI]);

    const feedbackMessage = (fb: FeedbackState, expected: number, marked: number) => {
      if (fb === 'none') return null;
      if (fb === 'wrong') {
        return (
          <p
            className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
          >
            Há células marcadas que <strong>não pertencem</strong> ao evento. Revise sua
            seleção na tabela.
          </p>
        );
      }
      const diff = expected - marked;
      return (
        <p
          className="ds-small mt-nano text-center text-feedback-warning-dark font-medium"
        >
          Faltam <strong>{diff}</strong> {diff === 1 ? 'célula' : 'células'} para completar
          a marcação.
        </p>
      );
    };

    const marksCountByStep = useMemo(() => {
      switch (step) {
        case 'markA': return matrixToKeySet(marksA).size;
        case 'markB': return matrixToKeySet(marksB).size;
        case 'markI': return matrixToKeySet(marksI).size;
        default: return 0;
      }
    }, [step, marksA, marksB, marksI]);

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
          [data-ex-panel] {
            animation: exerciseFadeIn 0.28s ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            [data-ex-panel] { animation: none !important; }
          }
        `}</style>

        <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-micro">
          Exercício 2 — União de eventos mutuamente exclusivos
        </h2>

        {step !== 'intro' && step !== 'done' && <ProgressIndicator step={step} />}

        {round > 0 && step === 'intro' && (
          <p className="ds-small text-center text-neutral-dark mb-micro">
            Rodada {round + 1} de 3 — novo par de eventos exclusivos
          </p>
        )}

        {/* ══════ ENUNCIADO FIXO ══════ */}
        {step !== 'intro' && step !== 'done' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter mb-micro"
            data-ex-panel
          >
            <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
              No lançamento simultâneo de dois dados equilibrados, considere os eventos:
            </p>
            <div className="flex flex-col md:flex-row gap-micro justify-center items-stretch">
              <EventCard label="A" description={currentPair.eventA.description} />
              <EventCard label="B" description={currentPair.eventB.description} />
            </div>
          </div>
        )}

        {/* ══════ INTRO ══════ */}
        {step === 'intro' && (
          <div
            className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto"
            data-ex-panel
          >
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Caso particular: eventos mutuamente exclusivos
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              Agora você vai aplicar a fórmula da união em um caso especial: eventos A e B
              que <strong>não podem ocorrer ao mesmo tempo</strong>. Observe o que acontece
              com <span className="whitespace-nowrap">P(A ∩ B)</span> quando isso vale.
            </p>
            <ul className="ds-body text-neutral-black mb-micro pl-xxs list-disc leading-relaxed">
              <li>Marque os casos favoráveis a <strong>A</strong> na tabela</li>
              <li>Marque os casos favoráveis a <strong>B</strong></li>
              <li>Tente identificar <strong className="whitespace-nowrap">A ∩ B</strong> (observe o que aparece)</li>
              <li>Aplique a fórmula substituindo os valores encontrados</li>
            </ul>
            <div className="flex justify-center mt-macro">
              <Button
                style="primary"
                size="medium"
                onClick={() => {
                  confirmReadIntro();
                  playSound('/sounds/nextChallenge.mp3');
                  setStep('markA');
                }}
              >
                Começar
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TABELA ══════ */}
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

        {/* ══════ markA ══════ */}
        {step === 'markA' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
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

        {/* ══════ markB ══════ */}
        {step === 'markB' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['B'] }}>
              Passo 2 — Marcar o evento B
            </p>
            <p className="ds-body text-neutral-black text-center mt-nano text-justify">
              Agora marque as células em que ocorre o evento B
              (<em>{currentPair.eventB.description}</em>). As marcações de A ficam
              congeladas.
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

        {/* ══════ markI (esperado: VAZIO) ══════ */}
        {step === 'markI' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A∩B'] }}>
              Passo 3 — Marcar os casos favoráveis ao evento:{' '}
              <em className="italic">
                {currentPair.eventA.description.toLowerCase()}
                {' e '}
                {extractSumPredicate(currentPair.eventB.description).toLowerCase()}
              </em>
              .
            </p>
            {feedbackI === 'wrong' && (
              <p
                className="ds-small mt-micro text-center text-feedback-warning-dark font-medium"
              >
                Observe com atenção: nenhuma célula pode satisfazer A <strong>e</strong> B
                ao mesmo tempo neste problema. Limpe a marcação e confirme.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-micro">
              <Button style="secondary" size="small" onClick={clearCurrent}>Limpar</Button>
              <Button style="primary" size="small" onClick={validateMarkI}>Validar</Button>
            </div>
          </div>
        )}

        {/* ══════ calcPAUB ══════ */}
        {step === 'calcPAUB' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[820px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A∪B'] }}>
              Passo 4 — Calcule a probabilidade de ocorrer{' '}
              <em className="italic">
                {currentPair.eventA.description.toLowerCase()}
                {' ou '}
                {extractSumPredicate(currentPair.eventB.description).toLowerCase()}
              </em>
              .
            </p>

            <p className="ds-body text-neutral-black mt-nano text-justify">
              Como você acabou de confirmar, <strong className="whitespace-nowrap">A ∩ B = ∅</strong> neste problema.
              Aplicando a fórmula geral da probabilidade da união, substitua os valores
              na linha seguinte:
            </p>

            <div
              className="mt-micro text-center p-micro rounded-md"
              style={{
                background: 'var(--color-brand-otimath-lightest)',
                border: '2px solid var(--color-brand-otimath-pure)',
              }}
            >
              {/* Fórmula com quebra POR GRUPOS atômicos: cada P(X) e cada
                  operador não quebram internamente; o flex-wrap permite a
                  linha INTEIRA quebrar entre dois grupos no mobile. Antes
                  era um `<p whiteSpace: nowrap>` que estourava a viewport. */}
              <div
                className="ds-heading-large flex flex-wrap items-center justify-center gap-x-micro gap-y-nano"
                style={{ color: 'var(--color-brand-otimath-dark)', marginBottom: 12 }}
              >
                <span className="whitespace-nowrap">P(A ∪ B)</span>
                <span className="whitespace-nowrap">=</span>
                <span className="whitespace-nowrap">P(A)</span>
                <span className="whitespace-nowrap">+</span>
                <span className="whitespace-nowrap">P(B)</span>
                <span className="whitespace-nowrap">−</span>
                <span className="whitespace-nowrap">P(A ∩ B)</span>
              </div>

              <div className="flex justify-center mt-nano" style={{ maxWidth: '100%' }}>
                <div className="flex flex-nowrap items-center gap-x-micro overflow-x-auto" style={{ maxWidth: '100%' }}>
                  <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'], whiteSpace: 'nowrap', flexShrink: 0 }}>
                    P(A ∪ B) =
                  </span>
                  <FractionInput
                    num={subANum} den={subADen}
                    setNum={setSubANum} setDen={setSubADen}
                    error={subError}
                  />
                  <span className="ds-body-bold text-neutral-darkest" style={{ flexShrink: 0 }}>+</span>
                  <FractionInput
                    num={subBNum} den={subBDen}
                    setNum={setSubBNum} setDen={setSubBDen}
                    error={subError}
                  />
                  <span className="ds-body-bold text-neutral-darkest" style={{ flexShrink: 0 }}>−</span>
                  <FractionInput
                    num={subINum} den={subIDen}
                    setNum={setSubINum} setDen={setSubIDen}
                    error={subError}
                  />
                </div>
              </div>
              {subError && (
                <p
                  className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
                >
                  Alguma fração não confere. Lembre-se: <span className="whitespace-nowrap">P(A ∩ B) = 0</span> neste caso (A e B são
                  mutuamente exclusivos).
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-x-micro mt-micro">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'], whiteSpace: 'nowrap' }}>
                P(A ∪ B) =
              </span>
              <FractionInput
                num={pAUBNum} den={pAUBDen}
                setNum={setPAUBNum} setDen={setPAUBDen}
                error={pAUBError}
                onEnter={validatePAUB}
              />
            </div>
            <p className="ds-small text-center text-neutral-dark mt-nano italic">
              Some as frações — qualquer fração equivalente é aceita.
            </p>
            {pAUBError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Fração não equivalente ao resultado esperado.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePAUB}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* ══════ done ══════ */}
        {step === 'done' && (
          <div
            className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto"
            data-ex-panel
          >
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Exercício 2 concluído
            </p>

            <div
              className="bg-neutral-white rounded-md p-micro mb-micro border-2 border-brand-otimath-pure"
            >
              <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
                Caso particular: <span className="whitespace-nowrap">A ∩ B = ∅</span>
              </p>
              <p className="ds-body text-neutral-black mt-nano text-justify">
                Quando os eventos são <strong>mutuamente exclusivos</strong>, a fórmula
                geral se reduz a:
              </p>
              {/* Fórmula simplificada (eventos mutuamente exclusivos) com
                  quebra por grupos atômicos, mesmo padrão da fórmula geral. */}
              <div
                className="ds-heading-large mt-micro text-brand-otimath-dark flex flex-wrap items-center justify-center gap-x-micro gap-y-nano"
              >
                <span className="whitespace-nowrap">P(A ∪ B)</span>
                <span className="whitespace-nowrap">=</span>
                <span className="whitespace-nowrap">P(A)</span>
                <span className="whitespace-nowrap">+</span>
                <span className="whitespace-nowrap">P(B)</span>
              </div>
              <div className="flex flex-wrap gap-x-micro gap-y-nano justify-center mt-micro">
                <div
                  className="flex items-center gap-x-nano"
                  style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--color-neutral-white)',
                    border: `2px solid ${EVENT_COLORS['A∪B']}`,
                  }}
                >
                  <span aria-hidden style={{ color: EVENT_COLORS['A∪B'], fontWeight: 800 }}>✓</span>
                  <span style={{ color: EVENT_COLORS['A∪B'], fontWeight: 700, fontSize: '0.82rem' }}>
                    P(A∪B) = {correctSets.nU}/36
                  </span>
                  <span className="text-neutral-darkest text-[0.8rem]">
                    ≈ {formatDecimal(correctSets.nU, 36, 3)}
                  </span>
                  <span className="text-neutral-darkest text-[0.8rem]">
                    ≈ {formatPercent(correctSets.nU, 36, 1)}
                  </span>
                </div>
              </div>
            </div>

            {round === 0 && (
              <p className="ds-small text-neutral-dark mt-micro text-justify italic">
                Se quiser, pode praticar novamente com um novo par de eventos exclusivos
                (até 3 rodadas).
              </p>
            )}

            <div className="flex flex-col items-center gap-y-micro mt-macro">
              {round < 2 && (
                <Button
                  style="secondary"
                  size="small"
                  onClick={() => {
                    playSound('/sounds/nextChallenge.mp3');
                    resetForNewRound(round + 1);
                  }}
                >
                  Praticar novamente (rodada {round + 2} de 3)
                </Button>
              )}
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
