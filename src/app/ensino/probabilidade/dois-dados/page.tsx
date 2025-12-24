import type { Metadata } from "next";
import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { TwoDicesInstructionsSection } from "@/components/teaching/probability/two-dices/TwoDicesInstructionsSection";
import { TwoDicesSection } from "@/components/teaching/probability/two-dices/TwoDicesSection";
import heroBannerTwoDicesImage from '@/images/teaching/probability/two-dices/twoDicesBanner.webp';

export const generateMetadata = (): Metadata => {
  return {
    title: 'Dois Dados',
    description: 'Aprenda a calcular probabilidades em espaços amostrais equiprováveis por meio do lançamento de dois dados.',
    keywords: [
      'matemática', 
      'ensino de matemática',
      'probabilidade',
      'dois-dados',
      'espaço amostral equiprovável'
    ],
    openGraph: {
      title: 'Dois Dados',
      description: 'Aprenda a calcular probabilidades em espaços amostrais equiprováveis por meio do lançamento de dois dados.',
      url: 'https://otimath.com/ensino/probabilidade/dois-dados',
      siteName: 'Oti-Math',
      images: [
        {
          url: heroBannerTwoDicesImage.src,
          width: 1920,
          height: 650,
          alt: 'Dois Dados',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Dois Dados',
      description: 'Aprenda a calcular probabilidades em espaços amostrais equiprováveis por meio do lançamento de dois dados.',
      images: [heroBannerTwoDicesImage.src],
      creator: '@otimath_tech',
    },
    alternates: {
      canonical: 'https://otimath.com/ensino/probabilidade/dois-dados',
    },
    category: 'probabilidade em espaço amostral equiprovável',
  };
};

export default function TwoDices() {
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
    </main>
  );
}

/* Example 
  <TwoDices />
*/
