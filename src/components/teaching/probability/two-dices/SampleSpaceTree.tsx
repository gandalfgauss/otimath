'use client'

/* ═══════════════════════════════════════════════════════════════
   SampleSpaceTree — Construção progressiva do espaço amostral
   ─────────────────────────────────────────────────────────────
   Situação fundamental (TSD/BROUSSEAU, 1997, p. 88):
   O espaço amostral torna-se necessário quando o estudante
   precisa enumerar TODOS os resultados possíveis.

   Design pedagógico:
   1. Pergunta para verde=1: o que pode sair no azul? (seleção)
   2. Pergunta para verde=2: mesma pergunta (reforço)
   3. Árvore ramo a ramo com gradação sonora (Mayer: segmentação)
   4. Generalização: 6 × 6 = 36 (Freudenthal: matematização)
   5. Visual final: 36 pares em colunas (Duval: conversão)

   Gradação sonora (Mayer, princípio da modalidade):
   Cada dado azul soa com volume crescente (1/6 a 6/6 do máx),
   criando expectativa de completude. O sexto dado no volume máximo
   marca o "fechamento" auditivo do ramo — análogo ao fechamento
   gestáltico visual (DUVAL, 1993).

   Vieses combatidos: V2.1, V2.2, V2.4, V4.1, V4.3
   Tópicos: T2 (Espaço Amostral), T4 (Representação)
   ═══════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { AlertType } from '@/components/global/Alert';

// Handle exposto ao pai (TwoDicesExperiment) para o painel DEV
// avançar pela árvore do espaço amostral simulando a interação natural
// do aluno em cada fase.
export interface SampleSpaceTreeHandle {
  /** ID textual da fase atual — entra no cenaId DEV. */
  getCurrentPhaseId: () => string;
  /** Simula a próxima ação correta do aluno na fase atual. */
  advance: () => void;
  /** Restaura a fase a partir de um snapshot DEV. */
  setCurrentPhaseId: (phaseId: string) => void;
}

// ═══════ Face do dado com pintas ═══════
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

function DiceFaceIcon({ face, size, color = 'blue' }: {
  face: number; size: number; color?: 'blue' | 'green';
}) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.floor(size * 0.16),
      background: bgColor,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      padding: Math.floor(size * 0.14),
      gap,
    }}>
      {pips.map((pip, i) => (
        <div key={i} className="flex items-center justify-center">
          {pip ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

// ═══════ Som com volume variável via Web Audio API ═══════
function playBlip(volumeFraction: number) {
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Tom sobe junto com o volume: 440Hz → 880Hz (oitava completa)
    osc.frequency.value = 440 + 440 * volumeFraction;
    const vol = 0.08 + 0.22 * volumeFraction; // 0.08 → 0.30
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.20);
  } catch { /* noop */ }
}

// ═══════ Tipos ═══════
type Phase =
  | 'select1'      // Selecionar 6 faces do azul para verde=1
  | 'select2'      // Selecionar 6 faces do azul para verde=2
  | 'animate'      // Animação da árvore ramo a ramo (1-6)
  | 'count'        // "Quantos pares por resultado?" → 6
  | 'multiply'     // "6 × 6 = ?" → 36
  | 'total'        // "Espaço amostral possui ___ pares" → 36
  | 'pairs';       // Visual final: 36 pares em colunas

// ═══════ Props ═══════
interface SampleSpaceTreeProps {
  onFinished: () => void;
  diceSceneRef?: React.RefObject<{ roll: () => Promise<{ green: number; blue: number }> } | null>;
  /** Notifica o pai quando a fase interna muda — usado pelo painel DEV
   *  para construir um cenaId que reflete a sub-cena ativa. */
  onPhaseChange?: (phaseId: string) => void;
  /** Cria um toast alert via o sistema de alerts global do OVA. */
  createAlert?: (title: string, description: string, type: AlertType, timeout?: number) => void;
}

const GREEN_COLOR = '#1a5c2e';
const BLUE_COLOR = 'var(--color-brand-otimath-pure)';
const BRANCH_COLOR = '#8b1a1a'; // vermelho escuro

export const SampleSpaceTree = forwardRef<SampleSpaceTreeHandle, SampleSpaceTreeProps>(
  function SampleSpaceTree({ onFinished, diceSceneRef, onPhaseChange, createAlert }, ref) {
  const [phase, setPhase] = useState<Phase>('select1');
  const [selectedFaces, setSelectedFaces] = useState<Set<number>>(new Set());
  const [selectError, setSelectError] = useState('');

  // Animação da árvore
  const [animBranch, setAnimBranch] = useState(0);
  const [animBlues, setAnimBlues] = useState<number[]>([]);
  const [greenBlink, setGreenBlink] = useState(false);
  const animCancelled = useRef(false);

  // Tamanho responsivo dos dados na árvore. Padding stack do card:
  // p-xxs (24px×2) + border 2px×2 + branchContainerRef padding (8px×2) = 68px.
  // Numa viewport de 320px sobram só 252px pra 6 dados azuis + 5 gaps.
  // Por isso usamos tier "ultra-tight" em telas muito estreitas: 28px + 3px gap
  // (= 183px de conteúdo) — cabe folgado em qualquer celular real.
  const [viewportTier, setViewportTier] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 480) setViewportTier('mobile');
      else if (w < 768) setViewportTier('tablet');
      else setViewportTier('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const isMobile = viewportTier === 'mobile';
  const blueDieSize  = viewportTier === 'mobile' ? 34 : viewportTier === 'tablet' ? 40 : 46;
  const greenDieSize = viewportTier === 'mobile' ? 42 : viewportTier === 'tablet' ? 50 : 56;
  const branchGap    = viewportTier === 'mobile' ? 4  : viewportTier === 'tablet' ? 8  : 12;

  // Respostas
  const [countAnswer, setCountAnswer] = useState('');
  const [countError, setCountError] = useState('');
  const [multA, setMultA] = useState('');
  const [multOp, setMultOp] = useState('');
  const [multB, setMultB] = useState('');
  const [multC, setMultC] = useState('');
  const [multError, setMultError] = useState('');
  const [totalAnswer, setTotalAnswer] = useState('');
  const [totalError, setTotalError] = useState('');

  // Refs
  const greenDieRef = useRef<HTMLDivElement>(null);
  const blueDiceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const branchContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ─── Lançar dados 3D automaticamente ao montar ───
  useEffect(() => {
    if (diceSceneRef?.current) {
      diceSceneRef.current.roll().catch(() => { /* noop */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Face do dado verde na seleção
  const selectGreenFace = phase === 'select1' ? 1 : 2;

  // ─── Seleção: toggle face ───
  const toggleFace = useCallback((face: number) => {
    setSelectError('');
    setSelectedFaces(prev => {
      const next = new Set(prev);
      if (next.has(face)) next.delete(face); else next.add(face);
      return next;
    });
  }, []);

  // Rola pro topo do OVA em todo Conferir (acerto OU erro). Mirror do
  // padrão de checkAnswer no OVA do disco — o aluno SEMPRE vê o alert e
  // o enunciado novo no topo, independente do resultado.
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ─── Seleção: validar ───
  const validateSelection = useCallback(() => {
    scrollDiceToTop();
    if (selectedFaces.size < 6 || ![1,2,3,4,5,6].every(v => selectedFaces.has(v))) {
      setSelectError('Selecione todas as 6 faces possíveis do dado azul.');
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', 'Selecione todas as 6 faces possíveis do dado azul.', 'error', 4000);
      return;
    }
    playSound('/sounds/correct.mp3');
    createAlert?.('Correto!', 'Para cada face do verde, o azul pode mostrar 1, 2, 3, 4, 5 ou 6.', 'success', 3000);
    if (phase === 'select1') {
      setSelectedFaces(new Set());
      setSelectError('');
      setPhase('select2');
    } else {
      setPhase('animate');
    }
  }, [selectedFaces, phase, createAlert]);

  // ─── Desenhar linhas SVG (vermelho escuro, mais grossas) ───
  const drawLines = useCallback(() => {
    const svg = svgRef.current;
    const container = branchContainerRef.current;
    const greenEl = greenDieRef.current;
    if (!svg || !container || !greenEl) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const containerRect = container.getBoundingClientRect();
    const greenRect = greenEl.getBoundingClientRect();
    const sx = greenRect.left - containerRect.left + greenRect.width / 2;
    const sy = greenRect.top - containerRect.top + greenRect.height;

    blueDiceRefs.current.forEach((blueEl, idx) => {
      if (!blueEl) return;
      const blueRect = blueEl.getBoundingClientRect();
      const ex = blueRect.left - containerRect.left + blueRect.width / 2;
      const ey = blueRect.top - containerRect.top;

      const midY = sy + (ey - sy) * 0.45;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', BRANCH_COLOR);
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('stroke-linecap', 'round');
      path.style.opacity = '0';
      path.style.transition = 'opacity 300ms ease';
      svg.appendChild(path);

      requestAnimationFrame(() => {
        setTimeout(() => { path.style.opacity = '1'; }, idx * 80);
      });
    });
  }, []);

  // ─── Animação da árvore (50% mais lenta, gradação sonora) ───
  useEffect(() => {
    if (phase !== 'animate') return;
    animCancelled.current = false;

    async function runAnimation() {
      for (let branch = 1; branch <= 6; branch++) {
        if (animCancelled.current) return;

        // Blink do dado verde ao trocar
        if (branch > 1) {
          setGreenBlink(true);
          playSound('/sounds/nextChallenge.mp3');
          await new Promise(r => setTimeout(r, 500));
          setGreenBlink(false);
        }

        setAnimBranch(branch);
        setAnimBlues([]);
        blueDiceRefs.current = [];

        // Ritmo em 2 níveis: branches 1-2 em ritmo de ensino (o aluno absorve
        // o padrão); a partir do branch 3, aceleração direta — o aluno já
        // internalizou que cada face verde gera 6 faces azuis e não precisa
        // mais de gradação lenta para reconhecer.
        const delay = branch <= 2 ? 520 : 180;

        // Aparecer dados azuis um a um com gradação sonora
        for (let blue = 1; blue <= 6; blue++) {
          if (animCancelled.current) return;
          setAnimBlues(prev => [...prev, blue]);
          // Gradação sonora: volume cresce de 1/6 a 6/6
          playBlip((blue) / 6);
          await new Promise(r => setTimeout(r, delay));
        }

        // Pausa entre ramos — longa em 1-2 (ensino), curta em 3-6 (fluência)
        const pause = branch <= 2 ? 1200 : 320;
        await new Promise(r => setTimeout(r, pause));
      }

      playSound('/sounds/correct.mp3');
      await new Promise(r => setTimeout(r, 500));
      setPhase('count');
    }

    runAnimation();
    return () => { animCancelled.current = true; };
  }, [phase]);

  // Redesenhar linhas quando animBlues muda
  useEffect(() => {
    if (phase === 'animate' && animBlues.length > 0) {
      const id = requestAnimationFrame(() => drawLines());
      return () => cancelAnimationFrame(id);
    }
  }, [phase, animBlues, animBranch, drawLines]);

  // ─── Validações ───
  const validateCount = useCallback(() => {
    scrollDiceToTop();
    if (countAnswer.trim() !== '6') {
      const msg = 'Observe a árvore: para cada resultado do primeiro dado, aparecem 6 possibilidades no segundo.';
      setCountError(msg);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', msg, 'error', 4500);
      return;
    }
    setCountError('');
    playSound('/sounds/correct.mp3');
    createAlert?.('Correto!', 'Para cada face do primeiro dado, há 6 pares ordenados possíveis.', 'success', 3000);
    setPhase('multiply');
  }, [countAnswer, createAlert]);

  const validateMultiply = useCallback(() => {
    scrollDiceToTop();
    const op = multOp.trim();
    const opOk = op === 'x' || op === '×' || op === '*' || op === 'X';
    let msg = '';
    if (multA.trim() !== '6')      msg = 'Quantos resultados são possíveis no primeiro dado?';
    else if (multB.trim() !== '6') msg = 'Quantos resultados são possíveis no segundo dado?';
    else if (!opOk)                msg = 'Qual operação combina cada resultado do primeiro dado com cada resultado do segundo?';
    else if (multC.trim() !== '36') msg = 'Qual o resultado da multiplicação dos dois fatores?';
    if (msg) {
      setMultError(msg);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', msg, 'error', 4500);
      return;
    }
    setMultError('');
    playSound('/sounds/correct.mp3');
    createAlert?.('Correto!', '6 × 6 = 36 pares ordenados.', 'success', 3000);
    setPhase('total');
  }, [multA, multOp, multB, multC, createAlert]);

  const validateTotal = useCallback(() => {
    scrollDiceToTop();
    if (totalAnswer.trim() !== '36') {
      const msg = 'Lembre-se: 6 × 6 = 36 pares ordenados.';
      setTotalError(msg);
      playSound('/sounds/incorrect.mp3');
      createAlert?.('Tente novamente', msg, 'error', 4000);
      return;
    }
    setTotalError('');
    playSound('/sounds/correct.mp3');
    createAlert?.('Correto!', 'O espaço amostral tem 36 pares ordenados.', 'success', 3000);
    setPhase('pairs');
  }, [totalAnswer, createAlert]);

  // ─── Scroll ao mudar de fase ───
  // Era `block: 'nearest'` antes — em telas grandes funcionava, mas no
  // mobile o aluno terminava a pergunta lá embaixo, clicava Conferir, e o
  // scroll "mínimo" do `nearest` não trazia o enunciado novo pra viewport.
  // `start` garante que o cardRef fique no topo da tela em qualquer
  // tamanho de viewport.
  useEffect(() => {
    if (['count', 'multiply', 'total', 'pairs', 'select2'].includes(phase)) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [phase]);

  // ═══════ RENDER ═══════
  const inputStyle = {
    width: 64,
    padding: '8px 6px',
    textAlign: 'center' as const,
    borderRadius: 8,
    border: '2px solid var(--color-neutral-lighter)',
    background: 'var(--color-neutral-white)',
    color: 'var(--color-neutral-black)',
    fontSize: 20,
    fontWeight: 700,
    outline: 'none',
  };

  const cardStyle = {
    position: 'relative' as const,
    overflow: 'visible' as const,
    background: 'linear-gradient(180deg, var(--color-brand-otimath-lightest) 0%, var(--color-neutral-white) 100%)',
    border: '2px solid var(--color-brand-otimath-light)',
    boxShadow: '0 4px 16px rgba(36, 80, 190, 0.10)',
  };

  // Notifica o pai quando a fase muda — para o cenaId DEV.
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Handle exposto ao painel DEV — simula a próxima ação correta.
  // Para fases que envolvem animações ou inputs específicos, inlineamos a
  // transição de sucesso (DEV sempre fornece a resposta correta) — assim
  // não dependemos do timing das animações nem de closure stale.
  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => phase,
    advance: () => {
      switch (phase) {
        case 'select1':
          setSelectedFaces(new Set([1, 2, 3, 4, 5, 6]));
          setSelectError('');
          setPhase('select2');
          return;
        case 'select2':
          setSelectedFaces(new Set([1, 2, 3, 4, 5, 6]));
          setSelectError('');
          setPhase('animate');
          return;
        case 'animate':
          // Pula direto para a contagem (sem aguardar animação ramo a ramo).
          setPhase('count');
          return;
        case 'count':
          setPhase('multiply');
          return;
        case 'multiply':
          setPhase('total');
          return;
        case 'total':
          setPhase('pairs');
          return;
        case 'pairs':
          onFinished();
          return;
      }
    },
    setCurrentPhaseId: (phaseId: string) => {
      setPhase(phaseId as Phase);
    },
  }), [phase, onFinished]);

  return (
    <div className="w-full" style={{ maxWidth: 660, margin: '0 auto', position: 'relative' }}>
      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes greenBlink{0%{opacity:1}25%{opacity:0.15}50%{opacity:1}75%{opacity:0.15}100%{opacity:1}}
      `}</style>

      {/* ═══════ FASE 1 e 2: SELEÇÃO (verde=1 e verde=2) ═══════ */}
      {(phase === 'select1' || phase === 'select2') && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Construindo o espaço amostral
          </p>

          {phase === 'select1' && (
            <p className="ds-body text-neutral-black mb-macro text-justify">
              Você observou a máquina e registrou pares. Mas <strong>quantos pares diferentes
              podem sair</strong> no lançamento de dois dados? Vamos descobrir juntos,
              um resultado de cada vez.
            </p>
          )}
          {phase === 'select2' && (
            <p className="ds-body text-neutral-black mb-macro text-justify">
              Muito bem! Agora vamos verificar para o <strong>segundo resultado</strong> do dado verde.
              Será que as possibilidades do dado azul mudam?
            </p>
          )}

          {/* Dado verde */}
          <div className="flex flex-col items-center mb-macro">
            <p className="ds-small-bold mb-nano" style={{ color: GREEN_COLOR }}>
              Primeiro lançamento
            </p>
            <DiceFaceIcon face={selectGreenFace} size={64} color="green" />
          </div>

          {/* Pergunta */}
          <div className="rounded-lg p-micro mb-macro"
            style={{
              background: 'rgba(36, 80, 190, 0.06)',
              border: '1px solid var(--color-brand-otimath-lighter)',
            }}>
            <p className="ds-body-bold text-neutral-black text-center">
              Se o dado{' '}
              <strong style={{ color: GREEN_COLOR }}>verde</strong>{' '}
              resultar em <strong>{selectGreenFace}</strong>, o que pode sair no dado{' '}
              <strong style={{ color: BLUE_COLOR }}>azul</strong>?
            </p>
          </div>

          {/* Paleta de seleção */}
          <p className="ds-small text-neutral-dark text-center mb-micro">
            Toque em todas as faces possíveis do dado azul:
          </p>
          <div className="flex justify-center gap-x-micro mb-macro" style={{ flexWrap: 'wrap', gap: 10 }}>
            {[1,2,3,4,5,6].map(face => (
              <button
                key={face}
                type="button"
                onClick={() => toggleFace(face)}
                aria-label={`Face ${face} do dado azul`}
                aria-pressed={selectedFaces.has(face)}
                style={{
                  padding: 4,
                  borderRadius: 12,
                  border: selectedFaces.has(face)
                    ? '3px solid var(--color-brand-otimath-pure)'
                    : '3px solid var(--color-neutral-lighter)',
                  background: selectedFaces.has(face)
                    ? 'rgba(36, 80, 190, 0.08)'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <DiceFaceIcon face={face} size={52} color="blue" />
              </button>
            ))}
          </div>

          {selectError && (
            <p role="alert" className="ds-small-bold text-center mb-micro text-feedback-error-dark">
              {selectError}
            </p>
          )}

          <div className="flex justify-center">
            <Button style="primary" size="small" onClick={validateSelection}
              aria-label="Conferir seleção das faces">
              Conferir
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FASE 3: ANIMAÇÃO DA ÁRVORE ═══════ */}
      {phase === 'animate' && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Construindo a árvore
          </p>
          <p className="ds-body text-neutral-black text-center mb-macro">
            Se o dado{' '}
            <strong style={{ color: GREEN_COLOR }}>verde</strong>{' '}
            mostrar <strong>{animBranch || 1}</strong>, o dado{' '}
            <strong style={{ color: BLUE_COLOR }}>azul</strong>{' '}
            pode mostrar <strong>1, 2, 3, 4, 5 ou 6</strong>.
          </p>

          {/* Container da árvore — dado verde mais afastado dos azuis.
              Padding horizontal removido no mobile pra liberar +16px de espaço
              útil pros 6 dados azuis na linha. */}
          <div ref={branchContainerRef} style={{ position: 'relative', minHeight: 260, padding: isMobile ? '0' : '0 8px' }}>
            <svg ref={svgRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none', overflow: 'visible', zIndex: 1,
            }} />

            {/* Dado verde (raiz) — com blink ao trocar */}
            <div className="flex justify-center" style={{ position: 'relative', zIndex: 2, marginBottom: 48 }}>
              <div ref={greenDieRef} style={greenBlink ? {
                animation: 'greenBlink 0.5s ease',
              } : undefined}>
                <DiceFaceIcon face={animBranch || 1} size={greenDieSize} color="green" />
              </div>
            </div>

            {/* Dados azuis (folhas) — mais afastados */}
            <div className="flex justify-center" style={{
              gap: branchGap, flexWrap: 'wrap', position: 'relative', zIndex: 2,
              paddingTop: 32,
            }}>
              {animBlues.map((face, idx) => (
                <div
                  key={`${animBranch}-${face}`}
                  ref={el => { blueDiceRefs.current[idx] = el; }}
                  style={{
                    opacity: 0,
                    animation: 'fadeSlideUp 0.35s ease forwards',
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <DiceFaceIcon face={face} size={blueDieSize} color="blue" />
                </div>
              ))}
            </div>
          </div>

          {/* Progresso visual */}
          <div className="flex justify-center gap-x-nano mt-macro">
            {[1,2,3,4,5,6].map(b => (
              <div key={b} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: b < animBranch ? '#1a5c2e'
                  : b === animBranch ? 'var(--color-brand-otimath-pure)'
                  : 'var(--color-neutral-lighter)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════ FASE 4: QUANTOS PARES? ═══════ */}
      {phase === 'count' && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Percebendo o padrão
          </p>
          <p className="ds-body text-neutral-black text-center mb-macro text-justify">
            Você viu que, para <strong>cada resultado do primeiro dado</strong>, o segundo
            dado pode mostrar faces diferentes. Cada ramo gera um conjunto de pares ordenados.
          </p>

          <div className="rounded-lg p-micro mb-macro"
            style={{
              background: 'rgba(36, 80, 190, 0.06)',
              border: '1px solid var(--color-brand-otimath-lighter)',
            }}>
            <p className="ds-body-bold text-neutral-black text-center">
              Para cada resultado do primeiro lançamento, quantos pares ordenados são possíveis?
            </p>
          </div>

          <div className="flex justify-center items-center gap-x-micro mb-micro">
            <input
              type="text" inputMode="numeric" maxLength={2}
              value={countAnswer}
              onChange={e => { setCountAnswer(e.target.value); setCountError(''); }}
              style={inputStyle}
              aria-label="Quantidade de pares por resultado"
            />
          </div>
          {countError && (
            <p role="alert" className="ds-small-bold text-center mb-micro text-feedback-error-dark">
              {countError}
            </p>
          )}
          <div className="flex justify-center">
            <Button style="primary" size="small" onClick={validateCount}>
              Conferir
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FASE 5: MULTIPLICAÇÃO ═══════ */}
      {phase === 'multiply' && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Generalizando
          </p>
          <p className="ds-body text-neutral-black mb-macro text-justify">
            Complete a operação para calcular o <strong>total de pares ordenados possíveis</strong> no
            experimento aleatório: lançar dois dados e anotar as pintas nas faces voltadas para cima.
          </p>

          {/* Equação `a × b = c` — `flex-nowrap` + `overflow-x-auto`
              garantem que a expressão SEMPRE permaneça em uma linha;
              em viewports muito estreitos o usuário rola horizontalmente
              em vez de ver a equação quebrada (matematicamente
              incorreto). */}
          <div className="flex flex-nowrap justify-center items-center mb-micro gap-micro overflow-x-auto">
            <input type="text" inputMode="numeric" maxLength={2}
              value={multA} onChange={e => { setMultA(e.target.value); setMultError(''); }}
              style={inputStyle} aria-label="Primeiro fator" />
            <select
              value={multOp}
              onChange={e => { setMultOp(e.target.value); setMultError(''); }}
              aria-label="Selecione a operação"
              style={{
                ...inputStyle,
                width: 64,
                appearance: 'auto' as const,
                cursor: 'pointer',
              }}
            >
              <option value="">?</option>
              <option value="+">+</option>
              <option value="-">-</option>
              <option value="×">×</option>
              <option value="÷">÷</option>
            </select>
            <input type="text" inputMode="numeric" maxLength={2}
              value={multB} onChange={e => { setMultB(e.target.value); setMultError(''); }}
              style={inputStyle} aria-label="Segundo fator" />
            <span className="ds-heading-extra text-neutral-darkest">=</span>
            <input type="text" inputMode="numeric" maxLength={2}
              value={multC} onChange={e => { setMultC(e.target.value); setMultError(''); }}
              style={inputStyle} aria-label="Resultado" />
          </div>
          {multError && (
            <p role="alert" className="ds-small-bold text-center mb-micro text-feedback-error-dark">
              {multError}
            </p>
          )}
          <div className="flex justify-center">
            <Button style="primary" size="small" onClick={validateMultiply}>
              Conferir
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FASE 6: TOTAL ═══════ */}
      {phase === 'total' && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Conclusão
          </p>

          <div className="rounded-lg p-micro mb-macro"
            style={{
              background: 'rgba(36, 80, 190, 0.06)',
              border: '1px solid var(--color-brand-otimath-lighter)',
            }}>
            <p className="ds-body-bold text-neutral-black text-center">
              Logo, o espaço amostral do lançamento de dois dados é formado por{' '}
              <input type="text" inputMode="numeric" maxLength={2}
                value={totalAnswer}
                onChange={e => { setTotalAnswer(e.target.value); setTotalError(''); }}
                style={{ ...inputStyle, width: 56, display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }}
                aria-label="Total de pares ordenados" />{' '}
              pares ordenados possíveis.
            </p>
          </div>
          {totalError && (
            <p role="alert" className="ds-small-bold text-center mb-micro text-feedback-error-dark">
              {totalError}
            </p>
          )}
          <div className="flex justify-center">
            <Button style="primary" size="small" onClick={validateTotal}>
              Conferir
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FASE 7: VISUALIZAÇÃO DOS 36 PARES ═══════ */}
      {phase === 'pairs' && (
        <div ref={cardRef} className="rounded-lg p-xxs" style={cardStyle}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Os 36 pares ordenados
          </p>
          <p className="ds-body text-neutral-black text-center mb-macro">
            Cada coluna reúne os pares que começam com o mesmo resultado
            no dado <strong style={{ color: GREEN_COLOR }}>verde</strong>.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            overflowX: 'auto',
          }}>
            {[1,2,3,4,5,6].map(green => (
              <div key={green} className="rounded-lg" style={{
                background: 'rgba(36, 80, 190, 0.04)',
                border: '1px solid var(--color-neutral-lighter)',
                padding: '8px 4px',
              }}>
                {[1,2,3,4,5,6].map(blue => (
                  <div key={blue} className="flex justify-center items-center" style={{
                    gap: 3, padding: '4px 0',
                    opacity: 0,
                    animation: 'fadeSlideUp 0.3s ease forwards',
                    animationDelay: `${((green - 1) * 6 + (blue - 1)) * 40}ms`,
                  }}>
                    <DiceFaceIcon face={green} size={20} color="green" />
                    <DiceFaceIcon face={blue} size={20} color="blue" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-macro">
            <Button style="primary" size="medium" onClick={() => {
              playSound('/sounds/nextChallenge.mp3');
              onFinished();
            }}
              aria-label="Avançar para a tabela de pares ordenados">
              Agora vamos organizar na tabela
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
SampleSpaceTree.displayName = 'SampleSpaceTree';
