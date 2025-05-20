import React from 'react';

interface ListProps {
  removeMarker?: boolean;
  children?: React.ReactNode[];
}

export function List({children, removeMarker}: Readonly<ListProps>) {
  return (
    <ul className={`${removeMarker ? 'list-none' : 'list-disc'} pl-xxs mt-xxxs space-y-micro`}>
      {children}
    </ul>
  );
}

/* Example
<List>
  <li>Reforçar a compreensão conceitual através de aprendizagem ativa</li>
  <li>Desenvolver raciocínio lógico-matemático progressivamente</li>
  <li>Oferecer avaliação formativa com feedback imediato</li>
  <li>Suportar diferentes estilos de aprendizagem</li>
</List>
*/