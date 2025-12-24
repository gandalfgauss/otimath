import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { CardResize } from "@/components/global/CardResize";
import twoDiceImage from "@/images/teaching/probability/twoDice.webp";
import treeImage from "@/images/teaching/probability/tree.webp";

export function Applications() {
  return (
  <Grid 
    id="aplicacoes" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
    backgroundColor='bg-brand-otimath-lightest'
  >
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
      <TextBlock title={<h2 className="ds-heading-ultra">Aplicações</h2>}></TextBlock>
    </GridItem>
    <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex flex-wrap gap-xs">
          <CardResize image={twoDiceImage} alt="Dois dados: um verde e outro azul" href="/ensino/probabilidade/dois-dados" category="Espaço amostral equiprovável" title="Dois dados" />
          <CardResize image={treeImage} alt="Árvore de probabilidade" href="/ensino/probabilidade/arvore" category="Probabilidade condicional" title="Probabilidade de Árvore" />
        </div>
    </GridItem>
  </Grid>
  );
}


/* Example 

<Applications />

*/