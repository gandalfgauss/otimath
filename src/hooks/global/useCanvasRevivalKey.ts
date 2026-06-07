'use client'

import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   useCanvasRevivalKey — Revival de cenas WebGL após context loss

   PROBLEMA — Em mobile (sobretudo Firefox Android), quando o navegador
   vai para segundo plano por tempo prolongado, o SO pode descartar o
   contexto WebGL para liberar GPU. Three.js não tem recuperação
   automática — o canvas fica em branco.

   TRIGGERS — Bumpamos a key (= forçar remontagem) em dois eventos:

     1. `webglcontextlost` — dispara assim que o browser sinaliza perda
        do contexto. Resposta imediata.
     2. `visibilitychange` (hidden→visible) com `elapsed > thresholdMs`
        — fallback INCONDICIONAL. Não dá pra confiar em
        `gl.isContextLost()` em mobile (retorna false mesmo quando o
        canvas está em branco), e o `webglcontextlost` nem sempre
        dispara — então bumpamos por padrão depois de um background
        longo, mesmo que isso force rebuild quando talvez não fosse
        necessário. Preferimos custo extra a tela em branco travando o
        aluno.

   Cada notificação é debounced — se ambos os triggers dispararem no
   mesmo ciclo de revival, só uma remontagem acontece.
   ═══════════════════════════════════════════════════════════════════ */

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface RegisteredContext {
  gl: GLContext;
  canvas: HTMLCanvasElement;
  onLost: (e: Event) => void;
}

const registered = new Set<RegisteredContext>();
const revivalListeners = new Set<() => void>();
const REVIVAL_DEBOUNCE_MS = 500;
let lastRevivalAt = 0;

function notifyRevival() {
  const now = Date.now();
  if (now - lastRevivalAt < REVIVAL_DEBOUNCE_MS) return;
  lastRevivalAt = now;
  revivalListeners.forEach(fn => fn());
}

/**
 * Registra um contexto WebGL pra ser monitorado pelo {@link useCanvasRevivalKey}.
 * Chamar no useEffect que cria o `THREE.WebGLRenderer` (logo após criar o
 * renderer), passando `renderer.getContext()` e `renderer.domElement`. O
 * retorno é a função de unregister — chamar no cleanup do mesmo useEffect.
 *
 * Anexa um listener `webglcontextlost` ao canvas que chama `preventDefault()`
 * (sinaliza ao browser que queremos restoration) e dispara o revival.
 */
export function registerCanvasContext(gl: GLContext, canvas: HTMLCanvasElement): () => void {
  const onLost = (e: Event) => {
    e.preventDefault();
    notifyRevival();
  };
  const entry: RegisteredContext = { gl, canvas, onLost };
  registered.add(entry);
  canvas.addEventListener('webglcontextlost', onLost);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    registered.delete(entry);
  };
}

/**
 * Retorna uma chave numérica que incrementa quando um cenário de revival WebGL
 * é detectado. Use em props `key` de componentes WebGL pra forçar React a
 * remontar e reconstruir contexto + cena + texturas do zero.
 *
 * O `thresholdMs` (default 1000ms) é o tempo mínimo de background antes do
 * fallback de visibility-change bumpar. Backgrounds mais curtos não disparam
 * o fallback — mas o `webglcontextlost` continua ativo (resposta imediata
 * caso o contexto realmente caia).
 */
export function useCanvasRevivalKey(thresholdMs = 1000): number {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const bump = () => setKey(k => k + 1);
    revivalListeners.add(bump);
    return () => { revivalListeners.delete(bump); };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        hiddenAt = null;
        if (elapsed > thresholdMs) notifyRevival();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [thresholdMs]);

  return key;
}
