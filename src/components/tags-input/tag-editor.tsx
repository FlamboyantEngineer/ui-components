'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isFocused } from '../../utils/composed-focus.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import type { FieldIssue } from '../field/field.js';
import { tagsInputHooks as hooks } from './tags-input-hooks.js';

/** The tag being edited: its position, its accepted text, and the text typed in its editor. */
export interface TagEdit {
  index: number;
  tag: string;
  draft: string;
}

/** A tags input's tag editing, as its control drives it. */
export interface TagEditing {
  /** The open edit, or `null`. */
  edit: TagEdit | null;
  /** Why the field refused the open edit's last accepted draft, or `null`. */
  issue: FieldIssue | null;
  /** Opens the tag at `index` for editing; `false` when editing is off or there is no such tag. */
  open(index: number): boolean;
  changeDraft(draft: string): void;
  /**
   * Ends the open edit: with `accept` the draft replaces the tag, unless the field refuses it, when
   * a `keepOpen` edit stays open with its refusal. `true` once the edit has ended.
   */
  finish(options: { accept: boolean; keepOpen: boolean }): boolean;
}

interface TagEditorProps {
  edit: TagEdit;
  onDraftChange(draft: string): void;
  /** Ends the edit, `byKey` for Enter and Escape; `true` once it has ended. */
  onFinish(options: { accept: boolean; byKey: boolean }): boolean;
  isInvalid: boolean;
  /** The field's description and message ids, which describe the editor too. */
  describedBy: string | undefined;
}

/** Keeps the editor's own events from the tag row, which would move focus, select or remove. */
function stop(event: SyntheticEvent) {
  event.stopPropagation();
}

/**
 * The editing state of a tags input: which tag is open and its draft, and the refusal of a draft the
 * field would not take. `accept` applies a draft to the field and returns its refusal, if any. An
 * edit whose tag leaves its place, or a field that stops being editable, ends it.
 */
export function useTagEditing(options: {
  value: readonly string[];
  isEnabled: boolean;
  accept: (index: number, text: string) => FieldIssue | null;
}): TagEditing {
  const { value, isEnabled, accept } = options;
  const [state, setState] = useState<{ edit: TagEdit; issue: FieldIssue | null } | null>(null);
  // A tag replaced, moved, removed or locked from outside ends its edit.
  if (state !== null && (!isEnabled || value[state.edit.index] !== state.edit.tag)) setState(null);
  const isLive = state !== null && isEnabled && value[state.edit.index] === state.edit.tag;
  const live = isLive ? state : null;
  return {
    edit: live?.edit ?? null,
    issue: live?.issue ?? null,
    open: (index) => {
      const tag = value[index];
      if (!isEnabled || tag === undefined) return false;
      setState({ edit: { index, tag, draft: tag }, issue: null });
      return true;
    },
    changeDraft: (draft) => {
      if (live) setState({ edit: { ...live.edit, draft }, issue: null });
    },
    finish: ({ accept: isAccepted, keepOpen }) => {
      if (!live) return true;
      const issue = isAccepted ? accept(live.edit.index, live.edit.draft) : null;
      if (issue && keepOpen) {
        setState({ edit: live.edit, issue });
        return false;
      }
      setState(null);
      return true;
    },
  };
}

/**
 * The text input that replaces a tag's label while the reader edits it. Enter accepts, Escape
 * restores the tag, and leaving the editor accepts the draft or, when the field refuses it,
 * restores the tag. Keys an input method composes stay with it.
 */
export function TagEditor({
  edit,
  onDraftChange,
  onFinish,
  isInvalid,
  describedBy,
}: TagEditorProps) {
  const strings = useUiStrings();
  // Enter and Escape remove the editor; the blur that may follow must not end the next edit.
  const isEndedRef = useRef(false);
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (isComposingKey(event.nativeEvent)) return;
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      isEndedRef.current = onFinish({ accept: event.key === 'Enter', byKey: true });
    }
  };
  return (
    <input
      {...hooks.slot('editor')}
      aria-label={strings.editValue(edit.tag)}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      value={edit.draft}
      // Focus and select the tag's text as the editor opens, as a rename field does.
      ref={(input) => {
        if (!input || isFocused(input)) return;
        input.focus();
        input.select();
      }}
      onChange={(event) => onDraftChange(event.target.value)}
      onKeyDown={onKeyDown}
      onKeyUp={stop}
      onPointerDown={stop}
      onPointerUp={stop}
      onMouseDown={stop}
      onClick={stop}
      onDoubleClick={stop}
      onBlur={() => {
        if (!isEndedRef.current) onFinish({ accept: true, byKey: false });
      }}
    />
  );
}

/**
 * How a tags input's control opens and shows tag edits: Enter or F2 on a focused tag and a double
 * click on a tag open its editor, and Enter or Escape in the editor return focus to the tag at the
 * edited place (or the last tag, after an empty edit removed it).
 */
export function useTagEditorControl(options: {
  editing: TagEditing | null;
  readRows: () => HTMLElement[];
  /** The field control's description and error message ids, which describe the editor too. */
  control: { 'aria-describedby': string | undefined; 'aria-errormessage': string | undefined };
  /** The tags' other capture-phase keys, for keys the editing leaves alone. */
  onTagKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}) {
  const { editing, readRows, control, onTagKeyDownCapture } = options;
  const describedBy =
    [control['aria-describedby'], control['aria-errormessage']].filter(Boolean).join(' ') ||
    undefined;
  const focusIndexRef = useRef<number | null>(null);
  useEffect(() => {
    const index = focusIndexRef.current;
    if (index === null) return;
    // An edit gives the tag a new key, and the collection moves focus off the key it lost once it
    // has rebuilt, a render later; focusing after the next frame lands on the edited place.
    const view = getOwnerWindow(readRows()[0]);
    const frame = view.requestAnimationFrame(() => {
      focusIndexRef.current = null;
      const rows = readRows();
      (rows[index] ?? rows.at(-1))?.focus();
    });
    return () => view.cancelAnimationFrame(frame);
  });
  const open = (row: Element | null) =>
    row !== null && editing !== null && editing.open(readRows().indexOf(row as HTMLElement));
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as Element;
    const isEditKey = event.key === 'Enter' || event.key === 'F2';
    if (!isEditKey || !target.matches('[role="row"]') || !open(target)) {
      onTagKeyDownCapture(event);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const onDoubleClick = (event: MouseEvent<HTMLElement>) => {
    open((event.target as Element).closest('[role="row"]'));
  };
  const edit = editing?.edit ?? null;
  const renderEditor =
    editing && edit
      ? (open: TagEdit): ReactNode => (
          <TagEditor
            edit={open}
            onDraftChange={editing.changeDraft}
            onFinish={({ accept, byKey }) => {
              const isDone = editing.finish({ accept, keepOpen: byKey });
              if (isDone && byKey) focusIndexRef.current = open.index;
              return isDone;
            }}
            isInvalid={editing.issue !== null}
            describedBy={describedBy}
          />
        )
      : null;
  return { edit, onKeyDownCapture, onDoubleClick, renderEditor };
}
