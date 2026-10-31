'use client';

import { useState } from 'react';

/**
 * `value`, or the one an earlier render returned while `isEqual` holds between them, so a value
 * rebuilt on each render keeps its identity for `memo`, `useMemo` and effects. A value that is not
 * equal is kept from then on: the render that brings it stores it and renders once more.
 */
export function useEqualValue<T>(value: T, isEqual: (kept: T, next: T) => boolean): T {
  const [kept, setKept] = useState(() => value);
  if (Object.is(kept, value) || isEqual(kept, value)) return kept;
  setKept(() => value);
  return value;
}
