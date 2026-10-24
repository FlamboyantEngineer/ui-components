import { useState } from 'react';

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
  // Updated by each uncontrolled set, so a second set in the same event compares with the first.
  let current = shown;
  const setValue = (next: T) => {
    if (Object.is(next, current)) return;
    if (!isControlled) {
      setOwn(next);
      current = next;
    }
    onChange?.(next);
  };
  return [shown, setValue];
}
