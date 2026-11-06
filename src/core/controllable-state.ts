'use client';

import { useRef, useState } from 'react';

/**
 * A value the caller may control. A defined `value` wins; otherwise the hook holds its own copy,
 * starting at `defaultValue`. Setting it updates the own copy only when uncontrolled, and reports
 * the change through `onChange` unless the new value is the current one (`Object.is`), as React
 * Aria's controlled state does.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: ((value: T) => void) | undefined,
): [T, (next: T) => void] {
  const [own, setOwn] = useState(defaultValue);
  const isControlled = value !== undefined;
  const shown = isControlled ? value : own;
  // The last uncontrolled set and the value shown when it was made: a second set before the field
  // renders again compares with the first one's value, not with the value still shown. A controlled
  // set always compares with the controlled value, since the own copy no longer shows.
  const lastSetRef = useRef<{ from: T; to: T } | null>(null);
  const setValue = (next: T) => {
    const last = isControlled ? null : lastSetRef.current;
    const current = last && Object.is(last.from, shown) ? last.to : shown;
    if (Object.is(next, current)) return;
    if (!isControlled) {
      setOwn(next);
      lastSetRef.current = { from: shown, to: next };
    }
    onChange?.(next);
  };
  return [shown, setValue];
}
