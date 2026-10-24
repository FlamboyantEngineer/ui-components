import { useState, type KeyboardEvent } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { usePersistentState, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';

export interface CommentComposerProps extends BaseProps {
  /** The draft, controlled. */
  value?: string | undefined;
  /** The draft a new composer starts with, uncontrolled. Defaults to empty. */
  defaultValue?: string | undefined;
  /** Called with the draft as it changes. */
  onChange?: ((value: string) => void) | undefined;
  /**
   * Called with the trimmed text when the reader submits, then the draft clears. A returned promise
   * keeps the composer pending until it settles, and keeps the draft if it rejects.
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
  /** @deprecated Use `persistKey`. */
  storageKey?: string | undefined;
  /** Refuses typing, submitting and cancelling. */
  isDisabled?: boolean | undefined;
  /** Focuses the text box when the composer mounts. */
  autoFocus?: boolean | undefined;
}

const hooks = createHooks('comment-composer', ['field', 'actions', 'cancel', 'submit']);

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
  const [own, setOwn] = usePersistentState(persistKey, defaultValue);
  const setDraft = (next: string) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return [value ?? own, setDraft] as const;
}

/** Submitting, pending while a returned promise settles, and cancelling. */
function useComposerActions({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  isDisabled,
}: Pick<CommentComposerProps, 'onSubmit' | 'onCancel'> & {
  draft: string;
  setDraft: (next: string) => void;
  isDisabled: boolean;
}) {
  const [isPending, setIsPending] = useState(false);
  const text = draft.trim();
  const canSubmit = text !== '' && !isDisabled && !isPending;
  const submit = () => {
    if (!canSubmit) return;
    const result = onSubmit(text);
    if (!(result instanceof Promise)) {
      setDraft('');
      return;
    }
    setIsPending(true);
    // A rejected submit keeps the draft; the host reports the failure.
    void result
      .then(
        () => setDraft(''),
        () => undefined,
      )
      .finally(() => setIsPending(false));
  };
  const cancel = () => {
    setDraft('');
    onCancel?.();
  };
  return {
    isPending,
    canSubmit,
    canCancel: (text !== '' || onCancel !== undefined) && !isPending && !isDisabled,
    submit,
    cancel,
  };
}

/**
 * A plain-text comment box: a multi-line `TextField` with submit and cancel buttons. Ctrl+Enter or
 * Command+Enter submits and Escape cancels. A host with mentions or rich text passes its own
 * composer where this one is the default.
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
  storageKey,
  isDisabled = false,
  autoFocus,
  className,
  ...rest
}: CommentComposerProps) {
  const strings = useUiStrings();
  const [draft, setDraft] = useDraft({
    value,
    defaultValue,
    onChange,
    persistKey: persistKey ?? storageKey,
  });
  const actions = useComposerActions({ draft, setDraft, onSubmit, onCancel, isDisabled });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isSubmitChord(event)) {
      event.preventDefault();
      actions.submit();
    } else if (event.key === 'Escape' && actions.canCancel) {
      event.preventDefault();
      event.stopPropagation();
      actions.cancel();
    }
  };
  const fieldLabel = label ?? strings.addComment;
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { disabled: isDisabled, pending: actions.isPending } })}
      onKeyDown={onKeyDown}
    >
      <TextField
        className={hooks.slotClass('field')}
        label={fieldLabel}
        labelLayout="control-only"
        placeholder={placeholder ?? fieldLabel}
        multiline
        minRows={2}
        value={draft}
        committedValue={draft}
        onChange={setDraft}
        isDisabled={isDisabled}
        autoFocus={autoFocus}
      />
      <div {...hooks.slot('actions')}>
        {actions.canCancel ? (
          <Button
            size="sm"
            variant="ghost"
            className={hooks.slotClass('cancel')}
            onPress={actions.cancel}
          >
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
          onPress={actions.submit}
        >
          {submitLabel ?? strings.comment}
        </Button>
      </div>
    </div>
  );
}
