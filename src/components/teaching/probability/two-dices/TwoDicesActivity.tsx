import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { TwoDicesInstructionsSection } from "@/components/teaching/probability/two-dices/TwoDicesInstructionsSection";
import { TwoDicesSection } from "@/components/teaching/probability/two-dices/TwoDicesSection";
import heroBannerTwoDicesImage from '@/images/teaching/probability/two-dices/twoDicesBanner.webp';
import { TwoDicesCredits } from "./TwoDicesCredits";


export default function TwoDicesActivity() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
        textBlock={
          <TextBlock 
              overline="Probabilidade" 
              title={<h1 className="ds-heading-giga">Dois Dados: cálculo de probabilidade em espaços amostrais equiprováveis</h1>}
              paragraph={
                <p className="ds-body">
                  Aprenda a calcular probabilidades em espaços amostrais equiprováveis usando lançamentos de dois dados.
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
      <TwoDicesCredits />
    </main>
  );
}

/* Example 
  <TwoDices />
*/
