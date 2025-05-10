import React from 'react';
import { Grid } from "@/components/global/Grid";
import { GridItem } from '../global/GridItem';
import Image from 'next/image';
import {StaticImageData} from 'next/image';

interface HeroBanner {
  id?: string;
  textBlock: React.ReactNode;
  image: StaticImageData;
}

export function HeroBanner({
  id,
  textBlock,
  image,
}: Readonly<HeroBanner>) {
  return (
    <section id={id} className='w-full h-[650px] relative'>
      <Image src={image} alt="Hero Image" className='w-full h-[650px] absolute top-[0] left-[0] z-0 object-cover'/>
      <div className='w-full h-full absolute top-[0] left-[0] z-1 bg-linear-(--color-gradient-level-2) max-sm:bg-linear-(--color-gradient-level-3)'></div>
      <div className='relative z-2 w-full flex h-full items-center'>
        <Grid 
          tag="div"
        >
          <GridItem cols="col-[1_/_8] max-sm:col-[1_/_13]">
            {textBlock}
          </GridItem>
        </Grid>
      </div>
    </section>
  );
}


/* Example

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

*/