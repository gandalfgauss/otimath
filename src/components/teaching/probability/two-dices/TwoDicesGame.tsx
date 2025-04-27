import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { Button } from "@/components/global/Button";
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
import { RefreshCw, Check, X } from "lucide-react";
import Image from "next/image";

export function TwoDicesGame() {
  const dicesXImages = [diceX1Image, diceX2Image, diceX3Image, diceX4Image, diceX5Image, diceX6Image];
  const dicesYImages = [diceY1Image, diceY2Image, diceY3Image, diceY4Image, diceY5Image, diceY6Image];

  return (
  <Grid 
    id="dois-dados" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem styles="text-center" cols="col-[3_/_11] max-xlg:col-[3_/_11] max-lg:col-[3_/_11] max-md:col-[3_/_11] max-sm:col-[1_/_13]">
      <TextBlock 
        title={<h2 className="ds-heading-ultra">Probabilidade: Dois Dados</h2>}
        paragraph={
          <p className="ds-body">
            Veja a definição dos <strong>Eventos</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes aos eventos.
            Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
          </p>
        }
      ></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]" styles="overflow-auto">
        <div className="flex">
          <div className="w-fit flex flex-col gap-y-xxs">
            <div className="flex items-center gap-x-xxxs justify-between">
              <Button style="secondary" size="small" icon={<RefreshCw />}>Novo</Button>
              <Button style="borderless" size="extra-small" icon={<X />}>Limpar</Button>
            </div>
            
            <table className="bg-background-otimath rounded-md outline-solid outline-neutral-lighter outline-(length:--border-width-hairline) border-collapse w-fit h-full text-center">
              <thead className="flex justify-end">
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
                          className={`${colIndex == 0 ? 'w-[50px]': 'w-[116px] solid border-neutral-lighter border-hairline'}
                            h-[80px] flex justify-center items-center
                            ${rowIndex % 2 == 0 && colIndex != 0 && 'bg-feedback-info-lightest'}
                          `} 
                          key={`cell-${rowIndex}-${colIndex}`}
                        >
                        {colIndex == 0? <Image className="w-[32px] h-[32px]" src={dicesYImages[rowIndex]} alt={`Dado verde ${rowIndex + 1}`}/>: 
                          <div className="w-full flex justify-center items-center gap-x-micro"> 
                            <Button style="secondary" size="medium" icon={<Check />}></Button> 
                            <Button style="secondary" size="medium" icon={<Check />}></Button>
                            <Button style="secondary" size="medium" icon={<Check />}></Button>
                          </div> }
                      </td>
                      })
                    }
                  </tr>
                  })
                }
              </tbody>
            </table>
            <div className="flex gap-x-xxxs items-center">
              <Button style="secondary" size="small" icon={<Check />}>Conferir</Button>
            </div>
          </div>
        </div>
    </GridItem>
  </Grid>
  );
}


/* Example 

<TwoDices />

*/