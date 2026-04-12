'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { playSound } from '@/hooks/global/useSound';

/* ═══════════════════════════════════════════════════════════════
   DiceScene — Dado 3D realista com Three.js (um dado só)
   Câmera elevada mostra a face de CIMA após o pouso.
   ═══════════════════════════════════════════════════════════════ */

// ── Constantes de física ──
const TABLE_Y  = -0.52;
const REST_Y   = TABLE_Y + 0.82;  // centro do dado acima da superfície (cubo 1.21)
const LAUNCH_Y = 2.6;             // altura de lançamento
const GRAVITY  = -16;             // gravidade
const MAX_BOUNCES = 2;            // bounces antes de assentar
const BOUNCE_RESTITUTION = [0.30, 0.15]; // energia retida em cada bounce
const BOUNCE_FRICTION    = [0.50, 0.30]; // atrito angular em cada bounce

// ── xoshiro128** (Blackman & Vigna, 2021) — PRNG para física visual ──
// Uint32Array nativo, período 2^128−1, passa BigCrush/PractRand.
class RNG {
  s: Uint32Array;
  constructor() {
    this.s = new Uint32Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(this.s);
    } else {
      const t = Date.now();
      this.s[0] = t >>> 0; this.s[1] = (t ^ 0xdeadbeef) >>> 0;
      this.s[2] = (t ^ 0xcafebabe) >>> 0; this.s[3] = (t ^ 0x12345678) >>> 0;
    }
    if (this.s[0] === 0 && this.s[1] === 0 && this.s[2] === 0 && this.s[3] === 0) this.s[0] = 1;
  }
  private _rotl(x: number, k: number) { return ((x << k) | (x >>> (32 - k))) >>> 0; }
  private _next() {
    const s = this.s;
    const result = (this._rotl(Math.imul(s[1], 5) >>> 0, 7) * 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = this._rotl(s[3], 11);
    return result;
  }
  f() { return this._next() / 4294967296; }
  n(a: number, b: number) { return a + this.f() * (b - a); }
}
const rng = new RNG();

// ── Mapeamento de materiais BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z] ──
// Valores das faces: [2, 5, 3, 4, 1, 6]
// Ou seja: +X=2, -X=5, +Y=3, -Y=4, +Z=1, -Z=6

// ── Quaternions para colocar cada face no TOPO (+Y) ──
function buildSnapRot() {
  const PI = Math.PI;
  return {
    1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0)),
    2: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, PI / 2)),
    3: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, 0)),
    4: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI, 0.12, 0)),
    5: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, -PI / 2)),
    6: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, 0, 0)),
  } as Record<number, THREE.Quaternion>;
}

// ── Geometria: cubo arredondado ──
function roundedBox(size: number, radius: number, segments: number) {
  const g = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
  const p = g.attributes.position as THREE.BufferAttribute;
  const h = size / 2 - radius;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = Math.max(-h, Math.min(h, x));
    const cy = Math.max(-h, Math.min(h, y));
    const cz = Math.max(-h, Math.min(h, z));
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (l > 0.0001) p.setXYZ(i, cx + dx / l * radius, cy + dy / l * radius, cz + dz / l * radius);
  }
  g.computeVertexNormals();
  return g;
}

// ── Textura de face com gradiente, pips com sombra e brilho ──
function faceTex(value: number, baseHex: number, pipColor: string, maxAniso: number) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;

  const base = new THREE.Color(baseHex);
  const hi = base.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const lo = base.clone().lerp(new THREE.Color(0x000000), 0.34);

  // Gradiente da face
  const grd = ctx.createLinearGradient(S * 0.1, S * 0.05, S * 0.92, S * 0.95);
  grd.addColorStop(0, '#' + hi.getHexString());
  grd.addColorStop(0.46, '#' + base.getHexString());
  grd.addColorStop(1, '#' + lo.getHexString());

  // Forma arredondada
  const r = 76;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(S - r, 0); ctx.quadraticCurveTo(S, 0, S, r);
  ctx.lineTo(S, S - r); ctx.quadraticCurveTo(S, S, S - r, S);
  ctx.lineTo(r, S); ctx.quadraticCurveTo(0, S, 0, S - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();

  // Borda sutil
  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 7;
  ctx.stroke();

  // Ruído de textura
  const id = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = (rng.f() - 0.5) * 8;
    id.data[i] = Math.min(255, Math.max(0, id.data[i] + v));
    id.data[i + 1] = Math.min(255, Math.max(0, id.data[i + 1] + v));
    id.data[i + 2] = Math.min(255, Math.max(0, id.data[i + 2] + v));
  }
  ctx.putImageData(id, 0, 0);

  // Posições das pintas
  const map: Record<number, number[][]> = {
    1: [[0.5, 0.5]],
    2: [[0.29, 0.29], [0.71, 0.71]],
    3: [[0.29, 0.29], [0.5, 0.5], [0.71, 0.71]],
    4: [[0.29, 0.29], [0.71, 0.29], [0.29, 0.71], [0.71, 0.71]],
    5: [[0.29, 0.29], [0.71, 0.29], [0.5, 0.5], [0.29, 0.71], [0.71, 0.71]],
    6: [[0.28, 0.21], [0.72, 0.21], [0.28, 0.5], [0.72, 0.5], [0.28, 0.79], [0.72, 0.79]],
  };
  const R = 44;

  for (const [px, py] of map[value]) {
    const cx = px * S, cy = py * S;

    // Sombra do pip
    const dg = ctx.createRadialGradient(cx + 3, cy + 4, 0, cx, cy, R * 1.18);
    dg.addColorStop(0, 'rgba(0,0,0,.42)');
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Pip com sombra
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 2.5;
    ctx.fillStyle = pipColor;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Brilho no pip
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const pg = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, 1, cx, cy, R);
    pg.addColorStop(0, 'rgba(255,255,255,.55)');
    pg.addColorStop(0.35, 'rgba(255,255,255,.13)');
    pg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = maxAniso;
  return tex;
}

// ── Criar dado ──
function makeDie(baseHex: number, roughness: number, maxAniso: number) {
  const geo = roundedBox(1.21, 0.15, 5);
  const mats = [2, 5, 3, 4, 1, 6].map(v =>
    new THREE.MeshStandardMaterial({
      map: faceTex(v, baseHex, '#ffffff', maxAniso),
      roughness,
      metalness: 0.06,
    })
  );
  const m = new THREE.Mesh(geo, mats);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Textura de madeira rica ──
function makeWood(maxAniso: number) {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;

  // Base
  const bg = ctx.createRadialGradient(S * 0.5, S * 0.42, 30, S * 0.5, S * 0.5, S * 0.72);
  bg.addColorStop(0, '#c8844a');
  bg.addColorStop(0.35, '#b5722f');
  bg.addColorStop(0.72, '#9a5e22');
  bg.addColorStop(1, '#7a4518');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // Veios
  for (let i = 0; i < 180; i++) {
    const y0 = rng.f() * S;
    const alpha = rng.n(0.04, 0.22);
    const dark = rng.f() > 0.55;
    ctx.strokeStyle = dark
      ? `rgba(60,28,8,${alpha})`
      : `rgba(220,160,80,${alpha * 0.7})`;
    ctx.lineWidth = rng.n(0.4, 2.8);
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(
      S * 0.28 + rng.n(-60, 60), y0 + rng.n(-18, 18),
      S * 0.72 + rng.n(-60, 60), y0 + rng.n(-18, 18),
      S, y0 + rng.n(-12, 12)
    );
    ctx.stroke();
  }

  // Veios escuros
  for (let i = 0; i < 40; i++) {
    const y0 = rng.f() * S;
    ctx.strokeStyle = `rgba(80,38,10,${rng.n(0.06, 0.18)})`;
    ctx.lineWidth = rng.n(1.2, 4.5);
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(
      S * 0.3 + rng.n(-80, 80), y0 + rng.n(-30, 30),
      S * 0.65 + rng.n(-80, 80), y0 + rng.n(-30, 30),
      S, y0 + rng.n(-20, 20)
    );
    ctx.stroke();
  }

  // Nós de madeira
  const knotCount = Math.floor(rng.n(3, 6));
  for (let k = 0; k < knotCount; k++) {
    const kx = rng.n(S * 0.12, S * 0.88);
    const ky = rng.n(S * 0.12, S * 0.88);
    const rx = rng.n(22, 55), ry = rng.n(14, 34);
    const rings = Math.floor(rng.n(3, 7));
    for (let r = rings; r >= 1; r--) {
      const f = r / rings;
      ctx.beginPath();
      ctx.ellipse(kx, ky, rx * f, ry * f, rng.n(-0.3, 0.3), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(55,22,6,${0.12 + f * 0.18})`;
      ctx.lineWidth = rng.n(0.8, 2.2);
      ctx.stroke();
    }
    const cg = ctx.createRadialGradient(kx, ky, 0, kx, ky, rx * 0.55);
    cg.addColorStop(0, 'rgba(45,18,4,.55)');
    cg.addColorStop(1, 'rgba(45,18,4,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(kx, ky, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ruído
  const id = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (rng.f() - 0.5) * 18;
    id.data[i] = Math.min(255, Math.max(0, id.data[i] + n));
    id.data[i + 1] = Math.min(255, Math.max(0, id.data[i + 1] + n * 0.75));
    id.data[i + 2] = Math.min(255, Math.max(0, id.data[i + 2] + n * 0.35));
  }
  ctx.putImageData(id, 0, 0);

  // Verniz
  const vg = ctx.createRadialGradient(S * 0.5, S * 0.38, 20, S * 0.5, S * 0.5, S * 0.52);
  vg.addColorStop(0, 'rgba(255,210,130,.18)');
  vg.addColorStop(0.45, 'rgba(255,190,100,.06)');
  vg.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 1.6);
  tex.anisotropy = maxAniso;
  return tex;
}

// ── Background ──
function makeBackground() {
  const W = 1024, H = 640;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;

  const g = ctx.createRadialGradient(W * 0.5, H * 0.34, 40, W * 0.5, H * 0.52, W * 0.78);
  g.addColorStop(0, '#5a3318');
  g.addColorStop(0.28, '#3d2210');
  g.addColorStop(0.62, '#24150a');
  g.addColorStop(1, '#110a04');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const gl = ctx.createRadialGradient(W * 0.5, H * 0.58, 10, W * 0.5, H * 0.58, 280);
  gl.addColorStop(0, 'rgba(220,140,60,.18)');
  gl.addColorStop(0.5, 'rgba(200,110,40,.07)');
  gl.addColorStop(1, 'rgba(200,110,40,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(cv);
}

// ═══════ Cores disponíveis ═══════
export const DICE_COLORS = {
  blue: 0x0a1f6e,
  green: 0x0d3d1a,
} as const;
export type DiceColor = keyof typeof DICE_COLORS;

// ═══════ Mapeamento faces ↔ materiais ═══════
// BoxGeometry: +X, -X, +Y, -Y, +Z, -Z → materiais [2, 5, 3, 4, 1, 6]
const FACE_MAP = [
  { mat: 0, face: 2, normal: new THREE.Vector3(1, 0, 0) },
  { mat: 1, face: 5, normal: new THREE.Vector3(-1, 0, 0) },
  { mat: 2, face: 3, normal: new THREE.Vector3(0, 1, 0) },
  { mat: 3, face: 4, normal: new THREE.Vector3(0, -1, 0) },
  { mat: 4, face: 1, normal: new THREE.Vector3(0, 0, 1) },
  { mat: 5, face: 6, normal: new THREE.Vector3(0, 0, -1) },
];

// ═══════ Interface pública ═══════
export interface DiceSceneHandle {
  roll: (targetFace: number) => Promise<void>;
  setIdle: (idle: boolean) => void;
  setColor: (color: DiceColor) => void;
  setBetting: (betting: boolean, onSelect?: (face: number) => void) => void;
  highlightFace: (face: number | null) => void;
  setMuteImpact: (mute: boolean) => void;
}

const DiceScene = forwardRef<DiceSceneHandle, { aspectRatio?: string; initialColor?: DiceColor }>(function DiceScene(
  { aspectRatio = '16 / 10', initialColor = 'blue' },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internals = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    die: THREE.Mesh;
    contactShadow: THREE.Mesh;
    snapRot: Record<number, THREE.Quaternion>;
    clock: THREE.Clock;
    animId: number;
    maxAniso: number;
    mode: 'idle' | 'rolling' | 'settle' | 'resting' | 'betting';
    rollVel: number;
    rollAng: { x: number; y: number; z: number };
    rollHorVel: { x: number; z: number } | null;
    rollBounces: number;
    rollTarget: number;
    rollResolve: (() => void) | null;
    settleStart: THREE.Quaternion | null;
    settleTarget: THREE.Quaternion | null;
    settleElapsed: number;
    // Betting mode
    bettingOnSelect: ((face: number) => void) | null;
    // Highlight
    highlightedFace: number | null;
    highlightedMatIdx: number | null;
    // Mute impact sounds
    muteImpact: boolean;
    // Pointer tracking
    pointerDown: boolean;
    pointerStartX: number;
    pointerStartY: number;
    pointerLastX: number;
    pointerLastY: number;
    pointerMoved: boolean;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setClearColor(0x110d09, 1);
    container.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Cena
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x16110d, 15, 34);
    scene.background = makeBackground();

    // Câmera elevada — mostra o topo do dado
    const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.05, 80);
    camera.position.set(0, 2.95, 4.05);
    camera.lookAt(0, 0.15, 0);

    // Luzes
    scene.add(new THREE.AmbientLight(0xfff7ed, 0.5));

    const key = new THREE.SpotLight(0xfffcf2, 7.8, 18, Math.PI / 3.2, 0.38, 1.1);
    key.position.set(0, 6.2, 4.2);
    key.target.position.set(0, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.01;
    scene.add(key, key.target);

    const fill = new THREE.PointLight(0xbfd7ff, 0.8, 12);
    fill.position.set(-3, 2.5, 2.5);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffddb2, 2.1, 12);
    rim.position.set(1.3, 3.1, -3.1);
    scene.add(rim);

    const island = new THREE.PointLight(0xffd090, 0.15, 5.8);
    island.position.set(0, 1.65, 0.8);
    scene.add(island);

    // Mesa
    const woodTex = makeWood(maxAniso);
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 15),
      new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0xd4945a,
        roughness: 0.58,
        metalness: 0.04,
      })
    );
    table.rotation.x = -Math.PI / 2;
    table.position.y = TABLE_Y;
    table.receiveShadow = true;
    scene.add(table);

    // Borda da mesa
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(11.8, 0.54, 10, 84),
      new THREE.MeshStandardMaterial({ color: 0x3d1f08, roughness: 0.42, metalness: 0.08 })
    );
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.y = TABLE_Y;
    scene.add(rimMesh);

    // Dado (um só, centralizado) — cor inicial via prop
    const die = makeDie(DICE_COLORS[initialColor], 0.88, maxAniso);
    die.position.set(0, REST_Y, 0);
    scene.add(die);

    // Sombra de contato
    const shadowCurve = new THREE.EllipseCurve(0, 0, 0.56, 0.28);
    const shadowShape = new THREE.Shape(shadowCurve.getPoints(48));
    const contactShadow = new THREE.Mesh(
      new THREE.ShapeGeometry(shadowShape),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, TABLE_Y + 0.007, 0.06);
    scene.add(contactShadow);

    const snapRot = buildSnapRot();
    const clock = new THREE.Clock();

    const state = {
      renderer, scene, camera, die, contactShadow, snapRot, clock, maxAniso,
      animId: 0,
      mode: 'idle' as 'idle' | 'rolling' | 'settle' | 'resting' | 'betting',
      rollVel: 0,
      rollAng: { x: 0, y: 0, z: 0 },
      rollHorVel: null as { x: number; z: number } | null,
      rollBounces: 0,
      rollTarget: 1,
      rollResolve: null as (() => void) | null,
      settleStart: null as THREE.Quaternion | null,
      settleTarget: null as THREE.Quaternion | null,
      settleElapsed: 0,
      // Betting
      bettingOnSelect: null as ((face: number) => void) | null,
      // Highlight
      highlightedFace: null as number | null,
      highlightedMatIdx: null as number | null,
      // Mute impact sounds (para sequências automáticas como Cena 2)
      muteImpact: false,
      // Pointer
      pointerDown: false,
      pointerStartX: 0,
      pointerStartY: 0,
      pointerLastX: 0,
      pointerLastY: 0,
      pointerMoved: false,
    };
    internals.current = state;

    // Resize
    const onResize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Loop de animação
    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = internals.current;
      if (!s) return;

      // IMPORTANTE: usar s.die (não a closure die) para funcionar após setColor()
      const d = s.die;
      const cs = s.contactShadow;

      if (s.mode === 'betting') {
        // Dado fica parado na posição onde o usuário deixou — sem rotação automática
        d.position.y = REST_Y;
        d.position.x = 0;
        d.position.z = 0;
        cs.visible = true;
        (cs.material as THREE.MeshBasicMaterial).opacity = 0.32;
      } else if (s.mode === 'idle') {
        d.rotation.x += 0.008;
        d.rotation.y += 0.012;
        d.rotation.z += 0.005;
        d.position.y = REST_Y;
        cs.visible = true;
        (cs.material as THREE.MeshBasicMaterial).opacity = 0.32;
      } else if (s.mode === 'rolling') {
        // Física adaptada do código de lançamento com copo
        s.rollVel += GRAVITY * dt;
        d.position.y += s.rollVel * dt;

        // Movimento horizontal suave (dado se desloca lateralmente)
        if (s.rollHorVel) {
          d.position.x += s.rollHorVel.x * dt;
          d.position.z += s.rollHorVel.z * dt;
          // Atrito horizontal
          s.rollHorVel.x *= (1 - 1.8 * dt);
          s.rollHorVel.z *= (1 - 1.8 * dt);
        }

        d.rotation.x += s.rollAng.x * dt;
        d.rotation.y += s.rollAng.y * dt;
        d.rotation.z += s.rollAng.z * dt;

        // Sombra acompanha altura — mais dramática
        const h = Math.max(0, d.position.y - REST_Y);
        (cs.material as THREE.MeshBasicMaterial).opacity = Math.max(0.04, 0.32 - h * 0.08);
        cs.scale.setScalar(1 + h * 0.2);
        // Sombra acompanha posição horizontal
        cs.position.x = d.position.x;

        if (d.position.y <= REST_Y) {
          d.position.y = REST_Y;
          s.rollBounces++;

          // Som de impacto — volume proporcional à velocidade
          const impactVol = Math.min(0.6, Math.abs(s.rollVel) * 0.04);
          if (impactVol > 0.05 && !s.muteImpact) playSound('/sounds/click.mp3');

          if (s.rollBounces >= MAX_BOUNCES) {
            // Último bounce → assentar na face correta
            s.settleStart = d.quaternion.clone();
            s.settleTarget = s.snapRot[s.rollTarget].clone();
            s.settleElapsed = 0;
            s.mode = 'settle';
          } else {
            // Bounce com restituição decrescente
            const bi = Math.min(s.rollBounces - 1, BOUNCE_RESTITUTION.length - 1);
            s.rollVel = Math.abs(s.rollVel) * BOUNCE_RESTITUTION[bi];
            const fric = BOUNCE_FRICTION[bi];
            s.rollAng.x *= fric;
            s.rollAng.y *= fric;
            s.rollAng.z *= fric;
          }
        }
      } else if (s.mode === 'settle') {
        s.settleElapsed += dt;
        const t = Math.min(s.settleElapsed / 0.35, 1);
        // Ease-out cúbico — mais suave que quadrático
        const ease = 1 - Math.pow(1 - t, 3);

        if (s.settleStart && s.settleTarget) {
          const q = s.settleStart.clone();
          q.slerp(s.settleTarget, ease);
          d.quaternion.copy(q);
        }
        d.position.y = REST_Y;
        (cs.material as THREE.MeshBasicMaterial).opacity = 0.32;
        cs.scale.setScalar(1);

        if (t >= 1) {
          if (s.settleTarget) d.quaternion.copy(s.settleTarget);
          // Resetar posição horizontal para centro
          d.position.x = 0;
          d.position.z = 0;
          cs.position.x = 0;
          s.mode = 'resting';
          if (s.rollResolve) {
            s.rollResolve();
            s.rollResolve = null;
          }
        }
      }

      renderer.render(scene, camera);
    };

    clock.start();
    animate();

    // ── Pointer events para modo betting (drag = gira, click = seleciona) ──
    const DRAG_THRESHOLD = 5; // px mínimo para considerar drag
    const ROTATION_SPEED = 0.012; // radianos por pixel — fluido em qualquer direção

    const onPointerDown = (e: PointerEvent) => {
      const s = internals.current;
      if (!s || s.mode !== 'betting') return;
      s.pointerDown = true;
      s.pointerMoved = false;
      s.pointerStartX = e.clientX;
      s.pointerStartY = e.clientY;
      s.pointerLastX = e.clientX;
      s.pointerLastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = internals.current;
      if (!s || !s.pointerDown || s.mode !== 'betting') return;
      const dx = e.clientX - s.pointerLastX;
      const dy = e.clientY - s.pointerLastY;
      // Verificar se moveu o suficiente para ser drag
      const totalDx = e.clientX - s.pointerStartX;
      const totalDy = e.clientY - s.pointerStartY;
      if (Math.abs(totalDx) > DRAG_THRESHOLD || Math.abs(totalDy) > DRAG_THRESHOLD) {
        s.pointerMoved = true;
      }
      if (s.pointerMoved && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
        // Rotação por quaternion no espaço da tela (evita gimbal lock)
        const angleX = dy * ROTATION_SPEED; // arrastar vertical → gira em X
        const angleY = dx * ROTATION_SPEED; // arrastar horizontal → gira em Y
        const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleX);
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleY);
        // Aplicar rotação no espaço do mundo (não local)
        s.die.quaternion.premultiply(qy).premultiply(qx);
      }
      s.pointerLastX = e.clientX;
      s.pointerLastY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = internals.current;
      if (!s || s.mode !== 'betting') { if (s) s.pointerDown = false; return; }
      s.pointerDown = false;
      el.style.cursor = s.mode === 'betting' ? 'grab' : 'default';
      // Se não arrastou: click → detectar face frontal
      if (!s.pointerMoved) {
        const camDir = s.camera.position.clone().sub(s.die.position).normalize();
        let bestDot = -Infinity;
        let bestFace = 1;
        for (const fm of FACE_MAP) {
          const wn = fm.normal.clone().applyQuaternion(s.die.quaternion);
          const dot = wn.dot(camDir);
          if (dot > bestDot) { bestDot = dot; bestFace = fm.face; }
        }
        if (s.bettingOnSelect) s.bettingOnSelect(bestFace);
      }
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    el.style.touchAction = 'none'; // previne scroll no touch

    return () => {
      cancelAnimationFrame(state.animId);
      ro.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── API pública ──
  const roll = useCallback((targetFace: number): Promise<void> => {
    return new Promise((resolve) => {
      const s = internals.current;
      if (!s) { resolve(); return; }

      s.rollTarget = targetFace;
      s.rollResolve = resolve;
      s.rollBounces = 0;

      // Posição de lançamento — centralizada (usa s.die, não closure)
      const d = s.die;
      d.position.set(0, LAUNCH_Y, 0);

      // Velocidade vertical inicial
      s.rollVel = rng.n(0.5, 1.5);

      // Sem movimento horizontal — dado fica no centro
      s.rollHorVel = null;

      // Rotação angular
      s.rollAng = {
        x: rng.n(6, 14) * (rng.f() > 0.5 ? 1 : -1),
        y: rng.n(6, 14) * (rng.f() > 0.5 ? 1 : -1),
        z: rng.n(3, 8) * (rng.f() > 0.5 ? 1 : -1),
      };

      // Orientação inicial aleatória
      d.rotation.set(
        rng.f() * Math.PI * 2,
        rng.f() * Math.PI * 2,
        rng.f() * Math.PI * 2,
      );

      s.mode = 'rolling';
    });
  }, []);

  const setIdle = useCallback((idle: boolean) => {
    const s = internals.current;
    if (!s) return;
    if (idle) {
      s.mode = 'idle';
      s.die.position.set(0, REST_Y, 0);
    } else {
      if (s.mode === 'idle') s.mode = 'resting';
    }
  }, []);

  const setColor = useCallback((color: DiceColor) => {
    const s = internals.current;
    if (!s) return;
    // Remove dado antigo
    s.scene.remove(s.die);
    // Dispõe geometria e materiais antigos
    s.die.geometry.dispose();
    if (Array.isArray(s.die.material)) {
      (s.die.material as THREE.MeshStandardMaterial[]).forEach(m => { m.map?.dispose(); m.dispose(); });
    }
    // Cria dado novo com a cor solicitada
    const newDie = makeDie(DICE_COLORS[color], 0.88, s.maxAniso);
    newDie.position.copy(s.die.position);
    newDie.quaternion.copy(s.die.quaternion);
    s.scene.add(newDie);
    s.die = newDie;
    // Re-aplicar highlight se ativo
    if (s.highlightedFace !== null) {
      const fm = FACE_MAP.find(f => f.face === s.highlightedFace);
      if (fm && Array.isArray(newDie.material)) {
        const mat = newDie.material[fm.mat] as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0xaa8822);
        mat.emissiveIntensity = 0.5;
        s.highlightedMatIdx = fm.mat;
      }
    }
  }, []);

  const setBetting = useCallback((betting: boolean, onSelect?: (face: number) => void) => {
    const s = internals.current;
    if (!s) return;
    const canvas = s.renderer.domElement;
    if (betting) {
      s.mode = 'betting';
      s.bettingOnSelect = onSelect || null;
      s.die.position.set(0, REST_Y, 0);
      canvas.style.cursor = 'grab';
      canvas.style.touchAction = 'none';
    } else {
      s.bettingOnSelect = null;
      if (s.mode === 'betting') s.mode = 'resting';
      canvas.style.cursor = 'default';
      canvas.style.touchAction = 'auto';
    }
  }, []);

  const highlightFace = useCallback((face: number | null) => {
    const s = internals.current;
    if (!s || !Array.isArray(s.die.material)) return;
    // Limpar highlight anterior
    if (s.highlightedMatIdx !== null) {
      const prevMat = s.die.material[s.highlightedMatIdx] as THREE.MeshStandardMaterial;
      prevMat.emissive.setHex(0x000000);
      prevMat.emissiveIntensity = 0;
      s.highlightedMatIdx = null;
    }
    s.highlightedFace = face;
    if (face !== null) {
      const fm = FACE_MAP.find(f => f.face === face);
      if (fm) {
        const mat = s.die.material[fm.mat] as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0xaa8822);
        mat.emissiveIntensity = 0.5;
        s.highlightedMatIdx = fm.mat;
      }
    }
  }, []);

  const setMuteImpact = useCallback((mute: boolean) => {
    const s = internals.current;
    if (s) s.muteImpact = mute;
  }, []);

  useImperativeHandle(ref, () => ({ roll, setIdle, setColor, setBetting, highlightFace, setMuteImpact }), [roll, setIdle, setColor, setBetting, highlightFace, setMuteImpact]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{
        aspectRatio,
        maxWidth: 520,
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    />
  );
});

export default DiceScene;
