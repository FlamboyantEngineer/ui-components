'use client';

import {
  useContext,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { ComboBoxStateContext } from '../../primitives/index.js';
import type { HookProps } from '../../core/hooks.js';

interface ComboboxListHeaderProps {
  /** The hook attributes of the header slot. */
  slot: HookProps;
  /** The input, which takes focus back after a press in the header. */
  inputRef: RefObject<HTMLInputElement | null>;
  children: ReactNode;
}

// Controls that take typed or arrow-key input keep the focus a click gives them.
const entryControls =
  'textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="listbox"], input';

const pressInputTypes = new Set(['button', 'checkbox', 'image', 'radio', 'reset', 'submit']);

function isEntryControl(target: EventTarget): boolean {
  const control = target instanceof Element ? target.closest(entryControls) : null;
  return control instanceof HTMLInputElement
    ? !pressInputTypes.has(control.type)
    : control !== null;
}

/**
 * The controls above the listbox. Focus moved into it keeps the list open; a press on a button,
 * checkbox or other pressable control gives focus back to the input, so the keyboard stays on the
 * list, while a text field, select or slider keeps the focus a click gives it. Escape in the header
 * returns focus to the input as the list closes.
 */
export function ComboboxListHeader({ slot, inputRef, children }: ComboboxListHeaderProps) {
  const state = useContext(ComboBoxStateContext);
  return (
    <div
      {...slot}
      // Pressable controls stop the click from bubbling, so it is caught on the way down.
      onClickCapture={(event: MouseEvent) => {
        if (!isEntryControl(event.target)) inputRef.current?.focus();
      }}
      onKeyDown={(event: KeyboardEvent) => {
        // The list is non-modal, so only the input closes it on Escape by itself.
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        inputRef.current?.focus();
        state?.close();
      }}
    >
      {children}
    </div>
  );
}
