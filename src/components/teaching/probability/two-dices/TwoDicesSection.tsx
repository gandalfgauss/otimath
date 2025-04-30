import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { TwoDicesGame } from "./TwoDicesGame";

export function TwoDicesSection() {
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
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <TwoDicesGame />
    </GridItem>
  </Grid>
  );
}


/* Example 

<TwoDicesSection />

*/