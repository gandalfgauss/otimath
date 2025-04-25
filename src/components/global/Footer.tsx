import Link from "next/link";
import { Grid } from "./Grid";
import { GridItem } from "./GridItem";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import Image from 'next/image';
import { Button } from "./Button";

export function Footer() {
  const linksColors = `text-neutral-white hover:text-feedback-info-light active:text-feedback-info-medium
    transition-[color] duration-300 ease-in-out
  `;
  return (
    <Grid 
      id="grid" 
      paddings={`pt-md pb-md
        max-xlg:pt-md max-xlg:pb-md
        max-lg:pt-md max-lg:pb-md
        max-md:pt-md max-md:pb-md
        max-sm:pt-md max-sm:pb-md`} 
      rowGaps='gap-y-xxs max-xlg:gap-y-xxs max-lg:gap-y-xxs max-md:gap-y-xxs max-sm:gap-y-xxs'
      backgroundColor='bg-brand-otimath-dark'
      tag="footer"
    >
      <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex items-center gap-x-xs">
          <Link href="/" className={`ds-body-bold ${linksColors}`}>Home</Link>
          <Link href="/ensino" className={`ds-body-bold ${linksColors}`}>Ensino</Link>
        </div>
      </GridItem>
      <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <hr className="bg-neutral-white w-full h-[2px] mt-xxxs mb-xxxs rounded-md"/>
      </GridItem>
      <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex justify-between">
          <div className="flex flex-col justify-between h-full min-h-[102px]">
            <div className="flex items-center justify-between max-sm:justify-start max-sm:gap-x-xxxs">
              <Link href="https://www.facebook.com/hallidayuzumaki/" target="_blank"><Facebook className={`${linksColors}`} size={20}/></Link>
              <Link href="https://www.instagram.com/hallidaygauss/" target="_blank"><Instagram className={`${linksColors}`} size={20}/></Link>
              <Link href="https://www.linkedin.com/in/halliday-gauss-7322681a0/" target="_blank"><Linkedin className={`${linksColors}`} size={20}/></Link>
              <Link href="mailto:hallidaysantos@gmail.com" target="_blank"><Mail className={`${linksColors}`} size={20}/></Link>
            </div>

            <Button type="link" href="#hero-banner" style="secondary" size="small" inverse={true}>
                Voltar ao início
            </Button>
          </div>

          <Image alt="Logo da Oti-Math" src="/otimath-logo-inverse.svg" width={176} height={102} className="w-[176px] h-[102px]"/>
        </div>
      </GridItem>
    </Grid>
  );
}


/* Example

<Footer />

*/