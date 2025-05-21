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
      paddings={`pt-md pb-md`} 
      rowGaps='gap-y-xxs'
      backgroundColor='bg-brand-otimath-dark'
      tag="footer"
    >
      <GridItem cols="col-[1_/_13]">
        <ul className="flex items-center gap-x-xs">
          <li><Link href="/" className={`ds-body-bold ${linksColors}`}>Home</Link></li>
          <li><Link href="/ensino" className={`ds-body-bold ${linksColors}`}>Ensino</Link></li>
        </ul>
      </GridItem>
      <GridItem cols="col-[1_/_13]">
        <hr className="bg-neutral-white w-full h-[2px] mt-xxxs mb-xxxs rounded-md"/>
      </GridItem>
      <GridItem cols="col-[1_/_13]">
        <div className="flex justify-between">
          <div className="flex flex-col justify-between h-full min-h-[102px]">
            <ul className="flex items-center justify-between max-sm:justify-start max-sm:gap-x-xxxs">
              <li><Link href="https://www.facebook.com/hallidayuzumaki/" target="_blank"><Facebook className={`${linksColors}`} size={20}/></Link></li>
              <li><Link href="https://www.instagram.com/hallidaygauss/" target="_blank"><Instagram className={`${linksColors}`} size={20}/></Link></li>
              <li><Link href="https://www.linkedin.com/in/halliday-gauss-7322681a0/" target="_blank"><Linkedin className={`${linksColors}`} size={20}/></Link></li>
              <li><Link href="mailto:hallidaysantos@gmail.com" target="_blank"><Mail className={`${linksColors}`} size={20}/></Link></li>
            </ul>

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