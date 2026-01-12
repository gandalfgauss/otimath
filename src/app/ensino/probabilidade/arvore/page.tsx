import type { Metadata } from "next";
import heroBannerTreeImage from '@/images/teaching/probability/tree/treeBanner.webp';
import TreeActivity from "@/components/teaching/probability/tree/TreeActivity";

export const generateMetadata = (): Metadata => {
  return {
    title: 'Árvore',
    description: 'Aprenda a calcular probabilidades utilizando árvores de probabilidade e eventos condicionais.',
    keywords: [
      'matemática', 
      'ensino de matemática',
      'probabilidade',
      'árvore',
      'probabilidade condicional',
    ],
    openGraph: {
      title: 'Árvore',
      description: 'Aprenda a calcular probabilidades utilizando árvores de probabilidade e eventos condicionais.',
      url: 'https://otimath.com/ensino/probabilidade/arvore',
      siteName: 'Oti-Math',
      images: [
        {
          url: heroBannerTreeImage.src,
          width: 1920,
          height: 650,
          alt: 'Árvore',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Árvore',
      description: 'Aprenda a calcular probabilidades utilizando árvores de probabilidade e eventos condicionais.',
      images: [heroBannerTreeImage.src],
      creator: '@otimath_tech',
    },
    alternates: {
      canonical: 'https://otimath.com/ensino/probabilidade/arvore',
    },
    category: 'probabilidade condicional',
  };
};

export default function Tree() {
  return (
    <TreeActivity />
  );
}

/* Example 
  <Tree />
*/
