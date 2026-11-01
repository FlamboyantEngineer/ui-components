'use client';

import type { ComponentProps, KeyboardEvent } from 'react';
import { isComposingKey } from './is-composing-key.js';
import { isHTMLElement } from './is-element.js';
import { isInTextControl } from './text-control-keys.js';

type ToolbarKeyEvent = KeyboardEvent<HTMLDivElement>;

/** An arrow key pressed in a text control inside the toolbar, not on the toolbar itself. */
function isFieldArrow(event: ToolbarKeyEvent): boolean {
  return (
    event.key.startsWith('Arrow') &&
    event.target !== event.currentTarget &&
    isInTextControl(event.target)
  );
}

const backwardKeys = new Set(['ArrowLeft', 'ArrowUp']);

/** Whether a text field's caret sits at the end of its text the arrow points to. */
function isAtEdge(field: HTMLInputElement | HTMLTextAreaElement, key: string): boolean {
  const { selectionStart, selectionEnd, value } = field;
  if (selectionStart === null) return false;
  const edge = backwardKeys.has(key) ? 0 : value.length;
  return selectionStart === edge && selectionEnd === edge;
}

/**
 * Whether the field is one of several in a group inside the toolbar, such as the cells of a PIN,
 * with another of them in the arrow's direction: the group moves between its fields itself.
 */
function hasFieldBeyond(field: Element, key: string, toolbar: Element): boolean {
  const group = field.parentElement?.closest('[role="group"]');
  if (!group || group === toolbar || !toolbar.contains(group)) return false;
  const fields = [...group.querySelectorAll('input, textarea')];
  const at = fields.indexOf(field);
  return backwardKeys.has(key) ? at > 0 : at < fields.length - 1;
}

/**
 * Whether a field's arrow key stays with it: while an input method composes, with a modifier
 * (selection and word moves), in a control without a caret to read (editable content, sliders,
 * selects), when the caret has text to cross in the arrow's direction, or when the field's group
 * has another field that way.
 */
function keepsArrow(event: ToolbarKeyEvent): boolean {
  if (isComposingKey(event.nativeEvent)) return true;
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return true;
  const field = event.target;
  if (!isHTMLElement(field, 'input') && !isHTMLElement(field, 'textarea')) return true;
  return !isAtEdge(field, event.key) || hasFieldBeyond(field, event.key, event.currentTarget);
}

/**
 * Draws a toolbar element whose arrow keys leave a text control's caret alone: React Aria moves
 * focus on an arrow before any control sees it, so from a text control it moves only when the
 * caret is at the end of the text in the arrow's direction, with no modifier and no composition.
 */
export function renderCaretKeyToolbar(props: ComponentProps<'div'>) {
  const { onKeyDownCapture: move } = props;
  return (
    <div
      {...props}
      onKeyDownCapture={(event) => {
        if (!isFieldArrow(event) || !keepsArrow(event)) move?.(event);
      }}
    />
  );
}
