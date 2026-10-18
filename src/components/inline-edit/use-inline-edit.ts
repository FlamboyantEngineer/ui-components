// The editing state of an inline edit: opening and closing the editor, the value being edited, the
// save and its outcome, focus, and the keys and focus moves that save or cancel.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';

export interface InlineEditStateOptions<T> {
  value: T;
  onSave: (value: T) => void | Promise<unknown>;
  isEditing: boolean | undefined;
  defaultEditing: boolean;
  onEditingChange: ((isEditing: boolean) => void) | undefined;
  /** The message of a failed save that carries none of its own. */
  failureMessage: string;
}

/** What closing the editor does with focus: back to the read view, or left where it went. */
type FocusReturn = 'read' | 'none';

const focusableSelector = ['input', 'textarea', 'select', 'button', '[tabindex]']
  .map((element) => `${element}:not([disabled]):not([tabindex="-1"])`)
  .join(', ');

/** Whether two plain-data values are the same, so saving would change nothing. */
export function isSameValue(a: unknown, b: unknown): boolean {
  return Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
}

/** Whether a value shows nothing: nullish, blank text or an empty list. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return Array.isArray(value) && value.length === 0;
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Whether Enter on this element belongs to the element: a button, an open list or a text area. */
function isOwnEnter(event: KeyboardEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement;
  if (target.closest('button, [role="button"]')) return true;
  if (target.getAttribute('aria-expanded') === 'true') return true;
  return target.tagName === 'TEXTAREA' && !event.ctrlKey && !event.metaKey;
}

/** Whether a key went to the editor's own elements rather than to an overlay it opened. */
function isEditorKey(event: KeyboardEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement;
  return event.currentTarget.contains(target) && target.getAttribute('aria-expanded') !== 'true';
}

/** Focus follows the editor: into it when it opens, back to the read view when asked. */
function useEditFocus(isEditing: boolean) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const readRef = useRef<HTMLButtonElement | null>(null);
  const focusReturn = useRef<FocusReturn>('none');
  const hasMounted = useRef(false);
  useLayoutEffect(() => {
    const isFirst = !hasMounted.current;
    hasMounted.current = true;
    if (isEditing && !isFirst) {
      const target = editorRef.current?.querySelector<HTMLElement>(focusableSelector);
      target?.focus();
      if (target instanceof HTMLInputElement) target.select();
      if (target instanceof HTMLTextAreaElement) target.setSelectionRange(-1, -1);
    } else if (!isEditing && focusReturn.current === 'read') {
      readRef.current?.focus();
    }
    focusReturn.current = 'none';
  }, [isEditing]);
  return { editorRef, readRef, focusReturn };
}

/**
 * The editing state of an inline edit: the editor opens from the read view, holds the value being
 * edited, saves it (waiting on a returned promise and keeping the editor open with the message of a
 * failure) and closes, moving focus in and back out.
 */
export function useInlineEdit<T>(options: InlineEditStateOptions<T>) {
  const { value, onSave } = options;
  const [isEditing, setEditing] = useControllableState(
    options.isEditing,
    options.defaultEditing,
    options.onEditingChange,
  );
  const [draft, setDraft] = useState<{ value: T } | null>(null);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focus = useEditFocus(isEditing);
  const blurTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(blurTimer.current), []);
  const current = draft === null ? value : draft.value;

  const close = (focusReturn: FocusReturn) => {
    window.clearTimeout(blurTimer.current);
    focus.focusReturn.current = focusReturn;
    setDraft(null);
    setError(null);
    setEditing(false);
  };
  const open = () => {
    setDraft(null);
    setError(null);
    setEditing(true);
  };
  const cancel = (focusReturn: FocusReturn = 'read') => {
    if (!isPending) close(focusReturn);
  };
  const commit = async (next: T = current, focusReturn: FocusReturn = 'read') => {
    if (isPending) return;
    if (isSameValue(next, value)) return close(focusReturn);
    setDraft({ value: next });
    setError(null);
    setPending(true);
    try {
      await onSave(next);
      close(focusReturn);
    } catch (failure) {
      setError(toMessage(failure, options.failureMessage));
    } finally {
      setPending(false);
    }
  };

  const editorHandlers = {
    onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isEditorKey(event) || event.nativeEvent.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      } else if (event.key === 'Enter' && !isOwnEnter(event)) {
        event.preventDefault();
        event.stopPropagation();
        void commit();
      }
    },
    // Focus moving into an overlay the editor opened (a list, a calendar) comes back through React.
    onFocus: () => window.clearTimeout(blurTimer.current),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      window.clearTimeout(blurTimer.current);
      blurTimer.current = window.setTimeout(() => void commit(current, 'none'), 0);
    },
  };

  return {
    isEditing,
    isPending,
    error,
    current,
    setCurrent: (next: T) => setDraft({ value: next }),
    open,
    cancel: () => cancel(),
    commit: (next?: T) => void commit(next),
    editorHandlers,
    editorRef: focus.editorRef,
    readRef: focus.readRef,
  };
}
