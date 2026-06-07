'use client';

/* ═══════════════════════════════════════════════════════════════
   VennNumericPanel — diagrama de Venn numérico para exercícios.

   Geometria local (LIGEIRAMENTE diferente do VennLaboratory) pra
   acomodar inputs maiores e o círculo C complementar:
     • Círculos A/B em (380, 310) e (580, 310), raio 200
     • Círculo C em (855, 510), raio 90 (canto inferior direito)
     • viewBox 960 × 640
     • Cores oficiais (EVENT_COLORS) para A, B, A∩B

   Diferença em relação ao VennLaboratory:
     • VennLaboratory = construção topológica em 15 sub-etapas com
       marcação de regiões, escuta de cliques, etc.
     • VennNumericPanel = exibição/edição de 4 cardinalidades numéricas
       (x, A−B, B−A, outros) com valores fixos vindos do enunciado.

   Pedagogicamente: o aluno vê uma versão simplificada do diagrama
   da teoria — coerência instrumental (TROUCHE, 2004).
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { EVENT_COLORS } from './eventPair';
import {
  VIEWBOX_WIDTH, VIEWBOX_HEIGHT,
} from '../venn/geometry';

interface VennNumericPanelProps {
  /** Total do espaço amostral (n(Ω) ou n(S)) — exibido no canto superior */
  totalLabel: string;
  /** Valor exibido/editável para A ∩ B (interseção central) */
  xValue: string;
  setXValue?: (v: string) => void;
  xError?: boolean;
  /** Valor para A − B (lunete esquerda) */
  amBValue: string;
  setAmBValue?: (v: string) => void;
  amBError?: boolean;
  /** Valor para B − A (lunete direita) */
  bmAValue: string;
  setBmAValue?: (v: string) => void;
  bmAError?: boolean;
  /** Valor para "fora de A ∪ B" */
  wValue: string;
  setWValue?: (v: string) => void;
  wError?: boolean;
  /** Mostra o campo de "fora" apenas se o problema tiver pessoas fora de A∪B */
  showW: boolean;
  /** Se true, nenhum input é editável (fase de cálculo final) */
  locked?: boolean;
}

function VennInput({
  value, setValue, error, locked, ariaLabel, width = 150,
}: {
  value: string;
  setValue?: (v: string) => void;
  error?: boolean;
  locked?: boolean;
  ariaLabel: string;
  width?: number;
}) {
  const readOnly = locked || !setValue;
  const border = error
    ? 'var(--color-feedback-error-dark)'
    : readOnly
      ? 'var(--color-neutral-medium)'
      : 'var(--color-neutral-lighter)';
  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      value={value}
      onChange={readOnly ? undefined : (e => setValue?.(e.target.value))}
      aria-label={ariaLabel}
      aria-invalid={!!error}
      readOnly={readOnly}
      style={{
        border: `2px solid ${border}`,
        borderRadius: 6,
        padding: '14px 16px',
        width,
        textAlign: 'center',
        outline: 'none',
        fontWeight: 700,
        fontSize: '1.75rem',
        background: readOnly ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
        color: readOnly ? 'var(--color-neutral-dark)' : undefined,
        cursor: readOnly ? 'not-allowed' : undefined,
      }}
      placeholder="?"
    />
  );
}

export function VennNumericPanel({
  totalLabel,
  xValue, setXValue, xError,
  amBValue, setAmBValue, amBError,
  bmAValue, setBmAValue, bmAError,
  wValue, setWValue, wError,
  showW,
  locked,
}: VennNumericPanelProps) {
  // Geometria LOCAL (em vez do `defaultGeometry2Intersected()` compartilhado
  // com o VennLaboratory) — círculos um pouco maiores que a geometria
  // canônica (r=180→200), centros mais próximos das bordas pra liberar
  // espaço pro C no canto inferior-direito sem encostar nas bordas. Mantém
  // o viewBox em 960×640.
  const A = { cx: 380, cy: 310, r: 200 };
  const B = { cx: 580, cy: 310, r: 200 };
  const COLOR_A = EVENT_COLORS['A'];
  const COLOR_B = EVENT_COLORS['B'];

  // Posições dos inputs — calculadas a partir da geometria canônica
  // (cx=390/570, cy=320, r=180). Lunetes laterais e interseção têm largura
  // horizontal ≈ 180 px cada; espaço máximo disponível pros retângulos.
  const amBX = ((A.cx - A.r) + (B.cx - B.r)) / 2;
  const bmAX = ((A.cx + A.r) + (B.cx + B.r)) / 2;
  const xCx = (A.cx + B.cx) / 2;
  const inputY = A.cy - 39;

  // Rótulos A e B posicionados PERTO do topo dos círculos. Antes era
  // y=54 (calibrado pra viewBox 800×400 antigo) — quando bumpamos pro
  // 960×640, os círculos passaram a começar em y=140 mas os rótulos
  // ficaram em y=54, longe demais. Agora rente ao topo.
  const labelY = A.cy - A.r + 36;

  // Caixas de digitação ajustadas pra encaixar na largura da lunete (200).
  // Anterior era 180×116; agora 200×130.
  const inputBoxW = 200, inputBoxH = 130;

  // Círculo C subido (era cy=555 → 510) e ampliado (r=78 → 90). Antes
  // C encostava na borda inferior (555+78=633, viewBox 640 → margin 7);
  // agora bottom em 510+90=600, margem inferior de 40 unidades.
  // Garante NÃO sobrepor B (cx=580, cy=310, r=200):
  //   distância(C, B) = √((855-580)² + (510-310)²) = √(75625+40000) ≈ 340
  //   soma raios = 200 + 90 = 290
  //   distância > soma → não colidem ✅
  const C_CX = 855, C_CY = 510, C_R = 90;
  const C_LABEL_Y = C_CY - C_R - 14;
  // Placeholder ampliado: 120×72 → 140×84. Diagonal-meia = √(70² + 42²) ≈ 82 < 90 ✅
  const wBoxW = 140, wBoxH = 84;

  return (
    <div className="w-full flex justify-center" style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width="100%"
        style={{ maxWidth: 720 }}
        role="img"
        aria-label="Diagrama de Venn com cardinalidades"
      >
        {/* Retângulo Ω */}
        <rect
          x={8} y={8}
          width={VIEWBOX_WIDTH - 16}
          height={VIEWBOX_HEIGHT - 16}
          fill="var(--color-brand-otimath-lightest)"
          stroke="var(--color-neutral-dark)"
          strokeWidth={2}
        />
        {/* Rótulo "S = N" no canto superior direito. fontSize bumpado de
            16 → 30 pra ficar legível no mobile (em viewBox 960 renderizado
            ~340px, 16px viewBox = 5.6px tela, ilegível). */}
        <text
          x={VIEWBOX_WIDTH - 28} y={62}
          textAnchor="end" fontSize="44" fontWeight="700"
          fill="var(--color-neutral-darkest)"
        >
          S = {totalLabel}
        </text>

        {/* Círculo A */}
        <circle
          cx={A.cx} cy={A.cy} r={A.r}
          fill={COLOR_A} fillOpacity={0.18}
          stroke={COLOR_A} strokeWidth={2.5}
        />
        {/* Rótulo A — fontSize bumpado 20 → 38 e posicionado JUNTO ao topo
            do círculo (label dentro da borda superior-esquerda). Antes
            ficava 86 unidades acima do topo do círculo (y=54 vs top=140). */}
        <text
          x={A.cx - A.r + 28} y={labelY}
          fontSize="46" fontWeight="800" fill={COLOR_A}
        >
          A
        </text>

        {/* Círculo B */}
        <circle
          cx={B.cx} cy={B.cy} r={B.r}
          fill={COLOR_B} fillOpacity={0.18}
          stroke={COLOR_B} strokeWidth={2.5}
        />
        <text
          x={B.cx + B.r - 58} y={labelY}
          fontSize="46" fontWeight="800" fill={COLOR_B}
        >
          B
        </text>

        {/* Input na região lateral esquerda (região exclusiva de A).
            Sem rótulo — o aluno deve deduzir pela posição geométrica
            que esta é a região A − B. */}
        <foreignObject
          x={amBX - inputBoxW / 2} y={inputY}
          width={inputBoxW} height={inputBoxH}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <VennInput
              value={amBValue}
              setValue={setAmBValue}
              error={amBError}
              locked={locked}
              ariaLabel="Cardinalidade da região exclusiva de A"
            />
          </div>
        </foreignObject>

        {/* Input na região central (interseção de A e B). */}
        <foreignObject
          x={xCx - inputBoxW / 2} y={inputY}
          width={inputBoxW} height={inputBoxH}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <VennInput
              value={xValue}
              setValue={setXValue}
              error={xError}
              locked={locked}
              ariaLabel="Cardinalidade da região central"
            />
          </div>
        </foreignObject>

        {/* Input na região lateral direita (região exclusiva de B). */}
        <foreignObject
          x={bmAX - inputBoxW / 2} y={inputY}
          width={inputBoxW} height={inputBoxH}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <VennInput
              value={bmAValue}
              setValue={setBmAValue}
              error={bmAError}
              locked={locked}
              ariaLabel="Cardinalidade da região exclusiva de B"
            />
          </div>
        </foreignObject>

        {/* Círculo C (complementar da união A ∪ B) — só aparece quando
            existem torcedores fora de A ∪ B. Menor que A e B, posicionado
            no canto inferior direito, matematicamente disjunto. */}
        {showW && (
          <>
            <circle
              cx={C_CX} cy={C_CY} r={C_R}
              fill="var(--color-neutral-medium)" fillOpacity={0.22}
              stroke="var(--color-neutral-dark)" strokeWidth={2}
            />
            <text
              x={C_CX} y={C_LABEL_Y}
              textAnchor="middle"
              fontSize="42" fontWeight="800"
              fill="var(--color-neutral-dark)"
            >
              C
            </text>
            <foreignObject
              x={C_CX - wBoxW / 2} y={C_CY - wBoxH / 2}
              width={wBoxW} height={wBoxH}
            >
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center', height: '100%',
              }}>
                <VennInput
                  value={wValue}
                  setValue={setWValue}
                  error={wError}
                  locked={locked}
                  ariaLabel="Cardinalidade do conjunto C (complementar de A ∪ B)"
                  width={100}
                />
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  );
}
