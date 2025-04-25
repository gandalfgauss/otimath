import { HeroBanner } from "@/components/global/HeroBanner";
import { TextBlock } from "@/components/global/TextBlock";
import { Button } from "@/components/global/Button";
import { PedagogicalTools } from "@/components/home/PedagogicalTools";
import heroBannerHomeImage from '@/images/home/heroBannerHome.webp';

export default function Home() {
  return (
    <main>
      <HeroBanner 
        id="hero-banner"
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
              innerComponents={[
                <Button key="button-1" type="link" href="#ferramentas-pedagogicas" style="primary" size="medium">Nossos Recursos</Button>, 
              ]}
          ></TextBlock>
        }
        image={heroBannerHomeImage}
      />
      <PedagogicalTools />
    </main>
  );
}
