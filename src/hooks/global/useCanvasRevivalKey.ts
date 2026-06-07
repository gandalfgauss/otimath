'use client'

import { useEffect, useState } from 'react';

/**
 * Retorna uma chave numérica que incrementa quando a página fica VISÍVEL
 * depois de ter ficado oculta por mais que `thresholdMs`.
 *
 * MOTIVAÇÃO — Em mobile (sobretudo Firefox Android), quando o navegador
 * vai para segundo plano por tempo prolongado, o SO pode descartar o
 * contexto WebGL para liberar GPU. Ao trazer o navegador de volta, o
 * canvas dos componentes Three.js (DiceScene, TwoDiceScene,
 * DiceMachineScene) fica em branco — o renderer continua emitindo draw
 * calls mas o contexto está morto, e Three.js não tem recuperação
 * automática. Sem isso, o aluno encontra os frames de animação
 * desaparecidos e fica travado nas telas que dependem do lançamento.
 *
 * USO — passar o retorno como prop `key` no componente do canvas:
 *   const revivalKey = useCanvasRevivalKey();
 *   <DiceScene key={revivalKey} ref={...} />
 *
 * O bump da `key` força React a desmontar e remontar o componente, o
 * que recria renderer + cena + texturas + contexto do zero. Custo é
 * aceitável (< 200ms em devices modernos) e só dispara depois de um
 * ciclo real de background (não em flashes rápidos como notificação ou
 * lockscreen acidental, onde o contexto sobrevive).
 */
export function useCanvasRevivalKey(thresholdMs = 1000): number {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        hiddenAt = null;
        if (elapsed > thresholdMs) setKey(k => k + 1);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [thresholdMs]);

  return key;
}
