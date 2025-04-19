'use client'

import Link from "next/link";
import { Grid } from "./Grid";
import { GridItem } from "./GridItem";
import Image from 'next/image';
import { House } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const links = [
    {"name": <House />, "href": "/"},
    {"name": "Ensino", "href": "/ensino"}
  ]

  return (
    <Grid 
      id="header" 
      backgroundColor='bg-neutral-white'
      styles='shadow-level-4 sticky z-10 top-[0px] h-[68px]'
      tag="header"
    >
      <GridItem cols="col-[1_/_13] max-xlg:col-[1_/_13] max-lg:col-[1_/_13] max-md:col-[1_/_13] max-sm:col-[1_/_13]">
        <div className="flex items-center h-full gap-x-lg">
          <Image alt="Logo da Oti-Math" src="/otimath-icon.png" width={55} height={55} className="w-[55px] h-[55px]"/>
          <div className="flex gap-x-xxs h-full">
            {
              links.map((link, index) => (
                <Link key={index} href={link.href} 
                  className={`ds-body-medium text-brand-corporate-darkest content-center relative 
                    after:content-[''] after:absolute after:bottom-[1px] after:left-0 
                    after:w-full after:h-[4px] after:rounded-pill
                    hover:after:bg-brand-corporate-pure hover:after:opacity-level-soft
                    after:transition-[background-color,opacity] after:duration-300 after:ease-in-out
                    ${pathname === link.href && 'text-brand-corporate-pure after:bg-brand-corporate-pure'}`
                  }
                >
                  {link.name}
                </Link>
              ))
            }
          </div>
        </div>
      </GridItem>
    </Grid>
  );
}


/* Example
<Header />
*/