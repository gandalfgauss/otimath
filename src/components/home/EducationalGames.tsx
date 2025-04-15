import React from 'react';
import { Grid } from "@/components/global/Grid";
import { GridItem } from '../global/GridItem';
import { TextBlock } from '../global/TextBlock';
import { Button } from '../global/Button';
import { List } from '../global/List';

export function EducationalGames() {
  return (
    <Grid 
    id="educational-games" 
    paddings={`pt-xxl pb-xxl 
      max-xlg:pt-xxl max-xlg:pb-xxl
      max-lg:pt-xl max-lg:pb-xl
      max-md:pt-xl max-md:pb-xl
      max-sm:pt-xl max-sm:pb-xl`} 
    rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
    backgroundColor='bg-linear-(--color-gradient-level-1)'
  >
    <GridItem cols="col-[1_/_8] max-xlg:col-[1_/_8] max-lg:col-[1_/_8] max-md:col-[1_/_8] max-sm:col-[1_/_13]">
    <TextBlock 
      overline="APRENDER MATEMÁTICA PODE SER DIVERTIDO!" 
      title={<h2 className="ds-heading-ultra">Ferramentas Pedagógicas para o Ensino de Matemática</h2>}
      paragraph={
        <p className="ds-body">
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
        </p>
      }
      maxWidthParagraph="max-w-[592px]"
      innerComponents={[
        <Button key="button-1" style="primary" size="medium">Explorar Recursos</Button>, 
      ]}
    ></TextBlock>
    </GridItem>
  </Grid>
  );
}