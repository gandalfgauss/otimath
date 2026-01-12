import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import heroBannerTreeImage from '@/images/teaching/probability/tree/treeBanner.webp';
import { TreeSection } from "@/components/teaching/probability/tree/TreeSection";
import { TreeInstructionSection } from "./TreeInstructionsSection";

export default function TreeActivity() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
        textBlock={
          <TextBlock 
              overline="Probabilidade" 
              title={<h1 className="ds-heading-giga">Árvore: cálculo de probabilidade condicional</h1>}
              paragraph={
                <p className="ds-body">
                  Aprenda a calcular probabilidades condicionais por meio de árvores de probabilidade.
                </p>
              }
              maxWidthParagraph="max-w-[422px]"
              inverse={true}
          ></TextBlock>
        }
        image={heroBannerTreeImage}
      />
      <TreeInstructionSection />
      <TreeSection />
    </main>
  );
}

/* Example 
  <TreeActivity />
*/
