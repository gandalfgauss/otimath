interface GridItemProps {
  children: React.ReactNode;
  cols: string;
  styles?: string;
}

export function GridItem({
  children,
  cols,
  styles,
}: Readonly<GridItemProps>) {
  return (
    <div className={`w-full ${cols} ${styles}`}>
      {children}
    </div>
  );
}


/* Example 

  <GridItem styles="" cols="col-[1_/_12] max-xlg:col-[2_/_11] max-lg:col-[3_/_10] max-md:col-[4_/_9] max-sm:col-[5_/_8]">Texto Aqui</GridItem>

*/
