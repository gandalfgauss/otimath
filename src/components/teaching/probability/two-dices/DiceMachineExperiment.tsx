'use client'

import { useState, useCallback, useEffect, type RefObject } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { DiceMachineSceneHandle } from './DiceMachineScene';
import { STEP_NAMES } from './DiceMachineScene';

/* ═══════════════════════════════════════════════════════════════
   DiceMachineExperiment — Cena 7
   UI envoltória da máquina automática de lançamento de dois dados.
   Mostra barra de progresso (11 etapas), mensagem de estado, botões
   LANÇAR e RESETAR, e exibe o resultado azul/verde/soma ao final.
   Mantém o padrão visual e de acessibilidade do OVA Dois Dados.
   ═══════════════════════════════════════════════════════════════ */

// ── Faces do dado com pintas (idêntico ao TwoDicesExperiment para consistência) ──
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [0, 0, 1, 0, 0, 0, 1, 0, 0],
  3: [0, 0, 1, 0, 1, 0, 1, 0, 0],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

function DiceFaceIcon({ face, size, color = 'blue' }: { face: number; size: number; color?: 'blue' | 'green' }) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
      }}
      aria-label={`Dado ${color === 'blue' ? 'azul' : 'verde'} mostrando face ${face}`}
    >
      {pips.map((pip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pip ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

interface DiceMachineExperimentProps {
  diceMachineRef: RefObject<DiceMachineSceneHandle | null>;
  diceContainerRef: RefObject<HTMLDivElement | null>;
  onFinished: () => void;
}

export function DiceMachineExperiment({
  diceMachineRef,
  diceContainerRef,
  onFinished,
}: Readonly<DiceMachineExperimentProps>) {
  const [intro, setIntro] = useState(true);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [statusMsg, setStatusMsg] = useState('Pressione LANÇAR para iniciar');
  const [blueResult, setBlueResult] = useState<number | null>(null);
  const [greenResult, setGreenResult] = useState<number | null>(null);
  const [launchCount, setLaunchCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Polling leve do estado atual da cena (atualiza barra de progresso e mensagem)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const idx = diceMachineRef.current?.getCurrentStep();
      const lbl = diceMachineRef.current?.getCurrentLabel();
      if (typeof idx === 'number') setStepIdx(idx);
      if (typeof lbl === 'string' && lbl.length > 0) setStatusMsg(lbl);
    }, 100);
    return () => clearInterval(id);
  }, [running, diceMachineRef, resetKey]);

  // Scroll automático para a cena ao iniciar lançamento
  const scrollToScene = useCallback(() => {
    if (diceContainerRef.current) {
      diceContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [diceContainerRef]);

  const handleStart = useCallback(() => {
    setIntro(false);
    playSound('/sounds/nextChallenge.mp3');
  }, []);

  const handleLaunch = useCallback(async () => {
    if (running) return;
    if (!diceMachineRef.current) return;
    setRunning(true);
    setBlueResult(null);
    setGreenResult(null);
    setStepIdx(-1);
    setStatusMsg(STEP_NAMES[0]);
    scrollToScene();
    try {
      const result = await diceMachineRef.current.roll();
      setBlueResult(result.blue);
      setGreenResult(result.green);
      setStepIdx(STEP_NAMES.length - 1);
      setStatusMsg(`✅ Azul = ${result.blue}  ·  Verde = ${result.green}  ·  Soma = ${result.blue + result.green}`);
      setLaunchCount(c => c + 1);
    } finally {
      setRunning(false);
    }
  }, [running, diceMachineRef, scrollToScene]);

  const handleReset = useCallback(() => {
    if (running) return;
    setBlueResult(null);
    setGreenResult(null);
    setStepIdx(-1);
    setStatusMsg('Pressione LANÇAR para iniciar');
    setResetKey(k => k + 1);
    playSound('/sounds/clear.mp3');
  }, [running]);

  const handleFinish = useCallback(() => {
    onFinished();
  }, [onFinished]);

  // ═══════ Tela de introdução (antes da máquina aparecer) ═══════
  if (intro) {
    return (
      <div className="bg-neutral-white rounded-md p-md" style={{ marginTop: 24 }}>
        <h2 className="ds-heading-mega text-brand-otimath-darkest" style={{ marginBottom: 16 }}>
          🎲 Máquina automática de lançamento
        </h2>
        <p className="ds-body text-neutral-darkest" style={{ marginBottom: 12 }}>
          Você já viu, na cena anterior, como obtemos um par ordenado <strong>(azul, verde)</strong> ao
          lançar dois dados. Agora vamos observar uma <strong>máquina automática</strong> que reproduz
          mecanicamente todo o ciclo de um lançamento honesto: ela <em>alinha</em> os dados, <em>empurra</em>
          {' '}para dentro de um copo, <em>sobe</em> pelo trilho, <em>agita</em> com vigor, <em>inclina</em>
          {' '}e <em>libera</em> os dois dados, que <em>caem</em> sobre a mesa e <em>param</em> em uma face.
        </p>
        <p className="ds-body text-neutral-darkest" style={{ marginBottom: 12 }}>
          Cada lançamento percorre <strong>11 etapas</strong> distintas, mostradas na barra de progresso. Essa
          mecanização nos ajuda a perceber que cada resultado é fruto de tantos fatores físicos
          imprevisíveis (velocidade, ângulo, agitação, choques, atrito) que tratá-los um a um seria
          impossível: por isso modelamos o lançamento como um <strong>experimento aleatório</strong>.
        </p>
        <p className="ds-body text-neutral-darkest" style={{ marginBottom: 16 }}>
          Observe atentamente, lance a máquina algumas vezes e perceba como o par ordenado {'(azul, verde)'}
          {' '}se forma a partir de um processo estritamente mecânico — porém imprevisível para nós.
        </p>
        <Button style="primary" size="medium" onClick={handleStart}>
          🚀 Iniciar máquina
        </Button>
      </div>
    );
  }

  // ═══════ Barra de progresso de 11 etapas ═══════
  const StepBar = (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={STEP_NAMES.length}
      aria-valuenow={Math.max(0, stepIdx + 1)}
      aria-label="Progresso do lançamento"
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
        if (done) { bg = '#1a5c2e'; color = '#fff'; }
        if (active) { bg = 'var(--color-brand-otimath-dark)'; color = '#fff'; outline = '2px solid var(--color-brand-otimath-pure)'; }
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

  return (
    <div style={{ marginTop: 16 }}>
      {StepBar}

      <p
        aria-live="polite"
        className="ds-body-medium text-brand-otimath-dark"
        style={{
          marginTop: 12,
          marginBottom: 8,
          textAlign: 'center',
          minHeight: 22,
        }}
      >
        {statusMsg}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Button
          style="primary"
          size="medium"
          onClick={handleLaunch}
          disabled={running}
        >
          🚀 Lançar
        </Button>
        <Button
          style="secondary"
          size="medium"
          onClick={handleReset}
          disabled={running}
        >
          🔄 Resetar
        </Button>
      </div>

      {/* Resultado visual após cada lançamento */}
      {blueResult !== null && greenResult !== null && (
        <div
          className="bg-neutral-white rounded-md p-sm"
          style={{
            marginTop: 8,
            marginBottom: 16,
            border: '1px solid var(--color-neutral-lighter)',
          }}
        >
          <p
            className="ds-body-bold text-brand-otimath-darkest"
            style={{ marginBottom: 12, textAlign: 'center' }}
          >
            Resultado do lançamento {launchCount}:
          </p>
          <div
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <DiceFaceIcon face={blueResult} size={64} color="blue" />
              <span className="ds-small-bold text-brand-otimath-dark">Azul = {blueResult}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <DiceFaceIcon face={greenResult} size={64} color="green" />
              <span className="ds-small-bold" style={{ color: '#1a5c2e' }}>Verde = {greenResult}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="ds-heading-extra text-neutral-darkest">{blueResult + greenResult}</span>
              <span className="ds-small text-neutral-medium">Soma</span>
            </div>
          </div>
        </div>
      )}

      {/* Pergunta reflexiva e botão de finalização (após pelo menos 1 lançamento) */}
      {launchCount >= 1 && !running && (
        <div
          className="bg-brand-otimath-lightest rounded-md p-md"
          style={{ marginTop: 8 }}
        >
          <p className="ds-body text-neutral-darkest" style={{ marginBottom: 12 }}>
            Mesmo conhecendo cada peça do mecanismo — paletas, pistões, copo, motor — você
            consegue <strong>prever com certeza</strong> qual será o próximo par ordenado{' '}
            <strong>(azul, verde)</strong>? Por que não?
          </p>
          <p className="ds-body text-neutral-darkest" style={{ marginBottom: 16 }}>
            É exatamente essa <strong>imprevisibilidade prática</strong> — ainda que o processo
            seja determinístico em cada componente — que justifica o uso da{' '}
            <strong>Probabilidade</strong> como ferramenta para descrever o lançamento de dois
            dados honestos.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style="primary" size="medium" onClick={handleFinish}>
              ✅ Concluir esta cena
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
