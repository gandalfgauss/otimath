import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { Button } from '@/components/global/Button';
import Image from 'next/image';
import error404Image from '@/images/errors/error404.png';


export default function NotFound() {
  return (
    <main>
        <Grid 
          id="not-found-404" 
          paddings={`pt-xl pb-xl`} 
          rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
          backgroundColor='bg-linear-(--color-gradient-level-1)'
        >
          <GridItem styles="content-center" cols="col-[1_/_7] max-xlg:col-[1_/_7] max-lg:col-[1_/_7] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
            <TextBlock 
              overline="Página Inexistente" 
              title={<h2 className="ds-heading-ultra">Queremos te ajudar</h2>}
              paragraph={
                <span className="ds-body">
                  O link que você acessou não existe ou foi movido.
                  <br/>
                  Enquanto ajustamos a rota, que tal explorar outros conteúdos incríveis?
                </span>
              }
              maxWidthParagraph="max-w-[592px]"
              innerComponents={[
                <Button key="button-1" type="link" href="/ensino" style="primary" size="medium">Explorar Recursos</Button>, 
              ]}
            ></TextBlock>
          </GridItem>
          <GridItem cols="col-[7_/_13] max-xlg:col-[7_/_13] max-lg:col-[7_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
              <div className="flex items-end justify-center h-full">
                <Image className='max-w-[550px] w-full h-[550px] shrink-0 max-sm:max-w-[350px] max-sm:h-[350px]' src={error404Image} alt="Error 404" />
              </div>
          </GridItem>
        </Grid>
    </main>
  );
}
