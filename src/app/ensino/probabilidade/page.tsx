import type { Metadata } from "next";
import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { Applications } from "@/components/teaching/probability/Applications";
import { Button } from "@/components/global/Button";
import heroBannerProbabilityImage from '@/images/teaching/probability/probabilityBanner.webp';

export const generateMetadata = (): Metadata => {
  return {
    title: 'Probabilidade',
    description: 'Explore os fundamentos da probabilidade e da análise de incertezas com uma abordagem aplicada e didática.',
    keywords: [
      'matemática', 
      'ensino de matemática',
      'probabilidade'
    ],
    openGraph: {
      title: 'Probabilidade',
      description: 'Explore os fundamentos da probabilidade e da análise de incertezas com uma abordagem aplicada e didática.',
      url: 'https://otimath.com/ensino/probabilidade',
      siteName: 'Oti-Math',
      images: [
        {
          url: heroBannerProbabilityImage.src,
          width: 1920,
          height: 650,
          alt: 'Probabilidade',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Probabilidade',
      description: 'Explore os fundamentos da probabilidade e da análise de incertezas com uma abordagem aplicada e didática.',
      images: [heroBannerProbabilityImage.src],
      creator: '@otimath_tech',
    },
    alternates: {
      canonical: 'https://otimath.com/ensino/probabilidade',
    },
    category: 'probabilidade',
  };
};

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
                <Button key="button-1" type="link" href="#aplicacoes" style="primary" size="medium">Conheça nossas aplicações</Button>, 
              ]}
          ></TextBlock>
        }
        image={heroBannerProbabilityImage}
      />
      <Applications />
    </main>
  );
}

/* Example 
  <Probability />
*/