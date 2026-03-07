import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { RouletteGame } from "./RouletteGame";

export function RouletteSection() {
  return (
    <Grid
      id="disco"
      paddings="pt-xl pb-xl"
      rowGaps='gap-y-xxs'
      backgroundColor='bg-brand-otimath-lightest'
    >
      <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
        <TextBlock
          title={<h2 className="ds-heading-ultra">Simulador Probabilístico com Disco Aleatório</h2>}
        />
      </GridItem>
      <GridItem cols="col-[1_/_13]">
        <RouletteGame />
      </GridItem>
    </Grid>
  );
}
