'use client';

import { useCallback, useState } from 'react';

/**
 * State that belongs to `owner`, such as the comparison a view draws: the value last set while
 * `owner` stays the same object, and `initial` again once it is a different one. The setter stays
 * the same function while `owner` does.
 */
export function useStateFor<T>(owner: unknown, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState({ owner, value: initial });
  const set = useCallback((value: T) => setState({ owner, value }), [owner]);
  return [state.owner === owner ? state.value : initial, set];
}
