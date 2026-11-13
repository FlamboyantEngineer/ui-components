'use client';

import { useCallback, useState } from 'react';

/** What a hook holds before its setter runs for the current owner. */
const unset: unique symbol = Symbol('unset');

/**
 * State that belongs to `owner`, such as the comparison a view draws: the value last set while
 * `owner` stays the same object, and `initial` again once it is a different one. Each change of owner
 * forgets the value, even one the setter never ran for, so returning to an earlier owner starts from
 * `initial` too. The setter stays the same function while `owner` does.
 */
export function useStateFor<T>(owner: unknown, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<{ owner: unknown; value: T | typeof unset }>({
    owner,
    value: unset,
  });
  if (state.owner !== owner) setState({ owner, value: unset });
  const set = useCallback((value: T) => setState({ owner, value }), [owner]);
  return [state.owner === owner && state.value !== unset ? state.value : initial, set];
}
