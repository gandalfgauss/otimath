'use client'

import React, { useState, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';

/* ═══════════════════════════════════════════════════════════════
   UnionProbabilityTheory — Fundamentação teórica de P(A ∪ B)
   Inserida na Cena 7 entre probSumReveal e raceBet.
   Descoberta guiada da fórmula geral partindo da contagem de pares.

   MACRO 1 — Contagem (intro → markA → countA → markB → countB →
             defineIntersection → markIntersection → countIntersection)
   synthM1 — card de síntese parcial
   MACRO 2 — Fórmula de cardinalidade (defineUnion → markUnion →
             countUnion → predict → sumCompareVisual → formulaReveal)
   synthM2 — card de síntese parcial
   MACRO 3 — Fórmula de probabilidade (probTransfer → probCalc →
             probFormulaReveal → institucionalize → done)
   ═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// TIPOS E DADOS
// ═══════════════════════════════════════════════════════════════

type UnionPhase =
  | 'intro'
  | 'markA' | 'countA'
  | 'markB' | 'countB'
  | 'defineIntersection' | 'markIntersection' | 'countIntersection'
  | 'enumDisplay'
  | 'synthM1'
  | 'defineUnion' | 'markUnion' | 'countUnion'
  | 'predict' | 'sumCompareVisual' | 'formulaReveal'
  | 'synthM2'
  | 'probTransfer' | 'probCalc' | 'probFormulaReveal'
  | 'probFormulaApply'  // apresenta os valores a substituir
  | 'probFormulaVerify' // substitui numericamente + verificação + generalização
  | 'institucionalize'
  | 'done';

type FeedbackState = 'none' | 'incomplete' | 'wrong';

interface EventDef {
  description: string;
  sumsDescription: string;
  predicate: (r: number, c: number) => boolean;
}

interface EventPair {
  id: string;
  category: string;
  eventA: EventDef;
  eventB: EventDef;
}

const EVENT_PAIRS: EventPair[] = [
  // PAR 1 — Introdução intuitiva (obrigatório na rodada 1)
  {
    id: 'P1A', category: 'intro',
    eventA: { description: 'A soma é maior que 7', sumsDescription: '{8, 9, 10, 11, 12}', predicate: (r, c) => r + c > 7 },
    eventB: { description: 'A soma é par', sumsDescription: '{2, 4, 6, 8, 10, 12}', predicate: (r, c) => (r + c) % 2 === 0 },
  },
  {
    id: 'P1B', category: 'intro',
    eventA: { description: 'A soma é menor que 10', sumsDescription: '{2, 3, 4, 5, 6, 7, 8, 9}', predicate: (r, c) => r + c < 10 },
    eventB: { description: 'A soma é ímpar', sumsDescription: '{3, 5, 7, 9, 11}', predicate: (r, c) => (r + c) % 2 === 1 },
  },
  // PAR 2 — Forte sobreposição
  {
    id: 'P2A', category: 'strong_overlap',
    eventA: { description: 'A soma é maior ou igual a 6', sumsDescription: '{6, 7, 8, 9, 10, 11, 12}', predicate: (r, c) => r + c >= 6 },
    eventB: { description: 'A soma é menor ou igual a 9', sumsDescription: '{2, 3, 4, 5, 6, 7, 8, 9}', predicate: (r, c) => r + c <= 9 },
  },
  {
    id: 'P2B', category: 'strong_overlap',
    eventA: { description: 'A soma está entre 4 e 9', sumsDescription: '{4, 5, 6, 7, 8, 9}', predicate: (r, c) => r + c >= 4 && r + c <= 9 },
    eventB: { description: 'A soma está entre 7 e 12', sumsDescription: '{7, 8, 9, 10, 11, 12}', predicate: (r, c) => r + c >= 7 && r + c <= 12 },
  },
  // PAR 3 — Interseção pequena
  {
    id: 'P3A', category: 'small_intersection',
    eventA: { description: 'A soma é maior que 9', sumsDescription: '{10, 11, 12}', predicate: (r, c) => r + c > 9 },
    eventB: { description: 'A soma é múltipla de 3', sumsDescription: '{3, 6, 9, 12}', predicate: (r, c) => (r + c) % 3 === 0 },
  },
  {
    id: 'P3B', category: 'small_intersection',
    eventA: { description: 'A soma é maior que 6', sumsDescription: '{7, 8, 9, 10, 11, 12}', predicate: (r, c) => r + c > 6 },
    eventB: { description: 'A soma é um número primo', sumsDescription: '{2, 3, 5, 7, 11}', predicate: (r, c) => [2, 3, 5, 7, 11].includes(r + c) },
  },
  // PAR 4 — Sobreposição central
  {
    id: 'P4A', category: 'central_overlap',
    eventA: { description: 'A soma é menor que 8', sumsDescription: '{2, 3, 4, 5, 6, 7}', predicate: (r, c) => r + c < 8 },
    eventB: { description: 'A soma é maior que 5', sumsDescription: '{6, 7, 8, 9, 10, 11, 12}', predicate: (r, c) => r + c > 5 },
  },
  {
    id: 'P4B', category: 'central_overlap',
    eventA: { description: 'A soma está entre 5 e 10', sumsDescription: '{5, 6, 7, 8, 9, 10}', predicate: (r, c) => r + c >= 5 && r + c <= 10 },
    eventB: { description: 'A soma está entre 8 e 12', sumsDescription: '{8, 9, 10, 11, 12}', predicate: (r, c) => r + c >= 8 && r + c <= 12 },
  },
  // PAR 5 — Subconjunto (caso-limite, rodada 3)
  {
    id: 'P5A', category: 'inclusion',
    eventA: { description: 'A soma é maior que 4', sumsDescription: '{5, 6, 7, 8, 9, 10, 11, 12}', predicate: (r, c) => r + c > 4 },
    eventB: { description: 'A soma é maior que 8', sumsDescription: '{9, 10, 11, 12}', predicate: (r, c) => r + c > 8 },
  },
  {
    id: 'P5B', category: 'inclusion',
    eventA: { description: 'A soma é múltipla de 2', sumsDescription: '{2, 4, 6, 8, 10, 12}', predicate: (r, c) => (r + c) % 2 === 0 },
    eventB: { description: 'A soma é múltipla de 4', sumsDescription: '{4, 8, 12}', predicate: (r, c) => (r + c) % 4 === 0 },
  },
];

function selectPairForRound(round: number, usedIds: Set<string>): EventPair {
  if (round === 0) return EVENT_PAIRS[0];
  if (round === 2) {
    const p5 = EVENT_PAIRS.filter(p => p.category === 'inclusion' && !usedIds.has(p.id));
    if (p5.length > 0) return p5[Math.floor(Math.random() * p5.length)];
    return EVENT_PAIRS.find(p => !usedIds.has(p.id)) ?? EVENT_PAIRS[0];
  }
  const pool = EVENT_PAIRS.filter(
    p => ['strong_overlap', 'small_intersection', 'central_overlap'].includes(p.category) && !usedIds.has(p.id)
  );
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  return EVENT_PAIRS.find(p => !usedIds.has(p.id)) ?? EVENT_PAIRS[0];
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

function pairsMatching(predicate: (r: number, c: number) => boolean): Set<string> {
  const s = new Set<string>();
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) if (predicate(r, c)) s.add(`${r},${c}`);
  return s;
}

function setIntersection(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>();
  a.forEach(k => { if (b.has(k)) out.add(k); });
  return out;
}

function setUnion(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>(a);
  b.forEach(k => out.add(k));
  return out;
}

function enumerateKeys(keys: Set<string>): string {
  const list = Array.from(keys)
    .map(k => k.split(',').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => `(${r},${c})`);
  return list.join(', ');
}

type MarkMatrix = boolean[][];

function createEmptyMatrix(): MarkMatrix {
  return Array.from({ length: 6 }, () => Array(6).fill(false));
}

function matrixToKeySet(m: MarkMatrix): Set<string> {
  const s = new Set<string>();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (m[r][c]) s.add(`${r + 1},${c + 1}`);
  return s;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES VISUAIS
// ═══════════════════════════════════════════════════════════════

// Face de dado em SVG (pintas em grid 3×3)
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

function DieFace({ face, size, color }: { face: number; size: number; color: 'green' | 'blue' }) {
  const pips = PIP_PATTERNS[face] ?? [];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bg = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div
      aria-label={`Dado ${color === 'green' ? 'verde' : 'azul'} face ${face}`}
      style={{
        width: size, height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bg,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
      }}
    >
      {pips.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

// Tabela de marcação 6×6 — checkbox por evento ativo em cada célula.
// Eventos anteriores ficam CHECKED, disabled, mas totalmente visíveis (sem opacity).
interface MarkingTableProps {
  marks: MarkMatrix;
  onToggle: (row: number, col: number) => void;
  eventLabel: string | null; // null = só exibe readOnlyMarks (modo leitura integral)
  readOnlyMarks?: { label: string; matrix: MarkMatrix; color?: string }[];
}

// Cores dos eventos (consistência visual)
const EVENT_COLORS: Record<string, string> = {
  'A': '#2f6fea',        // azul
  'B': '#22a155',        // verde
  'A∩B': '#c79634',      // dourado
  'A∪B': '#7d3c98',      // roxo
};

// Checkbox visual customizado para marcações congeladas — navegadores ignoram
// accent-color em <input disabled>, então usamos div com a cor forte do evento.
function FrozenCheckbox({ checked, color, label }: { checked: boolean; color: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} ${checked ? 'marcado' : 'não marcado'} (congelado)`}
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        border: `2px solid ${color}`,
        background: checked ? color : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 8 L7 12 L13 4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function MarkingTable({ marks, onToggle, eventLabel, readOnlyMarks }: MarkingTableProps) {
  const activeColor = eventLabel ? (EVENT_COLORS[eventLabel] ?? 'var(--color-brand-otimath-pure)') : undefined;
  // Dimensões idênticas ao TwoDicesTable (fase final do OVA) para consistência
  // visual: células 116×100px, header vertical 50px, faces 32px.
  return (
    <div className="w-full overflow-auto max-h-[calc(100vh-68px)] snap-both snap-mandatory scroll-p-[50px] max-lg:flex max-lg:justify-center max-sm:justify-start rounded-md shadow-level-1 max-lg:w-fit max-sm:w-full">
      <table className="bg-background-otimath relative w-fit h-full text-center rounded-md outline-solid outline-neutral-lighter outline-(length:--border-width-hairline) border-collapse">
        <thead className="flex justify-end bg-background-otimath sticky top-[-1px] z-1">
          <tr className="flex justify-end">
            {[1, 2, 3, 4, 5, 6].map(c => (
              <th key={c} className="w-[116px] h-[50px] flex justify-center items-center">
                <DieFace face={c} size={32} color="blue" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6].map(r => (
            <tr className="flex" key={`row-${r}`}>
              {/* Header da linha (face verde) */}
              <td
                className="w-[50px] sticky left-[-1px] z-1 h-[100px] flex justify-center items-center bg-background-otimath"
                key={`head-${r}`}
              >
                <DieFace face={r} size={32} color="green" />
              </td>
              {/* 6 células de marcação */}
              {[1, 2, 3, 4, 5, 6].map(c => {
                const row = r - 1, col = c - 1;
                const isChecked = marks[row][col];
                const isAlternateRow = (r - 1) % 2 === 0;
                return (
                  <td
                    key={`cell-${r}-${c}`}
                    className={`snap-start w-[116px] border-solid border-neutral-lighter border-hairline h-[100px] flex justify-center items-center bg-background-otimath ${isAlternateRow ? 'bg-feedback-info-lightest' : ''}`}
                  >
                    <div className="w-full flex flex-col items-center justify-center gap-y-nano">
                      {/* Eventos anteriores — checkbox customizado colorido (não usa <input disabled>) */}
                      {readOnlyMarks?.map(ro => {
                        const roColor = ro.color ?? EVENT_COLORS[ro.label] ?? 'var(--color-neutral-dark)';
                        const roChecked = ro.matrix[row][col];
                        return (
                          <div
                            key={ro.label}
                            className="flex items-center gap-x-nano"
                            style={{ userSelect: 'none' }}
                          >
                            <FrozenCheckbox checked={roChecked} color={roColor} label={`${ro.label} em (${r},${c})`} />
                            <span
                              className="ds-caption-bold"
                              style={{ fontSize: '0.78rem', color: roColor, fontWeight: 700 }}
                            >
                              {ro.label}
                            </span>
                          </div>
                        );
                      })}
                      {/* Checkbox do evento ativo (se houver) */}
                      {eventLabel && (
                        <label
                          className="flex items-center gap-x-nano"
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggle(row, col)}
                            aria-label={`${eventLabel} em (${r},${c})`}
                            style={{
                              width: 18, height: 18,
                              accentColor: activeColor,
                            }}
                          />
                          <span
                            className="ds-caption-bold"
                            style={{ fontSize: '0.8rem', color: activeColor, fontWeight: 700 }}
                          >
                            {eventLabel}
                          </span>
                        </label>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Quadro de descrição do evento — apenas label + descrição verbal.
// NÃO mostra "Somas possíveis" (isso seria entrega de resposta — o aluno deve
// descobrir por si quais pares satisfazem o evento).
function EventCard({ label, description }: { label: string; description: string }) {
  const color = EVENT_COLORS[label] ?? 'var(--color-brand-otimath-dark)';
  return (
    <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter">
      <p className="ds-body-bold text-center" style={{ color }}>
        Evento {label}
      </p>
      <p className="ds-body text-neutral-black text-center mt-nano">
        <strong style={{ color }}>{label}:</strong> {description}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROPS E ESTADO
// ═══════════════════════════════════════════════════════════════

interface UnionProbabilityTheoryProps {
  onFinished: () => void;
}

export interface UnionTheoryHandle {
  advance: () => void;
  back: () => void;
  canAdvance: () => boolean;
  canBack: () => boolean;
}

// Sequência linear de fases — usada pelas setinhas de navegação dev.
// REORDENADA: probTransfer (Laplace direto) agora vem LOGO APÓS countUnion,
// permitindo ao aluno calcular P(A∪B) diretamente ANTES de derivar a
// fórmula geral. synthM2 serve de ponte: "Já sabe calcular direto.
// Agora vamos descobrir uma segunda rota — a fórmula geral."
const PHASE_SEQUENCE: UnionPhase[] = [
  'intro',
  'markA', 'countA',
  'markB', 'countB',
  'defineIntersection', 'markIntersection', 'countIntersection',
  'enumDisplay',
  'synthM1',
  'defineUnion', 'markUnion', 'countUnion',
  'probTransfer',
  'synthM2',
  'predict', 'sumCompareVisual', 'formulaReveal',
  'probCalc', 'probFormulaReveal',
  'probFormulaApply',   // valores a substituir
  'probFormulaVerify',  // substituição numérica + generalização
  'institucionalize',
  'done',
];

export const UnionProbabilityTheory = forwardRef<UnionTheoryHandle, UnionProbabilityTheoryProps>(function UnionProbabilityTheory({ onFinished }, ref) {
  const [phase, setPhase] = useState<UnionPhase>('intro');
  const [round, setRound] = useState(0);
  const [usedPairIds, setUsedPairIds] = useState<Set<string>>(new Set());
  const [currentPair, setCurrentPair] = useState<EventPair>(EVENT_PAIRS[0]);

  const [marksA, setMarksA] = useState<MarkMatrix>(createEmptyMatrix);
  const [marksB, setMarksB] = useState<MarkMatrix>(createEmptyMatrix);
  const [marksIntersection, setMarksIntersection] = useState<MarkMatrix>(createEmptyMatrix);
  const [marksUnion, setMarksUnion] = useState<MarkMatrix>(createEmptyMatrix);

  const [feedbackA, setFeedbackA] = useState<FeedbackState>('none');
  const [feedbackB, setFeedbackB] = useState<FeedbackState>('none');
  const [feedbackIntersection, setFeedbackIntersection] = useState<FeedbackState>('none');
  const [feedbackUnion, setFeedbackUnion] = useState<FeedbackState>('none');

  const [nAInput, setNAInput] = useState('');
  const [nAError, setNAError] = useState(false);
  const [nBInput, setNBInput] = useState('');
  const [nBError, setNBError] = useState(false);
  const [nIntersectionInput, setNIntersectionInput] = useState('');
  const [nIntersectionError, setNIntersectionError] = useState(false);
  const [nUnionInput, setNUnionInput] = useState('');
  const [nUnionError, setNUnionError] = useState(false);

  // MACRO 2/3 (usados apenas nas próximas etapas)
  const [predictionOp, setPredictionOp] = useState<'>' | '<' | '=' | ''>('');
  const [predictionReason, setPredictionReason] = useState<'duplo' | 'igual' | 'menor' | ''>('');
  const [predictionError, setPredictionError] = useState(false);
  // Controle da revisita ao enumDisplay a partir do predict (metacognição ativa)
  const [cameFromPredict, setCameFromPredict] = useState(false);
  const [predictReviewedEnum, setPredictReviewedEnum] = useState(false);
  const [nSumInput, setNSumInput] = useState('');
  const [nSumError, setNSumError] = useState(false);
  const [compareOp, setCompareOp] = useState<'>' | '<' | '=' | ''>('');
  const [compareError, setCompareError] = useState(false);
  const [pAUBNum, setPAUBNum] = useState('');
  const [pAUBDen, setPAUBDen] = useState('');
  const [pAUBError, setPAUBError] = useState(false);
  const [pANum, setPANum] = useState('');
  const [pADen, setPADen] = useState('');
  const [pAError, setPAError] = useState(false);
  const [pBNum, setPBNum] = useState('');
  const [pBDen, setPBDen] = useState('');
  const [pBError, setPBError] = useState(false);
  const [pABNum, setPABNum] = useState('');
  const [pABDen, setPABDen] = useState('');
  const [pABError, setPABError] = useState(false);
  const [institutionalAnswer, setInstitutionalAnswer] = useState('');
  const [institutionalError, setInstitutionalError] = useState(false);

  const correctSets = useMemo(() => {
    const A = pairsMatching(currentPair.eventA.predicate);
    const B = pairsMatching(currentPair.eventB.predicate);
    const I = setIntersection(A, B);
    const U = setUnion(A, B);
    return { A, B, I, U, nA: A.size, nB: B.size, nI: I.size, nU: U.size };
  }, [currentPair]);

  const evaluateMarks = useCallback((marks: MarkMatrix, correct: Set<string>): FeedbackState => {
    const marked = matrixToKeySet(marks);
    let hasWrong = false;
    marked.forEach(k => { if (!correct.has(k)) hasWrong = true; });
    if (hasWrong) return 'wrong';
    let hasMissing = false;
    correct.forEach(k => { if (!marked.has(k)) hasMissing = true; });
    if (hasMissing) return 'incomplete';
    return 'none';
  }, []);

  const resetForNewRound = useCallback((newRound: number) => {
    const pair = selectPairForRound(newRound, usedPairIds);
    setUsedPairIds(prev => new Set(prev).add(pair.id));
    setCurrentPair(pair);
    setRound(newRound);
    setPhase('intro');
    setMarksA(createEmptyMatrix());
    setMarksB(createEmptyMatrix());
    setMarksIntersection(createEmptyMatrix());
    setMarksUnion(createEmptyMatrix());
    setFeedbackA('none'); setFeedbackB('none'); setFeedbackIntersection('none'); setFeedbackUnion('none');
    setNAInput(''); setNAError(false);
    setNBInput(''); setNBError(false);
    setNIntersectionInput(''); setNIntersectionError(false);
    setNUnionInput(''); setNUnionError(false);
    setPredictionOp(''); setPredictionReason(''); setPredictionError(false);
    setNSumInput(''); setNSumError(false);
    setCompareOp(''); setCompareError(false);
    setPAUBNum(''); setPAUBDen(''); setPAUBError(false);
    setPANum(''); setPADen(''); setPAError(false);
    setPBNum(''); setPBDen(''); setPBError(false);
    setPABNum(''); setPABDen(''); setPABError(false);
    setInstitutionalAnswer(''); setInstitutionalError(false);
    setCameFromPredict(false);
    setPredictReviewedEnum(false);
  }, [usedPairIds]);

  useEffect(() => {
    if (usedPairIds.size === 0) {
      setUsedPairIds(new Set([EVENT_PAIRS[0].id]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando o aluno termina de marcar AMBOS os radios em predict pela primeira
  // vez, redireciona-o automaticamente para enumDisplay para revisitar a
  // evidência visual (dupla contagem) antes de confirmar a previsão.
  // Redirecionamento imediato (sem setTimeout) — setTimeout com cleanup estava
  // sendo cancelado pelo próprio re-render disparado pelos setStates.
  useEffect(() => {
    if (
      phase === 'predict' &&
      predictionOp &&
      predictionReason &&
      !predictReviewedEnum
    ) {
      setCameFromPredict(true);
      setPredictReviewedEnum(true);
      setPhase('enumDisplay');
    }
  }, [phase, predictionOp, predictionReason, predictReviewedEnum]);

  // ═══════════════════════════════════════════════════════════════
  // VALIDAÇÕES (MACRO 1)
  // ═══════════════════════════════════════════════════════════════

  const validateMarkA = useCallback(() => {
    const fb = evaluateMarks(marksA, correctSets.A);
    setFeedbackA(fb);
    if (fb === 'none') {
      playSound('/sounds/correct.mp3');
      setTimeout(() => setPhase('countA'), 600);
    } else if (fb === 'incomplete') {
      playSound('/sounds/correct.mp3');
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [marksA, correctSets.A, evaluateMarks]);

  const validateCountA = useCallback(() => {
    const v = parseInt(nAInput.trim(), 10);
    if (v === correctSets.nA) {
      setNAError(false);
      playSound('/sounds/correct.mp3');
      setPhase('markB');
    } else {
      setNAError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [nAInput, correctSets.nA]);

  const validateMarkB = useCallback(() => {
    const fb = evaluateMarks(marksB, correctSets.B);
    setFeedbackB(fb);
    if (fb === 'none') {
      playSound('/sounds/correct.mp3');
      setTimeout(() => setPhase('countB'), 600);
    } else if (fb === 'incomplete') {
      playSound('/sounds/correct.mp3');
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [marksB, correctSets.B, evaluateMarks]);

  const validateCountB = useCallback(() => {
    const v = parseInt(nBInput.trim(), 10);
    if (v === correctSets.nB) {
      setNBError(false);
      playSound('/sounds/correct.mp3');
      setPhase('defineIntersection');
    } else {
      setNBError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [nBInput, correctSets.nB]);

  const validateMarkIntersection = useCallback(() => {
    const fb = evaluateMarks(marksIntersection, correctSets.I);
    setFeedbackIntersection(fb);
    if (fb === 'none') {
      playSound('/sounds/correct.mp3');
      setTimeout(() => setPhase('countIntersection'), 600);
    } else if (fb === 'incomplete') {
      playSound('/sounds/correct.mp3');
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [marksIntersection, correctSets.I, evaluateMarks]);

  const validateCountIntersection = useCallback(() => {
    const v = parseInt(nIntersectionInput.trim(), 10);
    if (v === correctSets.nI) {
      setNIntersectionError(false);
      playSound('/sounds/correct.mp3');
      setPhase('enumDisplay');
    } else {
      setNIntersectionError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [nIntersectionInput, correctSets.nI]);

  // ═══════════════════════════════════════════════════════════════
  // TOGGLES DE MARCAÇÃO
  // ═══════════════════════════════════════════════════════════════

  const toggleA = useCallback((r: number, c: number) => {
    setMarksA(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
    setFeedbackA('none');
  }, []);

  const toggleB = useCallback((r: number, c: number) => {
    setMarksB(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
    setFeedbackB('none');
  }, []);

  const toggleIntersection = useCallback((r: number, c: number) => {
    setMarksIntersection(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
    setFeedbackIntersection('none');
  }, []);

  const clearMarksA = useCallback(() => { setMarksA(createEmptyMatrix()); setFeedbackA('none'); playSound('/sounds/clear.mp3'); }, []);
  const clearMarksB = useCallback(() => { setMarksB(createEmptyMatrix()); setFeedbackB('none'); playSound('/sounds/clear.mp3'); }, []);
  const clearMarksIntersection = useCallback(() => { setMarksIntersection(createEmptyMatrix()); setFeedbackIntersection('none'); playSound('/sounds/clear.mp3'); }, []);

  const toggleUnion = useCallback((r: number, c: number) => {
    setMarksUnion(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
    setFeedbackUnion('none');
  }, []);
  const clearMarksUnion = useCallback(() => { setMarksUnion(createEmptyMatrix()); setFeedbackUnion('none'); playSound('/sounds/clear.mp3'); }, []);

  // ═══════════════════════════════════════════════════════════════
  // VALIDAÇÕES MACRO 2 (cardinalidade)
  // ═══════════════════════════════════════════════════════════════

  const validateMarkUnion = useCallback(() => {
    const fb = evaluateMarks(marksUnion, correctSets.U);
    setFeedbackUnion(fb);
    if (fb === 'none') {
      playSound('/sounds/correct.mp3');
      setTimeout(() => setPhase('countUnion'), 600);
    } else if (fb === 'incomplete') {
      playSound('/sounds/correct.mp3');
    } else {
      playSound('/sounds/incorrect.mp3');
    }
  }, [marksUnion, correctSets.U, evaluateMarks]);

  const validateCountUnion = useCallback(() => {
    const v = parseInt(nUnionInput.trim(), 10);
    if (v === correctSets.nU) {
      setNUnionError(false);
      playSound('/sounds/correct.mp3');
      // Reordenação: após contar n(A∪B), aluno calcula P(A∪B) direto por Laplace
      setPhase('probTransfer');
    } else {
      setNUnionError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [nUnionInput, correctSets.nU]);

  const validatePrediction = useCallback(() => {
    if (!predictionOp || !predictionReason) {
      setPredictionError(true);
      playSound('/sounds/incorrect.mp3');
      return;
    }
    // A previsão é metacognitiva — qualquer resposta é aceita, apenas registra
    setPredictionError(false);
    playSound('/sounds/correct.mp3');
    setPhase('sumCompareVisual');
  }, [predictionOp, predictionReason]);

  const validateSumInput = useCallback(() => {
    const v = parseInt(nSumInput.trim(), 10);
    const expected = correctSets.nA + correctSets.nB;
    if (v === expected) {
      setNSumError(false);
      playSound('/sounds/correct.mp3');
    } else {
      setNSumError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [nSumInput, correctSets.nA, correctSets.nB]);

  const validateCompareOp = useCallback(() => {
    const sum = correctSets.nA + correctSets.nB;
    const union = correctSets.nU;
    const correct: '>' | '<' | '=' = sum > union ? '>' : sum < union ? '<' : '=';
    if (compareOp === correct) {
      setCompareError(false);
      playSound('/sounds/correct.mp3');
      setPhase('formulaReveal');
    } else {
      setCompareError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [compareOp, correctSets.nA, correctSets.nB, correctSets.nU]);

  // ═══════════════════════════════════════════════════════════════
  // VALIDAÇÕES MACRO 3 (probabilidade)
  // ═══════════════════════════════════════════════════════════════

  // R14: aceita qualquer fração equivalente (multiplicação cruzada)
  const isEquivalentFraction = useCallback((numStr: string, denStr: string, expectedNum: number, expectedDen: number): boolean => {
    const num = parseInt(numStr.trim(), 10);
    const den = parseInt(denStr.trim(), 10);
    if (!Number.isInteger(num) || !Number.isInteger(den)) return false;
    if (num < 0 || den <= 0) return false;
    return num * expectedDen === den * expectedNum;
  }, []);

  const validatePAUB = useCallback(() => {
    if (isEquivalentFraction(pAUBNum, pAUBDen, correctSets.nU, 36)) {
      setPAUBError(false);
      playSound('/sounds/correct.mp3');
      // Não avança aqui — o avanço é controlado pelo ProbTransferScreen
      // (que mostra as conversões decimal/percentual antes de prosseguir).
    } else {
      setPAUBError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [pAUBNum, pAUBDen, correctSets.nU, isEquivalentFraction]);

  const validatePA = useCallback(() => {
    if (isEquivalentFraction(pANum, pADen, correctSets.nA, 36)) {
      setPAError(false);
      playSound('/sounds/correct.mp3');
    } else {
      setPAError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [pANum, pADen, correctSets.nA, isEquivalentFraction]);

  const validatePB = useCallback(() => {
    if (isEquivalentFraction(pBNum, pBDen, correctSets.nB, 36)) {
      setPBError(false);
      playSound('/sounds/correct.mp3');
    } else {
      setPBError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [pBNum, pBDen, correctSets.nB, isEquivalentFraction]);

  const validatePAB = useCallback(() => {
    if (isEquivalentFraction(pABNum, pABDen, correctSets.nI, 36)) {
      setPABError(false);
      playSound('/sounds/correct.mp3');
    } else {
      setPABError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [pABNum, pABDen, correctSets.nI, isEquivalentFraction]);

  // Todas as 3 probabilidades individuais foram validadas?
  const allIndividualProbsValid = useMemo(() => {
    return (
      isEquivalentFraction(pANum, pADen, correctSets.nA, 36) &&
      isEquivalentFraction(pBNum, pBDen, correctSets.nB, 36) &&
      isEquivalentFraction(pABNum, pABDen, correctSets.nI, 36)
    );
  }, [pANum, pADen, pBNum, pBDen, pABNum, pABDen, correctSets.nA, correctSets.nB, correctSets.nI, isEquivalentFraction]);

  const validateInstitutional = useCallback(() => {
    if (institutionalAnswer === 'correct') {
      setInstitutionalError(false);
      playSound('/sounds/correct.mp3');
      setPhase('done');
    } else if (institutionalAnswer === '') {
      setInstitutionalError(true);
    } else {
      setInstitutionalError(true);
      playSound('/sounds/incorrect.mp3');
    }
  }, [institutionalAnswer]);

  // ═══════════════════════════════════════════════════════════════
  // NAVEGAÇÃO DEV (setinhas) — avança/volta 1 fase na sequência linear
  // ═══════════════════════════════════════════════════════════════

  const advancePhase = useCallback(() => {
    const idx = PHASE_SEQUENCE.indexOf(phase);
    if (idx < 0) return;
    if (idx === PHASE_SEQUENCE.length - 1) {
      onFinished();
      return;
    }
    const nextPhase = PHASE_SEQUENCE[idx + 1];
    playSound('/sounds/nextChallenge.mp3');
    setPhase(nextPhase);
  }, [phase, onFinished]);

  const backPhase = useCallback(() => {
    const idx = PHASE_SEQUENCE.indexOf(phase);
    if (idx <= 0) return;
    const prevPhase = PHASE_SEQUENCE[idx - 1];
    playSound('/sounds/clear.mp3');
    setPhase(prevPhase);
  }, [phase]);

  useImperativeHandle(ref, () => ({
    advance: advancePhase,
    back: backPhase,
    canAdvance: () => PHASE_SEQUENCE.indexOf(phase) >= 0,
    canBack: () => PHASE_SEQUENCE.indexOf(phase) > 0,
  }), [advancePhase, backPhase, phase]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="w-full max-w-[860px] mx-auto px-xxs py-xs">
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Probabilidade da união de dois eventos
      </h2>

      <MacroProgressIndicator phase={phase} />

      {round > 0 && (
        <p className="ds-caption text-center text-neutral-medium mb-micro">
          Rodada {round + 1} de 3
        </p>
      )}

      {/* ═══════ INTRO ═══════ */}
      {phase === 'intro' && (() => {
        // Exemplo dinâmico de par que pertence a A ∩ B (para ilustrar sobreposição)
        const predA = shortPredicate(currentPair.eventA.description);
        const predB = shortPredicate(currentPair.eventB.description);
        const intersectionExample = Array.from(correctSets.I)[0];
        const [exR, exC] = intersectionExample
          ? intersectionExample.split(',').map(Number)
          : [null, null];
        const exSum = exR !== null && exC !== null ? exR + exC : null;

        return (
          <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[640px] mx-auto">
            <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
              Descobrindo a fórmula geral
            </p>

            {/* Preview do problema concreto */}
            <div
              className="rounded-md p-micro mb-micro"
              style={{
                background: 'var(--color-brand-otimath-lightest)',
                border: '1px solid var(--color-brand-otimath-light)',
              }}
            >
              <p className="ds-caption-bold text-brand-otimath-dark mb-nano" style={{ fontSize: '0.82rem' }}>
                O problema que vamos resolver
              </p>
              <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
                No lançamento simultâneo de dois dados equilibrados, qual a probabilidade de que
                a <strong>soma dos resultados</strong> seja{' '}
                <strong style={{ color: EVENT_COLORS['A'] }}>{formatForProblem(predA)}</strong>{' '}
                <strong>ou</strong>{' '}
                <strong style={{ color: EVENT_COLORS['B'] }}>{formatForProblem(predB)}</strong>?
              </p>
              <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
                Chame de <strong style={{ color: EVENT_COLORS['A'] }}>A</strong> o evento{' '}
                &quot;ocorre soma {predA}&quot; e de{' '}
                <strong style={{ color: EVENT_COLORS['B'] }}>B</strong> o evento{' '}
                &quot;ocorre soma {predB}&quot;.
              </p>
              {exSum !== null && (
                <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
                  <strong>Observe:</strong> alguns resultados satisfazem <strong>os dois
                  eventos ao mesmo tempo</strong> — por exemplo, se sair o par{' '}
                  <strong>({exR}, {exC})</strong>, a soma é <strong>{exSum}</strong>, que é{' '}
                  {formatForProblem(predA)} <strong>e</strong> também é{' '}
                  {formatForProblem(predB)}. Ou seja,{' '}
                  <strong>A ∩ B não é vazio</strong>.
                </p>
              )}
            </div>

            {/* Ancoragem no Disco */}
            <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
              No OVA do <strong>Disco Probabilístico</strong>, você aprendeu que{' '}
              <strong style={{ whiteSpace: 'nowrap' }}>P(A ∪ B) = P(A) + P(B)</strong> — mas{' '}
              <strong>apenas</strong> quando A e B são <strong>mutuamente exclusivos</strong>{' '}
              (<span style={{ whiteSpace: 'nowrap' }}>A ∩ B = ∅</span>). Será que essa fórmula
              ainda funciona aqui?
            </p>

            <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
              Vamos descobrir juntos a <strong>fórmula geral</strong>, construindo-a passo a passo
              na tabela 6×6 dos dois dados.
            </p>

            <div className="flex justify-center mt-macro">
              <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('markA'); }}>
                Começar
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ═══════ markA ═══════ */}
      {phase === 'markA' && (
        <div className="flex flex-col gap-y-micro">
          <EventCard label="A" description={currentPair.eventA.description} />
          <p className="ds-body-bold text-neutral-black text-center" style={{ fontSize: '1rem' }}>
            Marque na tabela <strong>todos os pares</strong> que satisfazem o evento A.
          </p>
          <MarkingTable marks={marksA} onToggle={toggleA} eventLabel="A" />
          <div className="flex justify-center gap-x-micro mt-micro">
            <Button style="secondary" size="small" onClick={clearMarksA}>Limpar</Button>
            <Button style="primary" size="small" onClick={validateMarkA}>Conferir</Button>
          </div>
          {feedbackA === 'incomplete' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              Correto! Mas ainda não terminou — faltam pares.
            </p>
          )}
          {feedbackA === 'wrong' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Revise a marcação do evento A. Alguma marcação não satisfaz o evento.
            </p>
          )}
        </div>
      )}

      {/* ═══════ countA ═══════ */}
      {phase === 'countA' && (
        <div className="flex flex-col gap-y-micro">
          <EventCard label="A" description={currentPair.eventA.description} />
          {/* Tabela visível (só leitura) — A já marcado e congelado */}
          <MarkingTable
            marks={createEmptyMatrix()}
            onToggle={() => {}}
            eventLabel={null}
            readOnlyMarks={[{ label: 'A', matrix: marksA }]}
          />
          <div
            className="bg-brand-otimath-lightest rounded-md p-micro border border-brand-otimath-light mx-auto"
            aria-live="polite"
            style={{ maxWidth: 720 }}
          >
            <p className="ds-small-bold text-neutral-darkest">
              A = {'{'}{enumerateKeys(correctSets.A)}{'}'}
            </p>
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Quantos pares tem o conjunto A?
          </p>
          <div className="flex items-center justify-center gap-x-micro">
            <span className="ds-body-bold text-neutral-black">n(A) =</span>
            <input
              type="number"
              inputMode="numeric"
              value={nAInput}
              onChange={e => { setNAInput(e.target.value); setNAError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') validateCountA(); }}
              placeholder="?"
              aria-label="Digite n(A)"
              aria-invalid={nAError}
              className="ds-body-bold"
              style={{
                border: `2px solid ${nAError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                borderRadius: 8, padding: '8px 12px', width: 72, textAlign: 'center', outline: 'none',
              }}
            />
            <Button style="primary" size="extra-small" onClick={validateCountA}>Conferir</Button>
          </div>
          {nAError && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Conte novamente os pares marcados na tabela.
            </p>
          )}
        </div>
      )}

      {/* ═══════ markB ═══════ */}
      {phase === 'markB' && (
        <div className="flex flex-col gap-y-micro">
          <EventCard label="B" description={currentPair.eventB.description} />
          <p className="ds-body-bold text-neutral-black text-center">
            Agora marque na tabela <strong>todos os pares</strong> que satisfazem o evento B.
          </p>
          <p className="ds-small text-neutral-dark text-center" style={{ fontStyle: 'italic' }}>
            As marcações do evento A aparecem congeladas em cada célula.
          </p>
          <MarkingTable
            marks={marksB}
            onToggle={toggleB}
            eventLabel="B"
            readOnlyMarks={[{ label: 'A', matrix: marksA }]}
          />
          <div className="flex justify-center gap-x-micro mt-micro">
            <Button style="secondary" size="small" onClick={clearMarksB}>Limpar</Button>
            <Button style="primary" size="small" onClick={validateMarkB}>Conferir</Button>
          </div>
          {feedbackB === 'incomplete' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              Correto! Mas ainda não terminou — faltam pares.
            </p>
          )}
          {feedbackB === 'wrong' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Revise a marcação do evento B.
            </p>
          )}
        </div>
      )}

      {/* ═══════ countB ═══════ */}
      {phase === 'countB' && (
        <div className="flex flex-col gap-y-micro">
          <EventCard label="B" description={currentPair.eventB.description} />
          <MarkingTable
            marks={createEmptyMatrix()}
            onToggle={() => {}}
            eventLabel={null}
            readOnlyMarks={[
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
            ]}
          />
          <div
            className="bg-brand-otimath-lightest rounded-md p-micro border border-brand-otimath-light mx-auto"
            aria-live="polite"
            style={{ maxWidth: 720 }}
          >
            <p className="ds-small-bold text-neutral-darkest">
              B = {'{'}{enumerateKeys(correctSets.B)}{'}'}
            </p>
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Quantos pares tem o conjunto B?
          </p>
          <div className="flex items-center justify-center gap-x-micro">
            <span className="ds-body-bold text-neutral-black">n(B) =</span>
            <input
              type="number"
              inputMode="numeric"
              value={nBInput}
              onChange={e => { setNBInput(e.target.value); setNBError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') validateCountB(); }}
              placeholder="?"
              aria-label="Digite n(B)"
              aria-invalid={nBError}
              className="ds-body-bold"
              style={{
                border: `2px solid ${nBError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                borderRadius: 8, padding: '8px 12px', width: 72, textAlign: 'center', outline: 'none',
              }}
            />
            <Button style="primary" size="extra-small" onClick={validateCountB}>Conferir</Button>
          </div>
          {nBError && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Conte novamente os pares marcados de B na tabela.
            </p>
          )}
        </div>
      )}

      {/* ═══════ defineIntersection ═══════ */}
      {phase === 'defineIntersection' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Interseção: A ∩ B
          </p>
          <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
            A <strong>interseção</strong> de A e B, escrita <strong>A ∩ B</strong>, é o conjunto
            dos pares que pertencem a <strong>A e B ao mesmo tempo</strong>.
          </p>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            No próximo passo, você vai marcar na tabela os pares de A ∩ B. Observe que esses pares
            você <strong>já tinha marcado antes</strong>: uma vez em A e outra vez em B.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('markIntersection'); }}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ markIntersection ═══════ */}
      {phase === 'markIntersection' && (
        <div className="flex flex-col gap-y-micro">
          <div className="grid gap-xxxs" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <EventCard label="A" description={currentPair.eventA.description} />
            <EventCard label="B" description={currentPair.eventB.description} />
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Marque <strong>A ∩ B</strong>: pares que satisfazem A <strong>e</strong> B ao mesmo tempo.
          </p>
          <p className="ds-small text-neutral-dark text-center" style={{ fontStyle: 'italic' }}>
            Observe: esses pares você já tinha marcado antes — em A e em B.
          </p>
          <MarkingTable
            marks={marksIntersection}
            onToggle={toggleIntersection}
            eventLabel="A∩B"
            readOnlyMarks={[
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
            ]}
          />
          <div className="flex justify-center gap-x-micro mt-micro">
            <Button style="secondary" size="small" onClick={clearMarksIntersection}>Limpar</Button>
            <Button style="primary" size="small" onClick={validateMarkIntersection}>Conferir</Button>
          </div>
          {feedbackIntersection === 'incomplete' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              Correto! Mas ainda não terminou — faltam pares.
            </p>
          )}
          {feedbackIntersection === 'wrong' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Revise a marcação. Verifique se cada par satisfaz A e B ao mesmo tempo.
            </p>
          )}
        </div>
      )}

      {/* ═══════ countIntersection ═══════ */}
      {phase === 'countIntersection' && (
        <div className="flex flex-col gap-y-micro">
          <p className="ds-heading-large text-brand-otimath-dark text-center">
            Conjunto A ∩ B
          </p>
          <MarkingTable
            marks={createEmptyMatrix()}
            onToggle={() => {}}
            eventLabel={null}
            readOnlyMarks={[
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A∩B', matrix: marksIntersection },
            ]}
          />
          <div
            className="bg-brand-otimath-lightest rounded-md p-micro border border-brand-otimath-light mx-auto"
            aria-live="polite"
            style={{ maxWidth: 720 }}
          >
            <p className="ds-small-bold text-neutral-darkest">
              A ∩ B = {correctSets.I.size === 0 ? '∅' : `{${enumerateKeys(correctSets.I)}}`}
            </p>
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Quantos pares tem o conjunto A ∩ B?
          </p>
          <div className="flex items-center justify-center gap-x-micro">
            <span className="ds-body-bold text-neutral-black">n(A ∩ B) =</span>
            <input
              type="number"
              inputMode="numeric"
              value={nIntersectionInput}
              onChange={e => { setNIntersectionInput(e.target.value); setNIntersectionError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') validateCountIntersection(); }}
              placeholder="?"
              aria-label="Digite n(A ∩ B)"
              aria-invalid={nIntersectionError}
              className="ds-body-bold"
              style={{
                border: `2px solid ${nIntersectionError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                borderRadius: 8, padding: '8px 12px', width: 72, textAlign: 'center', outline: 'none',
              }}
            />
            <Button style="primary" size="extra-small" onClick={validateCountIntersection}>Conferir</Button>
          </div>
          {nIntersectionError && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Conte novamente os pares marcados de A ∩ B na tabela.
            </p>
          )}
        </div>
      )}

      {/* ═══════ enumDisplay — visualização dos 3 conjuntos com destaque cromático ═══════
          Conversão entre registros (DUVAL): o aluno vê que os elementos de A∩B
          estão PRESENTES tanto em A quanto em B — prepara a dupla contagem. */}
      {phase === 'enumDisplay' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[720px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Observe os 3 conjuntos
          </p>
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Os pares destacados em <strong style={{ color: EVENT_COLORS['A∩B'] }}>dourado</strong>{' '}
            dentro de A e dentro de B são exatamente os elementos de <strong>A ∩ B</strong> —
            eles pertencem aos dois conjuntos ao mesmo tempo.
          </p>

          {/* Conjunto A — 3 linhas: propriedade, enumeração com piscar, n(A) */}
          <div
            className="rounded-md p-micro mb-micro"
            aria-live="polite"
            style={{
              background: 'var(--color-neutral-lightest)',
              border: `2px solid ${EVENT_COLORS['A']}`,
            }}
          >
            <p className="ds-body-bold" style={{ color: EVENT_COLORS['A'], lineHeight: 1.5 }}>
              A = {'{'}{shortPredicate(currentPair.eventA.description)}{'}'} =
            </p>
            <p className="ds-body-bold" style={{ color: 'var(--color-neutral-darkest)', lineHeight: 1.6, marginLeft: 8 }}>
              {'{'}
              <EnumeratedSetWithHighlight
                set={correctSets.A}
                highlightSet={correctSets.I}
                highlightColor={EVENT_COLORS['A∩B']}
              />
              {'}'}
            </p>
            <p className="ds-body-bold mt-nano" style={{ color: EVENT_COLORS['A'], lineHeight: 1.5 }}>
              n(A) = {correctSets.nA} casos favoráveis
            </p>
          </div>

          {/* Conjunto B — 3 linhas análogas */}
          <div
            className="rounded-md p-micro mb-micro"
            aria-live="polite"
            style={{
              background: 'var(--color-neutral-lightest)',
              border: `2px solid ${EVENT_COLORS['B']}`,
            }}
          >
            <p className="ds-body-bold" style={{ color: EVENT_COLORS['B'], lineHeight: 1.5 }}>
              B = {'{'}{shortPredicate(currentPair.eventB.description)}{'}'} =
            </p>
            <p className="ds-body-bold" style={{ color: 'var(--color-neutral-darkest)', lineHeight: 1.6, marginLeft: 8 }}>
              {'{'}
              <EnumeratedSetWithHighlight
                set={correctSets.B}
                highlightSet={correctSets.I}
                highlightColor={EVENT_COLORS['A∩B']}
              />
              {'}'}
            </p>
            <p className="ds-body-bold mt-nano" style={{ color: EVENT_COLORS['B'], lineHeight: 1.5 }}>
              n(B) = {correctSets.nB} casos favoráveis
            </p>
          </div>

          {/* Conjunto A∩B — 3 linhas, enumeração toda em dourado e piscando */}
          <div
            className="rounded-md p-micro mb-micro"
            aria-live="polite"
            style={{
              background: 'var(--color-neutral-lightest)',
              border: `2px solid ${EVENT_COLORS['A∩B']}`,
            }}
          >
            <p className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'], lineHeight: 1.5 }}>
              A ∩ B = {'{'}{shortPredicate(currentPair.eventA.description)} e {shortPredicate(currentPair.eventB.description)}{'}'} =
            </p>
            <p className="ds-body-bold" style={{ lineHeight: 1.6, marginLeft: 8 }}>
              {'{'}
              {correctSets.I.size === 0 ? (
                <span style={{ color: EVENT_COLORS['A∩B'] }}>∅</span>
              ) : (
                <EnumeratedSetWithHighlight
                  set={correctSets.I}
                  highlightSet={correctSets.I}
                  highlightColor={EVENT_COLORS['A∩B']}
                />
              )}
              {'}'}
            </p>
            <p className="ds-body-bold mt-nano" style={{ color: EVENT_COLORS['A∩B'], lineHeight: 1.5 }}>
              n(A ∩ B) = {correctSets.nI} casos favoráveis
            </p>
          </div>

          <p className="ds-small text-neutral-dark mt-micro" style={{ textAlign: 'justify', fontStyle: 'italic' }}>
            Note que cada par dourado aparece <strong>duas vezes</strong>: uma em A e outra em B.
            Essa observação será importante nos próximos passos.
          </p>

          <div className="flex justify-center mt-macro">
            {cameFromPredict ? (
              <Button
                style="primary"
                size="small"
                onClick={() => {
                  playSound('/sounds/nextChallenge.mp3');
                  setCameFromPredict(false);
                  setPhase('predict');
                }}
              >
                Voltar para confirmar previsão
              </Button>
            ) : (
              <Button
                style="primary"
                size="small"
                onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('synthM1'); }}
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ═══════ synthM1 ═══════ */}
      {phase === 'synthM1' && (
        <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-feedback-success-dark text-center mb-micro">
            ✓ Você contou os 3 conjuntos
          </p>
          <div className="flex flex-col gap-y-nano items-center">
            <p className="ds-body-bold text-neutral-black">n(A) = {correctSets.nA}</p>
            <p className="ds-body-bold text-neutral-black">n(B) = {correctSets.nB}</p>
            <p className="ds-body-bold text-neutral-black">n(A ∩ B) = {correctSets.nI}</p>
          </div>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            Agora vamos ver o que acontece com a <strong>união</strong> dos dois conjuntos.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('defineUnion'); }}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ MACRO 2 — defineUnion ═══════ */}
      {phase === 'defineUnion' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            União: A ∪ B
          </p>
          <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
            A <strong>união</strong> de A e B, escrita <strong>A ∪ B</strong>, é o conjunto dos
            pares que pertencem a <strong>pelo menos um</strong> dos conjuntos — ou seja, pertencem
            a A, a B, ou a ambos.
          </p>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            No próximo passo, você vai marcar na tabela todos os pares de A ∪ B.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('markUnion'); }}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ markUnion ═══════ */}
      {phase === 'markUnion' && (
        <div className="flex flex-col gap-y-micro">
          <div className="grid gap-xxxs" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <EventCard label="A" description={currentPair.eventA.description} />
            <EventCard label="B" description={currentPair.eventB.description} />
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Marque <strong>A ∪ B</strong>: pares que pertencem a A, a B, ou a ambos.
          </p>
          <MarkingTable
            marks={marksUnion}
            onToggle={toggleUnion}
            eventLabel="A∪B"
            readOnlyMarks={[
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A∩B', matrix: marksIntersection },
            ]}
          />
          <div className="flex justify-center gap-x-micro mt-micro">
            <Button style="secondary" size="small" onClick={clearMarksUnion}>Limpar</Button>
            <Button style="primary" size="small" onClick={validateMarkUnion}>Conferir</Button>
          </div>
          {feedbackUnion === 'incomplete' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              Correto! Mas ainda não terminou — faltam pares.
            </p>
          )}
          {feedbackUnion === 'wrong' && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Revise a marcação de A ∪ B. Alguma marcação não satisfaz nem A nem B.
            </p>
          )}
        </div>
      )}

      {/* ═══════ countUnion ═══════ */}
      {phase === 'countUnion' && (
        <div className="flex flex-col gap-y-micro">
          <p className="ds-heading-large text-brand-otimath-dark text-center">
            Conjunto A ∪ B
          </p>
          <MarkingTable
            marks={createEmptyMatrix()}
            onToggle={() => {}}
            eventLabel={null}
            readOnlyMarks={[
              { label: 'A', matrix: marksA },
              { label: 'B', matrix: marksB },
              { label: 'A∩B', matrix: marksIntersection },
              { label: 'A∪B', matrix: marksUnion },
            ]}
          />
          <div
            className="bg-brand-otimath-lightest rounded-md p-micro border border-brand-otimath-light mx-auto"
            aria-live="polite"
            style={{ maxWidth: 720 }}
          >
            <p className="ds-small-bold text-neutral-darkest">
              A ∪ B = {'{'}{enumerateKeys(correctSets.U)}{'}'}
            </p>
          </div>
          <p className="ds-body-bold text-neutral-black text-center">
            Quantos pares tem o conjunto A ∪ B?
          </p>
          <div className="flex items-center justify-center gap-x-micro">
            <span className="ds-body-bold text-neutral-black">n(A ∪ B) =</span>
            <input
              type="number"
              inputMode="numeric"
              value={nUnionInput}
              onChange={e => { setNUnionInput(e.target.value); setNUnionError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') validateCountUnion(); }}
              placeholder="?"
              aria-label="Digite n(A ∪ B)"
              aria-invalid={nUnionError}
              className="ds-body-bold"
              style={{
                border: `2px solid ${nUnionError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                borderRadius: 8, padding: '8px 12px', width: 72, textAlign: 'center', outline: 'none',
              }}
            />
            <Button style="primary" size="extra-small" onClick={validateCountUnion}>Conferir</Button>
          </div>
          {nUnionError && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Conte novamente os pares marcados de A ∪ B na tabela.
            </p>
          )}
        </div>
      )}

      {/* ═══════ predict — metacognição antes da fórmula ═══════ */}
      {phase === 'predict' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Antes de continuar, faça uma previsão
          </p>
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Você contou <strong>n(A) = {correctSets.nA}</strong>, <strong>n(B) = {correctSets.nB}</strong>{' '}
            e <strong>n(A ∪ B) = {correctSets.nU}</strong>. Sem calcular, o que você acha?
          </p>
          <fieldset style={{ border: '1px solid var(--color-neutral-lighter)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <legend className="ds-body-bold text-neutral-black" style={{ padding: '0 6px' }}>
              n(A) + n(B):
            </legend>
            {[
              { v: '>' as const, label: 'É maior que n(A ∪ B)' },
              { v: '=' as const, label: 'É igual a n(A ∪ B)' },
              { v: '<' as const, label: 'É menor que n(A ∪ B)' },
            ].map(opt => (
              <label key={opt.v} className="flex items-center gap-x-micro" style={{ padding: '8px 4px', cursor: 'pointer', minHeight: 40 }}>
                <input
                  type="radio"
                  name="predictOp"
                  value={opt.v}
                  checked={predictionOp === opt.v}
                  onChange={() => { setPredictionOp(opt.v); setPredictionError(false); }}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
                />
                <span className="ds-body text-neutral-black">{opt.label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset style={{ border: '1px solid var(--color-neutral-lighter)', borderRadius: 10, padding: 12 }}>
            <legend className="ds-body-bold text-neutral-black" style={{ padding: '0 6px' }}>
              Por quê?
            </legend>
            {[
              { v: 'igual' as const, label: 'Acho que n(A ∪ B) é a soma simples: juntei todos os pares.' },
              { v: 'duplo' as const, label: 'Acho que somar n(A) + n(B) conta alguns pares duas vezes.' },
              { v: 'menor' as const, label: 'Acho que a união tem menos pares que a soma.' },
            ].map(opt => (
              <label key={opt.v} className="flex items-start gap-x-micro" style={{ padding: '8px 4px', cursor: 'pointer', minHeight: 40 }}>
                <input
                  type="radio"
                  name="predictReason"
                  value={opt.v}
                  checked={predictionReason === opt.v}
                  onChange={() => { setPredictionReason(opt.v); setPredictionError(false); }}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)', marginTop: 3 }}
                />
                <span className="ds-body text-neutral-black">{opt.label}</span>
              </label>
            ))}
          </fieldset>
          {predictionError && (
            <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Escolha uma opção em cada bloco antes de continuar.
            </p>
          )}
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={validatePrediction}>Confirmar previsão</Button>
          </div>
        </div>
      )}

      {/* ═══════ sumCompareVisual — barra empilhada ═══════ */}
      {phase === 'sumCompareVisual' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[720px] mx-auto">
          <p className="ds-heading-large text-brand-otimath-dark text-center mb-micro">
            Vamos verificar sua previsão
          </p>
          <p className="ds-body text-neutral-black text-center mb-micro">
            Calcule n(A) + n(B):
          </p>
          <div className="flex items-center justify-center gap-x-micro mb-micro">
            <span className="ds-body-bold text-neutral-black">{correctSets.nA} + {correctSets.nB} =</span>
            <input
              type="number"
              inputMode="numeric"
              value={nSumInput}
              onChange={e => { setNSumInput(e.target.value); setNSumError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') validateSumInput(); }}
              placeholder="?"
              aria-label="Digite n(A) + n(B)"
              aria-invalid={nSumError}
              className="ds-body-bold"
              style={{
                border: `2px solid ${nSumError ? 'var(--color-feedback-error-dark)' : (parseInt(nSumInput) === correctSets.nA + correctSets.nB ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-lighter)')}`,
                borderRadius: 8, padding: '8px 12px', width: 72, textAlign: 'center', outline: 'none',
              }}
              disabled={parseInt(nSumInput) === correctSets.nA + correctSets.nB}
            />
            {parseInt(nSumInput) !== correctSets.nA + correctSets.nB && (
              <Button style="primary" size="extra-small" onClick={validateSumInput}>Conferir</Button>
            )}
          </div>
          {nSumError && (
            <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Some n(A) e n(B) novamente.
            </p>
          )}

          {/* Barra empilhada visual — aparece depois que o aluno acerta a soma */}
          {parseInt(nSumInput) === correctSets.nA + correctSets.nB && (
            <>
              <StackedBarComparison
                nA={correctSets.nA}
                nB={correctSets.nB}
                nI={correctSets.nI}
                nU={correctSets.nU}
              />
              <p className="ds-body text-neutral-black text-center mt-micro">
                Compare: <strong>n(A) + n(B) = {correctSets.nA + correctSets.nB}</strong>{' '}
                e <strong>n(A ∪ B) = {correctSets.nU}</strong>.
              </p>
              <div className="flex items-center justify-center gap-x-micro mt-micro flex-wrap">
                <span className="ds-body-bold text-neutral-black">{correctSets.nA + correctSets.nB}</span>
                <select
                  value={compareOp}
                  onChange={e => { setCompareOp(e.target.value as '>' | '<' | '=' | ''); setCompareError(false); }}
                  aria-label="Operador de comparação"
                  className="ds-body-bold"
                  style={{
                    border: `2px solid ${compareError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8, padding: '6px 10px', outline: 'none', minWidth: 64, textAlign: 'center',
                  }}
                >
                  <option value="">?</option>
                  <option value=">">{'>'}</option>
                  <option value="=">{'='}</option>
                  <option value="<">{'<'}</option>
                </select>
                <span className="ds-body-bold text-neutral-black">{correctSets.nU}</span>
                <Button style="primary" size="extra-small" onClick={validateCompareOp}>Conferir</Button>
              </div>
              {compareError && (
                <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Observe a barra acima: a barra de n(A) + n(B) inclui os pares de A ∩ B duas vezes.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════ formulaReveal ═══════ */}
      {phase === 'formulaReveal' && (
        <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[680px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            A fórmula da cardinalidade da união
          </p>
          <ValuesRecallPanel nA={correctSets.nA} nB={correctSets.nB} nI={correctSets.nI} nU={correctSets.nU} />
          <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
            Ao somar n(A) + n(B), os pares que pertencem a A ∩ B foram contados <strong>duas vezes</strong>.
            Para obter a contagem correta da união, precisamos subtrair n(A ∩ B):
          </p>
          <div
            className="bg-neutral-white rounded-md p-micro text-center mt-micro"
            style={{ border: '2px solid var(--color-brand-otimath-pure)' }}
          >
            <p className="ds-heading-large" style={{ color: 'var(--color-brand-otimath-dark)' }}>
              n(A ∪ B) = n(A) + n(B) − n(A ∩ B)
            </p>
          </div>
          <p className="ds-body text-neutral-black mt-micro text-center">
            Verificação numérica:
          </p>
          <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-dark)', fontSize: '1.1rem' }}>
            {correctSets.nU} = {correctSets.nA} + {correctSets.nB} − {correctSets.nI}
          </p>
          <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
            ✓ {correctSets.nU} = {correctSets.nA + correctSets.nB - correctSets.nI}
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('probCalc'); }}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ synthM2 — PONTE: Laplace direto → busca da fórmula algébrica ═══════
          Agora serve como transição pedagógica: o aluno acabou de calcular
          P(A∪B) diretamente por Laplace. Aqui evocamos a fórmula do Disco
          (P(A∪B) = P(A) + P(B) para eventos ME) e lançamos o obstáculo:
          "Será que ainda vale quando A ∩ B ≠ ∅? Vamos investigar." */}
      {phase === 'synthM2' && (
        <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[640px] mx-auto">
          <p className="ds-heading-extra text-feedback-success-dark text-center mb-micro">
            ✓ Você calculou P(A ∪ B) diretamente por Laplace
          </p>
          <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
            Aplicando o <strong>Teorema de Laplace</strong> ao conjunto A ∪ B que você
            contou na tabela, obtivemos a probabilidade da união.
          </p>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            <strong>Mas há outra rota.</strong> No OVA do <strong>Disco Probabilístico</strong>,
            você aprendeu que, para eventos <strong>mutuamente exclusivos</strong> (A ∩ B = ∅):
          </p>
          <p className="ds-body-bold text-center mt-micro" style={{ color: 'var(--color-brand-otimath-pure)', fontSize: '1.05rem' }}>
            P(A ∪ B) = P(A) + P(B)
          </p>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            Porém, no nosso problema A ∩ B <strong>não é vazio</strong>. Será que essa
            fórmula do Disco <strong>ainda funciona</strong> aqui?
          </p>
          <p className="ds-body-bold text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            Vamos investigar: se somarmos n(A) + n(B), será que chegamos em n(A ∪ B)?
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('predict'); }}>
              Investigar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ MACRO 2 — probTransfer (Laplace direto, logo após countUnion) ═══════ */}
      {phase === 'probTransfer' && (
        <ProbTransferScreen
          eventADescription={currentPair.eventA.description}
          eventBDescription={currentPair.eventB.description}
          nU={correctSets.nU}
          pAUBNum={pAUBNum}
          pAUBDen={pAUBDen}
          setPAUBNum={setPAUBNum}
          setPAUBDen={setPAUBDen}
          pAUBError={pAUBError}
          validatePAUB={validatePAUB}
          isEquivalentFraction={isEquivalentFraction}
          onContinue={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('synthM2'); }}
        />
      )}

      {/* ═══════ probCalc — calcular P(A), P(B), P(A∩B) ═══════ */}
      {phase === 'probCalc' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[680px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Agora calcule as demais probabilidades
          </p>
          <ValuesRecallPanel nA={correctSets.nA} nB={correctSets.nB} nI={correctSets.nI} nU={correctSets.nU} />
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Aplique P(X) = n(X) / n(S) para cada evento:
          </p>
          <div className="flex flex-col gap-y-micro">
            <div className="flex items-center justify-center gap-x-micro flex-wrap">
              <span className="ds-body-bold text-neutral-black">P(A) =</span>
              <FractionInput num={pANum} den={pADen} setNum={setPANum} setDen={setPADen} error={pAError} onEnter={validatePA} />
              {!isEquivalentFraction(pANum, pADen, correctSets.nA, 36) && (
                <Button style="primary" size="extra-small" onClick={validatePA}>Conferir</Button>
              )}
              {isEquivalentFraction(pANum, pADen, correctSets.nA, 36) && (
                <span className="ds-body-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>✓</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-x-micro flex-wrap">
              <span className="ds-body-bold text-neutral-black">P(B) =</span>
              <FractionInput num={pBNum} den={pBDen} setNum={setPBNum} setDen={setPBDen} error={pBError} onEnter={validatePB} />
              {!isEquivalentFraction(pBNum, pBDen, correctSets.nB, 36) && (
                <Button style="primary" size="extra-small" onClick={validatePB}>Conferir</Button>
              )}
              {isEquivalentFraction(pBNum, pBDen, correctSets.nB, 36) && (
                <span className="ds-body-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>✓</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-x-micro flex-wrap">
              <span className="ds-body-bold text-neutral-black">P(A ∩ B) =</span>
              <FractionInput num={pABNum} den={pABDen} setNum={setPABNum} setDen={setPABDen} error={pABError} onEnter={validatePAB} />
              {!isEquivalentFraction(pABNum, pABDen, correctSets.nI, 36) && (
                <Button style="primary" size="extra-small" onClick={validatePAB}>Conferir</Button>
              )}
              {isEquivalentFraction(pABNum, pABDen, correctSets.nI, 36) && (
                <span className="ds-body-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>✓</span>
              )}
            </div>
          </div>
          {(pAError || pBError || pABError) && (
            <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Aplique P(X) = n(X)/n(S) onde n(S) = 36. Frações equivalentes são aceitas.
            </p>
          )}
          {allIndividualProbsValid && (
            <div className="flex justify-center mt-macro">
              <Button style="primary" size="small" onClick={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('probFormulaReveal'); }}>
                Continuar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ probFormulaReveal — derivação simbólica da fórmula ═══════ */}
      {phase === 'probFormulaReveal' && (
        <ProbFormulaRevealAnimation
          onContinue={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('probFormulaApply'); }}
        />
      )}

      {/* ═══════ probFormulaApply — apresentação dos valores a substituir ═══════ */}
      {phase === 'probFormulaApply' && (
        <ProbFormulaApplyScreen
          nA={correctSets.nA}
          nB={correctSets.nB}
          nI={correctSets.nI}
          nU={correctSets.nU}
          onContinue={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('probFormulaVerify'); }}
        />
      )}

      {/* ═══════ probFormulaVerify — substituição numérica + verificação + generalização ═══════ */}
      {phase === 'probFormulaVerify' && (
        <ProbFormulaVerifyScreen
          nA={correctSets.nA}
          nB={correctSets.nB}
          nI={correctSets.nI}
          nU={correctSets.nU}
          onContinue={() => { playSound('/sounds/nextChallenge.mp3'); setPhase('institucionalize'); }}
        />
      )}

      {/* ═══════ institucionalize — múltipla escolha de síntese ═══════ */}
      {phase === 'institucionalize' && (
        <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Qual fórmula você construiu?
          </p>
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Escolha a fórmula geral da <strong>probabilidade da união de dois eventos</strong>:
          </p>
          <div className="flex flex-col gap-y-nano">
            {[
              { v: 'wrong1', label: 'P(A ∪ B) = P(A) + P(B)' },
              { v: 'correct', label: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B)' },
              { v: 'wrong2', label: 'P(A ∪ B) = P(A) × P(B)' },
              { v: 'wrong3', label: 'P(A ∪ B) = P(A) − P(B) + P(A ∩ B)' },
            ].map(opt => (
              <label key={opt.v} className="flex items-center gap-x-micro" style={{ padding: '10px 6px', cursor: institutionalAnswer === 'correct' ? 'default' : 'pointer', minHeight: 44, borderRadius: 8, background: 'var(--color-neutral-lightest)' }}>
                <input
                  type="radio"
                  name="institutional"
                  value={opt.v}
                  checked={institutionalAnswer === opt.v}
                  disabled={institutionalAnswer === 'correct'}
                  onChange={() => { setInstitutionalAnswer(opt.v); setInstitutionalError(false); }}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
                />
                <span className="ds-body text-neutral-black">{opt.label}</span>
              </label>
            ))}
          </div>
          {institutionalError && (
            <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
              {institutionalAnswer === '' ? 'Escolha uma das alternativas.' : 'Não é essa. Pense na fórmula que acabamos de construir.'}
            </p>
          )}
          {institutionalAnswer !== 'correct' && (
            <div className="flex justify-center mt-macro">
              <Button style="primary" size="small" onClick={validateInstitutional}>Conferir</Button>
            </div>
          )}
          {institutionalAnswer === 'correct' && (
            <>
              <p className="ds-body-bold text-center mt-macro" style={{ color: 'var(--color-feedback-success-dark)' }}>
                ✓ Correto! Você construiu a fórmula geral.
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={() => setPhase('done')}>
                  Continuar
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ done — controle de rodadas ═══════ */}
      {phase === 'done' && (
        <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[620px] mx-auto">
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            🎯 Fórmula geral da probabilidade da união
          </p>
          <div
            className="bg-neutral-white rounded-md p-micro text-center"
            style={{ border: '2px solid var(--color-brand-otimath-pure)' }}
          >
            <p className="ds-heading-large" style={{ color: 'var(--color-brand-otimath-dark)' }}>
              P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
            </p>
          </div>
          <p className="ds-body text-neutral-black mt-micro" style={{ textAlign: 'justify' }}>
            Essa é a fórmula <strong>geral</strong> — funciona para quaisquer dois eventos A e B,
            sejam eles mutuamente exclusivos ou não.
          </p>
          {round === 0 && (
            <p className="ds-small text-neutral-dark mt-micro" style={{ textAlign: 'justify', fontStyle: 'italic' }}>
              Se quiser, pode estudar novamente com um novo par de eventos (até 3 rodadas).
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
                Estudar novamente (rodada {round + 2} de 3)
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
              Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════

// Input de fração (numerador em cima, barra, denominador embaixo)
interface FractionInputProps {
  num: string; den: string;
  setNum: (v: string) => void; setDen: (v: string) => void;
  error: boolean;
  onEnter?: () => void;
}
function FractionInput({ num, den, setNum, setDen, error, onEnter }: FractionInputProps) {
  const border = error ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px' }}>
      <input
        type="number" inputMode="numeric" value={num}
        onChange={e => setNum(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        placeholder="?" aria-label="Numerador"
        style={{ border: `2px solid ${border}`, borderRadius: 6, padding: '4px', width: 56, textAlign: 'center', outline: 'none', fontWeight: 700 }}
      />
      <hr style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '3px 0' }} />
      <input
        type="number" inputMode="numeric" value={den}
        onChange={e => setDen(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        placeholder="?" aria-label="Denominador"
        style={{ border: `2px solid ${border}`, borderRadius: 6, padding: '4px', width: 56, textAlign: 'center', outline: 'none', fontWeight: 700 }}
      />
    </div>
  );
}

// Barra empilhada visual da dupla contagem
function StackedBarComparison({ nA, nB, nI, nU }: { nA: number; nB: number; nI: number; nU: number }) {
  const total = nA + nB; // largura base
  const aPct = (nA / total) * 100;
  const bPct = (nB / total) * 100;
  const uPctOfTotal = (nU / total) * 100;
  const iPctOfTotal = (nI / total) * 100;

  return (
    <div className="mt-micro" style={{ maxWidth: 560, margin: '0 auto' }}>
      <p className="ds-small-bold text-center text-neutral-dark mb-nano">Barra 1: n(A) + n(B) empilhados</p>
      <div style={{ display: 'flex', width: '100%', height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-neutral-lighter)' }}>
        <div style={{ width: `${aPct}%`, background: EVENT_COLORS['A'], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>
          A = {nA}
        </div>
        <div style={{ width: `${bPct}%`, background: EVENT_COLORS['B'], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>
          B = {nB}
        </div>
      </div>
      <p className="ds-small text-center mt-nano" style={{ color: 'var(--color-neutral-dark)' }}>
        Total empilhado = {total}
      </p>

      <p className="ds-small-bold text-center text-neutral-dark mt-micro mb-nano">Barra 2: n(A ∪ B) real (sem dupla contagem)</p>
      <div style={{ display: 'flex', width: '100%', height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-neutral-lighter)' }}>
        <div style={{ width: `${uPctOfTotal}%`, background: EVENT_COLORS['A∪B'], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>
          A ∪ B = {nU}
        </div>
        <div style={{ width: `${100 - uPctOfTotal}%`, background: 'repeating-linear-gradient(45deg, #ff6b6b, #ff6b6b 6px, #ff9999 6px, #ff9999 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}>
          ← diferença = {total - nU}
        </div>
      </div>
      <p className="ds-small text-center mt-nano" style={{ color: 'var(--color-feedback-error-dark)', fontWeight: 600 }}>
        A diferença ({total - nU}) corresponde a <strong>2 × n(A ∩ B) − n(A ∩ B) = n(A ∩ B) = {nI}</strong>{' '}
        que foi contada <strong>duas vezes</strong> em n(A) + n(B).
      </p>
      {/* Valor calculado (silenciado TS) */}
      <span style={{ display: 'none' }}>{iPctOfTotal}</span>
    </div>
  );
}

// Enumeração com destaque cromático e animação de piscar dos elementos
// que pertencem a um subconjunto (usado em enumDisplay).
// Respeita prefers-reduced-motion (piscar desativado).
function EnumeratedSetWithHighlight({
  set,
  highlightSet,
  highlightColor,
  blink = true,
}: {
  set: Set<string>;
  highlightSet: Set<string>;
  highlightColor: string;
  blink?: boolean;
}) {
  const list = Array.from(set)
    .map(k => k.split(',').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return (
    <>
      <style>{`
        @keyframes intersectionBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-intersection-blink] { animation: none !important; }
        }
      `}</style>
      {list.map(([r, c], i) => {
        const key = `${r},${c}`;
        const isHighlighted = highlightSet.has(key);
        return (
          <span
            key={key}
            data-intersection-blink={isHighlighted && blink ? 'true' : undefined}
            style={{
              color: isHighlighted ? highlightColor : 'var(--color-neutral-darkest)',
              fontWeight: isHighlighted ? 800 : 700,
              animation: isHighlighted && blink ? 'intersectionBlink 1.2s ease-in-out infinite' : undefined,
            }}
          >
            ({r},{c}){i < list.length - 1 ? ', ' : ''}
          </span>
        );
      })}
    </>
  );
}

// Cria a descrição intensional curta do evento (para o layout "A = {soma > 7}").
// Remove o prefixo "A " da descrição verbal se existir.
function shortPredicate(description: string): string {
  return description.replace(/^A\s+/, '').trim();
}

// Extrai o predicado curto de uma descrição de evento sobre soma.
// Exemplos:
//   "A soma é maior que 7"     → "maior que 7"
//   "A soma é par"             → "par"
//   "A soma é menor ou igual a 9" → "menor ou igual a 9"
//   "A soma está entre 4 e 9"  → "entre 4 e 9"
//   "A soma é um número primo" → "um número primo"
//   "A soma é múltipla de 3"   → "múltipla de 3"
function extractSumPredicate(description: string): string {
  // Remove "A soma é " ou "A soma está " do início
  const cleaned = description
    .replace(/^A\s+soma\s+é\s+/i, '')
    .replace(/^A\s+soma\s+está\s+/i, '')
    .replace(/^A\s+soma\s+/i, '')
    .trim();
  return cleaned;
}

// Formata o predicado para uso natural no enunciado do problema da intro.
// Insere "número" antes de adjetivos soltos ("par" → "número par", etc.).
function formatForProblem(predicate: string): string {
  const p = predicate.trim();
  if (p === 'par') return 'número par';
  if (p === 'ímpar') return 'número ímpar';
  return p;
}

// Seta coloridinha apontando para a direita (usada nas legendas da resolução)
function ArrowLegend({ color }: { color: string }) {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden style={{ flexShrink: 0 }}>
      <line x1="1" y1="8" x2="22" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="17,3 24,8 17,13" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// ProbTransferScreen — tela de transferência para a probabilidade
// Problema verbal + resolução animada estilo Laplace (Disco Probabilístico):
//   - Fração com barra horizontal
//   - Cada componente (n(A∪B), n(S)) identificado com sua legenda colorida
//   - Após preenchimento correto: conversões decimal e percentual
// ═══════════════════════════════════════════════════════════════

interface ProbTransferScreenProps {
  eventADescription: string;
  eventBDescription: string;
  nU: number;
  pAUBNum: string; pAUBDen: string;
  setPAUBNum: (v: string) => void;
  setPAUBDen: (v: string) => void;
  pAUBError: boolean;
  validatePAUB: () => void;
  isEquivalentFraction: (num: string, den: string, eNum: number, eDen: number) => boolean;
  onContinue: () => void;
}

function ProbTransferScreen({
  eventADescription, eventBDescription,
  nU,
  pAUBNum, pAUBDen, setPAUBNum, setPAUBDen,
  pAUBError, validatePAUB, isEquivalentFraction, onContinue,
}: ProbTransferScreenProps) {
  // Animação estilo Laplace em passos:
  // 0 = só fórmula; 1 = legenda n(A∪B); 2 = legenda n(S); 3 = legenda P(A∪B)
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) { setRevealStep(3); return; }
    const t1 = setTimeout(() => setRevealStep(1), 800);
    const t2 = setTimeout(() => setRevealStep(2), 1600);
    const t3 = setTimeout(() => setRevealStep(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isCorrect = isEquivalentFraction(pAUBNum, pAUBDen, nU, 36);

  // Detecta qual parte está errada (apenas numerador, apenas denominador, ou ambos).
  // Usa a forma CANÔNICA (nU / 36) como referência para a dica direcionada.
  const errorType: 'num' | 'den' | 'both' | null = useMemo(() => {
    if (!pAUBError) return null;
    const num = parseInt(pAUBNum.trim(), 10);
    const den = parseInt(pAUBDen.trim(), 10);
    const numLooksRight = Number.isInteger(num) && num === nU;
    const denLooksRight = Number.isInteger(den) && den === 36;
    if (numLooksRight && !denLooksRight) return 'den';
    if (!numLooksRight && denLooksRight) return 'num';
    return 'both';
  }, [pAUBError, pAUBNum, pAUBDen, nU]);

  // Conversões (só após o aluno acertar a fração)
  const decimal = isCorrect ? (nU / 36).toFixed(4).replace(/\.?0+$/, '') : null;
  const percent = isCorrect ? ((nU / 36) * 100).toFixed(2).replace(/\.?0+$/, '') : null;

  const FractionStacked = ({
    top, bottom, topColor, bottomColor, size = '1.6rem',
  }: { top: React.ReactNode; bottom: React.ReactNode; topColor?: string; bottomColor?: string; size?: string }) => (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
        margin: '0 4px',
      }}
    >
      <span style={{ color: topColor, paddingBottom: 2 }}>{top}</span>
      <span style={{ display: 'block', width: '100%', borderTop: '2.5px solid var(--color-neutral-darkest)' }} />
      <span style={{ color: bottomColor, paddingTop: 2 }}>{bottom}</span>
    </span>
  );

  return (
    <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[720px] mx-auto">
      <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
        Agora vamos calcular a probabilidade
      </p>

      {/* Painel de valores — nesta fase só n(A∪B) e n(S) são relevantes
          (Laplace direto: P(A∪B) = n(A∪B) / n(S)). As demais cardinalidades
          aparecerão nas fases posteriores, quando forem de fato necessárias. */}
      <ValuesRecallPanel nU={nU} />

      {/* Enunciado do problema — extrai o predicado curto das descrições
          (ex.: "A soma é maior que 7" → "maior que 7"; "A soma é par" → "par") */}
      <div
        className="rounded-md p-micro mt-micro"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: '1px solid var(--color-brand-otimath-light)',
        }}
      >
        <p className="ds-caption-bold text-brand-otimath-dark mb-nano" style={{ fontSize: '0.82rem' }}>
          Problema
        </p>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          No lançamento simultâneo de dois dados equilibrados, qual a probabilidade de que{' '}
          a <strong>soma dos resultados dos dois dados</strong> seja{' '}
          <strong style={{ color: EVENT_COLORS['A'] }}>{extractSumPredicate(eventADescription)}</strong>{' '}
          <strong>ou</strong>{' '}
          <strong style={{ color: EVENT_COLORS['B'] }}>{extractSumPredicate(eventBDescription)}</strong>?
        </p>
      </div>

      {/* Resolução — fração à esquerda, legendas com setas à direita,
          animadas em sequência. Após o aluno acertar a fração, as legendas
          e setas desaparecem (fade out). */}
      <div className="mt-micro">
        <p className="ds-caption-bold text-neutral-dark mb-nano" style={{ fontSize: '0.82rem' }}>
          Resolução
        </p>

        <div
          className="rounded-md p-micro"
          style={{
            background: 'var(--color-neutral-lightest)',
            border: '1px solid var(--color-neutral-lighter)',
            minHeight: 160,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Fórmula à esquerda */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '1.4rem', fontWeight: 700,
                  color: EVENT_COLORS['A∪B'],
                }}
              >
                P(A ∪ B)
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>=</span>
              <FractionStacked
                top={<span>n(A ∪ B)</span>}
                bottom={<span>n(S)</span>}
                topColor={EVENT_COLORS['A∪B']}
                bottomColor="var(--color-neutral-dark)"
              />
            </div>

            {/* Legendas com setas à direita, em coluna. Permanecem visíveis mesmo após acerto. */}
            <div
              className="flex flex-col gap-y-micro"
              style={{
                minWidth: 240,
                opacity: revealStep === 0 ? 0 : 1,
                transition: 'opacity 0.4s ease',
              }}
            >
              {revealStep >= 1 && (
                  <div
                    className="flex items-center gap-x-nano"
                    style={{ animation: 'fadeInSoftLeft 0.45s ease-out' }}
                  >
                    <ArrowLegend color={EVENT_COLORS['A∪B']} />
                    <div
                      className="rounded-md p-nano"
                      style={{
                        background: 'var(--color-brand-otimath-lightest)',
                        border: `1px solid ${EVENT_COLORS['A∪B']}`,
                        flex: 1,
                      }}
                    >
                      <span className="ds-small-bold" style={{ color: EVENT_COLORS['A∪B'] }}>
                        n(A ∪ B)
                      </span>
                      <span className="ds-small text-neutral-darkest"> = número de casos favoráveis A ou B</span>
                    </div>
                  </div>
                )}
                {revealStep >= 2 && (
                  <div
                    className="flex items-center gap-x-nano"
                    style={{ animation: 'fadeInSoftLeft 0.45s ease-out' }}
                  >
                    <ArrowLegend color="var(--color-neutral-dark)" />
                    <div
                      className="rounded-md p-nano"
                      style={{
                        background: 'var(--color-neutral-lightest)',
                        border: '1px solid var(--color-neutral-dark)',
                        flex: 1,
                      }}
                    >
                      <span className="ds-small-bold" style={{ color: 'var(--color-neutral-dark)' }}>
                        n(S)
                      </span>
                      <span className="ds-small text-neutral-darkest"> = total de casos possíveis no lançamento de dois dados</span>
                    </div>
                  </div>
                )}
                {revealStep >= 3 && (
                  <div
                    className="flex items-center gap-x-nano"
                    style={{ animation: 'fadeInSoftLeft 0.45s ease-out' }}
                  >
                    <ArrowLegend color={EVENT_COLORS['A∪B']} />
                    <div
                      className="rounded-md p-nano"
                      style={{
                        background: 'var(--color-brand-otimath-lightest)',
                        border: `1px solid ${EVENT_COLORS['A∪B']}`,
                        flex: 1,
                      }}
                    >
                      <span className="ds-small-bold" style={{ color: EVENT_COLORS['A∪B'] }}>
                        P(A ∪ B)
                      </span>
                      <span className="ds-small text-neutral-darkest"> = probabilidade de ocorrer A ou B</span>
                    </div>
                  </div>
                )}
              </div>
          </div>

          <style>{`
            @keyframes fadeInSoftLeft {
              from { opacity: 0; transform: translateX(-6px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>

      {/* Input do aluno — permanece visível sempre. Após acerto, mostra ✓ em vez do botão. */}
      {revealStep >= 3 && (
        <div className="mt-micro">
          <p className="ds-body text-neutral-black text-center mb-nano">
            Substituindo os valores, preencha a fração abaixo:
          </p>
          <div
            className="rounded-md p-micro"
            style={{
              background: 'var(--color-neutral-lightest)',
              border: '1px solid var(--color-neutral-lighter)',
            }}
          >
            <div className="flex items-center justify-center gap-x-micro flex-wrap">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'], fontSize: '1.15rem' }}>
                P(A ∪ B) =
              </span>
              <FractionInput
                num={pAUBNum} den={pAUBDen}
                setNum={setPAUBNum} setDen={setPAUBDen}
                error={pAUBError} onEnter={validatePAUB}
              />
              {!isCorrect && (
                <Button style="primary" size="extra-small" onClick={validatePAUB}>Conferir</Button>
              )}
              {isCorrect && (
                <span
                  aria-label="Resposta correta"
                  className="ds-body-bold"
                  style={{ color: 'var(--color-feedback-success-dark)', fontSize: '1.5rem' }}
                >
                  ✓
                </span>
              )}
            </div>
          </div>
          {pAUBError && errorType && (
            <div
              role="alert"
              className="rounded-md p-micro mt-micro"
              style={{
                background: 'rgba(194, 65, 12, 0.08)',
                border: '1px solid var(--color-feedback-error-dark)',
              }}
            >
              {errorType === 'num' && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Quantos resultados ocorrem apenas em A, apenas em B ou em ambos?
                </p>
              )}
              {errorType === 'den' && (
                <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Lançando dois dados, quantos pares ordenados podem ocorrer?
                </p>
              )}
              {errorType === 'both' && (
                <>
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    <strong>Numerador:</strong> quantos resultados ocorrem apenas em A, apenas em B ou em ambos?
                  </p>
                  <p className="ds-small-bold text-center mt-nano" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    <strong>Denominador:</strong> lançando dois dados, quantos pares ordenados podem ocorrer?
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversões decimal e percentual após acerto */}
      {isCorrect && (
        <div className="mt-micro">
          <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
            ✓ Correto!
          </p>
          <div
            className="rounded-md p-micro mt-nano"
            style={{
              background: 'var(--color-brand-otimath-lightest)',
              border: `2px solid ${EVENT_COLORS['A∪B']}`,
            }}
          >
            <p className="ds-caption-bold text-center mb-nano" style={{ color: EVENT_COLORS['A∪B'], fontSize: '0.82rem' }}>
              A probabilidade em 3 formas equivalentes
            </p>
            <div className="flex items-center justify-center gap-x-micro flex-wrap" style={{ gap: 12 }}>
              {/* Fração */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'] }}>Fração:</span>
                <FractionStacked
                  top={<span>{nU}</span>}
                  bottom={<span>36</span>}
                  topColor={EVENT_COLORS['A∪B']}
                  bottomColor="var(--color-neutral-dark)"
                  size="1.1rem"
                />
              </div>
              <span className="ds-body-bold text-neutral-dark">=</span>
              {/* Decimal (sem rótulo) */}
              <span className="ds-body-bold text-neutral-darkest" style={{ fontSize: '1.05rem' }}>
                {decimal}
              </span>
              <span className="ds-body-bold text-neutral-dark">=</span>
              {/* Percentual (sem rótulo) */}
              <span className="ds-body-bold text-neutral-darkest" style={{ fontSize: '1.05rem' }}>
                {percent}%
              </span>
            </div>
          </div>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={onContinue}>Continuar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Painel de valores calculados — cada campo é opcional (undefined = não renderiza).
// Usado em fases diferentes conforme o que já foi preenchido até ali:
// - probTransfer (Laplace direto):   só n(A∪B) e n(S)
// - probCalc (fórmula da união):     todos os 5 valores
// "cartão de memória" para apoiar o aluno
// durante as fases de probabilidade. Mostra n(A), n(B), n(A∩B), n(A∪B), n(S).
function ValuesRecallPanel({
  nA, nB, nI, nU,
}: {
  nA?: number; nB?: number; nI?: number; nU?: number;
}) {
  const item = (label: string, value: number | string, color: string) => (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        background: 'var(--color-neutral-white)',
        border: `2px solid ${color}`,
        minWidth: 72,
      }}
    >
      <span className="ds-caption" style={{ color, fontWeight: 700, fontSize: '0.72rem' }}>
        {label}
      </span>
      <span className="ds-body-bold" style={{ color: 'var(--color-neutral-darkest)', fontSize: '1.05rem' }}>
        {value}
      </span>
    </div>
  );
  return (
    <div
      className="rounded-md p-micro mb-micro"
      aria-label="Valores calculados nas etapas anteriores"
      style={{
        background: 'var(--color-brand-otimath-lightest)',
        border: '1px solid var(--color-brand-otimath-light)',
      }}
    >
      <p className="ds-caption-bold text-center text-neutral-dark mb-nano" style={{ fontSize: '0.78rem' }}>
        Valores calculados nas etapas anteriores
      </p>
      <div className="flex items-center justify-center" style={{ gap: 8, flexWrap: 'wrap' }}>
        {nA !== undefined && item('n(A)', nA, EVENT_COLORS['A'])}
        {nB !== undefined && item('n(B)', nB, EVENT_COLORS['B'])}
        {nI !== undefined && item('n(A ∩ B)', nI, EVENT_COLORS['A∩B'])}
        {nU !== undefined && item('n(A ∪ B)', nU, EVENT_COLORS['A∪B'])}
        {item('n(S)', 36, 'var(--color-neutral-dark)')}
      </div>
    </div>
  );
}

// Animação da derivação da fórmula
// Componente auxiliar: fração estilizada com barra horizontal (não usar /).
function FracH({
  top, bottom, color, size = '1.05rem',
}: { top: React.ReactNode; bottom: React.ReactNode; color?: string; size?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.1,
        margin: '0 3px',
        color,
      }}
    >
      <span style={{ paddingBottom: 1 }}>{top}</span>
      <span
        style={{
          display: 'block',
          width: '100%',
          minWidth: 32,
          borderTop: `2px solid ${color ?? 'var(--color-neutral-darkest)'}`,
        }}
      />
      <span style={{ paddingTop: 1 }}>{bottom}</span>
    </span>
  );
}

// Dedução da fórmula geral da probabilidade da união de dois eventos.
// Apresentação em slides: primeiro os pré-requisitos ("Sabemos que..."),
// depois a derivação passo a passo. Cada linha aparece em sequência,
// com botão "Próximo" para o aluno controlar o ritmo.
function ProbFormulaRevealAnimation({
  onContinue,
}: {
  onContinue: () => void;
}) {
  // step 0..3 = pré-requisitos: 4 frações (P(A∪B), P(A), P(B), P(A∩B))
  // step 4    = pré-requisito: relação n(A∪B) = n(A)+n(B)−n(A∩B)
  // step 5..8 = 4 linhas da derivação simbólica
  //   Cada transição (6, 7, 8, 9) dispara um PISCAR sincronizado entre
  //   o elemento do bloco "Sabemos que" e o elemento substituído na linha
  //   anterior da dedução. O piscar dura 1500ms e depois para.
  // step 9    = fórmula final destacada
  const [step, setStep] = useState(0);
  const FINAL = 9;

  // Controle do piscar sincronizado ao avançar para steps de substituição.
  // Cada valor destaca os elementos correspondentes no bloco "Sabemos que"
  // e nas linhas da dedução, em sincronia:
  //   'nU'      — n(A∪B) sendo substituído (step 5→6): pisca na relação do
  //               Sabemos que + numerador Linha 1 + numerador Linha 2
  //   'distrib' — distribuição da divisão (step 6→7): pisca numerador/denominador
  //               da Linha 2 + as 3 frações da Linha 3
  //   'probsA'  — gradativo step 8 (momento 1): pisca P(A) do Sabemos +
  //               n(A)/n(S) da Linha 3 + P(A) da Linha 4
  //   'probsB'  — gradativo step 8 (momento 2): análogo para B
  //   'probsI'  — gradativo step 8 (momento 3): análogo para A∩B
  const [flashTarget, setFlashTarget] = useState<'nU' | 'distrib' | 'probsA' | 'probsB' | 'probsI' | null>(null);

  const canAdvance = step < FINAL;

  const advance = () => {
    if (step < FINAL) {
      const next = step + 1;
      // Dispara piscar sincronizado ao entrar em cada step de substituição
      if (next === 6) setFlashTarget('nU');           // substituiu n(A∪B)
      else if (next === 7) setFlashTarget('distrib'); // distribuiu a divisão
      // step 8 (probs): sequência gradativa é disparada pelo useEffect abaixo
      setStep(next);
    }
  };

  // Piscar de duração única (nU e distrib): ~1800ms e depois limpa
  useEffect(() => {
    if (flashTarget !== 'nU' && flashTarget !== 'distrib') return;
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) { setFlashTarget(null); return; }
    const t = setTimeout(() => setFlashTarget(null), 1800);
    return () => clearTimeout(t);
  }, [flashTarget]);

  // Sequência gradativa ao entrar no step 8 (substituição das 3 frações por P)
  useEffect(() => {
    if (step !== 8) return;
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) return;
    // Disparo sequencial: A → B → A∩B → null
    const t1 = setTimeout(() => setFlashTarget('probsA'), 50);
    const t2 = setTimeout(() => setFlashTarget('probsB'), 1600);
    const t3 = setTimeout(() => setFlashTarget('probsI'), 3150);
    const t4 = setTimeout(() => setFlashTarget(null), 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [step]);

  // Respeita prefers-reduced-motion: mostra tudo direto
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) setStep(FINAL);
  }, []);

  const slideFadeIn: React.CSSProperties = { animation: 'deductFadeIn 0.35s ease-out' };

  return (
    <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[760px] mx-auto">
      <style>{`
        @keyframes deductFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes substitutionBlink {
          0%, 100% { background-color: transparent; transform: scale(1); }
          50% { background-color: rgba(251, 191, 36, 0.55); transform: scale(1.08); }
        }
        .flash-sub {
          animation: substitutionBlink 0.55s ease-in-out 3;
          border-radius: 4px;
          padding: 1px 3px;
          display: inline-block;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .flash-sub { animation: none; }
        }
      `}</style>

      <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
        Dedução da Fórmula Geral da Probabilidade da União de dois Eventos
      </p>

      {/* ─────── Bloco 1: Sabemos que… (5 pré-requisitos) ─────── */}
      <div
        className="rounded-md p-micro mb-micro"
        style={{
          background: 'var(--color-neutral-white)',
          border: '1px solid var(--color-brand-otimath-light)',
        }}
      >
        <p className="ds-body-bold text-center" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          Sabemos que:
        </p>

        <div className="flex flex-col gap-y-nano mt-nano" style={{ alignItems: 'center' }}>
          {step >= 0 && (
            <div style={slideFadeIn} className="flex items-center" aria-live="polite">
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'] }}>P(A ∪ B)&nbsp;=&nbsp;</span>
              <FracH top={<span>n(A ∪ B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A∪B']} />
            </div>
          )}
          {step >= 1 && (
            <div
              style={slideFadeIn}
              className={`flex items-center ${flashTarget === 'probsA' ? 'flash-sub' : ''}`}
              aria-live="polite"
            >
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A'] }}>P(A)&nbsp;=&nbsp;</span>
              <FracH top={<span>n(A)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A']} />
            </div>
          )}
          {step >= 2 && (
            <div
              style={slideFadeIn}
              className={`flex items-center ${flashTarget === 'probsB' ? 'flash-sub' : ''}`}
              aria-live="polite"
            >
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['B'] }}>P(B)&nbsp;=&nbsp;</span>
              <FracH top={<span>n(B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['B']} />
            </div>
          )}
          {step >= 3 && (
            <div
              style={slideFadeIn}
              className={`flex items-center ${flashTarget === 'probsI' ? 'flash-sub' : ''}`}
              aria-live="polite"
            >
              <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'] }}>P(A ∩ B)&nbsp;=&nbsp;</span>
              <FracH top={<span>n(A ∩ B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A∩B']} />
            </div>
          )}
          {step >= 4 && (
            <div
              style={slideFadeIn}
              className={`flex items-center ${flashTarget === 'nU' ? 'flash-sub' : ''}`}
              aria-live="polite"
            >
              <span className="ds-body-bold text-neutral-darkest">
                n(A ∪ B) = n(A) + n(B) − n(A ∩ B)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─────── Bloco 2: Dedução passo a passo (5 linhas + destaque final) ─────── */}
      {step >= 5 && (
        <div
          className="rounded-md p-micro mb-micro"
          style={{
            background: 'var(--color-neutral-white)',
            border: '1px solid var(--color-brand-otimath-light)',
          }}
        >
          <p className="ds-body-bold text-center mb-nano" style={{ color: 'var(--color-brand-otimath-dark)' }}>
            Substituindo passo a passo:
          </p>

          <div className="flex flex-col gap-y-micro" style={{ alignItems: 'center' }}>
            {/* Linha 1: P(A∪B) = n(A∪B)/n(S) — n(A∪B) pisca quando sendo substituído (step→6) */}
            {step >= 5 && (
              <div style={slideFadeIn} className="flex items-center flex-wrap" aria-live="polite">
                <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'] }}>P(A ∪ B)&nbsp;=&nbsp;</span>
                <span className={flashTarget === 'nU' ? 'flash-sub' : undefined} style={{ display: 'inline-block' }}>
                  <FracH top={<span>n(A ∪ B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A∪B']} />
                </span>
              </div>
            )}
            {/* Linha 2: = (n(A)+n(B)−n(A∩B))/n(S)
                Numerador pisca tanto ao ENTRAR (nU — destaca o novo valor substituído)
                quanto ao DISTRIBUIR a divisão (distrib — destaca o que será dividido). */}
            {step >= 6 && (
              <div style={slideFadeIn} className="flex items-center flex-wrap" aria-live="polite">
                <span className="ds-body-bold text-neutral-darkest">=&nbsp;</span>
                <span className={flashTarget === 'nU' || flashTarget === 'distrib' ? 'flash-sub' : undefined} style={{ display: 'inline-block' }}>
                  <FracH
                    top={<span>n(A) + n(B) − n(A ∩ B)</span>}
                    bottom={<span>n(S)</span>}
                    color="var(--color-brand-otimath-dark)"
                  />
                </span>
              </div>
            )}
            {/* Linha 3: = n(A)/n(S) + n(B)/n(S) − n(A∩B)/n(S)
                Cada fração pisca individualmente quando sua sub-etapa ativa (probsA/B/I)
                e todas juntas quando a distribuição ocorre (distrib). */}
            {step >= 7 && (
              <div style={slideFadeIn} className="flex items-center flex-wrap" aria-live="polite">
                <span className="ds-body-bold text-neutral-darkest">=&nbsp;</span>
                <span
                  className={flashTarget === 'probsA' || flashTarget === 'distrib' ? 'flash-sub' : undefined}
                  style={{ display: 'inline-block' }}
                >
                  <FracH top={<span>n(A)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A']} />
                </span>
                <span className="ds-body-bold text-neutral-darkest">&nbsp;+&nbsp;</span>
                <span
                  className={flashTarget === 'probsB' || flashTarget === 'distrib' ? 'flash-sub' : undefined}
                  style={{ display: 'inline-block' }}
                >
                  <FracH top={<span>n(B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['B']} />
                </span>
                <span className="ds-body-bold text-neutral-darkest">&nbsp;−&nbsp;</span>
                <span
                  className={flashTarget === 'probsI' || flashTarget === 'distrib' ? 'flash-sub' : undefined}
                  style={{ display: 'inline-block' }}
                >
                  <FracH top={<span>n(A ∩ B)</span>} bottom={<span>n(S)</span>} color={EVENT_COLORS['A∩B']} />
                </span>
              </div>
            )}
            {/* Linha 4: = P(A) + P(B) − P(A∩B)
                Cada P pisca quando sua sub-etapa gradativa está ativa. */}
            {step >= 8 && (
              <div style={slideFadeIn} className="flex items-center flex-wrap" aria-live="polite">
                <span className="ds-body-bold text-neutral-darkest">=&nbsp;</span>
                <span
                  className={`ds-body-bold ${flashTarget === 'probsA' ? 'flash-sub' : ''}`}
                  style={{ color: EVENT_COLORS['A'] }}
                >
                  P(A)
                </span>
                <span className="ds-body-bold text-neutral-darkest">&nbsp;+&nbsp;</span>
                <span
                  className={`ds-body-bold ${flashTarget === 'probsB' ? 'flash-sub' : ''}`}
                  style={{ color: EVENT_COLORS['B'] }}
                >
                  P(B)
                </span>
                <span className="ds-body-bold text-neutral-darkest">&nbsp;−&nbsp;</span>
                <span
                  className={`ds-body-bold ${flashTarget === 'probsI' ? 'flash-sub' : ''}`}
                  style={{ color: EVENT_COLORS['A∩B'] }}
                >
                  P(A ∩ B)
                </span>
              </div>
            )}
          </div>

          {/* Linha destacada — fórmula final */}
          {step >= 9 && (
            <div
              className="bg-brand-otimath-lightest rounded-md p-micro text-center mt-micro"
              style={{ border: '2px solid var(--color-brand-otimath-pure)', ...slideFadeIn }}
            >
              <p className="ds-heading-large" style={{ color: 'var(--color-brand-otimath-dark)' }}>
                P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────── Controles ─────── */}
      <div className="flex justify-center mt-micro">
        {canAdvance ? (
          <Button style="primary" size="small" onClick={advance}>
            Próximo
          </Button>
        ) : (
          <Button style="primary" size="small" onClick={onContinue}>
            Continuar
          </Button>
        )}
      </div>

      {/* Contador discreto de slide */}
      <p className="ds-caption text-center text-neutral-medium mt-nano" style={{ fontSize: '0.72rem' }}>
        {Math.min(step + 1, FINAL + 1)} / {FINAL + 1}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ProbFormulaApplyScreen — tela que APRESENTA os valores a serem
// substituídos na fórmula geral. Recapitula P(A), P(B), P(A∩B) e P(A∪B)
// (já calculados pelo aluno nas fases anteriores) e relembra a fórmula.
// ═══════════════════════════════════════════════════════════════

function ProbFormulaApplyScreen({
  nA, nB, nI, nU, onContinue,
}: {
  nA: number; nB: number; nI: number; nU: number;
  onContinue: () => void;
}) {
  return (
    <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto">
      <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
        Valores calculados para a substituição
      </p>

      <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
        Você já calculou as quatro probabilidades necessárias nas fases anteriores:
      </p>

      <div
        className="rounded-md p-micro mb-micro"
        style={{ background: 'var(--color-neutral-white)', border: '1px solid var(--color-brand-otimath-light)' }}
      >
        <div className="flex flex-col gap-y-micro" style={{ alignItems: 'center' }}>
          <div className="flex items-center">
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A'] }}>P(A)&nbsp;=&nbsp;</span>
            <FracH top={<span>{nA}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A']} size="1.15rem" />
          </div>
          <div className="flex items-center">
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['B'] }}>P(B)&nbsp;=&nbsp;</span>
            <FracH top={<span>{nB}</span>} bottom={<span>36</span>} color={EVENT_COLORS['B']} size="1.15rem" />
          </div>
          <div className="flex items-center">
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'] }}>P(A ∩ B)&nbsp;=&nbsp;</span>
            <FracH top={<span>{nI}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∩B']} size="1.15rem" />
          </div>
          <div className="flex items-center">
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'] }}>P(A ∪ B)&nbsp;=&nbsp;</span>
            <FracH top={<span>{nU}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∪B']} size="1.15rem" />
            <span className="ds-caption text-neutral-medium" style={{ marginLeft: 6, fontSize: '0.78rem' }}>
              (calculado diretamente por Laplace)
            </span>
          </div>
        </div>
      </div>

      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Agora vamos <strong>verificar</strong> se a fórmula que acabamos de deduzir dá o mesmo
        resultado. Lembre-se:
      </p>

      <div
        className="bg-neutral-white rounded-md p-micro text-center mt-micro"
        style={{ border: `2px solid ${EVENT_COLORS['A∪B']}` }}
      >
        <p className="ds-heading-large" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
        </p>
      </div>

      <div className="flex justify-center mt-macro">
        <Button style="primary" size="small" onClick={onContinue}>
          Substituir
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ProbFormulaVerifyScreen — substitui numericamente e verifica que o
// resultado coincide com P(A∪B) calculado por Laplace direto.
// Também traz a nota de generalização (caso ME do Disco é particular).
// ═══════════════════════════════════════════════════════════════

function ProbFormulaVerifyScreen({
  nA, nB, nI, nU, onContinue,
}: {
  nA: number; nB: number; nI: number; nU: number;
  onContinue: () => void;
}) {
  return (
    <div className="bg-brand-otimath-lightest rounded-lg p-xxs border-2 border-brand-otimath-pure max-w-[720px] mx-auto">
      <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
        Verificação com os valores do problema
      </p>

      {/* Substituição numérica */}
      <div
        className="rounded-md p-micro mb-micro"
        style={{ background: 'var(--color-neutral-white)', border: `2px solid ${EVENT_COLORS['A∪B']}` }}
      >
        <div className="flex flex-col gap-y-micro" style={{ alignItems: 'center' }}>
          {/* Linha 1: fórmula simbólica */}
          <div className="flex items-center flex-wrap">
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∪B'] }}>P(A ∪ B)&nbsp;=&nbsp;</span>
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A'] }}>P(A)</span>
            <span className="ds-body-bold text-neutral-darkest">&nbsp;+&nbsp;</span>
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['B'] }}>P(B)</span>
            <span className="ds-body-bold text-neutral-darkest">&nbsp;−&nbsp;</span>
            <span className="ds-body-bold" style={{ color: EVENT_COLORS['A∩B'] }}>P(A ∩ B)</span>
          </div>

          {/* Linha 2: substituindo os valores */}
          <div className="flex items-center flex-wrap">
            <span className="ds-body-bold text-neutral-darkest">=&nbsp;</span>
            <FracH top={<span>{nA}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A']} size="1.15rem" />
            <span className="ds-body-bold text-neutral-darkest">&nbsp;+&nbsp;</span>
            <FracH top={<span>{nB}</span>} bottom={<span>36</span>} color={EVENT_COLORS['B']} size="1.15rem" />
            <span className="ds-body-bold text-neutral-darkest">&nbsp;−&nbsp;</span>
            <FracH top={<span>{nI}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∩B']} size="1.15rem" />
          </div>

          {/* Linha 3: resultado da soma */}
          <div className="flex items-center flex-wrap">
            <span className="ds-body-bold text-neutral-darkest">=&nbsp;</span>
            <FracH top={<span>{nA + nB - nI}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∪B']} size="1.2rem" />
          </div>
        </div>
      </div>

      {/* Verificação cruzada */}
      <div
        className="rounded-md p-micro mb-micro"
        style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid var(--color-feedback-success-dark)' }}
      >
        <p className="ds-body-bold text-center mb-nano" style={{ color: 'var(--color-feedback-success-dark)' }}>
          ✓ Duas rotas — mesmo resultado
        </p>
        <div className="flex items-center justify-center flex-wrap" style={{ gap: 10 }}>
          <div className="flex items-center">
            <span className="ds-small-bold text-neutral-darkest">Por Laplace direto:&nbsp;</span>
            <FracH top={<span>{nU}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∪B']} size="1rem" />
          </div>
          <span className="ds-body-bold text-neutral-darkest">=</span>
          <div className="flex items-center">
            <span className="ds-small-bold text-neutral-darkest">Pela fórmula geral:&nbsp;</span>
            <FracH top={<span>{nA + nB - nI}</span>} bottom={<span>36</span>} color={EVENT_COLORS['A∪B']} size="1rem" />
          </div>
        </div>
        <p className="ds-small text-center mt-nano" style={{ color: 'var(--color-neutral-darkest)' }}>
          As duas rotas são equivalentes — a matemática é consistente!
        </p>
      </div>

      {/* Nota de generalização */}
      <div
        className="rounded-md p-micro"
        style={{ background: 'var(--color-brand-otimath-lightest)', border: '1px solid var(--color-brand-otimath-light)' }}
      >
        <p className="ds-body-bold text-center mb-nano" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          Generalização do caso que você já conhecia
        </p>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          Essa fórmula <strong>generaliza</strong> a que você aprendeu no OVA do{' '}
          <strong>Disco Probabilístico</strong>. Quando A e B são <strong>mutuamente exclusivos</strong>,
          temos A ∩ B = ∅, logo P(A ∩ B) = 0 e resta:
        </p>
        <p className="ds-body-bold text-center mt-nano" style={{ color: 'var(--color-brand-otimath-pure)', fontSize: '1.05rem' }}>
          P(A ∪ B) = P(A) + P(B) − 0 = P(A) + P(B)
        </p>
        <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
          A fórmula geral <strong>contém</strong> o caso particular: quando a interseção é vazia,
          ela se reduz à fórmula do Disco.
        </p>
      </div>

      <div className="flex justify-center mt-macro">
        <Button style="primary" size="small" onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INDICADOR DE PROGRESSO DAS 3 MACRO-ETAPAS
// ═══════════════════════════════════════════════════════════════

function MacroProgressIndicator({ phase }: { phase: UnionPhase }) {
  // MACRO 1 — Contagem (A, B, A∩B)
  // MACRO 2 — União + Probabilidade direta por Laplace
  // MACRO 3 — Descoberta da fórmula geral P(A∪B) = P(A)+P(B)−P(A∩B)
  const macro1: UnionPhase[] = ['intro', 'markA', 'countA', 'markB', 'countB', 'defineIntersection', 'markIntersection', 'countIntersection', 'enumDisplay'];
  const macro2: UnionPhase[] = ['synthM1', 'defineUnion', 'markUnion', 'countUnion', 'probTransfer'];
  const macro3: UnionPhase[] = ['synthM2', 'predict', 'sumCompareVisual', 'formulaReveal', 'probCalc', 'probFormulaReveal', 'probFormulaApply', 'probFormulaVerify', 'institucionalize', 'done'];

  const current = macro1.includes(phase) ? 1 : macro2.includes(phase) ? 2 : macro3.includes(phase) ? 3 : 0;
  const labels = ['Contagem', 'União por Laplace', 'Fórmula geral'];

  return (
    <div
      className="flex items-center justify-center gap-x-micro mb-micro"
      role="progressbar"
      aria-label="Progresso das três macro-etapas"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={current}
    >
      {[1, 2, 3].map(n => {
        const isCurrent = current === n;
        const isDone = current > n;
        const bg = isDone ? '#1a5c2e' : isCurrent ? 'var(--color-brand-otimath-pure)' : 'var(--color-neutral-lighter)';
        return (
          <div key={n} className="flex flex-col items-center gap-y-nano">
            <div
              style={{ width: 14, height: 14, borderRadius: '50%', background: bg, transition: 'background 0.3s' }}
              aria-hidden
            />
            <span className="ds-caption text-neutral-dark" style={{ fontSize: '0.7rem' }}>
              M{n}: {labels[n - 1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
