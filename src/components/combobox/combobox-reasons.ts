'use client';

import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';
import type { Key } from '../../core/props.js';

/**
 * Why the chosen value changed: an option was picked, a chip removed, the clear button pressed (or
 * the text of a single combobox emptied), or the form reset.
 */
export type ComboboxChangeReason = 'select' | 'remove' | 'clear' | 'reset';

/**
 * Why the input's text changed: the reader typed (inline completion included), pressed the clear
 * button, the combobox wrote the chosen option's label or reverted the text (`sync`, never typed
 * text), or the form reset.
 */
export type ComboboxInputChangeReason = 'input' | 'clear' | 'sync' | 'reset';

/**
 * Why the list opened (`input`, `focus`, or `manual` for the arrow keys and the button) or closed:
 * an option was picked or created (`select`), the reader dismissed it (Escape, the button, leaving
 * the field), or the combobox turned disabled or read-only (`lock`).
 */
export type ComboboxOpenChangeReason = 'input' | 'focus' | 'manual' | 'select' | 'dismiss' | 'lock';

export interface ComboboxChangeDetails {
  reason: ComboboxChangeReason;
}

export interface ComboboxInputChangeDetails {
  reason: ComboboxInputChangeReason;
}

export interface ComboboxOpenChangeDetails {
  reason: ComboboxOpenChangeReason;
}

/** What the combobox's own controls are doing while they call React Aria's state. */
interface ComboboxMarks {
  change: ComboboxChangeReason | null;
  input: ComboboxInputChangeReason | null;
  /** An option was picked since the combobox last rendered, so a close that follows is a pick. */
  isPicked: boolean;
}

type MarksRef = RefObject<ComboboxMarks>;

/** The marks of the combobox around its controls, for the controls inside it. */
export const ComboboxMarksContext = createContext<MarksRef | null>(null);

/**
 * The reasons a combobox reports with each change. Its own controls mark what they do around the
 * state calls they make (`useMarkedAction`); otherwise the reason is read from what React Aria did:
 * text the input already holds was typed, other text was written by the combobox. React Aria closes
 * a list after a pick in an effect of the same commit, before this hook's effect forgets the pick.
 */
export function useComboboxReasons(inputRef: RefObject<HTMLInputElement | null>) {
  const marksRef = useRef<ComboboxMarks>({ change: null, input: null, isPicked: false });
  // Whether a native form reset is under way, as the combobox's reset part reports it.
  const probeRef = useRef(() => false);
  useEffect(() => {
    marksRef.current.isPicked = false;
  });
  return {
    marksRef,
    probeRef,
    readChange: (value: unknown, isSingle: boolean): ComboboxChangeReason => {
      const marked = marksRef.current.change;
      if (marked) return marked;
      if (probeRef.current()) return 'reset';
      // A single combobox empties its value when the reader empties its text.
      if (isSingle && value === null) return 'clear';
      marksRef.current.isPicked = true;
      return 'select';
    },
    readInput: (text: string): ComboboxInputChangeReason => {
      const marked = marksRef.current.input;
      if (marked) return marked;
      if (probeRef.current()) return 'reset';
      return inputRef.current?.value === text ? 'input' : 'sync';
    },
    /** Picking the chosen option again changes nothing but still closes the list as a pick. */
    onSelectionChange: (key: Key | null) => {
      if (key !== null) marksRef.current.isPicked = true;
    },
    readClose: (): ComboboxOpenChangeReason => (marksRef.current.isPicked ? 'select' : 'dismiss'),
  };
}

/**
 * Runs a state call with the reasons the combobox's own control gives it, so the callbacks it sets
 * off report them.
 */
export function useMarkedAction() {
  const marksRef = useContext(ComboboxMarksContext);
  return (marks: Partial<ComboboxMarks>, action: () => void) => {
    if (!marksRef) {
      action();
      return;
    }
    const before = { ...marksRef.current };
    Object.assign(marksRef.current, marks);
    try {
      action();
    } finally {
      marksRef.current.change = before.change;
      marksRef.current.input = before.input;
    }
  };
}
