import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { TextBlock } from '@/components/global/TextBlock';
import { Button } from '@/components/global/Button';
import { List } from '@/components/global/List';
import Image from 'next/image';
import pedagogicalToolsImage from '@/images/home/pedagogicalToolsHome.png';

export function PedagogicalTools() {
  return (
  <Grid 
    id="ferramentas-pedagogicas" 
    paddings={`pt-xl pb-xl`} 
    rowGaps='gap-y-xs'
    backgroundColor='bg-linear-(--color-gradient-level-1)'
  >
    <GridItem cols="col-[1_/_7] max-lg:col-[1_/_13]">
      <TextBlock 
        overline="APRENDER MATEMÁTICA PODE SER DIVERTIDO!" 
        title={<h2 className="ds-heading-ultra">Ferramentas Pedagógicas para o Ensino de Matemática</h2>}
        paragraph={
          <span className="ds-body">
            Nossa plataforma integra <strong>jogos digitais</strong>, <strong>simulações interativas</strong> e <strong>recursos estruturados</strong> desenvolvidos em parceria com educadores em matemática. 
            <br/>
            <br/>
            Cada recurso foi projetado para:
            <List>
              <li>Reforçar a compreensão conceitual através de aprendizagem ativa</li>
              <li>Desenvolver raciocínio lógico-matemático progressivamente</li>
              <li>Oferecer avaliação formativa com feedback imediato</li>
              <li>Suportar diferentes estilos de aprendizagem</li>
            </List>
          </span>
        }
        maxWidthParagraph="max-w-[592px] max-lg:max-w-[700px]"
        innerComponents={[
          <Button key="button-1" type="link" href="/ensino" style="primary" size="medium">Explorar Recursos</Button>, 
        ]}
      ></TextBlock>
    </GridItem>
    <GridItem cols="col-[7_/_13] max-lg:col-[1_/_13]">
        <div className="flex items-end justify-center h-full relative">
          <Image className='absolute bottom-[-65px] w-auto h-auto shrink-0 max-lg:relative' src={pedagogicalToolsImage} alt="Ilustração de uma garota aprendendo matemática" />
        </div>
    </GridItem>
  </Grid>
  );
}

/* Example 

<PedagogicalTools />

*/