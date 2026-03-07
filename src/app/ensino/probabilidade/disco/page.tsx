import type { Metadata } from "next";
import heroBannerRouletteImage from '@/images/teaching/probability/roulette/rouletteBanner.webp';
import RouletteActivity from "@/components/teaching/probability/roulette/RouletteActivity";

export const generateMetadata = (): Metadata => {
  return {
    title: 'Simulador Probabilístico com Disco Aleatório: Frequência Relativa e Probabilidade',
    description: 'Compreenda o conceito de probabilidade como limite da frequência relativa por meio de simulações com disco.',
    keywords: [
      'matemática',
      'ensino de matemática',
      'probabilidade',
      'frequência relativa',
      'lei dos grandes números',
      'espaço amostral equiprovável',
      'espaço amostral não equiprovável',
      'disco aleatório'
    ],
    openGraph: {
      title: 'Simulador Probabilístico com Disco Aleatório — Frequência Relativa e Probabilidade',
      description: 'Compreenda o conceito de probabilidade como limite da frequência relativa por meio de simulações com disco.',
      url: 'https://otimath.com/ensino/probabilidade/disco',
      siteName: 'Oti-Math',
      images: [
        {
          url: heroBannerRouletteImage.src,
          width: 1920,
          height: 650,
          alt: 'Disco dividido em seis setores coloridos',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Simulador Probabilístico com Disco Aleatório — Frequência Relativa e Probabilidade',
      description: 'Compreenda o conceito de probabilidade como limite da frequência relativa por meio de simulações com disco.',
      images: [heroBannerRouletteImage.src],
      creator: '@otimath_tech',
    },
    alternates: {
      canonical: 'https://otimath.com/ensino/probabilidade/disco',
    },
    category: 'probabilidade e frequência relativa',
  };
};

export default function Roleta() {
  return <RouletteActivity />;
}
