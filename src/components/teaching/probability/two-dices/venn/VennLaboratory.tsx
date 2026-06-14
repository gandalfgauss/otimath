'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import { useTelemetryExercise } from '@/hooks/teaching/probability/useTelemetry';
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
  /** Notifica o pai a cada mudança de sub-etapa interna — usado para o
   *  cenaId DEV refletir cada uma das ~17 sub-etapas do laboratório Venn. */
  onSubStepChange?: (subStep: string) => void;
  /** Toast alert do OVA. Disparado em validações erradas e acertos
   *  relevantes para feedback consistente com o resto do OVA. */
  createAlert?: (title: string, description: string, type: 'success' | 'error' | 'info' | 'warning', timeout?: number) => void;
}

// Handle exposto ao painel DEV — permite avançar pelas sub-etapas internas
// do laboratório Venn.
export interface VennLaboratoryHandle {
  getCurrentSubStep: () => string;
  advance: () => void;
}

// Sequência linear das sub-etapas — usada por advance() do handle DEV.
const VENN_SUBSTEP_SEQUENCE = [
  'intro',
  'createIntersection',
  'clickIntersection',
  'fillIntersection',
  'identifyAMinusB',
  'fillAMinusB',
  'identifyBMinusA',
  'fillBMinusA',
  'markUnion',
  'unionCount',
  'countAFromDiagram',
  'countBFromDiagram',
  'sumAB',
  'doubleCountQuestion',
  'numericConclusion',
  'placeExpressions',
  'writeUnionFormula',
  'conclusion',
] as const;

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
  onSubStepChange,
  createAlert,
  ref,
}: Readonly<VennLaboratoryProps> & { ref?: React.Ref<VennLaboratoryHandle> }) {
  const sets = useMemo<VennSetSpec[]>(() => [
    { label: 'A', description: eventADescription, cardinality: nA, color: COLOR_A, fill: FILL_A },
    { label: 'B', description: eventBDescription, cardinality: nB, color: COLOR_B, fill: FILL_B },
  ], [eventADescription, eventBDescription, nA, nB]);

  const regions = useMemo<VennRegion[]>(
    () => buildRegions2(nA, nB, nI),
    [nA, nB, nI],
  );

  const [step, setStep] = useState<VennSubStep>('intro');
  // SEÇÃO POR SUB-ETAPA — cada uma das ~17 sub-etapas do laboratório
  // Venn (intro → createIntersection → ... → conclusion) é uma tela
  // distinta. Mudou de step → nova seção telemétrica, exercícios não
  // se misturam entre etapas.
  useTelemetryExercise(
    `twoDices-cena7-venn-${step}`,
    'Laboratório de Venn — descoberta da fórmula da união',
    `Construção do diagrama de Venn (N=2). Sub-etapa: ${step}.`,
  );
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
  const [unionCountError, setUnionCountError] = useState(false);
  const [countAInput, setCountAInput] = useState('');
  const [countAAccepted, setCountAAccepted] = useState(false);
  const [countAError, setCountAError] = useState(false);
  const [countBInput, setCountBInput] = useState('');
  const [countBAccepted, setCountBAccepted] = useState(false);
  const [countBError, setCountBError] = useState(false);
  // Estados de erro para os inputs aritméticos dentro do SVG (A−B, B−A).
  // Sinalizam visualmente (borda vermelha) quando a operação foi validada e está incorreta.
  const [aMinusBInputError, setAMinusBInputError] = useState(false);
  const [bMinusAInputError, setBMinusAInputError] = useState(false);
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
    // Ancora no topo do OVA a cada transição de sub-etapa. Antes, vários
    // botões do Venn ("Continuar", "Próximo passo", etc.) e callbacks de
    // setTimeout (após acertar uma região) chamavam goTo SEM scroll —
    // o aluno terminava lá embaixo na sub-etapa anterior e a próxima
    // carregava sem trazer o enunciado/diagrama pra viewport.
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Notifica o pai a cada mudança de sub-etapa — entra no cenaId DEV.
  useEffect(() => {
    onSubStepChange?.(step);
  }, [step, onSubStepChange]);

  // Handle DEV — avança 1 sub-etapa na sequência linear.
  // Quando aplicável, também preenche estados "de aceito" para que a UI
  // da próxima sub-etapa não dependa de cliques anteriores do aluno.
  useImperativeHandle(ref, () => ({
    getCurrentSubStep: () => step,
    advance: () => {
      const idx = VENN_SUBSTEP_SEQUENCE.indexOf(step as typeof VENN_SUBSTEP_SEQUENCE[number]);
      if (idx < 0) return;
      // Última sub-etapa → conclui o laboratório.
      if (idx === VENN_SUBSTEP_SEQUENCE.length - 1) {
        onComplete();
        return;
      }
      const next = VENN_SUBSTEP_SEQUENCE[idx + 1];
      // Marca estados de aceitação correspondentes para que a UI da próxima
      // sub-etapa apareça como se o aluno tivesse acertado a anterior.
      switch (step) {
        case 'createIntersection':
          setGeometry(defaultGeometry2Intersected());
          setDescriptionsOutside(true);
          break;
        case 'clickIntersection':
          setIntersectionClicked(true);
          break;
        case 'fillIntersection':
          setIntersectionValueDeposited(true);
          break;
        case 'identifyAMinusB':
          setAMinusBClicked(true);
          break;
        case 'fillAMinusB':
          setAMinusBFormulaAccepted(true);
          setAMinusBValueDeposited(true);
          setAMinusBInput(String(nA - nI));
          break;
        case 'identifyBMinusA':
          setBMinusAClicked(true);
          break;
        case 'fillBMinusA':
          setBMinusAFormulaAccepted(true);
          setBMinusAValueDeposited(true);
          setBMinusAInput(String(nB - nI));
          break;
        case 'markUnion':
          setUnionSelection(new Set([
            maskKey([true, false]),
            maskKey([true, true]),
            maskKey([false, true]),
          ]));
          break;
        case 'unionCount':
          setUnionCountAccepted(true);
          setUnionCountInput(String(nU));
          break;
        case 'countAFromDiagram':
          setCountAAccepted(true);
          setCountAInput(String(nA));
          break;
        case 'countBFromDiagram':
          setCountBAccepted(true);
          setCountBInput(String(nB));
          break;
        case 'sumAB':
          setSumABFilledA(true);
          setSumABFilledB(true);
          break;
        case 'doubleCountQuestion':
          setDoubleCountConfirmed(true);
          setDoubleCountChoice('once');
          break;
        case 'placeExpressions':
          setPlacedExpressions({
            [maskKey([true, false])]: 'AMinusB',
            [maskKey([true, true])]: 'intersection',
            [maskKey([false, true])]: 'BMinusA',
          });
          break;
        case 'writeUnionFormula':
          setFormulaSlots(['n(A − B)', 'n(A ∩ B)', 'n(B − A)']);
          setFormulaUsedRegions(new Set([
            maskKey([true, false]),
            maskKey([true, true]),
            maskKey([false, true]),
          ]));
          break;
      }
      setStep(next);
    },
  }), [step, onComplete, nA, nB, nI, nU]);

  // --- Sub-etapa 2: createIntersection ---
  const moveCircleB = useCallback((direction: 'left' | 'right') => {
    // Som curto de clique a cada movimento — sem isso o aluno clica nos
    // botões "◄ Aproximar B" / "Afastar B ►" e não tem feedback auditivo.
    playSound('/sounds/click.mp3');
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

  // Rola pro topo do OVA em todo Conferir. Mirror do checkAnswer do Disco.
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const confirmIntersection = useCallback(() => {
    scrollDiceToTop();
    playSound('/sounds/correct.mp3');
    createAlert?.('Interseção criada', 'Os círculos agora se sobrepõem — formando A ∩ B.', 'success', 3000);
    setGeometry(defaultGeometry2Intersected());
    setTimeout(() => setDescriptionsOutside(true), 400);
    setTimeout(() => goTo('clickIntersection'), 800);
  }, [goTo, createAlert]);

  // --- Sub-etapa 3/5/7: clique em região ---
  const handleRegionClick = useCallback((mask: MembershipMask) => {
    // Ancora no topo do OVA em TODO clique de região que vai disparar feedback
    // (alert/som). markUnion é a única sub-etapa que faz toggle silencioso de
    // seleção sem alert — não precisa scrollar lá. Antes, depositar um valor
    // (`fillIntersection`, `placeExpressions`, `writeUnionFormula`) mostrava
    // o alert "Correto!" no topo da tela enquanto o aluno estava com a viewport
    // descida no diagrama, e o feedback passava despercebido.
    if (step !== 'markUnion') {
      requestAnimationFrame(() => {
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (step === 'clickIntersection') {
      if (masksEqual(mask, [true, true])) {
        setIntersectionClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok', msg: 'Correto!' });
        createAlert?.('Correto!', 'A ∩ B é a região onde A e B se sobrepõem.', 'success', 3000);
        setTimeout(() => goTo('fillIntersection'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Essa não é a região de A ∩ B. Clique onde A e B se sobrepõem.' });
        createAlert?.('Tente novamente', 'Essa não é a região de A ∩ B. Clique onde A e B se sobrepõem.', 'error', 4000);
      }
      return;
    }
    if (step === 'fillIntersection') {
      if (!armedChip) {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Primeiro clique no valor n(A ∩ B) no topo da tela.' });
        createAlert?.('Falta armar', 'Primeiro clique no valor n(A ∩ B) no topo da tela.', 'error', 4000);
        return;
      }
      if (masksEqual(mask, [true, true])) {
        setIntersectionValueDeposited(true);
        setArmedChip(null);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok', msg: 'Correto!' });
        createAlert?.('Correto!', `n(A ∩ B) = ${nI} depositado em A ∩ B.`, 'success', 3000);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'A ∩ B satisfaz A e B ao mesmo tempo.' });
        createAlert?.('Tente novamente', 'A ∩ B satisfaz A e B ao mesmo tempo.', 'error', 4000);
      }
      return;
    }
    if (step === 'identifyAMinusB') {
      if (masksEqual(mask, [true, false])) {
        setAMinusBClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok' });
        createAlert?.('Correto!', 'A − B: região onde A ocorre e B não ocorre.', 'success', 3000);
        setTimeout(() => goTo('fillAMinusB'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Clique na região em que ocorre A e NÃO ocorre B.' });
        createAlert?.('Tente novamente', 'Clique na região em que ocorre A e NÃO ocorre B.', 'error', 4000);
      }
      return;
    }
    if (step === 'identifyBMinusA') {
      if (masksEqual(mask, [false, true])) {
        setBMinusAClicked(true);
        playSound('/sounds/correct.mp3');
        setFeedback({ type: 'ok' });
        createAlert?.('Correto!', 'B − A: região onde B ocorre e A não ocorre.', 'success', 3000);
        setTimeout(() => goTo('fillBMinusA'), 800);
      } else {
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Clique na região em que ocorre B e NÃO ocorre A.' });
        createAlert?.('Tente novamente', 'Clique na região em que ocorre B e NÃO ocorre A.', 'error', 4000);
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
      // Sem expressão armada: se a região já tem uma colocada, REMOVE — permite
      // ao aluno desfazer/trocar sem precisar dum botão extra de "limpar".
      // Caso contrário, avisa que precisa armar antes.
      if (!armedExpression) {
        if (placedExpressions[k]) {
          setPlacedExpressions(prev => {
            const next = { ...prev };
            delete next[k];
            return next;
          });
          playSound('/sounds/clear.mp3');
          setFeedback({ type: 'none' });
          return;
        }
        playSound('/sounds/incorrect.mp3');
        setFeedback({ type: 'err', msg: 'Primeiro clique em uma das expressões disponíveis para armá-la.' });
        createAlert?.('Falta armar', 'Primeiro clique em uma das expressões disponíveis para armá-la.', 'error', 4000);
        return;
      }
      // Sobrescreve: se já havia outra expressão na região, é trocada — e a
      // expressão recém-colocada deixa de estar "usada" em outras regiões para
      // evitar duplicação na fórmula final.
      setPlacedExpressions(prev => {
        const next = { ...prev };
        // Remove a expressão armada de qualquer outra região onde estava.
        for (const key of Object.keys(next)) {
          if (next[key] === armedExpression && key !== k) delete next[key];
        }
        next[k] = armedExpression;
        return next;
      });
      setArmedExpression(null);
      setFeedback({ type: 'none' });
      playSound('/sounds/correct.mp3');
      createAlert?.('Expressão depositada', 'Continue até preencher as 3 regiões.', 'success', 2500);
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
      createAlert?.('Bom!', `${expr} adicionado à fórmula.`, 'success', 2500);
      return;
    }
  }, [step, armedChip, armedExpression, placedExpressions, formulaSlots, formulaUsedRegions, goTo, createAlert]);



  // --- Sub-etapa 6/8: fillAMinusB / fillBMinusA via dropdown ---
  const handleFormulaChoice = useCallback((choice: string, expected: string, onCorrect: () => void) => {
    scrollDiceToTop();
    if (choice === expected) {
      playSound('/sounds/correct.mp3');
      createAlert?.('Correto!', `Operação ${expected} selecionada.`, 'success', 3000);
      onCorrect();
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Não é essa operação. Pense: quantos elementos estão em A e ainda não foram contados na interseção?' });
      createAlert?.('Tente novamente', 'Não é essa operação. Pense: quantos elementos estão em A e ainda não foram contados na interseção?', 'error', 5000);
    }
  }, [createAlert]);

  // Valida a operação numérica digitada (ex: "30-9") na região A-B ou B-A.
  // Aceita espaços e os traços '-' e '−'.
  const matchesSubtraction = useCallback((input: string, minuend: number, subtrahend: number): boolean => {
    const normalized = input.replace(/\s+/g, '').replace(/−/g, '-');
    return normalized === `${minuend}-${subtrahend}`;
  }, []);

  const validateAMinusBArithmetic = useCallback(() => {
    scrollDiceToTop();
    if (matchesSubtraction(aMinusBInput, nA, nI)) {
      setAMinusBValueDeposited(true);
      setAMinusBInputError(false);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      createAlert?.('Correto!', `n(A − B) = ${nA} − ${nI} = ${nA - nI}.`, 'success', 3000);
      setTimeout(() => goTo('identifyBMinusA'), 1200);
    } else {
      setAMinusBInputError(true);
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Preencha com a operação correta em A − B no diagrama.' });
      createAlert?.('Tente novamente', 'Preencha com a operação correta em A − B no diagrama.', 'error', 4500);
    }
  }, [aMinusBInput, nA, nI, matchesSubtraction, goTo, createAlert]);

  const validateBMinusAArithmetic = useCallback(() => {
    scrollDiceToTop();
    if (matchesSubtraction(bMinusAInput, nB, nI)) {
      setBMinusAValueDeposited(true);
      setBMinusAInputError(false);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      createAlert?.('Correto!', `n(B − A) = ${nB} − ${nI} = ${nB - nI}.`, 'success', 3000);
      setTimeout(() => goTo('markUnion'), 1200);
    } else {
      setBMinusAInputError(true);
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Preencha com a operação correta em B − A no diagrama.' });
      createAlert?.('Tente novamente', 'Preencha com a operação correta em B − A no diagrama.', 'error', 4500);
    }
  }, [bMinusAInput, nB, nI, matchesSubtraction, goTo, createAlert]);

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
    scrollDiceToTop();
    const aMinusB = nA - nI;
    const bMinusA = nB - nI;
    if (matchesSum(unionCountInput, [aMinusB, nI, bMinusA])) {
      setUnionCountAccepted(true);
      setUnionCountError(false);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      createAlert?.('Correto!', `n(A ∪ B) = ${aMinusB} + ${nI} + ${bMinusA} = ${nU}.`, 'success', 3500);
    } else {
      setUnionCountError(true);
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Casos em que ocorre apenas A, apenas B ou ambos.' });
      createAlert?.('Tente novamente', 'Some os valores das três regiões que compõem A ∪ B.', 'error', 4500);
    }
  }, [unionCountInput, nA, nB, nI, matchesSum, createAlert]);

  const validateCountAFromDiagram = useCallback(() => {
    scrollDiceToTop();
    const aMinusB = nA - nI;
    if (matchesSum(countAInput, [aMinusB, nI])) {
      setCountAAccepted(true);
      setCountAError(false);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      createAlert?.('Correto!', `n(A) = ${aMinusB} + ${nI} = ${nA}.`, 'success', 3000);
    } else {
      setCountAError(true);
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Some os valores das regiões do diagrama que compõem o evento A.' });
      createAlert?.('Tente novamente', 'Some os valores das regiões do diagrama que compõem o evento A.', 'error', 4500);
    }
  }, [countAInput, nA, nI, matchesSum, createAlert]);

  // --- placeExpressions: clica expressão (arma) + clica região (deposita) ---
  const toggleArmedExpression = useCallback((expr: ExpressionId) => {
    setArmedExpression(prev => {
      const next = prev === expr ? null : expr;
      // Som + alert ao armar; só som ao desarmar (alert seria spam).
      playSound('/sounds/click.mp3');
      if (next !== null && prev !== expr) {
        const label = expr === 'AMinusB' ? 'n(A − B)' : expr === 'intersection' ? 'n(A ∩ B)' : 'n(B − A)';
        createAlert?.('Expressão armada', `${label} pronta. Clique numa região do diagrama pra posicionar.`, 'info', 3000);
      }
      return next;
    });
    setFeedback({ type: 'none' });
  }, [createAlert]);

  const confirmPlaceExpressions = useCallback(() => {
    scrollDiceToTop();
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
      createAlert?.('Correto!', 'As 3 expressões estão na região certa.', 'success', 3000);
      setTimeout(() => goTo('writeUnionFormula'), 900);
    } else {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Verifique as regiões e sua expressão correspondente.' });
      createAlert?.('Tente novamente', 'Verifique as regiões e sua expressão correspondente.', 'error', 4500);
    }
  }, [placedExpressions, goTo, createAlert]);

  const validateCountBFromDiagram = useCallback(() => {
    scrollDiceToTop();
    const bMinusA = nB - nI;
    if (matchesSum(countBInput, [bMinusA, nI])) {
      setCountBAccepted(true);
      setCountBError(false);
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok', msg: 'Correto!' });
      createAlert?.('Correto!', `n(B) = ${bMinusA} + ${nI} = ${nB}.`, 'success', 3000);
    } else {
      setCountBError(true);
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Some os valores das regiões do diagrama que compõem o evento B.' });
      createAlert?.('Tente novamente', 'Some os valores das regiões do diagrama que compõem o evento B.', 'error', 4500);
    }
  }, [countBInput, nB, nI, matchesSum, createAlert]);

  // --- Sub-etapa 9: confirmação de markUnion ---
  const confirmMarkUnion = useCallback(() => {
    scrollDiceToTop();
    const expected = new Set([maskKey([true, false]), maskKey([true, true]), maskKey([false, true])]);
    const correct = expected.size === unionSelection.size &&
      [...expected].every(k => unionSelection.has(k));
    if (correct) {
      playSound('/sounds/correct.mp3');
      setFeedback({ type: 'ok' });
      createAlert?.('Correto!', 'A ∪ B é formada pelas 3 regiões internas.', 'success', 3000);
      setTimeout(() => goTo('unionCount'), 800);
    } else {
      playSound('/sounds/incorrect.mp3');
      const msg = unionSelection.size < 3
        ? 'Faltam regiões. A ∪ B inclui pares de A, pares de B ou de ambos.'
        : 'Revise: A ∪ B é formada pelas 3 regiões internas.';
      setFeedback({ type: 'err', msg });
      createAlert?.('Tente novamente', msg, 'error', 4500);
    }
  }, [unionSelection, goTo, createAlert]);

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
        createAlert?.('Excelente!', 'Fórmula da união por regiões disjuntas concluída.', 'success', 3500);
        const t = setTimeout(() => goTo('conclusion'), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [step, formulaSlots, goTo, createAlert]);

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
    scrollDiceToTop();
    if (doubleCountChoice === 'A ∩ B') {
      playSound('/sounds/correct.mp3');
      setDoubleCountConfirmed(true);
      setFeedback({ type: 'ok' });
      createAlert?.('Correto!', 'Os pares de A ∩ B são contados duas vezes (uma em A, outra em B).', 'success', 3500);
      setTimeout(() => goTo('numericConclusion'), 900);
    } else if (doubleCountChoice === '') {
      playSound('/sounds/incorrect.mp3');
      setFeedback({ type: 'err', msg: 'Escolha uma região.' });
      createAlert?.('Falta escolher', 'Selecione uma região antes de confirmar.', 'error', 3500);
    } else {
      playSound('/sounds/incorrect.mp3');
      const msg = 'Pense: alguns pares pertencem a A e também a B. Quando você conta A e depois B, quais aparecem duas vezes?';
      setFeedback({ type: 'err', msg });
      createAlert?.('Tente novamente', msg, 'error', 5500);
    }
  }, [doubleCountChoice, goTo, createAlert]);

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

  // Cliques no diagrama só são válidos enquanto a sub-etapa não foi "completada".
  // Depois que o aluno acerta (e o botão Continuar aparece), o SVG fica inerte —
  // sem isso, um clique acidental durante a espera dispara mensagem de erro.
  // Exceção: 'placeExpressions' permanece sempre clicável (o aluno precisa
  // poder corrigir/trocar a atribuição depois de um Conferir errado).
  const writeUnionFormulaSlotsFilled = formulaSlots.every(s => s !== '');
  const svgClickable =
    (step === 'clickIntersection' && !intersectionClicked) ||
    (step === 'fillIntersection' && !intersectionValueDeposited) ||
    (step === 'identifyAMinusB' && !aMinusBClicked) ||
    (step === 'identifyBMinusA' && !bMinusAClicked) ||
    step === 'markUnion' ||
    step === 'placeExpressions' ||
    (step === 'writeUnionFormula' && !writeUnionFormulaSlotsFilled);

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
            // Som + alert ao armar; só som ao desarmar.
            playSound('/sounds/click.mp3');
            setArmedChip(prev => {
              const next = prev === 'nI' ? null : 'nI';
              if (next === 'nI') {
                createAlert?.('Valor armado', `n(A ∩ B) = ${nI} pronto. Clique na região A ∩ B do diagrama pra depositar.`, 'info', 3500);
              }
              return next;
            });
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
          <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(A) + n(B) =</span>
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
          nA={nA} nB={nB}
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
        let arithmeticError = false;
        let onArithmeticChange: ((v: string) => void) | undefined;
        let onArithmeticSubmit: (() => void) | undefined;
        if (step === 'fillAMinusB' && aMinusBFormulaAccepted && !aMinusBValueDeposited) {
          arithmeticMask = [true, false];
          arithmeticValue = aMinusBInput;
          arithmeticPlaceholder = 'operação';
          arithmeticError = aMinusBInputError;
          onArithmeticChange = (v) => { setAMinusBInput(v); setAMinusBInputError(false); };
          onArithmeticSubmit = validateAMinusBArithmetic;
        } else if (step === 'fillBMinusA' && bMinusAFormulaAccepted && !bMinusAValueDeposited) {
          arithmeticMask = [false, true];
          arithmeticValue = bMinusAInput;
          arithmeticPlaceholder = 'operação';
          arithmeticError = bMinusAInputError;
          onArithmeticChange = (v) => { setBMinusAInput(v); setBMinusAInputError(false); };
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
            arithmeticError={arithmeticError}
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
        setUnionCountInput={(v) => { setUnionCountInput(v); setUnionCountError(false); }}
        unionCountAccepted={unionCountAccepted}
        unionCountError={unionCountError}
        validateUnionCount={validateUnionCount}
        countAInput={countAInput}
        setCountAInput={(v) => { setCountAInput(v); setCountAError(false); }}
        countAAccepted={countAAccepted}
        countAError={countAError}
        validateCountAFromDiagram={validateCountAFromDiagram}
        countBInput={countBInput}
        setCountBInput={(v) => { setCountBInput(v); setCountBError(false); }}
        countBAccepted={countBAccepted}
        countBError={countBError}
        validateCountBFromDiagram={validateCountBFromDiagram}
        sumABFilledA={sumABFilledA}
        sumABFilledB={sumABFilledB}
        placedExpressionsCount={Object.keys(placedExpressions).length}
        confirmPlaceExpressions={confirmPlaceExpressions}
        formulaSlots={formulaSlots}
        conclusionPhase={conclusionPhase}
        onSumABClickA={() => {
          setSumABFilledA(true);
          playSound('/sounds/correct.mp3');
          createAlert?.('n(A) incluído', 'O total do conjunto A foi adicionado à soma. Agora clique em B.', 'success', 3000);
        }}
        onSumABClickB={() => {
          setSumABFilledB(true);
          playSound('/sounds/correct.mp3');
          createAlert?.('n(B) incluído', 'O total do conjunto B foi adicionado à soma.', 'success', 3000);
        }}
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
  arithmeticError?: boolean;
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
  arithmeticMask, arithmeticValue, arithmeticPlaceholder, arithmeticError,
  onArithmeticChange, onArithmeticSubmit,
  placedExpressions, flashingMask, flashUnionRegions,
}: Readonly<VennSVGProps>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, B] = geometry.circles;
  const [setA, setB] = sets;

  // Escala de fonte adaptativa: o `fontSize` no SVG é em unidades do viewBox,
  // que escalam com a largura renderizada do SVG. Em mobile, com o SVG
  // espremido pra ~340px de tela, fontSize=14 vira ~6px de altura real,
  // ilegível. Medimos a largura real renderizada e usamos uma escala
  // SUAVIZADA (sqrt) pra subir o fontSize sem estourar os containers de
  // tamanho fixo (foreignObject das descrições internas, input aritmético).
  // Cap em 1.7 — escala maior deformava demais ou cortava texto.
  const [textScale, setTextScale] = useState(1);
  useEffect(() => {
    if (!svgRef.current) return;
    const measure = () => {
      const w = svgRef.current?.clientWidth ?? VIEWBOX_WIDTH;
      // sqrt suaviza: 800/360≈2.22 → sqrt≈1.49 (em vez de 2.22 cru).
      const raw = Math.sqrt(VIEWBOX_WIDTH / w);
      setTextScale(Math.max(1, Math.min(1.7, raw)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

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
          textAnchor="middle" fontSize={36 * textScale} fontWeight="700"
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
        {/* y deslocado pra acomodar fontSize escalado — antes y=36 cortava
            o topo da letra quando textScale > 1.3 (fontSize 18*1.5 = 27, top
            do glifo em y=36-27=9, abaixo da moldura em y=10). */}
        <text x={30} y={26 + 18 * textScale} fontSize={18 * textScale} fontWeight="600" fill="#666">Ω</text>

        {/* Rótulos externos — cada um ancorado JUNTO ao seu círculo (logo
            acima do topo), com largura limitada pra não cruzar o eixo
            central. Antes ficavam empilhados no topo do viewBox (y=10), longe
            dos círculos e sobre o Ω. Agora seguem cada círculo:
              - A: ancorado à borda esquerda externa de A, extends pra direita
                até o eixo central com um gap; texto alinhado à esquerda.
              - B: ancorado ao eixo central + gap, extends até a borda direita
                externa de B; texto alinhado à direita.
            wordBreak permite wrap quando o textScale do mobile aumenta o
            tamanho do texto. */}
        {descriptionsOutside && (() => {
          const labelHeight = 80;
          const gap = 10;
          const centerX = (A.cx - A.r + B.cx + B.r) / 2;
          const aLabelX = A.cx - A.r;
          const aLabelW = centerX - aLabelX - gap;
          const bLabelX = centerX + gap;
          const bLabelW = (B.cx + B.r) - bLabelX;
          // y posicionado logo acima do círculo mais alto (com folga pra
          // wrap em 2 linhas). Mínimo de 5 pra não estourar a moldura no
          // mobile com textScale alto.
          const labelY = Math.max(5, Math.min(A.cy - A.r, B.cy - B.r) - labelHeight - 8);
          return (
          <>
            <foreignObject
              x={aLabelX}
              y={labelY}
              width={aLabelW}
              height={labelHeight}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  fontSize: 18 * textScale,
                  fontWeight: 700,
                  color: setA.color,
                  textAlign: 'left',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                A: {toLowercaseArticle(setA.description)}
              </div>
            </foreignObject>
            <foreignObject
              x={bLabelX}
              y={labelY}
              width={bLabelW}
              height={labelHeight}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  fontSize: 18 * textScale,
                  fontWeight: 700,
                  color: setB.color,
                  textAlign: 'right',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                B: {toLowercaseArticle(setB.description)}
              </div>
            </foreignObject>
          </>
          );
        })()}

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
        {!descriptionsOutside && (() => {
          // foreignObject precisa CRESCER com o textScale pra não cortar texto
          // (height fixo 50 com fontSize 22+ estourava o container).
          // Container cresce com a fonte. Base bumpada de 50/22 → 62/28 pra
          // acomodar fontSize aumentado de 13 → 16.
          const foHeight = 62 * textScale;
          const foShiftY = 28 * textScale;
          return (
          <>
            <foreignObject
              x={A.cx - A.r * 0.75} y={A.cy - foShiftY}
              width={A.r * 1.5} height={foHeight}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  textAlign: 'center', fontSize: 16 * textScale, color: '#222',
                  lineHeight: 1.25, fontWeight: 500,
                }}
              >
                <strong style={{ color: setA.color }}>A:</strong>{' '}
                {shortPredicate(setA.description)}
              </div>
            </foreignObject>
            <foreignObject
              x={B.cx - B.r * 0.75} y={B.cy - foShiftY}
              width={B.r * 1.5} height={foHeight}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  textAlign: 'center', fontSize: 16 * textScale, color: '#222',
                  lineHeight: 1.25, fontWeight: 500,
                }}
              >
                <strong style={{ color: setB.color }}>B:</strong>{' '}
                {shortPredicate(setB.description)}
              </div>
            </foreignObject>
          </>
          );
        })()}

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
              x={anchor.x} y={anchor.y + 30}
              textAnchor="middle" fontSize={18 * textScale} fontWeight="700" fill={color}
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
              .venn-union-pulse {
                animation: unionPulse 1.4s ease-in-out 3 forwards;
              }
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
          // Box cresce com textScale pra acomodar fontSize escalado.
          // Base bumpada de 120/34 → 144/42 acompanhando o fontSize 14 → 18.
          const boxW = 144 * textScale;
          const boxH = 42 * textScale;
          return (
            <foreignObject
              x={anchor.x - boxW / 2}
              y={anchor.y - boxH / 2}
              width={boxW}
              height={boxH}
            >
              <input

                type="text"
                // Sem `inputMode` explícito — alguns mobile browsers (iOS
                // Safari em particular) interpretavam "numeric" baseado em
                // heurística do `name`/contexto mesmo com inputMode="text",
                // abrindo o teclado numérico. type="text" puro deixa o
                // browser usar o teclado padrão (alfanumérico com acesso
                // direto a +/- via "123" → "#+=").
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                value={arithmeticValue}
                onChange={(e) => onArithmeticChange?.(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onArithmeticSubmit?.(); }}
                placeholder={arithmeticPlaceholder}
                aria-label="Digite a operação"
                aria-invalid={arithmeticError}
                style={{
                  width: '100%', height: '100%', boxSizing: 'border-box',
                  textAlign: 'center',
                  fontSize: 18 * textScale, fontWeight: 700,
                  border: `2px solid ${arithmeticError ? 'var(--color-feedback-error-dark)' : 'var(--color-brand-otimath-pure)'}`,
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
  step, eventADescription, eventBDescription, nA, nB,
}: {
  step: VennSubStep; eventADescription: string; eventBDescription: string;
  nA: number; nB: number;
}) {
  if (step === 'intro') {
    return (
      <>
        <p className="ds-body text-neutral-black text-justify">
          Neste laboratório, você irá construir e analisar dois eventos no lançamento de dois dados:
        </p>
        <ul className="mt-nano mb-micro pl-[1.5rem] list-disc">
          <li className="ds-body text-neutral-black mb-quarck">
            <strong>Evento A:</strong> {toLowercaseArticle(eventADescription)}
          </li>
          <li className="ds-body text-neutral-black">
            <strong>Evento B:</strong> {toLowercaseArticle(eventBDescription)}
          </li>
        </ul>
        <p className="ds-body text-neutral-black text-justify">
          A partir desses eventos, observe:
        </p>
        <ul className="mt-nano mb-micro pl-[1.5rem] list-disc">
          <li className="ds-body text-neutral-black mb-quarck">quais resultados pertencem ao evento A;</li>
          <li className="ds-body text-neutral-black mb-quarck">quais pertencem ao evento B;</li>
          <li className="ds-body text-neutral-black mb-quarck">quais resultados pertencem aos <strong>dois eventos ao mesmo tempo</strong> (interseção);</li>
          <li className="ds-body text-neutral-black">e quais pertencem a <strong>pelo menos um dos eventos</strong> (união).</li>
        </ul>
        <p className="ds-body text-neutral-black text-justify">
          Ao final, você deverá identificar uma <strong>relação entre as quantidades</strong>:
        </p>
        <p className="ds-body-bold text-center mt-micro" style={{ color: 'var(--color-brand-otimath-dark)', fontSize: '1.1rem' }}>
          <span className="whitespace-nowrap">n(A ∪ B)</span>, <span className="whitespace-nowrap">n(A)</span>, <span className="whitespace-nowrap">n(B)</span> e <span className="whitespace-nowrap">n(A ∩ B)</span>
        </p>
      </>
    );
  }

  if (step === 'createIntersection') {
    return (
      <>
        <p className="ds-body text-neutral-black text-justify">
          Temos dois conjuntos A e B representados por diagramas. Eles estão separados — nenhum elemento em comum.
        </p>
        <p className="ds-body text-neutral-black mt-nano text-justify italic">
          Como você deveria dispor os diagramas A e B para que seja possível representar também <strong>A ∩ B</strong>, ou seja, os elementos que ocorrem em A e em B <strong>ao mesmo tempo</strong>?
        </p>
        <p className="ds-body text-neutral-black mt-nano text-justify">
          Aproxime os diagramas até que isso seja possível.
        </p>
      </>
    );
  }

  if (step === 'clickIntersection') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        <strong>Clique na região</strong> que representa <strong>A ∩ B</strong> — onde os elementos pertencem a A e a B ao mesmo tempo.
      </p>
    );
  }

  if (step === 'fillIntersection') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Agora clique no valor <strong className="whitespace-nowrap">n(A ∩ B)</strong> no topo da tela e, em seguida, clique na região correspondente no diagrama para depositá-lo.
      </p>
    );
  }

  if (step === 'identifyAMinusB') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Sabendo que <strong>n(A) = {nA}</strong>, em quantos pares ocorre A e <strong>não</strong> ocorre B?<br />
        <strong>Clique na região em que ocorre A − B</strong> (A menos B): casos em que ocorre A e não ocorre B.
      </p>
    );
  }

  if (step === 'fillAMinusB') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Qual operação dá <strong className="whitespace-nowrap">n(A − B)</strong>?
      </p>
    );
  }

  if (step === 'identifyBMinusA') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Analogamente: sabendo que <strong className="whitespace-nowrap">n(B)</strong> = {nB}, em quantos pares ocorre B e <strong>não</strong> ocorre A?<br />
        <strong>Clique na região em que ocorre B − A</strong> (B menos A): casos em que ocorre B e não ocorre A.
      </p>
    );
  }

  if (step === 'fillBMinusA') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Qual operação dá <strong className="whitespace-nowrap">n(B − A)</strong>?
      </p>
    );
  }

  if (step === 'markUnion') {
    return (
      <>
        <p className="ds-body text-neutral-black text-justify">
          A <strong>união</strong> de A e B, escrita <strong>A ∪ B</strong>, é o conjunto dos pares que pertencem a <strong>pelo menos um</strong> dos conjuntos — ou seja, pertencem a A, a B, ou a ambos.
        </p>
        <p className="ds-body text-neutral-black mt-nano text-justify">
          <strong>Clique em todas as regiões</strong> que fazem parte de A ∪ B e depois em <em>Confirmar seleção</em>.
        </p>
      </>
    );
  }

  if (step === 'unionCount') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Então, quantos casos são favoráveis ao evento <strong>A ou B</strong>? Escreva em forma de operação somando os valores das regiões do diagrama.
      </p>
    );
  }

  if (step === 'countAFromDiagram') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Observando apenas o que está no diagrama, escreva a operação que calcule <strong>n(A)</strong>.
      </p>
    );
  }

  if (step === 'countBFromDiagram') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Analogamente, como você calcularia <strong>n(B)</strong> observando o diagrama?
      </p>
    );
  }

  if (step === 'sumAB') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Agora, para escrever <strong>n(A) + n(B)</strong>, clique nas expressões que você acabou de construir — primeiro a de n(A) e depois a de n(B).
      </p>
    );
  }

  if (step === 'doubleCountQuestion') {
    return (
      <>
        <p className="ds-body text-neutral-black text-justify">
          Imagine que você contou cada caso favorável de A e em seguida cada caso favorável a B.
        </p>
        <p className="ds-body-bold text-neutral-black mt-nano text-justify">
          Qual região você contou <em>duas vezes</em>?
        </p>
      </>
    );
  }

  if (step === 'numericConclusion') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Como a região <strong>A ∩ B</strong> foi contada <strong>duas vezes</strong> ao somar <span className="whitespace-nowrap">n(A)</span> + <span className="whitespace-nowrap">n(B)</span>, precisamos <strong className="whitespace-nowrap">subtrair n(A ∩ B)</strong> uma vez para obter <span className="whitespace-nowrap">n(A ∪ B)</span>.
      </p>
    );
  }

  if (step === 'placeExpressions') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Clique em uma das expressões disponíveis para armá-la e, em seguida, clique na <strong>região correspondente</strong> do diagrama. Repita para as três expressões e depois clique em <em>Confirmar</em>.
      </p>
    );
  }

  if (step === 'writeUnionFormula') {
    return (
      <p className="ds-body text-neutral-black text-justify">
        Note pelo diagrama que <strong className="whitespace-nowrap">n(A ∪ B)</strong> é a soma das três regiões internas. Clique em cada região para preencher os três espaços indicados.
      </p>
    );
  }

  if (step === 'conclusion') {
    return (
      <p className="ds-body text-neutral-black text-center italic">
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
  unionCountError: boolean;
  validateUnionCount: () => void;
  countAInput: string;
  setCountAInput: (s: string) => void;
  countAAccepted: boolean;
  countAError: boolean;
  validateCountAFromDiagram: () => void;
  countBInput: string;
  setCountBInput: (s: string) => void;
  countBAccepted: boolean;
  countBError: boolean;
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
    unionCountInput, setUnionCountInput, unionCountAccepted, unionCountError, validateUnionCount,
    countAInput, setCountAInput, countAAccepted, countAError, validateCountAFromDiagram,
    countBInput, setCountBInput, countBAccepted, countBError, validateCountBFromDiagram,
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
          <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(A ∪ B) =</span>
          <ExpressionInput
            value={unionCountInput}
            onChange={setUnionCountInput}
            onSubmit={validateUnionCount}
            disabled={unionCountAccepted}
            placeholder="operação"
            error={unionCountError}
          />
        </div>
        {!unionCountAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateUnionCount} disabled={!unionCountInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center text-feedback-success-dark">
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
          <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(A) =</span>
          <ExpressionInput
            value={countAInput}
            onChange={setCountAInput}
            onSubmit={validateCountAFromDiagram}
            disabled={countAAccepted}
            placeholder="operação"
            error={countAError}
          />
        </div>
        {!countAAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateCountAFromDiagram} disabled={!countAInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center text-feedback-success-dark">
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
          <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(B) =</span>
          <ExpressionInput
            value={countBInput}
            onChange={setCountBInput}
            onSubmit={validateCountBFromDiagram}
            disabled={countBAccepted}
            placeholder="operação"
            error={countBError}
          />
        </div>
        {!countBAccepted ? (
          <Button style="primary" size="extra-small" onClick={validateCountBFromDiagram} disabled={!countBInput.trim()}>
            Conferir
          </Button>
        ) : (
          <>
            <p className="ds-body-bold text-center text-feedback-success-dark">
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
        <div className="flex items-center gap-x-micro gap-y-nano flex-wrap justify-center">
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
          className="flex items-center justify-center overflow-x-auto"
          style={{
            gap: 4,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--color-brand-otimath-lightest)',
            border: '1px solid var(--color-brand-otimath-light)',
          }}
        >
          <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(A) + n(B) =</span>
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
        <p className="ds-small text-neutral-dark italic">
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
          <p className="ds-body-bold text-center mb-nano text-brand-otimath-dark">
            Logo:
          </p>
          <p className="ds-body-bold text-center text-neutral-black">
            n(A ∪ B) ={' '}
            <span style={{ color: '#1e40af' }}>({countAInput})</span>
            {' '}+{' '}
            <span style={{ color: '#166534' }}>({countBInput})</span>
            {' '}−{' '}
            <span className="text-brand-otimath-dark">{nI}</span>
          </p>
          <p className="ds-body-bold text-center mt-nano text-neutral-black">
            n(A ∪ B) = {aMinusB} + {nI} + {bMinusA} = <strong>{nU}</strong>
          </p>
          <p className="ds-small text-center text-neutral-dark mt-micro italic">
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
          <p className="ds-body-bold mb-nano text-brand-otimath-dark">
            Sabemos que:
          </p>
          <p className="ds-body text-neutral-black text-justify">
            <strong>(i)</strong>&nbsp; n(A ∪ B) ={' '}
            <strong style={{ color: '#1e40af', whiteSpace: 'nowrap' }}>n(A − B)</strong>
            {' '}+ n(A ∩ B) +{' '}
            <strong style={{ color: '#166534', whiteSpace: 'nowrap' }}>n(B − A)</strong>.
          </p>

          {conclusionPhase >= 1 && (
            <p className="ds-body text-neutral-black mt-nano venn-fade-in text-justify">
              <strong>(ii)</strong>&nbsp;{' '}
              <span style={{ color: '#1e40af', whiteSpace: 'nowrap' }}>n(A − B) = n(A) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 2 && (
            <p className="ds-body text-neutral-black mt-nano venn-fade-in text-justify">
              <strong>(iii)</strong>&nbsp;{' '}
              <span style={{ color: '#166534', whiteSpace: 'nowrap' }}>n(B − A) = n(B) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 3 && (
            <p className="ds-body text-neutral-black mt-micro venn-fade-in text-justify">
              Substituindo as expressões de <strong>(ii)</strong> e <strong>(iii)</strong> em <strong>(i)</strong>, temos:
            </p>
          )}

          {conclusionPhase >= 4 && (
            <p className="ds-body-bold text-center mt-nano text-neutral-black venn-fade-in">
              n(A ∪ B) ={' '}
              <span style={{ color: '#1e40af', whiteSpace: 'nowrap' }}>n(A) − n(A ∩ B)</span>
              {' '}+ n(A ∩ B) +{' '}
              <span style={{ color: '#166534', whiteSpace: 'nowrap' }}>n(B) − n(A ∩ B)</span>
            </p>
          )}

          {conclusionPhase >= 5 && (
            <p className="ds-body text-neutral-black mt-micro venn-fade-in text-justify">
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
            <p className="ds-small text-center text-neutral-dark mt-micro venn-fade-in italic">
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
      className="flex justify-center items-center flex-wrap mb-micro gap-micro"
     
    >
      <span className="ds-body-bold text-neutral-black mr-nano">Dados:</span>
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
    <div className="flex flex-col items-center mt-nano mb-nano gap-quarck">
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
      className="flex justify-center items-center flex-wrap mb-micro gap-micro"
     
    >
      <span className="ds-body-bold text-neutral-black mr-nano">Expressões:</span>
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
    // Wrapper externo centra horizontalmente; o conteúdo expansível fica
    // num filho com overflow-x-auto + maxWidth 100% pra que, quando os
    // 3 slots + operadores não couberem no viewport mobile, ROLEM dentro
    // da caixa em vez de serem CORTADOS. Antes era um único div com
    // `maxWidth: 'fit-content'` + `margin: 0 auto` — quando o conteúdo
    // ficava mais largo que o pai, o div esticava além da viewport (centro
    // empurrando partes pra fora) e o overflow-x-auto não tinha pai
    // constrangido pra ativar o scroll.
    <div className="flex justify-center mb-micro" style={{ maxWidth: '100%' }}>
      <div
        className="flex items-center overflow-x-auto"
        style={{
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          background: 'var(--color-brand-otimath-lightest)',
          border: '1px solid var(--color-brand-otimath-light)',
          maxWidth: '100%',
        }}
      >
        <span className="ds-body-bold" style={{ color: COLOR_U, whiteSpace: 'nowrap' }}>n(A ∪ B) =</span>
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
                flexShrink: 0,
              }}
            >
              {slot || '__'}
            </span>
            {i < slots.length - 1 && <span className="ds-body-bold text-neutral-black" style={{ flexShrink: 0 }}>+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente: input de expressão aritmética (soma de termos)
// Usado nas sub-etapas unionCount / countAFromDiagram / countBFromDiagram
// ═══════════════════════════════════════════════════════════════
function ExpressionInput({
  value, onChange, onSubmit, disabled, placeholder, error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  error?: boolean;
}) {
  return (
    <input
      type="text"
      // Sem inputMode explícito — type="text" puro garante teclado padrão
      // no mobile (com acesso a +/-). inputMode="text" ainda causava o
      // teclado numérico abrir em alguns mobile browsers que mal-aplicavam
      // heurísticas baseadas em outros atributos.
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !disabled) onSubmit(); }}
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Digite a operação"
      aria-invalid={error}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: `2px solid ${error ? 'var(--color-feedback-error-dark)' : 'var(--color-brand-otimath-pure)'}`,
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
        <p className="ds-body-bold text-center text-feedback-success-dark">
          ✓ {computedDisplay}
        </p>
      )}
    </div>
  );
}
