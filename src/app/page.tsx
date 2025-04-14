import { Grid } from "@/components/global/Grid"
import { GridItem } from "@/components/global/GridItem";
import { Button } from "@/components/global/Button";
import { ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <main>
      <Grid id="teste">
        <GridItem cols="col-[1_/_12] max-xlg:col-[2_/_11] max-lg:col-[3_/_10] max-md:col-[4_/_9] max-sm:col-[5_/_8]">Andreyna linda ❤️</GridItem>
        <GridItem cols="col-[1_/_12]">Teste Grid</GridItem>
      </Grid>

        <Button as="link" href="#teste" style="secondary" size="large" icon={<ChevronDown />} onClickFunction={async function teste() {
          'use server'
        }}>Botão Secondário</Button>
        <Button as="link" href="#teste" style="borderless" size="extra-small" icon={<ChevronDown />} onClickFunction={async function teste() {
          'use server'
        }}>Botão Secondário</Button>
    </main>
  );
}
