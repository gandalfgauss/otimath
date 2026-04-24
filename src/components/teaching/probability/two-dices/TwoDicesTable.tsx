import { Checkbox } from "@/components/global/Checkbox";
import { EventCheckboxes } from '@/hooks/teaching/probability/two-dices/useTwoDicesHooks';
import React from "react";

const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

const COLOR_GREEN_DICE = '#1a5c2e';
const COLOR_BLUE_DICE = 'var(--color-brand-otimath-dark)';

function TableDiceFace({ face, size, color }: { face: number; size: number; color: 'green' | 'blue' }) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);

  return (
    <div
      aria-label={`Dado ${color === 'green' ? 'verde' : 'azul'} ${face}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size * 0.16),
        background: color === 'green' ? COLOR_GREEN_DICE : COLOR_BLUE_DICE,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
      }}
    >
      {pips.map((pip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pip ? (
            <div style={{
              width: pipSize,
              height: pipSize,
              borderRadius: '50%',
              background: '#fff',
            }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface TwoDicesTableProps {
  eventsCheckboxes: EventCheckboxes;
  updateEventsCheckboxes: (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => void;
  /** Opcional — cores por nome de evento. Aplica accent-color no
   *  checkbox e color no rótulo. Quando ausente, usa o Checkbox global
   *  padrão (compat com a fase simulação/jogo). */
  eventColors?: Record<string, string>;
  /** Opcional — rótulos React customizados por nome (ex.: <BarA />).
   *  Quando ausente para um evento, usa o próprio nome como texto. */
  eventLabels?: Record<string, React.ReactNode>;
  /** Opcional — nome da camada que deve piscar. Aplica animação
   *  opacity 1 → 0.2 → 1 uma vez. Usado no reveal da seção de
   *  Eventos Complementares (Ā laranja, depois A azul). */
  blinkLabel?: string | null;
  /** Opcional — lista de nomes de evento que devem ser OCULTADOS
   *  em células onde o checkbox está unchecked. Usado no reveal
   *  para que cada célula mostre apenas o evento ao qual pertence
   *  (Ā XOR A — complementares mutuamente exclusivos). */
  hideIfUnchecked?: string[];
  /** Opcional — máscara de visibilidade por evento e célula. Quando
   *  visibilityMask[eventName][g][b] === false, o checkbox/label
   *  daquele evento NÃO é renderizado nesta célula (mesmo que o
   *  checkbox esteja marcado). Usado após Conferir em marking para
   *  remover placeholders de células que não pertencem a Ā. */
  visibilityMask?: Record<string, boolean[][]>;
}

export function TwoDicesTable({
  eventsCheckboxes,
  updateEventsCheckboxes,
  eventColors,
  eventLabels,
  blinkLabel,
  hideIfUnchecked,
  visibilityMask,
}: Readonly<TwoDicesTableProps>) {
  const useCustomRendering = !!(eventColors || eventLabels || blinkLabel || hideIfUnchecked || visibilityMask);

  return (
    <div className={`w-full overflow-auto max-h-[calc(100vh-68px)]
      snap-both snap-mandatory scroll-p-[50px] max-lg:flex max-lg:justify-center max-sm:justify-start
      rounded-md shadow-level-1 max-lg:w-fit max-sm:w-full
      `}
    >
      {/* Keyframe usado pela prop blinkLabel (respeita prefers-reduced-motion). */}
      <style>{`
        @keyframes twoDicesTableBlink {
          0% { opacity: 1; }
          50% { opacity: 0.18; }
          100% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes twoDicesTableBlink {
            0%, 100% { opacity: 1; }
          }
        }
      `}</style>
      <table className={`bg-background-otimath relative w-fit h-full text-center
          rounded-md outline-solid outline-neutral-lighter outline-(length:--border-width-hairline) border-collapse
        `}
      >
        <thead className="flex justify-end bg-background-otimath sticky top-[-1px] z-1">
          <tr className="flex justify-end">
            {[1,2,3,4,5,6].map((face) =>
              <th className="w-[116px] h-[50px] flex justify-center items-center" key={face}>
                <TableDiceFace face={face} size={32} color="blue" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array(6).fill(1).map((_, rowIndex) => {
            return <tr className="flex" key={`row-${rowIndex}`}>
              {Array(7).fill(1).map((_, colIndex) => {
                return <td
                    className={`${colIndex == 0 ? 'w-[50px] sticky left-[-1px] z-1': 'snap-start w-[116px] border-solid border-neutral-lighter border-hairline'}
                      h-[100px] flex justify-center items-center bg-background-otimath
                      ${(rowIndex % 2 == 0 && colIndex != 0) ? 'bg-feedback-info-lightest' : ''}
                    `}
                    key={`cell-${rowIndex}-${colIndex}`}
                  >
                  {colIndex == 0?
                    <TableDiceFace face={rowIndex + 1} size={32} color="green" />
                    :

                    <div className="w-full flex justify-center items-center flex-wrap gap-x-xs gap-y-nano">
                      {Object.keys(eventsCheckboxes).map((eventName) => {
                        const id = `checkbox-${eventName}-${rowIndex+1}-${colIndex}`;
                        const isChecked = eventsCheckboxes[eventName][rowIndex][colIndex-1].checked;
                        const isDisabled = eventsCheckboxes[eventName][rowIndex][colIndex-1].disabled as boolean;
                        const color = eventColors?.[eventName];
                        const label = eventLabels?.[eventName];
                        const isBlinking = blinkLabel === eventName;
                        const hasCustomLook = !!(color || label);

                        // Renderização customizada: cores por evento, rótulo React,
                        // animação de piscada, ocultamento seletivo. Ativa quando
                        // qualquer dessas props é passada.
                        if (useCustomRendering && hasCustomLook) {
                          // Máscara de visibilidade (prioritária): se false, oculta.
                          if (visibilityMask?.[eventName]?.[rowIndex]?.[colIndex - 1] === false) {
                            return null;
                          }
                          // Se a prop hideIfUnchecked inclui este evento E ele está
                          // unchecked nesta célula, omite a renderização.
                          if (hideIfUnchecked?.includes(eventName) && !isChecked) {
                            return null;
                          }
                          return (
                            <label
                              key={id}
                              htmlFor={id}
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                // Usa pointer-events: none (em vez de disabled) para
                                // que o accent-color do check marcado seja preservado
                                // (browsers acinzentam inputs disabled).
                                pointerEvents: isDisabled ? 'none' : 'auto',
                                cursor: isDisabled ? 'default' : 'pointer',
                                animation: isBlinking ? 'twoDicesTableBlink 600ms ease-in-out 1' : undefined,
                                userSelect: 'none',
                              }}
                            >
                              <span
                                style={{
                                  color: color ?? 'var(--color-neutral-darkest)',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                  lineHeight: 1,
                                }}
                              >
                                {label ?? eventName}
                              </span>
                              <input
                                id={id}
                                type="checkbox"
                                checked={!!isChecked}
                                onChange={(e) =>
                                  updateEventsCheckboxes(
                                    eventName,
                                    rowIndex + 1,
                                    colIndex,
                                    e.target.checked,
                                    isDisabled,
                                  )
                                }
                                style={{
                                  width: 16,
                                  height: 16,
                                  accentColor: color ?? undefined,
                                }}
                              />
                            </label>
                          );
                        }

                        // Fallback — Checkbox global (idêntico ao comportamento original).
                        return (
                          <Checkbox
                            key={id}
                            checkbox={
                              {
                                label: eventName,
                                id: id,
                                checked: isChecked,
                                disabled: isDisabled,
                                onChange:(checked: boolean) => updateEventsCheckboxes(eventName, rowIndex+1, colIndex, checked, isDisabled),
                              }
                            }
                          />
                        );
                      })}
                    </div> }
                </td>
                })
              }
            </tr>
            })
          }
        </tbody>
      </table>
    </div>
  );
}


/* Example

<TwoDicesTable />

*/
