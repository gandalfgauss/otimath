import { HeroBanner } from "@/components/global/HeroBanner";
import { EducationalGames } from "@/components/home/EducationalGames";
import { TextBlock } from "@/components/global/TextBlock";
import heroBannerHomeImage from '@/images/home/heroBannerHome.webp';

export default function Home() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner-home"
        textBlock={
          <TextBlock 
              overline="OTIMIZAÇÃO CIENTÍFICA APLICADA" 
              title={<h1 className="ds-heading-giga">Transforme problemas complexos em soluções eficientes</h1>}
              paragraph={
                <p className="ds-body">
                  Unindo matemática aplicada, IA e otimização, criamos tanto soluções empresariais customizadas quanto ferramentas educacionais inovadoras - transformando problemas em resultados e teoria em aprendizado tangível. 
                </p>
              }
              maxWidthParagraph="max-w-[422px]"
              inverse={true}
          ></TextBlock>
        }
        image={heroBannerHomeImage}
      />
      <EducationalGames />
    </main>
  );
}
