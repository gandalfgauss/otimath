import type { Metadata } from "next";
import heroBannerTwoDicesImage from '@/images/teaching/probability/two-dices/twoDicesBanner.webp';
import TwoDicesActivity from "@/components/teaching/probability/two-dices/TwoDicesActivity";

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
    <TwoDicesActivity />
  );
}

/* Example 
  <TwoDices />
*/
