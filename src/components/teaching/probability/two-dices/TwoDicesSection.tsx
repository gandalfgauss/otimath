import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { TwoDicesGame } from "./TwoDicesGame";

export function TwoDicesSection() {
  return (
  <Grid 
    id="dois-dados" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xxs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
      <TextBlock 
        title={<h2 className="ds-heading-ultra">Probabilidade: Dois Dados</h2>}
      ></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13]">
        <TwoDicesGame />
    </GridItem>
  </Grid>
  );
}


/* Example 

<TwoDicesSection />

*/