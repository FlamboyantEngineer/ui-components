// How a field takes part in its form: submit validation, the browser's constraint validation and
// the focus that touches it.

import { useEffect, useRef, useState } from 'react';
import type { SlotRegistry } from '../../utils/slot-registry.js';
import { useFieldScope } from './field-scope.js';
import type { FieldState } from './field-state.js';

type FieldSlots = SlotRegistry<'root' | 'control'>;

/** An element that takes part in the browser's constraint validation. */
type ValidatableElement = HTMLElement & Pick<HTMLInputElement, 'setCustomValidity'>;

/** Whether the value has an error or is still being checked; a disabled field never blocks. */
export function isFieldBlocking(state: FieldState<unknown>): boolean {
  const { status } = state.realtimeValidation;
  return !state.isDisabled && (status === 'invalid' || status === 'pending');
}

function isValidatable(element: HTMLElement | null): element is ValidatableElement {
  return element !== null && 'setCustomValidity' in element;
}

/**
 * Registers the field with an enclosing form, and in the `native` behavior gives its control the
 * field's error as its custom validity. An `invalid` event (a native submit the browser blocked)
 * shows the field's validation; inside a form, the field's own message replaces the browser's.
 */
export function useFieldFormBinding(
  state: FieldState<unknown>,
  slots: FieldSlots,
  label: string,
): void {
  const { register, onIssuesChange } = useFieldScope();
  const latest = useRef({ state, label });
  latest.current = { state, label };
  const issuesKey = JSON.stringify([
    label,
    state.issues.map(({ severity, message }) => [severity, message]),
  ]);
  const isInForm = Boolean(register);
  const validity =
    state.validationBehavior === 'native' && isFieldBlocking(state)
      ? (state.realtimeValidation.message ?? '')
      : '';
  const isNative = state.validationBehavior === 'native';

  useEffect(() => {
    if (!register) return undefined;
    return register({
      getElement: () => slots.read('root'),
      isBlocking: () => isFieldBlocking(latest.current.state),
      revealValidation: () => latest.current.state.revealValidation(),
      focus: () => slots.read('control')?.focus(),
      getLabel: () => latest.current.label,
      getIssues: () => latest.current.state.issues,
    });
  }, [register, slots]);

  useEffect(() => {
    onIssuesChange?.();
  }, [issuesKey, onIssuesChange]);

  // Runs after every commit: the control element can change while the message stays the same.
  useEffect(() => {
    const control = slots.read('control');
    if (!isNative || !isValidatable(control)) return undefined;
    control.setCustomValidity(validity);
    return () => control.setCustomValidity('');
  });

  useEffect(() => {
    const root = slots.read('root');
    if (!root) return undefined;
    const onInvalid = (event: Event) => {
      const current = latest.current.state;
      current.revealValidation();
      if (isInForm && event.target === slots.read('control') && isFieldBlocking(current)) {
        event.preventDefault();
      }
    };
    root.addEventListener('invalid', onInvalid, true);
    return () => root.removeEventListener('invalid', onInvalid, true);
  }, [slots, isInForm]);
}

/**
 * Whether focus is inside the field, popovers it opens included, and the handlers that track it.
 * Focus moving between the field's parts never leaves it; leaving it touches the field.
 */
export function useFieldFocus({
  touch,
  getRoot,
  isDirty,
}: {
  touch: () => void;
  getRoot: () => HTMLElement | null;
  /** The restore button shows while dirty; focused when the field stops being dirty, it unmounts without a blur. */
  isDirty: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const wasFocused = useRef(false);
  useEffect(() => {
    if (wasFocused.current && !isFocused) touch();
    wasFocused.current = isFocused;
  }, [isFocused, touch]);
  useEffect(() => {
    const active = getRoot()?.ownerDocument.activeElement;
    if (isFocused && (!active || active.localName === 'body')) setIsFocused(false);
  }, [getRoot, isFocused, isDirty]);
  return {
    isFocused,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
}
