'use client';

import { type FocusEvent, type KeyboardEvent, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { usePersistentState, useUiStrings } from '../../core/provider.js';
import { containsFocus, getComposedActiveElement } from '../../utils/composed-focus.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { createJsonCodec } from '../../utils/json-codec.js';
import { useDraftSubmission } from '../../utils/use-draft-submission.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import type { CommentMentionFieldProps, CommentMentions } from './comment-mentions.js';

export interface CommentComposerProps extends BaseProps, RefProps<HTMLDivElement> {
  /** The draft, controlled. */
  value?: string | undefined;
  /** The draft a new composer starts with, uncontrolled. Defaults to empty. */
  defaultValue?: string | undefined;
  /** Called with the draft as it changes. */
  onChange?: ((value: string) => void) | undefined;
  /**
   * Called with the trimmed text when the reader submits, then the draft clears. A returned promise
   * keeps the composer pending until it settles; once it resolves, the draft clears only if it is
   * still the one submitted, and a rejection keeps it.
   */
  onSubmit: (text: string) => void | Promise<unknown>;
  /** Called when the reader cancels, after the draft clears. Shows Cancel even while the draft is empty. */
  onCancel?: (() => void) | undefined;
  /** Names the text box. Defaults to the provider's `addComment` string. */
  label?: string | undefined;
  /** A hint shown while the draft is empty. Defaults to `label`. */
  placeholder?: string | undefined;
  /** The submit button's label. Defaults to the provider's `comment` string. */
  submitLabel?: string | undefined;
  /** Keeps an uncontrolled draft in the provider storage under this key, across remounts. */
  persistKey?: string | undefined;
  /** Refuses typing, submitting and cancelling. */
  isDisabled?: boolean | undefined;
  /** Focuses the text box when the composer mounts. */
  autoFocus?: boolean | undefined;
  /** The rows the text box shows at least; it grows with its text from there. Defaults to 2. */
  minRows?: number | undefined;
  /**
   * Shows Cancel and submit only while focus is in the composer or the draft is not empty. Cancel
   * shows on focus even while the draft is empty, and then also takes focus out of the composer.
   */
  actionsOnFocus?: boolean | undefined;
  /**
   * Lets `@` mention people, from `createCommentMentions`: the draft and the submitted text hold
   * each mention as its token. Keep the object stable: a new one asks its source again.
   */
  mentions?: CommentMentions | undefined;
}

const hooks = createHooks('comment-composer', ['field', 'actions', 'cancel', 'submit']);

/** A stored draft, which is a string or falls back to the default. */
const draftCodec = createJsonCodec((value) => {
  if (typeof value !== 'string') throw new TypeError('A comment draft is a string.');
  return value;
});

/** A failed submit keeps the draft; the host reports the failure. */
const keepDraft = () => undefined;

/** Whether a key press is the submit chord, Ctrl+Enter or Command+Enter. */
function isSubmitChord(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}

/** The draft, controlled, kept in storage, or held here. */
function useDraft({
  value,
  defaultValue = '',
  onChange,
  persistKey,
}: Pick<CommentComposerProps, 'value' | 'defaultValue' | 'onChange' | 'persistKey'>) {
  const [own, setOwn] = usePersistentState(persistKey, defaultValue, { codec: draftCodec });
  const setDraft = (next: string) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return [value ?? own, setDraft] as const;
}

type ComposerActions = ReturnType<typeof useComposerActions>;

/** Submitting, pending while a returned promise settles, and cancelling. */
function useComposerActions({
  value,
  persistKey,
  draft,
  setDraft,
  onSubmit,
  onCancel,
  isDisabled,
  isFocusCancel,
}: Pick<CommentComposerProps, 'value' | 'persistKey' | 'onSubmit' | 'onCancel'> & {
  draft: string;
  setDraft: (next: string) => void;
  isDisabled: boolean;
  /** Cancel is offered because focus is in a composer with `actionsOnFocus`. */
  isFocusCancel: boolean;
}) {
  const submission = useDraftSubmission({
    onSubmitError: keepDraft,
    persistKey,
    empty: '',
    codec: draftCodec,
    isControlled: value !== undefined,
    draft,
    setDraft,
  });
  const isPending = submission.isSubmitting;
  const text = draft.trim();
  const canSubmit = text !== '' && !isDisabled && !isPending;
  /**
   * Sends the draft when it can, then calls `onSent`: the submit button, disabled once the draft
   * clears, moves focus on to the text box.
   */
  const submit = (onSent?: () => void) => {
    if (!canSubmit) return;
    // The draft is sent as it stands, so a resolved submit clears it only while it is unchanged.
    submission.send(draft, true, (sent) => onSubmit(sent.trim()));
    onSent?.();
  };
  const cancel = () => {
    submission.setDraft('');
    onCancel?.();
  };
  return {
    isPending,
    setDraft: submission.setDraft,
    canSubmit,
    canCancel:
      (text !== '' || onCancel !== undefined || isFocusCancel) && !isPending && !isDisabled,
    submit,
    cancel,
  };
}

/**
 * Submits on the chord, and cancels on Escape while there is something to cancel. A key that
 * belongs to an input method composition is left to the input method and the surface around.
 */
function handleComposerKey(event: KeyboardEvent, actions: ComposerActions, cancel: () => void) {
  if (isComposingKey(event.nativeEvent)) return;
  if (isSubmitChord(event)) {
    event.preventDefault();
    actions.submit();
  } else if (event.key === 'Escape' && actions.canCancel) {
    event.preventDefault();
    event.stopPropagation();
    cancel();
  }
}

/** The composer's text box, whichever field draws it. */
function findTextBox(root: HTMLElement | null) {
  return root?.querySelector<HTMLElement>('textarea, [role="textbox"]');
}

/** The text box: a multi-line `TextField`, or the one `mentions` draws. */
function ComposerField({
  field,
  mentions,
}: {
  field: CommentMentionFieldProps;
  mentions: CommentMentions | undefined;
}) {
  if (mentions) return mentions.renderField(field);
  return <TextField {...field} labelLayout="control-only" multiline tracksChanges={false} />;
}

/** Whether focus is in the composer: it enters, or leaves for somewhere outside it. */
function useFocusWithin() {
  const [isFocused, setIsFocused] = useState(false);
  return {
    isFocused,
    focusHandlers: {
      onFocus: () => setIsFocused(true),
      onBlur: (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      },
    },
  };
}

/** Takes focus out of the composer, so a composer with `actionsOnFocus` folds its actions away. */
function leaveComposer(root: HTMLElement | null) {
  if (!root || !containsFocus(root)) return;
  const active = getComposedActiveElement(root);
  if (isHTMLElement(active)) active.blur();
}

/** Cancel, while there is something to cancel, and submit. */
function ComposerButtons({
  actions,
  submitLabel,
  cancel,
  onSubmitted,
}: {
  actions: ComposerActions;
  submitLabel: string;
  cancel: () => void;
  onSubmitted: () => void;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('actions')}>
      {actions.canCancel ? (
        <Button size="sm" variant="ghost" className={hooks.slotClass('cancel')} onPress={cancel}>
          {strings.cancel}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="primary"
        className={hooks.slotClass('submit')}
        isDisabled={!actions.canSubmit && !actions.isPending}
        isPending={actions.isPending}
        shortcut="Ctrl+Enter"
        onPress={() => actions.submit(onSubmitted)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

/**
 * A plain-text comment box: a multi-line `TextField` with submit and cancel buttons. Ctrl+Enter or
 * Command+Enter submits and Escape cancels. With `mentions`, `@` picks a person, who shows as a chip
 * and is submitted as a token in the text. A host with rich text passes its own composer where this
 * one is the default.
 */
export function CommentComposer({
  value,
  defaultValue,
  onChange,
  onSubmit,
  onCancel,
  label,
  placeholder,
  submitLabel,
  persistKey,
  isDisabled = false,
  autoFocus,
  minRows = 2,
  actionsOnFocus = false,
  mentions,
  className,
  ref,
  ...rest
}: CommentComposerProps) {
  const strings = useUiStrings();
  const [rootRef, setRootRef] = useForwardedRef(ref);
  const requestFocus = useFocusRequest();
  const focusTextBox = () => requestFocus(() => findTextBox(rootRef.current));
  const { isFocused, focusHandlers } = useFocusWithin();
  const [draft, setDraft] = useDraft({ value, defaultValue, onChange, persistKey });
  const actions = useComposerActions({
    value,
    persistKey,
    draft,
    setDraft,
    onSubmit,
    onCancel,
    isDisabled,
    isFocusCancel: actionsOnFocus && isFocused,
  });
  // Cancel clears the draft; the focus then moves on to the text box, as the button goes, or out of
  // a composer whose actions show on focus, so they fold away.
  const cancel = () => {
    actions.cancel();
    if (actionsOnFocus) leaveComposer(rootRef.current);
    else focusTextBox();
  };
  const fieldLabel = label ?? strings.addComment;
  const showsActions = !actionsOnFocus || isFocused || draft.trim() !== '' || actions.isPending;
  return (
    <div
      {...rest}
      ref={setRootRef}
      {...hooks.root({ className, data: { disabled: isDisabled, pending: actions.isPending } })}
      {...focusHandlers}
      onKeyDown={(event) => handleComposerKey(event, actions, cancel)}
    >
      <ComposerField
        mentions={mentions}
        field={{
          className: hooks.slotClass('field'),
          label: fieldLabel,
          placeholder: placeholder ?? fieldLabel,
          value: draft,
          onChange: actions.setDraft,
          isDisabled,
          autoFocus,
          minRows,
        }}
      />
      {showsActions ? (
        <ComposerButtons
          actions={actions}
          submitLabel={submitLabel ?? strings.comment}
          cancel={cancel}
          onSubmitted={focusTextBox}
        />
      ) : null}
    </div>
  );
}
