import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {StaticImageData} from 'next/image';

interface CardResizeProps {
  image: StaticImageData;
  alt: string;
  category?: string;
  title?: string;
  href: string;
}

export function CardResize({
  image,
  alt,
  category,
  title,
  href,
}: Readonly<CardResizeProps>) {
  return (
    <Link href={href} className='relative h-[366px] w-full max-w-[306px] border-solid border-hairline border-neutral-lightest overflow-hidden rounded-md group'>
      <Image src={image} alt={alt} 
        className='w-full h-full object-cover group-hover:scale-[120%] group-active:scale-[120%] transition-[scale] duration-300 ease-in-out'
      />
      <span className='ds-body-bold text-brand-otimath-darker ml-micro mr-micro absolute top-[8px] z-2 bg-brand-otimath-lighter rounded-pill pt-quarck pb-quarck pl-micro pr-micro text-center'>{category}</span>
      {title && <h3 className='absolute z-3 bottom-[8px] ml-micro mr-micro ds-body-large-bold text-neutral-white transition-[color] duration-300 ease-in-out group-hover:text-neutral-light group-active:text-neutral-medium'>{title}</h3>}
      <span className='absolute w-full h-full top-0 left-0 z-1 bg-linear-(--color-gradient-level-4)'></span>
    </Link>
  );
}

/* Example 

<CardResize image={probabilidade} alt="" href="/ensino/probabilidade" category="Probabilidade" title="Dois dados" />

*/