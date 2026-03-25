'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/global/Button';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { ArrowRight, Dices } from 'lucide-react';
import { playSound } from '@/hooks/global/useSound';
import type { DiceSceneHandle } from './DiceScene';

// Importação dinâmica do DiceScene (Three.js precisa do browser)
const DiceScene = dynamic(() => import('./DiceScene'), { ssr: false });

// ═══════ Constantes ═══════

const FACE_LABELS = [
  'uma pinta', 'duas pintas', 'três pintas',
  'quatro pintas', 'cinco pintas', 'seis pintas'
];
const DICE_ICONS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Alturas das barras do dado viciado (px)
const BIASED_HEIGHTS = [20, 35, 90, 55, 110, 140];

// ═══════ Barra animada ═══════
function AnimatedBar({
  height,
  color,
  icon,
  label,
  animate,
  delay,
}: {
  height: number;
  color: string;
  icon: string;
  label?: string;
  animate: boolean;
  delay?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-y-nano">
      <div
        style={{
          width: 28,
          height: animate ? height : 0,
          background: color,
          borderRadius: '4px 4px 0 0',
          transition: `height 1.2s ease-out ${delay || 0}ms`,
        }}
      />
      <span className="ds-body" style={{ fontSize: '1.3rem' }}>{icon}</span>
      {label && <span className="ds-caption text-neutral-dark">{label}</span>}
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

  // Cena 3: barras animadas
  const [barsAnimated, setBarsAnimated] = useState(false);

  // Cena 4: barras comparativas
  const [compareBarsAnimated, setCompareBarsAnimated] = useState(false);

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
        if (num === 3) setTimeout(() => setBarsAnimated(true), 200);
        if (num === 4) setTimeout(() => setCompareBarsAnimated(true), 200);
      });
    }, 400);
  }, [transitioning, startScene2]);

  // ── Botão "Próximo" ──
  const handleNext = useCallback(() => {
    if (transitioning) return;

    if (scene === 4) {
      playSound("/sounds/gameFinished.mp3");
      setDone(true);
      return;
    }

    if (scene < 4) goToScene(scene + 1);
  }, [scene, transitioning, goToScene]);

  // Se apresentação finalizada, mostrar o OVA
  if (done) return <>{children}</>;

  // Cenas 1–3 exibem o dado 3D
  const showDice = scene >= 1 && scene <= 3;

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
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">Dado Equilibrado</h2>
            )}
            {scene === 4 && (
              <h2 className="ds-heading-ultra text-brand-otimath-dark text-center">Equilibrado × Viciado</h2>
            )}

            {/* Dado 3D — montado uma vez, oculto na cena 4 */}
            <div style={{ display: showDice ? 'block' : 'none', width: '100%' }}>
              <DiceScene ref={diceRef} />
            </div>

            {/* ═══════ CENA 1 — Texto informativo ═══════ */}
            {scene === 1 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[550px] text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="ds-body text-neutral-darkest" style={{ lineHeight: '1.7' }}>
                  Um dado é um sólido geométrico na forma de cubo.
                  Possui 6 faces, cada uma marcada com um número
                  diferente de pontos — chamados <em>pintas</em> —
                  variando de 1 a 6.
                </p>
                <div className="flex justify-center gap-x-micro mt-macro" style={{ fontSize: '2rem', color: 'var(--color-brand-otimath-medium)' }}>
                  {DICE_ICONS.map((icon, i) => <span key={i}>{icon}</span>)}
                </div>
              </div>
            )}

            {/* ═══════ CENA 2 — Info da face atual ═══════ */}
            {scene === 2 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[400px] text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 120 }}>
                {currentFaceIdx >= 0 && (
                  <>
                    <p className="ds-heading-extra text-brand-otimath-pure mb-micro">
                      Face {currentFaceIdx + 1}
                    </p>
                    <p className="ds-body text-neutral-dark">
                      {FACE_LABELS[currentFaceIdx]}
                    </p>
                  </>
                )}
                {currentFaceIdx < 0 && (
                  <p className="ds-body text-neutral-dark">Preparando lançamento...</p>
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

            {/* ═══════ CENA 3 — Dado equilibrado + barras ═══════ */}
            {scene === 3 && (
              <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter max-w-[550px] text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="ds-body text-neutral-darkest mb-macro" style={{ lineHeight: '1.7' }}>
                  Um dado é equilibrado quando todas as faces
                  têm exatamente a mesma probabilidade de aparecer
                  ao ser lançado. Nenhuma face é favorecida.
                </p>
                {/* Barras animadas */}
                <div className="flex justify-center items-end gap-x-micro" style={{ height: 130 }}>
                  {DICE_ICONS.map((icon, i) => (
                    <AnimatedBar
                      key={i}
                      height={80}
                      color="var(--color-brand-otimath-pure)"
                      icon={icon}
                      label="1/6"
                      animate={barsAnimated}
                    />
                  ))}
                </div>
                {/* Fórmula */}
                <p className="ds-body text-neutral-darkest mt-macro">
                  <em>P</em>(face <em>i</em>) =
                  <Fraction num="1" den="6" />
                  ≈ 16,7%, &nbsp; <em>i</em> = 1, 2, 3, 4, 5, 6
                </p>
              </div>
            )}

            {/* ═══════ CENA 4 — Painéis comparativos ═══════ */}
            {scene === 4 && (
              <>
                <div className="flex gap-x-xs max-sm:flex-col max-sm:gap-y-xs w-full justify-center">
                  {/* Painel Equilibrado */}
                  <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter flex-1 max-w-[340px] text-center"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <p className="ds-heading-large text-brand-otimath-pure mb-macro">Dado Equilibrado</p>
                    <div className="flex justify-center items-end gap-x-micro" style={{ height: 170 }}>
                      {DICE_ICONS.map((icon, i) => (
                        <AnimatedBar
                          key={i}
                          height={80}
                          color="var(--color-brand-otimath-pure)"
                          icon={icon}
                          animate={compareBarsAnimated}
                          delay={i * 80}
                        />
                      ))}
                    </div>
                    <p className="ds-small text-neutral-dark mt-micro">
                      Todas as faces têm a mesma chance
                    </p>
                  </div>

                  {/* Painel Viciado */}
                  <div className="bg-neutral-white rounded-lg p-xxs border flex-1 max-w-[340px] text-center"
                    style={{ borderColor: 'rgba(255,80,80,0.22)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <p className="ds-heading-large mb-macro" style={{ color: 'rgba(255,80,80,0.85)' }}>Dado Viciado</p>
                    <div className="flex justify-center items-end gap-x-micro" style={{ height: 170 }}>
                      {DICE_ICONS.map((icon, i) => (
                        <AnimatedBar
                          key={i}
                          height={BIASED_HEIGHTS[i]}
                          color="rgba(255,80,80,0.6)"
                          icon={icon}
                          animate={compareBarsAnimated}
                          delay={i * 80}
                        />
                      ))}
                    </div>
                    <p className="ds-small text-neutral-dark mt-micro">
                      Algumas faces teriam mais chance
                    </p>
                  </div>
                </div>

                <p className="ds-body-bold text-neutral-darkest text-center mt-macro" style={{ maxWidth: 500 }}>
                  No estudo da Probabilidade, sempre utilizamos dados equilibrados.
                </p>
              </>
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
        {scene !== 2 && (
          <Button
            style="primary"
            size="small"
            icon={scene === 4 ? <Dices /> : <ArrowRight />}
            onClick={handleNext}
            disabled={transitioning}
          >
            {scene === 4 ? 'Iniciar Simulação' : 'Próximo'}
          </Button>
        )}
      </div>
    </main>
  );
}
