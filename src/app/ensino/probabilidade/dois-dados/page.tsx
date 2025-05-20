import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { TwoDicesInstructionsSection } from "@/components/teaching/probability/two-dices/TwoDicesInstructionsSection";
import { TwoDicesSection } from "@/components/teaching/probability/two-dices/TwoDicesSection";
import heroBannerTwoDicesImage from '@/images/teaching/probability/two-dices/twoDicesBanner.webp';

export default function TwoDices() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
        textBlock={
          <TextBlock 
              overline="Probabilidade" 
              title={<h1 className="ds-heading-giga">Cálculo de probabilidade em um espaço amostral equiprovável</h1>}
              paragraph={
                <p className="ds-body">
                  Aprenda a calcular a probabilidade em espaços amostrais equiprováveis usando lançamentos de dois dados.
                </p>
              }
              maxWidthParagraph="max-w-[422px]"
              inverse={true}
          ></TextBlock>
        }
        image={heroBannerTwoDicesImage}
      />
      <TwoDicesInstructionsSection />
      <TwoDicesSection />
    </main>
  );
}

/* Example 
  <TwoDices />
*/
