

export function GridItem({
  children,
  cols
}: Readonly<{
  children: React.ReactNode,
  cols: string
}>) {
  return (
    <div className={`w-full ${cols}`}>
      {children}
    </div>
  );
}