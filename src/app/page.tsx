import { Grid } from "@/components/global/Grid"
import { GridItem } from "@/components/global/GridItem";

export default function Home() {
  return (
    <main>
      <Grid>
        <GridItem cols="col-[1_/_12] max-xlg:col-[2_/_11] max-lg:col-[3_/_10] max-md:col-[4_/_9] max-sm:col-[5_/_8]">Andreyna linda ❤️</GridItem>
        <GridItem cols="col-[1_/_12]">Teste Grid</GridItem>
      </Grid>
    </main>
  );
}
