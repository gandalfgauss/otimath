'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children?: React.ReactNode;
  style: 'primary' | 'secondary' | 'borderless' | 'neutral';
  size: 'extra-small' | 'small' | 'medium' | 'large';
  icon?: React.ReactElement;
  onClick?: () => void;
  type?: 'button' | 'link';
  href?: string;
  inverse?: boolean;
  interactionEffect?: boolean;
  disabled?: boolean;
}

export function Button({
  children,
  style,
  size,
  icon,
  onClick,
  type = 'button',
  href = '#',
  inverse = false,
  interactionEffect = true,
  disabled = false
}: Readonly<ButtonProps>) {
  const sizesStyles = {
    'extra-small': `ds-small-bold ${children ? 'pt-nano pb-nano pl-quarck pr-quarck' : ''}`,
    'small': `ds-small-bold ${children ? 'pt-macro pb-macro pl-xxxs pr-xxxs' : ''}`,
    'medium': `ds-body-bold ${children ? 'pt-xxxs pb-xxxs pl-xxs pr-xxs' : ''}`,
    'large': `ds-body-large-bold ${children ? 'pt-xxs pb-xxs pl-xs pr-xs' : ''}`,
  };

  const getPrimaryStyles = (inverse: boolean, interactionEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-white text-brand-otimath-pure ${
        interactionEffect 
          ? 'hover:bg-brand-otimath-lighter active:bg-brand-otimath-medium active:text-brand-otimath-darkest' 
          : ''
      }`;
    }
    return `bg-brand-otimath-pure text-neutral-white ${
      interactionEffect 
        ? 'hover:bg-brand-otimath-medium active:bg-brand-otimath-dark' 
        : ''
    }`;
  };
  
  const getSecondaryStyles = (inverse: boolean, interactionEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-transparent text-neutral-white border-thin border-solid border-neutral-white ${
        interactionEffect
          ? 'hover:text-feedback-info-light hover:border-feedback-info-light active:text-feedback-info-medium active:border-feedback-info-medium'
          : ''
      }`;
    }
    return `bg-neutral-transparent text-brand-otimath-pure border-thin border-solid border-brand-otimath-pure ${
      interactionEffect
        ? 'hover:text-brand-otimath-medium hover:border-brand-otimath-medium active:text-brand-otimath-dark active:border-brand-otimath-dark'
        : ''
    }`;
  };
  
  const getBorderlessStyles = (inverse: boolean, interactionEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-transparent text-neutral-white ${
        interactionEffect
          ? 'hover:text-brand-otimath-medium hover:bg-brand-otimath-lighter active:text-brand-otimath-light'
          : ''
      }`;
    }
    return `bg-neutral-transparent text-brand-otimath-pure ${
      interactionEffect
        ? 'hover:text-brand-otimath-medium hover:bg-brand-otimath-lightest active:text-brand-otimath-dark'
        : ''
    }`;
  };

  const getNeutralStyles = (inverse: boolean, interactionEffect: boolean) => {
    if (inverse) {
      return `bg-neutral-transparent text-neutral-white ${
        interactionEffect
          ? 'hover:text-neutral-medium hover:bg-neutral-lighter active:text-neutral-light'
          : ''
      }`;
    }
    return `bg-neutral-transparent text-neutral-dark ${
      interactionEffect
        ? 'hover:text-neutral-medium hover:bg-neutral-lighter active:text-neutral-dark'
        : ''
    }`;
  };
  
  const styleObjects = {
    primary: getPrimaryStyles(inverse, interactionEffect),
    secondary: getSecondaryStyles(inverse, interactionEffect),
    borderless: getBorderlessStyles(inverse, interactionEffect),
    neutral: getNeutralStyles(inverse, interactionEffect)
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
  ? React.cloneElement(icon as React.ReactElement<{ width?: number, height?: number }>, {
      width: iconSize[size],
      height: iconSize[size],
    })
  : null;

  const Component = type === 'link' ? Link : 'button';

  return (
    <Component {...(disabled ? { disabled: true } : {})} href={href} onClick={onClick} className={className}>
      {children}
      {iconElement}
    </Component>
  );
}

/* Example 

<Button
 disable={false} type="link" href="#teste" style="borderless" size="extra-small" icon={<ChevronDown /> inverse={true} interactionEffect={false}
 onClick={async function teste() {
  'use server'
  }}
>
  Botão Secundário
</Button>

*/