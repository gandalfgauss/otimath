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

                    (() => {
                      // ─── Pré-cálculo: topologia GLOBAL e visibilidade da célula ───
                      // Topologia GLOBAL = ordem alfabética de TODAS as keys do estado
                      // (não da célula atual). Isso reserva slot fixo para cada evento
                      // em TODAS as células da tabela, garantindo alinhamento horizontal
                      // e vertical estável (Lei de continuidade da Gestalt + consistência
                      // espacial — NIELSEN, 1994). Ex.: em mark-D do Ex6, mesmo se A
                      // está oculto numa célula, o slot de A permanece reservado e B
                      // continua na col 2, D continua embaixo centralizado.
                      const allEventNames = Object.keys(eventsCheckboxes);
                      const sortedNames = [...allEventNames].sort((a, b) => a.localeCompare(b));
                      const totalSlots = sortedNames.length;

                      // Mapa nome → posição GLOBAL fixa no grid (estável entre células).
                      const globalSlotIndex: Record<string, number> = {};
                      sortedNames.forEach((name, idx) => { globalSlotIndex[name] = idx; });

                      // Visibilidade desta célula específica (após hideIfUnchecked / mask).
                      const visibleNames = sortedNames.filter((eventName) => {
                        const isChecked = eventsCheckboxes[eventName][rowIndex][colIndex - 1].checked;
                        if (visibilityMask?.[eventName]?.[rowIndex]?.[colIndex - 1] === false) return false;
                        if (hideIfUnchecked?.includes(eventName) && !isChecked) return false;
                        return true;
                      });

                      const renderEventLabel = (eventName: string) => {
                        const id = `checkbox-${eventName}-${rowIndex+1}-${colIndex}`;
                        const isChecked = eventsCheckboxes[eventName][rowIndex][colIndex-1].checked;
                        const isDisabled = eventsCheckboxes[eventName][rowIndex][colIndex-1].disabled as boolean;
                        const color = eventColors?.[eventName];
                        const label = eventLabels?.[eventName];
                        const isBlinking = blinkLabel === eventName;
                        const hasCustomLook = !!(color || label);

                        // Posicionamento no grid 2D (Venn) — slot GLOBAL FIXO por evento:
                        //   slot 0 (1º alfabético, ex.: A) → linha 1, coluna 1
                        //   slot 1 (2º alfabético, ex.: B) → linha 1, coluna 2
                        //   slot 2 (3º alfabético, ex.: D) → linha 2, ocupa 2 colunas
                        //   slot 3+ (patológico) → linhas seguintes, ocupa 2 colunas
                        // Isso é APLICADO INDEPENDENTEMENTE de quantos eventos estão
                        // visíveis na célula — mantém alinhamento entre células.
                        const slot = globalSlotIndex[eventName];
                        const useGridLayout = useCustomRendering && hasCustomLook && totalSlots >= 2;
                        const gridStyle: React.CSSProperties = useGridLayout
                          ? slot === 0
                            ? { gridColumn: '1', gridRow: '1', justifySelf: 'center' }
                            : slot === 1
                            ? { gridColumn: '2', gridRow: '1', justifySelf: 'center' }
                            : slot === 2
                            ? { gridColumn: '1 / -1', gridRow: '2', justifySelf: 'center' }
                            : { gridColumn: '1 / -1', gridRow: `${slot}`, justifySelf: 'center' }
                          : {};

                        if (useCustomRendering && hasCustomLook) {
                          return (
                            <label
                              key={id}
                              htmlFor={id}
                              onClick={(e) => { if (isDisabled) e.preventDefault(); }}
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                pointerEvents: 'auto',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                animation: isBlinking ? 'twoDicesTableBlink 600ms ease-in-out 1' : undefined,
                                userSelect: 'none',
                                ...gridStyle,
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
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  updateEventsCheckboxes(
                                    eventName,
                                    rowIndex + 1,
                                    colIndex,
                                    e.target.checked,
                                    isDisabled,
                                  );
                                }}
                                style={{
                                  width: 16,
                                  height: 16,
                                  accentColor: color ?? undefined,
                                  pointerEvents: isDisabled ? 'none' : 'auto',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                }}
                              />
                            </label>
                          );
                        }

                        // Fallback — Checkbox global (sem cor custom).
                        return (
                          <Checkbox
                            key={id}
                            checkbox={{
                              label: eventName,
                              id,
                              checked: isChecked,
                              disabled: isDisabled,
                              onChange: (checked: boolean) =>
                                updateEventsCheckboxes(eventName, rowIndex + 1, colIndex, checked, isDisabled),
                            }}
                          />
                        );
                      };

                      // Decide o wrapper conforme topologia GLOBAL (totalSlots) e layout custom:
                      // - useCustomRendering + totalSlots >= 2 → grid 2D Venn (slots fixos por evento)
                      //   • Reserva linha 2 com gridTemplateRows quando há 3+ slots, garantindo
                      //     alinhamento vertical estável mesmo quando D está oculto na célula.
                      // - Fallback (sem custom OU totalSlots <= 1) → flex centralizado.
                      if (useCustomRendering && totalSlots >= 2) {
                        const reserveRow2 = totalSlots >= 3;
                        return (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gridTemplateRows: reserveRow2 ? 'auto auto' : 'auto',
                              rowGap: 4,
                              columnGap: 8,
                              width: '100%',
                              justifyItems: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {visibleNames.map((eventName) => renderEventLabel(eventName))}
                          </div>
                        );
                      }

                      // Caso fallback: 0 ou 1 evento total no estado, OU sem useCustomRendering.
                      // Usa visibleNames (já filtrado por hideIfUnchecked + visibilityMask)
                      // para não renderizar placeholders de eventos ocultos.
                      return (
                        <div className="w-full flex justify-center items-center flex-wrap gap-x-xs gap-y-nano">
                          {visibleNames.map((eventName) => renderEventLabel(eventName))}
                        </div>
                      );
                    })()
                  }
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
