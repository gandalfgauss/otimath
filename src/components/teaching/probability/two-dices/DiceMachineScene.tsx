'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { playSound } from '@/hooks/global/useSound';
import { IBERE_AUDIO_DATA_URL } from './ibereAudioData';

/* ═══════════════════════════════════════════════════════════════
   DiceMachineScene — Cena 7
   Máquina automática de lançamento de dois dados (verde + azul).
   Ciclo completo: alinhar → empurrar → capturar → girar → subir
   → agitar → inclinar → liberar → queda → parar → zoom → resultado.
   Estrutura: mesa metálica, paredes acrílicas, paletas com pistões,
   empurrador, trilho vertical com carruagem, copo translúcido com
   motor de agitação. Adaptado para a arquitetura do OVA Dois Dados.
   ═══════════════════════════════════════════════════════════════ */

const PI = Math.PI;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const eio = (t: number) => { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };
const eout = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const rand6 = () => (Math.random() * 6 | 0) + 1;

// ── Constantes geométricas da máquina ──
const DHS = 0.18 * 1.2 * 1.2 * 1.1;
const DIE_Y = DHS + 0.032;
const CX = 3.6, CZ = 0;
const CR = 3.5 * DHS;
const CH = 6.5 * DHS;
const BRACKET = 0.90;
const PIVOT_X = CX - BRACKET;
const CY_LOW = CR;
const CY_HIGH = 2.95;
const TILT = PI * 0.82;
const MX = PIVOT_X + CH * (-Math.sin(TILT));
const MY = CY_HIGH + CH * (Math.cos(TILT));
const MZ = CZ;
const PFZ_R = 2.7, PFZ_E = DHS + 0.012;
const PRZ_R = -2.7, PRZ_E = -(DHS + 0.012);
const PWD = 0.18;
const MOUTH_X = PIVOT_X - CH;
// Folga mínima de contato mecânico entre sólidos
const CONTACT_EPS = 0.006;
// centro do dado 1 quando empurrado até a boca do copo
const D1_PT = MOUTH_X + DHS * 0.60;
const PX_R = -3.90;
// anteparo encosta na face traseira do dado 1:
// face direita do anteparo (pushX + PWD/2) = face esquerda do dado 1 (d1.x - DHS)
const PX_E = D1_PT - DHS - PWD / 2 - CONTACT_EPS;
const D1X0 = -2.2, D2X0 = -1.1, DZ0 = 1.5;

// ── Física ──
const GRAV = 12.0;
const FRIC = 0.76;

/* ═══════════════════════════════════════════════════════════════
   IbereAudio — sistema imersivo Web Audio API.
   ─────────────────────────────────────────────────────────────────
   Cadeia:                                  ┌──────────► reverbSend ──► convolver ─┐
                                            │                                     ▼
       MP3 Iberê ──► MediaElementSource ──► motorGain ──► drySend ──► panner ──► master ──► destination
                                            │                                       ▲
                                                                                    │
       impact() (procedural) ──► thud + clack ──► localPan ─────────────────────────┤
                                                  │                                 │
                                                  └─► reverbSendLocal ──► convolver ┘

   Recursos:
   • GainNode dinâmico (não usa audio.volume) — controla headroom geral.
   • StereoPannerNode com pequeno offset aleatório por lançamento — sensação de espaço.
   • Variação aleatória de playbackRate (±3%) e gainVar (±15%) — som nunca repete idêntico.
   • ConvolverNode com impulso sintético (~0.6s) — reverb sutil de "mesa de madeira".
   • impact(panX, intensity): thud grave + clack agudo procedural disparado a cada quique
     do dado, sincronizado pelo physStep no momento exato do impacto.
   • Sem distorção: master gain limitado a 0.85 e ramps suaves nos start/stop.
   ═══════════════════════════════════════════════════════════════ */
class IbereAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  reverbNode: ConvolverNode | null = null;
  drySend: GainNode | null = null;
  reverbSend: GainNode | null = null;
  panner: StereoPannerNode | null = null;
  el: HTMLAudioElement | null = null;
  mediaSrc: MediaElementAudioSourceNode | null = null;
  motorGain: GainNode | null = null;
  playing = false;

  /** Pré-carrega o elemento <audio> com o data-URL de base64 (~245KB).
   *  Pode ser chamado no mount do componente — não viola autoplay policy
   *  porque NÃO cria AudioContext nem chama play(). Tira o decode pesado
   *  do thread quando o usuário clica em "Lançar". */
  preload() {
    if (this.el) return;
    if (typeof Audio === 'undefined') return;
    try {
      this.el = new Audio(IBERE_AUDIO_DATA_URL);
      this.el.preload = 'auto';
      this.el.loop = false;
      this.el.volume = 1;
      // Força o browser a começar a baixar/decodificar agora
      try { this.el.load(); } catch { /* noop */ }
    } catch {
      this.el = null;
    }
  }

  /** Lazy init: só cria o AudioContext quando o usuário interage (autoplay policy). */
  init() {
    if (this.ctx) return;
    if (typeof Audio === 'undefined') return;
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
              || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    // ── Master: limita ganho global em 0.85 pra dar headroom e evitar clipping ──
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);

    // ── Convolver (reverb): impulso sintético curto e exponencial ──
    // Simula a reverberação de uma mesa pequena de madeira/acrílico.
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.makeImpulseResponse(0.6, 2.4);
    this.reverbNode.connect(this.master);

    // ── Bus paralelo: caminho seco (dry) + send pro reverb (wet) ──
    this.drySend = this.ctx.createGain();
    this.drySend.gain.value = 0.85;
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.18;
    this.reverbSend.connect(this.reverbNode);

    // ── Panner global do motor (recebe leve offset aleatório por lançamento) ──
    this.panner = this.ctx.createStereoPanner();
    this.panner.pan.value = 0;
    this.drySend.connect(this.panner).connect(this.master);

    // ── Elemento de áudio do Iberê + MediaElementSource roteado pra cadeia ──
    // Reusa o elemento já pré-carregado por preload() (evita decodificar
    // o base64 de 245KB sob a mão do usuário no primeiro clique).
    if (!this.el) {
      this.el = new Audio(IBERE_AUDIO_DATA_URL);
      this.el.preload = 'auto';
      this.el.loop = false;
    }
    // audio.volume fica em 1 — controle real de ganho é via motorGain (GainNode).
    this.el.volume = 1;
    try {
      this.mediaSrc = this.ctx.createMediaElementSource(this.el);
      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.value = 0.5;
      this.mediaSrc.connect(this.motorGain);
      this.motorGain.connect(this.drySend);
      this.motorGain.connect(this.reverbSend);
    } catch {
      // Fallback: se MediaElementSource falhar (ex.: política de origem),
      // o áudio toca direto pelo elemento (sem reverb/panner) com volume reduzido.
      this.mediaSrc = null;
      this.motorGain = null;
      if (this.el) this.el.volume = 0.5;
    }
  }

  /** Inicia o motor (Iberê) com variação aleatória sutil de pitch/gain/pan
   *  pra cada lançamento soar ligeiramente diferente. */
  start() {
    this.init();
    if (!this.ctx || !this.el) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* policy autoplay */ });
    }

    // Variação aleatória: pitch ±3%, gain 0.42..0.58, pan ±0.35
    // — reforça percepção de aleatoriedade física do experimento.
    const pitchVar = 0.97 + Math.random() * 0.06;
    const gainVar  = 0.42 + Math.random() * 0.16;
    const panVar   = (Math.random() - 0.5) * 0.7;
    this.el.playbackRate = pitchVar;

    if (this.ctx && this.motorGain && this.panner) {
      const t = this.ctx.currentTime;
      this.motorGain.gain.cancelScheduledValues(t);
      // Ramp suave de 80ms evita pop no start
      this.motorGain.gain.setValueAtTime(0, t);
      this.motorGain.gain.linearRampToValueAtTime(gainVar, t + 0.08);
      this.panner.pan.setTargetAtTime(panVar, t, 0.05);
    }

    if (this.playing) {
      try { this.el.currentTime = 0; } catch { /* noop */ }
    }
    this.playing = true;
    const p = this.el.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      (p as Promise<void>).catch(() => { /* autoplay bloqueado: usuário precisa interagir antes */ });
    }
  }

  /** Para o motor com fade-out de 180ms — sem pop e sem cortar abrupto. */
  stop() {
    if (!this.el || !this.playing) return;
    if (this.ctx && this.motorGain) {
      const t = this.ctx.currentTime;
      this.motorGain.gain.cancelScheduledValues(t);
      this.motorGain.gain.setValueAtTime(this.motorGain.gain.value, t);
      this.motorGain.gain.linearRampToValueAtTime(0, t + 0.18);
    }
    setTimeout(() => {
      try { this.el?.pause(); } catch { /* noop */ }
      try { if (this.el) this.el.currentTime = 0; } catch { /* noop */ }
      this.playing = false;
    }, 200);
  }

  /** Impacto procedural sincronizado com o quique do dado.
   *  panX  ∈ [-1,+1]  : posição horizontal (esquerda/direita) na mesa.
   *  intensity ∈ [0,1]: escala volume e brilho do thud (vel. de impacto). */
  impact(panX: number, intensity: number) {
    this.init();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* noop */ });
    }
    const t = this.ctx.currentTime;
    const i = Math.max(0.1, Math.min(1, intensity));

    // ── Componente 1: thud grave (sine 110→45 Hz com pitch envelope) ──
    // Simula a massa do dado batendo na mesa.
    const thudOsc = this.ctx.createOscillator();
    thudOsc.type = 'sine';
    const f0 = 95 + Math.random() * 50; // variação de fundamental por impacto
    thudOsc.frequency.setValueAtTime(f0, t);
    thudOsc.frequency.exponentialRampToValueAtTime(45, t + 0.10);
    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0, t);
    thudGain.gain.linearRampToValueAtTime(0.30 * i, t + 0.005);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    // ── Componente 2: clack agudo (ruído branco curto via bandpass) ──
    // Simula a quina do dado raspando o tampo.
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.08);
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let k = 0; k < noiseLen; k++) nd[k] = Math.random() * 2 - 1;
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilt = this.ctx.createBiquadFilter();
    noiseFilt.type = 'bandpass';
    noiseFilt.frequency.value = 2400 + Math.random() * 1200; // variação de timbre
    noiseFilt.Q.value = 2.5;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.18 * i, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    // ── Pan dedicado pro impacto (esquerda/direita conforme pos. do dado) ──
    const localPan = this.ctx.createStereoPanner();
    localPan.pan.value = Math.max(-1, Math.min(1, panX));

    thudOsc.connect(thudGain).connect(localPan);
    noiseSrc.connect(noiseFilt).connect(noiseGain).connect(localPan);

    // Send pro reverb global pra dar profundidade espacial ao impacto
    if (this.reverbSend) {
      const rsLocal = this.ctx.createGain();
      rsLocal.gain.value = 0.32;
      localPan.connect(rsLocal).connect(this.reverbSend);
    }
    localPan.connect(this.master);

    thudOsc.start(t);
    noiseSrc.start(t);
    thudOsc.stop(t + 0.22);
    noiseSrc.stop(t + 0.10);
  }

  /** Som metálico curto: clack agudo no instante em que o primeiro
   *  dado encosta no segundo durante o empurrão. Procedural — sem
   *  asset, dois osciladores (triangle + sine) com filtro highshelf. */
  pushContact() {
    this.init();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* noop */ });
    }
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(950, now);
    osc1.frequency.exponentialRampToValueAtTime(420, now + 0.06);

    osc2.frequency.setValueAtTime(1480, now);
    osc2.frequency.exponentialRampToValueAtTime(650, now + 0.05);

    filt.type = 'highshelf';
    filt.frequency.setValueAtTime(2200, now);
    filt.gain.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.10, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc1.connect(filt);
    osc2.connect(filt);
    filt.connect(gain);
    gain.connect(this.master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.10);
    osc2.stop(now + 0.10);
  }

  /** Cria um impulso sintético exponencialmente decaído pro convolver.
   *  duration em segundos, decay > 1 acentua a queda inicial. */
  private makeImpulseResponse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * duration));
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        // Ruído branco × envelope (1 - i/len)^decay
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  dispose() {
    this.stop();
    setTimeout(() => {
      try { this.mediaSrc?.disconnect(); } catch { /* noop */ }
      try { this.motorGain?.disconnect(); } catch { /* noop */ }
      try { this.drySend?.disconnect(); } catch { /* noop */ }
      try { this.reverbSend?.disconnect(); } catch { /* noop */ }
      try { this.reverbNode?.disconnect(); } catch { /* noop */ }
      try { this.panner?.disconnect(); } catch { /* noop */ }
      try { this.master?.disconnect(); } catch { /* noop */ }
      try { this.el?.removeAttribute('src'); this.el?.load(); } catch { /* noop */ }
      try { this.ctx?.close(); } catch { /* noop */ }
      this.ctx = null;
      this.master = null;
      this.reverbNode = null;
      this.drySend = null;
      this.reverbSend = null;
      this.panner = null;
      this.el = null;
      this.mediaSrc = null;
      this.motorGain = null;
    }, 250);
  }
}

// ── Estado de cada dado físico ──
interface DieBody {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rZ: number; rX: number; rY: number;
  vrZ: number; vrX: number; vrY: number;
  on: boolean; active: boolean; spawned: boolean; delay: number;
  bounces: number;
}

function mkDie(): DieBody {
  return {
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    rZ: 0, rX: 0, rY: 0, vrZ: 0, vrX: 0, vrY: 0,
    on: false, active: false, spawned: false, delay: 0,
    bounces: 0,
  };
}

// ── Estados do ciclo ──
type State =
  | 'IDLE' | 'ALIGN' | 'PUSH' | 'LOAD' | 'ROTATE_UP' | 'LIFT'
  | 'SHAKE' | 'TILT_S' | 'RELEASE' | 'FALL' | 'SETTLE' | 'ZOOM' | 'RESULT';

const ORDER: State[] = [
  'IDLE', 'ALIGN', 'PUSH', 'LOAD', 'ROTATE_UP', 'LIFT',
  'SHAKE', 'TILT_S', 'RELEASE', 'FALL', 'SETTLE', 'ZOOM', 'RESULT',
];

const CFG: Record<State, { dur: number; lbl: string }> = {
  IDLE:      { dur: 0,   lbl: 'Aguardando início...' },
  ALIGN:     { dur: 1.2, lbl: '📐 Paletas centralizando os dados...' },
  PUSH:      { dur: 0.9, lbl: '➡️ Empurrando dados para o copo...' },
  LOAD:      { dur: 0.7, lbl: '⬇️ Dados entrando no copo...' },
  ROTATE_UP: { dur: 0.6, lbl: '🔃 Copo girando para vertical...' },
  LIFT:      { dur: 1.3, lbl: '⬆️ Subindo pelo trilho...' },
  SHAKE:     { dur: 2.2, lbl: '🔀 Agitando dados dentro do copo!' },
  TILT_S:    { dur: 0.7, lbl: '📐 Inclinando para liberar...' },
  RELEASE:   { dur: 0.5, lbl: '🎲 Dados saindo!' },
  FALL:      { dur: 1.4, lbl: '⬇️ Queda com rotação 3D!' },
  SETTLE:    { dur: 1.0, lbl: '🛑 Dados desacelerando...' },
  ZOOM:      { dur: 1.8, lbl: '🔍 Câmera aproximando no resultado...' },
  RESULT:    { dur: 0,   lbl: '' },
};

// Nomes das etapas para barra de progresso
export const STEP_NAMES = [
  'Alinhar', 'Empurrar', 'Capturar', 'Girar', 'Subir',
  'Agitar', 'Inclinar', 'Liberar', 'Queda', 'Parar', 'Zoom',
];
const STEP_STATES: State[] = [
  'ALIGN', 'PUSH', 'LOAD', 'ROTATE_UP', 'LIFT',
  'SHAKE', 'TILT_S', 'RELEASE', 'FALL', 'SETTLE', 'ZOOM',
];

// ── Texturas das faces dos dados (canvas) ──
const DOTS: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

/* ════════════════════════════════════════════════════════
   Textura realista da face do dado em 1024×1024:
   • Gradient diagonal de base
   • Brilho radial superior + faixa especular longa
   • Vinheta + brilho de borda + sombra interna
   • Pontos com sombra projetada + gradient radial + highlight
   ════════════════════════════════════════════════════════ */
interface PipColors {
  inner: string;
  mid: string;
  outer: string;
  highlight: string;
}
const PIP_RED: PipColors = {
  inner: '#ff5a5a',
  mid: '#d91a1a',
  outer: '#8a0b0b',
  highlight: 'rgba(255,220,220,0.35)',
};
const PIP_DARK_BLUE: PipColors = {
  inner: '#1e3a8a',
  mid: '#0f1f5c',
  outer: '#060d2e',
  highlight: 'rgba(120,150,220,0.28)',
};

function makeDieFaceTexture(
  face: number,
  baseLight: string,
  baseDark: string,
  borderLight: string,
  anisotropy: number,
  pipColors: PipColors = PIP_RED,
): THREE.CanvasTexture {
  const sz = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = sz;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, sz, sz);

  // Base principal: gradient diagonal claro→escuro→claro
  const g = ctx.createLinearGradient(0, 0, sz, sz);
  g.addColorStop(0.00, baseLight);
  g.addColorStop(0.45, baseDark);
  g.addColorStop(1.00, baseLight);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sz, sz);

  // Brilho radial suave no quadrante superior esquerdo
  const rg1 = ctx.createRadialGradient(sz * 0.28, sz * 0.20, 0, sz * 0.28, sz * 0.20, sz * 0.52);
  rg1.addColorStop(0.00, 'rgba(255,255,255,0.18)');
  rg1.addColorStop(0.20, 'rgba(255,255,255,0.08)');
  rg1.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = rg1;
  ctx.fillRect(0, 0, sz, sz);

  // Faixa especular longa e fina
  ctx.save();
  ctx.translate(sz * 0.56, sz * 0.38);
  ctx.rotate(-0.18);
  const lg = ctx.createLinearGradient(-260, 0, 260, 0);
  lg.addColorStop(0.00, 'rgba(255,255,255,0.00)');
  lg.addColorStop(0.50, 'rgba(255,255,255,0.07)');
  lg.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = lg;
  ctx.fillRect(-280, -18, 560, 36);
  ctx.restore();

  // Vinheta sutil para dar profundidade
  const vg = ctx.createRadialGradient(sz / 2, sz / 2, sz * 0.25, sz / 2, sz / 2, sz * 0.72);
  vg.addColorStop(0.00, 'rgba(0,0,0,0.00)');
  vg.addColorStop(1.00, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, sz, sz);

  // Brilho de borda
  ctx.strokeStyle = borderLight;
  ctx.lineWidth = 7;
  ctx.shadowColor = 'rgba(255,255,255,0.22)';
  ctx.shadowBlur = 16;
  ctx.strokeRect(10, 10, sz - 20, sz - 20);
  ctx.shadowBlur = 0;

  // Pontos
  const dots = DOTS[face] || DOTS[1];
  const spacing = sz * 0.27;
  const r = sz * 0.088;

  for (let i = 0; i < dots.length; i++) {
    const x = sz / 2 + dots[i][0] * spacing;
    const y = sz / 2 + dots[i][1] * spacing;

    // Sombra projetada do ponto
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.arc(x + 6, y + 7, r * 1.02, 0, PI * 2);
    ctx.fill();

    // Corpo do ponto: gradient radial configurável (default vermelho).
    const pg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
    pg.addColorStop(0.00, pipColors.inner);
    pg.addColorStop(0.72, pipColors.mid);
    pg.addColorStop(1.00, pipColors.outer);
    ctx.beginPath();
    ctx.fillStyle = pg;
    ctx.arc(x, y, r, 0, PI * 2);
    ctx.fill();

    // Highlight interno sutil (não lavar a cor)
    ctx.beginPath();
    ctx.fillStyle = pipColors.highlight;
    ctx.arc(x - r * 0.22, y - r * 0.25, r * 0.30, 0, PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = anisotropy;
  // Three r183: equivalente moderno de tex.encoding = sRGBEncoding
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function faceLayout(top: number): number[] {
  const bot = 7 - top;
  const rest: number[] = [];
  for (let n = 1; n <= 6; n++) if (n !== top && n !== bot) rest.push(n);
  return [rest[0], rest[1], top, bot, rest[2], rest[3]];
}

function makeMats(
  result: number,
  tx: Record<number, THREE.CanvasTexture>,
  whiteMode = false,
): THREE.MeshPhysicalMaterial[] {
  const layout = faceLayout(result);
  const mats: THREE.MeshPhysicalMaterial[] = [];
  // Roughness e clearcoat calibrados para que as pintas fiquem SEMPRE
  // visíveis, inclusive em ângulos onde a key light incide de frente.
  // Dados brancos são mais foscos; dados coloridos mantêm brilho moderado
  // sem lavar as pintas com especular excessivo.
  const roughness = whiteMode ? 0.72 : 0.48;
  const clearcoat = whiteMode ? 0.15 : 0.35;
  const clearcoatRoughness = whiteMode ? 0.65 : 0.45;
  const reflectivity = whiteMode ? 0.18 : 0.35;
  for (let i = 0; i < 6; i++) {
    mats.push(new THREE.MeshPhysicalMaterial({
      map: tx[layout[i]],
      roughness,
      metalness: 0.02,
      clearcoat,
      clearcoatRoughness,
      reflectivity,
      transparent: true,
      opacity: 1,
    }));
  }
  return mats;
}

// ── Helpers ──
function addBox(scene: THREE.Scene, w: number, h: number, d: number, mat: THREE.Material,
                px: number, py: number, pz: number, cs?: boolean, rs?: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(px, py, pz);
  if (cs) m.castShadow = true;
  if (rs) m.receiveShadow = true;
  scene.add(m);
  return m;
}

function addCyl(scene: THREE.Scene, rt: number, rb: number, h: number, seg: number,
                mat: THREE.Material, px: number, py: number, pz: number,
                rx?: number, rz?: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(px, py, pz);
  if (rx) m.rotation.x = rx;
  if (rz) m.rotation.z = rz;
  m.castShadow = true;
  scene.add(m);
  return m;
}

// ── Pistões ──
interface Piston {
  body: THREE.Mesh;
  mid1: THREE.Mesh;
  mid2: THREE.Mesh;
  rod: THREE.Mesh;
  jt0: THREE.Mesh;
  jt1: THREE.Mesh;
  ring1: THREE.Mesh;
  ring2: THREE.Mesh;
}

const PBLEN = 0.46;   // corpo externo mais comprido
const PBRAD = 0.145;  // corpo mais grosso
const PMRAD = 0.108;  // estágio telescópico 1
const PSRAD = 0.082;  // estágio telescópico 2
const PRRAD = 0.052;  // haste inox final

function mkPiston(scene: THREE.Scene, axis: 'x' | 'y' | 'z',
                  matPB: THREE.Material, matPM: THREE.Material, matPS: THREE.Material,
                  matPR: THREE.Material, matPJ: THREE.Material, matRing: THREE.Material): Piston {
  // corpo externo
  const body = new THREE.Mesh(new THREE.CylinderGeometry(PBRAD, PBRAD + 0.006, PBLEN, 18), matPB);
  // estágio telescópico 1
  const mid1 = new THREE.Mesh(new THREE.CylinderGeometry(PMRAD, PMRAD, 1, 16), matPM);
  // estágio telescópico 2
  const mid2 = new THREE.Mesh(new THREE.CylinderGeometry(PSRAD, PSRAD, 1, 14), matPS);
  // haste interna inox
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(PRRAD, PRRAD, 1, 14), matPR);
  // juntas
  const jt0 = new THREE.Mesh(new THREE.SphereGeometry(PBRAD * 1.10, 12, 8), matPJ);
  const jt1 = new THREE.Mesh(new THREE.SphereGeometry(PRRAD * 1.95, 10, 7), matPJ);
  // anéis frontais / divisórias telescópicas
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(PMRAD * 1.03, 0.010, 10, 24), matRing);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(PSRAD * 1.04, 0.009, 10, 24), matRing);

  if (axis === 'z') {
    body.rotation.x = PI / 2;
    mid1.rotation.x = PI / 2;
    mid2.rotation.x = PI / 2;
    rod.rotation.x = PI / 2;
    ring1.rotation.y = PI / 2;
    ring2.rotation.y = PI / 2;
  } else if (axis === 'x') {
    body.rotation.z = PI / 2;
    mid1.rotation.z = PI / 2;
    mid2.rotation.z = PI / 2;
    rod.rotation.z = PI / 2;
    ring1.rotation.x = PI / 2;
    ring2.rotation.x = PI / 2;
  }

  [body, mid1, mid2, rod, jt0, jt1, ring1, ring2].forEach(m => { m.castShadow = true; scene.add(m); });
  return { body, mid1, mid2, rod, jt0, jt1, ring1, ring2 };
}

function updPistZ(p: Piston, px: number, py: number, padZ: number, mountZ: number) {
  const inward = (mountZ > 0) ? -1 : 1;
  const bodyTip = mountZ + inward * PBLEN;
  const padFace = padZ - inward * 0.047;

  const totalLen = Math.max(0.05, Math.abs(padFace - bodyTip));

  // 3 estágios perceptíveis
  const seg1 = Math.min(totalLen * 0.34, 0.24);
  const seg2 = Math.min(Math.max(0, totalLen - seg1) * 0.45, 0.22);

  const s1a = bodyTip;
  const s1b = bodyTip + inward * seg1;

  const s2a = s1b;
  const s2b = s2a + inward * seg2;

  const s3a = s2b;
  const s3b = padFace;

  const bodyCenter = (mountZ + bodyTip) * 0.5;
  const mid1Center = (s1a + s1b) * 0.5;
  const mid2Center = (s2a + s2b) * 0.5;
  const rodCenter = (s3a + s3b) * 0.5;

  p.body.position.set(px, py, bodyCenter);
  p.mid1.position.set(px, py, mid1Center);
  p.mid2.position.set(px, py, mid2Center);
  p.rod.position.set(px, py, rodCenter);

  p.mid1.scale.y = Math.max(0.03, Math.abs(s1b - s1a));
  p.mid2.scale.y = Math.max(0.03, Math.abs(s2b - s2a));
  p.rod.scale.y  = Math.max(0.02, Math.abs(s3b - s3a));

  p.jt0.position.set(px, py, mountZ);
  p.jt1.position.set(px, py, padFace);

  // anéis/divisórias sempre visíveis na frente do corpo
  p.ring1.position.set(px, py, bodyTip + inward * 0.010);
  p.ring2.position.set(px, py, bodyTip + inward * 0.055);
}

function updPistX(p: Piston, pz: number, py: number, pushX: number, mountX: number) {
  const bodyTip = mountX + PBLEN;
  const pushFace = pushX - PWD * 0.5 - 0.01;

  const totalLen = Math.max(0.05, pushFace - bodyTip);

  const seg1 = Math.min(totalLen * 0.34, 0.26);
  const seg2 = Math.min(Math.max(0, totalLen - seg1) * 0.45, 0.24);
  const seg3 = Math.max(0.02, totalLen - seg1 - seg2);

  const s1a = bodyTip;
  const s1b = bodyTip + seg1;

  const s2a = s1b;
  const s2b = s2a + seg2;

  const s3a = s2b;
  const s3b = pushFace;

  p.body.position.set(mountX + PBLEN * 0.5, py, pz);
  p.mid1.position.set((s1a + s1b) * 0.5, py, pz);
  p.mid2.position.set((s2a + s2b) * 0.5, py, pz);
  p.rod.position.set((s3a + s3b) * 0.5, py, pz);

  p.mid1.scale.y = Math.max(0.03, seg1);
  p.mid2.scale.y = Math.max(0.03, seg2);
  p.rod.scale.y  = Math.max(0.02, seg3);

  p.jt0.position.set(mountX, py, pz);
  p.jt1.position.set(pushFace, py, pz);

  p.ring1.position.set(bodyTip + 0.010, py, pz);
  p.ring2.position.set(bodyTip + 0.060, py, pz);
}

const RAIL_BODY_H = PBLEN;
function updPistY(p: Piston, px: number, pz: number, cY: number) {
  const bodyTopY = RAIL_BODY_H;
  const carrBotY = cY - 0.30;

  const totalLen = Math.max(0.05, carrBotY - bodyTopY);

  const seg1 = Math.min(totalLen * 0.34, 0.28);
  const seg2 = Math.min(Math.max(0, totalLen - seg1) * 0.45, 0.26);
  const seg3 = Math.max(0.02, totalLen - seg1 - seg2);

  const s1a = bodyTopY;
  const s1b = bodyTopY + seg1;

  const s2a = s1b;
  const s2b = s2a + seg2;

  const s3a = s2b;
  const s3b = carrBotY;

  p.body.position.set(px, RAIL_BODY_H * 0.5, pz);
  p.mid1.position.set(px, (s1a + s1b) * 0.5, pz);
  p.mid2.position.set(px, (s2a + s2b) * 0.5, pz);
  p.rod.position.set(px, (s3a + s3b) * 0.5, pz);

  p.mid1.scale.y = Math.max(0.03, seg1);
  p.mid2.scale.y = Math.max(0.03, seg2);
  p.rod.scale.y  = Math.max(0.02, seg3);

  p.jt0.position.set(px, 0, pz);
  p.jt1.position.set(px, carrBotY, pz);

  p.ring1.position.set(px, bodyTopY + 0.012, pz);
  p.ring2.position.set(px, bodyTopY + 0.068, pz);
}

// ── Interface pública ──
export interface DiceMachineSceneHandle {
  /** Inicia o ciclo completo. Resolve com o resultado dos dois dados. */
  roll: () => Promise<{ blue: number; green: number }>;
  /** Estado atual do ciclo (para barra de progresso). */
  getCurrentStep: () => number;
  /** Mensagem associada ao estado atual. */
  getCurrentLabel: () => string;
  /**
   * Troca os dois dados para brancos com pintas pretas (true) ou volta ao
   * padrão azul/verde (false). Regenera as texturas em runtime e dispõe
   * as antigas corretamente para evitar leak de GPU. Usado na Cena 7
   * durante a fase colorQuestion.
   */
  setWhiteMode: (enabled: boolean) => void;
}

interface Props {
  /** Callback chamado a cada mudança de estado (para barra de progresso/mensagem) */
  onStateChange?: (step: number, label: string) => void;
  /** Callback chamado quando o renderer WebGL está pronto e o primeiro frame foi pintado */
  onReady?: () => void;
  aspectRatio?: string;
  maxWidth?: number;
}

const DiceMachineScene = forwardRef<DiceMachineSceneHandle, Props>(function DiceMachineScene(
  { onStateChange, onReady, aspectRatio = '758 / 520', maxWidth = 758 }, ref
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const internals = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cur: State;
    sTime: number;
    running: boolean;
    zoomProg: number;
    die1: number;
    die2: number;
    p1: DieBody;
    p2: DieBody;
    d1Final: THREE.Vector3;
    d2Final: THREE.Vector3;
    rollResolve: ((r: { blue: number; green: number }) => void) | null;
    animId: number;
    audio: IbereAudio;
    pushContactPlayed: boolean;
    whiteMode: boolean;
    rebuildDieTextures: (whiteMode: boolean) => void;
    // Cena
    frontPad: THREE.Mesh;
    rearPad: THREE.Mesh;
    pushMesh: THREE.Mesh;
    cupGrp: THREE.Group;
    carriageBody: THREE.Mesh;
    carriageArm: THREE.Mesh;
    carriageMotorBlock: THREE.Mesh;
    rollerMeshes: THREE.Mesh[];
    rollerPositions: number[][];
    cupLt: THREE.PointLight;
    die1Mesh: THREE.Mesh;
    die2Mesh: THREE.Mesh;
    sh1: THREE.Mesh;
    sh2: THREE.Mesh;
    bTex: Record<number, THREE.CanvasTexture>;
    gTex: Record<number, THREE.CanvasTexture>;
    pistFA: Piston; pistFB: Piston;
    pistRA: Piston; pistRB: Piston;
    pistPA: Piston; pistPB: Piston;
    pistRailL: Piston; pistRailR: Piston;
    camPos: THREE.Vector3;
    camTgt: THREE.Vector3;
    onStateChange: ((s: number, l: string) => void) | undefined;
    disposables: Array<{ dispose: () => void }>;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ───── Renderer cinematográfico ─────
       ACES Filmic + exposure 1.18 + PBR moderno (Three r183 já usa
       physicallyCorrectLights por padrão via useLegacyLights=false).
       alpha:false porque a cena agora pinta seu próprio background. */
    const W3 = 758, H3 = 520;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(W3, H3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.sortObjects = true;
    // Pipeline de cor moderna (equivalente a outputEncoding=sRGBEncoding em r128).
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // ACES Filmic para tons cinemáticos + exposure calibrado pros dados ricos.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    // Three.js r183 usa luzes fisicamente corretas por padrão (useLegacyLights=false).
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    /* ───── Cena (background azul-escuro com profundidade) ───── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06111f);
    scene.fog = new THREE.Fog(0x081321, 16, 34);

    /* ───── Câmera base (mantida em "máquina maximizada" para mobile) ─────
       Distância ~8 unidades do centro da máquina, FOV 50°: cabe desde
       y≈0 (mesa) até y≈5 (topo do trilho), e horizontalmente de
       x≈-4 (bracket esquerdo) até x≈+4 (lado direito do trilho).
       Mantida pelo pedido explícito do usuário (não voltar pro framing
       cinematográfico distante do prompt). */
    // Câmera-base mais alta e um pouco mais recuada
    // para mostrar a mesa inteira e o copo no topo do trilho.
    // Câmera "máquina maximizada" — onResize sobrescreve com valores
    // específicos pra mobile/desktop; estes são só os defaults iniciais.
    const camera = new THREE.PerspectiveCamera(41.2, W3 / H3, 0.1, 80);
    const CAM_POS = new THREE.Vector3(-1.62, 5.10, 8.20);
    const CAM_TGT = new THREE.Vector3(1.05, 1.55, 0);
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_TGT.x, CAM_TGT.y, CAM_TGT.z);

    /* ───── Iluminação cinematográfica ─────
       Ambient azul escuro de base + Hemisphere céu/chão para tons
       neutros + Key directional intensa (sombra projetada) + Fill
       lateral azul + Rim alto pra silhueta + low PointLight
       quente azulada perto da mesa pra dar volume aos pistões. */
    scene.add(new THREE.AmbientLight(0x5c6f8d, 0.38));

    const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x1d2430, 0.95);
    scene.add(hemi);

    const keyLt = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLt.position.set(-4.5, 9.5, 7.5);
    keyLt.castShadow = true;
    keyLt.shadow.camera.left = -8; keyLt.shadow.camera.right = 8;
    keyLt.shadow.camera.top = 8; keyLt.shadow.camera.bottom = -8;
    keyLt.shadow.camera.near = 1; keyLt.shadow.camera.far = 28;
    keyLt.shadow.mapSize.width = 2048; keyLt.shadow.mapSize.height = 2048;
    keyLt.shadow.bias = -0.0006;
    scene.add(keyLt);

    const fillLt = new THREE.DirectionalLight(0x8fb7ff, 0.95);
    fillLt.position.set(7, 4, -3); scene.add(fillLt);

    const rimLt = new THREE.DirectionalLight(0xffffff, 0.75);
    rimLt.position.set(1, 7, -8); scene.add(rimLt);

    const lowLt = new THREE.PointLight(0x4b79c9, 0.7, 12);
    lowLt.position.set(1.2, 1.6, 1.8); scene.add(lowLt);

    const cupLt = new THREE.PointLight(0x7bb0ff, 0, 5);
    scene.add(cupLt);

    /* ───── Texturas dos dados (1024×1024 com clearcoat real) ───── */
    const maxAnis = renderer.capabilities.getMaxAnisotropy();
    const bTex: Record<number, THREE.CanvasTexture> = {};
    const gTex: Record<number, THREE.CanvasTexture> = {};
    for (let fi = 1; fi <= 6; fi++) {
      bTex[fi] = makeDieFaceTexture(fi, '#5ea7ff', '#1f5fe0', 'rgba(220,235,255,0.16)', maxAnis);
      gTex[fi] = makeDieFaceTexture(fi, '#2dd63a', '#10951a', 'rgba(225,255,230,0.14)', maxAnis);
    }

    /* ───── Materiais da máquina (boost cinemático) ─────
       matPad/matPush em cinza médio neutro com metalness elevado:
       paletas (frontPad/rearPad) e empurrador (pushMesh) ganham
       aparência de aço escovado polido em vez de plástico claro,
       coerente com o resto das peças metálicas (matRail/matBkt). */
    const matPad = new THREE.MeshStandardMaterial({ color: 0x7a8086, metalness: 0.35, roughness: 0.55 });
    const matPush = new THREE.MeshStandardMaterial({ color: 0x7a8086, metalness: 0.38, roughness: 0.52 });
    // matRail/matSlot harmonizados em cinza médio coerente:
    const matRail = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.62, roughness: 0.30 });
    const matSlot = new THREE.MeshStandardMaterial({ color: 0x7a8086, metalness: 0.42, roughness: 0.46 });
    const matMotor = new THREE.MeshStandardMaterial({ color: 0x1c2028, metalness: 0.68, roughness: 0.34 });
    const matBelt = new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 0.92 });
    const matCar = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.16, roughness: 0.50 });
    const matRoll = new THREE.MeshStandardMaterial({ color: 0x16181f, metalness: 0.52, roughness: 0.44 });
    const matScrew = new THREE.MeshStandardMaterial({ color: 0x687480, metalness: 0.82, roughness: 0.22 });
    const matRim = new THREE.MeshStandardMaterial({ color: 0x6a7278, metalness: 0.55, roughness: 0.28 });
    const matMCup = new THREE.MeshStandardMaterial({ color: 0x1e2028, metalness: 0.62, roughness: 0.38 });
    const matShad = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.50, depthWrite: false });
    const matBkt = new THREE.MeshStandardMaterial({ color: 0x4a5460, metalness: 0.62, roughness: 0.40 });
    // Pistões: corpo + 2 estágios telescópicos + haste inox + juntas + anéis
    const matPB = new THREE.MeshStandardMaterial({ color: 0x7d848b, metalness: 0.58, roughness: 0.30 });
    const matPM = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.72, roughness: 0.24 });
    const matPS = new THREE.MeshStandardMaterial({ color: 0xb2b8bf, metalness: 0.78, roughness: 0.18 });
    const matPR = new THREE.MeshPhysicalMaterial({
      color: 0xf2f5f7,
      metalness: 1.0,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
    });
    const matPJ = new THREE.MeshStandardMaterial({ color: 0x737b84, metalness: 0.62, roughness: 0.34 });
    const matRing = new THREE.MeshStandardMaterial({ color: 0x5f666d, metalness: 0.72, roughness: 0.28 });

    /* ───── Mesa (PBR físico com clearcoat) ───── */
    const matTableO = new THREE.MeshPhysicalMaterial({
      color: 0xd7dbe0,
      metalness: 0.08,
      roughness: 0.74,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
    });
    const matLegO = new THREE.MeshStandardMaterial({
      color: 0x7a8088,
      metalness: 0.48,
      roughness: 0.52,
    });
    addBox(scene, 8.8, 0.2, 6.8, matTableO, 0, -0.1, 0, false, true);
    [[-3.5, -0.42, -2.9], [-3.5, -0.42, 2.9], [3.4, -0.42, -2.9], [3.4, -0.42, 2.9]].forEach(p => {
      addCyl(scene, 0.06, 0.08, 0.44, 8, matLegO, p[0], p[1], p[2]);
    });

    /* ───── Superfície da mesa (textura procedural rica em 1024) ─────
       Gradient diagonal + grid fino + ruído branco esparso + 22
       manchas radiais quase invisíveis. Resultado bem mais convincente
       que um cinza chapado com grid. */
    const fCo = document.createElement('canvas');
    fCo.width = fCo.height = 1024;
    const fCtxo = fCo.getContext('2d')!;

    // Gradient diagonal de base
    const grad = fCtxo.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0.00, '#d9dde2');
    grad.addColorStop(0.45, '#c8cdd3');
    grad.addColorStop(1.00, '#e3e6ea');
    fCtxo.fillStyle = grad;
    fCtxo.fillRect(0, 0, 1024, 1024);

    // Grid fino
    fCtxo.strokeStyle = 'rgba(0,0,0,0.045)';
    fCtxo.lineWidth = 1;
    for (let gi = 0; gi <= 1024; gi += 64) {
      fCtxo.beginPath(); fCtxo.moveTo(gi, 0); fCtxo.lineTo(gi, 1024); fCtxo.stroke();
      fCtxo.beginPath(); fCtxo.moveTo(0, gi); fCtxo.lineTo(1024, gi); fCtxo.stroke();
    }

    // Ruído branco esparso (via ImageData — ~50× mais rápido que 14k fillRect)
    {
      const imgD = fCtxo.getImageData(0, 0, 1024, 1024);
      const px = imgD.data;
      for (let nz = 0; nz < 14000; nz++) {
        const nx = (Math.random() * 1024) | 0;
        const ny = (Math.random() * 1024) | 0;
        const off = (ny * 1024 + nx) * 4;
        const a = Math.random() * 0.035 * 255;
        // Composição aditiva branca sobre o pixel existente
        px[off]     = Math.min(255, px[off]     + a);
        px[off + 1] = Math.min(255, px[off + 1] + a);
        px[off + 2] = Math.min(255, px[off + 2] + a);
      }
      fCtxo.putImageData(imgD, 0, 0);
    }

    // Manchas radiais quase invisíveis
    for (let mi = 0; mi < 22; mi++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 1024;
      const r = 40 + Math.random() * 90;
      const rg = fCtxo.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, 'rgba(255,255,255,0.030)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      fCtxo.fillStyle = rg;
      fCtxo.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    const floorTexO = new THREE.CanvasTexture(fCo);
    floorTexO.wrapS = floorTexO.wrapT = THREE.RepeatWrapping;
    floorTexO.repeat.set(4, 3);
    floorTexO.anisotropy = renderer.capabilities.getMaxAnisotropy();
    floorTexO.colorSpace = THREE.SRGBColorSpace;
    const matFloorO = new THREE.MeshPhysicalMaterial({
      map: floorTexO,
      metalness: 0.02,
      roughness: 0.82,
      clearcoat: 0.10,
      clearcoatRoughness: 0.78,
    });
    addBox(scene, 8, 0.03, 6, matFloorO, 0, 0.015, 0, false, true);

    /* ───── Paredes acrílicas (transmission moderada + bordas fortes) ─────
       Sem HDRI envMap a transmission alta deixa o vidro invisível.
       Combinação: opacity 0.32 + transmission 0.55 + bordas grossas. */
    const matAcr = new THREE.MeshPhysicalMaterial({
      color: 0xc6daf6,
      transparent: true,
      opacity: 0.32,
      metalness: 0.0,
      roughness: 0.06,
      transmission: 0.55,
      ior: 1.49,
      thickness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const matEdgeL = new THREE.LineBasicMaterial({
      color: 0xaed1ff,
      transparent: true,
      opacity: 0.78,
    });
    // Helper: adiciona EdgesGeometry como filho do mesh acrílico,
    // dando uma borda azul visível que garante que a parede não suma.
    const acrylicEdgeGeos: THREE.BufferGeometry[] = [];
    function addAcrylicEdge(mesh: THREE.Mesh) {
      const geo = new THREE.EdgesGeometry(mesh.geometry);
      acrylicEdgeGeos.push(geo);
      const edge = new THREE.LineSegments(geo, matEdgeL);
      mesh.add(edge);
    }
    // Capturamos as 4 paredes pra poder ESCONDÊ-LAS durante ZOOM/RESULT
    // (caso contrário a linha de visão da câmera atravessa a parede
    // frontal e a refração cria um "insulfilm" sobre os dados pousados).
    const wallFront = addBox(scene, 8, 1.2, 0.04, matAcr, 0, 0.62, 3);
    const wallBack  = addBox(scene, 8, 1.2, 0.04, matAcr, 0, 0.62, -3);
    const wallLeft  = addBox(scene, 0.04, 1.2, 6, matAcr, -4, 0.62, 0);
    const wallRight = addBox(scene, 0.04, 1.2, 6, matAcr,  4, 0.62, 0);
    [wallFront, wallBack, wallLeft, wallRight].forEach(w => {
      // renderOrder alto: transparência desenhada DEPOIS dos dados,
      // pra não brigar com o depth buffer.
      w.renderOrder = 10;
      addAcrylicEdge(w);
    });
    // Wireframe externo extra (caixa envolvente) — reforça a silhueta
    // da cerca mesmo em ângulos altos de câmera.
    const edgeLn = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 1.2, 6)), matEdgeL
    );
    edgeLn.position.set(0, 0.6, 0);
    scene.add(edgeLn);
    const acrylicGroup: THREE.Object3D[] = [wallFront, wallBack, wallLeft, wallRight, edgeLn];

    /* ───── Plano de sombra (mais denso) ───── */
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.ShadowMaterial({ opacity: 0.34, transparent: true })
    );
    shadowPlane.rotation.x = -PI / 2;
    shadowPlane.position.y = 0.018;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    /* ───── Paletas ───── */
    const PAD_LEN = MOUTH_X - (-3.8);
    const PAD_CX = (-3.8 + MOUTH_X) * 0.5;
    const frontPad = addBox(scene, PAD_LEN, 0.40, 0.09, matPad, PAD_CX, 0.22, PFZ_R, true, false);
    const rearPad = addBox(scene, PAD_LEN, 0.40, 0.09, matPad, PAD_CX, 0.22, PRZ_R, true, false);

    /* ───── Empurrador ───── */
    const pushMesh = addBox(scene, PWD, 0.40, 0.9, matPush, PX_R, 0.22, 0, true, false);
    pushMesh.visible = false;

    /* ───── Pistões das paletas e empurrador ───── */
    const pistFA = mkPiston(scene, 'z', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistFB = mkPiston(scene, 'z', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistRA = mkPiston(scene, 'z', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistRB = mkPiston(scene, 'z', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistPA = mkPiston(scene, 'x', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistPB = mkPiston(scene, 'x', matPB, matPM, matPS, matPR, matPJ, matRing);

    const PAD_PX = [-3.8 + PAD_LEN * 0.25, -3.8 + PAD_LEN * 0.68];
    const PMNT_FZ = 2.80;
    const PMNT_RZ = -2.80;
    const PMNT_PX = -4.30;

    PAD_PX.forEach(bx => {
      addBox(scene, 0.07, 0.10, 0.06, matBkt, bx, 0.22, 3.22);
      addBox(scene, 0.07, 0.10, 0.06, matBkt, bx, 0.22, -3.22);
    });
    addBox(scene, 0.06, 0.10, 0.08, matBkt, PMNT_PX, 0.26, 0.40);
    addBox(scene, 0.06, 0.10, 0.08, matBkt, PMNT_PX, 0.26, -0.40);

    /* ───── Pistões verticais do trilho ───── */
    const RAIL_PIST_OFF = 0.30;
    const pistRailL = mkPiston(scene, 'y', matPB, matPM, matPS, matPR, matPJ, matRing);
    const pistRailR = mkPiston(scene, 'y', matPB, matPM, matPS, matPR, matPJ, matRing);
    addBox(scene, 0.10, 0.03, 0.14, matBkt, CX - RAIL_PIST_OFF, 0.015, CZ);
    addBox(scene, 0.10, 0.03, 0.14, matBkt, CX + RAIL_PIST_OFF, 0.015, CZ);

    /* ───── Trilho vertical ───── */
    const RAIL_H = 3.85;
    const ry2 = RAIL_H / 2;
    addBox(scene, 0.15, RAIL_H, 0.15, matRail, CX - 0.07, ry2, CZ, true, false);
    addBox(scene, 0.15, RAIL_H, 0.15, matRail, CX + 0.07, ry2, CZ, true, false);
    addBox(scene, 0.05, RAIL_H, 0.07, matSlot, CX, ry2, CZ);
    addBox(scene, 0.54, 0.04, 0.54,
      new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.4, roughness: 0.55 }),
      CX, 0.02, CZ, false, true);
    addBox(scene, 0.34, 0.06, 0.22, matRail, CX, RAIL_H + 0.03, CZ);
    addBox(scene, 0.28, 0.26, 0.28, matMotor, CX, RAIL_H + 0.18, CZ);
    addCyl(scene, 0.052, 0.052, 0.08, 14, matScrew, CX, RAIL_H + 0.30, CZ, PI / 2, 0);
    addBox(scene, 0.026, RAIL_H * 0.86, 0.034, matBelt, CX + 0.13, ry2, CZ);
    addCyl(scene, 0.086, 0.086, 0.06, 18, matSlot, CX, RAIL_H + 0.01, CZ, 0, PI / 2);
    addCyl(scene, 0.086, 0.086, 0.06, 18, matSlot, CX, 0.18, CZ, 0, PI / 2);

    /* ───── Carruagem ───── */
    const carriageBody = addBox(scene, 0.10, 0.58, 0.46, matCar, CX, CY_LOW, CZ);
    const carriageArm = addBox(scene, BRACKET, 0.12, 0.28, matCar, (CX + PIVOT_X) / 2, CY_LOW, CZ);
    const carriageMotorBlock = addBox(scene, 0.18, 0.56, 0.48, matCar, PIVOT_X + 0.04, CY_LOW, CZ);

    const rOff = 0.17;
    const rollerPositions: number[][] = [
      [-rOff, 0.17, 0], [-rOff, -0.17, 0], [+rOff, 0.17, 0], [+rOff, -0.17, 0],
    ];
    const rollerMeshes: THREE.Mesh[] = [];
    for (let ri = 0; ri < rollerPositions.length; ri++) {
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.10, 14), matRoll);
      rl.rotation.z = PI / 2;
      rl.position.set(
        CX + rollerPositions[ri][0],
        CY_LOW + rollerPositions[ri][1],
        CZ + rollerPositions[ri][2]
      );
      scene.add(rl);
      rollerMeshes.push(rl);
    }
    [[0.05, 0.20, 0.23], [0.05, -0.20, 0.23], [0.05, 0.20, -0.23], [0.05, -0.20, -0.23]].forEach(p => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), matScrew);
      s.position.set(PIVOT_X + 0.04 + p[0], CY_LOW + p[1], CZ + p[2]);
      scene.add(s);
    });

    /* ───── Copo translúcido ───── */
    const cupGrp = new THREE.Group();
    scene.add(cupGrp);

    const matCupBack = new THREE.MeshPhysicalMaterial({
      color: 0xc9def7,
      transparent: true,
      opacity: 0.16,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const cupCylBack = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, CH, 64, 1, true), matCupBack);
    cupCylBack.position.y = CH / 2;
    cupCylBack.renderOrder = 9;
    cupGrp.add(cupCylBack);

    const matCupFront = new THREE.MeshPhysicalMaterial({
      color: 0xd9ebff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.015,
      metalness: 0.0,
      transmission: 0.42,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const cupCyl = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, CH, 64, 1, true), matCupFront);
    cupCyl.position.y = CH / 2;
    cupCyl.castShadow = true;
    cupCyl.renderOrder = 11;
    cupGrp.add(cupCyl);

    const matCupCapT = new THREE.MeshPhysicalMaterial({
      color: 0xd7e8fb,
      transparent: true,
      opacity: 0.24,
      roughness: 0.03,
      metalness: 0.0,
      transmission: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      depthWrite: false,
    });
    const cupCap = new THREE.Mesh(new THREE.CircleGeometry(CR, 40), matCupCapT);
    cupCap.rotation.x = Math.PI;
    cupCap.position.y = 0;
    cupCap.renderOrder = 10;
    cupGrp.add(cupCap);

    const cupRim = new THREE.Mesh(new THREE.TorusGeometry(CR, 0.025, 12, 42), matRim);
    cupRim.rotation.x = PI / 2;
    cupRim.position.y = CH;
    cupRim.castShadow = true;
    cupRim.renderOrder = 10;
    cupGrp.add(cupRim);

    const cupRimB = new THREE.Mesh(new THREE.TorusGeometry(CR, 0.016, 10, 42), matRim);
    cupRimB.rotation.x = PI / 2;
    cupRimB.position.y = 0.01;
    cupRimB.renderOrder = 10;
    cupGrp.add(cupRimB);

    const mCupMot = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.22, 18), matMCup);
    mCupMot.rotation.z = PI / 2;
    mCupMot.position.set(0.14, 0, 0);
    mCupMot.renderOrder = 10;
    cupGrp.add(mCupMot);
    const mCupFl = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.06, 20), matCar);
    mCupFl.rotation.z = PI / 2;
    mCupFl.position.set(0.28, 0, 0);
    mCupFl.renderOrder = 10;
    cupGrp.add(mCupFl);

    /* ───── Dados (geometria realista arredondada) ─────
       RoundedBoxGeometry do three/examples/jsm: width, height,
       depth, segmentos do filete (6), raio do arredondamento
       (≈12% da meia-aresta — quina visível mas não exagerada). */
    const dieGeo = new RoundedBoxGeometry(DHS * 2, DHS * 2, DHS * 2, 6, DHS * 0.24);
    const die1Mesh = new THREE.Mesh(dieGeo, makeMats(1, bTex));
    const die2Mesh = new THREE.Mesh(dieGeo.clone(), makeMats(1, gTex));
    die1Mesh.castShadow = true;
    die2Mesh.castShadow = true;
    die1Mesh.receiveShadow = false;
    die2Mesh.receiveShadow = false;
    // Offset minúsculo em y pra evitar z-fighting com o piso da mesa
    die1Mesh.position.y += 0.002;
    die2Mesh.position.y += 0.002;
    die1Mesh.renderOrder = 5;
    die2Mesh.renderOrder = 5;
    scene.add(die1Mesh);
    scene.add(die2Mesh);

    const shGeo = new THREE.CircleGeometry(0.34, 32);
    const sh1 = new THREE.Mesh(shGeo, matShad.clone());
    const sh2 = new THREE.Mesh(shGeo.clone(), matShad.clone());
    sh1.rotation.x = -PI / 2; sh1.position.y = 0.032; scene.add(sh1);
    sh2.rotation.x = -PI / 2; sh2.position.y = 0.032; scene.add(sh2);

    /* ───── Helper: regenera as 12 texturas dos dados conforme modo ─────
       Usado pelo setWhiteMode em runtime. Dispõe as texturas antigas e os
       materiais atuais antes de aplicar os novos — evita leak de GPU. */
    const rebuildDieTextures = (whiteMode: boolean) => {
      // Dispõe texturas antigas
      for (let fi = 1; fi <= 6; fi++) {
        bTex[fi]?.dispose();
        gTex[fi]?.dispose();
      }
      if (whiteMode) {
        // Ambos os dados: base off-white (menos reflexo especular do que branco puro),
        // pintas em azul escuro para máximo contraste sem perder no brilho
        const WHITE_LIGHT = '#f0f0f0';
        const WHITE_DARK = '#c8c8c8';
        const WHITE_BORDER = 'rgba(200,200,210,0.22)';
        for (let fi = 1; fi <= 6; fi++) {
          bTex[fi] = makeDieFaceTexture(fi, WHITE_LIGHT, WHITE_DARK, WHITE_BORDER, maxAnis, PIP_DARK_BLUE);
          gTex[fi] = makeDieFaceTexture(fi, WHITE_LIGHT, WHITE_DARK, WHITE_BORDER, maxAnis, PIP_DARK_BLUE);
        }
      } else {
        // Restaura azul/verde originais
        for (let fi = 1; fi <= 6; fi++) {
          bTex[fi] = makeDieFaceTexture(fi, '#5ea7ff', '#1f5fe0', 'rgba(220,235,255,0.16)', maxAnis);
          gTex[fi] = makeDieFaceTexture(fi, '#2dd63a', '#10951a', 'rgba(225,255,230,0.14)', maxAnis);
        }
      }
      // Aplica novos materiais aos meshes existentes, com flag whiteMode
      // propagada para usar propriedades mais foscas no modo branco.
      if (Array.isArray(die1Mesh.material)) die1Mesh.material.forEach(m => m.dispose());
      die1Mesh.material = makeMats(state.die1, bTex, whiteMode);
      if (Array.isArray(die2Mesh.material)) die2Mesh.material.forEach(m => m.dispose());
      die2Mesh.material = makeMats(state.die2, gTex, whiteMode);
    };

    /* ───── Estado inicial ───── */
    const state = {
      renderer, scene, camera,
      cur: 'IDLE' as State,
      sTime: 0,
      running: false,
      zoomProg: 0,
      die1: 1, die2: 1,
      p1: mkDie(),
      p2: mkDie(),
      d1Final: new THREE.Vector3(0, DIE_Y, 0),
      d2Final: new THREE.Vector3(1, DIE_Y, 0),
      rollResolve: null as ((r: { blue: number; green: number }) => void) | null,
      animId: 0,
      whiteMode: false,
      rebuildDieTextures,
      audio: (() => { const a = new IbereAudio(); a.preload(); return a; })(),
      // Áudio mecânico da máquina (/public/sounds/maquina.mp3)
      machineAudio: (() => {
        if (typeof Audio === 'undefined') return null;
        try {
          const el = new Audio('/sounds/maquina.mp3');
          el.preload = 'auto';
          el.loop = false;
          el.volume = 0.45;
          return el;
        } catch { return null; }
      })(),
      pushContactPlayed: false,
      frontPad, rearPad, pushMesh, cupGrp,
      carriageBody, carriageArm, carriageMotorBlock,
      rollerMeshes, rollerPositions, cupLt,
      die1Mesh, die2Mesh, sh1, sh2,
      bTex, gTex,
      pistFA, pistFB, pistRA, pistRB, pistPA, pistPB,
      pistRailL, pistRailR,
      camPos: CAM_POS, camTgt: CAM_TGT,
      onStateChange,
      disposables: [
        dieGeo, shGeo, floorTexO, edgeLn.geometry,
        matPad, matPush, matRail, matSlot, matMotor, matBelt, matCar,
        matRoll, matScrew, matRim, matMCup, matShad, matBkt,
        matPB, matPM, matPS, matPR, matPJ, matRing, matTableO, matLegO, matFloorO, matAcr, matEdgeL,
        matCupBack, matCupFront, matCupCapT,
      ] as Array<{ dispose: () => void }>,
    };
    internals.current = state;

    /* ───── Resize: aspect-aware camera ─────
       Em telas tall (mobile, aspect < 1.45) a câmera-base precisa
       chegar mais perto / mais baixa pra não deixar a máquina
       aparecendo minúscula no centro do canvas. */
    const onResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;

      if (camera.aspect < 1.45) {
        // Mobile / portrait: máquina inteira visível, folga no canto inf-esq
        CAM_POS.set(-0.86, 5.40, 9.55);
        CAM_TGT.set(0.45, 0.95, 0);
      } else {
        // Desktop / landscape: máquina inteira visível, folga no canto inf-esq
        CAM_POS.set(-1.06, 5.55, 9.90);
        CAM_TGT.set(0.45, 0.95, 0);
      }
      // Só reposiciona quando NÃO está no zoom (zoom usa o lerp).
      if (state && state.zoomProg <= 0.02) {
        camera.position.copy(CAM_POS);
        camera.lookAt(CAM_TGT.x, CAM_TGT.y, CAM_TGT.z);
      }
      camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Pré-compila shaders (incluindo matPR clearcoat) de forma assíncrona
    // pra não bloquear o main thread durante o mount — evita travada
    // entre "Começar lançamento" e o botão "Lançar" aparecer.
    // O compile roda no próximo idle frame; se o usuário clicar antes,
    // a compilação acontece sob demanda no primeiro render da animação.
    const compileId = requestAnimationFrame(() => {
      try { renderer.compile(scene, camera); } catch { /* noop */ }
    });

    /* ═══════ MÁQUINA DE ESTADOS ═══════ */
    function setDieMats(mesh: THREE.Mesh, result: number, isBlue: boolean) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
      mesh.material = makeMats(result, isBlue ? bTex : gTex, state.whiteMode);
    }

    function initPhysics() {
      const eVx = -Math.sin(TILT);
      const eVy =  Math.cos(TILT);

      // impulso horizontal mínimo obrigatório
      const minVX1 = 4.2;
      const minVX2 = 3.9;

      const s1 = rand(4.0, 5.0);
      const s2 = rand(3.7, 4.7);

      // nascer um pouco para dentro do volume do copo, não na borda
      state.p1 = {
        x: MX + DHS * 0.10,
        y: MY + DHS * 0.55,
        z: MZ + rand(-0.16, 0.16),

        vx: -Math.max(minVX1, Math.abs(eVx * s1) + rand(0.15, 0.40)),
        vy: eVy * s1 + rand(-0.12, 0.10),
        vz: rand(-0.85, 0.85),

        rZ: rand(-0.30, 0.30),
        rX: rand(-0.22, 0.22),
        rY: rand(-0.30, 0.30),

        vrZ: rand(8, 14),
        vrX: rand(5, 9),
        vrY: rand(3, 6),

        on: false, active: true, spawned: true, delay: 0, bounces: 0,
      };

      state.p2 = {
        x: MX - DHS * 0.12,
        y: MY + DHS * 1.05,
        z: MZ + rand(-0.18, 0.18),

        vx: -Math.max(minVX2, Math.abs(eVx * s2) + rand(0.10, 0.35)),
        vy: eVy * s2 + rand(-0.10, 0.12),
        vz: rand(-0.90, 0.90),

        rZ: rand(-0.30, 0.30),
        rX: rand(-0.22, 0.22),
        rY: rand(-0.30, 0.30),

        vrZ: rand(-14, -8),
        vrX: rand(-9, -4),
        vrY: rand(-6, -3),

        on: false, active: true, spawned: true, delay: 0, bounces: 0,
      };
    }

    /* ───── Helpers de física: cup local↔world e constraints ───── */
    function cupW2L(wx: number, wy: number, wz: number, cY: number, cRZ: number) {
      const dx = wx - PIVOT_X;
      const dy = wy - cY;
      const dz = wz - CZ;
      const c = Math.cos(-cRZ), s = Math.sin(-cRZ);
      return { x: dx * c - dy * s, y: dx * s + dy * c, z: dz };
    }

    function solveDicePairCollision(a: DieBody, b: DieBody) {
      if (!a.active || !b.active || !a.spawned || !b.spawned) return;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;

      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.0001) dist = 0.0001;

      // Raio de colisão ligeiramente maior que 2×DHS para cubos arredondados
      const minDist = DHS * 2.16;

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        // Overshoot de 6% para eliminar re-penetração entre iterações
        const penetration = (minDist - dist) * 1.06;

        let wa = a.on ? 0.15 : 0.50;
        let wb = b.on ? 0.15 : 0.50;
        if (a.on && !b.on) { wa = 0.00; wb = 1.00; }
        if (!a.on && b.on) { wa = 1.00; wb = 0.00; }
        if (a.on && b.on)  { wa = 0.50; wb = 0.50; }

        a.x += nx * penetration * wa;
        a.y += ny * penetration * wa;
        a.z += nz * penetration * wa;

        b.x -= nx * penetration * wb;
        b.y -= ny * penetration * wb;
        b.z -= nz * penetration * wb;

        const rvx = a.vx - b.vx;
        const rvy = a.vy - b.vy;
        const rvz = a.vz - b.vz;
        const relN = rvx * nx + rvy * ny + rvz * nz;

        if (relN < 0) {
          // Restituição mais baixa → contato mais sólido, menos "borracha"
          const restitution = 0.34;
          const j = -(1 + restitution) * relN * 0.5;

          a.vx += nx * j; a.vy += ny * j; a.vz += nz * j;
          b.vx -= nx * j; b.vy -= ny * j; b.vz -= nz * j;

          let tx = rvx - relN * nx;
          let ty = rvy - relN * ny;
          let tz = rvz - relN * nz;
          const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);

          if (tl > 0.0001) {
            tx /= tl; ty /= tl; tz /= tl;
            const frictionImpulse = Math.min(0.11, tl * 0.05);
            a.vx -= tx * frictionImpulse;
            a.vy -= ty * frictionImpulse;
            a.vz -= tz * frictionImpulse;
            b.vx += tx * frictionImpulse;
            b.vy += ty * frictionImpulse;
            b.vz += tz * frictionImpulse;
          }

          a.vrX += (Math.random() - 0.5) * 1.4;
          a.vrY += (Math.random() - 0.5) * 1.8;
          a.vrZ += (Math.random() - 0.5) * 1.4;

          b.vrX += (Math.random() - 0.5) * 1.4;
          b.vrY += (Math.random() - 0.5) * 1.8;
          b.vrZ += (Math.random() - 0.5) * 1.4;
        }
      }
    }

    function solveCupConstraint(d: DieBody, cY: number, cRZ: number) {
      if (!d.active || !d.spawned) return;
      if ((['SHAKE', 'TILT_S'] as State[]).indexOf(state.cur) < 0) return;

      const loc = cupW2L(d.x, d.y, d.z, cY, cRZ);

      const innerR = CR - DHS * 0.92;
      const minY = DHS * 0.98;
      const maxY = CH - DHS * 0.98;

      const rr = Math.sqrt(loc.x * loc.x + loc.z * loc.z);
      if (rr > innerR) {
        const nx = loc.x / rr;
        const nz = loc.z / rr;

        loc.x = nx * innerR;
        loc.z = nz * innerR;

        const w = cupL2W(loc.x, loc.y, loc.z, cY, cRZ);
        d.x = w.x; d.y = w.y; d.z = w.z;

        const vx = d.vx, vz = d.vz;
        const vn = vx * nx + vz * nz;
        if (vn > 0) {
          d.vx -= nx * vn * 1.55;
          d.vz -= nz * vn * 1.55;
          d.vx *= 0.92;
          d.vz *= 0.92;
        }

        d.vrX += (Math.random() - 0.5) * 1.3;
        d.vrY += (Math.random() - 0.5) * 1.6;
        d.vrZ += (Math.random() - 0.5) * 1.3;
      }

      if (loc.y < minY) {
        // trava rígida no fundo interno
        loc.y = minY;

        const wf = cupL2W(loc.x, loc.y, loc.z, cY, cRZ);
        d.x = wf.x;
        d.y = wf.y;
        d.z = wf.z;

        // rebate na normal principal do copo
        if (d.vy < 0) d.vy = Math.abs(d.vy) * 0.48;

        // mantém o alcance horizontal, não mata o lançamento
        d.vx *= 0.99;
        d.vz *= 0.99;

        // pequeno empurrão extra para não ficar colando no fundo
        d.y += 0.002;
      }

      if (loc.y > maxY) {
        loc.y = maxY;
        const wt = cupL2W(loc.x, loc.y, loc.z, cY, cRZ);
        d.x = wt.x; d.y = wt.y; d.z = wt.z;

        if (d.vy > 0) d.vy = -d.vy * 0.38;
      }
    }

    function physStep(dt: number) {
      const settling = (['SETTLE', 'ZOOM', 'RESULT'] as State[]).indexOf(state.cur) >= 0;
      const geoNow = geom();
      const cY = geoNow.cY;
      const cRZ = geoNow.cRZ;

      [state.p1, state.p2].forEach(d => {
        if (!d.active) return;
        if (!d.spawned) {
          d.delay -= dt;
          if (d.delay <= 0) d.spawned = true;
          return;
        }

        if (d.on) {
          d.y = DIE_Y;
          d.rX = 0; d.rZ = 0;
          d.vx = 0; d.vy = 0; d.vz = 0;
          d.vrZ = 0; d.vrX = 0; d.vrY = 0;
          return;
        }

        d.vy -= GRAV * dt;

        if (settling) {
          const fs = Math.pow(0.80, dt * 60);
          d.vrZ *= fs; d.vrX *= fs; d.vrY *= fs;
          d.vx *= Math.pow(0.84, dt * 60);
          d.vz *= Math.pow(0.84, dt * 60);
        }

        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;

        d.rZ += d.vrZ * dt;
        d.rX += d.vrX * dt;
        d.rY += d.vrY * dt;
      });

      // Mais iterações intercalando cup + colisão para resolver contato sólido
      for (let i = 0; i < 5; i++) {
        solveCupConstraint(state.p1, cY, cRZ);
        solveCupConstraint(state.p2, cY, cRZ);
        solveDicePairCollision(state.p1, state.p2);
      }

      [state.p1, state.p2].forEach(d => {
        if (!d.active || !d.spawned || d.on) return;

        if ((['RELEASE', 'FALL', 'SETTLE'] as State[]).indexOf(state.cur) >= 0) {
          if (d.y <= DIE_Y && d.vy <= 0) {
            d.y = DIE_Y;
            d.rX = 0;
            d.rZ = 0;
            d.vrX = 0;
            d.vrZ = 0;
            d.rY = Math.round(d.rY / (PI / 2)) * (PI / 2);

            const spd = Math.abs(d.vy);

            if (spd > 0.08) {
              const e = Math.max(0.04, 0.36 - d.bounces * 0.08);
              d.vy = spd * e;

              const fr = FRIC * Math.pow(0.90, d.bounces);
              d.vx *= fr;
              d.vz *= fr;

              d.vx += (Math.random() - 0.5) * spd * 0.028;
              d.vz += (Math.random() - 0.5) * spd * 0.028;
              d.vrY *= 0.68;
              d.bounces++;

              // ── Impacto procedural sincronizado com o quique ──
              if (d.bounces <= 3 && spd > 0.4) {
                const panX = Math.max(-1, Math.min(1, d.x / 3.5));
                const intensity = Math.min(1, spd / 3.5);
                try { state.audio.impact(panX, intensity); } catch { /* noop */ }
              }
            } else {
              d.vy = 0;
              d.vx *= 0.18;
              d.vz *= 0.18;

              if (Math.abs(d.vx) < 0.03 && Math.abs(d.vz) < 0.03) {
                d.vx = 0;
                d.vz = 0;
                d.vrY = 0;
                d.on = true;
              }
            }
          }

          if (d.x < -3.0 + DHS) { d.x = -3.0 + DHS; d.vx =  Math.abs(d.vx) * 0.42; }
          if (d.x >  CX  - DHS) { d.x =  CX  - DHS; d.vx = -Math.abs(d.vx) * 0.38; }
          if (d.z < -2.6 + DHS) { d.z = -2.6 + DHS; d.vz =  Math.abs(d.vz) * 0.42; }
          if (d.z >  2.6 - DHS) { d.z =  2.6 - DHS; d.vz = -Math.abs(d.vz) * 0.42; }
        }
      });

      // Passes finais de colisão dado-dado após bounces e boundary constraints
      for (let k = 0; k < 6; k++) {
        solveDicePairCollision(state.p1, state.p2);
      }
    }

    function cupL2W(lx: number, ly: number, lz: number, cY: number, cRZ: number) {
      const c = Math.cos(cRZ), s = Math.sin(cRZ);
      return { x: PIVOT_X + lx * c - ly * s, y: cY + lx * s + ly * c, z: CZ + lz };
    }

    // Separação esférica pós-procedural: impede penetração visual
    // entre dois dados cujas posições foram calculadas por curvas sin/cos.
    // Modifica os objetos de posição in-place.
    const SOLID_MIN_DIST = DHS * 2.14;
    function separateDicePositions(
      a: { x: number; y: number; z: number },
      b: { x: number; y: number; z: number },
    ) {
      let dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
      let distSq = dx * dx + dy * dy + dz * dz;
      if (distSq >= SOLID_MIN_DIST * SOLID_MIN_DIST) return;
      if (distSq < 1e-8) { dx = 0.001; dy = 0; dz = 0; distSq = 1e-6; }
      const dist = Math.sqrt(distSq);
      const nx = dx / dist, ny = dy / dist, nz = dz / dist;
      const sep = (SOLID_MIN_DIST - dist) * 0.52; // cada um move metade
      a.x += nx * sep; a.y += ny * sep; a.z += nz * sep;
      b.x -= nx * sep; b.y -= ny * sep; b.z -= nz * sep;
    }

    interface DieRender {
      x?: number; y?: number; z?: number;
      rX?: number; rY?: number; rZ?: number;
      a?: number; show?: boolean;
    }

    function geom() {
      const t = state.sTime;
      const dur = CFG[state.cur].dur;
      const p = dur > 0 ? clamp(t / dur, 0, 1) : 1;
      const pe = eio(p), po = eout(p);
      let fPZ: number, rPZ: number;
      if (state.cur === 'IDLE') { fPZ = PFZ_R; rPZ = PRZ_R; }
      else if (state.cur === 'ALIGN') { fPZ = lerp(PFZ_R, PFZ_E, pe); rPZ = lerp(PRZ_R, PRZ_E, pe); }
      else if (state.cur === 'PUSH' || state.cur === 'LOAD') { fPZ = PFZ_E; rPZ = PRZ_E; }
      else if (state.cur === 'ROTATE_UP') { fPZ = lerp(PFZ_E, PFZ_R, pe); rPZ = lerp(PRZ_E, PRZ_R, pe); }
      else { fPZ = PFZ_R; rPZ = PRZ_R; }

      let pushX: number | null = null;
      if (state.cur === 'PUSH') {
        // anteparo acompanha dado 1 mantendo contato: face dir. do anteparo = face esq. do dado 1
        const d1x = lerp(D1X0, D1_PT, pe);
        pushX = d1x - DHS - PWD / 2 - CONTACT_EPS;
      } else if (state.cur === 'LOAD') {
        // continua colado no dado 1 enquanto entram no copo
        const leadX = lerp(D1_PT, MOUTH_X + DHS * 0.82, eout(clamp(state.sTime / CFG.LOAD.dur, 0, 1)));
        pushX = leadX - DHS - PWD / 2 - CONTACT_EPS;
      } else if (state.cur === 'ROTATE_UP') pushX = lerp(PX_E, PX_R, pe);

      let cY = CY_LOW, cRZ = PI / 2;
      if (state.cur === 'IDLE' || state.cur === 'ALIGN' || state.cur === 'PUSH' || state.cur === 'LOAD') {
        cY = CY_LOW; cRZ = PI / 2;
      } else if (state.cur === 'ROTATE_UP') {
        cY = CY_LOW; cRZ = lerp(PI / 2, 0, pe);
      } else if (state.cur === 'LIFT') {
        cY = lerp(CY_LOW, CY_HIGH, pe); cRZ = 0;
      } else if (state.cur === 'SHAKE') {
        const ps = clamp(state.sTime / CFG.SHAKE.dur, 0, 1);
        const tprog = clamp((ps - 0.48) / 0.52, 0, 1);
        const baseTilt = lerp(0, TILT, eio(tprog));
        const shk = Math.sin(state.sTime * PI * 13) * 0.32
                  + Math.sin(state.sTime * PI * 8.7) * 0.14
                  + Math.sin(state.sTime * PI * 19.3) * 0.06;
        cY = CY_HIGH + Math.sin(state.sTime * PI * 9) * 0.08
                     + Math.abs(Math.sin(state.sTime * PI * 6.1)) * 0.05;
        cRZ = baseTilt + shk;
      } else if (state.cur === 'TILT_S') {
        const shk2 = Math.sin(state.sTime * PI * 13) * 0.16
                   + Math.sin(state.sTime * PI * 8.7) * 0.06;
        cY = CY_HIGH + Math.sin(state.sTime * PI * 9) * 0.035;
        cRZ = TILT + 0.03 + shk2;
      } else if (state.cur === 'RELEASE' || state.cur === 'FALL' || state.cur === 'SETTLE') {
        const bothLanded = state.p1.on && state.p2.on;
        const vib = bothLanded ? 0 : 1;
        const shk3 = (Math.sin(state.sTime * PI * 13) * 0.22
                    + Math.sin(state.sTime * PI * 8.7) * 0.09) * vib;
        cY = CY_HIGH + Math.sin(state.sTime * PI * 9) * 0.04 * vib;
        cRZ = TILT + shk3;
      } else {
        cY = CY_HIGH; cRZ = TILT;
      }

      let d1: DieRender = { x: D1X0, y: DIE_Y, z: DZ0, rZ: 0, rX: 0, rY: 0, a: 1, show: true };
      let d2: DieRender = { x: D2X0, y: DIE_Y, z: DZ0 + 0.22, rZ: 0, rX: 0, rY: 0, a: 1, show: true };

      if (state.cur === 'ALIGN') {
        // Os dados ficam PARADOS até a paleta frontal encostar neles.
        // Paleta frontal (box espessura 0.09): face interna = fPZ - 0.045.
        // Contato quando fPadFace <= dadoZ + DHS. Após contato, dado é
        // empurrado pela paleta. Destino final: z = 0 (centro da mesa).
        const PAD_HALF = 0.045;
        const fPadZ = lerp(PFZ_R, PFZ_E, pe);
        const fPadFace = fPadZ - PAD_HALF;

        // Dado 1: parado em DZ0 até a paleta alcançá-lo
        if (fPadFace <= DZ0 + DHS) {
          d1.z = Math.max(0, fPadFace - DHS);
        }
        // else d1.z já é DZ0 (valor default da linha 1842)

        // Dado 2: parado em DZ0+0.22 até a paleta alcançá-lo
        const d2Start = DZ0 + 0.22;
        if (fPadFace <= d2Start + DHS) {
          d2.z = Math.max(0, fPadFace - DHS);
        } else {
          d2.z = d2Start;
        }
      } else if (state.cur === 'PUSH') {
        d1.z = 0;
        d2.z = 0;

        // dado 1 controlado pelo empurrador
        d1.x = lerp(D1X0, D1_PT, pe);
        // dado 2 encostado no dado 1 (contato face a face)
        const pairGap = DHS * 2 + CONTACT_EPS;
        d2.x = d1.x + pairGap;

        if (!state.pushContactPlayed && pe > 0.12) {
          state.pushContactPlayed = true;
          try { state.audio.pushContact(); } catch { /* noop */ }
        }

        d1.rZ = lerp(0, 0.02, pe);
        d2.rZ = lerp(0, -0.015, pe);
        d1.rY = lerp(0, 0.01, pe);
        d2.rY = lerp(0, -0.01, pe);
      } else if (state.cur === 'LOAD') {
        d1.z = 0;
        d2.z = 0;

        // os dois continuam entrando juntos, em contato
        const leadX = lerp(D1_PT, MOUTH_X + DHS * 0.82, po);
        const pairGap2 = DHS * 2 + CONTACT_EPS;

        d1.x = leadX;
        d2.x = leadX + pairGap2;

        d1.a = 1;
        d2.a = 1;

        d1.rZ = lerp(0.00, 0.22, p);
        d2.rZ = lerp(0.00, -0.16, p);
        d1.rY = lerp(0.00, 0.08, p);
        d2.rY = lerp(0.00, -0.05, p);
      } else if (state.cur === 'ROTATE_UP' || state.cur === 'LIFT') {
        const w1 = cupL2W( DHS * 0.18, DHS * 1.45,  DHS * 0.42, cY, cRZ);
        const w2 = cupL2W(-DHS * 0.36, DHS * 2.55, -DHS * 0.34, cY, cRZ);
        d1 = { x: w1.x, y: w1.y, z: w1.z, rZ: cRZ + 0.28, rX:  0.34, rY:  0.52, a: 1, show: true };
        d2 = { x: w2.x, y: w2.y, z: w2.z, rZ: cRZ - 0.19, rX: -0.22, rY: -0.63, a: 1, show: true };
      } else if (state.cur === 'SHAKE') {
        const st = state.sTime;
        const sx1 = Math.sin(st * PI * 8.7) * DHS * 0.72 + Math.cos(st * PI * 4.3) * DHS * 0.18;
        const sy1 = DHS * 1.2 + Math.abs(Math.sin(st * PI * 6.9)) * DHS * 1.65;
        const sz1 = Math.cos(st * PI * 10.9) * DHS * 0.55 + Math.sin(st * PI * 5.1) * DHS * 0.12;

        const sx2 = Math.cos(st * PI * 7.9) * DHS * 0.78 + Math.sin(st * PI * 4.7) * DHS * 0.16;
        const sy2 = DHS * 2.2 + Math.abs(Math.cos(st * PI * 6.2)) * DHS * 1.85;
        const sz2 = Math.sin(st * PI * 9.8) * DHS * 0.58 + Math.cos(st * PI * 4.9) * DHS * 0.14;

        const w1s = cupL2W(sx1, sy1, sz1, cY, cRZ);
        const w2s = cupL2W(sx2, sy2, sz2, cY, cRZ);

        // Separação pós-procedural: impede penetração visual dentro do copo
        separateDicePositions(w1s, w2s);

        d1 = { x: w1s.x, y: w1s.y, z: w1s.z, rZ:  st * 4.7, rX: st * 3.4, rY:  st * 2.7, a: 1, show: true };
        d2 = { x: w2s.x, y: w2s.y, z: w2s.z, rZ: -st * 4.1, rX: st * 2.8, rY: -st * 3.4, a: 1, show: true };
      } else if (state.cur === 'TILT_S') {
        const ly1 = lerp(DHS * 1.1, CH * 0.62, pe);
        const ly2 = lerp(DHS * 2.8, CH * 0.75, pe);
        const w1t = cupL2W(DHS * 0.20, ly1, 0, cY, cRZ);
        const w2t = cupL2W(-DHS * 0.25, ly2, 0, cY, cRZ);

        // Separação pós-procedural para TILT_S
        separateDicePositions(w1t, w2t);

        d1 = { x: w1t.x, y: w1t.y, z: w1t.z, rZ: cRZ + 0.30, rX: 0.20, rY: 0, a: 1, show: true };
        d2 = { x: w2t.x, y: w2t.y, z: w2t.z, rZ: cRZ - 0.20, rX: -0.10, rY: 0, a: 1, show: true };
      } else if ((state.cur === 'RELEASE' || state.cur === 'FALL' || state.cur === 'SETTLE') && state.p1.active) {
        if (state.p1.spawned) d1 = { x: state.p1.x, y: state.p1.y, z: state.p1.z, rZ: state.p1.rZ, rX: state.p1.rX, rY: state.p1.rY, a: 1, show: true };
        else d1 = { show: false, a: 0 };
        if (state.p2.spawned) d2 = { x: state.p2.x, y: state.p2.y, z: state.p2.z, rZ: state.p2.rZ, rX: state.p2.rX, rY: state.p2.rY, a: 1, show: true };
        else d2 = { show: false, a: 0 };
      } else if (state.cur === 'ZOOM' || state.cur === 'RESULT') {
        d1 = { x: state.d1Final.x, y: DIE_Y, z: state.d1Final.z, rZ: state.p1.rZ || 0, rX: state.p1.rX || 0, rY: state.p1.rY || 0, a: 1, show: true };
        d2 = { x: state.d2Final.x, y: DIE_Y, z: state.d2Final.z, rZ: state.p2.rZ || 0, rX: state.p2.rX || 0, rY: state.p2.rY || 0, a: 1, show: true };
      }

      return { fPZ, rPZ, pushX, cY, cRZ, d1, d2 };
    }

    function applyDie(mesh: THREE.Mesh, sh: THREE.Mesh, d: DieRender) {
      const vis = !!d.show && (d.a === undefined ? true : d.a > 0.01);
      mesh.visible = vis;
      sh.visible = vis;
      if (!vis) return;
      mesh.position.set(d.x || 0, d.y || DIE_Y, d.z || 0);
      mesh.rotation.set(d.rX || 0, d.rY || 0, d.rZ || 0);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => { (m as THREE.MeshStandardMaterial).opacity = d.a !== undefined ? d.a : 1; });
      }
      const h = Math.max(0, (d.y || DIE_Y) - DIE_Y);
      const sc = Math.max(0.05, 1 - h * 0.38);
      sh.position.set((d.x || 0) + h * 0.03, 0.02, (d.z || 0) + h * 0.015);
      sh.scale.set(sc, sc, 1);
      (sh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 - h * 0.07) * (d.a !== undefined ? d.a : 1);
    }

    function updateScene(g: ReturnType<typeof geom>) {
      state.frontPad.position.z = g.fPZ;
      state.rearPad.position.z = g.rPZ;
      state.pushMesh.visible = (g.pushX !== null);
      if (g.pushX !== null) state.pushMesh.position.x = g.pushX;

      const fpz = state.frontPad.position.z;
      const rpz = state.rearPad.position.z;
      updPistZ(state.pistFA, PAD_PX[0], 0.22, fpz, PMNT_FZ);
      updPistZ(state.pistFB, PAD_PX[1], 0.22, fpz, PMNT_FZ);
      updPistZ(state.pistRA, PAD_PX[0], 0.22, rpz, PMNT_RZ);
      updPistZ(state.pistRB, PAD_PX[1], 0.22, rpz, PMNT_RZ);
      const pxNow = (g.pushX !== null) ? g.pushX : PX_R;
      const pushVis = (state.cur === 'PUSH' || state.cur === 'LOAD' || state.cur === 'ROTATE_UP');
      [state.pistPA, state.pistPB].forEach(pst => {
        pst.body.visible  = pushVis;
        pst.mid1.visible  = pushVis;
        pst.mid2.visible  = pushVis;
        pst.rod.visible   = pushVis;
        pst.jt0.visible   = pushVis;
        pst.jt1.visible   = pushVis;
        pst.ring1.visible = pushVis;
        pst.ring2.visible = pushVis;
      });
      if (pushVis) {
        updPistX(state.pistPA, 0.40, 0.28, pxNow, PMNT_PX);
        updPistX(state.pistPB, -0.40, 0.28, pxNow, PMNT_PX);
      }

      state.cupGrp.position.set(PIVOT_X, g.cY, CZ);
      state.cupGrp.rotation.z = g.cRZ;
      const cy = g.cY;
      state.carriageBody.position.set(CX, cy, CZ);
      state.carriageArm.position.set((CX + PIVOT_X) / 2, cy, CZ);
      state.carriageMotorBlock.position.set(PIVOT_X + 0.04, cy, CZ);
      for (let ri2 = 0; ri2 < state.rollerMeshes.length; ri2++) {
        state.rollerMeshes[ri2].position.set(
          CX + state.rollerPositions[ri2][0],
          cy + state.rollerPositions[ri2][1],
          CZ + state.rollerPositions[ri2][2]
        );
      }

      updPistY(state.pistRailL, CX - RAIL_PIST_OFF, CZ, cy);
      updPistY(state.pistRailR, CX + RAIL_PIST_OFF, CZ, cy);

      state.cupLt.position.set(CX, g.cY, CZ - 0.6);
      const ltTarget = (state.cur === 'SHAKE') ? (0.8 + Math.sin(state.sTime * PI * 8) * 0.25) : 0;
      state.cupLt.intensity += (ltTarget - state.cupLt.intensity) * 0.12;

      applyDie(state.die1Mesh, state.sh1, g.d1);
      applyDie(state.die2Mesh, state.sh2, g.d2);

      // ── Esconde paredes acrílicas + wireframe durante o ZOOM/RESULT ──
      // Caso contrário a linha de visão da câmera atravessa a parede
      // frontal e cria um "insulfilm" sutil sobre os dados pousados.
      // Threshold em 0.15 = começam a desaparecer logo no início do
      // tween de zoom (não pisca: tween dura 1.8s).
      const hideAcrylics = state.zoomProg > 0.15;
      for (let ai = 0; ai < acrylicGroup.length; ai++) {
        acrylicGroup[ai].visible = !hideAcrylics;
      }

      if (state.zoomProg > 0.02) {
        const az = eout(state.zoomProg);
        const aspect = camera.aspect;

        // Zoom tight DINÂMICO mirado nos dois dados pousados.
        // Centro = midpoint dos dados; câmera num arco fixo acima/à
        // frente; FOV bem mais fechado em mobile pra dados maiores.
        const dxMid = (state.d1Final.x + state.d2Final.x) * 0.5;
        const dzMid = (state.d1Final.z + state.d2Final.z) * 0.5;
        const dyMid = DIE_Y + DHS * 0.4;

        // Mobile: arco mais alto/recuado pra caber vertical
        const offX = aspect < 1.45 ? -1.20 :  -1.35;
        const offY = aspect < 1.45 ?  2.95 :   2.72;
        const offZ = aspect < 1.45 ?  4.50 :   4.05;
        const endFov = aspect < 1.45 ? 29.5 : 31.5;

        const posZX = dxMid + offX;
        const posZY = dyMid + offY;
        const posZZ = dzMid + offZ;

        camera.position.set(
          lerp(CAM_POS.x, posZX, az),
          lerp(CAM_POS.y, posZY, az),
          lerp(CAM_POS.z, posZZ, az),
        );
        camera.lookAt(
          lerp(CAM_TGT.x, dxMid, az),
          lerp(CAM_TGT.y, dyMid, az),
          lerp(CAM_TGT.z, dzMid, az),
        );

        camera.fov = lerp(41.2, endFov, az);
        camera.updateProjectionMatrix();
      } else {
        camera.position.copy(CAM_POS);
        camera.lookAt(CAM_TGT.x, CAM_TGT.y, CAM_TGT.z);

        if (camera.fov !== 41.2) {
          camera.fov = 41.2;
          camera.updateProjectionMatrix();
        }
      }
    }

    function updateStepProgress() {
      const ci = STEP_STATES.indexOf(state.cur);
      const lbl = CFG[state.cur]?.lbl || '';
      if (state.onStateChange) state.onStateChange(ci, lbl);
    }

    function enterState(s: State) {
      state.cur = s;
      state.sTime = 0;

      if (s === 'ALIGN') {
        // Som curto de início (UX) + áudio do Iberê (single-shot, ALIGN→RELEASE)
        playSound('/sounds/nextChallenge.mp3');
        state.audio.start();
        // Inicia som mecânico da máquina
        if (state.machineAudio) {
          try { state.machineAudio.currentTime = 0; } catch { /* noop */ }
          const p = state.machineAudio.play();
          if (p && typeof (p as Promise<void>).catch === 'function') {
            (p as Promise<void>).catch(() => { /* autoplay bloqueado */ });
          }
        }
      }
      if (s === 'RELEASE') {
        // Para o áudio do Iberê quando os dados saem do copo
        state.audio.stop();
        initPhysics();
        // reforço horizontal imediato para garantir saída real do copo
        state.p1.vx -= 0.55;
        state.p2.vx -= 0.50;
      }
      if (s === 'ZOOM') {
        // Para o som mecânico da máquina
        if (state.machineAudio) {
          try { state.machineAudio.pause(); state.machineAudio.currentTime = 0; } catch { /* noop */ }
        }
        [state.p1, state.p2].forEach(d => {
          d.vy = 0; d.vx = 0; d.vz = 0;
          d.vrZ = 0; d.vrX = 0; d.vrY = 0;
          d.rX = 0; d.rZ = 0;
          d.rY = Math.round((d.rY || 0) / (PI / 2)) * (PI / 2);
          d.y = DIE_Y; d.on = true;
        });
        state.d1Final.set(clamp(state.p1.x, -2.8, 3.0), DIE_Y, clamp(state.p1.z, -2.4, 2.4));
        state.d2Final.set(clamp(state.p2.x, -2.8, 3.0), DIE_Y, clamp(state.p2.z, -2.4, 2.4));
        setDieMats(state.die1Mesh, state.die1, true);
        setDieMats(state.die2Mesh, state.die2, false);
      }
      if (s === 'RESULT') {
        state.running = false;
        playSound('/sounds/correct.mp3');
        updateStepProgress();
        if (state.rollResolve) {
          // pequena pausa para o aluno ver o zoom estabilizado
          setTimeout(() => {
            if (state.rollResolve) {
              state.rollResolve({ blue: state.die1, green: state.die2 });
              state.rollResolve = null;
            }
          }, 350);
        }
        return;
      }
      updateStepProgress();
    }

    function nextState() {
      const i = ORDER.indexOf(state.cur);
      if (i < ORDER.length - 1) enterState(ORDER[i + 1]);
    }

    /* ───── Loop principal ───── */
    let lastTs: number | null = null;
    let readyFired = false;
    const animate = (ts: number) => {
      state.animId = requestAnimationFrame(animate);
      // Sinaliza pronto após o primeiro frame ser pintado (mesmo se o canvas
      // estiver oculto durante o pré-init, para o pai esconder o skeleton).
      if (!readyFired) { readyFired = true; requestAnimationFrame(() => onReady?.()); }
      // Otimização: se o canvas está oculto (display:none em algum ancestral),
      // pula render e física para liberar CPU/GPU. offsetParent === null é
      // verificação O(1) e cobre o caso do componente montado mas escondido
      // (pré-init de WebGL durante outras cenas, switch entre cenas no Ex7).
      if (renderer.domElement.offsetParent === null) { lastTs = null; return; }
      if (lastTs === null) lastTs = ts;
      const dt = Math.min((ts - lastTs) * 0.001, 0.05);
      lastTs = ts;
      if (state.running && state.cur !== 'IDLE' && state.cur !== 'RESULT') {
        if (state.cur === 'RELEASE' || state.cur === 'FALL' || state.cur === 'SETTLE') physStep(dt);
        state.zoomProg = state.cur === 'ZOOM' ? clamp(state.sTime / CFG.ZOOM.dur, 0, 1)
                       : (state.cur as State) === 'RESULT' ? 1 : 0;
        const dur = CFG[state.cur].dur;
        if (dur > 0) {
          state.sTime += dt;
          if (state.sTime >= dur) nextState();
        }
      }
      const g = geom();
      updateScene(g);
      renderer.render(scene, camera);
    };
    state.animId = requestAnimationFrame(animate);

    // Exposição do enterState para o handle
    (state as unknown as { _enterState: (s: State) => void })._enterState = enterState;

    /* ───── Cleanup ───── */
    return () => {
      cancelAnimationFrame(state.animId);
      cancelAnimationFrame(compileId);
      ro.disconnect();
      // Libera o player do áudio do Iberê
      try { state.audio.dispose(); } catch { /* noop */ }
      // Libera áudio da máquina
      try { if (state.machineAudio) { state.machineAudio.pause(); state.machineAudio.src = ''; } } catch { /* noop */ }
      // dispose das texturas dos dados
      Object.values(bTex).forEach(t => t.dispose());
      Object.values(gTex).forEach(t => t.dispose());
      // dispose dos materiais dos dados (arrays)
      [die1Mesh, die2Mesh].forEach(m => {
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
      });
      // dispose das geometrias e materiais coletados
      state.disposables.forEach(d => { try { d.dispose(); } catch { /* noop */ } });
      // varredura genérica de meshes para liberar geos restantes
      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) { try { mesh.geometry.dispose(); } catch { /* noop */ } }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      internals.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════ API pública ═══════ */
  const roll = useCallback((): Promise<{ blue: number; green: number }> => {
    return new Promise((resolve) => {
      const s = internals.current;
      if (!s) { resolve({ blue: 1, green: 1 }); return; }
      if (s.running) { resolve({ blue: 1, green: 1 }); return; }
      s.die1 = rand6();
      s.die2 = rand6();
      s.running = true;
      s.zoomProg = 0;
      s.pushContactPlayed = false;
      s.p1 = mkDie();
      s.p2 = mkDie();
      // Atualiza materiais com sorteio (dado azul = die1, verde = die2).
      // Propaga whiteMode para manter acabamento fosco quando em modo branco.
      if (Array.isArray(s.die1Mesh.material)) s.die1Mesh.material.forEach(m => m.dispose());
      s.die1Mesh.material = makeMats(s.die1, s.bTex, s.whiteMode);
      if (Array.isArray(s.die2Mesh.material)) s.die2Mesh.material.forEach(m => m.dispose());
      s.die2Mesh.material = makeMats(s.die2, s.gTex, s.whiteMode);
      s.rollResolve = resolve;
      // dispara primeiro estado
      const enter = (s as unknown as { _enterState: (st: State) => void })._enterState;
      enter('ALIGN');
    });
  }, []);

  const getCurrentStep = useCallback(() => {
    const s = internals.current;
    if (!s) return -1;
    return STEP_STATES.indexOf(s.cur);
  }, []);

  const getCurrentLabel = useCallback(() => {
    const s = internals.current;
    if (!s) return '';
    return CFG[s.cur]?.lbl || '';
  }, []);

  const setWhiteMode = useCallback((enabled: boolean) => {
    const s = internals.current;
    if (!s || s.whiteMode === enabled) return;
    s.whiteMode = enabled;
    s.rebuildDieTextures(enabled);
  }, []);

  useImperativeHandle(ref, () => ({ roll, getCurrentStep, getCurrentLabel, setWhiteMode }), [roll, getCurrentStep, getCurrentLabel, setWhiteMode]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Cena 3D interativa de uma máquina automática de lançamento de dois dados."
      className="w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio,
        maxWidth,
        margin: '0 auto',
        background: '#07090f',
        boxShadow: '0 14px 60px rgba(0,0,0,.9)',
        border: '1.5px solid #0d1824',
      }}
    />
  );
});

export default DiceMachineScene;
