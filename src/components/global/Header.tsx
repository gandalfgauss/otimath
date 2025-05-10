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
      <GridItem cols="col-[1_/_13]">
        <div className="flex items-center h-full gap-x-lg">
          <Image alt="Logo da Oti-Math" src="/otimath-icon.png" width={55} height={55} className="w-[55px] h-[55px]"/>
          <div className="flex gap-x-xxs h-full">
            {
              links.map((link, index) => (
                <div key={index} 
                  className={`
                    h-full flex items-center relative text-brand-otimath-darkest
                    transition-[color,opacity] duration-300 ease-in-out

                    after:content-[''] after:absolute after:bottom-[1px] after:left-0 
                    after:w-full after:h-[4px] after:rounded-pill
                    after:transition-[background-color,opacity] after:duration-300 after:ease-in-out
                    ${(pathname === link.href || (pathname.startsWith(link.href) && link.href.length > 1)) ? 
                      'text-brand-otimath-pure after:bg-brand-otimath-pure' : 
                      `has-hover:text-brand-otimath-medium has-active:text-brand-otimath-dark has-active:opacity-level-semiopaque
                        has-hover:after:bg-brand-otimath-pure has-hover:after:opacity-level-soft
                        has-active:after:bg-brand-otimath-dark has-active:after:opacity-level-semiopaque
                      `
                    }`
                  }>
                    <Link href={link.href} 
                      className='ds-body-bold'
                    >
                      {link.name}
                    </Link>
                </div>
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