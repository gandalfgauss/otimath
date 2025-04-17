import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children?: React.ReactNode;
  style: 'primary' | 'secondary' | 'borderless';
  size: 'extra-small' | 'small' | 'medium' | 'large';
  icon?: React.ReactElement;
  onClickFunction?: () => void;
  as?: 'button' | 'link';
  href?: string;
  inverse?: boolean;
  interationEffect?: boolean;
}

export function Button({
  children,
  style,
  size,
  icon,
  onClickFunction,
  as = 'button',
  href = '#',
  inverse = false,
  interationEffect = true,
}: Readonly<ButtonProps>) {
  const sizesStyles = {
    'extra-small': `ds-small-bold ${children && 'pt-nano pb-nano pl-quarck pr-quarck'}`,
    'small': `ds-small-bold ${children && 'pt-macro pb-macro pl-xxxs pr-xxxs'}`,
    'medium': `ds-body-bold ${children && 'pt-xxxs pb-xxxs pl-xxs pr-xxs'}`,
    'large': `ds-body-large-bold ${children && 'pt-xxs pb-xxs pl-xs pr-xs'}`,
  };

  const getPrimaryStyles = (inverse: boolean, interationEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-white text-brand-corporate-pure ${
        interationEffect 
          ? 'hover:bg-brand-corporate-lighter active:bg-brand-corporate-medium active:bg-brand-corporate-darkest' 
          : ''
      }`;
    }
    return `bg-brand-corporate-pure text-neutral-white ${
      interationEffect 
        ? 'hover:bg-brand-corporate-medium active:bg-brand-corporate-dark' 
        : ''
    }`;
  };
  
  const getSecondaryStyles = (inverse: boolean, interationEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-transparent text-neutral-white border-thin border-solid border-neutral-white ${
        interationEffect
          ? 'hover:text-brand-corporate-medium hover:border-brand-corporate-medium active:text-brand-corporate-dark hover:border-brand-corporate-dark'
          : ''
      }`;
    }
    return `bg-neutral-transparent text-brand-corporate-pure border-thin border-solid border-brand-corporate-pure ${
      interationEffect
        ? 'hover:text-brand-corporate-lighter hover:border-brand-corporate-lighter active:text-brand-corporate-light hover:border-brand-corporate-light'
        : ''
    }`;
  };
  
  const getBorderlessStyles = (inverse: boolean, interationEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-transparent text-neutral-white ${
        interationEffect
          ? 'hover:text-brand-corporate-medium hover:bg-brand-corporate-lighter active:text-brand-corporate-light'
          : ''
      }`;
    }
    return `bg-neutral-transparent text-brand-corporate-pure ${
      interationEffect
        ? 'hover:text-brand-corporate-medium hover:bg-brand-corporate-lightest active:text-brand-corporate-dark'
        : ''
    }`;
  };
  
  const styleObjects = {
    primary: getPrimaryStyles(inverse, interationEffect),
    secondary: getSecondaryStyles(inverse, interationEffect),
    borderless: getBorderlessStyles(inverse, interationEffect)
  };

  const className = `flex justify-center items-center gap-micro whitespace-nowrap ${children ? 'rounded-md' : 'rounded-circular'} cursor-pointer w-fit h-fit
                    transition-[background-color,opacity, border] duration-300 ease-in-out 
                    disabled:opacity-level-light disabled:pointer-events-none
                    ${styleObjects[style]} ${sizesStyles[size]}`;

  const iconSize = {
    'extra-small': 16,
    'small': 16,
    'medium': 24,
    'large': 32,
  };

  const iconElement = React.isValidElement(icon)
  ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
      size: iconSize[size],
    })
  : null;

  const Component = as === 'link' ? Link : 'button';

  return (
    <Component href={href} onClick={onClickFunction} className={className}>
      {children}
      {iconElement}
    </Component>
  );
}

/* Example 

<Button
 as="link" href="#teste" style="borderless" size="extra-small" icon={<ChevronDown /> inverse={true} interationEffect={false}/>}
 onClickFunction={async function teste() {
  'use server'
  }}
>
  Botão Secundário
</Button>

*/