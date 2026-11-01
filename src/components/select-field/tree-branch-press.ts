'use client';

// How a press on a tree select field's branch row reads: by default it opens or closes the branch,
// and only leaves are chosen; with `selectableBranches` the first press opens a closed branch and a
// press on an open one chooses it (specs/SELECT-FIELD.md, UIC-SELECT-FIELD-9.6).

import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { Key } from '../../core/props.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isHTMLElement } from '../../utils/is-element.js';
import type { TreeIndex } from './tree-index.js';

/** The row a press started on, until a handler takes it. */
interface Press {
  row: HTMLElement;
  /** Whether the press was on the row's selection checkbox, which always chooses. */
  isCheckbox: boolean;
}

interface BranchPressOptions {
  selectableBranches: boolean;
  /** Whether the press keys (Space) belong to the checkbox, as in a multiple choice. */
  isMultiple: boolean;
}

/** Whether a node is a branch: it has loaded children, or says it has some to load. */
export function createBranchCheck<T>(
  index: TreeIndex<T>,
  getChildren: (item: T) => readonly T[] | undefined,
  hasChildItems: ((item: T) => boolean) | undefined,
) {
  return (key: Key) => {
    const item = index.get(key)?.item;
    if (item === undefined) return false;
    return (getChildren(item)?.length ?? 0) > 0 || Boolean(hasChildItems?.(item));
  };
}

/**
 * Tracks the row each press starts on, and turns a press on a branch row into opening or closing it
 * through the row's own expand button, so filtering and lazy loading behave as the button does.
 * `claim()` reports whether the press in flight was such a branch press, once.
 */
export function useBranchPress({ selectableBranches, isMultiple }: BranchPressOptions) {
  const press = useRef<Press | null>(null);
  const claimed = useRef(false);
  const start = (row: Element | null | undefined, isCheckbox: boolean) => {
    press.current = isHTMLElement(row) ? { row, isCheckbox } : null;
    claimed.current = false;
  };
  const onPointerDownCapture = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as Element;
    // The expand button opens and closes on its own.
    if (target.closest('[slot="chevron"]')) return start(null, false);
    start(target.closest('[role="row"]'), target.closest('[slot="selection"]') !== null);
  };
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (isComposingKey(event.nativeEvent)) return;
    const target = event.target as Element;
    const isPressKey = event.key === 'Enter' || (event.key === ' ' && !isMultiple);
    start(isPressKey && target.getAttribute('role') === 'row' ? target : null, false);
  };
  /** Opens or closes the pressed branch instead of choosing it; true when it did. */
  const claim = (): boolean => {
    const current = press.current;
    if (claimed.current) return true;
    if (!current || current.isCheckbox) return false;
    const expanded = current.row.getAttribute('aria-expanded');
    if (expanded === null || (selectableBranches && expanded === 'true')) return false;
    claimed.current = true;
    current.row.querySelector<HTMLElement>('[slot="chevron"]')?.click();
    return true;
  };
  return { onPointerDownCapture, onKeyDownCapture, claim };
}
