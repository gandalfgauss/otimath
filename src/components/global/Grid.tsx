import { GridItem } from "./GridItem";

interface GridProps {
  children: React.ReactElement<typeof GridItem> | React.ReactElement<typeof GridItem>[];
  id?: string;
  paddings?: string;
  rowGaps?: string;
}

export function Grid({
  children,
  id,
  paddings,
  rowGaps
}: Readonly<GridProps>) {
  return (
    <section id={id} className={`flex justify-center w-full ${paddings ?? ''}`}>
      <div
        className={`flex w-full max-w-[1216px] ml-xs mr-xs 
          max-xlg:ml-xxs max-xlg:mr-xxs 
          max-lg:ml-xxxs max-lg:mr-xxxs
        `}
      >
        <div className={`grid grid-cols-[repeat(12, 1fr)] gap-x-xs w-full max-xlg:gap-x-xxs max-lg:gap-x-xxxs ${rowGaps ?? ''}`}>
          {children}
        </div>
      </div>
    </section>
  );
}