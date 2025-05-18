import diceX1Image from '@/images/teaching/probability/two-dices/dices/diceX1.gif';
import diceX2Image from '@/images/teaching/probability/two-dices/dices/diceX2.gif';
import diceX3Image from '@/images/teaching/probability/two-dices/dices/diceX3.gif';
import diceX4Image from '@/images/teaching/probability/two-dices/dices/diceX4.gif';
import diceX5Image from '@/images/teaching/probability/two-dices/dices/diceX5.gif';
import diceX6Image from '@/images/teaching/probability/two-dices/dices/diceX6.gif';
import diceY1Image from '@/images/teaching/probability/two-dices/dices/diceY1.gif';
import diceY2Image from '@/images/teaching/probability/two-dices/dices/diceY2.gif';
import diceY3Image from '@/images/teaching/probability/two-dices/dices/diceY3.gif';
import diceY4Image from '@/images/teaching/probability/two-dices/dices/diceY4.gif';
import diceY5Image from '@/images/teaching/probability/two-dices/dices/diceY5.gif';
import diceY6Image from '@/images/teaching/probability/two-dices/dices/diceY6.gif';
import Image from "next/image";
import { Checkbox } from "@/components/global/Checkbox";
import { EventCheckboxes } from '@/hooks/teaching/probability/two-dices/useTwoDicesHooks';
interface TwoDicesTableProps {
  eventsCheckboxes: EventCheckboxes;
  updateEventsCheckboxes: (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => void;
}

export function TwoDicesTable({
  eventsCheckboxes,
  updateEventsCheckboxes
}: Readonly<TwoDicesTableProps>) {
  const dicesXImages = [diceX1Image, diceX2Image, diceX3Image, diceX4Image, diceX5Image, diceX6Image];
  const dicesYImages = [diceY1Image, diceY2Image, diceY3Image, diceY4Image, diceY5Image, diceY6Image];

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
            {dicesXImages.map((diceImage, index) => 
              <th className="w-[116px] h-[50px] flex justify-center items-center" key={index}>
                <Image className="w-[32px] h-[32px]" src={diceImage} alt={`Dado azul ${index + 1}`}/>
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
                      ${rowIndex % 2 == 0 && colIndex != 0 && 'bg-feedback-info-lightest'}
                    `} 
                    key={`cell-${rowIndex}-${colIndex}`}
                  >
                  {colIndex == 0? 
                    <Image className="w-[32px] h-[32px]" src={dicesYImages[rowIndex]} alt={`Dado verde ${rowIndex + 1}`}/>
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
                                styles: "disabled:opacity-level-semiopaque",
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