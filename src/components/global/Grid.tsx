import { GridItem } from "./GridItem";

interface GridProps {
  children: React.ReactElement<typeof GridItem> | React.ReactElement<typeof GridItem>[];
  id?: string;
  paddings?: string;
  rowGaps?: string;
  backgroundColor?: string;
  tag?: React.ElementType;
  styles?: string;
}

export function Grid({
  children,
  id,
  paddings = '',
  rowGaps,
  backgroundColor = '',
  tag: Tag = 'section',
  styles = '',
}: Readonly<GridProps>) {
  return (
    <Tag id={id} className={`flex justify-center w-full ${styles} ${paddings} ${backgroundColor}`}>
      <div
        className={`flex w-full max-w-[1216px] ml-xs mr-xs 
          max-xlg:ml-xxs max-xlg:mr-xxs 
          max-lg:ml-xxxs max-lg:mr-xxxs
        `}
      >
        <div className={`grid grid-cols-[repeat(12,1fr)] gap-x-xs w-full max-xlg:gap-x-xxs max-lg:gap-x-xxxs ${rowGaps ?? ''}`}>
          {children}
        </div>
      </div>
    </Tag>
  );
}

/* Example 

<Grid 
  id="grid" 
  paddings={`pt-xxl pb-xxl 
    max-xlg:pt-xxl max-xlg:pb-xxl
    max-lg:pt-xl max-lg:pb-xl
    max-md:pt-xl max-md:pb-xl
    max-sm:pt-xl max-sm:pb-xl`} 
  rowGaps='gap-y-xs max-xlg:gap-y-xs max-lg:gap-y-xs max-md:gap-y-xs max-sm:gap-y-xs'
  backgroundColor='bg-linear-(--color-gradient-level-1)'
  tag="section"
  styles=""
>
  <GridItem cols="col-[1_/_12] max-xlg:col-[1_/_12] max-lg:col-[3_/_10] max-md:col-[4_/_9] max-sm:col-[5_/_8]">Componente</GridItem>
</Grid>

*/
