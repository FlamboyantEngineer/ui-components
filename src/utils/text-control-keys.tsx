import type { ComponentProps, KeyboardEvent, KeyboardEventHandler } from 'react';
import { isElement } from './is-element.js';

/** Inputs that take no caret or arrow keys: toggles, buttons and pickers. */
const keylessInputs = ['checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file', 'image']
  .map((type) => `[type="${type}"]`)
  .join(', ');

/**
 * Controls that use the arrow, Home, End and character keys themselves: text inputs, sliders and
 * selects, text areas, editable content, and the text widgets a host draws.
 */
const textControls = [
  `input:not(${keylessInputs})`,
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]',
].join(', ');

/** Whether `target` is in a text control: a field, editable content or a host's text widget. */
export function isInTextControl(target: EventTarget | null): boolean {
  return isElement(target) && target.closest(textControls) !== null;
}

/** The keys a text control leaves to its row or cell: moving focus out and closing. */
const passedKeys = new Set(['Tab', 'Escape']);

/**
 * Whether a keydown belongs to a text control inside a collection's row or cell: any key but Tab
 * and Escape, which the row's navigation, the collection's arrows, Home, End and typeahead leave to
 * it.
 */
export function isTextControlKey(event: { key: string; target: EventTarget | null }): boolean {
  return !passedKeys.has(event.key) && isInTextControl(event.target);
}

interface KeyHandlers<E> {
  onKeyDownCapture?: KeyboardEventHandler<E> | undefined;
  onKeyDown?: KeyboardEventHandler<E> | undefined;
}

/**
 * A row or cell element's props that leave a text control's keys to it: React Aria's capture,
 * which walks the row's controls, skips them, and they stop at the element, so the collection's
 * navigation and typeahead never take them. Tab and Escape pass.
 */
export function keepTextControlKeys<E extends Element, P extends KeyHandlers<E>>(props: P): P {
  const { onKeyDownCapture, onKeyDown } = props;
  return {
    ...props,
    onKeyDownCapture: (event: KeyboardEvent<E>) => {
      if (!isTextControlKey(event)) onKeyDownCapture?.(event);
    },
    onKeyDown: (event: KeyboardEvent<E>) => {
      if (!isTextControlKey(event)) return onKeyDown?.(event);
      event.stopPropagation();
    },
  };
}

/** Draws a collection's row element, leaving a text control's keys to it. */
export function renderTextKeyRow(props: ComponentProps<'div'>) {
  return <div {...keepTextControlKeys(props)} />;
}
