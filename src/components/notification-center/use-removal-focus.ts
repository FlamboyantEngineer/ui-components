'use client';

import { useCallback, useLayoutEffect, useRef, type FocusEvent, type RefObject } from 'react';
import { notificationListHooks as hooks } from './notification-row.js';
import { getComposedActiveElement, isFocusLost } from '../../utils/focus-target.js';
import { isNode } from '../../utils/is-element.js';

/** The row holding focus: which of its controls, and the rows that can take focus if it leaves. */
interface FocusedRow {
  row: Element;
  /** The hook class of the focused control, when it has one. */
  controlClass: string | null;
  /** The following rows, nearest first, then the preceding ones, nearest first. */
  neighbours: Element[];
}

const rowSelector = `.${hooks.slotClass('item')}`;
const controlClasses = [hooks.slotClass('dismiss'), hooks.slotClass('read-toggle')];

function findFocusedRow(root: HTMLElement, target: Element | null): FocusedRow | null {
  const row = target?.closest(rowSelector);
  if (!target || !row || !root.contains(row)) return null;
  const rows = [...root.querySelectorAll(rowSelector)];
  const index = rows.indexOf(row);
  return {
    row,
    controlClass: controlClasses.find((name) => target.closest(`.${name}`)) ?? null,
    neighbours: [...rows.slice(index + 1), ...rows.slice(0, index).reverse()],
  };
}

/** The same control in another row, else that row's first control. */
function findRowControl(row: Element, controlClass: string | null): HTMLElement | null {
  const same = controlClass ? row.querySelector<HTMLElement>(`.${controlClass}`) : null;
  return same ?? row.querySelector<HTMLElement>('a[href], button:not(:disabled)');
}

/** The filter's chosen option, where focus goes when no row is left. */
function findFilterControl(root: HTMLElement): HTMLElement | null {
  const filter = root.querySelector(`.${hooks.slotClass('filter')}`);
  return (
    filter?.querySelector<HTMLElement>('[aria-checked="true"]') ??
    filter?.querySelector<HTMLElement>('button') ??
    null
  );
}

/**
 * Keeps focus in the list when the row holding it leaves, such as after a dismissal or a read
 * toggle under the unread filter: focus moves to the same control of the next row, else of the
 * previous row, else to the filter, so it never falls to the page. Returns the root's focus
 * handlers.
 */
export function useRemovalFocus(rootRef: RefObject<HTMLElement | null>) {
  const focused = useRef<FocusedRow | null>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const previous = focused.current;
    if (previous && !previous.row.isConnected && isFocusLost(root)) {
      const next = previous.neighbours.find((row) => row.isConnected);
      (next ? findRowControl(next, previous.controlClass) : findFilterControl(root))?.focus();
    }
    // Rows may have moved: take the neighbours again from this render.
    focused.current = findFocusedRow(root, getComposedActiveElement(root));
  });
  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const root = rootRef.current;
      if (root) focused.current = findFocusedRow(root, event.target);
    },
    [rootRef],
  );
  // Focus moving elsewhere on the page forgets the row; a row leaving the page moves it nowhere.
  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (isNode(next) && !rootRef.current?.contains(next)) focused.current = null;
    },
    [rootRef],
  );
  return { onFocus, onBlur };
}
