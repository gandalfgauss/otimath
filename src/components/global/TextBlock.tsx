import React from 'react';

interface TextBlock {
  overline?: string;
  title?:  React.ReactNode;
  paragraph?: React.ReactNode;
  maxWidthParagraph?: string;
  innerComponents?: React.ReactNode[];
  inverse?: boolean;
}

export function TextBlock({
  overline,
  title,
  paragraph,
  maxWidthParagraph,
  innerComponents,
  inverse,
}: Readonly<TextBlock>) {


  return (
    <div className={`${inverse ? 'text-neutral-white' : 'text-brand-otimath-pure'} w-full flex flex-col gap-xs`}>
      <div className='flex flex-col gap-xxxs'>
        {overline && <span className={`ds-overline ${inverse ? 'text-neutral-white' : 'text-brand-otimath-dark'}`}>{overline}</span>}
        {title}
        <div className={`${inverse ? 'text-neutral-white' : 'text-neutral-dark'} ${maxWidthParagraph ?? ''}`}>{paragraph}</div>
      </div>
      {innerComponents &&
        <div className='flex gap-xxxs'>
          {innerComponents}	
        </div>
    }
    </div>
  );
}


/* Example

<TextBlock 
  overline="Lorem" 
  title={<h2 className="ds-heading-ultra">Lorem ipsum odor amet, consectetuer adipiscing</h2>}
  paragraph={<span className="ds-body">Lorem ipsum odor amet, consectetuer adipiscing elit. Maximus elementum elementum at; eu bibendum viverra. Blandit ex pharetra ac, elementum est efficitur a lobortis.</span>}
  maxWidthParagraph="max-w-[592px]"
  innerComponents={[
    <Button key="button-1" style="borderless" size="extra-small">Teste</Button>, 
    <Button key="button-2" style="borderless" size="extra-small">Teste</Button>
  ]}
  inverse={false}
></TextBlock>

*/