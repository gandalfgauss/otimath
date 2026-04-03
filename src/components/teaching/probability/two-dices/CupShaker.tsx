'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

/* ═══════════════════════════════════════════════════════════════
   CupShaker — Overlay Canvas 2D de copo com 1 dado
   Adaptado do código HTML de 2 dados para 1 dado só.
   Fases: SHAKE → FLIP → LIFT → done (callback)
   ═══════════════════════════════════════════════════════════════ */

export interface CupShakerHandle {
  start: () => Promise<void>;
}

interface CupShakerProps {
  diceColor: 'green' | 'blue';
}

const CupShaker = forwardRef<CupShakerHandle, CupShakerProps>(function CupShaker(
  { diceColor },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const resolveRef = useRef<(() => void) | null>(null);

  // Fase da animação
  const phaseRef = useRef<'off' | 'shake' | 'flip' | 'lift' | 'done'>('off');
  const startTimeRef = useRef(0);

  // Dimensões internas
  const W = 800, H = 500;

  // Helpers
  const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
  const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  // Cores
  const diceHex = diceColor === 'green' ? '#1a5c2e' : '#0a1f6e';
  const diceHi = diceColor === 'green' ? '#2a8844' : '#1a3f9e';

  // Pip positions
  const PIP_MAP: Record<number, number[][]> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };

  // Dado 2D dentro do copo
  const drawDie2D = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rot: number, face: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const hs = size / 2;
    const r = size * 0.18;

    // Corpo do dado
    ctx.beginPath();
    ctx.moveTo(-hs + r, -hs);
    ctx.lineTo(hs - r, -hs); ctx.quadraticCurveTo(hs, -hs, hs, -hs + r);
    ctx.lineTo(hs, hs - r); ctx.quadraticCurveTo(hs, hs, hs - r, hs);
    ctx.lineTo(-hs + r, hs); ctx.quadraticCurveTo(-hs, hs, -hs, hs - r);
    ctx.lineTo(-hs, -hs + r); ctx.quadraticCurveTo(-hs, -hs, -hs + r, -hs);
    ctx.closePath();

    const g = ctx.createLinearGradient(-hs, -hs, hs, hs);
    g.addColorStop(0, diceHi);
    g.addColorStop(1, diceHex);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pintas
    const pips = PIP_MAP[face] || PIP_MAP[1];
    const pipR = size * 0.1;
    const spread = size * 0.26;
    ctx.fillStyle = '#ffffff';
    for (const [px, py] of pips) {
      ctx.beginPath();
      ctx.arc(px * spread, py * spread, pipR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [diceHex, diceHi]);

  // Desenhar copo de vidro
  const drawCup = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, rot: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Corpo do copo — trapézio com gradiente de vidro
    const tw = w * 0.38; // topo mais estreito
    const bw = w * 0.5;  // base mais larga

    ctx.beginPath();
    ctx.moveTo(-tw, -h / 2);
    ctx.lineTo(tw, -h / 2);
    ctx.lineTo(bw, h / 2);
    ctx.lineTo(-bw, h / 2);
    ctx.closePath();

    const grd = ctx.createLinearGradient(-bw, 0, bw, 0);
    grd.addColorStop(0, 'rgba(180, 220, 255, 0.12)');
    grd.addColorStop(0.3, 'rgba(220, 240, 255, 0.22)');
    grd.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
    grd.addColorStop(0.7, 'rgba(220, 240, 255, 0.22)');
    grd.addColorStop(1, 'rgba(180, 220, 255, 0.12)');
    ctx.fillStyle = grd;
    ctx.fill();

    // Borda do copo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reflexo de luz
    ctx.beginPath();
    ctx.moveTo(-tw * 0.6, -h / 2 + 8);
    ctx.lineTo(-tw * 0.3, -h / 2 + 8);
    ctx.lineTo(-bw * 0.2, h / 2 - 12);
    ctx.lineTo(-bw * 0.5, h / 2 - 12);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // Base/boca (aro)
    ctx.beginPath();
    ctx.ellipse(0, h / 2, bw, 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, []);

  // Loop de animação
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const phase = phaseRef.current;
    if (phase === 'off' || phase === 'done') return;

    const elapsed = (time - startTimeRef.current) / 1000;
    ctx.clearRect(0, 0, W, H);

    const TBL = H * 0.68;
    const CX = W * 0.5;
    const CY = TBL - 100;
    const cupW = 160;
    const cupH = 200;

    if (phase === 'shake') {
      const dur = 1.4;
      const t = clamp(elapsed / dur, 0, 1);

      // Agitação — movimento senoidal
      const shakeX = Math.sin(t * Math.PI * 12) * 18 * (1 - t * 0.3);
      const shakeY = Math.cos(t * Math.PI * 8) * 12 * (1 - t * 0.3);
      const shakeRot = Math.sin(t * Math.PI * 10) * 0.08 * (1 - t * 0.4);

      // Dado dentro do copo — com motion blur (várias posições semi-transparentes)
      const dieSize = 52;
      for (let i = 3; i >= 0; i--) {
        const delay = i * 0.015;
        const dx = Math.sin((t - delay) * Math.PI * 14) * 22;
        const dy = Math.cos((t - delay) * Math.PI * 10) * 16;
        const dr = (t - delay) * 18;
        const face = (Math.floor(t * 18) % 6) + 1;
        drawDie2D(ctx, CX + shakeX + dx, CY + shakeY + dy, dieSize, dr + shakeRot, face, i === 0 ? 0.7 : 0.12);
      }

      // Copo por cima
      drawCup(ctx, CX + shakeX, CY + shakeY, cupW, cupH, shakeRot, 0.85);

      if (t >= 1) {
        phaseRef.current = 'flip';
        startTimeRef.current = time;
      }
    } else if (phase === 'flip') {
      const dur = 0.5;
      const t = clamp(elapsed / dur, 0, 1);
      const ease = easeInOut(t);

      // Copo vira 180° (boca para baixo)
      const rot = ease * Math.PI;
      const moveY = -Math.sin(ease * Math.PI) * 40;

      // Dado acompanha
      const dieSize = 52;
      const face = (Math.floor(Math.random() * 6)) + 1;
      drawDie2D(ctx, CX, CY + moveY, dieSize, rot, face, 0.6 * (1 - t * 0.5));

      drawCup(ctx, CX, CY + moveY, cupW, cupH, rot, 0.85);

      if (t >= 1) {
        phaseRef.current = 'lift';
        startTimeRef.current = time;
      }
    } else if (phase === 'lift') {
      const dur = 0.6;
      const t = clamp(elapsed / dur, 0, 1);
      const ease = easeOut(t);

      // Copo sobe e desaparece
      const liftY = -ease * 250;
      const alpha = 1 - ease;

      drawCup(ctx, CX, CY + liftY, cupW, cupH, Math.PI, alpha * 0.85);

      if (t >= 1) {
        phaseRef.current = 'done';
        ctx.clearRect(0, 0, W, H);
        if (resolveRef.current) {
          resolveRef.current();
          resolveRef.current = null;
        }
        return;
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [drawDie2D, drawCup, easeInOut, easeOut, clamp, W, H]);

  // API pública
  const start = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      phaseRef.current = 'shake';
      startTimeRef.current = performance.now();

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.display = 'block';
      }

      animRef.current = requestAnimationFrame(animate);
    });
  }, [animate]);

  useImperativeHandle(ref, () => ({ start }), [start]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 6,
        display: 'none',
      }}
    />
  );
});

export default CupShaker;
