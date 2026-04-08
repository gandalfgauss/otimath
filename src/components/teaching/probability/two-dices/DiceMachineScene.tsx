'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { playSound } from '@/hooks/global/useSound';

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
const CY_HIGH = 4.0;
const TILT = PI * 0.75;
const MX = PIVOT_X + CH * (-Math.sin(TILT));
const MY = CY_HIGH + CH * (Math.cos(TILT));
const MZ = CZ;
const PFZ_R = 2.7, PFZ_E = 0.52;
const PRZ_R = -2.7, PRZ_E = -0.52;
const PWD = 0.12;
const MOUTH_X = PIVOT_X - CH;
const D1_PT = MOUTH_X - DHS * 0.5;
const D2_PT = MOUTH_X - DHS * 2.0;
const PX_R = -3.56;
const PX_E = MOUTH_X - PWD / 2;
const D1X0 = -2.2, D2X0 = -1.1, DZ0 = 1.5;

// ── Física ──
const GRAV = 12.0;
const FRIC = 0.76;

/* ═══════════════════════════════════════════════════════════════
   MachineAudio — síntese procedural via Web Audio API
   Recria o som contínuo da máquina (motor + agitação) sem depender
   de arquivos externos. Combina dois osciladores sawtooth (motor)
   com ruído branco filtrado em bandpass (agitação dos dados no copo)
   e cliques metálicos breves nos eventos chave.
   ═══════════════════════════════════════════════════════════════ */
class MachineAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  motorOsc1: OscillatorNode | null = null;
  motorOsc2: OscillatorNode | null = null;
  motorGain: GainNode | null = null;
  noiseSrc: AudioBufferSourceNode | null = null;
  noiseGain: GainNode | null = null;
  noiseFilter: BiquadFilterNode | null = null;
  playing = false;

  init() {
    if (this.ctx) return;
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
              || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  start() {
    this.init();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* policy autoplay */ });
    }
    if (this.playing) return;
    this.playing = true;

    // Motor: dois osciladores sawtooth — fundamental + harmônica
    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc1.type = 'sawtooth';
    this.motorOsc1.frequency.value = 88;
    this.motorOsc2 = this.ctx.createOscillator();
    this.motorOsc2.type = 'square';
    this.motorOsc2.frequency.value = 132;
    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.value = 0.045;
    const motorFilter = this.ctx.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorFilter.frequency.value = 800;
    motorFilter.Q.value = 0.5;
    this.motorOsc1.connect(this.motorGain);
    this.motorOsc2.connect(this.motorGain);
    this.motorGain.connect(motorFilter).connect(this.master);
    this.motorOsc1.start();
    this.motorOsc2.start();

    // Ruído branco filtrado (agitação dos dados dentro do copo)
    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    this.noiseSrc = this.ctx.createBufferSource();
    this.noiseSrc.buffer = buf;
    this.noiseSrc.loop = true;
    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 1200;
    this.noiseFilter.Q.value = 0.8;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseSrc.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
    this.noiseSrc.start();

    // Fade-in suave
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.linearRampToValueAtTime(0.55, t + 0.18);
  }

  /** level entre 0 e 1 — controla intensidade da agitação e do motor */
  setShakeLevel(level: number) {
    if (!this.ctx || !this.noiseGain || !this.motorOsc1 || !this.motorOsc2) return;
    const t = this.ctx.currentTime;
    const lvl = Math.max(0, Math.min(1, level));
    this.noiseGain.gain.setTargetAtTime(0.22 * lvl, t, 0.05);
    this.motorOsc1.frequency.setTargetAtTime(88 + lvl * 38, t, 0.04);
    this.motorOsc2.frequency.setTargetAtTime(132 + lvl * 56, t, 0.04);
  }

  /** Clique metálico breve — usado em PUSH/LOAD/RELEASE */
  click(freq = 220) {
    this.init();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* noop */ });
    }
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  stop() {
    if (!this.ctx || !this.master || !this.playing) return;
    this.playing = false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.22);
    setTimeout(() => {
      try { this.motorOsc1?.stop(); } catch (e) { /* noop */ }
      try { this.motorOsc2?.stop(); } catch (e) { /* noop */ }
      try { this.noiseSrc?.stop(); } catch (e) { /* noop */ }
      this.motorOsc1 = null;
      this.motorOsc2 = null;
      this.noiseSrc = null;
    }, 280);
  }

  dispose() {
    this.stop();
    setTimeout(() => {
      try { this.ctx?.close(); } catch (e) { /* noop */ }
      this.ctx = null;
      this.master = null;
    }, 320);
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

function makeTex(face: number, c1: string, c2: string): THREE.CanvasTexture {
  const sz = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = sz;
  const cx = cv.getContext('2d')!;
  const r = 28;
  cx.beginPath();
  cx.moveTo(r, 4); cx.lineTo(sz - r, 4);
  cx.arcTo(sz - 4, 4, sz - 4, r + 4, r); cx.lineTo(sz - 4, sz - r - 4);
  cx.arcTo(sz - 4, sz - 4, sz - r - 4, sz - 4, r); cx.lineTo(r + 4, sz - 4);
  cx.arcTo(4, sz - 4, 4, sz - r - 4, r); cx.lineTo(4, r + 4);
  cx.arcTo(4, 4, r + 4, 4, r); cx.closePath();
  const g = cx.createLinearGradient(0, 0, sz, sz);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  cx.fillStyle = g; cx.fill();
  const hl = cx.createRadialGradient(sz * 0.22, sz * 0.18, 0, sz * 0.22, sz * 0.18, sz * 0.55);
  hl.addColorStop(0, 'rgba(255,255,255,.32)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = hl; cx.fill();
  cx.fillStyle = 'rgba(255,255,255,.97)';
  cx.shadowColor = 'rgba(0,0,0,.6)'; cx.shadowBlur = 10;
  const sp = sz * 0.27, dr = sz * 0.096;
  const dots = DOTS[face] || DOTS[1];
  for (let i = 0; i < dots.length; i++) {
    cx.beginPath();
    cx.arc(sz / 2 + dots[i][0] * sp, sz / 2 + dots[i][1] * sp, dr, 0, PI * 2);
    cx.fill();
  }
  return new THREE.CanvasTexture(cv);
}

function faceLayout(top: number): number[] {
  const bot = 7 - top;
  const rest: number[] = [];
  for (let n = 1; n <= 6; n++) if (n !== top && n !== bot) rest.push(n);
  return [rest[0], rest[1], top, bot, rest[2], rest[3]];
}

function makeMats(result: number, tx: Record<number, THREE.CanvasTexture>): THREE.MeshStandardMaterial[] {
  const layout = faceLayout(result);
  const mats: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 6; i++) {
    mats.push(new THREE.MeshStandardMaterial({
      map: tx[layout[i]],
      roughness: 0.22, metalness: 0.04,
      transparent: true, opacity: 1,
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
  rod: THREE.Mesh;
  jt0: THREE.Mesh;
  jt1: THREE.Mesh;
}

const PBLEN = 0.38;
const PBRAD = 0.110;
const PRRAD = 0.058;

function mkPiston(scene: THREE.Scene, axis: 'x' | 'y' | 'z',
                  matPB: THREE.Material, matPR: THREE.Material, matPJ: THREE.Material): Piston {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(PBRAD, PBRAD + 0.005, PBLEN, 16), matPB);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(PRRAD, PRRAD, 1, 12), matPR);
  const jt0 = new THREE.Mesh(new THREE.SphereGeometry(PBRAD * 1.2, 10, 7), matPJ);
  const jt1 = new THREE.Mesh(new THREE.SphereGeometry(PRRAD * 1.7, 8, 6), matPJ);
  if (axis === 'z') { body.rotation.x = PI / 2; rod.rotation.x = PI / 2; }
  else if (axis === 'x') { body.rotation.z = PI / 2; rod.rotation.z = PI / 2; }
  [body, rod, jt0, jt1].forEach(m => { m.castShadow = true; scene.add(m); });
  return { body, rod, jt0, jt1 };
}

function updPistZ(p: Piston, px: number, py: number, padZ: number, mountZ: number) {
  const inward = (mountZ > 0) ? -1 : 1;
  const bodyTip = mountZ + inward * PBLEN;
  const padFace = padZ - inward * 0.047;
  const rodLen = Math.max(0.015, Math.abs(padFace - bodyTip));
  const rodCtr = (bodyTip + padFace) * 0.5;
  const bodyCenter = (mountZ + bodyTip) * 0.5;
  p.body.position.set(px, py, bodyCenter);
  p.rod.position.set(px, py, rodCtr);
  p.rod.scale.y = rodLen;
  p.jt0.position.set(px, py, mountZ);
  p.jt1.position.set(px, py, padFace);
}

function updPistX(p: Piston, pz: number, py: number, pushX: number, mountX: number) {
  const bodyTip = mountX + PBLEN;
  const pushFace = pushX - PWD * 0.5 - 0.01;
  let rodLen = pushFace - bodyTip;
  if (rodLen < 0.015) rodLen = 0.015;
  const rodCtrX = bodyTip + rodLen * 0.5;
  p.body.position.set(mountX + PBLEN * 0.5, py, pz);
  p.rod.position.set(rodCtrX, py, pz);
  p.rod.scale.y = rodLen;
  p.jt0.position.set(mountX, py, pz);
  p.jt1.position.set(pushFace, py, pz);
}

const RAIL_BODY_H = PBLEN;
function updPistY(p: Piston, px: number, pz: number, cY: number) {
  const bodyTopY = RAIL_BODY_H;
  const carrBotY = cY - 0.30;
  const rodLen = Math.max(0.02, carrBotY - bodyTopY);
  const rodCtrY = bodyTopY + rodLen * 0.5;
  p.body.position.set(px, RAIL_BODY_H * 0.5, pz);
  p.rod.position.set(px, rodCtrY, pz);
  p.rod.scale.y = rodLen;
  p.jt0.position.set(px, 0, pz);
  p.jt1.position.set(px, carrBotY, pz);
}

// ── Interface pública ──
export interface DiceMachineSceneHandle {
  /** Inicia o ciclo completo. Resolve com o resultado dos dois dados. */
  roll: () => Promise<{ blue: number; green: number }>;
  /** Estado atual do ciclo (para barra de progresso). */
  getCurrentStep: () => number;
  /** Mensagem associada ao estado atual. */
  getCurrentLabel: () => string;
}

interface Props {
  /** Callback chamado a cada mudança de estado (para barra de progresso/mensagem) */
  onStateChange?: (step: number, label: string) => void;
  aspectRatio?: string;
  maxWidth?: number;
}

const DiceMachineScene = forwardRef<DiceMachineSceneHandle, Props>(function DiceMachineScene(
  { onStateChange, aspectRatio = '758 / 520', maxWidth = 758 }, ref
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
    audio: MachineAudio;
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

    /* ───── Renderer ───── */
    const W3 = 758, H3 = 520;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W3, H3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.sortObjects = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    /* ───── Cena ───── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090f);
    scene.fog = new THREE.Fog(0x07090f, 20, 35);

    /* ───── Câmera (Fase 1.1c — ajuste final de framing) ─────
       FOV 38° (faixa premium 30–45 evita distorção wide).
       Position calculada para fill factor ~75% horizontal.
       Target rebaixado para y=0.95 (era 1.2): inclina o olhar
       ligeiramente para baixo, reclama o céu preto desperdiçado
       no topo do quadro e expõe melhor a mesa e os pistões.
       Pan horizontal acumulado de +0.35 em pos.x e tgt.x para
       revelar a borda direita da mesa sem rotação de câmera. */
    const camera = new THREE.PerspectiveCamera(38, W3 / H3, 0.1, 80);
    const CAM_POS = new THREE.Vector3(-2.25, 5.4, 9.2);
    const CAM_TGT = new THREE.Vector3(1.15, 0.95, 0);
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_TGT.x, CAM_TGT.y, CAM_TGT.z);

    /* ───── Luzes ───── */
    scene.add(new THREE.AmbientLight(0x3a5070, 0.7));
    const sunLt = new THREE.DirectionalLight(0xfff0e4, 1.0);
    sunLt.position.set(-4, 10, 7);
    sunLt.castShadow = true;
    sunLt.shadow.camera.left = -8; sunLt.shadow.camera.right = 8;
    sunLt.shadow.camera.top = 8; sunLt.shadow.camera.bottom = -8;
    sunLt.shadow.camera.near = 2; sunLt.shadow.camera.far = 25;
    sunLt.shadow.mapSize.width = 2048; sunLt.shadow.mapSize.height = 2048;
    sunLt.shadow.bias = -0.0008;
    scene.add(sunLt);
    const fillLt = new THREE.DirectionalLight(0x8899cc, 0.4);
    fillLt.position.set(6, 3, -4); scene.add(fillLt);
    const rimLt = new THREE.DirectionalLight(0x2244aa, 0.25);
    rimLt.position.set(0, -3, -8); scene.add(rimLt);
    const cupLt = new THREE.PointLight(0x4488ff, 0, 5);
    scene.add(cupLt);

    /* ───── Texturas dos dados ───── */
    const bTex: Record<number, THREE.CanvasTexture> = {};
    const gTex: Record<number, THREE.CanvasTexture> = {};
    for (let fi = 1; fi <= 6; fi++) {
      bTex[fi] = makeTex(fi, '#62bcff', '#0a2d70');
      gTex[fi] = makeTex(fi, '#80e880', '#0d3a10');
    }

    /* ───── Materiais da máquina ───── */
    const matPad = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, metalness: 0.14, roughness: 0.65 });
    const matPush = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, metalness: 0.18, roughness: 0.65 });
    const matRail = new THREE.MeshStandardMaterial({ color: 0xa8b2bc, metalness: 0.75, roughness: 0.20 });
    const matSlot = new THREE.MeshStandardMaterial({ color: 0x5a6470, metalness: 0.55, roughness: 0.40 });
    const matMotor = new THREE.MeshStandardMaterial({ color: 0x1e2028, metalness: 0.62, roughness: 0.38 });
    const matBelt = new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 0.92 });
    const matCar = new THREE.MeshStandardMaterial({ color: 0xdce0e6, metalness: 0.12, roughness: 0.58 });
    const matRoll = new THREE.MeshStandardMaterial({ color: 0x16181f, metalness: 0.52, roughness: 0.44 });
    const matScrew = new THREE.MeshStandardMaterial({ color: 0x687480, metalness: 0.82, roughness: 0.22 });
    const matRim = new THREE.MeshStandardMaterial({ color: 0x6a7278, metalness: 0.55, roughness: 0.28 });
    const matMCup = new THREE.MeshStandardMaterial({ color: 0x1e2028, metalness: 0.62, roughness: 0.38 });
    const matShad = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.50, depthWrite: false });
    const matBkt = new THREE.MeshStandardMaterial({ color: 0x4a5460, metalness: 0.62, roughness: 0.40 });
    const matPB = new THREE.MeshStandardMaterial({ color: 0xb0b8c2, metalness: 0.50, roughness: 0.35 });
    const matPR = new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.65, roughness: 0.20 });
    const matPJ = new THREE.MeshStandardMaterial({ color: 0x909aa4, metalness: 0.45, roughness: 0.45 });

    /* ───── Mesa ───── */
    const matTableO = new THREE.MeshStandardMaterial({ color: 0xb4b8bc, metalness: 0.3, roughness: 0.7 });
    const matLegO = new THREE.MeshStandardMaterial({ color: 0x787c82, metalness: 0.3, roughness: 0.7 });
    addBox(scene, 8.8, 0.2, 6.8, matTableO, 0, -0.1, 0, false, true);
    [[-3.5, -0.42, -2.9], [-3.5, -0.42, 2.9], [3.4, -0.42, -2.9], [3.4, -0.42, 2.9]].forEach(p => {
      addCyl(scene, 0.06, 0.08, 0.44, 8, matLegO, p[0], p[1], p[2]);
    });

    /* ───── Superfície com grid ───── */
    const fCo = document.createElement('canvas');
    fCo.width = fCo.height = 512;
    const fCtxo = fCo.getContext('2d')!;
    fCtxo.fillStyle = '#c8ccd0';
    fCtxo.fillRect(0, 0, 512, 512);
    fCtxo.strokeStyle = 'rgba(0,0,0,.055)';
    fCtxo.lineWidth = 1;
    for (let gio = 0; gio <= 512; gio += 32) {
      fCtxo.beginPath(); fCtxo.moveTo(gio, 0); fCtxo.lineTo(gio, 512); fCtxo.stroke();
      fCtxo.beginPath(); fCtxo.moveTo(0, gio); fCtxo.lineTo(512, gio); fCtxo.stroke();
    }
    const floorTexO = new THREE.CanvasTexture(fCo);
    floorTexO.repeat.set(4, 3);
    floorTexO.wrapS = floorTexO.wrapT = THREE.RepeatWrapping;
    const matFloorO = new THREE.MeshStandardMaterial({ map: floorTexO, metalness: 0.05, roughness: 0.85 });
    addBox(scene, 8, 0.03, 6, matFloorO, 0, 0.015, 0, false, true);

    /* ───── Paredes acrílicas ───── */
    const matAcr = new THREE.MeshPhysicalMaterial({
      color: 0xb0d0f0, transparent: true, opacity: 0.065,
      roughness: 0.02, metalness: 0,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const matEdgeL = new THREE.LineBasicMaterial({ color: 0x90b8d8, transparent: true, opacity: 0.42 });
    addBox(scene, 8, 1.2, 0.04, matAcr, 0, 0.62, 3);
    addBox(scene, 8, 1.2, 0.04, matAcr, 0, 0.62, -3);
    addBox(scene, 0.04, 1.2, 6, matAcr, -4, 0.62, 0);
    addBox(scene, 0.04, 1.2, 6, matAcr, 4, 0.62, 0);
    const edgeLn = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 1.2, 6)), matEdgeL
    );
    edgeLn.position.set(0, 0.6, 0);
    scene.add(edgeLn);

    /* ───── Plano de sombra ───── */
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.ShadowMaterial({ opacity: 0.22, transparent: true })
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
    const pistFA = mkPiston(scene, 'z', matPB, matPR, matPJ);
    const pistFB = mkPiston(scene, 'z', matPB, matPR, matPJ);
    const pistRA = mkPiston(scene, 'z', matPB, matPR, matPJ);
    const pistRB = mkPiston(scene, 'z', matPB, matPR, matPJ);
    const pistPA = mkPiston(scene, 'x', matPB, matPR, matPJ);
    const pistPB = mkPiston(scene, 'x', matPB, matPR, matPJ);

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
    const pistRailL = mkPiston(scene, 'y', matPB, matPR, matPJ);
    const pistRailR = mkPiston(scene, 'y', matPB, matPR, matPJ);
    addBox(scene, 0.10, 0.03, 0.14, matBkt, CX - RAIL_PIST_OFF, 0.015, CZ);
    addBox(scene, 0.10, 0.03, 0.14, matBkt, CX + RAIL_PIST_OFF, 0.015, CZ);

    /* ───── Trilho vertical ───── */
    const RAIL_H = 5.0;
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

    const matCupBack = new THREE.MeshStandardMaterial({
      color: 0xc8dcf0, transparent: true, opacity: 0.15,
      roughness: 0.04, metalness: 0.06,
      side: THREE.BackSide, depthWrite: false,
    });
    const cupCylBack = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, CH, 64, 1, true), matCupBack);
    cupCylBack.position.y = CH / 2;
    cupCylBack.renderOrder = 9;
    cupGrp.add(cupCylBack);

    const matCupFront = new THREE.MeshStandardMaterial({
      color: 0xc8dcf0, transparent: true, opacity: 0.18,
      roughness: 0.04, metalness: 0.06,
      side: THREE.FrontSide, depthWrite: false,
    });
    const cupCyl = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, CH, 64, 1, true), matCupFront);
    cupCyl.position.y = CH / 2;
    cupCyl.castShadow = true;
    cupCyl.renderOrder = 11;
    cupGrp.add(cupCyl);

    const matCupCapT = new THREE.MeshStandardMaterial({
      color: 0xc8dcf0, transparent: true, opacity: 0.28,
      roughness: 0.04, metalness: 0.06, depthWrite: false,
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

    /* ───── Dados ───── */
    const dieGeo = new THREE.BoxGeometry(DHS * 2, DHS * 2, DHS * 2);
    const die1Mesh = new THREE.Mesh(dieGeo, makeMats(1, bTex));
    const die2Mesh = new THREE.Mesh(dieGeo.clone(), makeMats(1, gTex));
    die1Mesh.castShadow = true;
    die2Mesh.castShadow = true;
    die1Mesh.renderOrder = 5;
    die2Mesh.renderOrder = 5;
    scene.add(die1Mesh);
    scene.add(die2Mesh);

    const shGeo = new THREE.CircleGeometry(0.34, 32);
    const sh1 = new THREE.Mesh(shGeo, matShad.clone());
    const sh2 = new THREE.Mesh(shGeo.clone(), matShad.clone());
    sh1.rotation.x = -PI / 2; sh1.position.y = 0.032; scene.add(sh1);
    sh2.rotation.x = -PI / 2; sh2.position.y = 0.032; scene.add(sh2);

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
      audio: new MachineAudio(),
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
        matPB, matPR, matPJ, matTableO, matLegO, matFloorO, matAcr, matEdgeL,
        matCupBack, matCupFront, matCupCapT,
      ] as Array<{ dispose: () => void }>,
    };
    internals.current = state;

    /* ───── Resize ───── */
    const onResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    /* ═══════ MÁQUINA DE ESTADOS ═══════ */
    function setDieMats(mesh: THREE.Mesh, result: number, isBlue: boolean) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
      mesh.material = makeMats(result, isBlue ? bTex : gTex);
    }

    function initPhysics() {
      const eVx = -Math.sin(TILT), eVy = Math.cos(TILT);
      const s1 = rand(3.2, 4.8), s2 = rand(2.8, 4.2);
      state.p1 = {
        x: MX - 0.10, y: MY, z: MZ + rand(-0.18, 0.18),
        vx: eVx * s1 + rand(-0.5, 0.5), vy: eVy * s1 + rand(-0.3, 0.2), vz: rand(-1.1, 0.8),
        rZ: 0, rX: 0, rY: 0,
        vrZ: rand(9, 15), vrX: rand(5, 9), vrY: rand(2, 5),
        on: false, active: true, spawned: true, delay: 0, bounces: 0,
      };
      state.p2 = {
        x: MX + 0.10, y: MY, z: MZ + rand(-0.18, 0.18),
        vx: eVx * s2 + rand(-0.5, 0.5), vy: eVy * s2 + rand(-0.3, 0.2), vz: rand(-0.8, 1.2),
        rZ: 0, rX: 0, rY: 0,
        vrZ: rand(-14, -8), vrX: rand(-9, -4), vrY: rand(-5, -2),
        on: false, active: true, spawned: false, delay: 0.18, bounces: 0,
      };
    }

    function physStep(dt: number) {
      const settling = (['SETTLE', 'ZOOM', 'RESULT'] as State[]).indexOf(state.cur) >= 0;

      [state.p1, state.p2].forEach(d => {
        if (!d.active) return;
        if (!d.spawned) { d.delay -= dt; if (d.delay <= 0) d.spawned = true; return; }

        if (d.on) {
          d.y = DIE_Y; d.rX = 0; d.rZ = 0;
          d.vx = 0; d.vy = 0; d.vz = 0;
          d.vrZ = 0; d.vrX = 0; d.vrY = 0;
          return;
        }

        d.vy -= GRAV * dt;
        d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        d.rZ += d.vrZ * dt; d.rX += d.vrX * dt; d.rY += d.vrY * dt;

        if (settling) {
          const fs = Math.pow(0.78, dt * 60);
          d.vrZ *= fs; d.vrX *= fs; d.vrY *= fs;
          d.vx *= Math.pow(0.82, dt * 60);
          d.vz *= Math.pow(0.82, dt * 60);
        }

        if (d.y <= DIE_Y && d.vy <= 0) {
          d.y = DIE_Y;
          d.rX = 0; d.rZ = 0;
          d.vrX = 0; d.vrZ = 0;
          d.rY = Math.round(d.rY / (PI / 2)) * (PI / 2);

          const spd = Math.abs(d.vy);

          if (spd > 0.06) {
            const e = Math.max(0.04, 0.40 - d.bounces * 0.09);
            d.vy = spd * e;
            const fr = FRIC * Math.pow(0.88, d.bounces);
            d.vx *= fr; d.vz *= fr;
            d.vx += (Math.random() - 0.5) * spd * 0.035;
            d.vz += (Math.random() - 0.5) * spd * 0.035;
            d.vrY *= 0.65;
            d.bounces++;
          } else {
            d.vy = 0; d.vx = 0; d.vz = 0;
            d.vrY = 0;
            d.on = true;
          }
        }

        if (d.x < -3.0 + DHS) { d.x = -3.0 + DHS; d.vx = Math.abs(d.vx) * 0.40; }
        if (d.x > CX - DHS) { d.x = CX - DHS; d.vx = -Math.abs(d.vx) * 0.35; }
        if (d.z < -2.6 + DHS) { d.z = -2.6 + DHS; d.vz = Math.abs(d.vz) * 0.40; }
        if (d.z > 2.6 - DHS) { d.z = 2.6 - DHS; d.vz = -Math.abs(d.vz) * 0.40; }
      });

      // Colisão dado-dado
      const CMIN = DHS * 2.20;
      for (let ci = 0; ci < 3; ci++) {
        const a1 = state.p1.active && state.p1.spawned;
        const a2 = state.p2.active && state.p2.spawned;
        if (!a1 || !a2) break;
        const cdx = state.p1.x - state.p2.x;
        const cdy = state.p1.y - state.p2.y;
        const cdz = state.p1.z - state.p2.z;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);
        if (cdist >= CMIN || cdist < 0.001) break;
        const pen = CMIN - cdist;
        const cnx = cdx / cdist, cny = cdy / cdist, cnz = cdz / cdist;
        if (!state.p1.on && !state.p2.on) {
          state.p1.x += cnx * pen * 0.5; state.p1.y += cny * pen * 0.5; state.p1.z += cnz * pen * 0.5;
          state.p2.x -= cnx * pen * 0.5; state.p2.y -= cny * pen * 0.5; state.p2.z -= cnz * pen * 0.5;
          const v1n = state.p1.vx * cnx + state.p1.vy * cny + state.p1.vz * cnz;
          const v2n = state.p2.vx * cnx + state.p2.vy * cny + state.p2.vz * cnz;
          if (v1n - v2n < 0) {
            const imp = (v1n - v2n) * 0.70;
            state.p1.vx -= imp * cnx; state.p1.vy -= imp * cny; state.p1.vz -= imp * cnz;
            state.p2.vx += imp * cnx; state.p2.vy += imp * cny; state.p2.vz += imp * cnz;
          }
        } else if (state.p1.on && !state.p2.on) {
          state.p2.x -= cnx * pen; state.p2.y -= cny * pen; state.p2.z -= cnz * pen;
          const v2nr = state.p2.vx * cnx + state.p2.vy * cny + state.p2.vz * cnz;
          if (v2nr < 0) {
            state.p2.vx -= v2nr * cnx * 1.2; state.p2.vy -= v2nr * cny * 1.2; state.p2.vz -= v2nr * cnz * 1.2;
          }
        } else if (!state.p1.on && state.p2.on) {
          state.p1.x += cnx * pen; state.p1.y += cny * pen; state.p1.z += cnz * pen;
          const v1nr = state.p1.vx * cnx + state.p1.vy * cny + state.p1.vz * cnz;
          if (v1nr > 0) {
            state.p1.vx -= v1nr * cnx * 1.2; state.p1.vy -= v1nr * cny * 1.2; state.p1.vz -= v1nr * cnz * 1.2;
          }
        } else {
          const hx = state.p1.x - state.p2.x, hz = state.p1.z - state.p2.z;
          const hd = Math.sqrt(hx * hx + hz * hz);
          const hmin = DHS * 2.04;
          if (hd < hmin && hd > 0.001) {
            const hsep = (hmin - hd) * 0.5 / hd;
            state.p1.x += hx * hsep; state.p1.z += hz * hsep;
            state.p2.x -= hx * hsep; state.p2.z -= hz * hsep;
          }
          break;
        }
      }
    }

    function cupL2W(lx: number, ly: number, lz: number, cY: number, cRZ: number) {
      const c = Math.cos(cRZ), s = Math.sin(cRZ);
      return { x: PIVOT_X + lx * c - ly * s, y: cY + lx * s + ly * c, z: CZ + lz };
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
      if (state.cur === 'PUSH') pushX = lerp(D1X0 - DHS - PWD / 2, PX_E, pe);
      else if (state.cur === 'LOAD') pushX = PX_E;
      else if (state.cur === 'ROTATE_UP') pushX = lerp(PX_E, PX_R, pe);

      let cY = CY_LOW, cRZ = PI / 2;
      if (state.cur === 'IDLE' || state.cur === 'ALIGN' || state.cur === 'PUSH' || state.cur === 'LOAD') {
        cY = CY_LOW; cRZ = PI / 2;
      } else if (state.cur === 'ROTATE_UP') {
        cY = CY_LOW; cRZ = lerp(PI / 2, 0, pe);
      } else if (state.cur === 'LIFT') {
        cY = lerp(CY_LOW, CY_HIGH, pe); cRZ = 0;
      } else if (state.cur === 'SHAKE') {
        const ps = clamp(state.sTime / CFG.SHAKE.dur, 0, 1);
        const tprog = clamp((ps - 0.55) / 0.45, 0, 1);
        const baseTilt = lerp(0, TILT, eio(tprog));
        const shk = Math.sin(state.sTime * PI * 13) * 0.32
                  + Math.sin(state.sTime * PI * 8.7) * 0.14
                  + Math.sin(state.sTime * PI * 19.3) * 0.06;
        cY = CY_HIGH + Math.sin(state.sTime * PI * 9) * 0.08
                     + Math.abs(Math.sin(state.sTime * PI * 6.1)) * 0.05;
        cRZ = baseTilt + shk;
      } else if (state.cur === 'TILT_S') {
        const shk2 = Math.sin(state.sTime * PI * 13) * 0.28
                   + Math.sin(state.sTime * PI * 8.7) * 0.11;
        cY = CY_HIGH + Math.sin(state.sTime * PI * 9) * 0.06;
        cRZ = TILT + shk2;
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
        d1.z = lerp(DZ0, 0, pe); d2.z = lerp(DZ0 + 0.22, 0, pe);
      } else if (state.cur === 'PUSH') {
        d1.z = 0; d2.z = 0;
        d1.x = lerp(D1X0, D1_PT, pe); d2.x = lerp(D2X0, D2_PT, pe);
      } else if (state.cur === 'LOAD') {
        d1.z = 0; d2.z = 0;
        d1.x = lerp(D1_PT, MOUTH_X + DHS * 0.4, po); d1.a = 1 - p * p;
        d2.x = lerp(D2_PT, MOUTH_X + DHS * 0.4, po); d2.a = 1 - p * p;
        d1.rZ = lerp(0, 0.45, p); d2.rZ = lerp(0, -0.35, p);
      } else if (state.cur === 'ROTATE_UP' || state.cur === 'LIFT') {
        const w1 = cupL2W(DHS * 0.35, DHS * 1.1, DHS * 0.10, cY, cRZ);
        const w2 = cupL2W(-DHS * 0.30, DHS * 2.8, -DHS * 0.15, cY, cRZ);
        d1 = { x: w1.x, y: w1.y, z: w1.z, rZ: cRZ + 0.35, rX: 0.15, rY: 0.20, a: 1, show: true };
        d2 = { x: w2.x, y: w2.y, z: w2.z, rZ: cRZ - 0.25, rX: 0.30, rY: -0.10, a: 1, show: true };
      } else if (state.cur === 'SHAKE') {
        const st = state.sTime;
        const sx1 = Math.sin(st * PI * 9.1) * DHS * 0.55;
        const sy1 = DHS * 1.4 + Math.abs(Math.sin(st * PI * 7.3)) * DHS * 1.2;
        const sz1 = Math.cos(st * PI * 11.7) * DHS * 0.35;
        const sx2 = Math.cos(st * PI * 8.3) * DHS * 0.60;
        const sy2 = DHS * 2.8 + Math.abs(Math.cos(st * PI * 6.1)) * DHS * 1.0;
        const sz2 = Math.sin(st * PI * 10.3) * DHS * 0.40;
        const w1s = cupL2W(sx1, sy1, sz1, cY, cRZ);
        const w2s = cupL2W(sx2, sy2, sz2, cY, cRZ);
        d1 = { x: w1s.x, y: w1s.y, z: w1s.z, rZ: st * 4.5, rX: st * 3.1, rY: st * 2.0, a: 1, show: true };
        d2 = { x: w2s.x, y: w2s.y, z: w2s.z, rZ: -st * 3.8, rX: st * 2.4, rY: -st * 3.2, a: 1, show: true };
      } else if (state.cur === 'TILT_S') {
        const ly1 = lerp(DHS * 1.1, CH * 0.62, pe);
        const ly2 = lerp(DHS * 2.8, CH * 0.75, pe);
        const w1t = cupL2W(DHS * 0.20, ly1, 0, cY, cRZ);
        const w2t = cupL2W(-DHS * 0.25, ly2, 0, cY, cRZ);
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
        pst.body.visible = pushVis; pst.rod.visible = pushVis;
        pst.jt0.visible = pushVis; pst.jt1.visible = pushVis;
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

      if (state.zoomProg > 0.02) {
        // Fase 1.1 — ZOOM final ajustado para casar com câmera base premium.
        // Aproxima ainda mais (distância ~8) e fecha FOV de 38° para 30°.
        const az = eout(state.zoomProg);
        const zx = lerp(state.camPos.x, -0.6, az);
        const zy = lerp(state.camPos.y, 3.6, az);
        const zz = lerp(state.camPos.z, 7.4, az);
        camera.position.set(zx, zy, zz);
        camera.lookAt(
          lerp(state.camTgt.x, 0.4, az),
          lerp(state.camTgt.y, 1.6, az),
          lerp(state.camTgt.z, 0.0, az)
        );
        camera.fov = lerp(38, 30, az);
        camera.updateProjectionMatrix();
      } else {
        camera.position.copy(state.camPos);
        camera.lookAt(state.camTgt.x, state.camTgt.y, state.camTgt.z);
        if (camera.fov !== 38) {
          camera.fov = 38;
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
        // Som curto de início + motor procedural contínuo
        playSound('/sounds/nextChallenge.mp3');
        state.audio.start();
      }
      if (s === 'PUSH') {
        // Clique grave dos pistões empurrando
        state.audio.click(180);
      }
      if (s === 'LOAD') {
        // Clique mais grave (dados caindo no copo)
        state.audio.click(140);
      }
      if (s === 'ROTATE_UP') {
        state.audio.click(220);
      }
      if (s === 'TILT_S') {
        state.audio.click(260);
      }
      if (s === 'RELEASE') {
        // Para o som contínuo da máquina e dispara um clique agudo de liberação
        state.audio.click(320);
        state.audio.stop();
        initPhysics();
      }
      if (s === 'ZOOM') {
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
    const animate = (ts: number) => {
      state.animId = requestAnimationFrame(animate);
      if (lastTs === null) lastTs = ts;
      const dt = Math.min((ts - lastTs) * 0.001, 0.05);
      lastTs = ts;
      if (state.running && state.cur !== 'IDLE' && state.cur !== 'RESULT') {
        if (state.cur === 'RELEASE' || state.cur === 'FALL' || state.cur === 'SETTLE') physStep(dt);
        state.zoomProg = state.cur === 'ZOOM' ? clamp(state.sTime / CFG.ZOOM.dur, 0, 1)
                       : (state.cur as State) === 'RESULT' ? 1 : 0;
        const dur = CFG[state.cur].dur;

        // ── Modulação contínua do áudio conforme o estado do ciclo ──
        // Motor leve nos estágios iniciais, intenso durante SHAKE, alto no TILT_S.
        let shakeLvl = 0;
        if (state.cur === 'ALIGN') shakeLvl = 0.10;
        else if (state.cur === 'PUSH') shakeLvl = 0.18;
        else if (state.cur === 'LOAD') shakeLvl = 0.22;
        else if (state.cur === 'ROTATE_UP') shakeLvl = 0.32;
        else if (state.cur === 'LIFT') shakeLvl = 0.42;
        else if (state.cur === 'SHAKE') {
          // Pulsação seguindo a oscilação visual do copo
          const ps = clamp(state.sTime / CFG.SHAKE.dur, 0, 1);
          shakeLvl = 0.78 + 0.22 * Math.abs(Math.sin(state.sTime * PI * 9));
          // Ramp-up suave nos primeiros 15%
          if (ps < 0.15) shakeLvl *= ps / 0.15;
        }
        else if (state.cur === 'TILT_S') shakeLvl = 0.62;
        state.audio.setShakeLevel(shakeLvl);

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
      ro.disconnect();
      // Encerra o motor de áudio procedural
      try { state.audio.dispose(); } catch (e) { /* noop */ }
      // dispose das texturas dos dados
      Object.values(bTex).forEach(t => t.dispose());
      Object.values(gTex).forEach(t => t.dispose());
      // dispose dos materiais dos dados (arrays)
      [die1Mesh, die2Mesh].forEach(m => {
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
      });
      // dispose das geometrias e materiais coletados
      state.disposables.forEach(d => { try { d.dispose(); } catch (e) { /* noop */ } });
      // varredura genérica de meshes para liberar geos restantes
      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) { try { mesh.geometry.dispose(); } catch (e) { /* noop */ } }
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
      s.p1 = mkDie();
      s.p2 = mkDie();
      // Atualiza materiais com sorteio (dado azul = die1, verde = die2)
      if (Array.isArray(s.die1Mesh.material)) s.die1Mesh.material.forEach(m => m.dispose());
      s.die1Mesh.material = makeMats(s.die1, s.bTex);
      if (Array.isArray(s.die2Mesh.material)) s.die2Mesh.material.forEach(m => m.dispose());
      s.die2Mesh.material = makeMats(s.die2, s.gTex);
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

  useImperativeHandle(ref, () => ({ roll, getCurrentStep, getCurrentLabel }), [roll, getCurrentStep, getCurrentLabel]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio,
        maxWidth,
        margin: '0 auto',
        background: '#06090f',
        boxShadow: '0 14px 60px rgba(0,0,0,.55)',
        border: '1.5px solid #0d1824',
      }}
    />
  );
});

export default DiceMachineScene;
