'use client'

import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   useCanvasRevivalKey — Revival de cenas WebGL após context loss

   PROBLEMA — Em mobile (sobretudo Firefox Android), quando o navegador
   vai para segundo plano por tempo prolongado, o SO pode descartar o
   contexto WebGL para liberar GPU. Three.js não tem recuperação
   automática — o canvas fica em branco.

   ABORDAGEM — Detectar context loss e forçar React a remontar APENAS
   as cenas afetadas, via `key` prop. A detecção é dupla:

     1. Direta — listener `webglcontextlost` em cada canvas registrado
        (dispara o evento assim que o contexto cai).
     2. Indireta — na transição hidden→visible da página, consultar
        `gl.isContextLost()` em cada contexto (safety net pra navegadores
        que não disparam o evento de forma confiável).

   Sem esse 1º passo a chave bumpava em TODO retorno do background, mesmo
   quando o contexto sobrevivia — o que custava ~200ms desnecessários de
   tear-down + rebuild de Three.js a cada app switch curto.
   ═══════════════════════════════════════════════════════════════════ */

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface RegisteredContext {
  gl: GLContext;
  canvas: HTMLCanvasElement;
  onLost: (e: Event) => void;
}

const registered = new Set<RegisteredContext>();
const revivalListeners = new Set<() => void>();

function notifyRevival() {
  revivalListeners.forEach(fn => fn());
}

/**
 * Registra um contexto WebGL pra ser monitorado pelo {@link useCanvasRevivalKey}.
 * Chamar no useEffect que cria o `THREE.WebGLRenderer` (logo após criar o
 * renderer), passando `renderer.getContext()` e `renderer.domElement`. O
 * retorno é a função de unregister — chamar no cleanup do mesmo useEffect.
 *
 * Anexa internamente um listener `webglcontextlost` ao canvas que chama
 * `preventDefault()` (sinaliza ao browser que queremos restoration) e
 * dispara o revival imediato.
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
 * Retorna uma chave numérica que incrementa quando um contexto WebGL
 * registrado é perdido. Aplica em props `key` de componentes WebGL pra
 * forçar React a remontar e reconstruir o contexto/cena/texturas.
 *
 * Aceita um threshold opcional (default 1000ms) — só verifica perda
 * após a página ficar oculta por mais que esse tempo. Backgrounds
 * curtíssimos quase nunca causam perda real, então pulamos a checagem.
 */
export function useCanvasRevivalKey(thresholdMs = 1000): number {
  const [key, setKey] = useState(0);

  // Inscrição no canal de revival (disparado por webglcontextlost direto OU
  // pelo safety-net abaixo).
  useEffect(() => {
    const bump = () => setKey(k => k + 1);
    revivalListeners.add(bump);
    return () => { revivalListeners.delete(bump); };
  }, []);

  // Safety-net: na transição hidden→visible, verifica se algum contexto caiu
  // sem ter disparado o evento. Necessário porque alguns navegadores móveis
  // são preguiçosos com o evento `webglcontextlost`.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        hiddenAt = null;
        if (elapsed <= thresholdMs) return;
        for (const entry of registered) {
          if (entry.gl.isContextLost()) {
            notifyRevival();
            return;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [thresholdMs]);

  return key;
}
