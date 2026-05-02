import { Grid } from "@/components/global/Grid";
import { GridItem } from '@/components/global/GridItem';

/**
 * Bloco de créditos compartilhado entre os OVAs (Objetos Virtuais de
 * Aprendizagem) do projeto. Renderiza idealizador, orientador e
 * suporte tecnológico em três cards uniformes.
 *
 * Pode ser usado em qualquer Activity de OVA: Disco/Roleta, Dois Dados,
 * Árvore, etc.
 */
export function OvaCredits() {
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
            <div className="relative z-1 w-full" role="contentinfo" aria-label="Créditos do objeto virtual de aprendizagem">
              <div className="flex flex-col gap-y-xxs">
                <div className="flex flex-col gap-y-nano p-micro border-solid border-hairline border-brand-otimath-lighter rounded-md shadow-level-1 bg-linear-(--color-gradient-level-1)">
                  <h3 className="ds-small-bold text-brand-otimath-darker uppercase tracking-wide">Idealizador e autor</h3>
                  <p className="ds-body-bold text-brand-otimath-dark">Rangel Freitas dos Santos</p>
                  <p className="ds-small-medium text-neutral-dark">Mestrando PROFMAT · UFVJM</p>
                </div>
                <div className="flex flex-col gap-y-nano p-micro border-solid border-hairline border-brand-otimath-lighter rounded-md shadow-level-1 bg-linear-(--color-gradient-level-1)">
                  <h3 className="ds-small-bold text-brand-otimath-darker uppercase tracking-wide">Orientador</h3>
                  <p className="ds-body-bold text-brand-otimath-dark">Prof. Dr. Weversson Dalmaso Sellin</p>
                  <p className="ds-small-medium text-neutral-dark">UFVJM</p>
                </div>
                <div className="flex flex-col gap-y-nano p-micro border-solid border-hairline border-brand-otimath-lighter rounded-md shadow-level-1 bg-linear-(--color-gradient-level-1)">
                  <h3 className="ds-small-bold text-brand-otimath-darker uppercase tracking-wide">Suporte tecnológico</h3>
                  <p className="ds-body-bold text-brand-otimath-dark">Halliday Gauss Costa dos Santos</p>
                  <p className="ds-small-medium text-neutral-dark">Cientista da Computação · Arquitetura do ambiente</p>
                </div>
              </div>
            </div>
          </div>
        </GridItem>
      </Grid>
  );
}
