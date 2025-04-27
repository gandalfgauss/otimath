import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {StaticImageData} from 'next/image';

interface CardResizeProps {
  image: StaticImageData;
  category?: string;
  title?: string;
  href: string;
}

export function CardResize({
  image,
  category,
  title,
  href,
}: Readonly<CardResizeProps>) {
  return (
    <Link href={href} className='w-full max-w-[306px] flex flex-col gap-y-macro group'>
      <div 
        className={`
          shrink-0
          w-full h-[366px] 
          border-solid border-hairline border-neutral-lightest rounded-md
          overflow-hidden relative`}
      >
        <Image src={image} alt={category as string} 
          className='w-full h-full object-cover group-hover:scale-[120%] group-active:scale-[120%] transition-[scale] duration-300 ease-in-out'
        />
        <span className='ds-body-bold text-brand-otimath-darker ml-micro mr-micro absolute top-[8px] z-1 bg-brand-otimath-lighter rounded-pill pt-quarck pb-quarck pl-micro pr-micro'>{category}</span>
      </div>
      {title && <h3 className='ds-body-large-bold text-brand-otimath-darker transition-[color] duration-300 ease-in-out group-hover:text-brand-otimath-pure group-active:text-brand-otimath-pure'>{title}</h3>}
    </Link>
  );
}

/* Example 

<CardResize image={probabilidade} href="/ensino/probabilidade" category="Probabilidade" title="Dois dados" />

*/