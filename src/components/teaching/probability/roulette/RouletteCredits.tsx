import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';
import { List } from "@/components/global/List";
import { TextBlock } from '@/components/global/TextBlock';

export function RouletteCredits() {
  return (
      <Grid 
        paddings={`pt-xs pb-xs`} 
        backgroundColor="bg-linear-(--color-gradient-level-5)"
      >
        <GridItem cols="col-[1_/_13]">
          <div 
            className="rounded-lg relative shadow-level-1 overflow-hidden bg-linear-(--color-gradient-level-1) 
            p-xxxs w-fit justify-self-center flex flex-col gap-y-xs 
            before-content-[''] before:absolute before:inset-[-120px_-150px_auto_auto] before:w-[320px] before:h-[320px]
            before:pointer-events-none before:rotate-[18deg] before:bg-linear-(--color-gradient-level-5) 
            before:opacity-level-intense z-0"
          > 
            <TextBlock 
              overline="Créditos e Referências" 
              title={<h2 className="ds-heading-extra">Reconhecimento de autoria e fonte</h2>}
              paragraph={
                <div className="flex flex-col gap-y-xxxs">
                  <p className="ds-body-medium">
                    Este Objeto Virtual de Aprendizagem (OVA) foi desenvolvido pela <strong>Equipe Oti-Math</strong> com base nas seguintes referências:
                  </p>
                  <List>
                    <li>BRASIL. Base Nacional Comum Curricular. Brasília: MEC, 2018.</li>
                    <li>MENDONÇA, M. J.; LIMA, A. M. Probabilidade e Estatística no Ensino Médio: investigações e simulações. São Paulo: Moderna, 2020.</li>
                    <li>BOROVIK, A.; GARDINER, A. The Essence of Mathematics Through Elementary Problems. AMS, 2019.</li>
                    <li>KAPLAN, D.; HAHN, J. Understanding Probability and Statistics through Simulation. Springer, 2021.</li>
                  </List>

                  <p className="ds-body-bold mt-xxxs text-brand-otimath-darker">
                    Habilidades BNCC: EM13MAT311, EM13MAT312
                  </p>
                </div>
              }
              styles="z-1"
            />

            <div className="ds-body flex flex-col gap-y-micro border-solid border-hairline border-brand-otimath-lighter p-micro
              rounded-md shadow-level-1 bg-linear-(--color-gradient-level-1)">
              <h3 className="ds-small-bold text-brand-otimath-darker">Desenvolvido por:</h3>
              <p className="ds-body-bold text-brand-otimath-dark">Equipe Oti-Math</p>
              <p className="text-brand-otimath-dark ds-body-bold">Rangel Freitas dos Santos e Halliday Gauss Costa dos Santos.</p>
            </div>
          </div>
        </GridItem>
      </Grid>
  );
}
