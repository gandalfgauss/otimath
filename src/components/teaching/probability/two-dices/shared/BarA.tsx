'use client';

/* ═══════════════════════════════════════════════════════════════
   BarA — renderiza a letra A com macron (barra) customizável.

   Substitui o caractere Unicode Ā (A + U+0305) por uma composição
   CSS que permite controlar a espessura da barra (text-decoration-
   thickness). Usado na seção "Eventos Complementares" onde o
   requisito de UX é uma barra visualmente mais grossa do que o
   macron padrão da fonte.

   Uso:
     <BarA />                          → herda cor
     <BarA color="#FF6A00" />          → laranja queimado
     <BarA color="#FF6A00" bold />     → negrito
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';

interface BarAProps {
  /** Cor da letra E da barra. Default: currentColor */
  color?: string;
  /** Se true, aplica font-weight 700. Default: false (herda) */
  bold?: boolean;
  /** Espessura da barra em pixels. Default: 2.5 */
  thickness?: number;
  /** Tamanho da fonte. Default: herda */
  fontSize?: string | number;
  /** Estilos adicionais */
  style?: React.CSSProperties;
  /** Classe CSS adicional */
  className?: string;
}

export function BarA({
  color,
  bold = false,
  thickness = 2.5,
  fontSize,
  style,
  className,
}: BarAProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        textDecoration: 'overline solid',
        textDecorationThickness: `${thickness}px`,
        textDecorationColor: color ?? 'currentColor',
        textUnderlineOffset: 0,
        color,
        fontWeight: bold ? 700 : undefined,
        fontSize,
        lineHeight: 1,
        paddingTop: 2,
        ...style,
      }}
    >
      A
    </span>
  );
}

/** CSS global para uso em strings HTML (dangerouslySetInnerHTML).
 *  Injetar uma vez via <style>{BAR_A_CSS}</style>. Depois substituir
 *  "Ā" ou "A̅" por '<span class="ova-bar-a">A</span>' nos HTMLs. */
export const BAR_A_CSS = `
  .ova-bar-a {
    display: inline-block;
    text-decoration: overline solid;
    text-decoration-thickness: 2.5px;
    text-decoration-color: currentColor;
    line-height: 1;
    padding-top: 2px;
  }
`;
