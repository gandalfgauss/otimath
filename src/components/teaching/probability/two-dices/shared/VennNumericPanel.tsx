'use client';

/* ═══════════════════════════════════════════════════════════════
   VennNumericPanel — diagrama de Venn numérico para exercícios.

   Reusa a mesma geometria canônica do VennLaboratory (teoria):
     • Círculos em (325, 210) e (475, 210), raio 150
     • viewBox 800 × 400
     • Cores oficiais (EVENT_COLORS) para A, B, A∩B

   Diferença em relação ao VennLaboratory:
     • VennLaboratory = construção topológica em 15 sub-etapas com
       marcação de regiões, escuta de cliques, etc.
     • VennNumericPanel = exibição/edição de 4 cardinalidades numéricas
       (x, A−B, B−A, outros) com valores fixos vindos do enunciado.

   Pedagogicamente: o aluno vê o MESMO diagrama da teoria —
   coerência instrumental (TROUCHE, 2004).
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { EVENT_COLORS } from './eventPair';
import {
  defaultGeometry2Intersected,
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
  value, setValue, error, locked, ariaLabel, width = 100,
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
      readOnly={readOnly}
      style={{
        border: `2px solid ${border}`,
        borderRadius: 6,
        padding: '10px 12px',
        width,
        textAlign: 'center',
        outline: 'none',
        fontWeight: 700,
        fontSize: '1.05rem',
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
  const geo = defaultGeometry2Intersected();
  const [A, B] = geo.circles;
  const COLOR_A = EVENT_COLORS['A'];
  const COLOR_B = EVENT_COLORS['B'];

  // Posições dos inputs — calculadas a partir da geometria canônica.
  // A geometria canônica tem centros em (325, 210) e (475, 210), raio 150.
  // Lunetes laterais e interseção têm largura horizontal ≈ 150 px cada;
  // isso define o espaço máximo disponível para os retângulos de digitação.
  // A−B: centroide da lunete esquerda (entre borda externa de A e interseção)
  const amBX = ((A.cx - A.r) + (B.cx - B.r)) / 2;
  // B−A: centroide da lunete direita
  const bmAX = ((A.cx + A.r) + (B.cx + B.r)) / 2;
  // Interseção: entre os dois centros
  const xCx = (A.cx + B.cx) / 2;
  // Todos os inputs alinhados na mesma linha vertical dos centros
  const inputY = A.cy - 30;

  // Rótulos A e B fora, no topo
  const labelY = 54;

  // Caixas de digitação ampliadas em ~30% sobre a versão anterior (104×60 → 135×78).
  // Continuam cabendo nos 150 px horizontais disponíveis por região, com margem
  // lateral simétrica de (150 − 135) / 2 ≈ 7 px.
  const inputBoxW = 135, inputBoxH = 78;

  // Círculo C (complementar da união A ∪ B) — menor que A e B, posicionado
  // no canto inferior direito do retângulo S, matematicamente disjunto de
  // A e B (dist. entre centros > soma dos raios). Representa w = S − c.
  // Ampliado 30% sobre versão anterior (r: 58 → 75). cy ajustado para
  // garantir que o círculo não ultrapasse a borda inferior do retângulo.
  const C_CX = 700, C_CY = 315, C_R = 75;
  const C_LABEL_Y = C_CY - C_R - 8;
  // Placeholder do C ampliado 30% (wBoxW: 76 → 99; wBoxH: 48 → 62).
  const wBoxW = 99, wBoxH = 62;

  return (
    <div className="w-full flex justify-center" style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width="100%"
        style={{ maxWidth: 640 }}
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
        <text
          x={VIEWBOX_WIDTH - 24} y={34}
          textAnchor="end" fontSize="16" fontWeight="700"
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
        <text
          x={A.cx - A.r + 18} y={labelY}
          fontSize="20" fontWeight="800" fill={COLOR_A}
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
          x={B.cx + B.r - 32} y={labelY}
          fontSize="20" fontWeight="800" fill={COLOR_B}
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
              fontSize="20" fontWeight="800"
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
                  width={78}
                />
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  );
}
