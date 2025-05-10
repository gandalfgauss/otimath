import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import probabilityImage from "@/images/teaching/probabilityCard.webp";
import { CardResize } from "@/components/global/CardResize";

export function OurAreas() {
  return (
  <Grid 
    id="areas-disponiveis" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem cols="col-[1_/_13]">
      <TextBlock title={<h2 className="ds-heading-ultra">Áreas disponíveis</h2>}></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13]">
        <div className="flex gap-x-xs">
          <CardResize image={probabilityImage} href="/ensino/probabilidade" category="Probabilidade" />
        </div>
    </GridItem>
  </Grid>
  );
}


/* Example 

<OurAreas />

*/