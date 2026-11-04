'use client';

import { type Ref, type RefObject, useRef, useState } from 'react';
import { useControllableState } from '../core/controllable-state.js';
import { useMergedRefs } from './use-merged-refs.js';
import { type NativeResetOptions, useNativeReset } from './use-native-reset.js';

interface ResetHeldValueOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  /** The element whose form resets the value. */
  ref: RefObject<Element | null>;
}

/**
 * A value, controlled by the caller or held here, for a React Aria control that resets itself on its
 * form's own `reset` listener, which runs before a listener that cancels the reset. Pass `value` and
 * `onChange` to React Aria: changes it makes while a native reset is under way are held, then the
 * reset applies the value the control had when it mounted, once every listener has seen it, and
 * never when one cancelled it. A controlled control reports that value through `onChange` once.
 */
export function useResetHeldValue<T>(
  { value, defaultValue, onChange, ref }: ResetHeldValueOptions<T>,
  options?: NativeResetOptions,
) {
  const [current, setCurrent] = useControllableState(value, defaultValue, onChange);
  const [initial] = useState(current);
  const isResetting = useNativeReset(ref, () => setCurrent(initial), options);
  return {
    value: current,
    onChange: (next: T) => {
      if (!isResetting()) setCurrent(next);
    },
  };
}

/** A ref to the control's input that also forwards it to the caller's ref. */
export function useInputRef<T extends Element>(given: Ref<T> | undefined) {
  const ref = useRef<T>(null);
  return { ref, setRef: useMergedRefs(ref, given) };
}
