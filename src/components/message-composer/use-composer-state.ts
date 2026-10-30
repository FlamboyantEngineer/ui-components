import { useState } from 'react';
import { usePersistentState, type PersistCodec } from '../../core/provider.js';
import { useSubmission, type Submitter } from './use-submission.js';

/** How a composer reads its value as text and turns text back into its value. */
export interface ComposerFormat<T> {
  empty: T;
  toText: (value: T) => string;
  fromText: (text: string) => T;
  /** How the draft is stored under `persistKey`. */
  codec: PersistCodec<T>;
}

interface ComposerStateOptions<T> {
  value?: T | undefined;
  defaultValue?: T | undefined;
  onChange?: ((value: T) => void) | undefined;
  onSubmit?: Submitter<T> | undefined;
  /** Sends at once while a reply runs; set only while that is allowed. Without it, sending now sends. */
  onSubmitNow?: Submitter<T> | undefined;
  onSubmitError?: ((error: unknown) => void) | undefined;
  persistKey?: string | undefined;
  editValue?: T | undefined;
  history?: readonly string[] | undefined;
  onEditLast?: (() => void) | undefined;
  /** Sending waits, as while disabled or pending. */
  isBlocked: boolean;
  allowsEmptySubmit?: boolean | undefined;
  format: ComposerFormat<T>;
}

/** Which way the arrows step through earlier messages. */
export type RecallDirection = 'older' | 'newer';

export interface ComposerState<T> {
  /** What the input shows: the message being edited, else the draft. */
  value: T;
  /** The draft, also while another message is being edited. */
  draft: T;
  setValue: (next: T) => void;
  isEditing: boolean;
  /** The value can be sent now. */
  canSubmit: boolean;
  /** A sent message waits for the host to accept it. */
  isSubmitting: boolean;
  /** Sends the value when it can be sent, then empties the draft (an edit stays for the host). */
  submit: () => void;
  /** Sends the draft through `onSubmitNow` when it can be sent, then empties it; else submits. */
  submitNow: () => void;
  /** Steps through the history, or asks to edit the last message; whether the key was used. */
  recall: (direction: RecallDirection) => boolean;
}

/** The history entry the composer shows, by its index, and its text as shown. */
interface Recalled {
  index: number;
  text: string;
}

interface EditState<T> {
  source: T | undefined;
  value: T;
}

/** The draft: controlled by `value`, or the composer's own, kept under `persistKey`. */
function useDraft<T>(options: ComposerStateOptions<T>) {
  const { value, onChange, format } = options;
  const [own, setOwn] = usePersistentState(
    options.persistKey,
    () => options.defaultValue ?? format.empty,
    format.codec,
  );
  const isControlled = value !== undefined;
  const draft = isControlled ? value : own;
  const setDraft = (next: T) => {
    if (Object.is(next, draft)) return;
    if (!isControlled) setOwn(next);
    onChange?.(next);
  };
  return [draft, setDraft] as const;
}

/** The message being edited: starts from each new `editValue` and leaves the draft alone. */
function useEditedMessage<T>(editValue: T | undefined, empty: T) {
  const [edit, setEdit] = useState<EditState<T>>({ source: editValue, value: editValue ?? empty });
  let current = edit;
  if (edit.source !== editValue) {
    current = { source: editValue, value: editValue ?? empty };
    setEdit(current);
  }
  return [current.value, (value: T) => setEdit({ source: editValue, value })] as const;
}

/** The next history entry to show, or `null` to leave it and show the empty draft again. */
function stepHistory(
  history: readonly string[],
  recalled: Recalled | null,
  direction: RecallDirection,
): Recalled | null | undefined {
  const index = recalled
    ? recalled.index + (direction === 'older' ? -1 : 1)
    : direction === 'older'
      ? history.length - 1
      : -1;
  const text = history[index];
  if (text !== undefined) return { index, text };
  // Past the oldest entry the composer stays put; past the newest it shows the draft again.
  return recalled && direction === 'newer' ? null : undefined;
}

/**
 * A composer's text: the draft (controlled, own or persisted), the message being edited, the
 * recall of earlier messages with the arrows, and sending. The arrows recall only while the
 * composer is empty or shows a recalled message the reader has not changed.
 */
export function useComposerState<T>(options: ComposerStateOptions<T>): ComposerState<T> {
  const { format, editValue, onEditLast, history = [] } = options;
  const [draft, setDraft] = useDraft(options);
  const [edit, setEdit] = useEditedMessage(editValue, format.empty);
  const [recalled, setRecalled] = useState<Recalled | null>(null);
  const submission = useSubmission({
    ...options,
    isControlled: options.value !== undefined,
    draft,
    setDraft,
  });
  const isEditing = editValue !== undefined;
  const value = isEditing ? edit : draft;
  const text = format.toText(value);
  const hasContent = Boolean(options.allowsEmptySubmit) || text.trim() !== '';
  const canSubmit = !options.isBlocked && !submission.isSubmitting && hasContent;
  const canSubmitNow = !isEditing && !submission.isSubmitting && hasContent;
  const recall = (direction: RecallDirection): boolean => {
    const current = recalled && text === recalled.text ? recalled : null;
    if (isEditing || (!current && text !== '')) return false;
    if (!current && direction === 'older' && onEditLast) {
      onEditLast();
      return true;
    }
    const next = stepHistory(history, current, direction);
    if (next === undefined) return current !== null;
    setRecalled(next);
    setDraft(next ? format.fromText(next.text) : format.empty);
    return true;
  };
  const submit = () => {
    if (!canSubmit) return;
    setRecalled(null);
    submission.send(value, !isEditing);
  };
  return {
    value,
    draft,
    setValue: isEditing ? setEdit : setDraft,
    isEditing,
    canSubmit,
    isSubmitting: submission.isSubmitting,
    submit,
    submitNow: () => {
      if (!options.onSubmitNow) return submit();
      if (!canSubmitNow) return;
      setRecalled(null);
      submission.send(value, true, options.onSubmitNow);
    },
    recall,
  };
}
