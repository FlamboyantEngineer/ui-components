'use client';

// How a field takes part in its form: submit validation, the browser's constraint validation and
// a native reset.

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { hasNativeFormOwner } from '../../utils/form-owner.js';
import { getTreeRoot } from '../../utils/owner-window.js';
import type { SlotRegistry } from '../../utils/slot-registry.js';
import { useLatest } from '../../utils/use-latest.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { isOwnFieldTarget } from './field-root.js';
import { useFieldScope } from './field-scope.js';
import { fieldReset, type FieldResetContract, type FieldState } from './field-state.js';
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

/** The chosen option of a group of choices, where focus enters the group. */
const chosenSelector = [
  'input[type="radio"]:checked:not([disabled])',
  '[role="radio"][aria-checked="true"]:not([disabled])',
].join(',');

/**
 * Focuses the control, or when it is a group the element focus enters it by: its chosen option,
 * such as a segment or radio, else its first focusable element, such as the first date segment.
 */
export function focusControl(control: HTMLElement | null, options?: FocusOptions) {
  if (!control) return;
  const target = control.matches(focusableSelector)
    ? control
    : (control.querySelector<HTMLElement>(chosenSelector) ??
      control.querySelector<HTMLElement>(focusableSelector) ??
      control);
  target.focus(options);
}

function isValidatable(element: HTMLElement | null): element is ValidatableElement {
  return element !== null && 'setCustomValidity' in element;
}

/**
 * The form the control belongs to: a native control's own `form` owner, null included, else the
 * form around the field.
 */
function findForm(slots: FieldSlots): HTMLFormElement | null {
  const control = slots.read('control');
  if (control && hasNativeFormOwner(control)) return control.form;
  return slots.read('root')?.closest('form') ?? null;
}

/** The change hold and value equality the field state keeps for a native reset, when it has them. */
function readResetContract(state: FieldState<unknown>): FieldResetContract<unknown> | undefined {
  return (state as FieldState<unknown> & { [fieldReset]?: FieldResetContract<unknown> })[
    fieldReset
  ];
}

/**
 * A native form reset puts back the value the field had when it mounted, as the browser does for its
 * own controls, so every field control resets alike whatever element it renders. The field holds
 * its changes from the moment the reset starts (the capture phase of its tree's root) until every listener
 * has seen it, so a building block that resets itself waits too; then a reset a listener cancelled
 * (`preventDefault`) changes nothing, and any other puts the initial value back unless the field's
 * own value equality finds it already there.
 */
function useFormReset(state: FieldState<unknown>, slots: FieldSlots) {
  const latest = useLatest(state);
  const [initial] = useState(() => state.value);
  useEffect(() => {
    const node = slots.read('root') ?? slots.read('control');
    const view = node?.ownerDocument.defaultView;
    if (!node || !view) return undefined;
    // A reset does not leave a shadow root, so the listener sits on the root of the field's tree.
    const root = getTreeRoot(node);
    // The same hold for the field's whole life.
    const hold = readResetContract(latest.current)?.hold;
    let timer: number | undefined;
    const restore = (event: Event) => {
      if (hold) hold.isHeld = false;
      if (event.defaultPrevented) return;
      // The field's own equality, as its dirty state and history use, decides whether to restore.
      const isEqual = readResetContract(latest.current)?.isEqual ?? isFieldValueEqual;
      if (!isEqual(latest.current.value, initial)) latest.current.setValue(initial);
    };
    const onReset = (event: Event) => {
      // The form that owns the control now, read at each reset, so a control moved to another
      // form (its `form` attribute, a form replaced) follows its current owner.
      const form = findForm(slots);
      if (!form || event.target !== form) return;
      if (hold) hold.isHeld = true;
      view.clearTimeout(timer);
      timer = view.setTimeout(() => restore(event), 0);
    };
    root.addEventListener('reset', onReset, true);
    return () => {
      view.clearTimeout(timer);
      if (hold) hold.isHeld = false;
      root.removeEventListener('reset', onReset, true);
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
  const { register, onIssuesChange, onValidityChange, reveal } = useFieldScope();
  const latest = useLatest({ state, label, reveal });
  const issues = useStableArray(
    state.issues.map(({ severity, message }) => ({ severity, message })),
  );
  const isBlocking = isFieldBlocking(state);
  const { status, message } = state.realtimeValidation;
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
      focus: () => {
        // Opens what hides the field first, so the control can take focus.
        const { reveal: show } = latest.current;
        if (show) flushSync(show);
        focusControl(slots.read('control'));
      },
      getLabel: () => latest.current.label,
      getIssues: () => latest.current.state.issues,
      getRealtimeValidation: () => latest.current.state.realtimeValidation,
    });
  }, [register, slots, latest]);

  useEffect(() => {
    onIssuesChange?.();
  }, [label, issues, onIssuesChange]);

  useEffect(() => {
    onValidityChange?.();
  }, [label, isBlocking, status, message, onValidityChange]);

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
      // A field nested inside this one, such as in its description, reports its own control.
      if (!isOwnFieldTarget(root, event.target)) return;
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
