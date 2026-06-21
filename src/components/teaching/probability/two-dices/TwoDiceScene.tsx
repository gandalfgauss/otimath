'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { playSound } from '@/hooks/global/useSound';
import { registerCanvasContext } from '@/hooks/global/useCanvasRevivalKey';

// Cache do último resultado rolado neste tipo de cena (módulo-level porque só
// existe uma instância ativa de TwoDiceScene no OVA por vez). Permite restaurar
// as faces que o aluno acabou de ver caso a cena seja remontada após
// context-loss WebGL — preserva o resultado pra ele conseguir responder a
// questão sem precisar relançar.
let lastFacesCache: { green: number; blue: number } | null = null;

/* ═══════════════════════════════════════════════════════════════
   TwoDiceScene — Dois dados 3D (verde + azul) com colisão
   Verde = linhas, Azul = colunas. Resultado: par ordenado (verde, azul).
   ═══════════════════════════════════════════════════════════════ */

// ── Constantes ──
const TABLE_Y = -0.52;
const HALF = 0.50;    // meio cubo (tamanho 1.0)
const REST_Y = TABLE_Y + HALF;

// ── xoshiro128** ──
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
    s[2] = (s[2] ^ s[0]) >>> 0; s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0; s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0; s[3] = this._rotl(s[3], 11);
    return result;
  }
  f() { return this._next() / 4294967296; }
  n(a: number, b: number) { return a + this.f() * (b - a); }
  s1() { return (this._next() & 1) ? 1 : -1; }
  die() { return 1 + Math.floor(this.f() * 6); }
}
const rng = new RNG();

// ── Face normals para detectar face no topo ──
const FACE_NORMALS = [
  { n: new THREE.Vector3(1, 0, 0), v: 2 },
  { n: new THREE.Vector3(-1, 0, 0), v: 5 },
  { n: new THREE.Vector3(0, 1, 0), v: 3 },
  { n: new THREE.Vector3(0, -1, 0), v: 4 },
  { n: new THREE.Vector3(0, 0, 1), v: 1 },
  { n: new THREE.Vector3(0, 0, -1), v: 6 },
];
const UP = new THREE.Vector3(0, 1, 0);

function detectTopFace(mesh: THREE.Mesh) {
  let best = -Infinity, value = 1;
  const w = new THREE.Vector3();
  for (const f of FACE_NORMALS) {
    w.copy(f.n).applyQuaternion(mesh.quaternion);
    const d = w.dot(UP);
    if (d > best) { best = d; value = f.v; }
  }
  return value;
}

// ── Snap rotations ──
const SNAP_ROT: Record<number, [number, number, number]> = {
  1: [-Math.PI / 2, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [0, 0, 0],
  4: [Math.PI, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI / 2, 0, 0],
};

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

// ── Textura de face ──
function faceTex(value: number, baseHex: number, pipColor: string, maxAniso: number) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;
  const base = new THREE.Color(baseHex);
  const hi = base.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const lo = base.clone().lerp(new THREE.Color(0x000000), 0.34);
  const grd = ctx.createLinearGradient(S * 0.1, S * 0.05, S * 0.92, S * 0.95);
  grd.addColorStop(0, '#' + hi.getHexString());
  grd.addColorStop(0.46, '#' + base.getHexString());
  grd.addColorStop(1, '#' + lo.getHexString());
  const r = 76;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(S - r, 0); ctx.quadraticCurveTo(S, 0, S, r);
  ctx.lineTo(S, S - r); ctx.quadraticCurveTo(S, S, S - r, S);
  ctx.lineTo(r, S); ctx.quadraticCurveTo(0, S, 0, S - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 7; ctx.stroke();
  const id = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = (rng.f() - 0.5) * 8;
    id.data[i] = Math.min(255, Math.max(0, id.data[i] + v));
    id.data[i + 1] = Math.min(255, Math.max(0, id.data[i + 1] + v));
    id.data[i + 2] = Math.min(255, Math.max(0, id.data[i + 2] + v));
  }
  ctx.putImageData(id, 0, 0);
  const map: Record<number, number[][]> = {
    1: [[0.5, 0.5]], 2: [[0.29, 0.29], [0.71, 0.71]],
    3: [[0.29, 0.29], [0.5, 0.5], [0.71, 0.71]],
    4: [[0.29, 0.29], [0.71, 0.29], [0.29, 0.71], [0.71, 0.71]],
    5: [[0.29, 0.29], [0.71, 0.29], [0.5, 0.5], [0.29, 0.71], [0.71, 0.71]],
    6: [[0.28, 0.21], [0.72, 0.21], [0.28, 0.5], [0.72, 0.5], [0.28, 0.79], [0.72, 0.79]],
  };
  const R = 44;
  for (const [px, py] of map[value]) {
    const cx = px * S, cy = py * S;
    const dg = ctx.createRadialGradient(cx + 3, cy + 4, 0, cx, cy, R * 1.18);
    dg.addColorStop(0, 'rgba(0,0,0,.42)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 2.5;
    ctx.fillStyle = pipColor; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    const pg = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, 1, cx, cy, R);
    pg.addColorStop(0, 'rgba(255,255,255,.55)'); pg.addColorStop(0.35, 'rgba(255,255,255,.13)'); pg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDie(baseHex: number, roughness: number, maxAniso: number) {
  const geo = roundedBox(1.0, 0.13, 5);
  const mats = [2, 5, 3, 4, 1, 6].map(v =>
    new THREE.MeshStandardMaterial({ map: faceTex(v, baseHex, '#ffffff', maxAniso), roughness, metalness: 0.06 })
  );
  const m = new THREE.Mesh(geo, mats);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ── Textura de madeira ──
function makeWood(maxAniso: number) {
  const S = 1024;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;
  const bg = ctx.createRadialGradient(S * 0.5, S * 0.42, 30, S * 0.5, S * 0.5, S * 0.72);
  bg.addColorStop(0, '#c8844a'); bg.addColorStop(0.35, '#b5722f'); bg.addColorStop(0.72, '#9a5e22'); bg.addColorStop(1, '#7a4518');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 180; i++) {
    const y0 = rng.f() * S; const alpha = rng.n(0.04, 0.22); const dark = rng.f() > 0.55;
    ctx.strokeStyle = dark ? `rgba(60,28,8,${alpha})` : `rgba(220,160,80,${alpha * 0.7})`;
    ctx.lineWidth = rng.n(0.4, 2.8); ctx.beginPath(); ctx.moveTo(0, y0);
    ctx.bezierCurveTo(S * 0.28 + rng.n(-60, 60), y0 + rng.n(-18, 18), S * 0.72 + rng.n(-60, 60), y0 + rng.n(-18, 18), S, y0 + rng.n(-12, 12));
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const y0 = rng.f() * S;
    ctx.strokeStyle = `rgba(80,38,10,${rng.n(0.06, 0.18)})`; ctx.lineWidth = rng.n(1.2, 4.5);
    ctx.beginPath(); ctx.moveTo(0, y0);
    ctx.bezierCurveTo(S * 0.3 + rng.n(-80, 80), y0 + rng.n(-30, 30), S * 0.65 + rng.n(-80, 80), y0 + rng.n(-30, 30), S, y0 + rng.n(-20, 20));
    ctx.stroke();
  }
  const knotCount = Math.floor(rng.n(3, 6));
  for (let k = 0; k < knotCount; k++) {
    const kx = rng.n(S * 0.12, S * 0.88), ky = rng.n(S * 0.12, S * 0.88);
    const rx = rng.n(22, 55), ry = rng.n(14, 34);
    const rings = Math.floor(rng.n(3, 7));
    for (let r = rings; r >= 1; r--) {
      const f = r / rings;
      ctx.beginPath(); ctx.ellipse(kx, ky, rx * f, ry * f, rng.n(-0.3, 0.3), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(55,22,6,${0.12 + f * 0.18})`; ctx.lineWidth = rng.n(0.8, 2.2); ctx.stroke();
    }
    const cg = ctx.createRadialGradient(kx, ky, 0, kx, ky, rx * 0.55);
    cg.addColorStop(0, 'rgba(45,18,4,.55)'); cg.addColorStop(1, 'rgba(45,18,4,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(kx, ky, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  }
  const id = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (rng.f() - 0.5) * 18;
    id.data[i] = Math.min(255, Math.max(0, id.data[i] + n));
    id.data[i + 1] = Math.min(255, Math.max(0, id.data[i + 1] + n * 0.75));
    id.data[i + 2] = Math.min(255, Math.max(0, id.data[i + 2] + n * 0.35));
  }
  ctx.putImageData(id, 0, 0);
  const vg = ctx.createRadialGradient(S * 0.5, S * 0.38, 20, S * 0.5, S * 0.5, S * 0.52);
  vg.addColorStop(0, 'rgba(255,210,130,.18)'); vg.addColorStop(0.45, 'rgba(255,190,100,.06)'); vg.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2.2, 1.6);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeBackground() {
  const W = 1024, H = 640; const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(W * 0.5, H * 0.34, 40, W * 0.5, H * 0.52, W * 0.78);
  g.addColorStop(0, '#5a3318'); g.addColorStop(0.28, '#3d2210'); g.addColorStop(0.62, '#24150a'); g.addColorStop(1, '#110a04');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const gl = ctx.createRadialGradient(W * 0.5, H * 0.58, 10, W * 0.5, H * 0.58, 280);
  gl.addColorStop(0, 'rgba(220,140,60,.18)'); gl.addColorStop(0.5, 'rgba(200,110,40,.07)'); gl.addColorStop(1, 'rgba(200,110,40,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
  return new THREE.CanvasTexture(cv);
}

// ── Cores ──
const DICE_GREEN = 0x0d3d1a;
const DICE_BLUE = 0x0a1f6e;

// ── Estado de cada dado ──
interface DieState {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  xBase: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  avx: number; avy: number; avz: number;
  value: number;
  rolling: boolean;
  bounces: number;
  align: number;
  scaleT: number;
}

// ── Interface pública ──
export interface TwoDiceSceneHandle {
  roll: () => Promise<{ green: number; blue: number }>;
  setWhiteMode: (enabled: boolean) => void;
  setRandomSides: (enabled: boolean) => void;
  /** Posiciona os dois dados em repouso mostrando as faces indicadas
   *  sem animação. Usado pra restaurar resultado visual após F5 — o
   *  `lastFacesCache` (variável módulo) é zerado pelo refresh. */
  setFaces: (green: number, blue: number) => void;
}

const TwoDiceScene = forwardRef<TwoDiceSceneHandle, { aspectRatio?: string }>(function TwoDiceScene(
  { aspectRatio = '16 / 10' }, ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internals = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dice: DieState[];
    animId: number;
    globalRolling: boolean;
    rollResolve: ((result: { green: number; blue: number }) => void) | null;
    maxAniso: number;
    whiteMode: boolean;
    randomSides: boolean;
    rebuildMaterials: (mesh: THREE.Mesh, baseHex: number, pipColor: string, roughness: number) => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // `alpha: false` + `powerPreference: 'high-performance'` melhora compositing
    // no Safari iOS — fundo é opaco, alpha desnecessária. Mesmo padrão do
    // DiceMachineScene, sem o qual há jank na rolagem dos dois dados em iPhone.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setClearColor(0x110d09, 1);
    container.appendChild(renderer.domElement);
    const unregisterContext = registerCanvasContext(renderer.getContext(), renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Cena
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x16110d, 15, 34);
    scene.background = makeBackground();

    // Câmera
    const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.05, 80);
    camera.position.set(0, 2.95, 4.05);
    camera.lookAt(0, 0.15, 0);

    // Luzes
    scene.add(new THREE.AmbientLight(0xfff7ed, 0.5));
    const key = new THREE.SpotLight(0xfffcf2, 7.8, 18, Math.PI / 3.2, 0.38, 1.1);
    key.position.set(0, 6.2, 4.2); key.target.position.set(0, 0, 0);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
    key.shadow.bias = -0.00035; key.shadow.normalBias = 0.01;
    scene.add(key, key.target);
    const fill = new THREE.PointLight(0xbfd7ff, 0.8, 12); fill.position.set(-3, 2.5, 2.5); scene.add(fill);
    const rim = new THREE.PointLight(0xffddb2, 2.1, 12); rim.position.set(1.3, 3.1, -3.1); scene.add(rim);
    const island = new THREE.PointLight(0xffd090, 0.15, 5.8); island.position.set(0, 1.65, 0.8); scene.add(island);

    // Mesa
    const woodTex = makeWood(maxAniso);
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 15),
      new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8b5a2b, roughness: 0.58, metalness: 0.04 })
    );
    table.rotation.x = -Math.PI / 2; table.position.y = TABLE_Y; table.receiveShadow = true;
    scene.add(table);
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(11.8, 0.54, 10, 84),
      new THREE.MeshStandardMaterial({ color: 0x3d1f08, roughness: 0.42, metalness: 0.08 })
    );
    rimMesh.rotation.x = -Math.PI / 2; rimMesh.position.y = TABLE_Y; scene.add(rimMesh);

    // Dois dados
    const dieGreen = makeDie(DICE_GREEN, 0.92, maxAniso);
    const dieBlue = makeDie(DICE_BLUE, 0.88, maxAniso);
    dieGreen.position.set(-0.58, REST_Y, 0);
    dieBlue.position.set(0.58, REST_Y, 0);
    scene.add(dieGreen, dieBlue);

    // Sombras de contato
    function makeContactShadow(x: number) {
      const curve = new THREE.EllipseCurve(0, 0, 0.56, 0.28);
      const shape = new THREE.Shape(curve.getPoints(48));
      const m = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2; m.position.set(x, TABLE_Y + 0.007, 0.06);
      return m;
    }
    const shadowGreen = makeContactShadow(-0.58);
    const shadowBlue = makeContactShadow(0.58);
    scene.add(shadowGreen, shadowBlue);

    // Estado dos dados
    function makeDieState(mesh: THREE.Mesh, xBase: number, shadow: THREE.Mesh): DieState {
      return {
        mesh, shadow, xBase,
        x: xBase, y: REST_Y, z: 0,
        vx: 0, vy: 0, vz: 0, avx: 0, avy: 0, avz: 0,
        value: 1, rolling: false, bounces: 0, align: 0, scaleT: 1,
      };
    }
    const dice: DieState[] = [
      makeDieState(dieGreen, -0.58, shadowGreen),
      makeDieState(dieBlue, 0.58, shadowBlue),
    ];

    // Helper para trocar materiais dos dados em runtime (usado pelo whiteMode)
    // Libera corretamente texturas e materiais antigos para evitar leak de GPU.
    const rebuildMaterials = (mesh: THREE.Mesh, baseHex: number, pipColor: string, roughness: number) => {
      const oldMats = mesh.material as THREE.MeshStandardMaterial[];
      const newMats = [2, 5, 3, 4, 1, 6].map(v =>
        new THREE.MeshStandardMaterial({ map: faceTex(v, baseHex, pipColor, maxAniso), roughness, metalness: 0.06 })
      );
      mesh.material = newMats;
      oldMats.forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    };

    const state = {
      renderer, scene, camera, dice, animId: 0,
      globalRolling: false,
      rollResolve: null as ((result: { green: number; blue: number }) => void) | null,
      maxAniso,
      whiteMode: false,
      randomSides: false,
      rebuildMaterials,
    };
    internals.current = state;

    // Helper compartilhado entre o reviver de WebGL context-loss
    // (`lastFacesCache`) e o método público `setFaces` (chamado pelo
    // pai pra restaurar visualmente após F5).
    const applyResultFaces = (green: number, blue: number) => {
      const setOne = (d: DieState, value: number) => {
        const [tx, ty, tz] = SNAP_ROT[value];
        d.value = value;
        d.mesh.rotation.set(tx, ty, tz);
        d.mesh.position.set(d.xBase, REST_Y, 0);
        d.x = d.xBase; d.y = REST_Y; d.z = 0;
      };
      setOne(state.dice[0], green);
      setOne(state.dice[1], blue);
    };

    if (lastFacesCache !== null) {
      applyResultFaces(lastFacesCache.green, lastFacesCache.blue);
    }
    (state as unknown as { _applyResultFaces: (g: number, b: number) => void })._applyResultFaces = applyResultFaces;

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

    // Física
    const GRAVITY = 0.0215;
    const MIN_DIST = 1.03;

    function updatePhysics() {
      const s = internals.current;
      if (!s) return;

      s.dice.forEach(d => {
        if (!d.rolling) {
          if (d.align > 0) {
            d.align--;
            const [tx, ty, tz] = SNAP_ROT[d.value];
            const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, ty, tz, 'XYZ'));
            d.mesh.quaternion.slerp(targetQ, 0.24);
            d.mesh.position.set(d.x, REST_Y, d.z);
            if (d.align === 0) {
              d.mesh.rotation.set(tx, ty, tz);
              d.mesh.position.set(d.x, REST_Y, d.z);
              d.value = detectTopFace(d.mesh);
            }
          }
          return;
        }

        d.vy -= GRAVITY;
        d.x += d.vx; d.y += d.vy; d.z += d.vz;
        d.vx *= 0.89; d.vz *= 0.89;
        d.avx *= 0.968; d.avy *= 0.968; d.avz *= 0.968;

        if (d.y <= REST_Y) {
          d.y = REST_Y;
          d.bounces++;
          const rest = d.bounces === 1 ? 0.24 : 0.12;
          d.vy = Math.abs(d.vy) * rest;
          d.vx *= 0.78; d.vz *= 0.78;
          d.avx *= 0.72; d.avy *= 0.72; d.avz *= 0.72;
          playSound('/sounds/click.mp3');

          const angSpeed = Math.abs(d.avx) + Math.abs(d.avy) + Math.abs(d.avz);
          const linSpeed = Math.abs(d.vx) + Math.abs(d.vz) + Math.abs(d.vy);
          if (d.bounces >= 3 && angSpeed < 0.06 && linSpeed < 0.032) {
            d.vx = d.vy = d.vz = 0; d.avx = d.avy = d.avz = 0;
            d.rolling = false;
            d.value = detectTopFace(d.mesh);
            d.align = 10;
          }
        }

        // Rotação por quaternion
        if (d.avx !== 0 || d.avy !== 0 || d.avz !== 0) {
          const qDelta = new THREE.Quaternion().setFromEuler(new THREE.Euler(d.avx, d.avy, d.avz, 'XYZ'));
          d.mesh.quaternion.multiply(qDelta).normalize();
        }
        d.mesh.position.set(d.x, d.y, d.z);

        // Scale (crescimento pós-copo)
        if (d.scaleT < 1) {
          d.scaleT = Math.min(d.scaleT + 0.042, 1);
          const sc = 0.29 + 0.71 * (1 - (1 - d.scaleT) * (1 - d.scaleT));
          d.mesh.scale.setScalar(sc);
        } else {
          d.mesh.scale.setScalar(1);
        }

        // Sombra
        const h = Math.max(0, d.y - REST_Y);
        (d.shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.32 - h * 0.18);
        d.shadow.scale.setScalar(Math.min(1.18, 1 + h * 0.18));
        d.shadow.position.set(d.x, TABLE_Y + 0.007, d.z * 0.22 + 0.06);
      });

      // Colisão entre dados
      if (s.dice[0].rolling || s.dice[1].rolling) {
        const a = s.dice[0], b = s.dice[1];
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < MIN_DIST && dist > 0.0001) {
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          const pen = (MIN_DIST - dist) * 0.5;
          a.x += nx * pen; a.y += ny * pen; a.z += nz * pen;
          b.x -= nx * pen; b.y -= ny * pen; b.z -= nz * pen;
          const rvx = a.vx - b.vx, rvy = a.vy - b.vy, rvz = a.vz - b.vz;
          const rel = rvx * nx + rvy * ny + rvz * nz;
          if (rel < 0) {
            const e = 0.52;
            a.vx -= (1 + e) * rel * 0.5 * nx; a.vy -= (1 + e) * rel * 0.5 * ny; a.vz -= (1 + e) * rel * 0.5 * nz;
            b.vx += (1 + e) * rel * 0.5 * nx; b.vy += (1 + e) * rel * 0.5 * ny; b.vz += (1 + e) * rel * 0.5 * nz;
            const kick = 0.14;
            a.avx += rng.n(-kick, kick); a.avy += rng.n(-kick * 0.6, kick * 0.6); a.avz += rng.n(-kick, kick);
            b.avx += rng.n(-kick, kick); b.avy += rng.n(-kick * 0.6, kick * 0.6); b.avz += rng.n(-kick, kick);
          }
        }
      }

      // Finalização
      if (s.globalRolling && s.dice.every(d => !d.rolling && d.align === 0)) {
        s.globalRolling = false;
        setTimeout(() => {
          if (s.rollResolve) {
            const result = { green: s.dice[0].value, blue: s.dice[1].value };
            lastFacesCache = result; // pra restaurar após revival WebGL
            s.rollResolve(result);
            s.rollResolve = null;
          }
        }, 400);
      }
    }

    // Câmera suave
    const camIdle = { x: 0, y: 2.95, z: 4.05 };
    const camCurrent = { ...camIdle };

    function animateCamera() {
      const s = internals.current;
      if (!s) return;
      const k = 0.05;
      camCurrent.x += (camIdle.x - camCurrent.x) * k;
      camCurrent.y += (camIdle.y - camCurrent.y) * k;
      camCurrent.z += (camIdle.z - camCurrent.z) * k;
      camera.position.set(camCurrent.x, camCurrent.y, camCurrent.z);
      const cx = (s.dice[0].mesh.position.x + s.dice[1].mesh.position.x) * 0.5;
      const cz = (s.dice[0].mesh.position.z + s.dice[1].mesh.position.z) * 0.25;
      camera.lookAt(cx, 0.12, cz);
    }

    // Loop de animação
    const clock = new THREE.Clock();
    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      // Otimização: pula render se canvas oculto (display:none em ancestral) —
      // evita gastar CPU/GPU no Ex7 quando alterna entre TwoDiceScene e a máquina.
      if (renderer.domElement.offsetParent === null) return;
      clock.getDelta(); // consume delta
      updatePhysics();
      animateCamera();
      renderer.render(scene, camera);
    };
    clock.start();
    animate();

    return () => {
      cancelAnimationFrame(state.animId);
      ro.disconnect();
      unregisterContext();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── API pública ──
  const roll = useCallback((): Promise<{ green: number; blue: number }> => {
    return new Promise((resolve) => {
      const s = internals.current;
      if (!s) { resolve({ green: 1, blue: 1 }); return; }
      if (s.globalRolling) { resolve({ green: 1, blue: 1 }); return; }

      s.rollResolve = resolve;
      s.globalRolling = true;

      playSound('/sounds/nextChallenge.mp3');

      // randomSides: a cada lançamento, 50% de chance de trocar os lados iniciais.
      // Isso elimina a âncora espacial "esquerda/direita" sem afetar o mapeamento
      // interno dice[0]=green, dice[1]=blue (os VALORES continuam corretos).
      const swapSides = s.randomSides && rng.f() < 0.5;

      s.dice.forEach((d, i) => {
        d.value = 1; d.rolling = true; d.align = 0; d.bounces = 0;
        d.scaleT = 0;
        // Índice efetivo para posicionamento inicial (swap quando randomSides)
        const ei = swapSides ? 1 - i : i;
        const effXBase = ei === 0 ? -0.58 : 0.58;
        // Posição inicial próxima ao centro
        d.x = effXBase * 0.72 + rng.n(-0.05, 0.05);
        d.y = REST_Y + 2.0;
        d.z = rng.n(-0.10, 0.10);
        // Velocidade horizontal: dados se afastam
        const collideDir = ei === 0 ? 1 : -1;
        d.vx = collideDir * rng.n(0.022, 0.038) + rng.n(-0.006, 0.006);
        d.vz = rng.n(-0.016, 0.016);
        d.vy = -0.055;
        // Rotação angular
        d.avx = rng.s1() * rng.n(0.32, 0.52);
        d.avy = rng.s1() * rng.n(0.26, 0.44);
        d.avz = rng.s1() * rng.n(0.20, 0.38);
        // Orientação inicial aleatória
        d.mesh.quaternion.setFromEuler(new THREE.Euler(
          rng.f() * Math.PI * 2, rng.f() * Math.PI * 2, rng.f() * Math.PI * 2
        ));
        d.mesh.scale.setScalar(0.29);
      });
    });
  }, []);

  // Troca materiais em runtime: branco+vermelho quando true, verde/azul quando false.
  // Chamável a qualquer momento; se já estiver no modo pedido, no-op.
  const setWhiteMode = useCallback((enabled: boolean) => {
    const s = internals.current;
    if (!s || s.whiteMode === enabled) return;
    s.whiteMode = enabled;
    if (enabled) {
      s.rebuildMaterials(s.dice[0].mesh, 0xf5f5f0, '#c0392b', 0.85);
      s.rebuildMaterials(s.dice[1].mesh, 0xf5f5f0, '#c0392b', 0.85);
    } else {
      s.rebuildMaterials(s.dice[0].mesh, DICE_GREEN, '#ffffff', 0.92);
      s.rebuildMaterials(s.dice[1].mesh, DICE_BLUE, '#ffffff', 0.88);
    }
  }, []);

  const setRandomSides = useCallback((enabled: boolean) => {
    const s = internals.current;
    if (s) s.randomSides = enabled;
  }, []);

  const setFaces = useCallback((green: number, blue: number) => {
    const s = internals.current;
    if (!s) return;
    if (green < 1 || green > 6 || blue < 1 || blue > 6) return;
    const fn = (s as unknown as { _applyResultFaces?: (g: number, b: number) => void })._applyResultFaces;
    fn?.(green, blue);
    lastFacesCache = { green, blue };
  }, []);

  useImperativeHandle(ref, () => ({ roll, setWhiteMode, setRandomSides, setFaces }), [roll, setWhiteMode, setRandomSides, setFaces]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Cena 3D interativa com dois dados (verde e azul) sobre uma mesa de madeira."
      className="w-full rounded-lg overflow-hidden"
      style={{ aspectRatio, maxWidth: 620, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
    />
  );
});

export default TwoDiceScene;
