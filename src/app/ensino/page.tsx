import type { Metadata } from "next";
import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { Button } from "@/components/global/Button";
import { OurAreas } from "@/components/teaching/OurAreas";
import heroBannerTeachingImage from '@/images/teaching/teachingBanner.webp';


export const generateMetadata = (): Metadata => {
  return {
    title: 'Ensino',
    description: 'Oferecemos soluções educacionais em matemática aplicada, otimização e modelagem computacional.',
    keywords: [
      'matemática', 
      'ensino de matemática',
    ],
    openGraph: {
      title: 'Ensino',
      description: 'Oferecemos soluções educacionais em matemática aplicada, otimização e modelagem computacional.',
      url: 'https://otimath.com/ensino',
      siteName: 'Oti-Math',
      images: [
        {
          url: heroBannerTeachingImage.src,
          width: 1920,
          height: 650,
          alt: 'Ensino',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Ensino',
      description: 'Oferecemos soluções educacionais em matemática aplicada, otimização e modelagem computacional.',
      images: [heroBannerTeachingImage.src],
      creator: '@otimath_tech',
    },
    alternates: {
      canonical: 'https://otimath.com/ensino',
    },
    category: 'educação',
  };
};

export default function Teaching() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
        textBlock={
          <TextBlock 
              overline="Aprenda Matemática" 
              title={<h1 className="ds-heading-giga">Matemática que faz sentido: aprenda praticando e resolvendo problemas</h1>}
              paragraph={
                <p className="ds-body">
                  Da teoria à prática — onde equações se tornam ferramentas e alunos viram solucionadores de problemas.
                  Domine a matemática através de jogos, simulações, desafios e vídeo aulas que vão muito além do ensino mecanicista.
                </p>
              }
              maxWidthParagraph="max-w-[422px]"
              inverse={true}
              innerComponents={[
                <Button key="button-1" type="link" href="#areas-disponiveis" style="primary" size="medium">Consultar áreas</Button>, 
              ]}
          ></TextBlock>
        }
        image={heroBannerTeachingImage}
      />
      <OurAreas />
    </main>
  );
}

/* Example 
  <Teaching />
*/
