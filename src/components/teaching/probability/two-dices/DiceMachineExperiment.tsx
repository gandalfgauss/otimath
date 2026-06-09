'use client'

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, type RefObject } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { DiceMachineSceneHandle } from './DiceMachineScene';
import { STEP_NAMES } from './DiceMachineScene';
import type { AlertType } from '@/components/global/Alert';
import {
  telemetryEnterExercise,
  telemetryExitExercise,
} from '@/hooks/teaching/probability/useTelemetry';

// Handle exposto ao pai (TwoDicesPresentation) para o painel DEV
// avançar a Cena 6 simulando a interação natural do aluno em cada fase.
export interface DiceMachineExperimentHandle {
  /** ID textual da fase atual — entra no cenaId DEV. */
  getCurrentPhaseId: () => string;
  /** Simula a próxima ação correta do aluno na fase atual.
   *  Em fases que envolvem rolagem 3D, pula direto para a próxima fase
   *  sem aguardar a animação. */
  advance: () => void;
  /** Restaura a fase a partir de um snapshot DEV. */
  setCurrentPhaseId: (phaseId: string) => void;
}

// ═══════ Constantes de design (alinhadas ao Design System OtiMath) ═══════
// Tamanhos pensados para mobile-first (>= 320 px). Alvos de toque
// respeitam WCAG 2.5.5 Target Size (Level AAA: 44 px; aqui usamos 56 px
// como mínimo confortável para dedo de adulto na escola brasileira).
const PICKER_PLACEHOLDER_SIZE = 64;   // ícone do par ordenado (visualmente prominente)
const PICKER_CELL_SIZE = 56;           // alvo de toque dentro do popover (≥ WCAG AAA)
const RESULT_FACE_SIZE = 56;           // ícones no card de resultado

// Tempo de ciclo do placeholder animado (cicla 1→6 → 1...). 280 ms
// é rápido o suficiente para sugerir movimento sem causar incômodo.
// Respeita prefers-reduced-motion (interrompe o ciclo).
const PLACEHOLDER_CYCLE_MS = 280;

// Cores vivas (paleta OtiMath em estado saturado)
// O verde da face do dado é mantido em #1a5c2e por consistência visual
// com TwoDicesExperiment e TwoDicesPractice. Para acentos da UI usamos
// um verde mais vivo (#22a155) que destaca melhor em fundos claros.
const COLOR_GREEN_DICE = '#1a5c2e';    // face do dado verde (consistência)
const COLOR_GREEN_VIVID = '#22a155';   // acento verde vivo (UI / textos)

/* ═══════════════════════════════════════════════════════════════
   DiceMachineExperiment — Cena 6 (REORDENAMENTO DIDÁTICO v2)
   ─────────────────────────────────────────────────────────────────
   PERCEPÇÃO do acaso bidimensional ANTES da sistematização tabular.
   Justificativa científica (Brousseau 1997, Freudenthal 1991,
   Cazorla & Santana 2010, Borovcnik 2011, Garfield & Ben-Zvi 2008,
   Trouche 2004): a fase de Ação com o fenômeno físico precede
   obrigatoriamente a fase de Formulação simbólica.

   ESCALADA COGNITIVA EM 3 LANÇAMENTOS (Bruner 1966, enactive →
   iconic → symbolic):

     L1 OBSERVAR + REGISTRAR
        └── picker visual de faces (verde 2×3, azul 3×2)
            registro do par ordenado (DUVAL 1995)

     L2 OPERAR (somar)
        └── picker visual + cálculo da soma
            ancoragem prospectiva (AUSUBEL 1968) — "guarde a soma"

     L3 PREVER + JUSTIFICAR (previsão metacognitiva)
        └── previsão da soma + radio de motivo
            externalização do viés (FLAVELL 1979, LECOUTRE 1992)
            feedback adidático (BROUSSEAU 1997, p. 47):
            o milieu devolve a dúvida sem julgar.
            ⚠ Vocabulário: "previsão", "ocorreu / não ocorreu",
            JAMAIS "aposta", "errou", "perdeu" (DWECK 2006,
            CAZORLA & SANTANA 2010).

   Ponte para a Cena 7 (tabela 6×6) preserva a pergunta viva:
   "será que é só acaso ou existe um padrão escondido?".

   Responsividade: mobile-first, alvos de toque ≥ 56 px,
   breakpoints até 320 px. Acessibilidade: WCAG 2.1 AA,
   aria-labels, navegação por teclado, focus-visible,
   prefers-reduced-motion respeitado.
   ═══════════════════════════════════════════════════════════════ */

// ═══════ Faces do dado com pintas (idêntico ao TwoDicesExperiment) ═══════
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [0, 0, 1, 0, 0, 0, 1, 0, 0],
  3: [0, 0, 1, 0, 1, 0, 1, 0, 0],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

type DieColor = 'blue' | 'green';

function DiceFaceIcon({
  face,
  size,
  color = 'blue',
  ariaHidden = false,
}: {
  face: number;
  size: number;
  color?: DieColor;
  ariaHidden?: boolean;
}) {
  const pips = PIP_PATTERNS[face] ?? PIP_PATTERNS[1];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? COLOR_GREEN_DICE : 'var(--color-brand-otimath-dark)';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : `Face ${face} do dado ${color === 'green' ? 'verde' : 'azul'}`}
      role={ariaHidden ? undefined : 'img'}
    >
      {pips.map((pip, i) => (
        <div key={i} className="flex items-center justify-center">
          {pip ? (
            <div
              style={{
                width: pipSize,
                height: pipSize,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ═══════ Placeholder animado: cicla as 6 faces até o aluno escolher ═══════
function AnimatedFacePlaceholder({ size, color }: { size: number; color: DieColor }) {
  const [face, setFace] = useState(1);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    // Respeita prefers-reduced-motion (WCAG 2.3.3)
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    reduceMotionRef.current = !!mq?.matches;
    if (reduceMotionRef.current) return;
    const id = setInterval(() => setFace(f => (f % 6) + 1), PLACEHOLDER_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return <DiceFaceIcon face={face} size={size} color={color} ariaHidden />;
}

// ═══════ FacePicker — popover com grid 2×3 (verde) ou 3×2 (azul) ═══════
interface FacePickerProps {
  color: DieColor;
  selected: number | null;
  onPick: (face: number) => void;
  errorState: boolean;
  size?: number;
}

function FacePicker({ color, selected, onPick, errorState, size = PICKER_PLACEHOLDER_SIZE }: FacePickerProps) {
  const [open, setOpen] = useState(false);
  const [popPlacement, setPopPlacement] = useState<'bottom' | 'top'>('bottom');
  const [focusIdx, setFocusIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const faceBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Verde: 2 colunas × 3 linhas (visualmente "vertical" — paridade com
  // o eixo das linhas da tabela 6×6 da Cena 7).
  // Azul: 3 colunas × 2 linhas (visualmente "horizontal" — paridade com
  // o eixo das colunas da tabela 6×6 da Cena 7).
  const gridCols = color === 'green' ? 2 : 3;
  const cellSize = PICKER_CELL_SIZE;

  // Click fora fecha — pointerdown unifica mouse+touch+pen e evita race
  // conditions entre mousedown/touchstart em Firefox mobile e Safari iOS.
  // passive:true porque só consultamos o target; nunca preventDefault().
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handler);
    };
  }, [open]);

  // Posicionamento inteligente: se overflow inferior, abre acima
  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const popoverHeight = Math.ceil(6 / gridCols) * (cellSize + 8) + 24 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
      setPopPlacement('top');
    } else {
      setPopPlacement('bottom');
    }
  }, [open, gridCols, cellSize]);

  // Foco automático na face já selecionada (ou primeira) ao abrir
  useEffect(() => {
    if (!open) return;
    const initialIdx = selected ? selected - 1 : 0;
    setFocusIdx(initialIdx);
    // Aguarda o DOM montar
    requestAnimationFrame(() => {
      faceBtnRefs.current[initialIdx]?.focus();
      // Garante que popover está visível
      popoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [open, selected]);

  // Esc fecha + foco volta para o botão-placeholder (a11y)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        placeholderBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Navegação por setas dentro do popover
  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    const total = 6;
    let next = focusIdx;
    if (e.key === 'ArrowRight') next = (focusIdx + 1) % total;
    else if (e.key === 'ArrowLeft') next = (focusIdx - 1 + total) % total;
    else if (e.key === 'ArrowDown') next = (focusIdx + gridCols) % total;
    else if (e.key === 'ArrowUp') next = (focusIdx - gridCols + total) % total;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = total - 1;
    else return;
    e.preventDefault();
    setFocusIdx(next);
    faceBtnRefs.current[next]?.focus();
  };

  const colorName = color === 'green' ? 'verde' : 'azul';
  const accentColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-pure)';
  const borderColor = errorState
    ? 'var(--color-feedback-error-dark)'
    : selected
      ? accentColor
      : 'var(--color-neutral-light)';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botão-placeholder (clicável) */}
      <button
        ref={placeholderBtnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          selected
            ? `Dado ${colorName} selecionado: face ${selected}. Toque para alterar.`
            : `Escolher face do dado ${colorName}`
        }
        style={{
          background: 'transparent',
          border: `3px solid ${borderColor}`,
          borderRadius: 14,
          padding: 6,
          cursor: 'pointer',
          touchAction: 'manipulation',
          display: 'inline-block',
          minWidth: 56,
          minHeight: 56,
          transition: 'border-color 0.2s, transform 0.1s, box-shadow 0.2s',
        }}
        onTouchStart={e => {
          e.currentTarget.style.transform = 'scale(0.96)';
        }}
        onTouchEnd={e => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onFocus={e => {
          e.currentTarget.style.boxShadow = `0 0 0 4px ${accentColor}55`;
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {selected ? (
          <DiceFaceIcon face={selected} size={size} color={color} ariaHidden />
        ) : (
          <AnimatedFacePlaceholder size={size} color={color} />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={`Faces do dado ${colorName}`}
          aria-activedescendant={`face-${color}-${focusIdx + 1}`}
          onKeyDown={handleGridKeyDown}
          style={{
            position: 'absolute',
            ...(popPlacement === 'bottom'
              ? { top: 'calc(100% + 8px)' }
              : { bottom: 'calc(100% + 8px)' }),
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-neutral-white)',
            border: `2px solid ${accentColor}`,
            borderRadius: 14,
            padding: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
            zIndex: 100,
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
            gap: 8,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((face, idx) => (
            <button
              key={face}
              id={`face-${color}-${face}`}
              ref={el => { faceBtnRefs.current[idx] = el; }}
              type="button"
              role="option"
              tabIndex={focusIdx === idx ? 0 : -1}
              aria-selected={selected === face}
              aria-label={`Face ${face} do dado ${colorName}`}
              onClick={() => {
                onPick(face);
                setOpen(false);
                placeholderBtnRef.current?.focus();
              }}
              style={{
                width: cellSize,
                height: cellSize,
                padding: 0,
                background: 'transparent',
                border:
                  selected === face
                    ? `3px solid ${accentColor}`
                    : '2px solid var(--color-neutral-lighter)',
                borderRadius: 10,
                cursor: 'pointer',
                touchAction: 'manipulation',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onFocus={e => {
                e.currentTarget.style.outline = `3px solid ${accentColor}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={e => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <DiceFaceIcon face={face} size={cellSize - 14} color={color} ariaHidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════ Tipos de fase do experimento ═══════
type Phase =
  | 'intro'           // Card de transição (após Cena 5)
  | 's1-ready'        // L1: pronto para lançar
  | 's1-rolling'      // L1: máquina lançando
  | 's1-pick'         // L1: pickers para registrar par
  | 's1-correct'      // L1: par correto, transição
  | 's2-ready'        // L2: pronto para lançar
  | 's2-rolling'
  | 's2-pick'         // L2: pickers para registrar par
  | 's2-sum'          // L2: input da soma
  | 's2-correct'      // L2: tudo certo
  | 's3-predict'      // L3: previsão + justificativa (ANTES de lançar)
  | 's3-rolling'
  | 's3-pick'         // L3: pickers para registrar par (mesmo gesto de L1/L2)
  | 's3-sum'          // L3: input da soma (antes de comparar com previsão)
  | 's3-reflect'      // L3: feedback adidático
  | 'bridge';         // Fechamento + ponte para Cena 7

// ═══════ Props ═══════
interface DiceMachineExperimentProps {
  diceMachineRef: RefObject<DiceMachineSceneHandle | null>;
  diceContainerRef: RefObject<HTMLDivElement | null>;
  onFinished: () => void;
  /** Notifica o pai quando a fase interna muda — usado pelo painel DEV
   *  para construir um cenaId que reflete a sub-cena ativa da Cena 6. */
  onPhaseChange?: (phaseId: string) => void;
  /** Cria um toast alert via o sistema de alerts do pai (TwoDicesPresentation).
   *  Usado pelas validações para feedback consistente com o resto do OVA. */
  createAlert?: (title: string, description: string, type: AlertType, timeout?: number) => void;
}

// ═══════ Componente principal ═══════
export const DiceMachineExperiment = forwardRef<DiceMachineExperimentHandle, DiceMachineExperimentProps>(
  function DiceMachineExperiment({
    diceMachineRef,
    diceContainerRef,
    onFinished,
    onPhaseChange,
    createAlert,
  }, ref) {
  const [phase, setPhase] = useState<Phase>('intro');

  // Telemetria — cada um dos 3 lançamentos (L1, L2, L3) é um exercício distinto.
  // O prefix da fase (`s1-`, `s2-`, `s3-`) determina qual lançamento está ativo.
  // `intro` e `bridge` (transição final) não registram.
  useEffect(() => {
    if (phase === 'intro' || phase === 'bridge') return;
    let id: string, title: string, descricao: string;
    if (phase.startsWith('s1')) {
      id = 'twoDices-cena6-lancamento-1';
      title = 'Máquina de dois dados — Lançamento 1 (observação)';
      descricao = 'Aluno aciona a máquina, observa o par (verde, azul) e registra via pickers.';
    } else if (phase.startsWith('s2')) {
      id = 'twoDices-cena6-lancamento-2';
      title = 'Máquina de dois dados — Lançamento 2 (observação + soma)';
      descricao = 'Registro do par + cálculo da soma das faces.';
    } else if (phase.startsWith('s3')) {
      id = 'twoDices-cena6-lancamento-3';
      title = 'Máquina de dois dados — Lançamento 3 (previsão)';
      descricao = 'Aluno faz previsão da soma ANTES do lançamento + justificativa, depois compara.';
    } else {
      return;
    }
    telemetryEnterExercise(id, title, descricao);
    return () => telemetryExitExercise(id);
  }, [phase]);

  // Resultado do lançamento atual
  const [blueResult, setBlueResult] = useState<number | null>(null);
  const [greenResult, setGreenResult] = useState<number | null>(null);

  // Estado da máquina (para barra de progresso)
  const [stepIdx, setStepIdx] = useState(-1);
  const [statusMsg, setStatusMsg] = useState('');
  // `runningRef` é a guarda síncrona dura — usada dentro de launchMachine para
  // evitar re-entrada quando o handler do botão dispara várias vezes seguidas
  // (ex.: double-tap mobile, eventos pointer + click do mesmo gesto).
  // `isLaunching` é o espelho React — provoca re-render que desabilita o botão
  // visualmente, fazendo `disabled:pointer-events-none` bloquear cliques
  // subsequentes antes mesmo de chegarem no onClick.
  const runningRef = useRef(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Picker (par ordenado) — usado em L1 e L2
  const [pickedGreen, setPickedGreen] = useState<number | null>(null);
  const [pickedBlue, setPickedBlue] = useState<number | null>(null);
  const [pickGreenError, setPickGreenError] = useState(false);
  const [pickBlueError, setPickBlueError] = useState(false);
  const [pickFeedback, setPickFeedback] = useState('');

  // Soma (L2)
  const [sumInput, setSumInput] = useState('');
  const [sumError, setSumError] = useState(false);
  const [sumFeedback, setSumFeedback] = useState('');

  // Previsão (L3)
  const [predictionInput, setPredictionInput] = useState('');
  const [predictionError, setPredictionError] = useState('');
  const [predictionReason, setPredictionReason] = useState<'equip' | 'maisChance' | 'intuicao' | ''>('');
  const [predictionReasonError, setPredictionReasonError] = useState(false);

  // Polling do estado da máquina (atualiza StepBar e mensagem)
  useEffect(() => {
    if (phase !== 's1-rolling' && phase !== 's2-rolling' && phase !== 's3-rolling') return;
    const id = setInterval(() => {
      const idx = diceMachineRef.current?.getCurrentStep();
      const lbl = diceMachineRef.current?.getCurrentLabel();
      if (typeof idx === 'number') setStepIdx(idx);
      if (typeof lbl === 'string' && lbl.length > 0) setStatusMsg(lbl);
    }, 100);
    return () => clearInterval(id);
  }, [phase, diceMachineRef]);

  // Scroll suave para o container da máquina (topo visível)
  const scrollToScene = useCallback(() => {
    if (diceContainerRef.current) {
      diceContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [diceContainerRef]);

  // Reseta picker e feedbacks
  const resetPicker = useCallback(() => {
    setPickedGreen(null);
    setPickedBlue(null);
    setPickGreenError(false);
    setPickBlueError(false);
    setPickFeedback('');
  }, []);

  // ═══════ Lançamento da máquina (compartilhado pelas 3 etapas) ═══════
  const launchMachine = useCallback(
    async (rollingPhase: Phase, nextPhase: Phase) => {
      if (runningRef.current || !diceMachineRef.current) return;
      runningRef.current = true;
      setIsLaunching(true);
      setBlueResult(null);
      setGreenResult(null);
      setStepIdx(-1);
      setStatusMsg(STEP_NAMES[0] ?? '');
      setPhase(rollingPhase);
      // Aguarda o React re-renderizar a fase rolling antes de fazer scroll,
      // evitando disputa entre reflow (card desmontado) e scrollIntoView.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      scrollToScene();
      try {
        const result = await diceMachineRef.current.roll();
        setBlueResult(result.blue);
        setGreenResult(result.green);
        setStepIdx(STEP_NAMES.length - 1);
        setStatusMsg('Os dois dados pararam.');
        playSound('/sounds/correct.mp3');
        setPhase(nextPhase);
        // Feedback ao aluno após os dois dados pararem — instrui a registrar
        // o resultado e responder à pergunta no card abaixo.
        createAlert?.(
          'Dados parados!',
          'Observe a face de cima de cada dado e registre o par (verde, azul) no card abaixo.',
          'info',
          5000,
        );
      } finally {
        runningRef.current = false;
        setIsLaunching(false);
      }
    },
    [diceMachineRef, scrollToScene, createAlert],
  );

  // Rola pro topo do OVA em todo Conferir. Mirror do checkAnswer do Disco.
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ═══════ Validação do picker (L1 e L2) ═══════
  const validatePair = useCallback(
    (onSuccess: () => void) => {
      scrollDiceToTop();
      if (pickedGreen == null) {
        setPickGreenError(true);
        setPickFeedback('Toque no dado verde e escolha a face que apareceu.');
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Faltou o dado verde', 'Toque no dado verde e escolha a face que apareceu.', 'error', 4000);
        return;
      }
      if (pickedBlue == null) {
        setPickBlueError(true);
        setPickFeedback('Toque no dado azul e escolha a face que apareceu.');
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Faltou o dado azul', 'Toque no dado azul e escolha a face que apareceu.', 'error', 4000);
        return;
      }
      const greenOk = pickedGreen === greenResult;
      const blueOk = pickedBlue === blueResult;
      if (greenOk && blueOk) {
        setPickGreenError(false);
        setPickBlueError(false);
        setPickFeedback('');
        playSound('/sounds/correct.mp3');
        createAlert?.('Par registrado!', `(verde, azul) = (${greenResult}, ${blueResult}).`, 'success', 3000);
        onSuccess();
      } else {
        setPickGreenError(!greenOk);
        setPickBlueError(!blueOk);
        let msg: string;
        if (!greenOk && !blueOk) {
          msg = 'Releia os dois dados na máquina. Toque em cada um e escolha de novo a face que apareceu.';
        } else if (!greenOk) {
          msg = 'Releia o dado verde. Toque nele e escolha a face que realmente apareceu.';
        } else {
          msg = 'Releia o dado azul. Toque nele e escolha a face que realmente apareceu.';
        }
        setPickFeedback(msg);
        playSound('/sounds/incorrect.mp3');
        createAlert?.('Tente novamente', msg, 'error', 4500);
      }
    },
    [pickedGreen, pickedBlue, greenResult, blueResult, createAlert],
  );

  // ═══════ Validação da soma (L2 e L3) ═══════
  const validateSum = useCallback((nextPhase: Phase = 's2-correct') => {
    scrollDiceToTop();
    const v = parseInt(sumInput.trim(), 10);
    if (isNaN(v)) {
      setSumError(true);
      setSumFeedback('Digite um número inteiro.');
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Campo inválido', 'Digite um número inteiro.', 'error', 4000);
      return;
    }
    const expected = (greenResult ?? 0) + (blueResult ?? 0);
    if (v === expected) {
      setSumError(false);
      setSumFeedback('');
      playSound('/sounds/correct.mp3');
      createAlert?.('Soma correta!', `${greenResult} + ${blueResult} = ${expected}.`, 'success', 3000);
      setPhase(nextPhase);
    } else {
      setSumError(true);
      const msg = `Some ${greenResult} (verde) com ${blueResult} (azul) e tente de novo.`;
      setSumFeedback(msg);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', msg, 'error', 4000);
    }
  }, [sumInput, greenResult, blueResult, createAlert]);

  // ═══════ Validação da previsão (L3) ═══════
  const validatePrediction = useCallback(() => {
    scrollDiceToTop();
    const v = parseInt(predictionInput.trim(), 10);
    let hasError = false;
    if (isNaN(v) || v < 2 || v > 12) {
      setPredictionError('Escolha um número inteiro entre 2 e 12.');
      hasError = true;
    } else {
      setPredictionError('');
    }
    if (!predictionReason) {
      setPredictionReasonError(true);
      hasError = true;
    } else {
      setPredictionReasonError(false);
    }
    if (hasError) {
      playSound('/sounds/incorrect.mp3');
      createAlert?.(
        'Complete os campos',
        (isNaN(v) || v < 2 || v > 12)
          ? 'Escolha um número inteiro entre 2 e 12 e selecione uma justificativa.'
          : 'Selecione uma justificativa para sua previsão.',
        'error',
        4500,
      );
      return;
    }
    createAlert?.('Previsão registrada', `Você apostou na soma ${v}. Vamos lançar a máquina.`, 'info', 3000);
    // Lança a máquina — após pousar, aluno registra par + soma antes do reflect
    resetPicker();
    setSumInput('');
    setSumError(false);
    setSumFeedback('');
    void launchMachine('s3-rolling', 's3-pick');
  }, [predictionInput, predictionReason, launchMachine, resetPicker, createAlert]);

  // ═══════ Avanço entre etapas ═══════
  const goToS2 = useCallback(() => {
    resetPicker();
    setSumInput('');
    setSumError(false);
    setSumFeedback('');
    setBlueResult(null);
    setGreenResult(null);
    setStepIdx(-1);
    setStatusMsg('');
    setPhase('s2-ready');
    playSound('/sounds/nextChallenge.mp3');
    createAlert?.(
      'Lançamento 2: observação',
      'Mais uma vez — observe o lançamento e registre o par (verde, azul) que sair.',
      'info',
      4500,
    );
  }, [resetPicker, createAlert]);

  const goToS3 = useCallback(() => {
    resetPicker();
    setSumInput('');
    setSumError(false);
    setSumFeedback('');
    setPredictionInput('');
    setPredictionError('');
    setPredictionReason('');
    setPredictionReasonError(false);
    setBlueResult(null);
    setGreenResult(null);
    setStepIdx(-1);
    setStatusMsg('');
    setPhase('s3-predict');
    playSound('/sounds/nextChallenge.mp3');
    createAlert?.(
      'Lançamento 3: previsão',
      'Agora é diferente — antes da máquina lançar, você vai fazer uma previsão da soma.',
      'info',
      4500,
    );
  }, [resetPicker, createAlert]);

  const goToBridge = useCallback(() => {
    setPhase('bridge');
    playSound('/sounds/nextChallenge.mp3');
    createAlert?.(
      'Quase lá',
      'Você completou as três etapas. Avance para descobrir o padrão escondido por trás dos lançamentos.',
      'info',
      4500,
    );
  }, [createAlert]);

  // ═══════ Indicador de etapas (L1, L2, L3) ═══════
  const StageIndicator = (
    <div className="flex flex-col items-center mb-micro">
      <div
        className="flex items-center justify-center gap-x-micro"
        role="progressbar"
        aria-label="Progresso das três etapas"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={
          phase === 'intro'
            ? 0
            : phase.startsWith('s1')
              ? 1
              : phase.startsWith('s2')
                ? 2
                : 3
        }
      >
        {[1, 2, 3].map(s => {
        const current =
          (s === 1 && phase.startsWith('s1')) ||
          (s === 2 && phase.startsWith('s2')) ||
          (s === 3 && (phase.startsWith('s3') || phase === 'bridge'));
        const done =
          (s === 1 && (phase.startsWith('s2') || phase.startsWith('s3') || phase === 'bridge')) ||
          (s === 2 && (phase.startsWith('s3') || phase === 'bridge')) ||
          (s === 3 && phase === 'bridge');
        const bg = done
          ? '#1a5c2e'
          : current
            ? 'var(--color-brand-otimath-pure)'
            : 'var(--color-neutral-lighter)';
        return (
          <div key={s} className="flex flex-col items-center gap-y-nano">
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: bg,
                transition: 'background 0.3s',
              }}
              aria-hidden
            />
            <span className="ds-caption text-neutral-dark">{s}</span>
          </div>
        );
      })}
      </div>
    </div>
  );

  // ═══════ Barra de progresso de 11 etapas mecânicas ═══════
  const renderStepBar = () => (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={STEP_NAMES.length}
      aria-valuenow={Math.max(0, stepIdx + 1)}
      aria-label="Progresso mecânico do lançamento"
      style={{
        display: 'flex',
        gap: 3,
        marginTop: 12,
        width: '100%',
        maxWidth: 758,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {STEP_NAMES.map((name, i) => {
        const done = i < stepIdx;
        const active = i === stepIdx;
        let bg = 'var(--color-neutral-lighter)';
        let color = 'var(--color-neutral-medium)';
        let outline = 'none';
        if (done) {
          bg = '#1a5c2e';
          color = '#fff';
        }
        if (active) {
          bg = 'var(--color-brand-otimath-dark)';
          color = '#fff';
          outline = '2px solid var(--color-brand-otimath-pure)';
        }
        return (
          <div
            key={name}
            style={{
              flex: 1,
              minHeight: 22,
              borderRadius: 4,
              background: bg,
              color,
              outline,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              padding: '0 2px',
              textAlign: 'center',
              transition: 'background .2s, color .2s',
            }}
          >
            {name}
          </div>
        );
      })}
    </div>
  );

  // ═══════ Bloco do par ordenado (picker visual) ═══════
  const renderPairPicker = () => (
    <div className="flex flex-col items-center gap-y-micro mb-xxxs">
      <p className="ds-body-bold text-neutral-black text-center">
        Registre o par ordenado{' '}
        <strong style={{ color: COLOR_GREEN_VIVID }}>(verde,</strong>{' '}
        <strong className="text-brand-otimath-pure">azul)</strong>:
      </p>
      <div
        className="flex items-center justify-center"
        style={{ gap: 12, flexWrap: 'wrap' }}
      >
        <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
          (
        </span>
        <FacePicker
          color="green"
          selected={pickedGreen}
          onPick={f => {
            setPickedGreen(f);
            setPickGreenError(false);
            setPickFeedback('');
          }}
          errorState={pickGreenError}
        />
        <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
          ,
        </span>
        <FacePicker
          color="blue"
          selected={pickedBlue}
          onPick={f => {
            setPickedBlue(f);
            setPickBlueError(false);
            setPickFeedback('');
          }}
          errorState={pickBlueError}
        />
        <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
          )
        </span>
      </div>
      {pickFeedback && (
        <p
          role="alert"
          aria-live="assertive"
          className="ds-small-bold text-center"
          style={{ color: 'var(--color-feedback-error-dark)', maxWidth: 360 }}
        >
          {pickFeedback}
        </p>
      )}
    </div>
  );

  // ═══════ Card resultado (par exibido após pickagem correta) ═══════
  const renderResultCard = (showSum: boolean) => {
    if (blueResult == null || greenResult == null) return null;
    return (
      <div
        className="bg-neutral-white rounded-lg p-xxs"
        style={{
          marginTop: 8,
          marginBottom: 16,
          border: '1px solid var(--color-neutral-lighter)',
        }}
      >
        <p className="ds-small-bold text-brand-otimath-darkest mb-micro text-center">
          A máquina deu:
        </p>
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
            (
          </span>
          <DiceFaceIcon face={greenResult} size={RESULT_FACE_SIZE} color="green" />
          <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
            ,
          </span>
          <DiceFaceIcon face={blueResult} size={RESULT_FACE_SIZE} color="blue" />
          <span className="ds-heading-extra text-neutral-darkest" aria-hidden>
            )
          </span>
        </div>
        {/* Confirmação numérica: (x, y) */}
        <p
          className="ds-body-bold text-center"
          style={{
            marginTop: 8,
            color: 'var(--color-neutral-darkest)',
            animation: 'fadeInNumericPair 0.6s ease-in',
          }}
        >
          <span aria-hidden className="text-neutral-dark">=  </span>
          <span className="text-neutral-darkest">(</span>
          <span style={{ color: COLOR_GREEN_VIVID, fontWeight: 700 }}>{greenResult}</span>
          <span className="text-neutral-darkest">, </span>
          <span className="text-brand-otimath-pure font-bold">{blueResult}</span>
          <span className="text-neutral-darkest">)</span>
        </p>
        {showSum && (
          <p className="ds-body-bold text-center mt-micro text-neutral-darkest">
            Soma = {greenResult + blueResult}
          </p>
        )}
      </div>
    );
  };

  // ═══════ Notificação de mudança de fase para o pai (cenaId DEV) ═══════
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // ═══════ Handle exposto ao painel DEV ═══════
  // Avança simulando a interação natural do aluno em cada fase. Pula
  // animações de rolagem (3D) direto para a próxima fase relevante.
  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => phase,
    advance: () => {
      switch (phase) {
        case 'intro':       setPhase('s1-ready'); return;
        case 's1-ready':    setPhase('s1-pick'); return;
        case 's1-rolling':  setPhase('s1-pick'); return;
        case 's1-pick':     setPhase('s1-correct'); return;
        case 's1-correct':  setPhase('s2-ready'); return;
        case 's2-ready':    setPhase('s2-pick'); return;
        case 's2-rolling':  setPhase('s2-pick'); return;
        case 's2-pick':     setPhase('s2-sum'); return;
        case 's2-sum':      setPhase('s2-correct'); return;
        case 's2-correct':  setPhase('s3-predict'); return;
        case 's3-predict':  setPhase('s3-pick'); return;
        case 's3-rolling':  setPhase('s3-pick'); return;
        case 's3-pick':     setPhase('s3-sum'); return;
        case 's3-sum':      setPhase('s3-reflect'); return;
        case 's3-reflect':  setPhase('bridge'); return;
        case 'bridge':      onFinished(); return;
      }
    },
    setCurrentPhaseId: (phaseId: string) => {
      setPhase(phaseId as typeof phase);
    },
  }), [phase, onFinished]);

  // ═══════ RENDER ═══════
  return (
    <div className="w-full" style={{ maxWidth: 720, margin: '0 auto', marginTop: 16 }}>
      {/* Keyframe para fade-in do par numérico */}
      <style>{`@keyframes fadeInNumericPair{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Título */}
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Máquina de lançar dois dados
      </h2>

      {/* ═══════ INTRO — card de transição (após a Cena 5) ═══════ */}
      {phase === 'intro' && (
        <div
          className="rounded-lg p-xxs"
          style={{
            background:
              'linear-gradient(180deg, var(--color-brand-otimath-lightest) 0%, var(--color-neutral-white) 100%)',
            border: '2px solid var(--color-brand-otimath-light)',
            boxShadow: '0 4px 16px rgba(36, 80, 190, 0.10)',
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            De um para dois dados
          </p>
          <p className="ds-body text-neutral-black text-justify">
            Você domina o experimento com <strong>um dado</strong>. Agora vamos lançar{' '}
            <strong>dois</strong> — um{' '}
            <strong style={{ color: COLOR_GREEN_VIVID }}>verde</strong> e um{' '}
            <strong className="text-brand-otimath-pure">azul</strong>.
          </p>
          <p className="ds-body text-neutral-black mt-micro text-justify">
            Antes de organizar tudo numa tabela, <strong>observe o fenômeno</strong>: o
            processo é mecânico, mas o par <strong>(verde, azul)</strong> continua imprevisível.
          </p>
          <p className="ds-body text-neutral-black mt-micro text-justify">
            Você fará <strong>3 lançamentos</strong>: nos dois primeiros, vai observar e
            registrar o resultado; no terceiro, fará uma <strong>previsão</strong> antes da
            máquina lançar.
          </p>
          <div className="flex justify-center mt-macro">
            <Button
              style="primary"
              size="medium"
              onClick={() => {
                scrollDiceToTop();
                setPhase('s1-ready');
                playSound('/sounds/nextChallenge.mp3');
                createAlert?.(
                  'Lançamento 1: observação',
                  'Acione a máquina e observe atentamente. Você vai precisar registrar o par (verde, azul) que sair.',
                  'info',
                  4500,
                );
              }}
              aria-label="Iniciar a primeira observação da máquina"
            >
              Começar lançamento 1
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ ETAPAS 1, 2, 3 ═══════ */}
      {phase !== 'intro' && (
        <>
          {StageIndicator}

          {/* ───────── L1: PRONTO PARA LANÇAR ───────── */}
          {phase === 's1-ready' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 1 de 3 — Observar
              </p>
              <p className="ds-body text-neutral-black mb-macro text-justify">
                Toque em <strong>Lançar</strong> e <strong>observe</strong> com atenção
                qual face aparece em cada dado.
              </p>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="medium"
                  disabled={isLaunching}
                  onClick={() => void launchMachine('s1-rolling', 's1-pick')}
                  aria-label="Lançar a máquina pela primeira vez"
                >
                  🎲 Lançar
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L1, L2, L3: ROLLING (animação da máquina) ───────── */}
          {(phase === 's1-rolling' || phase === 's2-rolling' || phase === 's3-rolling') && (
            <div className="mt-micro">
              {renderStepBar()}
              <p
                aria-live="polite"
                className="ds-body-medium text-brand-otimath-dark text-center"
                style={{ marginTop: 12, marginBottom: 8, minHeight: 22 }}
              >
                {statusMsg}
              </p>
            </div>
          )}

          {/* ───────── L1: PICKER (registrar o par observado) ───────── */}
          {phase === 's1-pick' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 1 — Registrar
              </p>
              <p className="ds-body text-neutral-black mb-macro text-justify">
                Toque em cada dado apresentado e escolha a <strong>face</strong> que apareceu
                na máquina.
              </p>
              {renderPairPicker()}
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={() => validatePair(() => setPhase('s1-correct'))}
                  aria-label="Conferir o par ordenado registrado"
                >
                  Conferir
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L1: PAR CORRETO ───────── */}
          {phase === 's1-correct' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro" style={{ color: COLOR_GREEN_VIVID }}>
                ✓ Par registrado corretamente
              </p>
              {renderResultCard(false)}
              <p className="ds-body text-neutral-black text-justify">
                Você leu o par <strong>(verde, azul)</strong> que a máquina produziu. Cada
                lançamento da máquina forma um novo par desse tipo.
              </p>
              <div className="flex justify-center mt-macro">
                <Button
                  style="primary"
                  size="medium"
                  onClick={goToS2}
                  aria-label="Avançar para o lançamento 2"
                >
                  Próximo lançamento
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L2: PRONTO PARA LANÇAR ───────── */}
          {phase === 's2-ready' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 2 de 3 — Observar e somar
              </p>
              <p className="ds-body text-neutral-black mb-macro text-justify">
                Agora você vai registrar o par <strong>e</strong> calcular a{' '}
                <strong>soma</strong> dos dois dados.
              </p>
              <div className="flex justify-center">
                <Button
                  style="primary"
                  size="medium"
                  disabled={isLaunching}
                  onClick={() => void launchMachine('s2-rolling', 's2-pick')}
                  aria-label="Lançar a máquina pela segunda vez"
                >
                  🎲 Lançar
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L2: PICKER ───────── */}
          {phase === 's2-pick' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 2 — Registrar o par
              </p>
              {renderPairPicker()}
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={() => validatePair(() => setPhase('s2-sum'))}
                  aria-label="Conferir o par ordenado registrado"
                >
                  Conferir
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L2: SOMA ───────── */}
          {phase === 's2-sum' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 2 — Calcular a soma
              </p>
              {renderResultCard(false)}
              <p className="ds-body text-neutral-black mb-micro text-center">
                Some os valores das duas faces:
              </p>
              <div className="flex items-center justify-center gap-micro flex-wrap">
                <span className="ds-body-bold text-neutral-black">Soma =</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sumInput}
                  onChange={e => {
                    // Aceita apenas dígitos — input numérico puro.
                    setSumInput(e.target.value.replace(/\D/g, ''));
                    setSumError(false);
                    setSumFeedback('');
                  }}
                  aria-label="Digite a soma dos dois dados"
                  aria-invalid={sumError}
                  className="ds-body-bold"
                  style={{
                    border: `2px solid ${sumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: 84,
                    minHeight: 44,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-brand-otimath-pure)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = sumError
                      ? 'var(--color-feedback-error-dark)'
                      : 'var(--color-neutral-lighter)';
                  }}
                />
                <Button
                  style="primary"
                  size="extra-small"
                  onClick={() => validateSum('s2-correct')}
                  aria-label="Conferir a soma calculada"
                >
                  Conferir
                </Button>
              </div>
              {sumFeedback && (
                <p
                  role="alert"
                  className="ds-small-bold text-center mt-micro text-feedback-error-dark"
                >
                  {sumFeedback}
                </p>
              )}
            </div>
          )}

          {/* ───────── L2: TUDO CERTO ───────── */}
          {phase === 's2-correct' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro" style={{ color: COLOR_GREEN_VIVID }}>
                ✓ Par registrado e soma calculada
              </p>
              {renderResultCard(true)}
              <p className="ds-body text-neutral-black text-justify">
                A soma dos dois dados é um número novo, que vem do par. Guarde essa ideia —
                a <strong>soma</strong> vai voltar.
              </p>
              <div className="flex justify-center mt-macro">
                <Button
                  style="primary"
                  size="medium"
                  onClick={goToS3}
                  aria-label="Avançar para o lançamento 3"
                >
                  Próximo lançamento
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L3: PREVISÃO + JUSTIFICATIVA (antes do lançamento) ───────── */}
          {phase === 's3-predict' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 3 de 3 — Fazer uma previsão
              </p>
              <p className="ds-body text-neutral-black mb-macro text-justify">
                Antes de a máquina lançar, faça uma <strong>previsão</strong>: qual será a{' '}
                <strong>soma</strong> dos dois dados?
              </p>

              {/* Input previsão */}
              <div className="flex items-center justify-center mb-micro gap-micro flex-wrap">
                <span className="ds-body-bold text-neutral-black">Sua previsão:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={predictionInput}
                  onChange={e => {
                    setPredictionInput(e.target.value);
                    setPredictionError('');
                  }}
                  aria-label="Digite sua previsão de soma, entre 2 e 12"
                  aria-invalid={!!predictionError}
                  className="ds-body-bold"
                  style={{
                    border: `2px solid ${predictionError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: 84,
                    minHeight: 44,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <span className="ds-small text-neutral-medium">(entre 2 e 12)</span>
              </div>
              {predictionError && (
                <p
                  role="alert"
                  className="ds-small-bold text-center mb-micro text-feedback-error-dark"
                >
                  {predictionError}
                </p>
              )}

              {/* Justificativa metacognitiva */}
              <fieldset
                style={{
                  border: predictionReasonError
                    ? '2px solid var(--color-feedback-error-dark)'
                    : '1px solid var(--color-neutral-lighter)',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <legend className="ds-body-bold text-neutral-black px-[6px]">
                  Por que você escolheu esse número?
                </legend>
                {[
                  { value: 'equip', label: 'Acho que toda soma tem a mesma chance.' },
                  { value: 'maisChance', label: 'Acho que esse número aparece mais.' },
                  { value: 'intuicao', label: 'Foi só uma intuição.' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className="ds-body text-neutral-black"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 4px',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <input
                      type="radio"
                      name="prediction-reason"
                      value={opt.value}
                      checked={predictionReason === opt.value}
                      onChange={() => {
                        setPredictionReason(opt.value as 'equip' | 'maisChance' | 'intuicao');
                        setPredictionReasonError(false);
                      }}
                      aria-label={opt.label}
                      style={{ marginTop: 4, width: 20, height: 20, accentColor: 'var(--color-brand-otimath-pure)' }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
                {predictionReasonError && (
                  <p
                    role="alert"
                    className="ds-small-bold"
                    style={{ color: 'var(--color-feedback-error-dark)', marginTop: 4 }}
                  >
                    Escolha um motivo antes de lançar.
                  </p>
                )}
              </fieldset>

              <div className="flex justify-center mt-macro">
                <Button
                  style="primary"
                  size="medium"
                  disabled={isLaunching}
                  onClick={validatePrediction}
                  aria-label="Lançar a máquina e observar o resultado"
                >
                  🎲 Lançar e observar
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L3: PICKER (registrar o par antes de comparar com previsão) ───────── */}
          {phase === 's3-pick' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 3 — Registrar o par
              </p>
              <p className="ds-body text-neutral-black mb-macro text-justify">
                Antes de conferir sua previsão, registre o par que a máquina produziu.
              </p>
              {renderPairPicker()}
              <div className="flex justify-center mt-micro">
                <Button
                  style="primary"
                  size="small"
                  onClick={() => validatePair(() => {
                    setSumInput('');
                    setSumError(false);
                    setSumFeedback('');
                    setPhase('s3-sum');
                  })}
                  aria-label="Conferir o par ordenado registrado"
                >
                  Conferir
                </Button>
              </div>
            </div>
          )}

          {/* ───────── L3: SOMA (calcular antes de comparar com previsão) ───────── */}
          {phase === 's3-sum' && (
            <div className="bg-neutral-white rounded-lg p-xxs"
              style={{
                border: '2px solid var(--color-brand-otimath-lighter)',
                boxShadow: '0 4px 14px rgba(36, 80, 190, 0.08)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                Lançamento 3 — Calcular a soma
              </p>
              {renderResultCard(false)}
              <p className="ds-body text-neutral-black mb-micro text-center">
                Some os valores das duas faces:
              </p>
              <div className="flex items-center justify-center gap-micro flex-wrap">
                <span className="ds-body-bold text-neutral-black">Soma =</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sumInput}
                  onChange={e => {
                    // Aceita apenas dígitos — input numérico puro.
                    setSumInput(e.target.value.replace(/\D/g, ''));
                    setSumError(false);
                    setSumFeedback('');
                  }}
                  aria-label="Digite a soma dos dois dados"
                  aria-invalid={sumError}
                  className="ds-body-bold"
                  style={{
                    border: `2px solid ${sumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: 84,
                    minHeight: 44,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <Button
                  style="primary"
                  size="extra-small"
                  onClick={() => validateSum('s3-reflect')}
                  aria-label="Conferir a soma calculada"
                >
                  Conferir
                </Button>
              </div>
              {sumFeedback && (
                <p
                  role="alert"
                  className="ds-small-bold text-center mt-micro text-feedback-error-dark"
                >
                  {sumFeedback}
                </p>
              )}
            </div>
          )}

          {/* ───────── L3: REFLEXÃO (feedback adidático) ───────── */}
          {phase === 's3-reflect' && blueResult != null && greenResult != null && (
            (() => {
              const realSum = greenResult + blueResult;
              const userPrediction = parseInt(predictionInput.trim(), 10);
              // Em dev, a seta pode pular o passo de previsão deixando o
              // input vazio — parseInt('') === NaN. Tratamos como "sem
              // previsão" para evitar warning do React e texto sem sentido.
              const hasPrediction = !Number.isNaN(userPrediction);
              const occurred = hasPrediction && userPrediction === realSum;
              return (
                <div className="bg-neutral-white rounded-lg p-xxs"
                  style={{ border: '1px solid var(--color-neutral-lighter)', maxWidth: 560, margin: '0 auto' }}>
                  <p className="ds-body-bold text-center mb-micro text-brand-otimath-pure">
                    Lançamento 3 — Resultado
                  </p>
                  {renderResultCard(true)}
                  <p className="ds-body text-neutral-black text-center mb-micro">
                    Sua previsão foi <strong>{hasPrediction ? userPrediction : '—'}</strong>.{' '}
                    {hasPrediction && (occurred ? (
                      <span className="text-feedback-success-dark">
                        Sua previsão <strong>ocorreu</strong>.
                      </span>
                    ) : (
                      <span className="text-feedback-warning-dark">
                        Sua previsão <strong>não ocorreu</strong>.
                      </span>
                    ))}
                  </p>
                  {occurred ? (
                    <p className="ds-body text-neutral-black mt-micro text-justify">
                      Será que ocorreu porque sua intuição estava certa, ou porque o acaso
                      colaborou? Se a máquina lançar de novo, você confiaria na mesma previsão?
                    </p>
                  ) : (
                    <p className="ds-body text-neutral-black mt-micro text-justify">
                      E se a máquina lançar mil vezes, sua previsão seria a melhor escolha?
                      Sua intuição funciona... ou foi acaso?
                    </p>
                  )}
                  <p className="ds-body text-neutral-black mt-micro text-justify">
                    E aquele motivo que você marcou — ele ainda <strong>faz sentido</strong>{' '}
                    para você?
                  </p>
                  <div className="flex justify-center mt-macro">
                    <Button
                      style="primary"
                      size="medium"
                      onClick={goToBridge}
                      aria-label="Refletir sobre o experimento e avançar"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              );
            })()
          )}

          {/* ───────── BRIDGE: ponte para a Cena 7 (tabela 6×6) ───────── */}
          {phase === 'bridge' && (
            <div className="rounded-lg p-xxs"
              style={{
                background:
                  'linear-gradient(180deg, var(--color-brand-otimath-lighter) 0%, var(--color-brand-otimath-lightest) 100%)',
                border: '2px solid var(--color-brand-otimath-pure)',
                boxShadow: '0 6px 20px rgba(36, 80, 190, 0.18)',
                maxWidth: 560,
                margin: '0 auto',
              }}>
              <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
                Há um padrão escondido?
              </p>
              <p className="ds-body text-neutral-black text-justify">
                Você viu que a soma nem sempre sai como imaginamos. Mas será que isso é{' '}
                <strong>só acaso</strong>... ou existe um <strong>padrão escondido</strong>?
              </p>
              <p className="ds-body text-neutral-black mt-micro text-justify">
                Para descobrir, precisamos enxergar <strong>todos</strong> os resultados
                possíveis ao mesmo tempo. Vamos organizar todos os pares numa tabela 6×6.
              </p>
              <div className="flex justify-center mt-macro">
                <Button
                  style="primary"
                  size="medium"
                  onClick={onFinished}
                  aria-label="Concluir esta etapa e ir para a tabela de pares"
                >
                  Concluir esta etapa
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
DiceMachineExperiment.displayName = 'DiceMachineExperiment';
