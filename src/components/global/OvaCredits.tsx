import { Lightbulb, GraduationCap, Code2 } from "lucide-react";
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

interface CreditCardProps {
  icon: React.ReactNode;
  role: string;
  name: string;
  detail: string;
}

function CreditCard({ icon, role, name, detail }: CreditCardProps) {
  return (
    <div className="flex-1 flex flex-col items-center text-center gap-y-nano p-xs border-solid border-hairline border-brand-otimath-lighter rounded-md shadow-level-1 bg-linear-(--color-gradient-level-1) min-w-0">
      <div className="w-12 h-12 rounded-full bg-brand-otimath-lightest flex items-center justify-center mb-nano">
        {icon}
      </div>
      <h3 className="ds-small-bold text-brand-otimath-darker uppercase tracking-wide">{role}</h3>
      <p className="ds-body-bold text-brand-otimath-dark">{name}</p>
      <p className="ds-small-medium text-neutral-dark">{detail}</p>
    </div>
  );
}

export function OvaCredits() {
  return (
    <Grid
      paddings={`pt-xs pb-xs`}
      backgroundColor="bg-linear-(--color-gradient-level-5)"
    >
      <GridItem cols="col-[2_/_12] max-md:col-[1_/_13]">
        <div
          className="rounded-lg relative shadow-level-1 overflow-hidden bg-linear-(--color-gradient-level-1)
          p-xs flex flex-col gap-y-xs
          before-content-[''] before:absolute before:inset-[-120px_-150px_auto_auto] before:w-[320px] before:h-[320px]
          before:pointer-events-none before:rotate-[18deg] before:bg-linear-(--color-gradient-level-5)
          before:opacity-level-intense z-0"
        >
          <div className="relative z-1 w-full flex flex-col gap-y-xs" role="contentinfo" aria-label="Créditos do objeto virtual de aprendizagem">
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-y-nano">
              <span className="ds-overline text-brand-otimath-pure tracking-wider">CRÉDITOS</span>
              <h2 className="ds-heading-mega text-brand-otimath-dark text-center">
                Quem construiu este OVA
              </h2>
              <div className="w-12 h-0.5 bg-brand-otimath-pure rounded-full" />
            </div>

            {/* Cards lado a lado no desktop, empilhados no mobile */}
            <div className="flex gap-x-xs gap-y-xs max-md:flex-col items-stretch">
              <CreditCard
                icon={<Lightbulb size={24} className="text-brand-otimath-pure" />}
                role="Idealizador e autor"
                name="Rangel Freitas dos Santos"
                detail="Mestrando PROFMAT · UFVJM"
              />
              <CreditCard
                icon={<GraduationCap size={24} className="text-brand-otimath-pure" />}
                role="Orientador"
                name="Prof. Dr. Weversson Dalmaso Sellin"
                detail="UFVJM"
              />
              <CreditCard
                icon={<Code2 size={24} className="text-brand-otimath-pure" />}
                role="Suporte tecnológico"
                name="Halliday Gauss Costa dos Santos"
                detail="Cientista da Computação · Arquitetura do ambiente"
              />
            </div>
          </div>
        </div>
      </GridItem>
    </Grid>
  );
}
