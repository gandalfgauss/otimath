import { Grid } from "@/components/global/Grid";
import { GridItem } from '../global/GridItem';
import { TextBlock } from '../global/TextBlock';
import probabilidade from "@/images/teaching/probabilidade.webp";
import { CardResize } from "../global/CardResize";

export function OurAreas() {
  return (
  <Grid 
    id="areas-disponiveis" 
    paddings={`pt-xl pb-xl 
      max-xlg:pt-xl max-xlg:pb-xl
      max-lg:pt-xl max-lg:pb-xl
      max-md:pt-xl max-md:pb-xl
      max-sm:pt-xl max-sm:pb-xl`} 
    rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
    backgroundColor='bg-brand-corporate-lightest'
  >
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
      <TextBlock title={<h2 className="ds-heading-ultra">Áreas disponíveis</h2>}></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex gap-x-xs">
          <CardResize image={probabilidade} href="/ensino/probabilidade" title="Probabilidade" />
        </div>
    </GridItem>
  </Grid>
  );
}