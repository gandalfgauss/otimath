import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { Topics } from "@/components/teaching/probability/Topics";
import { Button } from "@/components/global/Button";
import heroBannerProbabilityImage from '@/images/teaching/probability/probabilityBanner.webp';

export default function Probability() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
        textBlock={
          <TextBlock 
              overline="Rumo ao acaso" 
              title={<h1 className="ds-heading-giga">Probabilidade: domine os segredos da incerteza</h1>}
              paragraph={
                <p className="ds-body">
                  Chega de fórmulas! Aprenda probabilidade, sem decoreba, através de vídeos interativos, jogos, simulações e desafios.
                  Transforme conceitos abstratos em habilidades concretas.
                </p>
              }
              maxWidthParagraph="max-w-[422px]"
              inverse={true}
              innerComponents={[
                <Button key="button-1" type="link" href="#topicos" style="primary" size="medium">Tópicos Relacionados</Button>, 
              ]}
          ></TextBlock>
        }
        image={heroBannerProbabilityImage}
      />
      <Topics />
    </main>
  );
}

/* Example 
  <Probability />
*/