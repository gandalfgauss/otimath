import React from 'react';

interface List {
  children?: React.ReactNode[];
}

export function List({children}: Readonly<List>) {
  return (
    <ul className="list-disc pl-xxs mt-xxxs space-y-micro">
      {children}
    </ul>
  );
}