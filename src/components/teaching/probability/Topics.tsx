import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import twoDiceImage from "@/images/teaching/probability/twoDice.webp";
import { CardResize } from "@/components/global/CardResize";

export function Topics() {
  return (
  <Grid 
    id="topicos" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
      <TextBlock title={<h2 className="ds-heading-ultra">Tópicos</h2>}></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex gap-x-xs">
          <CardResize image={twoDiceImage} href="/ensino/probabilidade/dois-dados" category="Espaço amostral equiprovável" title="Dois dados" />
        </div>
    </GridItem>
  </Grid>
  );
}


/* Example 

<Topics />

*/