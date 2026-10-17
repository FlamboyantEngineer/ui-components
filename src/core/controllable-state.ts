import { useState } from 'react';

/**
 * A value the caller may control. A defined `value` wins; otherwise the hook holds its own copy,
 * starting at `defaultValue`. Setting it updates the own copy only when uncontrolled, and always
 * reports the change through `onChange`.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: ((value: T) => void) | undefined,
): [T, (next: T) => void] {
  const [own, setOwn] = useState(defaultValue);
  const isControlled = value !== undefined;
  const setValue = (next: T) => {
    if (!isControlled) setOwn(next);
    onChange?.(next);
  };
  return [isControlled ? value : own, setValue];
}
