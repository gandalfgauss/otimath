'use client';

/* ═══════════════════════════════════════════════════════════════
   UnionExercise1 — Exercício 1 da trilha opcional da união.

   Ordem pedagógica (fluxo estritamente sequencial, painéis revelados
   um de cada vez; histórico congelado acima do painel ativo):

     intro         → enunciado + botão Começar
     markA         → marcar A na tabela; Validar
     markB         → A congelado, marcar B; Validar
     markI         → A, B congelados, marcar A∩B deliberadamente; Validar
     calcPA        → calcular P(A) = n(A)/n(S); Validar
     calcPB        → calcular P(B) análogo; Validar
     calcPAB       → dropdown W + calcular P(A∩B); Validar
     calcPAUB      → aplicar P(A∪B) = P(A)+P(B)−P(A∩B); Validar
     done          → card de síntese + botões (nova rodada / concluir)

   Reuso integral de:
     • Gerador algorítmico paramétrico (selectPairForRound)
     • Tabela 6×6 interativa (MarkingTable)
     • Placeholders das células (DieFace, marcações cromáticas)
     • Fluxo de armamento por step → onToggle
     • Validação R14 de fração equivalente (isEquivalentFraction)
     • Cores canônicas dos eventos (EVENT_COLORS)
     • Card de evento (EventCard)
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
  EVENT_COLORS, isEquivalentFraction,
} from './shared/eventPair';
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
  | 'markA' | 'markB' | 'markI'
  | 'calcPA' | 'calcPB' | 'calcPAB'
  | 'calcPAUB'
  | 'done';

// Extrai o predicado "curto" de uma descrição de evento sobre soma.
// Exemplos:
//   "A soma é maior que 7"          → "maior que 7"
//   "A soma é par"                  → "par"
//   "A soma é múltipla de 2"        → "múltipla de 2"
//   "A soma está entre 4 e 9"       → "entre 4 e 9"
// Usado para combinar descA ("A soma é X") + descB em "A soma é X e Y"
// sem repetir o sujeito "A soma".
function extractSumPredicate(description: string): string {
  return description
    .replace(/^A\s+soma\s+é\s+/i, '')
    .replace(/^A\s+soma\s+está\s+/i, '')
    .replace(/^A\s+soma\s+/i, '')
    .trim();
}

type FeedbackState = 'none' | 'incomplete' | 'wrong';

type ExprId =
  | '' | 'A' | 'B' | 'AnB' | 'AmB' | 'BmA' | 'AuB'
  // Opções extras que aparecem no placeholder de P(A∪B) após 2 erros —
  // representam expressões equivalentes/próximas mas incorretas, exigindo
  // discriminação conceitual mais fina por parte do aluno.
  | 'AuB_minus_AnB' | 'AmB_union_BmA' | 'S_minus_AuB';

// Identificador da fórmula/operação probabilística. Usado no placeholder
// introdutório do Passo 7 — "fórmula da probabilidade {x} de dois eventos".
type OpId = '' | 'union' | 'intersection' | 'eventA' | 'eventB' | 'difference';

const STEP_SEQUENCE: ExStep[] = [
  'intro',
  'markA', 'markB', 'markI',
  'calcPA', 'calcPB', 'calcPAB', 'calcPAUB',
  'done',
];

interface UnionExercise1Props {
  onFinished: () => void;
  /** Chamado quando o aluno clica em voltar estando no passo inicial ('intro').
   *  Deve navegar para a fase anterior (unionTheory) no estado 'done'. */
  onRequestPreviousPhase?: () => void;
  /** Passo inicial ao montar. Default: 'intro'. Use 'done' para re-entrar
   *  no fim do exercício (via seta "voltar" do próximo exercício). */
  initialStep?: ExStep;
  /** Toast alert do OVA (propagado pelo TwoDicesExperiment). */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number) => void;
}

export interface UnionExercise1Handle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════════

// Chip de histórico congelado ("✓ P(A) = 21/36 ≈ 0,583 ≈ 58,3%")
// Fração exibida SEM simplificar — mantém n(X)/n(Ω) como forma canônica.
// A validação do aluno (R14) continua aceitando qualquer fração equivalente.
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

// Indicador de progresso (8 pontinhos para 8 etapas efetivas)
const PROGRESS_LABELS: { step: ExStep; label: string }[] = [
  { step: 'markA', label: 'A' },
  { step: 'markB', label: 'B' },
  { step: 'markI', label: 'A∩B' },
  { step: 'calcPA', label: 'P(A)' },
  { step: 'calcPB', label: 'P(B)' },
  { step: 'calcPAB', label: 'P(A∩B)' },
  { step: 'calcPAUB', label: 'P(A∪B)' },
];

// Dropdown inline para montagem da fórmula no Passo 7.
// Muda de cor conforme acerto (verde/vermelho/neutro).
// Quando `expanded`, acrescenta opções mais difíceis que exigem discriminação
// conceitual fina — usado no placeholder de P(A∪B) após 2 erros do aluno.
// Quando `disabled`, aparece acinzentado e não aceita interação — usado para
// bloquear a montagem da fórmula enquanto a operação correta não for escolhida.
function FormulaSelect({
  value, onChange, expected, expanded, disabled,
}: {
  value: ExprId;
  onChange: (v: ExprId) => void;
  expected: ExprId;
  expanded?: boolean;
  disabled?: boolean;
}) {
  const isEmpty = value === '';
  const isCorrect = !isEmpty && value === expected;
  const isWrong = !isEmpty && value !== expected;
  const color = disabled
    ? 'var(--color-neutral-medium)'
    : isEmpty
      ? 'var(--color-neutral-dark)'
      : isCorrect
        ? 'var(--color-feedback-success-dark)'
        : 'var(--color-feedback-error-dark)';
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as ExprId)}
      disabled={disabled}
      aria-label="Posição da fórmula"
      aria-invalid={isWrong ? 'true' : undefined}
      style={{
        padding: '3px 8px',
        borderRadius: 5,
        border: `2px solid ${color}`,
        fontWeight: 700,
        fontSize: '0.95rem',
        color,
        background: disabled ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
        minWidth: 68,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : undefined,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <option value="" disabled hidden>?</option>
      <option value="A">A</option>
      <option value="B">B</option>
      <option value="AnB">A ∩ B</option>
      <option value="AmB">A − B</option>
      <option value="BmA">B − A</option>
      <option value="AuB">A ∪ B</option>
      {expanded && (
        <>
          <option value="AuB_minus_AnB">(A ∪ B) − (A ∩ B)</option>
          <option value="AmB_union_BmA">(A − B) ∪ (B − A)</option>
          <option value="S_minus_AuB">Ω − (A ∪ B)</option>
        </>
      )}
    </select>
  );
}

// Dropdown inline para a escolha da operação probabilística no texto
// introdutório do Passo 7 ("fórmula da probabilidade {x} de dois eventos").
function OperationSelect({
  value, onChange, expected,
}: {
  value: OpId;
  onChange: (v: OpId) => void;
  expected: OpId;
}) {
  const isEmpty = value === '';
  const isCorrect = !isEmpty && value === expected;
  const isWrong = !isEmpty && value !== expected;
  const color = isEmpty
    ? 'var(--color-neutral-dark)'
    : isCorrect
      ? 'var(--color-feedback-success-dark)'
      : 'var(--color-feedback-error-dark)';
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as OpId)}
      aria-label="Fórmula da probabilidade"
      aria-invalid={isWrong ? 'true' : undefined}
      style={{
        padding: '2px 6px',
        borderRadius: 5,
        border: `2px solid ${color}`,
        fontWeight: 700,
        fontSize: '0.95rem',
        color,
        background: 'var(--color-neutral-white)',
        minWidth: 110,
        outline: 'none',
      }}
    >
      <option value="" disabled hidden>?</option>
      <option value="union">da união</option>
      <option value="intersection">da interseção</option>
      <option value="eventA">de A</option>
      <option value="eventB">de B</option>
      <option value="difference">da diferença</option>
    </select>
  );
}

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

export const UnionExercise1 = forwardRef<UnionExercise1Handle, UnionExercise1Props>(
  function UnionExercise1({ onFinished, onRequestPreviousPhase, initialStep, createAlert }, ref) {
    // ── Estado de rodada e par ───────────────────────────────────
    const [step, setStep] = useState<ExStep>(initialStep ?? 'intro');
    const [round, setRound] = useState(0);
    const [usedPairIds, setUsedPairIds] = useState<Set<string>>(new Set());
    const [currentPair, setCurrentPair] = useState<EventPair>(
      () => selectPairForRound(0, new Set()),
    );

    // ── Estado de marcações ──────────────────────────────────────
    const [marksA, setMarksA] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksB, setMarksB] = useState<MarkMatrix>(createEmptyMatrix);
    const [marksI, setMarksI] = useState<MarkMatrix>(createEmptyMatrix);

    const [feedbackA, setFeedbackA] = useState<FeedbackState>('none');
    const [feedbackB, setFeedbackB] = useState<FeedbackState>('none');
    const [feedbackI, setFeedbackI] = useState<FeedbackState>('none');

    // ── Estado de cálculos ───────────────────────────────────────
    const [pANum, setPANum] = useState('');
    const [pADen, setPADen] = useState('');
    const [pAError, setPAError] = useState(false);
    const [pANumError, setPANumError] = useState(false);
    const [pADenError, setPADenError] = useState(false);

    const [pBNum, setPBNum] = useState('');
    const [pBDen, setPBDen] = useState('');
    const [pBError, setPBError] = useState(false);
    // Erros específicos por campo no Passo 5 — feedback granular
    // (numerador → "conte os casos favoráveis"; denominador → "total de pares ordenados")
    const [pBNumError, setPBNumError] = useState(false);
    const [pBDenError, setPBDenError] = useState(false);

    const [pABExpr, setPABExpr] = useState<ExprId>('');
    const [pABNum, setPABNum] = useState('');
    const [pABDen, setPABDen] = useState('');
    const [pABError, setPABError] = useState(false);
    const [pABExprError, setPABExprError] = useState(false);

    const [pAUBNum, setPAUBNum] = useState('');
    const [pAUBDen, setPAUBDen] = useState('');
    const [pAUBError, setPAUBError] = useState(false);

    // Fórmula montada pelo aluno no Passo 7 — 4 posições
    //   P( pos1 ) = P( pos2 ) + P( pos3 ) − P( pos4 )
    //   esperados: AuB,        A,           B,           AnB
    const [formulaPos1, setFormulaPos1] = useState<ExprId>('');
    const [formulaPos2, setFormulaPos2] = useState<ExprId>('');
    const [formulaPos3, setFormulaPos3] = useState<ExprId>('');
    const [formulaPos4, setFormulaPos4] = useState<ExprId>('');

    // Sistema de dicas progressivas para o placeholder de P(A∪B) (pos1).
    // Incrementa a cada mudança para valor errado; dicas escalam até abrir
    // botão Ajuda com a fórmula explícita após 6 erros.
    const [p1ErrorCount, setP1ErrorCount] = useState(0);
    const [p1ShowHelp, setP1ShowHelp] = useState(false);

    // Placeholder introdutório do Passo 7: "fórmula da probabilidade {x}".
    // Resposta correta: "union".
    const [operationExpr, setOperationExpr] = useState<OpId>('');

    // Substituição numérica no Passo 7 — 3 frações que o aluno preenche
    //   P(A∪B) = [subA] + [subB] − [subI]
    const [subANum, setSubANum] = useState('');
    const [subADen, setSubADen] = useState('');
    const [subBNum, setSubBNum] = useState('');
    const [subBDen, setSubBDen] = useState('');
    const [subINum, setSubINum] = useState('');
    const [subIDen, setSubIDen] = useState('');
    const [subError, setSubError] = useState(false);

    // ── Histórico colapsado (mobile) ─────────────────────────────
    const [historyCollapsed, setHistoryCollapsed] = useState(false);

    // ── Computados ───────────────────────────────────────────────
    const correctSets = useMemo(() => {
      const A = pairsMatching(currentPair.eventA.predicate);
      const B = pairsMatching(currentPair.eventB.predicate);
      const I = setIntersection(A, B);
      // União calculada para verificação de consistência; n(A∪B) no cálculo é inferido pela fórmula
      const U = new Set<string>([...A, ...B]);
      return { A, B, I, U, nA: A.size, nB: B.size, nI: I.size, nU: A.size + B.size - I.size };
    }, [currentPair]);

    // Blindagem DEV: verifica que os 4 conjuntos estão consistentes
    useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      const result = verifyEventTableConsistency(
        currentPair.eventA,
        currentPair.eventB,
        correctSets,
      );
      if (!result.ok) {
        console.error(
          `[UnionExercise1] Inconsistência no par "${currentPair.id}":`,
          result.violations,
        );
      }
    }, [currentPair, correctSets]);

    // Registra o ID do par inicial
    useEffect(() => {
      if (usedPairIds.size === 0) {
        setUsedPairIds(new Set([currentPair.id]));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers de marcação ─────────────────────────────────────
    const toggleA = useCallback((r: number, c: number) => {
      setMarksA(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackA('none');
    }, []);

    const toggleB = useCallback((r: number, c: number) => {
      setMarksB(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackB('none');
    }, []);

    const toggleI = useCallback((r: number, c: number) => {
      setMarksI(prev => {
        const copy = prev.map(row => [...row]);
        copy[r][c] = !copy[r][c];
        return copy;
      });
      setFeedbackI('none');
    }, []);

    // Helpers: marcar todas as 36 células ou limpar todas — facilitam
    // estratégias por complemento (mais rápido em eventos densos).
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

    // ── Validações ───────────────────────────────────────────────
    const validateMarkA = useCallback(() => {
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

    const validateMarkI = useCallback(() => {
      const fb = evaluateMarks(marksI, correctSets.I);
      setFeedbackI(fb);
      if (fb === 'none') {
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', 'Marcação de A ∩ B completa.', 'success', 3000);
        setStep('calcPA');
      } else if (fb === 'incomplete') {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Quase lá', 'As marcações estão corretas, mas faltam pares de A ∩ B.', 'warning', 4000);
      } else {
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Revise a marcação', 'Verifique se cada par satisfaz A e B ao mesmo tempo.', 'error', 4000);
      }
    }, [marksI, correctSets.I, evaluateMarks, createAlert]);

    const validatePA = useCallback(() => {
      const num = parseInt(pANum.trim(), 10);
      const den = parseInt(pADen.trim(), 10);
      const numValid = Number.isInteger(num) && num >= 0;
      const denPositive = Number.isInteger(den) && den > 0;

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(correctSets.nA, 36);
      const irreducibleDen = 36 / g;

      const denIsMultipleOfIrreducible = denPositive && den % irreducibleDen === 0;
      const equivalent = numValid && denPositive && num * 36 === den * correctSets.nA;

      if (equivalent) {
        setPAError(false);
        setPANumError(false);
        setPADenError(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `P(A) = ${correctSets.nA}/36.`, 'success', 3000);
        setStep('calcPB');
        return;
      }

      const denFailed = !denIsMultipleOfIrreducible;
      const numFailed = !denFailed;

      setPAError(true);
      setPANumError(numFailed || !numValid);
      setPADenError(denFailed);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', 'P(A) = n(A) / 36. Frações equivalentes são aceitas.', 'error', 4500);
    }, [pANum, pADen, correctSets.nA, createAlert]);

    const validatePB = useCallback(() => {
      const num = parseInt(pBNum.trim(), 10);
      const den = parseInt(pBDen.trim(), 10);
      const numValid = Number.isInteger(num) && num >= 0;
      const denPositive = Number.isInteger(den) && den > 0;

      // Fração correta: nB/36. Denominador válido = múltiplo do denominador irredutível.
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(correctSets.nB, 36);
      const irreducibleDen = 36 / g;

      const denIsMultipleOfIrreducible = denPositive && den % irreducibleDen === 0;
      const equivalent = numValid && denPositive && num * 36 === den * correctSets.nB;

      if (equivalent) {
        setPBError(false);
        setPBNumError(false);
        setPBDenError(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `P(B) = ${correctSets.nB}/36.`, 'success', 3000);
        setStep('calcPAB');
        return;
      }

      // Erro — identificar qual campo falhou
      const denFailed = !denIsMultipleOfIrreducible;
      const numFailed = !denFailed; // se o denominador "está em escala", o problema é o numerador

      setPBError(true);
      setPBNumError(numFailed || !numValid);
      setPBDenError(denFailed);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', 'P(B) = n(B) / 36. Frações equivalentes são aceitas.', 'error', 4500);
    }, [pBNum, pBDen, correctSets.nB, createAlert]);

    const validatePAB = useCallback(() => {
      if (pABExpr !== 'AnB') {
        setPABExprError(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Escolha a expressão correta para a interseção.', 'error', 4000);
        return;
      }
      setPABExprError(false);
      if (isEquivalentFraction(pABNum, pABDen, correctSets.nI, 36)) {
        setPABError(false);
        playSound('/sounds/correct.mp3');
        createAlert?.('Correto!', `P(A ∩ B) = ${correctSets.nI}/36.`, 'success', 3000);
        setStep('calcPAUB');
      } else {
        setPABError(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'P(A ∩ B) = n(A ∩ B) / 36. Frações equivalentes são aceitas.', 'error', 4500);
      }
    }, [pABExpr, pABNum, pABDen, correctSets.nI, createAlert]);

    const validatePAUB = useCallback(() => {
      // 1. Checa que as 3 substituições equivalem às probabilidades calculadas
      const subAOk = isEquivalentFraction(subANum, subADen, correctSets.nA, 36);
      const subBOk = isEquivalentFraction(subBNum, subBDen, correctSets.nB, 36);
      const subIOk = isEquivalentFraction(subINum, subIDen, correctSets.nI, 36);
      if (!subAOk || !subBOk || !subIOk) {
        setSubError(true);
        setPAUBError(false);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Substitua P(A), P(B) e P(A ∩ B) pelos valores que você calculou.', 'error', 5000);
        return;
      }
      setSubError(false);
      // 2. Checa o resultado final
      if (isEquivalentFraction(pAUBNum, pAUBDen, correctSets.nU, 36)) {
        setPAUBError(false);
        playSound('/sounds/correct.mp3');
        playSound('/sounds/challengeFinished.mp3');
        createAlert?.('Excelente!', `P(A ∪ B) = ${correctSets.nU}/36. Exercício concluído.`, 'success', 4000);
        setStep('done');
      } else {
        setPAUBError(true);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', 'Aplique P(A ∪ B) = P(A) + P(B) − P(A ∩ B).', 'error', 4500);
      }
    }, [
      subANum, subADen, subBNum, subBDen, subINum, subIDen,
      pAUBNum, pAUBDen,
      correctSets.nA, correctSets.nB, correctSets.nI, correctSets.nU,
      createAlert,
    ]);

    // ── Reset para nova rodada ───────────────────────────────────
    const resetForNewRound = useCallback((newRound: number) => {
      const pair = selectPairForRound(newRound, usedPairIds);
      setUsedPairIds(prev => new Set(prev).add(pair.id));
      setCurrentPair(pair);
      setRound(newRound);
      setStep('intro');
      setMarksA(createEmptyMatrix());
      setMarksB(createEmptyMatrix());
      setMarksI(createEmptyMatrix());
      setFeedbackA('none'); setFeedbackB('none'); setFeedbackI('none');
      setPANum(''); setPADen(''); setPAError(false);
      setPANumError(false); setPADenError(false);
      setPBNum(''); setPBDen(''); setPBError(false);
      setPBNumError(false); setPBDenError(false);
      setPABExpr(''); setPABNum(''); setPABDen('');
      setPABError(false); setPABExprError(false);
      setPAUBNum(''); setPAUBDen(''); setPAUBError(false);
      setFormulaPos1(''); setFormulaPos2(''); setFormulaPos3(''); setFormulaPos4('');
      setP1ErrorCount(0); setP1ShowHelp(false);
      setOperationExpr('');
      setSubANum(''); setSubADen('');
      setSubBNum(''); setSubBDen('');
      setSubINum(''); setSubIDen('');
      setSubError(false);
    }, [usedPairIds]);

    // Fórmula do Passo 7 completa E correta — incluindo o placeholder
    // introdutório "probabilidade {x}" (deve ser "union").
    const isFormulaCorrect = useMemo(() => (
      operationExpr === 'union' &&
      formulaPos1 === 'AuB' &&
      formulaPos2 === 'A' &&
      formulaPos3 === 'B' &&
      formulaPos4 === 'AnB'
    ), [operationExpr, formulaPos1, formulaPos2, formulaPos3, formulaPos4]);

    const anyFormulaAttempted = useMemo(() => (
      formulaPos1 !== '' || formulaPos2 !== '' ||
      formulaPos3 !== '' || formulaPos4 !== ''
    ), [formulaPos1, formulaPos2, formulaPos3, formulaPos4]);

    // Handler customizado para o placeholder de P(A∪B) — incrementa contador
    // de erros progressivos a cada mudança para valor diferente do esperado.
    const handlePos1Change = useCallback((v: ExprId) => {
      setFormulaPos1(v);
      if (v !== '' && v !== 'AuB') {
        setP1ErrorCount(c => c + 1);
      }
    }, []);

    // Dica progressiva conforme o número de erros cometidos em pos1.
    const p1Hint = useMemo(() => {
      if (formulaPos1 === '' || formulaPos1 === 'AuB') return null;
      if (p1ErrorCount >= 5) return 'Digite a fórmula da probabilidade da união de dois eventos.';
      if (p1ErrorCount === 4) return 'Estamos calculando a probabilidade de ocorrer o evento A ou o evento B.';
      if (p1ErrorCount === 3) return 'Ocorre pelo menos um dos eventos.';
      if (p1ErrorCount === 2) return 'Note que temos dois eventos conectados pela conjunção “ou”.';
      if (p1ErrorCount === 1) return 'Esse evento é composto por resultados em que ocorre o evento A, ocorre B ou ambos.';
      return null;
    }, [p1ErrorCount, formulaPos1]);

    const p1ShowHelpButton = p1ErrorCount >= 6 && formulaPos1 !== 'AuB';
    const p1Expanded = p1ErrorCount >= 2;
    // Após a fórmula ter sido exibida na Ajuda, se o aluno ainda errar,
    // o exercício é reiniciado com um novo par (mesma rodada) — elimina a
    // gamificação perversa de "farmar dicas" e renova o contrato didático.
    const p1ShowRestartOption = p1ErrorCount >= 7 && formulaPos1 !== 'AuB';

    // ── Navegação dev (setinhas) ─────────────────────────────────
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
      // No primeiro step: se há callback externo, delega para a fase anterior.
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
          // Cálculos: tabela totalmente congelada, sem toggle
          return {
            marks: marksI, onToggle: () => {},
            eventLabel: null,
            readOnlyMarks: [
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A∩B', matrix: marksI },
            ],
          };
      }
    }, [step, marksA, marksB, marksI, toggleA, toggleB, toggleI]);

    // ── Mensagens de feedback ────────────────────────────────────
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

    // Quantas células o aluno marcou no step atual (para mensagem de feedback)
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
      <div className="w-full max-w-[1216px] mx-auto px-xxs py-xs">
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
          Exercício 1 — Probabilidade da união
        </h2>

        {step !== 'intro' && step !== 'done' && <ProgressIndicator step={step} />}

        {round > 0 && step === 'intro' && (
          <p className="ds-small text-center text-neutral-dark mb-micro">
            Rodada {round + 1} de 3 — novo par de eventos
          </p>
        )}

        {/* ══════ ENUNCIADO FIXO (após intro) ══════ */}
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
              🎯 Aplicar a fórmula da união
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              Agora você vai aplicar tudo o que descobriu na fase teórica em um problema
              completo. O exercício tem <strong>4 perguntas</strong> encadeadas — em cada
              uma você calcula uma probabilidade que será usada na próxima.
            </p>
            <p className="ds-body text-neutral-black mb-micro text-justify">
              A sequência é:
            </p>
            <ul className="ds-body text-neutral-black mb-micro pl-xxs list-disc leading-relaxed">
              <li>Marcar os casos favoráveis a <strong>A</strong>, <strong>B</strong> e <strong className="whitespace-nowrap">A ∩ B</strong> na tabela 6×6</li>
              <li>Calcular <strong className="whitespace-nowrap">P(A)</strong>, <strong className="whitespace-nowrap">P(B)</strong> e <strong className="whitespace-nowrap">P(A ∩ B)</strong></li>
              <li>Aplicar a fórmula: <strong className="whitespace-nowrap">P(A ∪ B) = P(A) + P(B) − P(A ∩ B)</strong></li>
            </ul>
            <p className="ds-small text-neutral-dark mb-micro text-justify italic">
              Sugestão: sempre que for calcular, consulte os <em>n</em>s congelados no histórico
              do painel — a memória externa é uma ferramenta matemática legítima.
            </p>
            <div className="flex justify-center mt-macro">
              <Button
                style="primary"
                size="medium"
                onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  setStep('markA');
                }}
              >
                Começar
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TABELA PERSISTENTE (fora de intro/done) ══════ */}
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

        {/* ══════ HISTÓRICO CONGELADO (colapsável) ══════ */}
        {step !== 'intro' && step !== 'markA' && step !== 'done' && (
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
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'var(--color-neutral-darkest)',
              }}
              aria-expanded={!historyCollapsed}
            >
              <span className="ds-caption-bold text-[0.78rem]">
                Valores já calculados ({
                  (step === 'markB' ? 0 : 0) +
                  (['markI','calcPA','calcPB','calcPAB','calcPAUB'].includes(step) ? 0 : 0)
                  + /* n(A) visível a partir de markB? Não — só n() após cálculo */
                  (step === 'calcPB' || step === 'calcPAB' || step === 'calcPAUB' ? 1 : 0) +
                  (step === 'calcPAB' || step === 'calcPAUB' ? 1 : 0) +
                  (step === 'calcPAUB' ? 1 : 0)
                } conquistas)
              </span>
              <span aria-hidden style={{ fontWeight: 700 }}>
                {historyCollapsed ? '▾' : '▴'}
              </span>
            </button>
            {!historyCollapsed && (
              <div className="flex flex-wrap gap-x-micro gap-y-nano mt-nano">
                {(step === 'calcPB' || step === 'calcPAB' || step === 'calcPAUB') && (
                  <HistoryChip label="P(A)" num={correctSets.nA} den={36} color={EVENT_COLORS['A']} />
                )}
                {(step === 'calcPAB' || step === 'calcPAUB') && (
                  <HistoryChip label="P(B)" num={correctSets.nB} den={36} color={EVENT_COLORS['B']} />
                )}
                {step === 'calcPAUB' && (
                  <HistoryChip label="P(A∩B)" num={correctSets.nI} den={36} color={EVENT_COLORS['A∩B']} />
                )}
                {step === 'markB' && (
                  <span className="ds-small text-neutral-dark italic">
                    Marcações de A congeladas na tabela.
                  </span>
                )}
                {step === 'markI' && (
                  <span className="ds-small text-neutral-dark italic">
                    Marcações de A e B congeladas na tabela.
                  </span>
                )}
                {step === 'calcPA' && (
                  <span className="ds-small text-neutral-dark italic">
                    Tabela totalmente marcada e congelada. Agora calcule as probabilidades.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════ PAINEL ATIVO POR STEP ══════ */}

        {/* markA */}
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
            <p
              className="ds-small text-center text-neutral-dark mt-nano italic"
             
            >
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>
                Marque todos
              </Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>
                Limpar
              </Button>
              <Button style="primary" size="small" onClick={validateMarkA}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* markB */}
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
              congeladas em azul — células em que A e B ocorrem <strong>juntos</strong> terão os
              dois checkboxes ativos.
            </p>
            {feedbackMessage(feedbackB, correctSets.nB, marksCountByStep)}
            <p
              className="ds-small text-center text-neutral-dark mt-nano italic"
             
            >
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>
                Marque todos
              </Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>
                Limpar
              </Button>
              <Button style="primary" size="small" onClick={validateMarkB}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* markI */}
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
            {feedbackI !== 'none' && (
              <p
                className="ds-small mt-micro text-center text-feedback-warning-dark font-medium"
              >
                Estamos marcando elementos de A ∩ B, ou seja, casos que satisfazem A e B ao
                mesmo tempo.
              </p>
            )}
            <p
              className="ds-small text-center text-neutral-dark mt-nano italic"
             
            >
              Dica: às vezes é mais rápido marcar todas e desmarcar as que sobram.
            </p>
            <div className="flex flex-wrap justify-center gap-x-micro gap-y-nano mt-nano">
              <Button style="secondary" size="small" onClick={markAllCurrent}>
                Marque todos
              </Button>
              <Button style="secondary" size="small" onClick={clearCurrent}>
                Limpar
              </Button>
              <Button style="primary" size="small" onClick={validateMarkI}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* calcPA */}
        {step === 'calcPA' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A'] }}>
              Passo 4 — Calcular P(A)
            </p>
            <p className="ds-body text-neutral-black mt-nano text-justify">
              Qual é a probabilidade de ocorrer o evento A?
            </p>
            <div className="flex items-center justify-center gap-x-micro mt-micro">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A'], whiteSpace: 'nowrap' }}>
                P(A) =
              </span>
              <FractionInput
                num={pANum} den={pADen}
                setNum={setPANum} setDen={setPADen}
                error={pAError}
                onEnter={validatePA}
              />
            </div>
            {pANumError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Digite corretamente o número de casos favoráveis ao evento.
              </p>
            )}
            {pADenError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Digite o total de casos possíveis no lançamento de dois dados.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePA}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* calcPB */}
        {step === 'calcPB' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['B'] }}>
              Passo 5 — Calcular P(B)
            </p>
            <p className="ds-body text-neutral-black mt-nano text-justify">
              Qual é a probabilidade de ocorrer o evento B?
            </p>
            <div className="flex items-center justify-center gap-x-micro mt-micro">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['B'], whiteSpace: 'nowrap' }}>
                P(B) =
              </span>
              <FractionInput
                num={pBNum} den={pBDen}
                setNum={setPBNum} setDen={setPBDen}
                error={pBError}
                onEnter={validatePB}
              />
            </div>
            {pBNumError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Digite corretamente o número de casos favoráveis ao evento.
              </p>
            )}
            {pBDenError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Digite o total de casos possíveis no lançamento de dois dados.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePB}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* calcPAB */}
        {step === 'calcPAB' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[760px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A∩B'] }}>
              Passo 6 — Calcule a probabilidade de ocorrer{' '}
              <em className="italic">
                {currentPair.eventA.description.toLowerCase()}
                {' e '}
                {extractSumPredicate(currentPair.eventB.description).toLowerCase()}
              </em>
              .
            </p>
            <p className="ds-body text-neutral-black mt-nano text-justify">
              Antes de calcular, escolha dentro dos parênteses qual evento você vai usar.
            </p>

            <div className="flex items-center justify-center gap-x-nano mt-micro overflow-x-auto">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], fontSize: '1.05rem' }}>
                P(
              </span>
              <select
                id="ex1-expr-selector"
                value={pABExpr}
                onChange={e => {
                  setPABExpr(e.target.value as ExprId);
                  setPABExprError(false);
                }}
                aria-label="Evento a calcular"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `2px solid ${pABExprError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                  fontWeight: 700,
                  outline: 'none',
                  minWidth: 80,
                  background: 'var(--color-neutral-white)',
                  color: pABExpr === 'AnB' ? EVENT_COLORS['A∩B'] : 'var(--color-neutral-darkest)',
                  fontSize: '0.95rem',
                }}
              >
                <option value="" disabled hidden>?</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AnB">A ∩ B</option>
                <option value="AmB">A − B</option>
                <option value="BmA">B − A</option>
                <option value="AuB">A ∪ B</option>
              </select>
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], fontSize: '1.05rem' }}>
                ) =
              </span>
              <FractionInput
                num={pABNum} den={pABDen}
                setNum={setPABNum} setDen={setPABDen}
                error={pABError}
                onEnter={validatePAB}
                disabled={pABExpr !== 'AnB'}
              />
            </div>

            {pABExprError && pABExpr && pABExpr !== 'AnB' && (
              <p
                className="ds-small text-center mt-nano text-feedback-error-dark font-medium"
              >
                Reflita: o enunciado pede <strong>A ∩ B</strong> — a probabilidade de A e B
                ocorrerem <em>simultaneamente</em>.
              </p>
            )}

            <p className="ds-small text-center text-neutral-dark mt-nano">
              Use o número de casos em que A e B ocorrem simultaneamente e o total do
              espaço amostral.
            </p>

            {pABError && (
              <p
                className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
              >
                Fração não equivalente à probabilidade correta.
              </p>
            )}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={validatePAB}>
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* calcPAUB */}
        {step === 'calcPAUB' && (
          <div
            className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[820px] mx-auto"
            data-ex-panel
          >
            <p className="ds-body-bold text-center" style={{ color: EVENT_COLORS['A∪B'] }}>
              Passo 7 — Calcule a probabilidade de ocorrer{' '}
              <em className="italic">
                {currentPair.eventA.description.toLowerCase()}
                {' ou '}
                {extractSumPredicate(currentPair.eventB.description).toLowerCase()}
              </em>
              .
            </p>
            <p
              className="ds-body text-neutral-black mt-nano text-justify leading-relaxed"
            >
              Esse problema pode ser resolvido aplicando a fórmula da probabilidade{' '}
              <OperationSelect
                value={operationExpr}
                onChange={setOperationExpr}
                expected="union"
              />
              {' '}de dois eventos. Monte a fórmula selecionando os conjuntos (eventos)
              corretamente dentro de cada parêntese.
            </p>

            <div
              className="mt-micro text-center p-micro rounded-md"
              style={{
                background: 'var(--color-brand-otimath-lightest)',
                border: '2px solid var(--color-brand-otimath-pure)',
              }}
            >
              <div
                className="flex items-center justify-center gap-x-nano overflow-x-auto"
                style={{
                  color: operationExpr === 'union'
                    ? 'var(--color-brand-otimath-dark)'
                    : 'var(--color-neutral-medium)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                }}
              >
                <span>P(</span>
                <FormulaSelect
                  value={formulaPos1}
                  onChange={handlePos1Change}
                  expected="AuB"
                  expanded={p1Expanded}
                  disabled={operationExpr !== 'union'}
                />
                <span>) = P(</span>
                <FormulaSelect
                  value={formulaPos2}
                  onChange={setFormulaPos2}
                  expected="A"
                  disabled={operationExpr !== 'union'}
                />
                <span>) + P(</span>
                <FormulaSelect
                  value={formulaPos3}
                  onChange={setFormulaPos3}
                  expected="B"
                  disabled={operationExpr !== 'union'}
                />
                <span>) − P(</span>
                <FormulaSelect
                  value={formulaPos4}
                  onChange={setFormulaPos4}
                  expected="AnB"
                  disabled={operationExpr !== 'union'}
                />
                <span>)</span>
              </div>

              {operationExpr !== 'union' && (
                <p
                  className="ds-small text-center mt-nano text-neutral-dark italic"
                >
                  Escolha primeiro a fórmula correta para liberar a montagem.
                </p>
              )}

              {/* Dica progressiva para o placeholder de P(A∪B) */}
              {p1Hint && (
                <p
                  className="ds-small text-center mt-nano text-feedback-warning-dark font-medium"
                >
                  💡 {p1Hint}
                </p>
              )}

              {/* Botão Ajuda após 6 erros em pos1 */}
              {p1ShowHelpButton && (
                <div className="flex flex-col items-center mt-nano">
                  <Button
                    style="secondary"
                    size="small"
                    onClick={() => setP1ShowHelp(v => !v)}
                  >
                    {p1ShowHelp ? 'Ocultar ajuda' : 'Ajuda'}
                  </Button>
                  {p1ShowHelp && (
                    <div
                      className="mt-nano p-micro rounded-md text-center"
                      style={{
                        background: 'var(--color-neutral-white)',
                        border: '2px dashed var(--color-brand-otimath-pure)',
                      }}
                    >
                      <p className="ds-body-bold text-brand-otimath-dark">
                        P(X ∪ Y) = P(X) + P(Y) − P(X ∩ Y)
                      </p>
                      <p className="ds-small text-neutral-dark mt-nano italic">
                        Fórmula geral da probabilidade da união de dois eventos.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Após 7 erros: opção de recomeçar com novo par */}
              {p1ShowRestartOption && (
                <div
                  className="mt-micro p-micro rounded-md text-center"
                  style={{
                    background: 'var(--color-feedback-warning-lighter)',
                    border: '2px solid var(--color-feedback-warning-dark)',
                  }}
                >
                  <p
                    className="ds-body-bold"
                    style={{ color: 'var(--color-feedback-warning-darkest)' }}
                  >
                    Este problema está desafiador
                  </p>
                  <p className="ds-small text-neutral-dark mt-nano text-justify">
                    Que tal recomeçar o exercício com um novo par de eventos? Você refará
                    os passos desde a marcação para praticar a análise do problema inteiro.
                  </p>
                  <div className="mt-nano">
                    <Button
                      style="primary"
                      size="small"
                      onClick={() => resetForNewRound(round)}
                    >
                      Recomeçar com outros eventos
                    </Button>
                  </div>
                </div>
              )}

              {!p1Hint && !isFormulaCorrect && anyFormulaAttempted && (
                <p
                  className="ds-small text-center mt-nano text-feedback-error-dark font-medium"
                >
                  Revise os eventos marcados em vermelho — a fórmula ainda não está correta.
                </p>
              )}
              {isFormulaCorrect && (
                <p
                  className="ds-small text-center mt-nano text-feedback-success-dark font-medium"
                >
                  ✓ Fórmula correta. Agora substitua os valores e calcule.
                </p>
              )}
            </div>

            {isFormulaCorrect && (
              <>
                <p className="ds-body text-neutral-black mt-micro text-justify">
                  Substitua cada probabilidade pela fração correspondente e some:
                </p>

                <div className="flex items-center justify-center gap-x-micro mt-micro overflow-x-auto">
                  <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'], whiteSpace: 'nowrap' }}>
                    P(A ∪ B) =
                  </span>
                  <FractionInput
                    num={subANum} den={subADen}
                    setNum={setSubANum} setDen={setSubADen}
                    error={subError}
                  />
                  <span className="ds-body-bold text-neutral-darkest">+</span>
                  <FractionInput
                    num={subBNum} den={subBDen}
                    setNum={setSubBNum} setDen={setSubBDen}
                    error={subError}
                  />
                  <span className="ds-body-bold text-neutral-darkest">−</span>
                  <FractionInput
                    num={subINum} den={subIDen}
                    setNum={setSubINum} setDen={setSubIDen}
                    error={subError}
                  />
                </div>
                {subError && (
                  <p
                    className="ds-small mt-nano text-center text-feedback-error-dark font-medium"
                  >
                    Alguma fração não confere com as probabilidades calculadas nos passos
                    anteriores. Revise os valores.
                  </p>
                )}

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
              </>
            )}
          </div>
        )}

        {/* done */}
        {step === 'done' && (
          <div
            className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto"
            data-ex-panel
          >
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              🎯 Exercício 1 concluído
            </p>

            <div
              className="bg-neutral-white rounded-md p-micro mb-micro border-2 border-brand-otimath-pure"
            >
              <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
                Resumo das probabilidades
              </p>
              <div className="flex flex-wrap gap-x-micro gap-y-nano justify-center mt-nano">
                <HistoryChip label="P(A)" num={correctSets.nA} den={36} color={EVENT_COLORS['A']} />
                <HistoryChip label="P(B)" num={correctSets.nB} den={36} color={EVENT_COLORS['B']} />
                <HistoryChip label="P(A∩B)" num={correctSets.nI} den={36} color={EVENT_COLORS['A∩B']} />
                <HistoryChip label="P(A∪B)" num={correctSets.nU} den={36} color={EVENT_COLORS['A∪B']} />
              </div>
            </div>

            <p className="ds-body text-neutral-black mt-micro text-justify">
              Você aplicou a fórmula geral <strong className="whitespace-nowrap">P(A ∪ B) = P(A) + P(B) − P(A ∩ B)</strong>{' '}
              em um problema completo, com marcação explícita dos três eventos, cálculo
              independente de cada probabilidade e substituição na fórmula.
            </p>

            {round === 0 && (
              <p className="ds-small text-neutral-dark mt-micro text-justify italic">
                Se quiser, pode praticar novamente com um novo par de eventos (até 3 rodadas).
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
