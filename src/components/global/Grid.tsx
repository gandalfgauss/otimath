import { GridItem } from "./GridItem";

export function Grid({
  children,
  paddings,
  rowGaps
}: Readonly<{
  children: React.ReactElement<typeof GridItem> | React.ReactElement<typeof GridItem>[],
  paddings?: string,
  rowGaps?: string,
}>) {
  return (
    <section className={`flex justify-center w-full ${paddings ?? ''}`}>
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