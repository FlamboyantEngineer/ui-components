// How a field takes part in its form: submit validation, the browser's constraint validation and
// a native reset.

import { useEffect, useRef, useState } from 'react';
import type { SlotRegistry } from '../../utils/slot-registry.js';
import { useFieldScope } from './field-scope.js';
import type { FieldState } from './field-state.js';
import { isFieldValueEqual } from './field-value.js';

type FieldSlots = SlotRegistry<'root' | 'control'>;

/** An element that takes part in the browser's constraint validation. */
type ValidatableElement = HTMLElement & Pick<HTMLInputElement, 'setCustomValidity'>;

/** Whether the value has an error or is still being checked; a disabled field never blocks. */
function isFieldBlocking(state: FieldState<unknown>): boolean {
  const { status } = state.realtimeValidation;
  return !state.isDisabled && (status === 'invalid' || status === 'pending');
}

function isValidatable(element: HTMLElement | null): element is ValidatableElement {
  return element !== null && 'setCustomValidity' in element;
}

/** The form the control belongs to (its `form` owner when it has one), else the enclosing form. */
function findForm(slots: FieldSlots): HTMLFormElement | null {
  const control = slots.read('control');
  if (control && 'form' in control && control.form instanceof HTMLFormElement) return control.form;
  return slots.read('root')?.closest('form') ?? null;
}

/**
 * A native form reset puts back the value the field had when it mounted, as the browser does for its
 * own controls, so every field control resets alike whatever element it renders. It runs once the
 * reset is over, so a control whose building block already reset the value is left alone.
 */
function useFormReset(state: FieldState<unknown>, slots: FieldSlots) {
  const latest = useRef(state);
  latest.current = state;
  const [initial] = useState(() => state.value);
  useEffect(() => {
    const form = findForm(slots);
    const view = form?.ownerDocument.defaultView;
    if (!form || !view) return undefined;
    let timer: number | undefined;
    const restore = () => {
      if (!isFieldValueEqual(latest.current.value, initial)) latest.current.setValue(initial);
    };
    const onReset = () => {
      view.clearTimeout(timer);
      timer = view.setTimeout(restore, 0);
    };
    form.addEventListener('reset', onReset);
    return () => {
      view.clearTimeout(timer);
      form.removeEventListener('reset', onReset);
    };
  }, [slots, initial]);
}

/**
 * Registers the field with an enclosing form, and in the `native` behavior gives its control the
 * field's error as its custom validity. An `invalid` event (a native submit the browser blocked)
 * shows the field's validation; inside a form, the field's own message replaces the browser's. A
 * native reset puts the initial value back.
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
  useFormReset(state, slots);

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
