import type { Metadata } from "next";
import heroBannerProbabilityImage from '@/images/teaching/probability/probabilityBanner.webp';

export const metadata: Metadata = {
  title: 'Sequência Didática — Probabilidade',
  description: 'Conheça a sequência didática estruturada que orienta os Objetos Virtuais de Aprendizagem de Probabilidade do Oti-Math.',
  keywords: [
    'matemática',
    'ensino de matemática',
    'probabilidade',
    'sequência didática',
    'trilha de aprendizagem',
  ],
  openGraph: {
    title: 'Sequência Didática — Probabilidade',
    description: 'Conheça a sequência didática estruturada que orienta os Objetos Virtuais de Aprendizagem de Probabilidade do Oti-Math.',
    url: 'https://otimath.com/ensino/probabilidade/sequencia-didatica',
    siteName: 'Oti-Math',
    images: [
      {
        url: heroBannerProbabilityImage.src,
        width: 1920,
        height: 650,
        alt: 'Sequência Didática de Probabilidade',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sequência Didática — Probabilidade',
    description: 'Conheça a sequência didática estruturada que orienta os Objetos Virtuais de Aprendizagem de Probabilidade do Oti-Math.',
    images: [heroBannerProbabilityImage.src],
    creator: '@otimath_tech',
  },
  alternates: {
    canonical: 'https://otimath.com/ensino/probabilidade/sequencia-didatica',
  },
  category: 'sequência didática',
};

export default function DidacticSequenceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
