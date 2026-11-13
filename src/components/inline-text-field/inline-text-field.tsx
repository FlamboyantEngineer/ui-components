'use client';

import { useEffect, useRef, useState } from 'react';
import type { AriaLabellingProps, FocusEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useLatest } from '../../utils/use-latest.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';

export interface InlineTextFieldProps
  extends
    RefProps<HTMLInputElement>,
    BaseProps,
    AriaLabellingProps,
    Pick<FocusEventProps<HTMLInputElement>, 'onFocus' | 'onBlur'> {
  /** The committed text. A new value replaces the draft unless the reader has changed it. */
  value: string;
  /** Called with the draft on Enter, and on blur when the draft differs from `value`. */
  onCommit?: ((value: string) => void) | undefined;
  /** Called on Escape, after the draft goes back to `value`. */
  onCancel?: (() => void) | undefined;
  /** A hint shown while the field is empty. */
  placeholder?: string | undefined;
  /** Shows the text without letting the reader change it; nothing is committed. */
  isReadOnly?: boolean | undefined;
  /** Focuses the field when it mounts. Off by default, so mounting never takes focus. */
  autoFocus?: boolean | undefined;
}

const hooks = createHooks('inline-text-field');

/**
 * Events stopped at the field, so a host listening above it (a rich-text editor around a node
 * view) never sees them: keys, clipboard and drag. Tab still travels, for the host's focus order.
 */
const containedEvents = ['keydown', 'keypress', 'keyup', 'paste', 'cut', 'copy', 'drop'] as const;

interface Draft {
  /** The `value` the draft started from. */
  base: string;
  text: string;
  /** The text last committed from this draft, which a host may store changed, such as trimmed. */
  committed?: string | undefined;
}

/**
 * How the last key settled the draft, so a blur that the host causes inside `onCommit` or
 * `onCancel`, before the field renders again, neither commits the text Enter just committed nor
 * the draft Escape just discarded. A change of the draft clears it.
 */
type Settled = { kind: 'committed'; text: string } | { kind: 'discarded' } | null;

/**
 * The draft, which starts again from a new `value` unless the reader has changed it since: a draft
 * still holding the text it committed takes the stored value, as the host normalised it.
 */
function useDraft(value: string) {
  const [draft, setDraft] = useState<Draft>({ base: value, text: value });
  if (draft.base !== value) {
    const isEdited = draft.text !== draft.base && draft.text !== draft.committed;
    setDraft({ base: value, text: isEdited ? draft.text : value });
  }
  return {
    text: draft.text,
    setText: (text: string) => setDraft({ base: value, text }),
    markCommitted: (text: string) => setDraft((current) => ({ ...current, committed: text })),
  };
}

/**
 * A one-line text field for short text edited in place, such as a caption, that is safe inside a
 * host which listens for keys itself, such as a rich-text editor's `contenteditable="false"` node
 * view: it renders no portal and takes no focus on mount, and keys, clipboard and drag events stop
 * at the field, so Ctrl+A selects the field's text and a paste arrives as plain text. Enter and
 * focus leaving commit; Escape restores the committed text.
 */
export function InlineTextField(props: InlineTextFieldProps) {
  const { ref, value, onCommit, onCancel, onBlur, isReadOnly = false, className, ...rest } = props;
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const { text, setText, markCommitted } = useDraft(value);
  const latest = useLatest({ text, value, onCommit, onCancel, isReadOnly, setText, markCommitted });
  const settledRef = useRef<Settled>(null);
  useEffect(() => {
    if (!input) return;
    const contain = (event: Event) => {
      if ('key' in event && event.key === 'Tab') return;
      event.stopPropagation();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const current = latest.current;
      if (isComposingKey(event) || current.isReadOnly) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        settledRef.current = { kind: 'committed', text: current.text };
        current.markCommitted(current.text);
        current.onCommit?.(current.text);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        settledRef.current = { kind: 'discarded' };
        current.setText(current.value);
        current.onCancel?.();
      }
    };
    input.addEventListener('keydown', onKeyDown);
    for (const type of containedEvents) input.addEventListener(type, contain);
    return () => {
      input.removeEventListener('keydown', onKeyDown);
      for (const type of containedEvents) input.removeEventListener(type, contain);
    };
  }, [input, latest]);
  return (
    <input
      {...rest}
      ref={useMergedRefs(ref, setInput)}
      type="text"
      value={text}
      readOnly={isReadOnly}
      onChange={(event) => {
        settledRef.current = null;
        setText(event.target.value);
      }}
      onBlur={(event) => {
        const settled = settledRef.current;
        const isSettled =
          settled?.kind === 'discarded' || (settled?.kind === 'committed' && settled.text === text);
        if (!isReadOnly && !isSettled && text !== value) {
          markCommitted(text);
          onCommit?.(text);
        }
        onBlur?.(event);
      }}
      {...hooks.root({
        className,
        props: rest,
        data: { dirty: text !== value, readonly: isReadOnly },
      })}
    />
  );
}
