import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { Button } from "@/components/global/Button";
import { OurAreas } from "@/components/teaching/OurAreas";
import heroBannerTeachingImage from '@/images/teaching/teachingBanner.webp';

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
