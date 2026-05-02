import { HeroBanner } from "@/components/global/HeroBanner";
import { OvaCredits } from "@/components/global/OvaCredits";
import { TextBlock } from "@/components/global/TextBlock";
import { RouletteSection } from "@/components/teaching/probability/roulette/RouletteSection";
import heroBannerImage from '@/images/teaching/probability/roulette/rouletteBanner.webp';

export default function RouletteActivity() {
  return (
    <main>
      <HeroBanner
        id="hero-banner"
        textBlock={
          <TextBlock
            overline="Probabilidade"
            title={<h1 className="ds-heading-giga">Simulador Probabilístico com Disco Aleatório: Frequência Relativa e Probabilidade</h1>}
            paragraph={
              <p className="ds-body">
                Compreenda o conceito de probabilidade como limite da frequência relativa por meio de simulações com disco.
              </p>
            }
            maxWidthParagraph="max-w-[422px]"
            inverse={true}
          />
        }
        image={heroBannerImage}
      />
      <RouletteSection />
      <OvaCredits />
    </main>
  );
}
