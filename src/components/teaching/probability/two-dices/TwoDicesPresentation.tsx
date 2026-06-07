'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import { Button } from '@/components/global/Button';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { Alerts } from '@/components/global/Alerts';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { playSound } from '@/hooks/global/useSound';
import { useAlerts } from '@/hooks/global/useAlerts';
import type { DiceSceneHandle } from './DiceScene';
import type { TwoDiceSceneHandle } from './TwoDiceScene';
import type { UnionTheoryHandle } from './UnionProbabilityTheory';
import type { UnionExercise1Handle } from './UnionExercise1';
import type { UnionExercise2Handle } from './UnionExercise2';
import type { UnionExercise3Handle } from './UnionExercise3';
import type { UnionExercise4Handle } from './UnionExercise4';
import type { UnionExercise5Handle } from './UnionExercise5';
import type { UnionExercise6Handle } from './UnionExercise6Review';
import type { DiceMachineSceneHandle } from './DiceMachineScene';
import { TwoDicesPractice, type TwoDicesPracticeHandle } from './TwoDicesPractice';
import { TwoDicesExperiment, type TwoDicesExperimentHandle } from './TwoDicesExperiment';
import { DiceMachineExperiment, type DiceMachineExperimentHandle } from './DiceMachineExperiment';
import { logOvaInteraction, setActiveOva } from '@/hooks/teaching/probability/useSequenceSession';

// Skeleton exibido enquanto o chunk JS do componente 3D é baixado
function Scene3DSkeleton({ label = 'Carregando cena 3D...' }: { label?: string }) {
  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio: '16 / 10',
        maxWidth: 520,
        margin: '0 auto',
        background: 'linear-gradient(110deg, #0a1628 30%, #142744 50%, #0a1628 70%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <span className="ds-body-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

function MachineSkeleton() {
  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio: '758 / 520',
        maxWidth: 758,
        margin: '0 auto',
        background: 'linear-gradient(110deg, #0a1628 30%, #142744 50%, #0a1628 70%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 14px 60px rgba(0,0,0,.9)',
        border: '1.5px solid #0d1824',
      }}
    >
      <span className="ds-body-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando a máquina...</span>
    </div>
  );
}

// Importação dinâmica dos componentes 3D (Three.js precisa do browser)
const DiceScene = dynamic(() => import('./DiceScene'), { ssr: false, loading: () => <Scene3DSkeleton label="Carregando dado 3D..." /> });
const TwoDiceScene = dynamic(() => import('./TwoDiceScene'), { ssr: false, loading: () => <Scene3DSkeleton label="Carregando dados 3D..." /> });
const DiceMachineScene = dynamic(() => import('./DiceMachineScene'), { ssr: false, loading: () => <MachineSkeleton /> });

// ═══════ Constantes ═══════

const FACE_LABELS = [
  'uma pinta', 'duas pintas', 'três pintas',
  'quatro pintas', 'cinco pintas', 'seis pintas'
];

// Alturas das barras do dado viciado (px)
const BIASED_HEIGHTS = [20, 35, 90, 55, 110, 140];

// ═══════ Barra animada ═══════
// Padrão de pintas em grade 3×3 para cada face do dado
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

const BAR_WIDTH = 40;

function DiceFaceIcon({ face, size }: { face: number; size: number }) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);

  return (
    <div
      role="img"
      aria-label={`Face ${face} do dado`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size * 0.16),
        background: 'var(--color-brand-otimath-dark)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
        marginTop: 4,
      }}
    >
      {pips.map((pip, i) => (
        <div key={i} className="flex items-center justify-center">
          {pip ? (
            <div style={{
              width: pipSize,
              height: pipSize,
              borderRadius: '50%',
              background: '#fff',
            }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AnimatedBar({
  height,
  color,
  faceNumber,
  label,
  animate,
  delay,
}: {
  height: number;
  color: string;
  faceNumber: number;
  label?: string;
  animate: boolean;
  delay?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-y-nano">
      {label && <span className="ds-small-bold text-neutral-black">{label}</span>}
      <div
        style={{
          width: BAR_WIDTH,
          height: animate ? height : 0,
          background: color,
          borderRadius: '6px 6px 0 0',
          transition: `height 1.2s ease-out ${delay || 0}ms`,
        }}
      />
      <DiceFaceIcon face={faceNumber} size={BAR_WIDTH} />
    </div>
  );
}

// ═══════ Fração estilizada ═══════
function Fraction({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center mx-nano" style={{ verticalAlign: 'middle' }}>
      <span className="ds-small-bold">{num}</span>
      <span className="border-t border-neutral-darkest" style={{ width: '100%', minWidth: 12 }} />
      <span className="ds-small-bold">{den}</span>
    </span>
  );
}

// Sinaliza onFinished após o mount — evita setState em componente pai
// durante o render do filho (anti-padrão React). Guarda contra disparos
// múltiplos: em devMode o componente permanece montado após o término,
// e se a referência do `onFinished` mudar (lambda recriada a cada
// re-render do pai), o efeito dispararia de novo a cada navegação DEV.
//
// `delayMs` opcional: espera N ms antes de disparar — necessário pra dar
// tempo do alert "🏆 Sequência didática concluída!" ser visto antes do
// pai (page.tsx) trocar de stage e desmontar essa árvore inteira.
//
// NOTA: sem cleanup do setTimeout intencionalmente. Em React 18 strict
// mode o useEffect roda duas vezes (mount/fake-unmount/remount), e o
// cleanup limparia o timeout antes dele disparar. O `fired.current`
// guard garante que onFinished seja chamado no máximo UMA vez mesmo que
// o setTimeout sobreviva a re-mounts.
function FinishedSignal({ onFinished }: { onFinished: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    onFinished();
  }, [onFinished]);
  return null;
}

// ═══════ Componente principal ═══════
interface TwoDicesPresentationProps {
  children?: ReactNode;
  /** Callback opcional disparado quando a apresentação termina (após Cena 7).
   *  Quando definido, é executado em vez de revelar `children` — útil para
   *  compor o OVA dentro de uma sequência didática que controla o que vem
   *  depois externamente. */
  onFinished?: () => void;
  /** Modo de desenvolvimento — quando true, renderiza uma barrinha
   *  interna de navegação entre as 7 cenas. Usado pelo painel de DEV
   *  da sequência didática. */
  devMode?: boolean;
  /** Callback opcional disparado sempre que o progresso interno do OVA
   *  muda (fração 0..1). Usado pela sequência didática para animar a
   *  barra de progresso global. Heurístico baseado em (scene, subStep)
   *  — não precisa ser exato, só monotônico. */
  onProgressChange?: (fraction: number) => void;
  /** Sinaliza que este OVA é a cena atualmente ativa da sequência. Em
   *  devMode todos os OVAs ficam montados; sem este sinal, o cronômetro
   *  do `setActiveOva` ficaria preso ao último OVA mexido mesmo após o
   *  pai trocar de stage. */
  isActiveStage?: boolean;
}

export function TwoDicesPresentation({ children, onFinished, devMode = false, onProgressChange, isActiveStage = true }: TwoDicesPresentationProps) {
  // Sistema de alerts toast — consistente com o restante do OVA dos dados
  // (ComplementaryEventsActivity, useComplementaryEventsHooks, etc.).
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();

  const [done, setDone] = useState(false);
  const [scene, setScene] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  // Ref do dado 3D e seu container (para scroll programático)
  const diceRef = useRef<DiceSceneHandle>(null);
  // Handle da Cena 5 (TwoDicesPractice) — expõe phase + advance para o
  // painel DEV simular o fluxo natural sem interação manual.
  const practiceRef = useRef<TwoDicesPracticeHandle>(null);
  // Fase interna atual da Cena 5 (notificada via onPhaseChange) — entra
  // no cenaId DEV para que cada sub-fase seja capturada como snapshot.
  const [scene5InternalPhase, setScene5InternalPhase] = useState<string>('main=intro');
  // Mesmo padrão para Cena 6 (DiceMachineExperiment).
  const machineExperimentRef = useRef<DiceMachineExperimentHandle>(null);
  const [scene6InternalPhase, setScene6InternalPhase] = useState<string>('intro');
  // Handle da Cena 7 (TwoDicesExperiment) — usado pelo DEV para avançar
  // pelas fases via handle do componente em vez de pular cena inteira.
  const twoDicesExperimentRef = useRef<TwoDicesExperimentHandle>(null);
  const diceContainerRef = useRef<HTMLDivElement>(null);
  // Ref da máquina de lançamento (Cena 6 — percepção do acaso)
  const diceMachineRef = useRef<DiceMachineSceneHandle>(null);
  const diceMachineContainerRef = useRef<HTMLDivElement>(null);
  // Ref da cena de dois dados (Cena 7 — sistematização tabular)
  const twoDiceRef = useRef<TwoDiceSceneHandle>(null);
  // Ref para navegar pelas fases internas do UnionProbabilityTheory (setinhas dev)
  const unionTheoryRef = useRef<UnionTheoryHandle>(null);
  // Ref para navegar pelos passos do UnionExercise1 (setinhas dev)
  const unionExercise1Ref = useRef<UnionExercise1Handle>(null);
  // Ref para navegar pelos passos do UnionExercise2 (setinhas dev)
  const unionExercise2Ref = useRef<UnionExercise2Handle>(null);
  // Ref para navegar pelos passos do UnionExercise3 (setinhas dev)
  const unionExercise3Ref = useRef<UnionExercise3Handle>(null);
  // Ref para navegar pelos passos do UnionExercise4 (setinhas dev)
  const unionExercise4Ref = useRef<UnionExercise4Handle>(null);
  // Ref para navegar pelos passos do UnionExercise5 (setinhas dev)
  const unionExercise5Ref = useRef<UnionExercise5Handle>(null);
  // Ref para navegar pelos passos do UnionExercise6Review (setinhas dev)
  const unionExercise6Ref = useRef<UnionExercise6Handle>(null);
  const twoDiceContainerRef = useRef<HTMLDivElement>(null);
  // Cena 7: troca a cena de dois dados pela máquina (com dados brancos)
  // durante a fase colorQuestion. Controlado via callback do TwoDicesExperiment.
  const [scene7UsesMachine, setScene7UsesMachine] = useState(false);
  // Cena 7: esconde AMBAS as cenas 3D (dados + máquina) durante as fases
  // finais de cálculo de probabilidade (probPair, probPairReveal, probSumTable,
  // probSumReveal) — ali os dados físicos são semanticamente irrelevantes.
  const [scene7HideAllDice, setScene7HideAllDice] = useState(false);

  // Cena 2: face atual na sequência
  const [currentFaceIdx, setCurrentFaceIdx] = useState(-1);
  const scene2Running = useRef(false);

  // Cena 3: interativa — etapas progressivas
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [scene3Step, setScene3Step] = useState(0); // 0=texto, 1=espaço amostral, 2=n(S), 3=P(S), 4=P(face i), 5=generalizar, 6=fechamento
  const [scene3RandomFace] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [scene3SampleSpace, setScene3SampleSpace] = useState('');
  const [scene3SampleSpaceError, setScene3SampleSpaceError] = useState(false);
  const [scene3NS, setScene3NS] = useState('');
  const [scene3NSError, setScene3NSError] = useState(false);
  const [scene3PS, setScene3PS] = useState('');
  const [scene3PSError, setScene3PSError] = useState(false);
  const [scene3Num, setScene3Num] = useState('');
  const [scene3Den, setScene3Den] = useState('');
  const [scene3Pct, setScene3Pct] = useState('');
  const [scene3NumError, setScene3NumError] = useState(false);
  const [scene3DenError, setScene3DenError] = useState(false);
  const [scene3PctError, setScene3PctError] = useState(false);
  const [scene3ProbFeedback, setScene3ProbFeedback] = useState('');
  const [scene3ShowBar, setScene3ShowBar] = useState(false);
  const [scene3AllBars, setScene3AllBars] = useState(false);
  const [scene3NoError, setScene3NoError] = useState(false);

  // Cena 4: barras comparativas + interação equiprovável
  const [compareBarsAnimated, setCompareBarsAnimated] = useState(false);
  const [scene4Step, setScene4Step] = useState(0); // 0=gráficos, 1=perguntas, 2=concluído
  const [scene4EqAnswer, setScene4EqAnswer] = useState('');
  const [scene4EqError, setScene4EqError] = useState(false);
  const [scene4VicAnswer, setScene4VicAnswer] = useState('');
  const [scene4VicError, setScene4VicError] = useState(false);
  const [scene4SumAnswer, setScene4SumAnswer] = useState('');
  const [scene4SumError, setScene4SumError] = useState(false);
  // Ordem aleatória: [radio pergunta1, radio pergunta2, ordem das perguntas]
  // Ressorteada a cada vez que a Cena 4 é acessada
  const [scene4RadioOrder, setScene4RadioOrder] = useState<[boolean, boolean, boolean]>([true, true, true]);

  // ═══════ Cena 5: delegada ao componente TwoDicesPractice ═══════
  const [scene5Finished, setScene5Finished] = useState(false);

  // ═══════ Cena 6: máquina automática de lançamento (percepção do acaso) ═══════
  const [scene6Finished, setScene6Finished] = useState(false);
  // A máquina 3D começa a montar na Cena 5 (escondida) para pré-inicializar
  // WebGL enquanto o aluno pratica. O skeleton fica visível até onReady.
  const [machineReady, setMachineReady] = useState(false);

  // ═══════ Cena 7: experimento com dois dados — tabela 6×6 (sistematização) ═══════
  const [scene7Finished, setScene7Finished] = useState(false);
  // Fase interna do experimento da Cena 7 — usada para alargar o wrapper
  // (max-w-[800px] → max-w-[1216px]) quando entra na unionTheory, cuja
  // tabela 6×6 precisa de mais que 800px para não gerar scroll horizontal.
  const [scene7ExperimentPhase, setScene7ExperimentPhase] = useState<string>('intro');

  // Ativar idle nas cenas 1 e 3
  useEffect(() => {
    if (scene === 1 || scene === 3) {
      const t = setTimeout(() => diceRef.current?.setIdle(true), 250);
      return () => clearTimeout(t);
    }
  }, [scene]);

  // Pré-carregar chunks do TwoDiceScene e DiceMachineScene durante a Cena 5
  // (download de JS sem montar WebGL — não compete com o dado 3D da Cena 5).
  useEffect(() => {
    if (scene === 5) {
      import('./TwoDiceScene');
      import('./DiceMachineScene');
    }
  }, [scene]);

  // ── Iniciar sequência da Cena 2 ──
  const startScene2 = useCallback(async () => {
    if (scene2Running.current) return;
    scene2Running.current = true;
    diceRef.current?.setIdle(false);

    // Silenciar sons de impacto durante a sequência automática — o singleton
    // playSound não suporta chamadas rápidas em sequência (bounce × 6 rolls
    // = ~20 chamadas), causando travamento em mobile.
    diceRef.current?.setMuteImpact(true);

    playSound('/sounds/nextChallenge.mp3');

    for (let i = 0; i < 6; i++) {
      setCurrentFaceIdx(i);
      if (diceRef.current) {
        await diceRef.current.roll(i + 1);
      }
      // Espera breve para o aluno ver a face
      await new Promise(r => setTimeout(r, 800));
    }

    // Restaurar sons de impacto para as cenas seguintes
    diceRef.current?.setMuteImpact(false);

    // Avançar automaticamente para Cena 3
    await new Promise(r => setTimeout(r, 500));
    scene2Running.current = false;
    goToScene(3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transição entre cenas ──
  const goToScene = useCallback((num: number) => {
    if (transitioning) return;
    setTransitioning(true);

    setTimeout(() => {
      // CRÍTICO: resetar scene3Step/scene4Step JUNTO com setScene no
      // mesmo batch — caso contrário, há um render intermediário em que
      // scene=3 já está aplicado mas scene3Step ainda tem o valor antigo
      // (ex.: 6 de uma execução anterior), causando um flash do texto
      // de fechamento da Cena 3 logo na entrada. Mesma proteção para a
      // Cena 4 (step + flags de erro + radioOrder).
      setScene(num);
      if (num === 3) {
        setBarsAnimated(false);
        setScene3Step(0);
        setScene3AllBars(false);
        setScene3ShowBar(false);
      }
      if (num === 4) {
        setCompareBarsAnimated(false);
        setScene4Step(0);
        setScene4EqAnswer('');
        setScene4VicAnswer('');
        setScene4EqError(false);
        setScene4VicError(false);
        setScene4RadioOrder([Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]);
      }

      requestAnimationFrame(() => {
        setTransitioning(false);

        // Rola suave para o topo do OVA Dois Dados — sem isso o aluno
        // clicava "Próximo" no fim de uma cena e a próxima carregava com
        // o título e a instrução fora da viewport (especialmente crítico
        // no mobile). `apresentacao-dado` é o Grid raiz do OVA — sempre
        // existe, tanto na rota standalone quanto na sequência didática.
        document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Iniciar comportamento da cena (animações que precisam de UM render
        // já concluído — não devem rodar no mesmo batch da troca de cena).
        if (num === 2) {
          setCurrentFaceIdx(-1);
          diceRef.current?.setIdle(false);
          setTimeout(() => startScene2(), 300);
        }
        if (num === 4) {
          setTimeout(() => {
            setCompareBarsAnimated(true);
            setTimeout(() => setScene4Step(1), 1500);
          }, 200);
        }
        if (num === 5) {
          setScene5Finished(false);
          setTimeout(() => {
            diceRef.current?.setIdle(true);
          }, 300);
        }
      });
    }, 400);
  }, [transitioning, startScene2]);

  // ── Validações da Cena 3 interativa ──
  // Etapas: 0=texto, 1=S, 2=n(S), 3=P(S), 4=P(face i), 5=generalizar, 6=fechamento

  // Rola pro topo do OVA quando uma sub-etapa interna avança. Crítico no mobile:
  // o aluno termina a pergunta atual lá embaixo, clica Conferir, e a próxima
  // pergunta carrega no MESMO scroll position — o enunciado fica fora da
  // viewport e o aluno se perde. `apresentacao-dado` é o Grid raiz do OVA,
  // sempre presente (standalone e sequência didática).
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const validateSampleSpace = () => {
    scrollDiceToTop();
    const clean = scene3SampleSpace.replace(/\s/g, '').replace(/[{}]/g, '');
    const nums = clean.split(',').map(Number).sort();
    if (nums.length === 6 && nums.every((n, i) => n === i + 1)) {
      setScene3SampleSpaceError(false);
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', 'Espaço amostral identificado.', 'success', 2500);
      setScene3Step(2);
      scrollDiceToTop();
    } else {
      setScene3SampleSpaceError(true);
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Verifique quais os resultados possíveis no lançamento de um dado.', 'error', 4000);
    }
  };

  const validateNS = () => {
    scrollDiceToTop();
    const v = parseInt(scene3NS.trim());
    if (v === 6) {
      setScene3NSError(false);
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', 'O espaço amostral tem 6 elementos.', 'success', 2500);
      setScene3Step(3);
      scrollDiceToTop();
    } else {
      setScene3NSError(true);
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Conte quantos elementos você listou no espaço amostral S.', 'error', 4000);
    }
  };

  const validatePS = () => {
    scrollDiceToTop();
    // P(S) = 1 — aceita: 1, 100, 1.0, 100%, ou QUALQUER fração equivalente
    // a 1 (ex.: 6/6, 3/3, 100/100, 36/36) usando produto cruzado.
    const raw = scene3PS.trim().replace('%', '');
    let ok = false;
    if (raw.includes('/')) {
      const [n, d] = raw.split('/');
      const num = parseFloat(n.replace(',', '.'));
      const den = parseFloat(d.replace(',', '.'));
      if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0 && num === den) {
        ok = true;
      }
    } else {
      const v = parseFloat(raw.replace(',', '.'));
      if (!Number.isNaN(v) && (v === 1 || v === 100)) ok = true;
    }
    if (ok) {
      setScene3PSError(false);
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', 'P(S) = 1 — algum resultado certamente ocorre.', 'success', 2500);
      setScene3Step(4);
      scrollDiceToTop();
    } else {
      setScene3PSError(true);
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Se o dado é lançado, algum resultado certamente ocorrerá. Qual probabilidade representa a certeza?', 'error', 4500);
    }
  };

  const validateProb = () => {
    // EXCEÇÃO ao padrão "scroll no topo de todo validador": neste caso,
    // ao acertar aparece a AnimatedBar embaixo (3s antes da transição).
    // Se rolássemos pro topo imediatamente, o aluno perderia a barra.
    // Solução: scroll só dispara no caminho de erro (pra ver o alert)
    // ou DEPOIS dos 3s da barra (no setTimeout), nunca durante.
    const num = parseInt(scene3Num);
    const den = parseInt(scene3Den);
    // Aceita qualquer fração equivalente a 1/6 via produto cruzado
    // (ex: 2/12, 3/18, 5/30) — assim o aluno não precisa simplificar.
    const fracOk = !Number.isNaN(num) && !Number.isNaN(den) && den !== 0 && num * 6 === den * 1;
    const numOk = !Number.isNaN(num) && (fracOk || num === 1);
    const denOk = !Number.isNaN(den) && (fracOk || den === 6);
    // Aceita: 16.6, 16.66, 16.666, 16.6666..., 16.67, 16.7, e variações com "..." ou "…"
    const pctRaw = scene3Pct.trim().replace(',', '.').replace('%', '');
    const hasEllipsis = pctRaw.includes('...') || pctRaw.includes('…');
    const pctClean = pctRaw.replace(/\.{2,}/g, '').replace('…', '');
    const pctVal = parseFloat(pctClean);
    const pctOk = !isNaN(pctVal) && (
      (hasEllipsis && pctClean.startsWith('16.6')) ||
      (!hasEllipsis && pctVal >= 16.6 && pctVal <= 16.7)
    );

    // Resetar todos os erros
    setScene3NumError(false);
    setScene3DenError(false);
    setScene3PctError(false);
    setScene3ProbFeedback('');

    if (fracOk && pctOk) {
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', `P(face ${scene3RandomFace}) = 1/6 ≈ 16,7%.`, 'success', 3000);
      setScene3ShowBar(true);
      // Tempo aumentado de 800ms para 3000ms para o aluno conseguir
      // observar a barra animada da face sorteada antes da transição.
      setTimeout(() => {
        setScene3ShowBar(false);
        setScene3Step(5);
        scrollDiceToTop();
      }, 3000);
    } else {
      // Erro: rola imediatamente pro topo (mirror do padrão geral).
      scrollDiceToTop();
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Verifique a fração e a porcentagem.', 'error', 4000);

      if (fracOk && !pctOk) {
        // Fração correta, porcentagem errada
        setScene3PctError(true);
        setScene3ProbFeedback('Divida o numerador pelo denominador e depois multiplique por 100.');
      } else if (!numOk && !denOk) {
        // Ambos da fração errados
        setScene3NumError(true);
        setScene3DenError(true);
        if (!pctOk) setScene3PctError(true);
        setScene3ProbFeedback(`Verifique quantos casos são favoráveis à ocorrência da face ${scene3RandomFace} e quantos são possíveis no experimento aleatório do lançamento de um dado equilibrado.`);
      } else if (!denOk) {
        // Só denominador errado
        setScene3DenError(true);
        if (!pctOk) setScene3PctError(true);
        setScene3ProbFeedback('Quantos resultados possíveis existem no lançamento de um dado equilibrado? Revise o denominador.');
      } else if (!numOk) {
        // Só numerador errado
        setScene3NumError(true);
        if (!pctOk) setScene3PctError(true);
        setScene3ProbFeedback(`Quantos resultados produzem a face ${scene3RandomFace}? Revise o numerador.`);
      }
    }
  };

  const handleGeneralize = (answer: boolean) => {
    // EXCEÇÃO ao padrão "scroll no topo do validador": ao acertar, todas
    // as barras animam in-place (1,2s) antes da transição p/ step 6.
    // Scroll só dispara no erro (pra ver o alert) ou DEPOIS da animação
    // (no setTimeout), nunca durante — senão o aluno perde as barras.
    if (answer) {
      setScene3NoError(false);
      setScene3AllBars(true);
      setBarsAnimated(true);
      playSound("/sounds/correct.mp3");
      createAlert('Exatamente!', 'Em um dado equilibrado todas as faces têm a mesma probabilidade.', 'success', 3000);
      setTimeout(() => {
        setScene3Step(6);
        scrollDiceToTop();
      }, 1200);
    } else {
      // Erro: rola imediatamente pro topo (mirror do padrão geral).
      scrollDiceToTop();
      setScene3NoError(true);
      playSound("/sounds/incorrect.mp3");
      createAlert('Releia a definição', 'Releia a definição de dado equilibrado e tente novamente.', 'error', 4000);
    }
  };

  // ── Validação da Cena 4 ──
  const validateScene4 = () => {
    scrollDiceToTop();
    const eqOk = scene4EqAnswer === 'equiprovavel';
    const vicOk = scene4VicAnswer === 'nao-equiprovavel';

    setScene4EqError(!eqOk);
    setScene4VicError(!vicOk);

    if (eqOk && vicOk) {
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', 'Você classificou corretamente os espaços amostrais.', 'success', 3000);
      setScene4Step(2);
      scrollDiceToTop();
    } else {
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Releia a definição de dado equilibrado/viciado e revise as opções.', 'error', 4000);
    }
  };

  // ── Validação da soma P(Ω) = 1 na Cena 4 ──
  const validateScene4Sum = () => {
    scrollDiceToTop();
    // Aceita: 1, 100, 1.0, 100%, ou QUALQUER fração equivalente a 1
    // (ex.: 6/6, 3/3, 100/100) usando produto cruzado.
    const raw = scene4SumAnswer.trim().replace('%', '');
    let ok = false;
    if (raw.includes('/')) {
      const [n, d] = raw.split('/');
      const num = parseFloat(n.replace(',', '.'));
      const den = parseFloat(d.replace(',', '.'));
      if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0 && num === den) {
        ok = true;
      }
    } else {
      const v = parseFloat(raw.replace(',', '.'));
      if (!Number.isNaN(v) && (v === 1 || v === 100)) ok = true;
    }
    if (ok) {
      setScene4SumError(false);
      playSound("/sounds/correct.mp3");
      createAlert('Correto!', 'A soma das probabilidades de todos os resultados possíveis é sempre 1 (100%).', 'success', 3000);
      setScene4Step(3);
      scrollDiceToTop();
    } else {
      setScene4SumError(true);
      playSound("/sounds/incorrect.mp3");
      createAlert('Tente novamente', 'Lembre-se do valor que você calculou para P(S) na etapa anterior.', 'error', 4000);
    }
  };

  // ── Botão "Próximo" ──
  const handleNext = () => {
    if (transitioning) return;

    if (scene === 5 && scene5Finished) {
      goToScene(6);
      return;
    }

    if (scene === 6 && scene6Finished) {
      goToScene(7);
      return;
    }

    if (scene === 7 && scene7Finished) {
      playSound("/sounds/gameFinished.mp3");
      setDone(true);
      return;
    }

    if (scene < 5) goToScene(scene + 1);
  };

  // ─────────────────────────────────────────────────────────────────
  // SNAPSHOT/RESTORE para o painel DEV (estilo OVA do Disco). Toda a
  // captura roda no parent — assim o histórico continua sendo gravado
  // mesmo quando devMode está OFF. Quando o aluno ativa o DEV depois,
  // já existe histórico para voltar.
  //
  // Cenas 5, 6 e 7 delegam estado a filhos com phase próprio
  // (TwoDicesPractice, DiceMachineExperiment, TwoDicesExperiment).
  // Capturamos a fase interna via onPhaseChange e, ao restaurar um snapshot,
  // chamamos setCurrentPhaseId no handle do filho para sincronizar o phase
  // interno com o snapshot — sem isso, ao voltar e seguir adiante via DEV,
  // a próxima seta avançava a partir da fase REAL (não do snapshot) e
  // cenas como pairQuestion/pairExplain/colorQuestion eram puladas.
  // ─────────────────────────────────────────────────────────────────

  // ID textual da cena atual — chave usada para detectar transições e
  // empilhar snapshots. Inclui sub-passos (Cena 3 e 4) e a fase interna
  // da Cena 7 (exposta via onPhaseChange).
  const devCenaId = (() => {
    const parts: string[] = [`scene=${scene}`];
    if (scene === 3) parts.push(`step=${scene3Step}`);
    if (scene === 4) parts.push(`step=${scene4Step}`);
    if (scene === 5) parts.push(`practice=${scene5InternalPhase}`);
    if (scene === 6) parts.push(`machine=${scene6InternalPhase}`);
    if (scene === 7) parts.push(`phase=${scene7ExperimentPhase}`);
    if (done) parts.push('done');
    return parts.join('|');
  })();

  // Snapshot do estado parent — usado para restaurar visualmente uma
  // cena anterior. Não captura estado interno dos filhos (limitação).
  type DevSnapshot = {
    done: boolean;
    scene: number;
    transitioning: boolean;
    currentFaceIdx: number;
    barsAnimated: boolean;
    scene3Step: number;
    scene3SampleSpace: string;
    scene3SampleSpaceError: boolean;
    scene3NS: string;
    scene3NSError: boolean;
    scene3PS: string;
    scene3PSError: boolean;
    scene3Num: string;
    scene3Den: string;
    scene3Pct: string;
    scene3NumError: boolean;
    scene3DenError: boolean;
    scene3PctError: boolean;
    scene3ProbFeedback: string;
    scene3ShowBar: boolean;
    scene3AllBars: boolean;
    scene3NoError: boolean;
    compareBarsAnimated: boolean;
    scene4Step: number;
    scene4EqAnswer: string;
    scene4EqError: boolean;
    scene4VicAnswer: string;
    scene4VicError: boolean;
    scene4SumAnswer: string;
    scene4SumError: boolean;
    scene4RadioOrder: [boolean, boolean, boolean];
    scene5Finished: boolean;
    scene5InternalPhase: string;
    scene6Finished: boolean;
    scene6InternalPhase: string;
    machineReady: boolean;
    scene7Finished: boolean;
    scene7UsesMachine: boolean;
    scene7HideAllDice: boolean;
    scene7ExperimentPhase: string;
  };

  const getDevSnapshot = (): DevSnapshot => ({
    done, scene, transitioning, currentFaceIdx, barsAnimated,
    scene3Step, scene3SampleSpace, scene3SampleSpaceError,
    scene3NS, scene3NSError, scene3PS, scene3PSError,
    scene3Num, scene3Den, scene3Pct,
    scene3NumError, scene3DenError, scene3PctError,
    scene3ProbFeedback, scene3ShowBar, scene3AllBars, scene3NoError,
    compareBarsAnimated, scene4Step,
    scene4EqAnswer, scene4EqError, scene4VicAnswer, scene4VicError,
    scene4SumAnswer, scene4SumError, scene4RadioOrder,
    scene5Finished, scene5InternalPhase, scene6Finished, scene6InternalPhase, machineReady, scene7Finished,
    scene7UsesMachine, scene7HideAllDice, scene7ExperimentPhase,
  });

  const applyDevSnapshot = (snap: DevSnapshot) => {
    setDone(snap.done);
    setScene(snap.scene);
    setTransitioning(snap.transitioning);
    setCurrentFaceIdx(snap.currentFaceIdx);
    setBarsAnimated(snap.barsAnimated);
    setScene3Step(snap.scene3Step);
    setScene3SampleSpace(snap.scene3SampleSpace);
    setScene3SampleSpaceError(snap.scene3SampleSpaceError);
    setScene3NS(snap.scene3NS);
    setScene3NSError(snap.scene3NSError);
    setScene3PS(snap.scene3PS);
    setScene3PSError(snap.scene3PSError);
    setScene3Num(snap.scene3Num);
    setScene3Den(snap.scene3Den);
    setScene3Pct(snap.scene3Pct);
    setScene3NumError(snap.scene3NumError);
    setScene3DenError(snap.scene3DenError);
    setScene3PctError(snap.scene3PctError);
    setScene3ProbFeedback(snap.scene3ProbFeedback);
    setScene3ShowBar(snap.scene3ShowBar);
    setScene3AllBars(snap.scene3AllBars);
    setScene3NoError(snap.scene3NoError);
    setCompareBarsAnimated(snap.compareBarsAnimated);
    setScene4Step(snap.scene4Step);
    setScene4EqAnswer(snap.scene4EqAnswer);
    setScene4EqError(snap.scene4EqError);
    setScene4VicAnswer(snap.scene4VicAnswer);
    setScene4VicError(snap.scene4VicError);
    setScene4SumAnswer(snap.scene4SumAnswer);
    setScene4SumError(snap.scene4SumError);
    setScene4RadioOrder(snap.scene4RadioOrder);
    setScene5Finished(snap.scene5Finished);
    setScene5InternalPhase(snap.scene5InternalPhase);
    setScene6InternalPhase(snap.scene6InternalPhase);
    setScene6Finished(snap.scene6Finished);
    setMachineReady(snap.machineReady);
    setScene7Finished(snap.scene7Finished);
    setScene7UsesMachine(snap.scene7UsesMachine);
    setScene7HideAllDice(snap.scene7HideAllDice);
    setScene7ExperimentPhase(snap.scene7ExperimentPhase);

    // CRÍTICO: parent state e child state estavam desincronizados ao
    // navegar via DEV. Sem isso, scene7ExperimentPhase mostrava (ex.)
    // 'pairQuestion' no snapshot, mas o phase real do TwoDicesExperiment
    // continuava em 'colorExplain' — então a próxima seta avançava a partir
    // da fase REAL e o aluno via cenas serem puladas. Aqui sincronizamos
    // explicitamente o phase interno de cada handle filho.
    requestAnimationFrame(() => {
      if (snap.scene === 5) {
        practiceRef.current?.setCurrentPhaseId?.(snap.scene5InternalPhase);
      }
      if (snap.scene === 6) {
        machineExperimentRef.current?.setCurrentPhaseId?.(snap.scene6InternalPhase);
      }
      if (snap.scene === 7) {
        twoDicesExperimentRef.current?.setCurrentPhaseId?.(snap.scene7ExperimentPhase);
      }
    });
  };

  // Histórico de snapshots — vive aqui (não no DevNav) para persistir
  // capturas mesmo quando o painel DEV está desligado.
  const devHistoryRef = useRef<DevSnapshot[]>([]);
  const devCursorRef = useRef<number>(-1);
  const devRestoringRef = useRef<boolean>(false);
  const [, setDevHistoryTick] = useState(0);

  useEffect(() => {
    if (devRestoringRef.current) {
      devRestoringRef.current = false;
      return;
    }
    const snap = getDevSnapshot();
    const cursor = devCursorRef.current;
    devHistoryRef.current = devHistoryRef.current.slice(0, cursor + 1);
    devHistoryRef.current.push(snap);
    devCursorRef.current = devHistoryRef.current.length - 1;
    setDevHistoryTick(c => c + 1);
    // Toda mudança de devCenaId = uma interação (transição de cena/
    // sub-fase). Loga no log persistente para alimentar a contagem
    // de interações do card de estatísticas. Mais granular que o
    // `logTransition` legado (que só dispara em mudança de phase pai).
    logOvaInteraction('twoDices', devCenaId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devCenaId]);

  // ─────────────────────────────────────────────────────────────────
  // Progresso interno do OVA (0..1) — reportado para a barra de
  // progresso da sequência didática. Cada cena ocupa uma faixa fixa;
  // a Cena 7 (a mais longa) usa um índice das fases internas naturais
  // para granularidade extra. Heurístico — só precisa ser monotônico
  // o suficiente para o aluno perceber avanço.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onProgressChange) return;
    if (done) { onProgressChange(1); return; }

    // Faixas por cena (start, end). Re-balanceadas com base no esforço real
    // do aluno: Cena 7 (TwoDicesExperiment) contém complementaryEvents +
    // unionTheory + 6 exercícios da união — é ~67% do trabalho total do
    // OVA, NÃO 50% como na alocação anterior (que fazia a barra subir cedo
    // demais quando o aluno entrava nas seções pesadas da Cena 7).
    const SCENE_RANGES: Record<number, [number, number]> = {
      1: [0.00, 0.03],
      2: [0.03, 0.06],
      3: [0.06, 0.13],
      4: [0.13, 0.17],
      5: [0.17, 0.25],
      6: [0.25, 0.33],
      7: [0.33, 1.00],
    };
    const [start, end] = SCENE_RANGES[scene] ?? [0, 1];

    // Progresso interno dentro da cena (0..1)
    let within = 0;
    if (scene === 3) within = Math.min(1, scene3Step / 6);
    else if (scene === 4) within = Math.min(1, scene4Step / 3);
    else if (scene === 7) {
      // Pesos PEDAGÓGICOS por fase em vez de índice linear. Antes,
      // `idx / (PHASE_ORDER.length - 1)` tratava cada fase como tendo o
      // mesmo peso — mas unionTheory (1 entrada) tem 25 sub-fases e cada
      // unionExerciseN é uma atividade longa. O resultado: a barra
      // mostrava 87%+ quando o aluno entrava em unionTheory, mas ele
      // ainda tinha 50% do trabalho real pela frente (theory + 6 exercises).
      //
      // Pesos abaixo são proporcionais ao número aproximado de
      // interações/sub-fases de cada bloco. Fases opcionais (Ex7/Ex8)
      // peso 0 — não contam pro progresso principal.
      const PHASE_WEIGHTS: Record<string, number> = {
        'intro': 1, 'tree': 1, 'ready': 0.5, 'rolling': 0.5, 'landed': 0.5,
        'pickPair': 1, 'pickConfirm': 1, 'markTable': 1.5, 'feedback': 0.5,
        'pairQuestion': 0.5, 'pairExplain': 0.5, 'colorQuestion': 0.5, 'colorExplain': 0.5,
        'sumInput': 1, 'sumMarkTable': 1.5, 'sumComplete': 0.5,
        'sumAlienIntro': 0.5, 'sumPredictMax': 1, 'sumPredictMin': 1, 'sumImpossible': 1, 'sumReveal': 0.5,
        'probPair': 1, 'probPairReveal': 0.5, 'probSumTable': 2, 'probSumReveal': 0.5,
        'raceBet': 1, 'raceRunning': 1, 'raceFinished': 0.5,
        'complementaryEvents': 8,   // atividade grande com várias sub-fases
        'unionTheory': 15,          // muito grande — ~25 sub-fases internas
        'unionExercises': 5,        // Ex1
        'unionExercise2': 4,
        'unionExercise3': 4,
        'unionExercise4': 6,        // mais complexo (4 caminhos)
        'unionExercise5': 4,
        'unionExercise6': 3,        // revisão
        'twoDicesGameFree': 0,      // opcional — não conta
        'unionExercise8': 0,        // opcional — não conta
        'closing': 0.5,
        'finished': 0,
      };
      const PHASE_ORDER = Object.keys(PHASE_WEIGHTS);
      const totalWeight = Object.values(PHASE_WEIGHTS).reduce((s, w) => s + w, 0);
      const base = scene7ExperimentPhase.split('|')[0];
      const idx = PHASE_ORDER.indexOf(base);
      if (idx >= 0) {
        // Soma os pesos das fases ATÉ a atual (exclusiva) = posição de início.
        let cumulative = 0;
        for (let i = 0; i < idx; i++) cumulative += PHASE_WEIGHTS[PHASE_ORDER[i]];
        within = cumulative / totalWeight;
      }
    }

    onProgressChange(start + within * (end - start));
  }, [scene, scene3Step, scene4Step, scene7ExperimentPhase, done, onProgressChange]);

  // ─────────────────────────────────────────────────────────────────
  // Cronômetro do OVA: reivindica 'twoDices' enquanto é o estágio
  // ativo. O congelamento na tela de Parabéns (Ex6 finalSynthesis) é
  // tratado pelo próprio UnionExercise6Review via freezeOva/unfreezeOva
  // — desacoplado deste componente.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActiveStage) return;
    setActiveOva('twoDices');
  }, [isActiveStage]);

  // Simula o avanço NATURAL para a próxima cena, como se o aluno
  // tivesse respondido corretamente. Cobre Cenas 1–4 (estado parent)
  // de forma rica e usa goToScene/handles externos para Cenas 5–7.
  const devSimulateAdvance = () => {
    const wrap = (fn: () => void) => {
      try { flushSync(fn); } catch { fn(); }
    };

    // Cena 1: clicar Próximo
    if (scene === 1) { handleNext(); return; }

    // Cena 2: a sequência roda automaticamente — pular para a Cena 3 final
    if (scene === 2) {
      scene2Running.current = false;
      goToScene(3);
      return;
    }

    // Cena 3: cada step exige preencher e validar.
    // IMPORTANTE: NÃO chamamos validateXXX após setState — chamar a função
    // produziria closure stale (a validateXXX foi criada no render anterior
    // e lê o state antigo, mesmo após flushSync). Como sabemos que a resposta
    // simulada é correta, INLINAMOS o caminho de sucesso (mesmo som/alert/
    // mudança de step da função real) — assim a transição é determinística
    // e independente do timing de render.
    if (scene === 3) {
      if (scene3Step === 0) { wrap(() => setScene3Step(1)); return; }
      if (scene3Step === 1) {
        wrap(() => {
          setScene3SampleSpace('1,2,3,4,5,6');
          setScene3SampleSpaceError(false);
          setScene3Step(2);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', 'Espaço amostral identificado.', 'success', 2500);
        return;
      }
      if (scene3Step === 2) {
        wrap(() => {
          setScene3NS('6');
          setScene3NSError(false);
          setScene3Step(3);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', 'O espaço amostral tem 6 elementos.', 'success', 2500);
        return;
      }
      if (scene3Step === 3) {
        wrap(() => {
          setScene3PS('1');
          setScene3PSError(false);
          setScene3Step(4);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', 'P(S) = 1 — algum resultado certamente ocorre.', 'success', 2500);
        return;
      }
      if (scene3Step === 4) {
        wrap(() => {
          setScene3Num('1');
          setScene3Den('6');
          setScene3Pct('16,67');
          setScene3NumError(false);
          setScene3DenError(false);
          setScene3PctError(false);
          setScene3ProbFeedback('');
          setScene3ShowBar(true);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', `P(face ${scene3RandomFace}) = 1/6 ≈ 16,7%.`, 'success', 3000);
        // Avança para step 5 com o mesmo delay da validação real.
        setTimeout(() => setScene3Step(5), 3000);
        return;
      }
      if (scene3Step === 5) {
        wrap(() => {
          setScene3NoError(false);
          setScene3AllBars(true);
          setBarsAnimated(true);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Exatamente!', 'Em um dado equilibrado todas as faces têm a mesma probabilidade.', 'success', 3000);
        setTimeout(() => setScene3Step(6), 1200);
        return;
      }
      if (scene3Step === 6) { handleNext(); return; }
      return;
    }

    // Cena 4: idem, por step
    if (scene === 4) {
      if (scene4Step === 0) { wrap(() => setScene4Step(1)); return; }
      if (scene4Step === 1) {
        wrap(() => {
          setScene4EqAnswer('equiprovavel');
          setScene4VicAnswer('nao-equiprovavel');
          setScene4EqError(false);
          setScene4VicError(false);
          setScene4Step(2);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', 'Você classificou corretamente os espaços amostrais.', 'success', 3000);
        return;
      }
      if (scene4Step === 2) {
        wrap(() => {
          setScene4SumAnswer('1');
          setScene4SumError(false);
          setScene4Step(3);
        });
        playSound("/sounds/correct.mp3");
        createAlert('Correto!', 'A soma das probabilidades de todos os resultados possíveis é sempre 1 (100%).', 'success', 3000);
        return;
      }
      if (scene4Step === 3) { handleNext(); return; }
      return;
    }

    // Cena 5: avança simulando a interação do aluno via TwoDicesPracticeHandle.
    // Quando chega ao mainPhase 'finished', chama onFinished que vai para Cena 6.
    if (scene === 5) {
      if (practiceRef.current) {
        practiceRef.current.advance();
      } else {
        setScene5Finished(true);
        goToScene(6);
      }
      return;
    }
    // Cena 6: avança simulando a interação do aluno via DiceMachineExperimentHandle.
    if (scene === 6) {
      if (machineExperimentRef.current) {
        machineExperimentRef.current.advance();
      } else {
        setScene6Finished(true);
        goToScene(7);
      }
      return;
    }

    // Cena 7: avança via TwoDicesExperimentHandle, que internamente
    // delega para os handles dos sub-exercícios (UnionTheory,
    // UnionExerciseN) quando aplicável e mapeia o resto das fases.
    if (scene === 7) {
      if (twoDicesExperimentRef.current) {
        twoDicesExperimentRef.current.advance();
      } else if (scene7Finished) {
        playSound('/sounds/gameFinished.mp3');
        setDone(true);
      }
      return;
    }
  };

  // Se apresentação finalizada: dispara onFinished (se fornecido) ou
  // revela children no lugar das cenas. Em fluxos compostos (sequência
  // didática), onFinished é usado para passar o controle ao orquestrador
  // sem renderizar nada local. Em devMode, mantemos a TwoDicesDevNav
  // renderizada para que o usuário possa REBOBINAR o OVA via snapshot e
  // voltar a etapas anteriores — caso contrário, navegar a partir do
  // estado "concluído" deixaria a tela vazia.
  if (done) {
    if (onFinished) {
      return (
        <>
          <FinishedSignal onFinished={onFinished} />
          {devMode && (
            <TwoDicesDevNav
              historyRef={devHistoryRef}
              cursorRef={devCursorRef}
              restoringRef={devRestoringRef}
              onCursorChange={() => setDevHistoryTick(c => c + 1)}
              onSimulateAdvance={devSimulateAdvance}
              applyDevSnapshot={applyDevSnapshot}
            />
          )}
        </>
      );
    }
    return <>{children}</>;
  }

  // Cenas 1–3 exibem o dado 3D
  const showDice = (scene >= 1 && scene <= 3) || scene === 5;

  // ═══════ Renderização das Cenas ═══════
  return (
    <main className="bg-brand-otimath-lightest">
      {devMode && (
        <TwoDicesDevNav
          historyRef={devHistoryRef}
          cursorRef={devCursorRef}
          restoringRef={devRestoringRef}
          onCursorChange={() => setDevHistoryTick(c => c + 1)}
          onSimulateAdvance={devSimulateAdvance}
          applyDevSnapshot={applyDevSnapshot}
        />
      )}
      <Grid id="apresentacao-dado" paddings="pt-md" noEdgeMargins>
        <GridItem cols="col-[1_/_13]">
          <div className={`flex flex-col items-center gap-y-xs mx-auto ${scene === 7 && (scene7ExperimentPhase.startsWith('complementaryEvents') || scene7ExperimentPhase.startsWith('unionTheory') || scene7ExperimentPhase === 'unionExercises' || scene7ExperimentPhase === 'unionExercise2' || scene7ExperimentPhase === 'unionExercise3' || scene7ExperimentPhase === 'unionExercise4' || scene7ExperimentPhase === 'unionExercise5' || scene7ExperimentPhase === 'unionExercise6' || scene7ExperimentPhase === 'twoDicesGameFree' || scene7ExperimentPhase === 'unionExercise8') ? 'max-w-[1216px]' : 'max-w-[800px]'}`}>

            {/* Título da cena atual */}
            {scene === 1 && (
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">O Dado</h2>
            )}
            {scene === 2 && (
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">Conhecendo cada face</h2>
            )}
            {scene === 3 && (
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">Dado Equilibrado (Honesto)</h2>
            )}
            {scene === 4 && (
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">Dado Equilibrado (Honesto) × Dado Não Equilibrado (Viciado)</h2>
            )}

            {/* Dado 3D — montado uma vez, oculto na cena 4 */}
            <div ref={diceContainerRef} style={{ display: showDice ? 'block' : 'none', width: '100%' }}>
              <DiceScene ref={diceRef} />
            </div>

            {/* ═══════ CENA 1 — Texto informativo ═══════ */}
            {scene === 1 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[550px] text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <p className="ds-body-bold text-neutral-black" style={{ lineHeight: '1.8', fontSize: '1.05rem', textAlign: 'justify' }}>
                  Um dado é um sólido geométrico na forma de <strong>cubo</strong>.
                  Possui <strong>6 faces</strong>, cada uma marcada com um número
                  diferente de pontos chamados <em><strong>pintas</strong></em>,
                  variando de <strong>1</strong> a <strong>6</strong>.
                  As faces opostas de um dado sempre somam <strong>7</strong>.
                </p>
                <div className="flex justify-center mt-macro">
                  <Button
                    style="primary"
                    size="small"
                    icon={<ArrowRight aria-hidden="true" />}
                    onClick={handleNext}
                    disabled={transitioning}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {/* ═══════ CENA 2 — Info da face atual ═══════ */}
            {scene === 2 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[500px] text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 120 }}>
                {/* Definição do experimento aleatório — sempre visível */}
                <p className="ds-body-bold text-neutral-black mb-macro" style={{ lineHeight: '1.7', fontSize: '1rem', textAlign: 'justify' }}>
                  No lançamento de um dado, espera-se que ele entre em
                  repouso com uma das faces apoiada na mesa. O resultado
                  observado é o número de <strong>pintas</strong> na face voltada para cima.
                </p>
                {currentFaceIdx >= 0 && (
                  <>
                    <p className="ds-heading-extra text-brand-otimath-pure mb-micro">
                      Face {currentFaceIdx + 1}
                    </p>
                    <p className="ds-body-bold text-neutral-dark">
                      {FACE_LABELS[currentFaceIdx]}
                    </p>
                  </>
                )}
                {currentFaceIdx < 0 && (
                  <p className="ds-body-bold text-neutral-dark">Preparando lançamento...</p>
                )}
                {/* Indicador de progresso */}
                <div
                  className="flex justify-center gap-x-micro mt-macro"
                  role="progressbar"
                  aria-label="Progresso das faces apresentadas"
                  aria-valuemin={0}
                  aria-valuemax={6}
                  aria-valuenow={Math.max(0, currentFaceIdx + 1)}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="rounded-full"
                      style={{
                        width: 10,
                        height: 10,
                        background: i <= currentFaceIdx
                          ? 'var(--color-brand-otimath-pure)'
                          : 'var(--color-neutral-lighter)',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ═══════ CENA 3 — Dado equilibrado INTERATIVA ═══════ */}
            {scene === 3 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

                {/* TEXTO — sempre visível */}
                <p className="ds-body-bold text-neutral-black mb-macro" style={{ lineHeight: '1.8', fontSize: '1.05rem', textAlign: 'justify' }}>
                  Um dado é <strong>equilibrado</strong> quando todas as faces
                  têm a <strong>mesma probabilidade</strong> de aparecer.
                  Nenhuma face é favorecida, pois há <strong>simetria</strong>:
                  faces com mesma área, forma, tamanho, rugosidade
                  e mesmo tipo de material, além de massa distribuída
                  uniformemente. Nessas condições ideais,
                  todos os resultados têm a mesma chance. Assim,
                  trata-se de um <strong>modelo probabilístico equiprovável</strong>.
                </p>

                {/* ETAPA 0 — Ler texto, avançar */}
                {scene3Step === 0 && (
                  <div className="flex justify-center mt-macro">
                    <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={() => setScene3Step(1)}>
                      Continuar
                    </Button>
                  </div>
                )}

                {/* ETAPAS INTERATIVAS */}
                {scene3Step >= 1 && scene3Step < 6 && (
                  <div className="mt-macro">
                    {/* ETAPA 1 — Espaço amostral */}
                    {scene3Step === 1 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          Qual o <strong>espaço amostral</strong> do lançamento de um dado equilibrado?
                        </p>
                        {/* Layout: a expressão matemática "S = { ... }" forma uma
                            unidade atômica (flex-nowrap interno) que NUNCA quebra
                            entre o S, =, { e o input. O botão Conferir pode quebrar
                            para a linha de baixo via flex-wrap externo se faltar
                            espaço — preferível a vazar fora do card no mobile. */}
                        <div className="flex flex-wrap items-center gap-x-micro gap-y-micro">
                          <div className="flex flex-nowrap items-center gap-x-micro">
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">S = {'{'}</span>
                            <input
                              type="text"
                              value={scene3SampleSpace}
                              onChange={e => { setScene3SampleSpace(e.target.value); setScene3SampleSpaceError(false); }}
                              placeholder="x₁, x₂, ..., xₙ"
                              className="ds-body"
                              aria-label="Espaço amostral S"
                              aria-invalid={scene3SampleSpaceError}
                              aria-describedby={scene3SampleSpaceError ? 'scene3-sample-space-error' : undefined}
                              style={{
                                border: `2px solid ${scene3SampleSpaceError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 8, padding: '6px 10px', width: 180, textAlign: 'center',
                                outline: 'none',
                                minWidth: 0,
                              }}
                            />
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">{'}'}</span>
                          </div>
                          <Button style="primary" size="extra-small" onClick={validateSampleSpace}>Conferir</Button>
                        </div>
                        {scene3SampleSpaceError && (
                          <p
                            id="scene3-sample-space-error"
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold text-feedback-error-dark"
                          >
                            Verifique quais os resultados possíveis no lançamento de um dado.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 2 — n(S) = ? */}
                    {scene3Step === 2 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          Então, quantos resultados são possíveis no lançamento de um dado, ou seja, qual o <strong>número de elementos do espaço amostral</strong> n(S) desse experimento aleatório?
                        </p>
                        <div className="flex flex-wrap items-center gap-x-micro gap-y-micro">
                          <div className="flex flex-nowrap items-center gap-x-micro">
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">n(S) =</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={scene3NS}
                              onChange={e => {
                                const v = e.target.value.replace(/\D/g, '');
                                setScene3NS(v); setScene3NSError(false);
                              }}
                              placeholder="?"
                              className="ds-body"
                              aria-label="Número de elementos do espaço amostral n de S"
                              aria-invalid={scene3NSError}
                              aria-describedby={scene3NSError ? 'scene3-ns-error' : undefined}
                              style={{
                                border: `2px solid ${scene3NSError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 8, padding: '6px 10px', width: 80, textAlign: 'center',
                                outline: 'none',
                                minWidth: 0,
                              }}
                            />
                          </div>
                          <Button style="primary" size="extra-small" onClick={validateNS}>Conferir</Button>
                        </div>
                        {scene3NSError && (
                          <p
                            id="scene3-ns-error"
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold text-feedback-error-dark"
                          >
                            Conte quantos elementos você listou no espaço amostral S.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 3 — P(S) = ? */}
                    {scene3Step === 3 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          Ao lançar um dado equilibrado, qual a <strong>probabilidade de obter algum resultado</strong>?
                        </p>
                        <div className="flex flex-wrap items-center gap-x-micro gap-y-micro">
                          <div className="flex flex-nowrap items-center gap-x-micro">
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">P(S) =</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={scene3PS}
                              onChange={e => {
                                // Aceita dígitos, separador decimal (. ou ,), barra (/)
                                // para frações equivalentes a 1 (ex: 6/6) e o sinal %.
                                const next = e.target.value;
                                if (next === '' || /^\d*[.,]?\d*\/?\d*[.,]?\d*%?$/.test(next)) {
                                  setScene3PS(next); setScene3PSError(false);
                                }
                              }}
                              placeholder="?"
                              className="ds-body"
                              aria-label="Probabilidade do espaço amostral P de S"
                              aria-invalid={scene3PSError}
                              aria-describedby={scene3PSError ? 'scene3-ps-error' : undefined}
                              style={{
                                border: `2px solid ${scene3PSError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 8, padding: '6px 10px', width: 80, textAlign: 'center',
                                outline: 'none',
                                minWidth: 0,
                              }}
                            />
                          </div>
                          <Button style="primary" size="extra-small" onClick={validatePS}>Conferir</Button>
                        </div>
                        {scene3PSError && (
                          <p
                            id="scene3-ps-error"
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold text-feedback-error-dark"
                          >
                            Se o dado é lançado, algum resultado certamente ocorrerá. Qual probabilidade representa a certeza?
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 4 — P(face i) = ?/? ≈ ?% */}
                    {scene3Step === 4 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          Calcule a probabilidade de ocorrer a <strong>face {scene3RandomFace}</strong>:
                        </p>
                        {/* Layout: dois blocos matemáticos atômicos via flex-nowrap
                            interno — (1) "P(face X) = a/b" e (2) "≈ X%". Cada um
                            é uma unidade indivisível. Externo flex-wrap deixa o
                            "≈ X%" descer pra próxima linha quando faltar espaço,
                            e o Conferir descer pra terceira linha se necessário —
                            sem nunca orfanar operadores. */}
                        <div className="flex flex-wrap items-center gap-x-micro gap-y-micro">
                          <div className="flex flex-nowrap items-center gap-x-nano">
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">P(face {scene3RandomFace}) =</span>
                            <div className="inline-flex flex-col items-center mx-nano shrink-0">
                              <input
                                type="text" inputMode="numeric" value={scene3Num}
                                onChange={e => {
                                  const v = e.target.value.replace(/\D/g, '');
                                  setScene3Num(v); setScene3NumError(false); setScene3ProbFeedback('');
                                }}
                                placeholder="?" className="ds-body"
                                aria-label="Numerador da probabilidade"
                                aria-invalid={scene3NumError}
                                aria-describedby={scene3ProbFeedback ? 'scene3-prob-feedback' : undefined}
                                style={{
                                  border: `2px solid ${scene3NumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                  borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                                  minWidth: 0,
                                }}
                              />
                              <hr aria-hidden="true" style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '2px 0' }} />
                              <input
                                type="text" inputMode="numeric" value={scene3Den}
                                onChange={e => {
                                  const v = e.target.value.replace(/\D/g, '');
                                  setScene3Den(v); setScene3DenError(false); setScene3ProbFeedback('');
                                }}
                                placeholder="?" className="ds-body"
                                aria-label="Denominador da probabilidade"
                                aria-invalid={scene3DenError}
                                aria-describedby={scene3ProbFeedback ? 'scene3-prob-feedback' : undefined}
                                style={{
                                  border: `2px solid ${scene3DenError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                  borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                                  minWidth: 0,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-nowrap items-center gap-x-nano">
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">≈</span>
                            <input
                              type="text" inputMode="decimal" value={scene3Pct}
                              onChange={e => {
                                // Aceita dígitos + um separador decimal (. ou ,) + reticências (...) usadas
                                // para indicar dízima periódica (16,6...). Bloqueia letras e símbolos.
                                const next = e.target.value;
                                if (next === '' || /^\d*[.,]?\d*\.?\.?\.?$/.test(next) || next === '…') {
                                  setScene3Pct(next); setScene3PctError(false); setScene3ProbFeedback('');
                                }
                              }}
                              placeholder="?" className="ds-body"
                              aria-label="Probabilidade em porcentagem"
                              aria-invalid={scene3PctError}
                              aria-describedby={scene3ProbFeedback ? 'scene3-prob-feedback' : undefined}
                              style={{
                                border: `2px solid ${scene3PctError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 6, padding: '4px', width: 72, textAlign: 'center', outline: 'none',
                                minWidth: 0,
                              }}
                            />
                            <span className="ds-body-bold text-neutral-black whitespace-nowrap">%</span>
                          </div>
                          <Button style="primary" size="extra-small" onClick={validateProb} disabled={scene3ShowBar}>Conferir</Button>
                        </div>
                        {scene3ProbFeedback && (
                          <p
                            id="scene3-prob-feedback"
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold"
                            style={{ color: 'var(--color-feedback-error-dark)', textAlign: 'justify' }}
                          >
                            {scene3ProbFeedback}
                          </p>
                        )}
                        {/* Barra da face sorteada aparece ao acertar */}
                        {scene3ShowBar && (
                          <div className="flex justify-center mt-macro">
                            <AnimatedBar
                              height={90}
                              color="var(--color-brand-otimath-pure)"
                              faceNumber={scene3RandomFace}
                              label="1/6"
                              animate={true}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ETAPA 5 — Generalizar */}
                    {scene3Step === 5 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          As demais faces têm a <strong>mesma probabilidade</strong> que a face {scene3RandomFace} de ocorrer?
                        </p>
                        <div className="flex gap-x-micro">
                          <Button style="primary" size="small" onClick={() => handleGeneralize(true)} disabled={scene3AllBars}>Sim</Button>
                          <Button style="secondary" size="small" onClick={() => handleGeneralize(false)} disabled={scene3AllBars}>Não</Button>
                        </div>
                        {scene3NoError && (
                          <p
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold"
                            style={{ color: 'var(--color-feedback-error-dark)', textAlign: 'justify' }}
                          >
                            Releia a definição de dado equilibrado e tente novamente.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* GRÁFICO — aparece progressivamente */}
                {scene3AllBars && (
                  <div className="flex justify-center items-end gap-x-xxxs max-sm:gap-x-micro mt-macro" style={{ height: 150 }}>
                    {[1, 2, 3, 4, 5, 6].map((_, i) => (
                      <AnimatedBar
                        key={i}
                        height={90}
                        color="var(--color-brand-otimath-pure)"
                        faceNumber={i + 1}
                        label="1/6"
                        animate={barsAnimated}
                        delay={i * 120}
                      />
                    ))}
                  </div>
                )}

                {/* ETAPA 6 — Fechamento */}
                {scene3Step === 6 && (
                  <div className="mt-macro">
                    <p className="ds-body-bold text-neutral-black text-[1.05rem] text-justify">
                      Como o dado é equilibrado, cada face tem probabilidade
                    </p>
                    <p className="ds-body-bold text-neutral-black mt-micro text-center text-[1.05rem]">
                      <em>P</em>(face <em>i</em>) = <Fraction num="1" den="6" /> ≈ 16,7%, &nbsp; <em>i</em> = 1, 2, 3, 4, 5, 6
                    </p>
                    <p className="ds-body-bold text-neutral-black mt-micro text-[1.05rem] text-justify">
                      A soma de todas as probabilidades é{' '}
                      <span className="whitespace-nowrap">6 × <Fraction num="1" den="6" /> = 1.</span>
                    </p>
                    <div className="flex justify-center mt-macro">
                      <Button
                        style="primary"
                        size="small"
                        icon={<ArrowRight aria-hidden="true" />}
                        onClick={handleNext}
                        disabled={transitioning}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ CENA 4 — Painéis comparativos + interação ═══════ */}
            {scene === 4 && (
              <>
                <div className="flex gap-x-xs max-sm:flex-col max-sm:gap-y-xs w-full justify-center">
                  {/* Painel Equilibrado */}
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter flex-1 max-w-[370px] text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <p className="ds-heading-large text-brand-otimath-pure mb-macro">Dado Equilibrado</p>
                    <div className="flex justify-center items-end gap-x-xxxs" style={{ height: 170 }}>
                      {[1, 2, 3, 4, 5, 6].map((_, i) => (
                        <AnimatedBar
                          key={i}
                          height={90}
                          color="var(--color-brand-otimath-pure)"
                          faceNumber={i + 1}
                          animate={compareBarsAnimated}
                          delay={i * 80}
                        />
                      ))}
                    </div>
                    <p className="ds-small-bold text-neutral-black mt-micro">
                      Todas as faces têm a mesma probabilidade.
                    </p>
                  </div>

                  {/* Painel Viciado */}
                  <div className="bg-neutral-white rounded-lg p-xxs border flex-1 max-w-[370px] text-center"
                    style={{ borderColor: 'rgba(255,80,80,0.22)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <p className="ds-heading-large mb-macro" style={{ color: 'rgba(220,50,50,0.95)' }}>Dado Viciado</p>
                    <div className="flex justify-center items-end gap-x-xxxs" style={{ height: 170 }}>
                      {[1, 2, 3, 4, 5, 6].map((_, i) => (
                        <AnimatedBar
                          key={i}
                          height={BIASED_HEIGHTS[i]}
                          color="rgba(255,80,80,0.6)"
                          faceNumber={i + 1}
                          animate={compareBarsAnimated}
                          delay={i * 80}
                        />
                      ))}
                    </div>
                    <p className="ds-small-bold text-neutral-black mt-micro">
                      Algumas faces teriam maior probabilidade por não estarem presentes todas as condições de simetria.
                    </p>
                  </div>
                </div>

                {/* Perguntas interativas */}
                {scene4Step >= 1 && scene4Step < 2 && (
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full mt-xs shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-col gap-y-macro">
                      {/* Perguntas com ordem sorteada (perguntas e radios) */}
                      {(scene4RadioOrder[2]
                        ? (['eq', 'vic'] as const)
                        : (['vic', 'eq'] as const)
                      ).map(tipo => (
                        <div key={tipo} className="flex flex-col gap-y-micro">
                          <p className="ds-body-bold text-neutral-black text-justify">
                            {tipo === 'eq'
                              ? <>Quando utilizamos dados <strong>equilibrados</strong>, o espaço amostral é:</>
                              : <>Quando utilizamos dados <strong>não equilibrados</strong> (viciados), o espaço amostral é:</>
                            }
                          </p>
                          <div className="flex gap-x-macro">
                            {((tipo === 'eq' ? scene4RadioOrder[0] : scene4RadioOrder[1])
                              ? ['equiprovavel', 'nao-equiprovavel'] as const
                              : ['nao-equiprovavel', 'equiprovavel'] as const
                            ).map(val => (
                              <label key={val} className="flex items-center gap-x-nano cursor-pointer">
                                <input
                                  type="radio"
                                  name={tipo === 'eq' ? 'scene4eq' : 'scene4vic'}
                                  value={val}
                                  checked={tipo === 'eq' ? scene4EqAnswer === val : scene4VicAnswer === val}
                                  onChange={() => {
                                    if (tipo === 'eq') { setScene4EqAnswer(val); setScene4EqError(false); }
                                    else { setScene4VicAnswer(val); setScene4VicError(false); }
                                  }}
                                  style={{ accentColor: 'var(--color-brand-otimath-pure)', width: 18, height: 18 }}
                                />
                                <span className={`ds-body-bold ${(tipo === 'eq' ? scene4EqError : scene4VicError) ? 'text-feedback-error-dark' : 'text-neutral-black'}`}>
                                  {val === 'equiprovavel' ? 'Equiprovável' : 'Não equiprovável'}
                                </span>
                              </label>
                            ))}
                          </div>
                          {(tipo === 'eq' ? scene4EqError : scene4VicError) && (
                            <p
                              role="alert"
                              aria-live="assertive"
                              className="ds-small-bold text-feedback-error-dark"
                            >
                              Releia o texto apresentado e tente novamente.
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-center">
                        <Button style="primary" size="small" onClick={validateScene4}>Conferir</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conclusão após acertar — etapa 2: texto + pergunta soma */}
                {scene4Step >= 2 && (
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full mt-xs shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <p className="ds-body-bold text-neutral-black text-[1.05rem] text-justify">
                      Quando utilizamos dados <strong>equilibrados</strong>, o espaço amostral
                      é <strong>equiprovável</strong>. Quando utilizamos dados <strong>não
                      equilibrados</strong> (viciados), o espaço amostral
                      é <strong>não equiprovável</strong>.
                    </p>

                    {scene4Step === 2 && (
                      <div className="flex flex-col gap-y-micro mt-macro">
                        <p className="ds-body-bold text-neutral-black text-justify">
                          Mas a soma das probabilidades de ocorrer cada um dos resultados possíveis do experimento aleatório é
                          <input
                            type="text"
                            inputMode="decimal"
                            value={scene4SumAnswer}
                            onChange={e => {
                              // Aceita dígitos, separador decimal (. ou ,), barra (/) para
                              // fração equivalente a 1, e o sinal %.
                              const next = e.target.value;
                              if (next === '' || /^\d*[.,]?\d*\/?\d*[.,]?\d*%?$/.test(next)) {
                                setScene4SumAnswer(next); setScene4SumError(false);
                              }
                            }}
                            placeholder="?"
                            className="ds-body-bold"
                            aria-label="Soma das probabilidades dos resultados possíveis"
                            aria-invalid={scene4SumError}
                            aria-describedby={scene4SumError ? 'scene4-sum-error' : undefined}
                            style={{
                              border: `2px solid ${scene4SumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                              borderRadius: 6, padding: '4px 8px', width: 64, textAlign: 'center',
                              outline: 'none', marginLeft: 6, marginRight: 6,
                            }}
                          />
                          para ambos os casos.
                        </p>
                        <div className="flex justify-center">
                          <Button style="primary" size="extra-small" onClick={validateScene4Sum}>Conferir</Button>
                        </div>
                        {scene4SumError && (
                          <p
                            id="scene4-sum-error"
                            role="alert"
                            aria-live="assertive"
                            className="ds-small-bold text-feedback-error-dark"
                          >
                            Lembre-se do valor que você calculou para P(S) na etapa anterior.
                          </p>
                        )}
                      </div>
                    )}

                    {scene4Step === 3 && (
                      <>
                        <p className="ds-body-bold text-neutral-black mt-macro text-[1.05rem] text-justify">
                          Mas a soma das probabilidades de ocorrer cada um dos resultados possíveis do experimento aleatório é sempre igual a <strong>1</strong> (ou <strong>100%</strong>) para ambos os casos.
                        </p>
                        <div className="flex justify-center mt-macro">
                          <Button
                            style="primary"
                            size="small"
                            icon={<ArrowRight aria-hidden="true" />}
                            onClick={handleNext}
                            disabled={transitioning}
                          >
                            Próximo
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ═══════ CENA 5 — Componente separado ═══════ */}
            {scene === 5 && (
              <TwoDicesPractice
                ref={practiceRef}
                diceRef={diceRef}
                diceContainerRef={diceContainerRef}
                onPhaseChange={setScene5InternalPhase}
                createAlert={createAlert}
                onFinished={() => {
                  setScene5Finished(true);
                  goToScene(6);
                }}
              />
            )}

            {/* ═══════ MÁQUINA 3D — Montada desde a Cena 5 (escondida) para pré-inicializar
                WebGL (renderer, texturas, geometrias). Na Cena 6 fica visível. ═══════ */}
            {(scene === 5 || scene === 6) && (
              <div
                ref={diceMachineContainerRef}
                style={{
                  width: '100%',
                  display: scene === 6 ? 'block' : 'none',
                  position: 'relative',
                }}
              >
                {/* Skeleton sobre a máquina enquanto WebGL inicializa */}
                {!machineReady && scene === 6 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 10,
                      borderRadius: 8,
                      background: 'linear-gradient(110deg, #0a1628 30%, #142744 50%, #0a1628 70%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.4s ease-in-out infinite',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="ds-body-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Carregando a máquina...
                    </span>
                    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                  </div>
                )}
                <DiceMachineScene ref={diceMachineRef} onReady={() => setMachineReady(true)} />
              </div>
            )}

            {/* ═══════ CENA 6 — Experimento com a máquina ═══════ */}
            {scene === 6 && (
              <DiceMachineExperiment
                ref={machineExperimentRef}
                diceMachineRef={diceMachineRef}
                diceContainerRef={diceMachineContainerRef}
                onPhaseChange={setScene6InternalPhase}
                createAlert={createAlert}
                onFinished={() => {
                  setScene6Finished(true);
                  goToScene(7);
                }}
              />
            )}

            {/* ═══════ CENA 7 — Dois dados 3D + tabela 6×6 (SISTEMATIZAÇÃO a posteriori) ═══════
                Após perceber a aleatoriedade do par (verde, azul) na máquina e
                comprometer-se metacognitivamente com uma previsão de soma, o aluno
                chega à tabela 6×6 com uma pergunta viva: existe um padrão escondido?
                A tabela é a resposta — Freudenthal, 1991, p. 76. */}
            {scene === 7 && (
              <>
                {/* TwoDiceScene (padrão verde/azul) — visível em todas as fases exceto:
                    - colorQuestion (aí mostra a máquina)
                    - fases finais de probabilidade (aí esconde tudo) */}
                <div
                  ref={twoDiceContainerRef}
                  style={{
                    width: '100%',
                    display: (scene7UsesMachine || scene7HideAllDice) ? 'none' : 'block',
                  }}
                >
                  <TwoDiceScene ref={twoDiceRef} />
                </div>
                {/* DiceMachineScene (mesma máquina da Cena 6) — montada desde o início da Cena 7
                    para pré-inicializar a WebGL (texturas, geometrias, materiais). Escondida via
                    CSS até a fase colorQuestion. Evita delay de ~1-2s quando o aluno clica pela
                    primeira vez em "Lançar os dados brancos". */}
                <div
                  ref={diceMachineContainerRef}
                  style={{
                    width: '100%',
                    display: (scene7UsesMachine && !scene7HideAllDice) ? 'block' : 'none',
                  }}
                >
                  <DiceMachineScene ref={diceMachineRef} />
                </div>
                <TwoDicesExperiment
                  ref={twoDicesExperimentRef}
                  diceSceneRef={twoDiceRef}
                  diceContainerRef={twoDiceContainerRef}
                  diceMachineRef={diceMachineRef}
                  diceMachineContainerRef={diceMachineContainerRef}
                  unionTheoryRef={unionTheoryRef}
                  unionExercise1Ref={unionExercise1Ref}
                  unionExercise2Ref={unionExercise2Ref}
                  unionExercise3Ref={unionExercise3Ref}
                  unionExercise4Ref={unionExercise4Ref}
                  unionExercise5Ref={unionExercise5Ref}
                  unionExercise6Ref={unionExercise6Ref}
                  onMachineVisibilityChange={setScene7UsesMachine}
                  onHideAllDice={setScene7HideAllDice}
                  onPhaseChange={setScene7ExperimentPhase}
                  createAlert={createAlert}
                  onFinished={() => {
                    setScene7Finished(true);
                    // Som de jogo finalizado removido aqui — o consumer
                    // (TwoDicesExperiment) já toca o gameFinished.mp3
                    // antes de chamar este onFinished, manter aqui
                    // duplicava o som.
                    //
                    // Chama onFinished DIRETAMENTE (em vez de setDone(true)
                    // + FinishedSignal deferido). Setar done=true fazia o
                    // TwoDicesPresentation renderizar a branch `if (done)`
                    // entre o clique e a transição pra stage 'complete' —
                    // essa branch só monta o FinishedSignal (que retorna
                    // null), causando um flash em branco perceptível.
                    // Como esse `onFinished` é chamado de um event handler
                    // (não render), o anti-padrão "setState durante render"
                    // que motivou o FinishedSignal não se aplica aqui.
                    // setDone(true) ainda é usado nos outros 2 sites
                    // (devSimulateAdvance em scene 7) onde o
                    // FinishedSignal segue necessário pra defer.
                    onFinished?.();
                  }}
                />
              </>
            )}

          </div>
        </GridItem>
      </Grid>

      {/* Sistema de toast alerts — usado pelas validações das Cenas 3 e 4
          para feedback consistente com o restante do OVA dos dados. */}
      <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts} />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Barra de DEV interna do Dois Dados — uso restrito ao painel de DEV da
// sequência didática. O histórico de snapshots vive no parent
// (TwoDicesPresentation), garantindo que a captura continue acontecendo
// mesmo quando o painel está desligado. Este componente é apenas a UI
// de navegação (prev/next) sobre esse histórico — mesmo padrão do OVA
// do Disco (RouletteDevNav).
// ─────────────────────────────────────────────────────────────────
function TwoDicesDevNav<TSnap>({
  historyRef, cursorRef, restoringRef, onCursorChange,
  onSimulateAdvance, applyDevSnapshot,
}: Readonly<{
  historyRef: React.MutableRefObject<TSnap[]>;
  cursorRef: React.MutableRefObject<number>;
  restoringRef: React.MutableRefObject<boolean>;
  onCursorChange: () => void;
  onSimulateAdvance: () => void;
  applyDevSnapshot: (snap: TSnap) => void;
}>) {
  const goPrev = () => {
    if (cursorRef.current > 0) {
      cursorRef.current -= 1;
      restoringRef.current = true;
      // applyDevSnapshot dispara várias setStates que React baterá num
      // único re-render; o useEffect no parent detecta restoringRef e
      // não empilha snapshot novo.
      applyDevSnapshot(historyRef.current[cursorRef.current]);
      onCursorChange();
    }
  };

  const goNext = () => {
    if (cursorRef.current < historyRef.current.length - 1) {
      cursorRef.current += 1;
      restoringRef.current = true;
      applyDevSnapshot(historyRef.current[cursorRef.current]);
      onCursorChange();
      return;
    }
    // Sem snapshot futuro — simula a resposta correta do aluno para
    // construir a próxima cena.
    onSimulateAdvance();
  };

  const positionLabel = `Cena ${cursorRef.current + 1}`;

  return (
    <div className="relative z-98 flex flex-wrap items-center justify-center gap-x-quarck gap-y-quarck p-quarck rounded-md bg-feedback-warning-lightest border border-feedback-warning-light text-neutral-darkest">
      <span className="ds-caption font-bold">DEV — Dois Dados:</span>
      <button
        type="button"
        onClick={goPrev}
        disabled={cursorRef.current <= 0}
        aria-label="Cena anterior"
        className="flex items-center justify-center w-6 h-6 rounded-sm border border-neutral-light bg-neutral-white cursor-pointer hover:bg-neutral-lightest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </button>
      <span className="ds-caption">
        {positionLabel} de {historyRef.current.length}
      </span>
      <button
        type="button"
        onClick={goNext}
        aria-label="Próxima cena (simula resposta correta)"
        className="flex items-center justify-center w-6 h-6 rounded-sm border border-neutral-light bg-neutral-white cursor-pointer hover:bg-neutral-lightest"
      >
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
