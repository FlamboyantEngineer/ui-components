'use client';

import { useId, useState } from 'react';

export function useReadingSelection() {
  const prefix = useId();
  const [current, setCurrent] = useState<string>();
  const rowId = (key: string) => prefix + '-' + encodeURIComponent(JSON.stringify(key));
  return {
    current,
    rowId,
    select: (key: string, owner?: Document) => {
      setCurrent(key);
      owner?.getElementById(rowId(key))?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    },
  };
}
