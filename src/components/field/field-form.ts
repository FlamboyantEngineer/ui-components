'use client';

// How a field takes part in its form: submit validation, the browser's constraint validation and
// a native reset.

import { useEffect, useState } from 'react';
import type { SlotRegistry } from '../../utils/slot-registry.js';
import { useLatest } from '../../utils/use-latest.js';
import { useFieldScope } from './field-scope.js';
import { fieldChangeHold, type FieldChangeHold, type FieldState } from './field-state.js';
import { isFieldValueEqual } from './field-value.js';

type FieldSlots = SlotRegistry<'root' | 'control'>;

/** An element that takes part in the browser's constraint validation. */
type ValidatableElement = HTMLElement & Pick<HTMLInputElement, 'setCustomValidity'>;

/** Whether the value has an error or is still being checked; a disabled field never blocks. */
function isFieldBlocking(state: FieldState<unknown>): boolean {
  const { status } = state.realtimeValidation;
  return !state.isDisabled && (status === 'invalid' || status === 'pending');
}

const focusableSelector = [
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Focuses the control, or its first focusable element when it is a group, such as date segments. */
function focusControl(control: HTMLElement | null) {
  if (!control) return;
  const target = control.matches(focusableSelector)
    ? control
    : (control.querySelector<HTMLElement>(focusableSelector) ?? control);
  target.focus();
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

/** The hold the field state keeps for a native reset, when the state has one. */
function readHold(state: FieldState<unknown>): FieldChangeHold | undefined {
  return (state as FieldState<unknown> & { [fieldChangeHold]?: FieldChangeHold })[fieldChangeHold];
}

/**
 * A native form reset puts back the value the field had when it mounted, as the browser does for its
 * own controls, so every field control resets alike whatever element it renders. The field holds
 * its changes from the moment the reset starts (the document's capture phase) until every listener
 * has seen it, so a building block that resets itself waits too; then a reset a listener cancelled
 * (`preventDefault`) changes nothing, and any other puts the initial value back.
 */
function useFormReset(state: FieldState<unknown>, slots: FieldSlots) {
  const latest = useLatest(state);
  const [initial] = useState(() => state.value);
  useEffect(() => {
    const form = findForm(slots);
    const document = form?.ownerDocument;
    const view = document?.defaultView;
    if (!form || !document || !view) return undefined;
    // The same hold for the field's whole life.
    const hold = readHold(latest.current);
    let timer: number | undefined;
    const restore = (event: Event) => {
      if (hold) hold.isHeld = false;
      if (event.defaultPrevented) return;
      if (!isFieldValueEqual(latest.current.value, initial)) latest.current.setValue(initial);
    };
    const onReset = (event: Event) => {
      if (event.target !== form) return;
      if (hold) hold.isHeld = true;
      view.clearTimeout(timer);
      timer = view.setTimeout(() => restore(event), 0);
    };
    document.addEventListener('reset', onReset, true);
    return () => {
      view.clearTimeout(timer);
      if (hold) hold.isHeld = false;
      document.removeEventListener('reset', onReset, true);
    };
  }, [slots, initial, latest]);
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
  const { register, onIssuesChange, onValidityChange } = useFieldScope();
  const latest = useLatest({ state, label });
  const issuesKey = JSON.stringify([
    label,
    state.issues.map(({ severity, message }) => [severity, message]),
  ]);
  const validityKey = JSON.stringify([
    label,
    isFieldBlocking(state),
    state.realtimeValidation.status,
    state.realtimeValidation.message,
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
      focus: () => focusControl(slots.read('control')),
      getLabel: () => latest.current.label,
      getIssues: () => latest.current.state.issues,
      getRealtimeValidation: () => latest.current.state.realtimeValidation,
    });
  }, [register, slots, latest]);

  useEffect(() => {
    onIssuesChange?.();
  }, [issuesKey, onIssuesChange]);

  useEffect(() => {
    onValidityChange?.();
  }, [validityKey, onValidityChange]);

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
  }, [slots, isInForm, latest]);
}
