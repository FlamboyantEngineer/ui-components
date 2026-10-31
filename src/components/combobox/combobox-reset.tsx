'use client';

import { useContext, useRef, useState, type RefObject } from 'react';
import { ComboBoxStateContext, type Key } from '../../primitives/index.js';
import { useNativeReset } from '../../utils/use-native-reset.js';

/** The value React Aria's combobox state holds: a key, a list of keys, or none. */
export type ComboboxStateValue = Key | Key[] | null;

function isSameValue(left: ComboboxStateValue, right: ComboboxStateValue): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((key, index) => Object.is(key, right[index]));
  }
  return Object.is(left, right);
}

/** Whether a native reset is under way, read by the combobox to hold the changes it makes. */
type ResetProbe = RefObject<() => boolean>;

/**
 * The combobox's value change for React Aria, held while a native reset is under way, and what
 * `ComboboxReset` needs to apply the reset or undo it.
 */
export function useHeldChange(report: (value: ComboboxStateValue) => void) {
  const probe: ResetProbe = useRef(() => false);
  return {
    probe,
    report,
    onChange: (value: ComboboxStateValue) => {
      if (!probe.current()) report(value);
    },
  };
}

interface ComboboxResetProps {
  input: RefObject<HTMLInputElement | null>;
  probe: ResetProbe;
  isControlled: boolean;
  /** Reports a value the reset put back to an uncontrolled combobox. */
  report: (value: ComboboxStateValue) => void;
}

/**
 * React Aria resets the combobox on its form's own `reset` listener, before a listener that cancels
 * the reset has run. This part, inside the combobox, notes its value and text as the reset starts;
 * a cancelled reset puts them back, and one that went through leaves the value the combobox
 * mounted with, reported once.
 */
export function ComboboxReset({ input, probe, isControlled, report }: ComboboxResetProps) {
  const state = useContext(ComboBoxStateContext);
  const read = () => (state?.value ?? null) as ComboboxStateValue;
  const [initial] = useState(read);
  const snapshot = useRef<{ value: ComboboxStateValue; text: string } | null>(null);
  probe.current = useNativeReset(
    input,
    () => {
      const before = snapshot.current;
      snapshot.current = null;
      if (!state || !before || isSameValue(before.value, initial)) return;
      if (isControlled) state.setValue(initial);
      else report(initial);
    },
    {
      onStart: () => {
        snapshot.current = state ? { value: read(), text: state.inputValue } : null;
      },
      onCancel: () => {
        const before = snapshot.current;
        snapshot.current = null;
        if (!state || !before) return;
        state.setValue(before.value);
        state.setInputValue(before.text);
      },
    },
  );
  return null;
}
