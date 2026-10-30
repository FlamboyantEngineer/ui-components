'use client';

import { toErrorMessage } from '../../utils/to-error-message.js';
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
import { useLatest } from '../../utils/use-latest.js';

interface InlineEditStateOptions<T> {
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
 * The value being edited and the failure shown, both cleared whenever the editor opens or closes.
 * An owner opening or closing a controlled editor skips `open` and `close`, so every editing
 * session starts again from the saved value, without the last session's failure. Each opening and
 * closing starts a new session, numbered so a save can tell whether its session is still the one
 * shown.
 */
function useEditSession<T>(isEditing: boolean) {
  const [draft, setDraft] = useState<{ value: T } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState({ isEditing, id: 0 });
  if (session.isEditing !== isEditing) {
    setSession({ isEditing, id: session.id + 1 });
    setDraft(null);
    setError(null);
  }
  return { draft, setDraft, error, setError, session: session.id };
}

/** A save in flight: the session it belongs to and the value it saves. */
interface SaveAttempt<T> {
  session: number;
  value: T;
}

interface SaveQueueOptions<T> {
  session: number;
  /** The saved value and the value being edited. */
  value: T;
  current: T;
  onSave: (value: T) => void | Promise<unknown>;
  failureMessage: string;
  setDraft: (draft: { value: T } | null) => void;
  setError: (error: string | null) => void;
  close: (focusReturn: FocusReturn) => void;
}

/**
 * Saves the value being edited, one save at a time per session. A save asked for while one runs
 * waits for it, then saves the newer value; edits made without asking keep the editor open once the
 * save ends. A save whose session has ended, or whose inline edit has unmounted, changes nothing
 * when it settles.
 */
function useSaveQueue<T>(options: SaveQueueOptions<T>) {
  const { session, setDraft, setError } = options;
  const [pending, setPending] = useState<SaveAttempt<T> | null>(null);
  const saving = useRef<SaveAttempt<T> | null>(null);
  const queued = useRef<{ value: T | undefined; focusReturn: FocusReturn } | null>(null);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const latest = useLatest(options);
  const takeQueued = () => {
    const request = queued.current;
    queued.current = null;
    return request;
  };
  const settle = (attempt: SaveAttempt<T>, error: string | null) => {
    if (!isMounted.current || saving.current !== attempt) return false;
    if (latest.current.session !== attempt.session) return false;
    saving.current = null;
    setPending(null);
    if (error === null) return true;
    queued.current = null;
    setError(error);
    return false;
  };
  const save = async (next: T, focusReturn: FocusReturn) => {
    const attempt = { session, value: next };
    saving.current = attempt;
    queued.current = null;
    setDraft({ value: next });
    setError(null);
    setPending(attempt);
    try {
      await options.onSave(next);
    } catch (failure) {
      settle(attempt, toErrorMessage(failure, options.failureMessage));
      return;
    }
    if (!settle(attempt, null)) return;
    const request = takeQueued();
    const newer = request?.value ?? latest.current.current;
    if (isSameValue(newer, next)) latest.current.close(request?.focusReturn ?? focusReturn);
    else if (request) void save(newer, request.focusReturn);
  };
  const commit = (next: T | undefined, focusReturn: FocusReturn = 'read') => {
    if (saving.current?.session === session && isMounted.current) {
      queued.current = { value: next, focusReturn };
      return;
    }
    const target = next === undefined ? options.current : next;
    if (isSameValue(target, options.value)) options.close(focusReturn);
    else void save(target, focusReturn);
  };
  return { isPending: pending?.session === session, commit };
}

/**
 * The editing state of an inline edit: the editor opens from the read view, holds the value being
 * edited, saves it (waiting on a returned promise and keeping the editor open with the message of a
 * failure) and closes, moving focus in and back out. The editor stays editable while a save runs
 * (see `useSaveQueue`).
 */
export function useInlineEdit<T>(options: InlineEditStateOptions<T>) {
  const { value } = options;
  const [isEditing, setEditing] = useControllableState(
    options.isEditing,
    options.defaultEditing,
    options.onEditingChange,
  );
  const { draft, setDraft, error, setError, session } = useEditSession<T>(isEditing);
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
  const { isPending, commit } = useSaveQueue({
    session,
    value,
    current,
    onSave: options.onSave,
    failureMessage: options.failureMessage,
    setDraft,
    setError,
    close,
  });
  const cancel = (focusReturn: FocusReturn = 'read') => {
    if (!isPending) close(focusReturn);
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
        commit(undefined);
      }
    },
    // Focus moving into an overlay the editor opened (a list, a calendar) comes back through React.
    onFocus: () => window.clearTimeout(blurTimer.current),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      window.clearTimeout(blurTimer.current);
      blurTimer.current = window.setTimeout(() => commit(undefined, 'none'), 0);
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
    commit: (next?: T) => commit(next),
    editorHandlers,
    editorRef: focus.editorRef,
    readRef: focus.readRef,
  };
}
