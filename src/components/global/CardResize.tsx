import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {StaticImageData} from 'next/image';

interface CardResizeProps {
  image: StaticImageData;
  title?: string;
  href: string;
}

export function CardResize({
  image,
  title,
  href,
}: Readonly<CardResizeProps>) {
  return (
    <Link href={href} 
      className={`
        w-full max-w-[306px] h-[366px] 
        border-solid border-hairline border-neutral-lightest rounded-md
        overflow-hidden relative`}
      >
      <Image src={image} alt={title as string} 
        className='w-full h-full object-cover active:scale-[120%] hover:scale-[120%] transition-[scale] duration-300 ease-in-out'
      />
      <h3 className='ds-body-bold text-brand-corporate-darker absolute top-[8px] left-[8px] z-1 bg-brand-corporate-lighter rounded-pill pt-quarck pb-quarck pl-micro pr-micro'>{title}</h3>
    </Link>
  );
}

/* Example 

<CardResize image={probabilidade} href="/ensino/probabilidade" title="Probabilidade" />

*/