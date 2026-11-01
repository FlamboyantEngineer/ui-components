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
  type RefObject,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useLatest } from '../../utils/use-latest.js';
import { useLifetimeSignal } from '../../utils/use-lifetime-signal.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { listTabbables } from '../../utils/tabbable.js';
import { isFieldValueEqual } from '../field/field.js';

interface InlineEditStateOptions<T> {
  value: T;
  onSave: (value: T) => void | Promise<unknown>;
  isEditing: boolean | undefined;
  defaultEditing: boolean;
  onEditingChange: ((isEditing: boolean) => void) | undefined;
  /** The message of a failed save that carries none of its own. */
  failureMessage: string;
  /** Freezes an open editor: nothing new is saved until it is enabled again. */
  isDisabled: boolean;
}

/** What closing the editor does with focus: back to the read view, or left where it went. */
type FocusReturn = 'read' | 'none';

/**
 * Moves focus to the editor's first control that takes it: one Tab reaches (so not a hidden input,
 * nor a control that is disabled, hidden or inert), trying the next when focus does not land. Text
 * in an input is selected, and a text area's caret goes to its end.
 */
function focusEditor(editor: HTMLElement | null) {
  if (!editor) return;
  for (const target of listTabbables(editor)) {
    target.focus();
    if (target.ownerDocument.activeElement !== target) continue;
    if (isHTMLElement(target, 'input')) target.select();
    if (isHTMLElement(target, 'textarea')) target.setSelectionRange(-1, -1);
    return;
  }
}

/**
 * Whether Enter on this element belongs to the element: a button, an open list, or a new line in a
 * text area or an editable region (where Ctrl or Cmd with Enter saves instead).
 */
function isOwnEnter(event: KeyboardEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement;
  if (target.closest('button, [role="button"]')) return true;
  if (target.getAttribute('aria-expanded') === 'true') return true;
  const isMultiline = target.tagName === 'TEXTAREA' || target.isContentEditable;
  return isMultiline && !event.ctrlKey && !event.metaKey;
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
  const focusReturnRef = useRef<FocusReturn>('none');
  const hasMounted = useRef(false);
  useLayoutEffect(() => {
    const isFirst = !hasMounted.current;
    hasMounted.current = true;
    if (isEditing && !isFirst) {
      focusEditor(editorRef.current);
    } else if (!isEditing && focusReturnRef.current === 'read') {
      readRef.current?.focus();
    }
    focusReturnRef.current = 'none';
  }, [isEditing]);
  return { editorRef, readRef, focusReturnRef };
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
  /** Aborts when the inline edit unmounts. */
  signal: AbortSignal;
}

/**
 * What a save request saves: a value the editor chose, kept apart from `undefined` and `null`
 * (both valid values), or, when null, the value being edited when the save starts.
 */
type SaveRequest<T> = { value: T } | null;

interface SaveQueueOptions<T> {
  session: number;
  /** The saved value and the value being edited. */
  value: T;
  edited: T;
  onSave: (value: T) => void | Promise<unknown>;
  failureMessage: string;
  /** No save starts, and a queued one waits for a new commit once enabled. */
  isDisabled: boolean;
  setDraft: (draft: { value: T } | null) => void;
  setError: (error: string | null) => void;
  close: (focusReturn: FocusReturn) => void;
}

/**
 * Saves the value being edited, one save at a time per session. A save never changes the value
 * being edited: a value the editor chooses becomes the value being edited when it is asked for, so
 * later edits replace it as usual. A save asked for while one runs waits for it, then saves what it
 * asked for (the value it chose, else the value being edited by then). The editor closes once the
 * last save ends only if the value being edited is the one saved; otherwise it stays open with the
 * unsaved edits. A save whose session has ended, or whose inline edit has unmounted, changes
 * nothing when it settles.
 */
function useSaveQueue<T>(options: SaveQueueOptions<T>) {
  const { session, setDraft, setError } = options;
  const [pending, setPending] = useState<SaveAttempt<T> | null>(null);
  const saving = useRef<SaveAttempt<T> | null>(null);
  const queued = useRef<{ request: SaveRequest<T>; focusReturn: FocusReturn } | null>(null);
  const beginSave = useLifetimeSignal();
  const latest = useLatest(options);
  const takeQueued = () => {
    const request = queued.current;
    queued.current = null;
    return request;
  };
  const settle = (attempt: SaveAttempt<T>, error: string | null) => {
    if (attempt.signal.aborted || saving.current !== attempt) return false;
    if (latest.current.session !== attempt.session) return false;
    saving.current = null;
    setPending(null);
    if (error === null) return true;
    queued.current = null;
    setError(error);
    return false;
  };
  const save = async (next: T, focusReturn: FocusReturn) => {
    const attempt = { session, value: next, signal: beginSave() };
    saving.current = attempt;
    queued.current = null;
    setError(null);
    setPending(attempt);
    try {
      // A save starting from the queue calls the current `onSave`, not the one of the render
      // that started the save before it.
      await latest.current.onSave(next);
    } catch (failure) {
      settle(attempt, toErrorMessage(failure, latest.current.failureMessage));
      return;
    }
    if (!settle(attempt, null)) return;
    const queuedSave = takeQueued();
    if (queuedSave) {
      const newer = queuedSave.request ? queuedSave.request.value : latest.current.edited;
      if (!isFieldValueEqual(newer, next)) {
        // A save waiting behind this one has not started: a disabled editor drops it and keeps
        // its draft for a commit once enabled.
        if (!latest.current.isDisabled) void save(newer, queuedSave.focusReturn);
        return;
      }
    }
    if (isFieldValueEqual(latest.current.edited, next)) {
      latest.current.close(queuedSave?.focusReturn ?? focusReturn);
    }
  };
  const commit = (request: SaveRequest<T>, focusReturn: FocusReturn = 'read') => {
    if (latest.current.isDisabled) return;
    if (request) setDraft({ value: request.value });
    if (saving.current?.session === session && !saving.current.signal.aborted) {
      queued.current = { request, focusReturn };
      return;
    }
    const target = request ? request.value : options.edited;
    if (isFieldValueEqual(target, options.value)) options.close(focusReturn);
    else void save(target, focusReturn);
  };
  return { isPending: pending?.session === session, commit };
}

/**
 * The editor's key and focus handlers: Escape cancels; Enter and focus leaving save. A save waits
 * for the task that asked for it to end, so the editor's own handling of the key or the blur (a
 * number field parsing its text) updates the value being edited first; it then runs with the
 * handlers of the latest render.
 */
function useEditorHandlers<T>(options: {
  commit: (request: SaveRequest<T>, focusReturn?: FocusReturn) => void;
  cancel: () => void;
  timerRef: RefObject<ReturnType<typeof setTimeout> | undefined>;
  /** The editing session; a save scheduled in one is dropped once another replaces it. */
  session: number;
}) {
  const { cancel, timerRef, session } = options;
  const latest = useLatest({ commit: options.commit, session });
  // A session that ends (closed by its owner, or closed and reopened) drops the save it scheduled.
  useEffect(() => () => clearTimeout(timerRef.current), [session, timerRef]);
  const commitLater = (focusReturn: FocusReturn) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (latest.current.session === session) latest.current.commit(null, focusReturn);
    }, 0);
  };
  return {
    onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isEditorKey(event) || isComposingKey(event.nativeEvent)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      } else if (event.key === 'Enter' && !isOwnEnter(event)) {
        // The editor still sees Enter; its default (submitting a form) does not run.
        event.preventDefault();
        commitLater('read');
      }
    },
    // Enter stops at the editor, so the surrounding collection or form never acts on it.
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && isEditorKey(event) && !isOwnEnter(event))
        event.stopPropagation();
    },
    // Focus moving into an overlay the editor opened (a list, a calendar) comes back through React.
    onFocus: () => clearTimeout(timerRef.current),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      commitLater('none');
    },
  };
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
  const { focusReturnRef } = focus;
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(commitTimer.current), []);
  const edited = draft === null ? value : draft.value;

  const close = (focusReturn: FocusReturn) => {
    clearTimeout(commitTimer.current);
    focusReturnRef.current = focusReturn;
    setDraft(null);
    setError(null);
    setEditing(false);
  };
  const open = () => {
    if (options.isDisabled) return;
    setDraft(null);
    setError(null);
    setEditing(true);
  };
  const { isPending, commit } = useSaveQueue({
    session,
    value,
    edited,
    onSave: options.onSave,
    failureMessage: options.failureMessage,
    isDisabled: options.isDisabled,
    setDraft,
    setError,
    close,
  });
  const cancel = (focusReturn: FocusReturn = 'read') => {
    if (!isPending) close(focusReturn);
  };

  const editorHandlers = useEditorHandlers({ commit, cancel, timerRef: commitTimer, session });

  return {
    isEditing,
    isPending,
    error,
    edited,
    setEdited: (next: T) => {
      if (!options.isDisabled) setDraft({ value: next });
    },
    open,
    cancel: () => cancel(),
    /** Saves the value being edited, or the value given, which may be `undefined` or `null`. */
    commit: (...value: [] | [T]) => commit(value.length > 0 ? { value: value[0] as T } : null),
    editorHandlers,
    editorRef: focus.editorRef,
    readRef: focus.readRef,
  };
}
