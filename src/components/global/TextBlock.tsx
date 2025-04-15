import React from 'react';

interface TextBlock {
  overline?: string;
  title?:  React.ReactNode;
  paragraph?: React.ReactNode;
  maxWidthParagraph?: string;
  innerComponents?: React.ReactNode[];
}

export function TextBlock({
  overline,
  title,
  paragraph,
  maxWidthParagraph,
  innerComponents,
}: Readonly<TextBlock>) {


  return (
    <div className='text-brand-corporate-pure w-full flex flex-col gap-xs'>
      <div className='flex flex-col gap-xxxs'>
        {overline && <span className='ds-overline text-brand-corporate-dark'>{overline}</span>}
        {title}
        <div className={`text-neutral-dark ${maxWidthParagraph ?? ''}`}>{paragraph}</div>
      </div>
      <div className='flex gap-xxxs'>
        {innerComponents}	
      </div>
    </div>
  );
}


/* Example

<TextBlock 
  overline="Lorem" 
  title={<h2 className="ds-heading-ultra">Lorem ipsum odor amet, consectetuer adipiscing</h2>}
  paragraph={<p className="ds-body">Lorem ipsum odor amet, consectetuer adipiscing elit. Maximus elementum elementum at; eu bibendum viverra. Blandit ex pharetra ac, elementum est efficitur a lobortis.</p>}
  maxWidthParagraph="max-w-[592px]"
  innerComponents={[
    <Button key="button-1" style="borderless" size="extra-small">Teste</Button>, 
    <Button key="button-2" style="borderless" size="extra-small">Teste</Button>
  ]}
></TextBlock>

*/