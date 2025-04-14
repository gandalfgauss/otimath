interface GridItemProps {
  children: React.ReactNode;
  cols: string;
}

export function GridItem({
  children,
  cols
}: Readonly<GridItemProps>) {
  return (
    <div className={`w-full ${cols}`}>
      {children}
    </div>
  );
}