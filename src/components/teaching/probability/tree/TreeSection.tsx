import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { TreeGame } from './TreeGame';

export function TreeSection() {
  return (
  <Grid 
    id="arvore" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xxs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
      <TextBlock 
        title={<h2 className="ds-heading-ultra">Probabilidade: diagramas de árvores</h2>}
      ></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13]">
      <TreeGame />
    </GridItem>
  </Grid>
  );
}


/* Example 

<TreeSection />

*/