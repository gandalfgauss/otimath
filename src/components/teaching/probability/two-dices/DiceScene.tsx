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
const REST_Y   = TABLE_Y + 0.5;   // centro do dado apoiado
const LAUNCH_Y = 2.4;
const GRAVITY  = -18;
const BOUNCE_C = 0.25;
const FRICTION = 0.6;

// ── xoshiro256** simplificado para física visual ──
class RNG {
  s: number[];
  constructor() {
    this.s = [Date.now(), Date.now() ^ 0xdeadbeef, Date.now() ^ 0xcafebabe, Date.now() ^ 0x12345678];
  }
  f() {
    const s = this.s;
    const r = (s[1] * 5 >>> 0);
    const t = s[1] << 9;
    s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3];
    s[2] ^= t; s[3] = (s[3] << 11) | (s[3] >>> 21);
    return (r >>> 0) / 4294967296;
  }
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
    1: new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0.12, 0)),
    2: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, PI / 2)),
    3: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, 0)),
    4: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI, 0.12, 0)),
    5: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.12, -PI / 2)),
    6: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, 0.12, 0)),
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
  const geo = roundedBox(1.0, 0.13, 5);
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

// ═══════ Interface pública ═══════
export interface DiceSceneHandle {
  roll: (targetFace: number) => Promise<void>;
  setIdle: (idle: boolean) => void;
}

const DiceScene = forwardRef<DiceSceneHandle, { aspectRatio?: string }>(function DiceScene(
  { aspectRatio = '16 / 10' },
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
    mode: 'idle' | 'rolling' | 'settle' | 'resting';
    rollVel: number;
    rollAng: { x: number; y: number; z: number };
    rollBounces: number;
    rollTarget: number;
    rollResolve: (() => void) | null;
    settleStart: THREE.Quaternion | null;
    settleTarget: THREE.Quaternion | null;
    settleElapsed: number;
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

    // Dado azul-marinho (um só, centralizado)
    const die = makeDie(0x0a1f6e, 0.88, maxAniso);
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
      renderer, scene, camera, die, contactShadow, snapRot, clock,
      animId: 0,
      mode: 'idle' as const,
      rollVel: 0,
      rollAng: { x: 0, y: 0, z: 0 },
      rollBounces: 0,
      rollTarget: 1,
      rollResolve: null as (() => void) | null,
      settleStart: null as THREE.Quaternion | null,
      settleTarget: null as THREE.Quaternion | null,
      settleElapsed: 0,
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

      if (s.mode === 'idle') {
        die.rotation.x += 0.008;
        die.rotation.y += 0.012;
        die.rotation.z += 0.005;
        die.position.y = REST_Y;
        contactShadow.visible = true;
        contactShadow.material.opacity = 0.32;
      } else if (s.mode === 'rolling') {
        s.rollVel += GRAVITY * dt;
        die.position.y += s.rollVel * dt;

        die.rotation.x += s.rollAng.x * dt;
        die.rotation.y += s.rollAng.y * dt;
        die.rotation.z += s.rollAng.z * dt;

        // Sombra acompanha altura
        const h = Math.max(0, die.position.y - REST_Y);
        contactShadow.material.opacity = Math.max(0.05, 0.32 - h * 0.12);
        contactShadow.scale.setScalar(1 + h * 0.15);

        if (die.position.y <= REST_Y) {
          die.position.y = REST_Y;
          s.rollBounces++;
          playSound('/sounds/click.mp3');

          if (s.rollBounces >= 2) {
            s.settleStart = die.quaternion.clone();
            s.settleTarget = s.snapRot[s.rollTarget].clone();
            s.settleElapsed = 0;
            s.mode = 'settle';
          } else {
            s.rollVel = Math.abs(s.rollVel) * BOUNCE_C;
            s.rollAng.x *= FRICTION;
            s.rollAng.y *= FRICTION;
            s.rollAng.z *= FRICTION;
          }
        }
      } else if (s.mode === 'settle') {
        s.settleElapsed += dt;
        const t = Math.min(s.settleElapsed / 0.3, 1);
        const ease = 1 - (1 - t) * (1 - t);

        if (s.settleStart && s.settleTarget) {
          const q = s.settleStart.clone();
          q.slerp(s.settleTarget, ease);
          die.quaternion.copy(q);
        }
        die.position.y = REST_Y;
        contactShadow.material.opacity = 0.32;
        contactShadow.scale.setScalar(1);

        if (t >= 1) {
          if (s.settleTarget) die.quaternion.copy(s.settleTarget);
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

    return () => {
      cancelAnimationFrame(state.animId);
      ro.disconnect();
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

      s.die.position.y = LAUNCH_Y;
      s.rollVel = 0.5;
      s.rollAng = {
        x: (rng.n(6, 14)) * (rng.f() > 0.5 ? 1 : -1),
        y: (rng.n(6, 14)) * (rng.f() > 0.5 ? 1 : -1),
        z: (rng.n(3, 8)) * (rng.f() > 0.5 ? 1 : -1),
      };
      s.die.rotation.set(
        rng.f() * Math.PI * 2,
        rng.f() * Math.PI * 2,
        rng.f() * Math.PI * 2,
      );

      playSound('/sounds/nextChallenge.mp3');
      s.mode = 'rolling';
    });
  }, []);

  const setIdle = useCallback((idle: boolean) => {
    const s = internals.current;
    if (!s) return;
    if (idle) {
      s.mode = 'idle';
      s.die.position.y = REST_Y;
    } else {
      if (s.mode === 'idle') s.mode = 'resting';
    }
  }, []);

  useImperativeHandle(ref, () => ({ roll, setIdle }), [roll, setIdle]);

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
