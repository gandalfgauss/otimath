'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/global/Button';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { ArrowRight, Dices } from 'lucide-react';
import { playSound } from '@/hooks/global/useSound';
import type { DiceSceneHandle } from './DiceScene';
import { TwoDicesPractice } from './TwoDicesPractice';

// Importação dinâmica do DiceScene (Three.js precisa do browser)
const DiceScene = dynamic(() => import('./DiceScene'), { ssr: false });

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
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ═══════ Componente principal ═══════
interface TwoDicesPresentationProps {
  children: ReactNode;
}

export function TwoDicesPresentation({ children }: TwoDicesPresentationProps) {
  const [done, setDone] = useState(false);
  const [scene, setScene] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  // Banner de retomada
  const [showBanner, setShowBanner] = useState(true);

  // Ref do dado 3D
  const diceRef = useRef<DiceSceneHandle>(null);

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
  const [scene5DiceColor, setScene5DiceColor] = useState<'green' | 'blue'>('green');

  // Banner desaparece após 4s
  useEffect(() => {
    const t = setTimeout(() => setShowBanner(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Ativar idle nas cenas 1 e 3
  useEffect(() => {
    if (scene === 1 || scene === 3) {
      const t = setTimeout(() => diceRef.current?.setIdle(true), 250);
      return () => clearTimeout(t);
    }
  }, [scene]);

  // ── Iniciar sequência da Cena 2 ──
  const startScene2 = useCallback(async () => {
    if (scene2Running.current) return;
    scene2Running.current = true;
    diceRef.current?.setIdle(false);

    for (let i = 0; i < 6; i++) {
      setCurrentFaceIdx(i);
      if (diceRef.current) {
        await diceRef.current.roll(i + 1);
      }
      // Espera breve para o aluno ver a face
      await new Promise(r => setTimeout(r, 800));
    }

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
    setFadeIn(false);

    setTimeout(() => {
      setScene(num);

      // Resetar estados por cena
      if (num === 3) setBarsAnimated(false);
      if (num === 4) setCompareBarsAnimated(false);

      // Fade in
      requestAnimationFrame(() => {
        setFadeIn(true);
        setTransitioning(false);

        // Iniciar comportamento da cena
        if (num === 2) {
          setCurrentFaceIdx(-1);
          diceRef.current?.setIdle(false);
          setTimeout(() => startScene2(), 300);
        }
        if (num === 3) { setBarsAnimated(false); setScene3Step(0); }
        if (num === 4) {
          setScene4Step(0);
          setScene4EqAnswer('');
          setScene4VicAnswer('');
          setScene4EqError(false);
          setScene4VicError(false);
          setScene4RadioOrder([Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]);
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

  const validateSampleSpace = () => {
    const clean = scene3SampleSpace.replace(/\s/g, '').replace(/[{}]/g, '');
    const nums = clean.split(',').map(Number).sort();
    if (nums.length === 6 && nums.every((n, i) => n === i + 1)) {
      setScene3SampleSpaceError(false);
      playSound("/sounds/correct.mp3");
      setScene3Step(2);
    } else {
      setScene3SampleSpaceError(true);
      playSound("/sounds/incorrect.mp3");
    }
  };

  const validateNS = () => {
    const v = parseInt(scene3NS.trim());
    if (v === 6) {
      setScene3NSError(false);
      playSound("/sounds/correct.mp3");
      setScene3Step(3);
    } else {
      setScene3NSError(true);
      playSound("/sounds/incorrect.mp3");
    }
  };

  const validatePS = () => {
    const v = scene3PS.trim().replace(',', '.').replace('%', '');
    if (v === '1' || v === '100') {
      setScene3PSError(false);
      playSound("/sounds/correct.mp3");
      setScene3Step(4);
    } else {
      setScene3PSError(true);
      playSound("/sounds/incorrect.mp3");
    }
  };

  const validateProb = () => {
    const num = parseInt(scene3Num);
    const den = parseInt(scene3Den);
    const numOk = num === 1;
    const denOk = den === 6;
    const fracOk = denOk && numOk;
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
      setScene3ShowBar(true);
      setTimeout(() => setScene3Step(5), 800);
    } else {
      playSound("/sounds/incorrect.mp3");

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
    if (answer) {
      setScene3NoError(false);
      setScene3AllBars(true);
      setBarsAnimated(true);
      playSound("/sounds/correct.mp3");
      setTimeout(() => setScene3Step(6), 1200);
    } else {
      setScene3NoError(true);
      playSound("/sounds/incorrect.mp3");
    }
  };

  // ── Validação da Cena 4 ──
  const validateScene4 = () => {
    const eqOk = scene4EqAnswer === 'equiprovavel';
    const vicOk = scene4VicAnswer === 'nao-equiprovavel';

    setScene4EqError(!eqOk);
    setScene4VicError(!vicOk);

    if (eqOk && vicOk) {
      playSound("/sounds/correct.mp3");
      setScene4Step(2);
    } else {
      playSound("/sounds/incorrect.mp3");
    }
  };

  // ── Validação da soma P(Ω) = 1 na Cena 4 ──
  const validateScene4Sum = () => {
    const v = scene4SumAnswer.trim().replace(',', '.').replace('%', '');
    if (v === '1' || v === '100') {
      setScene4SumError(false);
      playSound("/sounds/correct.mp3");
      setScene4Step(3);
    } else {
      setScene4SumError(true);
      playSound("/sounds/incorrect.mp3");
    }
  };

  // ── Botão "Próximo" ──
  const handleNext = useCallback(() => {
    if (transitioning) return;

    if (scene === 5 && scene5Finished) {
      playSound("/sounds/gameFinished.mp3");
      setDone(true);
      return;
    }

    if (scene < 5) goToScene(scene + 1);
  }, [scene, transitioning, goToScene, scene5Finished]);

  // Se apresentação finalizada, mostrar o OVA
  if (done) return <>{children}</>;

  // Cenas 1–3 exibem o dado 3D
  const showDice = (scene >= 1 && scene <= 3) || scene === 5;

  // ═══════ Renderização das Cenas ═══════
  return (
    <main
      className="min-h-screen bg-brand-otimath-lightest"
      style={{ transition: 'opacity 0.4s ease', opacity: fadeIn ? 1 : 0 }}
    >
      {/* Banner de retomada */}
      {showBanner && (
        <div
          className="bg-brand-otimath-lighter border-b border-neutral-light px-xxs py-micro flex items-center gap-x-micro"
          style={{
            transition: 'opacity 1s ease',
            opacity: showBanner ? 1 : 0,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎲</span>
          <span className="ds-small text-neutral-dark">
            No OVA anterior, você já encontrou este objeto. Agora vamos conhecê-lo em detalhe.
          </span>
        </div>
      )}

      <Grid id="apresentacao-dado" paddings="pt-xl pb-huge">
        <GridItem cols="col-[1_/_13]">
          <div className="flex flex-col items-center gap-y-xs max-w-[800px] mx-auto">

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
            <div style={{ display: showDice ? 'block' : 'none', width: '100%' }}>
              <DiceScene ref={diceRef} />
            </div>

            {/* ═══════ CENA 1 — Texto informativo ═══════ */}
            {scene === 1 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[550px] text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="ds-body-bold text-neutral-black" style={{ lineHeight: '1.8', fontSize: '1.05rem', textAlign: 'justify' }}>
                  Um dado é um sólido geométrico na forma de <strong>cubo</strong>.
                  Possui <strong>6 faces</strong>, cada uma marcada com um número
                  diferente de pontos chamados <em><strong>pintas</strong></em>,
                  variando de <strong>1</strong> a <strong>6</strong>.
                  As faces opostas de um dado sempre somam <strong>7</strong>.
                </p>
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
                <div className="flex justify-center gap-x-micro mt-macro">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
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
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

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
                    <Button style="primary" size="small" icon={<ArrowRight />} onClick={() => setScene3Step(1)}>
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
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          Qual o <strong>espaço amostral</strong> do lançamento de um dado equilibrado?
                        </p>
                        <div className="flex items-center gap-x-micro">
                          <span className="ds-body-bold text-neutral-black">S = {'{'}</span>
                          <input
                            type="text"
                            value={scene3SampleSpace}
                            onChange={e => { setScene3SampleSpace(e.target.value); setScene3SampleSpaceError(false); }}
                            placeholder="x₁, x₂, ..., xₙ"
                            className="ds-body"
                            style={{
                              border: `2px solid ${scene3SampleSpaceError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                              borderRadius: 8, padding: '6px 10px', width: 180, textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                          <span className="ds-body-bold text-neutral-black">{'}'}</span>
                          <Button style="primary" size="extra-small" onClick={validateSampleSpace}>Conferir</Button>
                        </div>
                        {scene3SampleSpaceError && (
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                            Verifique quais os resultados possíveis no lançamento de um dado.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 2 — n(S) = ? */}
                    {scene3Step === 2 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          Então, quantos resultados são possíveis no lançamento de um dado, ou seja, qual o <strong>número de elementos do espaço amostral</strong> n(S) desse experimento aleatório?
                        </p>
                        <div className="flex items-center gap-x-micro">
                          <span className="ds-body-bold text-neutral-black">n(S) =</span>
                          <input
                            type="text"
                            value={scene3NS}
                            onChange={e => { setScene3NS(e.target.value); setScene3NSError(false); }}
                            placeholder="?"
                            className="ds-body"
                            style={{
                              border: `2px solid ${scene3NSError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                              borderRadius: 8, padding: '6px 10px', width: 80, textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                          <Button style="primary" size="extra-small" onClick={validateNS}>Conferir</Button>
                        </div>
                        {scene3NSError && (
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                            Conte quantos elementos você listou no espaço amostral S.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 3 — P(S) = ? */}
                    {scene3Step === 3 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          Ao lançar um dado equilibrado, qual a <strong>probabilidade de obter algum resultado</strong>?
                        </p>
                        <div className="flex items-center gap-x-micro">
                          <span className="ds-body-bold text-neutral-black">P(S) =</span>
                          <input
                            type="text"
                            value={scene3PS}
                            onChange={e => { setScene3PS(e.target.value); setScene3PSError(false); }}
                            placeholder="?"
                            className="ds-body"
                            style={{
                              border: `2px solid ${scene3PSError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                              borderRadius: 8, padding: '6px 10px', width: 80, textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                          <Button style="primary" size="extra-small" onClick={validatePS}>Conferir</Button>
                        </div>
                        {scene3PSError && (
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                            Se o dado é lançado, algum resultado certamente ocorrerá. Qual probabilidade representa a certeza?
                          </p>
                        )}
                      </div>
                    )}

                    {/* ETAPA 4 — P(face i) = ?/? ≈ ?% */}
                    {scene3Step === 4 && (
                      <div className="flex flex-col gap-y-micro">
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          Calcule a probabilidade de ocorrer a <strong>face {scene3RandomFace}</strong>:
                        </p>
                        <div className="flex items-center gap-x-micro flex-wrap">
                          <span className="ds-body-bold text-neutral-black">P(face {scene3RandomFace}) =</span>
                          <div className="inline-flex flex-col items-center mx-nano">
                            <input
                              type="text" value={scene3Num}
                              onChange={e => { setScene3Num(e.target.value); setScene3NumError(false); setScene3ProbFeedback(''); }}
                              placeholder="?" className="ds-body"
                              style={{
                                border: `2px solid ${scene3NumError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                              }}
                            />
                            <hr style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '2px 0' }} />
                            <input
                              type="text" value={scene3Den}
                              onChange={e => { setScene3Den(e.target.value); setScene3DenError(false); setScene3ProbFeedback(''); }}
                              placeholder="?" className="ds-body"
                              style={{
                                border: `2px solid ${scene3DenError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                                borderRadius: 6, padding: '4px', width: 48, textAlign: 'center', outline: 'none',
                              }}
                            />
                          </div>
                          <span className="ds-body-bold text-neutral-black">≈</span>
                          <input
                            type="text" value={scene3Pct}
                            onChange={e => { setScene3Pct(e.target.value); setScene3PctError(false); setScene3ProbFeedback(''); }}
                            placeholder="?" className="ds-body"
                            style={{
                              border: `2px solid ${scene3PctError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`,
                              borderRadius: 6, padding: '4px', width: 72, textAlign: 'center', outline: 'none',
                            }}
                          />
                          <span className="ds-body-bold text-neutral-black">%</span>
                          <Button style="primary" size="extra-small" onClick={validateProb}>Conferir</Button>
                        </div>
                        {scene3ProbFeedback && (
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)', textAlign: 'justify' }}>
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
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          As demais faces têm a <strong>mesma probabilidade</strong> que a face {scene3RandomFace} de ocorrer?
                        </p>
                        <div className="flex gap-x-micro">
                          <Button style="primary" size="small" onClick={() => handleGeneralize(true)}>Sim</Button>
                          <Button style="secondary" size="small" onClick={() => handleGeneralize(false)}>Não</Button>
                        </div>
                        {scene3NoError && (
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)', textAlign: 'justify' }}>
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
                    <p className="ds-body-bold text-neutral-black" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
                      Como o dado é equilibrado, cada face tem probabilidade
                    </p>
                    <p className="ds-body-bold text-neutral-black mt-micro text-center" style={{ fontSize: '1.05rem' }}>
                      <em>P</em>(face <em>i</em>) = <Fraction num="1" den="6" /> ≈ 16,7%, &nbsp; <em>i</em> = 1, 2, 3, 4, 5, 6
                    </p>
                    <p className="ds-body-bold text-neutral-black mt-micro" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
                      A soma de todas as probabilidades é{' '}
                      <span style={{ whiteSpace: 'nowrap' }}>6 × <Fraction num="1" den="6" /> = 1.</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ CENA 4 — Painéis comparativos + interação ═══════ */}
            {scene === 4 && (
              <>
                <div className="flex gap-x-xs max-sm:flex-col max-sm:gap-y-xs w-full justify-center">
                  {/* Painel Equilibrado */}
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter flex-1 max-w-[370px] text-center"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full mt-xs"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex flex-col gap-y-macro">
                      {/* Perguntas com ordem sorteada (perguntas e radios) */}
                      {(scene4RadioOrder[2]
                        ? (['eq', 'vic'] as const)
                        : (['vic', 'eq'] as const)
                      ).map(tipo => (
                        <div key={tipo} className="flex flex-col gap-y-micro">
                          <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
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
                            <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                              Releia o texto acima e tente novamente.
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
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[580px] w-full mt-xs"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <p className="ds-body-bold text-neutral-black" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
                      Quando utilizamos dados <strong>equilibrados</strong>, o espaço amostral
                      é <strong>equiprovável</strong>. Quando utilizamos dados <strong>não
                      equilibrados</strong> (viciados), o espaço amostral
                      é <strong>não equiprovável</strong>.
                    </p>

                    {scene4Step === 2 && (
                      <div className="flex flex-col gap-y-micro mt-macro">
                        <p className="ds-body-bold text-neutral-black" style={{ textAlign: 'justify' }}>
                          Mas a soma das probabilidades de ocorrer cada um dos resultados possíveis do experimento aleatório é
                          <input
                            type="text"
                            value={scene4SumAnswer}
                            onChange={e => { setScene4SumAnswer(e.target.value); setScene4SumError(false); }}
                            placeholder="?"
                            className="ds-body-bold"
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
                          <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                            Lembre-se do valor que você calculou para P(S) na etapa anterior.
                          </p>
                        )}
                      </div>
                    )}

                    {scene4Step === 3 && (
                      <p className="ds-body-bold text-neutral-black mt-macro" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
                        Mas a soma das probabilidades de ocorrer cada um dos resultados possíveis do experimento aleatório é sempre igual a <strong>1</strong> (ou <strong>100%</strong>) para ambos os casos.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ═══════ CENA 5 — Componente separado ═══════ */}
            {scene === 5 && (
              <TwoDicesPractice
                diceRef={diceRef}
                onColorChange={setScene5DiceColor}
                onFinished={() => {
                  setScene5Finished(true);
                }}
              />
            )}

          </div>
        </GridItem>
      </Grid>

      {/* Rodapé fixo com navegação */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-neutral-white border-t border-neutral-lighter px-xxs py-micro flex items-center justify-between"
        style={{ zIndex: 50 }}
      >
        <span className="ds-caption text-neutral-medium">
          OVA Probabilidade — Dois Dados · Rangel Freitas dos Santos · PROFMAT / UFVJM
        </span>
        {scene !== 2 && !(scene === 3 && scene3Step < 6) && !(scene === 4 && scene4Step < 3) && !(scene === 5 && !scene5Finished) && (
          <Button
            style="primary"
            size="small"
            icon={scene === 4 ? <Dices /> : <ArrowRight />}
            onClick={handleNext}
            disabled={transitioning}
          >
            {scene === 5 ? 'Iniciar Simulação' : scene === 4 ? 'Próximo' : 'Próximo'}
          </Button>
        )}
      </div>
    </main>
  );
}
