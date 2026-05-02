'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { HeroBanner } from "@/components/global/HeroBanner";
import { OvaCredits } from "@/components/global/OvaCredits";
import { TextBlock } from "@/components/global/TextBlock";
import { Button } from "@/components/global/Button";
import { Grid } from "@/components/global/Grid";
import { GridItem } from "@/components/global/GridItem";
import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { RouletteGame } from "@/components/teaching/probability/roulette/RouletteGame";
import { TwoDicesPresentation } from "@/components/teaching/probability/two-dices/TwoDicesPresentation";
import { playSound } from "@/hooks/global/useSound";
import heroBannerProbabilityImage from '@/images/teaching/probability/probabilityBanner.webp';

type Stage = 'intro' | 'roulette' | 'transition' | 'twoDices' | 'complete';

const STAGES: Stage[] = ['intro', 'roulette', 'transition', 'twoDices', 'complete'];
const STAGE_LABELS: Record<Stage, string> = {
  intro:      'Introdução',
  roulette:   'OVA — Disco Aleatório',
  transition: 'Transição entre OVAs',
  twoDices:   'OVA — Dois Dados',
  complete:   'Conclusão',
};

export default function DidacticSequencePage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [devMode, setDevMode] = useState(false);
  const ovaContainerRef = useRef<HTMLDivElement>(null);

  // Ao entrar nas fases dos OVAs ou na transição, rola até o início do bloco
  useEffect(() => {
    if (stage === 'intro') return;
    requestAnimationFrame(() => {
      ovaContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [stage]);

  // Som de conclusão ao chegar na tela final
  useEffect(() => {
    if (stage === 'complete') playSound('/sounds/gameFinished.mp3');
  }, [stage]);

  const goToStage = useCallback((target: Stage) => setStage(target), []);

  // Renderização: enquanto o devMode estiver ativo, mantemos todas as cenas
  // montadas (com display:none nas que não são a atual) para preservar o
  // estado interno dos OVAs ao navegar entre cenas. Fora do devMode, a renderização
  // permanece condicional como no fluxo normal.
  const renderStage = (s: Stage) => {
    switch (s) {
      case 'intro':
        return <IntroSection onStart={() => goToStage('roulette')} />;
      case 'roulette':
        return (
          <Grid id="seq-roleta" paddings="pt-xl pb-xl" rowGaps="gap-y-xxs" backgroundColor="bg-brand-otimath-lightest">
            <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
              <TextBlock
                title={<h2 className="ds-heading-ultra">Simulador Probabilístico com Disco Aleatório</h2>}
              />
            </GridItem>
            <GridItem cols="col-[1_/_13]">
              <RouletteGame onFinished={() => goToStage('transition')} devMode={devMode} />
            </GridItem>
          </Grid>
        );
      case 'transition':
        return <TransitionSection onContinue={() => goToStage('twoDices')} />;
      case 'twoDices':
        return (
          <Grid id="seq-dois-dados" paddings="pt-xl pb-xl" rowGaps="gap-y-xxs" backgroundColor="bg-brand-otimath-lightest">
            <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
              <TextBlock
                title={<h2 className="ds-heading-ultra">Probabilidade: Dois Dados</h2>}
              />
            </GridItem>
            <GridItem cols="col-[1_/_13]">
              <TwoDicesPresentation onFinished={() => goToStage('complete')} devMode={devMode} />
            </GridItem>
          </Grid>
        );
      case 'complete':
        return <CompletionSection />;
    }
  };

  return (
    <main>
      <HeroBanner
        id="hero-banner"
        textBlock={
          <TextBlock
            overline="TRILHA DE APRENDIZAGEM ESTRUTURADA"
            title={<h1 className="ds-heading-giga">Sequência Didática: do fenômeno ao símbolo</h1>}
            paragraph={
              <p className="ds-body">
                Percorra os dois OVAs encadeados — Disco e Dois Dados — em uma única trilha
                contínua, do experimento aleatório à formalização probabilística.
              </p>
            }
            maxWidthParagraph="max-w-[460px]"
            inverse={true}
          />
        }
        image={heroBannerProbabilityImage}
      />

      <div ref={ovaContainerRef}>
        {STAGES.map(s => (
          <div key={s} style={{ display: stage === s ? 'block' : 'none' }}>
            {(stage === s || devMode) && renderStage(s)}
          </div>
        ))}
      </div>

      <OvaCredits/>
      
      <DevPanel
        devMode={devMode}
        setDevMode={setDevMode}
        stage={stage}
        goToStage={goToStage}
      />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Painel de desenvolvimento (oculto por trás de um botão quase invisível
// + senha "@dev@"). Permite navegar livremente entre as cenas para fins
// de QA/demonstração sem refazer todo o fluxo.
// ─────────────────────────────────────────────────────────────────
function DevPanel({
  devMode, setDevMode, stage, goToStage,
}: {
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  stage: Stage;
  goToStage: (s: Stage) => void;
}) {
  const [inputVisible, setInputVisible] = useState(false);
  const [secret, setSecret] = useState('');
  const [jumpInput, setJumpInput] = useState('');
  const secretInputRef = useRef<HTMLInputElement>(null);

  const currentIdx = STAGES.indexOf(stage);
  const total = STAGES.length;

  useEffect(() => {
    if (inputVisible) secretInputRef.current?.focus();
  }, [inputVisible]);

  const handleSecretChange = (val: string) => {
    setSecret(val);
    if (val === '@dev@') {
      setDevMode(true);
      setInputVisible(false);
      setSecret('');
    }
  };

  const handleClose = () => {
    setDevMode(false);
    setInputVisible(false);
    setSecret('');
    setJumpInput('');
  };

  const goPrev = () => { if (currentIdx > 0) goToStage(STAGES[currentIdx - 1]); };
  const goNext = () => { if (currentIdx < total - 1) goToStage(STAGES[currentIdx + 1]); };
  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (Number.isNaN(n) || n < 1 || n > total) return;
    goToStage(STAGES[n - 1]);
    setJumpInput('');
  };

  if (devMode) {
    return (
      <div
        className="fixed top-1/2 -translate-y-1/2 left-micro z-50 bg-neutral-white p-micro rounded-md shadow-lg border border-neutral-light flex flex-col gap-y-micro min-w-[220px]"
        role="region"
        aria-label="Painel de desenvolvimento da sequência didática"
      >
        <div className="flex items-center justify-between gap-x-micro">
          <span className="ds-caption text-brand-otimath-dark font-bold">DEV — Sequência</span>
          <button
            onClick={handleClose}
            aria-label="Fechar painel de desenvolvimento"
            className="text-neutral-dark hover:text-feedback-error-dark cursor-pointer transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="text-center">
          <p className="ds-caption text-neutral-dark">Cena {currentIdx + 1} de {total}</p>
          <p className="ds-small-bold text-brand-otimath-pure">{STAGE_LABELS[stage]}</p>
        </div>

        <div className="flex items-center justify-between gap-x-micro">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            aria-label="Cena anterior"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-neutral-light text-brand-otimath-dark cursor-pointer hover:bg-brand-otimath-lightest disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIdx === total - 1}
            aria-label="Próxima cena"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-neutral-light text-brand-otimath-dark cursor-pointer hover:bg-brand-otimath-lightest disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-x-quarck">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJump(); }}
            placeholder={`1-${total}`}
            aria-label="Pular para cena de número"
            className="w-full px-quarck py-quarck rounded-md border border-neutral-light ds-small text-center outline-none focus:border-brand-otimath-pure"
          />
          <button
            onClick={handleJump}
            disabled={!jumpInput}
            className="px-micro py-quarck rounded-md bg-brand-otimath-pure text-neutral-white ds-small-bold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Ir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-xs right-xs z-50 flex items-center gap-x-quarck">
      {inputVisible && (
        <input
          ref={secretInputRef}
          type="password"
          value={secret}
          onChange={(e) => handleSecretChange(e.target.value)}
          onBlur={() => { if (!secret) setInputVisible(false); }}
          placeholder="..."
          aria-label="Senha de desenvolvimento"
          className="w-24 px-micro py-quarck rounded-md border border-neutral-light ds-small text-center outline-none focus:border-brand-otimath-pure bg-neutral-white shadow-sm"
        />
      )}
      <button
        onClick={() => setInputVisible(v => !v)}
        aria-label="Acesso ao painel de desenvolvimento"
        className="w-3 h-3 rounded-full bg-neutral-darkest opacity-15 hover:opacity-70 focus:opacity-70 cursor-pointer transition-opacity"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Subseções
// ─────────────────────────────────────────────────────────────────

function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <Grid id="seq-intro" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div className="flex flex-col items-center gap-y-xs">
          <SequenceIllustration />
          <TextBlock
            overline="VAMOS COMEÇAR"
            title={<h2 className="ds-heading-ultra">Você está pronto para iniciar a sequência?</h2>}
            paragraph={
              <span className="ds-body">
                A trilha é composta por <strong>dois OVAs encadeados</strong>:
                <br /><br />
                <strong>1. Disco Aleatório</strong> — você explora a probabilidade como limite
                da frequência relativa por meio de simulações com um disco colorido.
                <br /><br />
                <strong>2. Dois Dados</strong> — você sistematiza o cálculo de probabilidades
                em um espaço amostral equiprovável investigando o lançamento de dois dados.
                <br /><br />
                Ao final dos dois, você terá percorrido o caminho do fenômeno aleatório à
                formalização probabilística. Quando estiver pronto, comece pelo Disco.
              </span>
            }
            maxWidthParagraph="max-w-[640px]"
          />
          <Button style="primary" size="medium" icon={<ArrowRight />} onClick={onStart}>
            Iniciar a sequência didática
          </Button>
        </div>
      </GridItem>
    </Grid>
  );
}

// SVG ilustrativo do conteúdo da sequência: disco aleatório à esquerda,
// seta indicando progressão, e dois dados (verde + azul) à direita —
// representando os dois OVAs encadeados da trilha.
function SequenceIllustration() {
  return (
    <svg
      role="img"
      aria-label="Ilustração da sequência: disco dividido em setores coloridos seguido por dois dados (verde e azul)"
      viewBox="0 0 380 160"
      className="w-full max-w-[420px] h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sombra suave compartilhada por disco e dados */}
        <filter id="seq-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="0" dy="3" result="offsetBlur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Gradiente do dado verde */}
        <linearGradient id="seq-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a8844" />
          <stop offset="100%" stopColor="#1a5c2e" />
        </linearGradient>
        {/* Gradiente do dado azul */}
        <linearGradient id="seq-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b5fc7" />
          <stop offset="100%" stopColor="#1a3f9e" />
        </linearGradient>
      </defs>

      {/* ───────── Disco aleatório (lado esquerdo) ───────── */}
      <g transform="translate(80, 80)" filter="url(#seq-shadow)">
        {/* 6 setores em cores brand */}
        <path d="M 0 0 L 50 0 A 50 50 0 0 1 25 43.3 Z" fill="#e03b3b" />
        <path d="M 0 0 L 25 43.3 A 50 50 0 0 1 -25 43.3 Z" fill="#1a4a9e" />
        <path d="M 0 0 L -25 43.3 A 50 50 0 0 1 -50 0 Z" fill="#f4c430" />
        <path d="M 0 0 L -50 0 A 50 50 0 0 1 -25 -43.3 Z" fill="#2a8844" />
        <path d="M 0 0 L -25 -43.3 A 50 50 0 0 1 25 -43.3 Z" fill="#7d3c98" />
        <path d="M 0 0 L 25 -43.3 A 50 50 0 0 1 50 0 Z" fill="#e87c1c" />
        {/* Aro escuro */}
        <circle cx="0" cy="0" r="50" fill="none" stroke="#2e2e2e" strokeWidth="2.5" />
        {/* Pino central */}
        <circle cx="0" cy="0" r="6" fill="#2e2e2e" />
        <circle cx="0" cy="0" r="2.5" fill="#fff" />
        {/* Ponteiro/seta apontando para cima */}
        <path d="M 0 -55 L -5 -45 L 5 -45 Z" fill="#2e2e2e" stroke="#fff" strokeWidth="0.8" />
      </g>

      {/* ───────── Conector (seta entre OVAs) ───────── */}
      <g transform="translate(190, 80)" stroke="#1a4a9e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7">
        <line x1="-25" y1="0" x2="20" y2="0" strokeDasharray="4 3" />
        <polyline points="14,-6 22,0 14,6" />
      </g>

      {/* ───────── Dois dados (lado direito) ───────── */}
      {/* Dado verde — face 5 */}
      <g transform="translate(265, 80) rotate(-8)" filter="url(#seq-shadow)">
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="url(#seq-green)" />
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="none" stroke="#0e3d1f" strokeWidth="1.2" />
        {/* Pintas (face 5) */}
        <circle cx="-13" cy="-13" r="3.5" fill="#fff" />
        <circle cx="13"  cy="-13" r="3.5" fill="#fff" />
        <circle cx="0"   cy="0"   r="3.5" fill="#fff" />
        <circle cx="-13" cy="13"  r="3.5" fill="#fff" />
        <circle cx="13"  cy="13"  r="3.5" fill="#fff" />
      </g>

      {/* Dado azul — face 3 (atrás/à direita) */}
      <g transform="translate(322, 95) rotate(12)" filter="url(#seq-shadow)">
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="url(#seq-blue)" />
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="none" stroke="#0a1f6e" strokeWidth="1.2" />
        {/* Pintas (face 3) */}
        <circle cx="-12" cy="-12" r="3.5" fill="#fff" />
        <circle cx="0"   cy="0"   r="3.5" fill="#fff" />
        <circle cx="12"  cy="12"  r="3.5" fill="#fff" />
      </g>
    </svg>
  );
}

function TransitionSection({ onContinue }: { onContinue: () => void }) {
  return (
    <Grid id="seq-transition" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div className="flex flex-col items-center gap-y-xs">
          <div className="flex items-center justify-center w-[88px] h-[88px] rounded-full bg-feedback-success-lighter border-4 border-feedback-success-medium">
            <Check size={48} className="text-feedback-success-darkest" aria-hidden="true" />
          </div>
          <TextBlock
            overline="PRIMEIRO OVA CONCLUÍDO"
            title={<h2 className="ds-heading-ultra">Excelente! Você concluiu o Disco Aleatório</h2>}
            paragraph={
              <span className="ds-body">
                Você explorou a probabilidade como limite da frequência relativa em três etapas:
                espaço amostral equiprovável, não equiprovável por área e não equiprovável por
                cores.
                <br /><br />
                Agora vamos para o segundo OVA da sequência: <strong>Dois Dados</strong>. Você vai
                ver que somar duas faces equiprováveis NÃO produz somas equiprováveis — uma
                surpresa que abre caminho para o estudo da união e da interseção de eventos.
              </span>
            }
            maxWidthParagraph="max-w-[640px]"
          />
          <Button style="primary" size="medium" icon={<ArrowRight />} onClick={onContinue}>
            Iniciar OVA: Dois Dados
          </Button>
        </div>
      </GridItem>
    </Grid>
  );
}

function CompletionSection() {
  return (
    <Grid id="seq-complete" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div
          className="flex flex-col items-center gap-y-xs"
          role="status"
          aria-live="polite"
          aria-label="Sequência didática concluída"
        >
          <div
            className="relative flex items-center justify-center w-[140px] h-[140px] rounded-full bg-feedback-success-lighter border-4 border-feedback-success-medium"
            style={{ animation: 'seqSuccessPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          >
            <Check size={72} className="text-feedback-success-darkest" aria-hidden="true" />
            <span className="absolute inset-0 rounded-full border-4 border-feedback-success-dark" style={{ animation: 'seqSuccessRing 1.4s ease-out 0.3s infinite' }} />
          </div>
          <div style={{ animation: 'seqSuccessFade 0.6s ease-out 0.3s both' }}>
            <TextBlock
              overline="🎉 PARABÉNS!"
              title={<h2 className="ds-heading-ultra">Você concluiu a sequência didática!</h2>}
              paragraph={
                <span className="ds-body">
                  Você percorreu os dois OVAs e construiu uma compreensão sólida da probabilidade —
                  do experimento aleatório com um disco até a sistematização do espaço amostral
                  equiprovável com dois dados.
                  <br /><br />
                  Continue explorando outros recursos do Oti-Math.
                </span>
              }
              maxWidthParagraph="max-w-[640px]"
            />
          </div>
          <div className="flex gap-x-micro flex-wrap justify-center">
            <Button type="link" href="/ensino/probabilidade" style="primary" size="medium">
              Ver outras aplicações
            </Button>
            <Button type="link" href="/" style="secondary" size="medium">
              Voltar para o início
            </Button>
          </div>
        </div>
      </GridItem>
      <style>{`
        @keyframes seqSuccessPop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes seqSuccessRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes seqSuccessFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes seqSuccessPop  { 0%,100% { transform: scale(1); opacity: 1; } }
          @keyframes seqSuccessRing { 0%,100% { transform: scale(1); opacity: 0; } }
          @keyframes seqSuccessFade { 0%,100% { transform: none; opacity: 1; } }
        }
      `}</style>
    </Grid>
  );
}
