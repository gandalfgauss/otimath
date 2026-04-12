import { Checkbox } from "@/components/global/Checkbox";
import { EventCheckboxes } from '@/hooks/teaching/probability/two-dices/useTwoDicesHooks';

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
}

export function TwoDicesTable({
  eventsCheckboxes,
  updateEventsCheckboxes
}: Readonly<TwoDicesTableProps>) {

  return (
    <div className={`w-full overflow-auto max-h-[calc(100vh-68px)]
      snap-both snap-mandatory scroll-p-[50px] max-lg:flex max-lg:justify-center max-sm:justify-start
      rounded-md shadow-level-1 max-lg:w-fit max-sm:w-full
      `}
    >
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
                        return (
                          <Checkbox
                            key={id}
                            checkbox={
                              {
                                label: eventName,
                                id: id,
                                checked: eventsCheckboxes[eventName][rowIndex][colIndex-1].checked,
                                disabled: eventsCheckboxes[eventName][rowIndex][colIndex-1].disabled,
                                onChange:(checked: boolean) => updateEventsCheckboxes(eventName, rowIndex+1, colIndex, checked, eventsCheckboxes[eventName][rowIndex][colIndex-1].disabled as boolean)
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
