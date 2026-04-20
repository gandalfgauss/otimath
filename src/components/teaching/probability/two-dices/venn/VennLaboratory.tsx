'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import {
  VennRegion, VennSetSpec, VennGeometry, MembershipMask, maskKey, masksEqual,
} from './types';
import {
  detectMembership, regionAnchor, circlesOverlap,
  defaultGeometry2Disjoint, defaultGeometry2Intersected,
  buildRegions2, VIEWBOX_WIDTH, VIEWBOX_HEIGHT,
} from './geometry';

/* ═══════════════════════════════════════════════════════════════
   VennLaboratory — laboratório construcionista de Venn (N=2 em v1).
   Arquitetura preparada para N=3 via tipos e geometria genéricos.
   11 sub-etapas sequenciais entre `predict` (confirmado) e `sumCompareVisual`.
   ═══════════════════════════════════════════════════════════════ */

type VennSubStep =
  | 'intro'
  | 'createIntersection'
  | 'clickIntersection'
  | 'fillIntersection'
  | 'identifyAMinusB'
  | 'fillAMinusB'
  | 'identifyBMinusA'
  | 'fillBMinusA'
  | 'markUnion'
  | 'unionCount'          // escreve n(A ∪ B) como soma das 3 regiões
  | 'countAFromDiagram'   // n(A) a partir das regiões A\B + A∩B
  | 'countBFromDiagram'   // n(B) a partir das regiões B\A + A∩B
  | 'sumAB'               // monta n(A) + n(B) = (...) + (...) via clique
  | 'doubleCountQuestion'
  | 'numericConclusion'   // mostra (21+9)+(9+3)−9 = 21+9+3 = 33
  | 'placeExpressions'    // clique-arma-expressão + clique-região
  | 'writeUnionFormula'   // preenche n(A∪B) = __ + __ + __ clicando regiões
  | 'conclusion';         // derivação algébrica com animações

type ExpressionId = 'AMinusB' | 'intersection' | 'BMinusA';

interface VennLaboratoryProps {
  eventADescription: string;
  eventBDescription: string;
  nA: number;
  nB: number;
  nI: number;
  nU: number;
  onComplete: () => void;
}

const COLOR_A = '#2f6fea';
const COLOR_B = '#22a155';
const COLOR_I = '#c79634';
const COLOR_U = '#7d3c98';
const FILL_A = 'rgba(47, 111, 234, 0.18)';
const FILL_B = 'rgba(34, 161, 85, 0.18)';

function toLowercaseArticle(description: string): string {
  return description.replace(/^A\s/, 'a ');
}

function shortPredicate(description: string): string {
  return description.replace(/^A\s+/, '').trim();
}

// ═══════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════
export function VennLaboratory({
  eventADescription, eventBDescription,
  nA, nB, nI, nU,
  onComplete,
}: Readonly<VennLaboratoryProps>) {
  const sets = useMemo<VennSetSpec[]>(() => [
    { label: 'A', description: eventADescription, cardinality: nA, color: COLOR_A, fill: FILL_A },
    { label: 'B', description: eventBDescription, cardinality: nB, color: COLOR_B, fill: FILL_B },
  ], [eventADescription, eventBDescription, nA, nB]);

  const regions = useMemo<VennRegion[]>(
    () => buildRegions2(nA, nB, nI),
    [nA, nB, nI],
  );

  const [step, setStep] = useState<VennSubStep>('intro');
  const [geometry, setGeometry] = useState<VennGeometry>(defaultGeometry2Disjoint);
  const [descriptionsOutside, setDescriptionsOutside] = useState(false);

  // Estados de cada sub-etapa
  const [intersectionClicked, setIntersectionClicked] = useState(false);
  const [intersectionValueDeposited, setIntersectionValueDeposited] = useState(false);
  const [aMinusBClicked, setAMinusBClicked] = useState(false);
  const [aMinusBFormulaAccepted, setAMinusBFormulaAccepted] = useState(false);
  const [aMinusBInput, setAMinusBInput] = useState('');
  const [aMinusBValueDeposited, setAMinusBValueDeposited] = useState(false);
  const [bMinusAClicked, setBMinusAClicked] = useState(false);
  const [bMinusAFormulaAccepted, setBMinusAFormulaAccepted] = useState(false);
  const [bMinusAInput, setBMinusAInput] = useState('');
  const [bMinusAValueDeposited, setBMinusAValueDeposited] = useState(false);
  const [unionSelection, setUnionSelection] = useState<Set<string>>(new Set());
  // Sub-etapas novas: escrita de operações a partir do diagrama
  const [unionCountInput, setUnionCountInput] = useState('');
  const [unionCountAccepted, setUnionCountAccepted] = useState(false);
  const [countAInput, setCountAInput] = useState('');
  const [countAAccepted, setCountAAccepted] = useState(false);
  const [countBInput, setCountBInput] = useState('');
  const [countBAccepted, setCountBAccepted] = useState(false);
  // sumAB: controla quais chips foram clicados (0 = nenhum, 1 = só n(A), 2 = ambos)
  const [sumABFilledA, setSumABFilledA] = useState(false);
  const [sumABFilledB, setSumABFilledB] = useState(false);
  // placeExpressions: expressão armada na 2ª linha + mapa de regiões preenchidas
  const [armedExpression, setArmedExpression] = useState<ExpressionId | null>(null);
  const [placedExpressions, setPlacedExpressions] = useState<Record<string, ExpressionId>>({});
  // writeUnionFormula: slots preenchidos em ordem conforme cliques no diagrama
  const [formulaSlots, setFormulaSlots] = useState<string[]>(['', '', '']);
  const [formulaUsedRegions, setFormulaUsedRegions] = useState<Set<string>>(new Set());
  // conclusion: fase interna da animação da derivação algébrica
  const [conclusionPhase, setConclusionPhase] = useState(0);
  const [flashingMask, setFlashingMask] = useState<MembershipMask | null>(null);
  const [doubleCountChoice, setDoubleCountChoice] = useState('');
  const [doubleCountConfirmed, setDoubleCountConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err' | 'none'; msg?: string }>({ type: 'none' });
  // Chip armado: qual cardinalidade o aluno selecionou no painel superior para depositar no diagrama
  const [armedChip, setArmedChip] = useState<'nI' | null>(null);

  const goTo = useCallback((next: VennSubStep) => {
    playSound('/sounds/nextChallenge.mp3');
    setFeedback({ type: 'none' });
    setStep(next);
  }, []);

  // --- Sub-etapa 2: createIntersection ---
  const moveCircleB = useCallback((direction: 'left' | 'right') => {
    setGeometry(prev => {
      const [A, B] = prev.circles;
      const delta = direction === 'left' ? -30 : 30;
      const newCx = Math.max(A.cx + A.r - 10, Math.min(760, B.cx + delta));
      return { ...prev, circles: [A, { ...B, cx: newCx }] };
    });
  }, []);

  const canConfirmIntersection = useMemo(() => {
    const [A, B] = geometry.circles;
    return circlesOverlap(A, B);
  }, [geometry]);

  const confirmIntersection = useCallback(() => {
    playSound('/sounds/correct.mp3');
    setGeometry(defaultGeometry2Intersected());
    setTimeout(() => setDescriptionsOutside(true), 400);
    setTimeout(() => goTo('clickIntersection'), 800);
  }, [goTo]);

  // --- Sub-etapa 3/5/7: clique em região ---
  const handleRegionClick = useCallback((mask: MembershipMask) => {
    if (step === 'clickIntersection') {
      if (masksEqual(mask, [true, true])) {
        setIntersectionClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok', msg: 'Correto!' });
        setTimeout(() => goTo('fillIntersection'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Essa não é a região de A ∩ B. Clique onde A e B se sobrepõem.' });
      }
      return;
    }
    if (step === 'fillIntersection') {
      if (!armedChip) {
        setFeedback({ type: 'err', msg: 'Primeiro clique no valor n(A ∩ B) no topo da tela.' });
        return;
      }
      if (masksEqual(mask, [true, true])) {
        setIntersectionValueDeposited(true);
        setArmedChip(null);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok', msg: 'Correto!' });
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'A ∩ B satisfaz A e B ao mesmo tempo.' });
      }
      return;
    }
    if (step === 'identifyAMinusB') {
      if (masksEqual(mask, [true, false])) {
        setAMinusBClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok' });
        setTimeout(() => goTo('fillAMinusB'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Clique na região em que ocorre A e NÃO ocorre B.' });
      }
      return;
    }
    if (step === 'identifyBMinusA') {
      if (masksEqual(mask, [false, true])) {
        setBMinusAClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok' });
        setTimeout(() => goTo('fillBMinusA'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Clique na região em que ocorre B e NÃO ocorre A.' });
      }
      return;
    }
    if (step === 'markUnion') {
      const k = maskKey(mask);
      // Só as 3 regiões internas podem ser toggadas; ignora a externa
      if (k === maskKey([false, false])) return;
      setUnionSelection(prev => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      });
      return;
    }
    if (step === 'placeExpressions') {
      const k = maskKey(mask);
      if (k === maskKey([false, false])) return;  // ignora região externa
      if (!armedExpression) {
        setFeedback({ type: 'err', msg: 'Primeiro clique em uma expressão acima para armá-la.' });
        return;
      }
      setPlacedExpressions(prev => ({ ...prev, [k]: armedExpression }));
      setArmedExpression(null);
      setFeedback({ type: 'none' });
      playSound('/sounds/correct.mp3');
      return;
    }
    if (step === 'writeUnionFormula') {
      const k = maskKey(mask);
      if (k === maskKey([false, false])) return;
      if (formulaUsedRegions.has(k)) return;  // região já usada
      let expr = '';
      if (k === maskKey([true, false])) expr = 'n(A − B)';
      else if (k === maskKey([true, true])) expr = 'n(A ∩ B)';
      else if (k === maskKey([false, true])) expr = 'n(B − A)';
      const nextSlot = formulaSlots.findIndex(s => s === '');
      if (nextSlot === -1) return;
      setFormulaSlots(prev => {
        const next = [...prev];
        next[nextSlot] = expr;
        return next;
      });
      setFormulaUsedRegions(prev => new Set(prev).add(k));
      playSound('/sounds/correct.mp3');
      return;
    }
  }, [step, armedChip, armedExpression, formulaSlots, formulaUsedRegions, goTo]);



  // --- Sub-etapa 6/8: fillAMinusB / fillBMinusA via dropdown ---
  const handleFormulaChoice = useCallback((choice: string, expected: string, onCorrect: () => void) => {
    if (choice === expected) {
      playSound('/sounds/correct.mp3');
      onCorrect();
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Não é essa operação. Pense: quantos elementos estão em A e ainda não foram contados na interseção?' });
    }
  }, []);

  // Valida a operação numérica digitada (ex: "30-9") na região A-B ou B-A.
  // Aceita espaços e os traços '-' e '−'.
  const matchesSubtraction = useCallback((input: string, minuend: number, subtrahend: number): boolean => {
    const normalized = input.replace(/\s+/g, '').replace(/−/g, '-');
    return normalized === `${minuend}-${subtrahend}`;
  }, []);

  const validateAMinusBArithmetic = useCallback(() => {
    if (matchesSubtraction(aMinusBInput, nA, nI)) {
      setAMinusBValueDeposited(true);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      setTimeout(() => goTo('identifyBMinusA'), 1200);
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Preencha com a operação correta em A − B no diagrama.' });
    }
  }, [aMinusBInput, nA, nI, matchesSubtraction, goTo]);

  const validateBMinusAArithmetic = useCallback(() => {
    if (matchesSubtraction(bMinusAInput, nB, nI)) {
      setBMinusAValueDeposited(true);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      setTimeout(() => goTo('markUnion'), 1200);
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Preencha com a operação correta em B − A no diagrama.' });
    }
  }, [bMinusAInput, nB, nI, matchesSubtraction, goTo]);

  // --- Validadores das operações escritas a partir do diagrama ---

  // Aceita soma de k números (em qualquer ordem) iguais aos termos esperados.
  const matchesSum = useCallback((input: string, expected: number[]): boolean => {
    const normalized = input.replace(/\s+/g, '');
    const parts = normalized.split('+').map(p => Number(p));
    if (parts.length !== expected.length) return false;
    if (parts.some(n => !Number.isFinite(n))) return false;
    const a = [...parts].sort((x, y) => x - y);
    const b = [...expected].sort((x, y) => x - y);
    return a.every((v, i) => v === b[i]);
  }, []);

  const validateUnionCount = useCallback(() => {
    const aMinusB = nA - nI;
    const bMinusA = nB - nI;
    if (matchesSum(unionCountInput, [aMinusB, nI, bMinusA])) {
      setUnionCountAccepted(true);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Casos em que ocorre apenas A, apenas B ou ambos.' });
    }
  }, [unionCountInput, nA, nB, nI, matchesSum]);

  const validateCountAFromDiagram = useCallback(() => {
    const aMinusB = nA - nI;
    if (matchesSum(countAInput, [aMinusB, nI])) {
      setCountAAccepted(true);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Some os valores das regiões do diagrama que compõem o evento A.' });
    }
  }, [countAInput, nA, nI, matchesSum]);

  // --- placeExpressions: clica expressão (arma) + clica região (deposita) ---
  const toggleArmedExpression = useCallback((expr: ExpressionId) => {
    setArmedExpression(prev => prev === expr ? null : expr);
    setFeedback({ type: 'none' });
  }, []);

  const confirmPlaceExpressions = useCallback(() => {
    const correctMap: Record<string, ExpressionId> = {
      [maskKey([true, false])]: 'AMinusB',
      [maskKey([true, true])]: 'intersection',
      [maskKey([false, true])]: 'BMinusA',
    };
    const keys = Object.keys(correctMap);
    const allPlaced = keys.every(k => placedExpressions[k]);
    const allCorrect = keys.every(k => placedExpressions[k] === correctMap[k]);
    if (allPlaced && allCorrect) {
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      setTimeout(() => goTo('writeUnionFormula'), 900);
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Verifique as regiões e sua expressão correspondente.' });
    }
  }, [placedExpressions, goTo]);

  const validateCountBFromDiagram = useCallback(() => {
    const bMinusA = nB - nI;
    if (matchesSum(countBInput, [bMinusA, nI])) {
      setCountBAccepted(true);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Some os valores das regiões do diagrama que compõem o evento B.' });
    }
  }, [countBInput, nB, nI, matchesSum]);

  // --- Sub-etapa 9: confirmação de markUnion ---
  const confirmMarkUnion = useCallback(() => {
    const expected = new Set([maskKey([true, false]), maskKey([true, true]), maskKey([false, true])]);
    const correct = expected.size === unionSelection.size &&
      [...expected].every(k => unionSelection.has(k));
    if (correct) {
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok' });
      setTimeout(() => goTo('unionCount'), 800);
    } else {
      playSound('/sounds/incorrect.mp3');
      if (unionSelection.size < 3) {
        setFeedback({ type: 'err', msg: 'Faltam regiões. A ∪ B inclui pares de A, pares de B ou de ambos.' });
      } else {
        setFeedback({ type: 'err', msg: 'Revise: A ∪ B é formada pelas 3 regiões internas.' });
      }
    }
  }, [unionSelection, goTo]);

  // Avança automaticamente quando os 3 slots de writeUnionFormula são preenchidos
  useEffect(() => {
    if (step !== 'writeUnionFormula') return;
    if (formulaSlots.every(s => s !== '')) {
      const set = new Set(formulaSlots);
      const expected = new Set(['n(A − B)', 'n(A ∩ B)', 'n(B − A)']);
      const ok = set.size === 3 && [...expected].every(e => set.has(e));
      if (ok) {
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok', msg: 'Correto!' });
        const t = setTimeout(() => goTo('conclusion'), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [step, formulaSlots, goTo]);

  // Destaque dinâmico no doubleCountQuestion: quando o aluno escolhe uma
  // região no dropdown, ela é destacada no diagrama. A cor do destaque
  // (RegionHighlight) já é dourada (#c79634, igual ao chip n(A ∩ B) do painel).
  useEffect(() => {
    if (step !== 'doubleCountQuestion') return;
    if (doubleCountChoice === 'A ∩ B') setFlashingMask([true, true]);
    else if (doubleCountChoice === 'A − B') setFlashingMask([true, false]);
    else if (doubleCountChoice === 'B − A') setFlashingMask([false, true]);
    else setFlashingMask(null);
    return () => setFlashingMask(null);
  }, [step, doubleCountChoice]);

  // Animação da conclusion: progride por fases com delays generosos e pisca
  // regiões. Cada fade-in CSS leva 500ms, e entre fases consecutivas há gap
  // de pelo menos 600ms para o aluno absorver cada passo.
  useEffect(() => {
    if (step !== 'conclusion') return;
    setConclusionPhase(0);
    setFlashingMask(null);
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Fase 1: aparece (ii) n(A-B) = n(A) - n(A∩B), piscando região A-B
    timers.push(setTimeout(() => { setFlashingMask([true, false]); setConclusionPhase(1); }, 1200));
    timers.push(setTimeout(() => { setFlashingMask(null); }, 3000));
    // Fase 2: aparece (iii) n(B-A) = n(B) - n(B∩A), piscando região B-A
    timers.push(setTimeout(() => { setFlashingMask([false, true]); setConclusionPhase(2); }, 4500));
    timers.push(setTimeout(() => { setFlashingMask(null); }, 6300));
    // Fase 3: texto "Substituindo as expressões..."
    timers.push(setTimeout(() => setConclusionPhase(3), 7800));
    // Fase 4: fórmula intermediária n(A∪B) = n(A) − n(A∩B) + n(A∩B) + n(B) − n(B∩A)
    timers.push(setTimeout(() => setConclusionPhase(4), 9600));
    // Fase 5: texto "Daí concluímos que:"
    timers.push(setTimeout(() => setConclusionPhase(5), 11400));
    // Fase 6: fórmula final n(A∪B) = n(A) + n(B) − n(A∩B)
    timers.push(setTimeout(() => setConclusionPhase(6), 13200));
    // Fase 7: texto "Substituindo os valores..."
    timers.push(setTimeout(() => setConclusionPhase(7), 15000));
    // Fase 8: verificação numérica + botão Continuar
    timers.push(setTimeout(() => setConclusionPhase(8), 16800));
    return () => {
      timers.forEach(t => clearTimeout(t));
      setFlashingMask(null);
    };
  }, [step]);

  // --- Sub-etapa 10: doubleCountQuestion ---
  const confirmDoubleCount = useCallback(() => {
    if (doubleCountChoice === 'A ∩ B') {
      playSound('/sounds/correct.mp3');
      setDoubleCountConfirmed(true);
      setFeedback({ type: 'ok' });
      setTimeout(() => goTo('numericConclusion'), 900);
    } else if (doubleCountChoice === '') {
      setFeedback({ type: 'err', msg: 'Escolha uma região.' });
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Pense: alguns pares pertencem a A e também a B. Quando você conta A e depois B, quais aparecem duas vezes?' });
    }
  }, [doubleCountChoice, goTo]);

  // Determina quais regiões têm cardinalidade revelada até o momento
  const revealed = useMemo(() => {
    const s = new Set<string>();
    if (intersectionValueDeposited) s.add(maskKey([true, true]));
    if (aMinusBValueDeposited) s.add(maskKey([true, false]));
    if (bMinusAValueDeposited) s.add(maskKey([false, true]));
    return s;
  }, [intersectionValueDeposited, aMinusBValueDeposited, bMinusAValueDeposited]);

  // Determina qual região está em destaque na etapa corrente
  const highlightedMask: MembershipMask | null = useMemo(() => {
    if (step === 'fillIntersection' || (step === 'clickIntersection' && intersectionClicked)) return [true, true];
    if (step === 'fillAMinusB' || (step === 'identifyAMinusB' && aMinusBClicked)) return [true, false];
    if (step === 'fillBMinusA' || (step === 'identifyBMinusA' && bMinusAClicked)) return [false, true];
    return null;
  }, [step, intersectionClicked, aMinusBClicked, bMinusAClicked]);

  const svgClickable =
    step === 'clickIntersection' ||
    step === 'fillIntersection' ||
    step === 'identifyAMinusB' ||
    step === 'identifyBMinusA' ||
    step === 'markUnion' ||
    step === 'placeExpressions' ||
    step === 'writeUnionFormula';

  return (
    <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[860px] mx-auto">
      <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
        Laboratório do diagrama de Venn
      </p>

      {/* ═══════ Painel de cardinalidades (referência permanente) ═══════ */}
      <CardinalityPanel
        nA={nA} nB={nB} nI={nI}
        nU={unionCountAccepted ? nU : undefined}
        armedChip={armedChip}
        armable={step === 'fillIntersection' && !intersectionValueDeposited ? 'nI' : null}
        onChipClick={(chip) => {
          if (chip === 'nI') {
            setArmedChip(prev => prev === 'nI' ? null : 'nI');
            setFeedback({ type: 'none' });
          }
        }}
      />

      {/* ═══════ Linha 2 (nova): expressões clicáveis n(A-B), n(A∩B), n(B-A) ═══════ */}
      {step === 'placeExpressions' && (
        <ExpressionChipsRow
          armed={armedExpression}
          placedExpressions={placedExpressions}
          onArm={toggleArmedExpression}
        />
      )}

      {/* ═══════ Linha 2 alt: slots de fórmula n(A∪B) = __ + __ + __ ═══════ */}
      {step === 'writeUnionFormula' && (
        <FormulaSlotsRow slots={formulaSlots} />
      )}

      {/* ═══════ Expressão n(A) + n(B) construída — persistente até a conclusão ═══════ */}
      {sumABFilledA && sumABFilledB && step !== 'conclusion' && step !== 'numericConclusion' && step !== 'placeExpressions' && step !== 'writeUnionFormula' && (
        <div
          className="flex items-center justify-center flex-wrap mb-micro"
          style={{
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            background: 'var(--color-brand-otimath-lightest)',
            border: '1px solid var(--color-brand-otimath-light)',
            maxWidth: 'fit-content',
            margin: '0 auto 12px',
          }}
        >
          <span className="ds-body-bold text-neutral-black">n(A) + n(B) =</span>
          <span style={{ color: '#1e40af', fontWeight: 700 }}>({countAInput})</span>
          <span className="ds-body-bold text-neutral-black">+</span>
          <span style={{ color: '#166534', fontWeight: 700 }}>({countBInput})</span>
        </div>
      )}

      {/* Keyframes da piscada (2×) aplicada à instrução ao mudar de sub-etapa */}
      <style>{`
        @keyframes vennFlashTwice {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .venn-flash-twice { animation: vennFlashTwice 0.4s ease-in-out 2; }
        @media (prefers-reduced-motion: reduce) {
          .venn-flash-twice { animation: none; }
        }
      `}</style>

      {/* ═══════ Instrução da sub-etapa corrente (pisca 2× ao mudar) ═══════ */}
      <div key={step} className="venn-flash-twice">
        <StepInstruction
          step={step}
          eventADescription={eventADescription}
          eventBDescription={eventBDescription}
          nA={nA} nB={nB} nI={nI}
        />
      </div>

      {/* ═══════ Legenda externa das regiões identificadas ═══════ */}
      <RegionLegend
        intersectionDescribed={intersectionClicked}
        aMinusBDescribed={aMinusBClicked}
        bMinusADescribed={bMinusAClicked}
        unionDescribed={
          step === 'markUnion' ||
          step === 'unionCount' ||
          step === 'countAFromDiagram' ||
          step === 'countBFromDiagram' ||
          step === 'sumAB' ||
          step === 'doubleCountQuestion' ||
          step === 'numericConclusion' ||
          step === 'placeExpressions' ||
          step === 'writeUnionFormula' ||
          step === 'conclusion'
        }
      />

      {/* ═══════ Feedback ═══════ */}
      {feedback.msg && (
        <p
          className="ds-small-bold text-center mt-nano"
          style={{
            color: feedback.type === 'ok'
              ? 'var(--color-feedback-success-dark)'
              : 'var(--color-feedback-error-dark)',
          }}
        >
          {feedback.msg}
        </p>
      )}

      {/* ═══════ SVG do diagrama (ocultado na 'intro' antes do "Começar") ═══════ */}
      {step !== 'intro' && (() => {
        // Qual região está aguardando digitação da operação aritmética
        let arithmeticMask: MembershipMask | null = null;
        let arithmeticValue = '';
        let arithmeticPlaceholder = '';
        let onArithmeticChange: ((v: string) => void) | undefined;
        let onArithmeticSubmit: (() => void) | undefined;
        if (step === 'fillAMinusB' && aMinusBFormulaAccepted && !aMinusBValueDeposited) {
          arithmeticMask = [true, false];
          arithmeticValue = aMinusBInput;
          arithmeticPlaceholder = 'operação';
          onArithmeticChange = setAMinusBInput;
          onArithmeticSubmit = validateAMinusBArithmetic;
        } else if (step === 'fillBMinusA' && bMinusAFormulaAccepted && !bMinusAValueDeposited) {
          arithmeticMask = [false, true];
          arithmeticValue = bMinusAInput;
          arithmeticPlaceholder = 'operação';
          onArithmeticChange = setBMinusAInput;
          onArithmeticSubmit = validateBMinusAArithmetic;
        }
        return (
          <VennSVG
            sets={sets}
            regions={regions}
            geometry={geometry}
            descriptionsOutside={descriptionsOutside}
            revealedCardinalities={revealed}
            highlightedMask={highlightedMask}
            selectedMasks={step === 'markUnion' ? unionSelection : new Set()}
            clickable={svgClickable}
            armedCursor={armedChip !== null || armedExpression !== null}
            onRegionClick={handleRegionClick}
            arithmeticMask={arithmeticMask}
            arithmeticValue={arithmeticValue}
            arithmeticPlaceholder={arithmeticPlaceholder}
            onArithmeticChange={onArithmeticChange}
            onArithmeticSubmit={onArithmeticSubmit}
            placedExpressions={
              // Mantém as expressões posicionadas visíveis da placeExpressions em diante
              (step === 'placeExpressions' ||
               step === 'writeUnionFormula' ||
               step === 'doubleCountQuestion' ||
               step === 'numericConclusion' ||
               step === 'conclusion')
                ? placedExpressions
                : undefined
            }
            flashingMask={flashingMask}
            flashUnionRegions={
              step === 'numericConclusion' ||
              (step === 'conclusion' && conclusionPhase >= 6)
            }
          />
        );
      })()}

      {/* ═══════ Controles específicos de cada sub-etapa ═══════ */}
      <StepControls
        step={step}
        canConfirmIntersection={canConfirmIntersection}
        moveB={moveCircleB}
        confirmIntersection={confirmIntersection}
        goTo={goTo}
        intersectionValueDeposited={intersectionValueDeposited}
        nA={nA} nB={nB} nI={nI} nU={nU}
        aMinusBFormulaAccepted={aMinusBFormulaAccepted}
        aMinusBValueDeposited={aMinusBValueDeposited}
        onAMinusBFormula={(choice) =>
          handleFormulaChoice(choice, 'n(A) − n(A ∩ B)', () => {
            setAMinusBFormulaAccepted(true);
            setFeedback({ type: 'ok', msg: 'Correto! Agora digite na região A − B a operação para contar os casos em que A ocorre e B não ocorre.' });
          })
        }
        validateAMinusBArithmetic={validateAMinusBArithmetic}
        bMinusAFormulaAccepted={bMinusAFormulaAccepted}
        bMinusAValueDeposited={bMinusAValueDeposited}
        onBMinusAFormula={(choice) =>
          handleFormulaChoice(choice, 'n(B) − n(A ∩ B)', () => {
            setBMinusAFormulaAccepted(true);
            setFeedback({ type: 'ok', msg: 'Correto! Agora digite na região B − A a operação para contar os casos em que B ocorre e A não ocorre.' });
          })
        }
        validateBMinusAArithmetic={validateBMinusAArithmetic}
        unionSelectionSize={unionSelection.size}
        confirmMarkUnion={confirmMarkUnion}
        unionCountInput={unionCountInput}
        setUnionCountInput={setUnionCountInput}
        unionCountAccepted={unionCountAccepted}
        validateUnionCount={validateUnionCount}
        countAInput={countAInput}
        setCountAInput={setCountAInput}
        countAAccepted={countAAccepted}
        validateCountAFromDiagram={validateCountAFromDiagram}
        countBInput={countBInput}
        setCountBInput={setCountBInput}
        countBAccepted={countBAccepted}
        validateCountBFromDiagram={validateCountBFromDiagram}
        sumABFilledA={sumABFilledA}
        sumABFilledB={sumABFilledB}
        placedExpressionsCount={Object.keys(placedExpressions).length}
        confirmPlaceExpressions={confirmPlaceExpressions}
        formulaSlots={formulaSlots}
        conclusionPhase={conclusionPhase}
        onSumABClickA={() => { setSumABFilledA(true); playSound('/sounds/correct.mp3'); }}
        onSumABClickB={() => { setSumABFilledB(true); playSound('/sounds/correct.mp3'); }}
        doubleCountChoice={doubleCountChoice}
        setDoubleCountChoice={setDoubleCountChoice}
        doubleCountConfirmed={doubleCountConfirmed}
        confirmDoubleCount={confirmDoubleCount}
        onComplete={onComplete}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: SVG do diagrama
// ═══════════════════════════════════════════════════════════════
interface VennSVGProps {
  sets: VennSetSpec[];
  regions: VennRegion[];
  geometry: VennGeometry;
  descriptionsOutside: boolean;
  revealedCardinalities: Set<string>;
  highlightedMask: MembershipMask | null;
  selectedMasks: Set<string>;
  clickable: boolean;
  armedCursor: boolean;
  onRegionClick: (mask: MembershipMask) => void;
  arithmeticMask: MembershipMask | null;
  arithmeticValue: string;
  arithmeticPlaceholder: string;
  onArithmeticChange?: (v: string) => void;
  onArithmeticSubmit?: () => void;
  placedExpressions?: Record<string, ExpressionId>;
  flashingMask?: MembershipMask | null;
  flashUnionRegions?: boolean;
}

function VennSVG({
  sets, regions, geometry,
  descriptionsOutside, revealedCardinalities,
  highlightedMask, selectedMasks,
  clickable, armedCursor, onRegionClick,
  arithmeticMask, arithmeticValue, arithmeticPlaceholder,
  onArithmeticChange, onArithmeticSubmit,
  placedExpressions, flashingMask, flashUnionRegions,
}: Readonly<VennSVGProps>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, B] = geometry.circles;
  const [setA, setB] = sets;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!clickable || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const mask = detectMembership(svgPt.x, svgPt.y, geometry.circles);
    onRegionClick(mask);
  };

  const regionByMask = (mask: MembershipMask): VennRegion | undefined =>
    regions.find(r => masksEqual(r.mask, mask));

  // Renderiza APENAS o número da cardinalidade no centro da região
  // (sem rótulo "n(...)" — a semântica vai na legenda externa).
  const renderRegionCardinality = (mask: MembershipMask) => {
    const region = regionByMask(mask);
    if (!region) return null;
    const key = maskKey(mask);
    if (!revealedCardinalities.has(key)) return null;
    const anchor = regionAnchor(mask, geometry.circles);
    const isHighlighted = highlightedMask && masksEqual(highlightedMask, mask);

    return (
      <g key={key} pointerEvents="none">
        <text
          x={anchor.x} y={anchor.y - 2}
          textAnchor="middle" fontSize="28" fontWeight="700"
          fill={isHighlighted ? 'var(--color-feedback-success-dark)' : '#222'}
          style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' }}
        >
          {region.cardinality}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full mt-micro" style={{ maxWidth: VIEWBOX_WIDTH, margin: '0 auto' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${geometry.viewBoxWidth} ${geometry.viewBoxHeight}`}
        width="100%"
        style={{
          display: 'block',
          cursor: armedCursor ? 'copy' : (clickable ? 'pointer' : 'default'),
          userSelect: 'none',
        }}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        aria-label={clickable ? 'Clique em uma região do diagrama' : 'Diagrama de Venn'}
      >
        {/* Moldura Ω */}
        <rect
          x={10} y={10}
          width={geometry.viewBoxWidth - 20} height={geometry.viewBoxHeight - 20}
          fill="var(--color-neutral-lightest, #f8f8f8)"
          stroke="#bbb" strokeWidth={1.5}
          rx={8}
        />
        <text x={30} y={32} fontSize="14" fontWeight="600" fill="#666">Ω</text>

        {/* Rótulos externos (após reposicionamento) — alinhados às bordas
            laterais opostas dos círculos para evitar sobreposição quando os
            centros estão próximos. */}
        {descriptionsOutside && (
          <>
            <text
              x={A.cx - A.r} y={A.cy - A.r - 20}
              textAnchor="start" fontSize="14" fontWeight="700" fill={setA.color}
            >
              A: {toLowercaseArticle(setA.description)}
            </text>
            <text
              x={B.cx + B.r} y={B.cy - B.r - 20}
              textAnchor="end" fontSize="14" fontWeight="700" fill={setB.color}
            >
              B: {toLowercaseArticle(setB.description)}
            </text>
          </>
        )}

        {/* Círculos com preenchimento translúcido */}
        <circle
          cx={A.cx} cy={A.cy} r={A.r}
          fill={setA.fill}
          stroke={setA.color} strokeWidth={2.5}
          style={{ transition: 'cx 0.4s, cy 0.4s, r 0.4s' }}
        />
        <circle
          cx={B.cx} cy={B.cy} r={B.r}
          fill={setB.fill}
          stroke={setB.color} strokeWidth={2.5}
          style={{ transition: 'cx 0.4s, cy 0.4s, r 0.4s' }}
        />

        {/* Destaque da região em foco (após clique validado) */}
        {highlightedMask && (
          <RegionHighlight mask={highlightedMask} A={A} B={B} />
        )}

        {/* Destaque das regiões marcadas em markUnion */}
        {[...selectedMasks].map(k => {
          const region = regions.find(r => maskKey(r.mask) === k);
          if (!region) return null;
          return <RegionHighlight key={k} mask={region.mask} A={A} B={B} selected />;
        })}

        {/* Descrições verbais DENTRO dos círculos (antes do reposicionamento) */}
        {!descriptionsOutside && (
          <>
            <foreignObject
              x={A.cx - A.r * 0.75} y={A.cy - 22}
              width={A.r * 1.5} height={50}
              style={{ pointerEvents: 'none' }}
            >
              <div
                
                style={{
                  textAlign: 'center', fontSize: 13, color: '#222',
                  lineHeight: 1.25, fontWeight: 500,
                }}
              >
                <strong style={{ color: setA.color }}>A:</strong>{' '}
                {shortPredicate(setA.description)}
              </div>
            </foreignObject>
            <foreignObject
              x={B.cx - B.r * 0.75} y={B.cy - 22}
              width={B.r * 1.5} height={50}
              style={{ pointerEvents: 'none' }}
            >
              <div
                
                style={{
                  textAlign: 'center', fontSize: 13, color: '#222',
                  lineHeight: 1.25, fontWeight: 500,
                }}
              >
                <strong style={{ color: setB.color }}>B:</strong>{' '}
                {shortPredicate(setB.description)}
              </div>
            </foreignObject>
          </>
        )}

        {/* Cardinalidades reveladas nas regiões correspondentes */}
        {renderRegionCardinality([true, true])}
        {renderRegionCardinality([true, false])}
        {renderRegionCardinality([false, true])}

        {/* Expressões posicionadas pelo aluno (sub-etapa placeExpressions) */}
        {placedExpressions && (Object.keys(placedExpressions) as string[]).map(k => {
          const mask: MembershipMask = k.split('').map(c => c === '1');
          const anchor = regionAnchor(mask, geometry.circles);
          const id = placedExpressions[k];
          const label = id === 'AMinusB' ? 'n(A − B)' : id === 'intersection' ? 'n(A ∩ B)' : 'n(B − A)';
          const color = id === 'AMinusB' ? '#1e40af' : id === 'intersection' ? COLOR_I : '#166534';
          return (
            <text
              key={`expr-${k}`}
              x={anchor.x} y={anchor.y + 25}
              textAnchor="middle" fontSize="14" fontWeight="700" fill={color}
              style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinejoin: 'round' }}
              pointerEvents="none"
            >
              {label}
            </text>
          );
        })}

        {/* Flash de região (para conclusion animada) */}
        {flashingMask && (() => {
          const [Afl, Bfl] = geometry.circles;
          return <RegionHighlight mask={flashingMask} A={Afl} B={Bfl} />;
        })()}

        {/* Overlay de união piscando: 3 regiões em suas cores respectivas,
            sincronizadas para reforçar que A∪B = A\B ∪ A∩B ∪ B\A */}
        {flashUnionRegions && (
          <>
            <style>{`
              @keyframes unionPulse {
                0%, 100% { opacity: 0.9; }
                50% { opacity: 0.15; }
              }
              .venn-union-pulse { animation: unionPulse 1.4s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) {
                .venn-union-pulse { animation: none; opacity: 0.5; }
              }
            `}</style>
            <g className="venn-union-pulse" pointerEvents="none">
              {/* A\B: azul escuro */}
              <defs>
                <mask id="unionMaskAOnly">
                  <rect x={0} y={0} width={geometry.viewBoxWidth} height={geometry.viewBoxHeight} fill="white" />
                  <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
                </mask>
                <mask id="unionMaskBOnly">
                  <rect x={0} y={0} width={geometry.viewBoxWidth} height={geometry.viewBoxHeight} fill="white" />
                  <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
                </mask>
                <clipPath id="unionClipIntersect">
                  <circle cx={B.cx} cy={B.cy} r={B.r} />
                </clipPath>
              </defs>
              <circle
                cx={A.cx} cy={A.cy} r={A.r}
                fill="rgba(30, 64, 175, 0.45)"
                mask="url(#unionMaskAOnly)"
              />
              <circle
                cx={A.cx} cy={A.cy} r={A.r}
                fill="rgba(199, 150, 52, 0.55)"
                clipPath="url(#unionClipIntersect)"
              />
              <circle
                cx={B.cx} cy={B.cy} r={B.r}
                fill="rgba(22, 101, 52, 0.45)"
                mask="url(#unionMaskBOnly)"
              />
            </g>
          </>
        )}

        {/* Input aritmético dentro da região pendente (A-B ou B-A) */}
        {arithmeticMask && (() => {
          const anchor = regionAnchor(arithmeticMask, geometry.circles);
          const boxW = 120;
          const boxH = 34;
          return (
            <foreignObject
              x={anchor.x - boxW / 2}
              y={anchor.y - boxH / 2}
              width={boxW}
              height={boxH}
            >
              <input

                type="text"
                inputMode="numeric"
                autoFocus
                value={arithmeticValue}
                onChange={(e) => onArithmeticChange?.(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onArithmeticSubmit?.(); }}
                placeholder={arithmeticPlaceholder}
                aria-label="Digite a operação"
                style={{
                  width: '100%', height: '100%', boxSizing: 'border-box',
                  textAlign: 'center',
                  fontSize: 14, fontWeight: 700,
                  border: '2px solid var(--color-brand-otimath-pure)',
                  borderRadius: 6,
                  background: 'var(--color-neutral-white)',
                  outline: 'none',
                  color: '#222',
                }}
              />
            </foreignObject>
          );
        })()}
      </svg>
    </div>
  );
}

// Destaque colorido de uma região (retângulo translúcido em cima)
function RegionHighlight({
  mask, A, B, selected,
}: {
  mask: MembershipMask; A: { cx: number; cy: number; r: number }; B: { cx: number; cy: number; r: number };
  selected?: boolean;
}) {
  const color = selected ? 'rgba(199, 150, 52, 0.35)' : 'rgba(199, 150, 52, 0.5)';
  if (masksEqual(mask, [true, true])) {
    const id = 'clipIntersect';
    return (
      <>
        <defs>
          <clipPath id={id}>
            <circle cx={B.cx} cy={B.cy} r={B.r} />
          </clipPath>
        </defs>
        <circle
          cx={A.cx} cy={A.cy} r={A.r}
          fill={color} clipPath={`url(#${id})`}
          pointerEvents="none"
        />
      </>
    );
  }
  if (masksEqual(mask, [true, false])) {
    const id = 'clipAOnly';
    return (
      <>
        <defs>
          <mask id={id}>
            <rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="white" />
            <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
          </mask>
        </defs>
        <circle
          cx={A.cx} cy={A.cy} r={A.r}
          fill={color} mask={`url(#${id})`}
          pointerEvents="none"
        />
      </>
    );
  }
  if (masksEqual(mask, [false, true])) {
    const id = 'clipBOnly';
    return (
      <>
        <defs>
          <mask id={id}>
            <rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="white" />
            <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
          </mask>
        </defs>
        <circle
          cx={B.cx} cy={B.cy} r={B.r}
          fill={color} mask={`url(#${id})`}
          pointerEvents="none"
        />
      </>
    );
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Componente: instruções por sub-etapa
// ═══════════════════════════════════════════════════════════════
function StepInstruction({
  step, eventADescription, eventBDescription, nA, nB, nI,
}: {
  step: VennSubStep; eventADescription: string; eventBDescription: string;
  nA: number; nB: number; nI: number;
}) {
  if (step === 'intro') {
    return (
      <>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          Neste laboratório, você irá construir e analisar dois eventos no lançamento de dois dados:
        </p>
        <ul className="mt-nano mb-micro" style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
          <li className="ds-body text-neutral-black" style={{ marginBottom: 4 }}>
            <strong>Evento A:</strong> {toLowercaseArticle(eventADescription)}
          </li>
          <li className="ds-body text-neutral-black">
            <strong>Evento B:</strong> {toLowercaseArticle(eventBDescription)}
          </li>
        </ul>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          A partir desses eventos, observe:
        </p>
        <ul className="mt-nano mb-micro" style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
          <li className="ds-body text-neutral-black" style={{ marginBottom: 4 }}>quais resultados pertencem ao evento A;</li>
          <li className="ds-body text-neutral-black" style={{ marginBottom: 4 }}>quais pertencem ao evento B;</li>
          <li className="ds-body text-neutral-black" style={{ marginBottom: 4 }}>quais resultados pertencem aos <strong>dois eventos ao mesmo tempo</strong> (interseção);</li>
          <li className="ds-body text-neutral-black">e quais pertencem a <strong>pelo menos um dos eventos</strong> (união).</li>
        </ul>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          Ao final, você deverá identificar uma <strong>relação entre as quantidades</strong>:
        </p>
        <p className="ds-body-bold text-center mt-micro" style={{ color: 'var(--color-brand-otimath-dark)', fontSize: '1.1rem' }}>
          n(A ∪ B), n(A), n(B) e n(A ∩ B)
        </p>
      </>
    );
  }

  if (step === 'createIntersection') {
    return (
      <>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          Temos dois conjuntos A e B representados por diagramas. Eles estão separados — nenhum elemento em comum.
        </p>
        <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify', fontStyle: 'italic' }}>
          Como você deveria dispor os diagramas A e B para que seja possível representar também <strong>A ∩ B</strong>, ou seja, os elementos que ocorrem em A e em B <strong>ao mesmo tempo</strong>?
        </p>
        <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
          Aproxime os diagramas abaixo até que isso seja possível.
        </p>
      </>
    );
  }

  if (step === 'clickIntersection') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        <strong>Clique na região</strong> que representa <strong>A ∩ B</strong> — onde os elementos pertencem a A e a B ao mesmo tempo.
      </p>
    );
  }

  if (step === 'fillIntersection') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Agora clique no valor <strong>n(A ∩ B)</strong> no topo da tela e, em seguida, clique na região correspondente no diagrama para depositá-lo.
      </p>
    );
  }

  if (step === 'identifyAMinusB') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Sabendo que <strong>n(A) = {nA}</strong>, em quantos pares ocorre A e <strong>não</strong> ocorre B?<br />
        <strong>Clique na região em que ocorre A − B</strong> (A menos B): casos em que ocorre A e não ocorre B.
      </p>
    );
  }

  if (step === 'fillAMinusB') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Qual operação dá <strong>n(A − B)</strong>?
      </p>
    );
  }

  if (step === 'identifyBMinusA') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Analogamente: sabendo que <strong>n(B) = {nB}</strong>, em quantos pares ocorre B e <strong>não</strong> ocorre A?<br />
        <strong>Clique na região em que ocorre B − A</strong> (B menos A): casos em que ocorre B e não ocorre A.
      </p>
    );
  }

  if (step === 'fillBMinusA') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Qual operação dá <strong>n(B − A)</strong>?
      </p>
    );
  }

  if (step === 'markUnion') {
    return (
      <>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          A <strong>união</strong> de A e B, escrita <strong>A ∪ B</strong>, é o conjunto dos pares que pertencem a <strong>pelo menos um</strong> dos conjuntos — ou seja, pertencem a A, a B, ou a ambos.
        </p>
        <p className="ds-body text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
          <strong>Clique em todas as regiões</strong> que fazem parte de A ∪ B e depois em <em>Confirmar seleção</em>.
        </p>
      </>
    );
  }

  if (step === 'unionCount') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Então, quantos casos são favoráveis ao evento <strong>A ou B</strong>? Escreva em forma de operação somando os valores das regiões do diagrama.
      </p>
    );
  }

  if (step === 'countAFromDiagram') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Observando apenas o que está no diagrama, escreva a operação que calcule <strong>n(A)</strong>.
      </p>
    );
  }

  if (step === 'countBFromDiagram') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Analogamente, como você calcularia <strong>n(B)</strong> observando o diagrama?
      </p>
    );
  }

  if (step === 'sumAB') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Agora, para escrever <strong>n(A) + n(B)</strong>, clique nas expressões que você acabou de construir — primeiro a de n(A) e depois a de n(B).
      </p>
    );
  }

  if (step === 'doubleCountQuestion') {
    return (
      <>
        <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
          Imagine que você contou cada caso favorável de A e em seguida cada caso favorável a B.
        </p>
        <p className="ds-body-bold text-neutral-black mt-nano" style={{ textAlign: 'justify' }}>
          Qual região você contou <em>duas vezes</em>?
        </p>
      </>
    );
  }

  if (step === 'numericConclusion') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Como a região <strong>A ∩ B</strong> foi contada <strong>duas vezes</strong> ao somar n(A) + n(B), precisamos <strong>subtrair n(A ∩ B)</strong> uma vez para obter n(A ∪ B).
      </p>
    );
  }

  if (step === 'placeExpressions') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Clique em uma das expressões acima para armá-la e, em seguida, clique na <strong>região correspondente</strong> do diagrama. Repita para as três expressões e depois clique em <em>Confirmar</em>.
      </p>
    );
  }

  if (step === 'writeUnionFormula') {
    return (
      <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
        Note pelo diagrama que <strong>n(A ∪ B)</strong> é a soma das três regiões internas. Clique em cada região para preencher os três espaços acima.
      </p>
    );
  }

  if (step === 'conclusion') {
    return (
      <p className="ds-body text-neutral-black text-center" style={{ fontStyle: 'italic' }}>
        Observando as três regiões internas e suas cardinalidades, podemos construir a relação:
      </p>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// Componente: controles por sub-etapa
// ═══════════════════════════════════════════════════════════════
interface StepControlsProps {
  step: VennSubStep;
  canConfirmIntersection: boolean;
  moveB: (dir: 'left' | 'right') => void;
  confirmIntersection: () => void;
  goTo: (s: VennSubStep) => void;
  intersectionValueDeposited: boolean;
  nA: number; nB: number; nI: number; nU: number;
  aMinusBFormulaAccepted: boolean;
  aMinusBValueDeposited: boolean;
  onAMinusBFormula: (choice: string) => void;
  validateAMinusBArithmetic: () => void;
  bMinusAFormulaAccepted: boolean;
  bMinusAValueDeposited: boolean;
  onBMinusAFormula: (choice: string) => void;
  validateBMinusAArithmetic: () => void;
  unionSelectionSize: number;
  confirmMarkUnion: () => void;
  unionCountInput: string;
  setUnionCountInput: (s: string) => void;
  unionCountAccepted: boolean;
  validateUnionCount: () => void;
  countAInput: string;
  setCountAInput: (s: string) => void;
  countAAccepted: boolean;
  validateCountAFromDiagram: () => void;
  countBInput: string;
  setCountBInput: (s: string) => void;
  countBAccepted: boolean;
  validateCountBFromDiagram: () => void;
  sumABFilledA: boolean;
  sumABFilledB: boolean;
  placedExpressionsCount: number;
  confirmPlaceExpressions: () => void;
  formulaSlots: string[];
  conclusionPhase: number;
  onSumABClickA: () => void;
  onSumABClickB: () => void;
  doubleCountChoice: string;
  setDoubleCountChoice: (s: string) => void;
  doubleCountConfirmed: boolean;
  confirmDoubleCount: () => void;
  onComplete: () => void;
}

function StepControls(props: Readonly<StepControlsProps>) {
  const {
    step, canConfirmIntersection, moveB, confirmIntersection, goTo,
    intersectionValueDeposited,
    nA, nB, nI, nU,
    aMinusBFormulaAccepted, aMinusBValueDeposited, onAMinusBFormula, validateAMinusBArithmetic,
    bMinusAFormulaAccepted, bMinusAValueDeposited, onBMinusAFormula, validateBMinusAArithmetic,
    unionSelectionSize, confirmMarkUnion,
    unionCountInput, setUnionCountInput, unionCountAccepted, validateUnionCount,
    countAInput, setCountAInput, countAAccepted, validateCountAFromDiagram,
    countBInput, setCountBInput, countBAccepted, validateCountBFromDiagram,
    sumABFilledA, sumABFilledB, onSumABClickA, onSumABClickB,
    placedExpressionsCount, confirmPlaceExpressions, formulaSlots,
    conclusionPhase,
    doubleCountChoice, setDoubleCountChoice, doubleCountConfirmed, confirmDoubleCount,
    onComplete,
  } = props;

  if (step === 'intro') {
    return (
      <div className="flex justify-center mt-macro">
        <Button style="primary" size="small" onClick={() => goTo('createIntersection')}>
          Começar
        </Button>
      </div>
    );
  }

  if (step === 'createIntersection') {
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <div className="flex gap-x-xxxs">
          <Button style="secondary" size="small" onClick={() => moveB('left')}>◄ Aproximar B</Button>
          <Button style="secondary" size="small" onClick={() => moveB('right')}>Afastar B ►</Button>
        </div>
        <Button
          style="primary" size="small"
          onClick={confirmIntersection}
          disabled={!canConfirmIntersection}
        >
          Confirmar representação
        </Button>
      </div>
    );
  }

  if (step === 'fillIntersection') {
    if (!intersectionValueDeposited) return null;
    return (
      <div className="flex justify-center mt-micro">
        <Button style="primary" size="small" onClick={() => goTo('identifyAMinusB')}>
          Continuar
        </Button>
      </div>
    );
  }

  if (step === 'fillAMinusB') {
    const options = [
      'n(A) + n(A ∩ B)',
      'n(A) − n(A ∩ B)',
      'n(A) + n(B)',
      'n(B) − n(A ∩ B)',
    ];
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <FormulaDropdown
          options={options}
          onChoice={onAMinusBFormula}
          disabled={aMinusBFormulaAccepted}
          computedDisplay={aMinusBFormulaAccepted ? '✓ n(A) − n(A ∩ B)' : null}
        />
        {aMinusBFormulaAccepted && !aMinusBValueDeposited && (
          <Button style="primary" size="small" onClick={validateAMinusBArithmetic}>
            Conferir operação
          </Button>
        )}
      </div>
    );
  }

  if (step === 'fillBMinusA') {
    const options = [
      'n(B) + n(A ∩ B)',
      'n(B) − n(A ∩ B)',
      'n(A) + n(B)',
      'n(A) − n(A ∩ B)',
    ];
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <FormulaDropdown
          options={options}
          onChoice={onBMinusAFormula}
          disabled={bMinusAFormulaAccepted}
          computedDisplay={bMinusAFormulaAccepted ? '✓ n(B) − n(A ∩ B)' : null}
        />
        {bMinusAFormulaAccepted && !bMinusAValueDeposited && (
          <Button style="primary" size="small" onClick={validateBMinusAArithmetic}>
            Conferir operação
          </Button>
        )}
      </div>
    );
  }

  if (step === 'markUnion') {
    return (
      <div className="flex justify-center mt-micro">
        <Button
          style="primary" size="small"
          onClick={confirmMarkUnion}
          disabled={unionSelectionSize === 0}
        >
          Confirmar seleção ({unionSelectionSize} {unionSelectionSize === 1 ? 'região' : 'regiões'})
        </Button>
      </div>
    );
  }

  if (step === 'unionCount') {
    const aMinusB = nA - nI;
    const bMinusA = nB - nI;
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <div className="flex items-center gap-x-xxxs">
          <span className="ds-body-bold text-neutral-black">n(A ∪ B) =</span>
          <ExpressionInput
            value={unionCountInput}
            onChange={setUnionCountInput}
            onSubmit={validateUnionCount}
            disabled={unionCountAccepted}
            placeholder="operação"
          />
        </div>
        {!unionCountAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateUnionCount} disabled={!unionCountInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              ✓ n(A ∪ B) = {unionCountInput} = <strong>{aMinusB + nI + bMinusA}</strong>
            </p>
            <Button style="primary" size="small" onClick={() => goTo('countAFromDiagram')}>
              Continuar
            </Button>
          </>
        )}
      </div>
    );
  }

  if (step === 'countAFromDiagram') {
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <div className="flex items-center gap-x-xxxs">
          <span className="ds-body-bold text-neutral-black">n(A) =</span>
          <ExpressionInput
            value={countAInput}
            onChange={setCountAInput}
            onSubmit={validateCountAFromDiagram}
            disabled={countAAccepted}
            placeholder="operação"
          />
        </div>
        {!countAAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateCountAFromDiagram} disabled={!countAInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              ✓ n(A) = {countAInput} = <strong>{nA}</strong>
            </p>
            <Button style="primary" size="small" onClick={() => goTo('countBFromDiagram')}>
              Continuar
            </Button>
          </>
        )}
      </div>
    );
  }

  if (step === 'countBFromDiagram') {
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <div className="flex items-center gap-x-xxxs">
          <span className="ds-body-bold text-neutral-black">n(B) =</span>
          <ExpressionInput
            value={countBInput}
            onChange={setCountBInput}
            onSubmit={validateCountBFromDiagram}
            disabled={countBAccepted}
            placeholder="operação"
          />
        </div>
        {!countBAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateCountBFromDiagram} disabled={!countBInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
              ✓ n(B) = {countBInput} = <strong>{nB}</strong>
            </p>
            <Button style="primary" size="small" onClick={() => goTo('sumAB')}>
              Continuar
            </Button>
          </>
        )}
      </div>
    );
  }

  if (step === 'sumAB') {
    const chipStyle: React.CSSProperties = {
      padding: '6px 12px',
      borderRadius: 8,
      border: '2px solid var(--color-brand-otimath-pure)',
      background: 'var(--color-neutral-white)',
      color: 'var(--color-brand-otimath-dark)',
      fontWeight: 700,
      cursor: 'pointer',
    };
    const chipUsed: React.CSSProperties = {
      ...chipStyle,
      opacity: 0.5,
      cursor: 'default',
    };
    return (
      <div className="flex flex-col items-center gap-y-micro mt-micro">
        <div className="flex items-center gap-x-micro flex-wrap justify-center">
          <span className="ds-body-bold text-neutral-black">Expressões disponíveis:</span>
          <button
            type="button"
            onClick={() => { if (!sumABFilledA) onSumABClickA(); }}
            style={sumABFilledA ? chipUsed : chipStyle}
            disabled={sumABFilledA}
            aria-label={`Inserir ${countAInput} em n(A)`}
          >
            {countAInput}
          </button>
          <button
            type="button"
            onClick={() => { if (!sumABFilledB) onSumABClickB(); }}
            style={sumABFilledB ? chipUsed : chipStyle}
            disabled={sumABFilledB}
            aria-label={`Inserir ${countBInput} em n(B)`}
          >
            {countBInput}
          </button>
        </div>
        <div
          className="flex items-center flex-wrap justify-center"
          style={{
            gap: 4,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--color-brand-otimath-lightest)',
            border: '1px solid var(--color-brand-otimath-light)',
          }}
        >
          <span className="ds-body-bold text-neutral-black">n(A) + n(B) =</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 6,
            border: `2px dashed ${sumABFilledA ? 'transparent' : 'var(--color-neutral-dark)'}`,
            minWidth: 70, minHeight: 28, textAlign: 'center',
            color: sumABFilledA ? '#1e40af' : '#999',
            fontWeight: 700,
          }}>
            {sumABFilledA ? `(${countAInput})` : '...'}
          </span>
          <span className="ds-body-bold text-neutral-black">+</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 6,
            border: `2px dashed ${sumABFilledB ? 'transparent' : 'var(--color-neutral-dark)'}`,
            minWidth: 70, minHeight: 28, textAlign: 'center',
            color: sumABFilledB ? '#166534' : '#999',
            fontWeight: 700,
          }}>
            {sumABFilledB ? `(${countBInput})` : '...'}
          </span>
        </div>
        {sumABFilledA && sumABFilledB && (
          <Button style="primary" size="small" onClick={() => goTo('doubleCountQuestion')}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  if (step === 'placeExpressions') {
    return (
      <div className="flex justify-center mt-micro">
        <Button
          style="primary" size="small"
          onClick={confirmPlaceExpressions}
          disabled={placedExpressionsCount < 3}
        >
          Confirmar ({placedExpressionsCount}/3)
        </Button>
      </div>
    );
  }

  if (step === 'writeUnionFormula') {
    const filled = formulaSlots.filter(s => s !== '').length;
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <p className="ds-small text-neutral-dark" style={{ fontStyle: 'italic' }}>
          Regiões preenchidas: {filled}/3
        </p>
      </div>
    );
  }

  if (step === 'doubleCountQuestion') {
    const options = ['A', 'B', 'A − B', 'B − A', 'A ∩ B'];
    return (
      <div className="flex flex-col items-center gap-y-nano mt-micro">
        <select
          value={doubleCountChoice}
          onChange={e => setDoubleCountChoice(e.target.value)}
          disabled={doubleCountConfirmed}
          className="ds-body"
          style={{
            padding: '10px 16px', borderRadius: 8,
            border: '2px solid var(--color-neutral-lighter)',
            minWidth: 220, background: 'var(--color-neutral-white)',
          }}
        >
          <option value="">Escolha uma região</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {!doubleCountConfirmed && (
          <Button style="primary" size="small" onClick={confirmDoubleCount}>
            Conferir
          </Button>
        )}
      </div>
    );
  }

  if (step === 'numericConclusion') {
    const aMinusB = nA - nI;
    const bMinusA = nB - nI;
    return (
      <div className="mt-micro">
        <div
          className="rounded-md p-micro"
          style={{
            background: 'var(--color-brand-otimath-lightest)',
            border: '2px solid var(--color-brand-otimath-pure)',
          }}
        >
          <p className="ds-body-bold text-center mb-nano" style={{ color: 'var(--color-brand-otimath-dark)' }}>
            Logo:
          </p>
          <p className="ds-body-bold text-center text-neutral-black">
            n(A ∪ B) ={' '}
            <span style={{ color: '#1e40af' }}>({countAInput})</span>
            {' '}+{' '}
            <span style={{ color: '#166534' }}>({countBInput})</span>
            {' '}−{' '}
            <span style={{ color: 'var(--color-brand-otimath-dark)' }}>{nI}</span>
          </p>
          <p className="ds-body-bold text-center mt-nano text-neutral-black">
            n(A ∪ B) = {aMinusB} + {nI} + {bMinusA} = <strong>{nU}</strong>
          </p>
          <p className="ds-small text-center text-neutral-dark mt-micro" style={{ fontStyle: 'italic' }}>
            Ao subtrair n(A ∩ B) = {nI}, cancelamos o {nI} que aparecia duas vezes na soma n(A) + n(B).
          </p>
        </div>
        <div className="flex justify-center mt-macro">
          <Button style="primary" size="small" onClick={() => goTo('placeExpressions')}>
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'conclusion') {
    const aMinusB = nA - nI;
    const bMinusA = nB - nI;
    const total = aMinusB + nI + bMinusA;
    // conclusionPhase: 0 = inicial; 1 = (ii); 2 = (iii); 3 = substituição;
    // 4 = conclusão final; 5 = verificação numérica
    return (
      <div className="mt-micro">
        <style>{`
          @keyframes vennFadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .venn-fade-in { animation: vennFadeIn 0.5s ease-out; }
        `}</style>
        <div
          className="rounded-md p-micro"
          style={{
            background: 'var(--color-brand-otimath-lightest)',
            border: '2px solid var(--color-brand-otimath-pure)',
          }}
        >
          <p className="ds-body-bold mb-nano" style={{ color: 'var(--color-brand-otimath-dark)' }}>
            Sabemos que:
          </p>
          <p className="ds-body text-neutral-black" style={{ textAlign: 'justify' }}>
            <strong>(i)</strong>&nbsp; n(A ∪ B) ={' '}
            <strong style={{ color: '#1e40af' }}>n(A − B)</strong>
            {' '}+ n(A ∩ B) +{' '}
            <strong style={{ color: '#166534' }}>n(B − A)</strong>.
          </p>

          {conclusionPhase >= 1 && (
            <p className="ds-body text-neutral-black mt-nano venn-fade-in" style={{ textAlign: 'justify' }}>
              <strong>(ii)</strong>&nbsp;{' '}
              <span style={{ color: '#1e40af' }}>n(A − B) = n(A) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 2 && (
            <p className="ds-body text-neutral-black mt-nano venn-fade-in" style={{ textAlign: 'justify' }}>
              <strong>(iii)</strong>&nbsp;{' '}
              <span style={{ color: '#166534' }}>n(B − A) = n(B) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 3 && (
            <p className="ds-body text-neutral-black mt-micro venn-fade-in" style={{ textAlign: 'justify' }}>
              Substituindo as expressões de <strong>(ii)</strong> e <strong>(iii)</strong> em <strong>(i)</strong>, temos:
            </p>
          )}

          {conclusionPhase >= 4 && (
            <p className="ds-body-bold text-center mt-nano text-neutral-black venn-fade-in">
              n(A ∪ B) ={' '}
              <span style={{ color: '#1e40af' }}>n(A) − n(A ∩ B)</span>
              {' '}+ n(A ∩ B) +{' '}
              <span style={{ color: '#166534' }}>n(B) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 5 && (
            <p className="ds-body text-neutral-black mt-micro venn-fade-in" style={{ textAlign: 'justify' }}>
              Daí concluímos que:
            </p>
          )}

          {conclusionPhase >= 6 && (
            <p
              className="ds-body-bold text-center mt-nano venn-fade-in"
              style={{ color: 'var(--color-brand-otimath-dark)', fontSize: '1.1rem' }}
            >
              n(A ∪ B) = n(A) + n(B) − n(A ∩ B)
            </p>
          )}

          {conclusionPhase >= 7 && (
            <p className="ds-small text-center text-neutral-dark mt-micro venn-fade-in" style={{ fontStyle: 'italic' }}>
              Substituindo os valores do problema em ambos os membros da identidade (i):
            </p>
          )}

          {conclusionPhase >= 8 && (
            <p className="ds-body-bold text-center mt-nano venn-fade-in">
              {aMinusB} + {nI} + {bMinusA} = {nA} + {nB} − {nI} = <strong>{total}</strong>
            </p>
          )}
        </div>
        {conclusionPhase >= 8 && (
          <div className="flex justify-center mt-macro venn-fade-in">
            <Button style="primary" size="small" onClick={onComplete}>
              Continuar
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 'clickIntersection', 'identifyAMinusB', 'identifyBMinusA' não têm controles —
  // o avanço é por clique no SVG
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Componente: painel de cardinalidades (referência permanente)
// Chips podem ser "armáveis": quando o aluno clica, ficam em estado
// selecionado e o próximo clique em região do SVG deposita o valor.
// ═══════════════════════════════════════════════════════════════
interface CardinalityPanelProps {
  nA: number;
  nB: number;
  nI: number;
  nU?: number;          // só exibido quando o valor já foi descoberto pelo aluno
  armedChip: 'nI' | null;
  armable: 'nI' | null;
  onChipClick: (chip: 'nI') => void;
}

function CardinalityPanel({
  nA, nB, nI, nU, armedChip, armable, onChipClick,
}: Readonly<CardinalityPanelProps>) {
  const chip = (label: string, value: number, color: string, id?: 'nI') => {
    const isArmable = id !== undefined && armable === id;
    const isArmed = id !== undefined && armedChip === id;
    const interactive = isArmable;
    const baseStyle: React.CSSProperties = {
      padding: '4px 10px',
      borderRadius: 6,
      border: `2px solid ${color}`,
      color: isArmed ? 'var(--color-neutral-white)' : color,
      background: isArmed ? color : 'var(--color-neutral-white)',
      fontSize: '0.92rem',
      whiteSpace: 'nowrap',
      cursor: interactive ? 'pointer' : 'default',
      boxShadow: isArmed ? `0 0 0 3px ${color}44` : undefined,
      transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
    };
    if (interactive) {
      return (
        <button
          type="button"
          className="ds-body-bold"
          style={baseStyle}
          onClick={() => onChipClick(id)}
          aria-pressed={isArmed}
        >
          {label} = {value}
        </button>
      );
    }
    return (
      <span className="ds-body-bold" style={baseStyle}>
        {label} = {value}
      </span>
    );
  };
  return (
    <div
      className="flex justify-center items-center flex-wrap mb-micro"
      style={{ gap: 8 }}
    >
      <span className="ds-body-bold text-neutral-black" style={{ marginRight: 2 }}>Dados:</span>
      {chip('n(A)', nA, COLOR_A)}
      {chip('n(B)', nB, COLOR_B)}
      {chip('n(A ∩ B)', nI, COLOR_I, 'nI')}
      {nU !== undefined && chip('n(A ∪ B)', nU, COLOR_U)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: legenda externa das regiões identificadas
// Acumula descrições semânticas conforme o aluno identifica cada região.
// ═══════════════════════════════════════════════════════════════
function RegionLegend({
  intersectionDescribed, aMinusBDescribed, bMinusADescribed, unionDescribed,
}: {
  intersectionDescribed: boolean;
  aMinusBDescribed: boolean;
  bMinusADescribed: boolean;
  unionDescribed: boolean;
}) {
  const items: { label: string; description: string; color: string }[] = [];
  if (intersectionDescribed) {
    items.push({ label: 'A ∩ B', description: 'ocorre A e B ao mesmo tempo', color: COLOR_I });
  }
  if (aMinusBDescribed) {
    items.push({ label: 'A − B', description: 'ocorre A, mas não ocorre B', color: '#1e40af' });
  }
  if (bMinusADescribed) {
    items.push({ label: 'B − A', description: 'ocorre B, mas não ocorre A', color: '#166534' });
  }
  if (unionDescribed) {
    items.push({ label: 'A ∪ B', description: 'ocorre pelo menos um dos eventos', color: COLOR_U });
  }
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col items-center mt-nano mb-nano" style={{ gap: 4 }}>
      {items.map(it => (
        <p key={it.label} className="ds-small text-neutral-black text-center">
          <strong style={{ color: it.color }}>{it.label}</strong>: {it.description}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: dropdown de fórmula
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// Componente: 2ª linha com as 3 expressões clicáveis (placeExpressions)
// ═══════════════════════════════════════════════════════════════
function ExpressionChipsRow({
  armed, placedExpressions, onArm,
}: {
  armed: ExpressionId | null;
  placedExpressions: Record<string, ExpressionId>;
  onArm: (expr: ExpressionId) => void;
}) {
  const expressions: { id: ExpressionId; label: string; color: string }[] = [
    { id: 'AMinusB', label: 'n(A − B)', color: '#1e40af' },
    { id: 'intersection', label: 'n(A ∩ B)', color: COLOR_I },
    { id: 'BMinusA', label: 'n(B − A)', color: '#166534' },
  ];
  // Uma expressão é "usada" se foi posicionada em QUALQUER região (mesmo errada)
  const used = new Set(Object.values(placedExpressions));
  return (
    <div
      className="flex justify-center items-center flex-wrap mb-micro"
      style={{ gap: 8 }}
    >
      <span className="ds-body-bold text-neutral-black" style={{ marginRight: 2 }}>Expressões:</span>
      {expressions.map(e => {
        const isUsed = used.has(e.id);
        const isArmed = armed === e.id;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onArm(e.id)}
            aria-pressed={isArmed}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `2px solid ${e.color}`,
              color: isArmed ? 'var(--color-neutral-white)' : e.color,
              background: isArmed ? e.color : 'var(--color-neutral-white)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              opacity: isUsed && !isArmed ? 0.5 : 1,
              boxShadow: isArmed ? `0 0 0 3px ${e.color}44` : undefined,
              transition: 'background 0.15s, color 0.15s, box-shadow 0.15s, opacity 0.15s',
            }}
          >
            {e.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: barra de slots da fórmula n(A ∪ B) = __ + __ + __
// ═══════════════════════════════════════════════════════════════
function FormulaSlotsRow({ slots }: { slots: string[] }) {
  return (
    <div
      className="flex justify-center items-center flex-wrap mb-micro"
      style={{
        gap: 6,
        padding: '6px 12px',
        borderRadius: 6,
        background: 'var(--color-brand-otimath-lightest)',
        border: '1px solid var(--color-brand-otimath-light)',
        maxWidth: 'fit-content',
        margin: '0 auto 12px',
      }}
    >
      <span className="ds-body-bold" style={{ color: COLOR_U }}>n(A ∪ B) =</span>
      {slots.map((slot, i) => (
        <React.Fragment key={i}>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 6,
              border: slot ? `2px solid var(--color-brand-otimath-pure)` : '2px dashed var(--color-neutral-dark)',
              minWidth: 80, minHeight: 28, textAlign: 'center',
              color: slot ? '#222' : '#999',
              fontWeight: 700,
              background: 'var(--color-neutral-white)',
            }}
          >
            {slot || '__'}
          </span>
          {i < slots.length - 1 && <span className="ds-body-bold text-neutral-black">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: input de expressão aritmética (soma de termos)
// Usado nas sub-etapas unionCount / countAFromDiagram / countBFromDiagram
// ═══════════════════════════════════════════════════════════════
function ExpressionInput({
  value, onChange, onSubmit, disabled, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !disabled) onSubmit(); }}
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Digite a operação"
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '2px solid var(--color-brand-otimath-pure)',
        background: disabled ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
        textAlign: 'center',
        fontSize: '1rem',
        fontWeight: 700,
        width: 180,
        outline: 'none',
      }}
    />
  );
}

function FormulaDropdown({
  options, onChoice, disabled, computedDisplay,
}: {
  options: string[];
  onChoice: (choice: string) => void;
  disabled: boolean;
  computedDisplay: string | null;
}) {
  const [choice, setChoice] = useState('');
  return (
    <div className="flex flex-col items-center gap-y-nano mt-micro">
      <select
        value={choice}
        onChange={e => setChoice(e.target.value)}
        disabled={disabled}
        className="ds-body"
        style={{
          padding: '10px 16px', borderRadius: 8,
          border: '2px solid var(--color-neutral-lighter)',
          minWidth: 260, background: 'var(--color-neutral-white)',
        }}
      >
        <option value="">Escolha a operação</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {!disabled && (
        <Button
          style="primary" size="extra-small"
          onClick={() => onChoice(choice)}
          disabled={!choice}
        >
          Conferir
        </Button>
      )}
      {disabled && computedDisplay && (
        <p className="ds-body-bold text-center" style={{ color: 'var(--color-feedback-success-dark)' }}>
          ✓ {computedDisplay}
        </p>
      )}
    </div>
  );
}
