import { Grid } from "@/components/global/Grid";
import { GridItem } from "@/components/global/GridItem";
import { TextBlock } from "@/components/global/TextBlock";
import Link from "next/link";


export function TreeCredits() {
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
                  <p className="ds-body-medium">
                    Este OVA foi atualizado e mantido com base no material original.
                  </p>
                }
                styles="z-1"
              ></TextBlock>

              <div 
                className="ds-body flex flex-col gap-y-micro border-solid border-hairline border-brand-otimath-lighter 
                  p-micro rounded-md shadow-level-1 z-1"
              >
                <h3 className="ds-body-medium text-brand-otimath-darker">Reprogramado por:</h3>
                <p className="ds-body-bold text-brand-otimath-dark">Rangel Freitas dos Santos e Halliday Gauss Costa dos Santos.</p>
              </div>

              <div 
                className="ds-body flex flex-col gap-y-micro border-solid border-hairline border-brand-otimath-lighter 
                  p-micro rounded-md shadow-level-1 z-1"
              >
                <h3 className="ds-body-medium text-brand-otimath-darker">Idealizado por:</h3>
                <Link 
                  className="ds-body-bold text-brand-otimath-dark underline underline-offset-4 hover:decoration-brand-otimath-darker hover:text-brand-otimath-darker transition-color duration-300 ease-in-out"
                   href="https://www.professores.uff.br/anafarias/" target="_blank" 
                >
                  Ana Maria Lima de Farias.
                  <br/>
                  Prof. Associada do Departamento de Estatística da UFF.
                </Link>
              </div>

              <p className="ds-body-bold text-brand-otimath-dark z-1">
                <Link 
                  href="https://cdme.im-uff.mat.br/arvore/arvore-testar-e-iniciar.html"
                  target="_blank" 
                  className="underline underline-offset-4 hover:decoration-brand-otimath-darker hover:text-brand-otimath-darker transition-color duration-300 ease-in-out"
                >
                  Este OVA
                </Link>
                {" "}e mais OVAs estão disponíveis em:{" "}
                <Link 
                  href="https://cdme.im-uff.mat.br" 
                  target="_blank" 
                  className="underline underline-offset-4 hover:decoration-brand-otimath-darker hover:text-brand-otimath-darker transition-color duration-300 ease-in-out"
                >
                  cdme.im-uff.mat.br
                </Link>.
              </p>
            </div>
          </GridItem>
        </Grid>
  );
}


/* Example 

<TreeCredits />

*/