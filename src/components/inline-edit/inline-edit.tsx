'use client';

import { CheckGlyph, CloseGlyph, EditGlyph } from '../../core/glyphs.js';
import { isEmptyValue } from '../../utils/is-empty-value.js';
import { useId, type ReactNode, type Ref } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { TextField } from '../text-field/text-field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { useInlineEdit } from './use-inline-edit.js';
import { useScopedDisabled } from '../field/field.js';

/** What `renderEditor` receives to draw the editor of an inline edit. */
export interface InlineEditEditorProps<T> {
  /** The value being edited. */
  value: T;
  /** Changes the value being edited. */
  onChange: (value: T) => void;
  /**
   * Saves the value being edited, or `value` when given (an explicit `null` or `undefined`
   * included), which becomes the value being edited. Closes the editor once saved, unless it was
   * edited again meanwhile.
   */
  commit: (...value: [] | [T]) => void;
  /** Closes the editor without saving. */
  cancel: () => void;
  /** The inline edit's label, which names the editor's control. */
  label: string;
  /** A save is running. */
  isPending: boolean;
  /** The inline edit is disabled: the editor keeps its draft but saves nothing until enabled. */
  isDisabled: boolean;
}

export interface InlineEditProps<T = string> extends BaseProps {
  /** The saved value, shown in the read view. */
  value: T;
  /**
   * Saves a changed value. A returned promise keeps the editor open and pending until it settles;
   * a rejection keeps it open with the rejection's message.
   */
  onSave: (value: T) => void | Promise<unknown>;
  /** Names the value: the read view reads as "Edit" and the label, and it names the editor. */
  label: string;
  /** Draws the value in the read view. Defaults to the value as text. */
  renderValue?: ((value: T) => ReactNode) | undefined;
  /** Draws the editor. Defaults to a one-line text field, for a text value. */
  renderEditor?: ((props: InlineEditEditorProps<T>) => ReactNode) | undefined;
  /** Shown in the read view while the value is empty. */
  placeholder?: ReactNode;
  /** Draws save and cancel buttons after the editor. */
  showActions?: boolean | undefined;
  /** Whether the editor is open, controlled. */
  isEditing?: boolean | undefined;
  /** Whether the editor is open at first, uncontrolled. */
  defaultEditing?: boolean | undefined;
  /** Called when the editor opens or closes. */
  onEditingChange?: ((isEditing: boolean) => void) | undefined;
  /**
   * Keeps the value read only: the read view does not open the editor, and an open editor keeps
   * its draft but saves nothing (Enter, focus leaving, the save button or `commit`) until enabled.
   */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('inline-edit', [
  'read',
  'value',
  'placeholder',
  'icon',
  'editor',
  'control',
  'actions',
  'save',
  'cancel',
  'error',
]);

/** The default editor: a one-line text field named by the label. */
function renderTextEditor<T>(props: InlineEditEditorProps<T>) {
  const { value, onChange, label, isPending, isDisabled } = props;
  const text = String(value ?? '');
  return (
    <TextField
      label={label}
      labelLayout="control-only"
      value={text}
      // The draft is the field's value; the editor tracks changes, not the field.
      tracksChanges={false}
      onChange={(next) => onChange(next as T)}
      isPending={isPending}
      isDisabled={isDisabled}
    />
  );
}

/** The save and cancel buttons after the editor. */
function InlineEditActions({
  isPending,
  isDisabled,
  onSave,
  onCancel,
}: {
  isPending: boolean;
  isDisabled: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot('actions')}>
      <Button
        icon={CheckGlyph}
        label={strings.save}
        size="sm"
        variant="secondary"
        className={hooks.slotClass('save')}
        isPending={isPending}
        isDisabled={isDisabled}
        onPress={onSave}
      />
      <Button
        icon={CloseGlyph}
        label={strings.cancel}
        size="sm"
        variant="secondary"
        className={hooks.slotClass('cancel')}
        isDisabled={isPending}
        onPress={onCancel}
      />
    </span>
  );
}

/** The read view: a button named "Edit" and the label, showing the value, that opens the editor. */
function InlineEditRead({
  ref,
  label,
  isDisabled,
  onOpen: open,
  content,
  nameId,
  valueId,
}: {
  ref: Ref<HTMLButtonElement>;
  label: string;
  isDisabled: boolean;
  onOpen: () => void;
  content: ReactNode;
  nameId: string;
  valueId: string;
}) {
  const strings = useUiStrings();
  return (
    <AriaButton
      ref={ref}
      className={hooks.slotClass('read')}
      aria-labelledby={`${nameId} ${valueId}`}
      isDisabled={isDisabled}
      onPress={open}
      onKeyDown={(event) => {
        if (event.key === 'F2') open();
        else event.continuePropagation();
      }}
    >
      <VisuallyHidden elementType="span" id={nameId}>
        {strings.editValue(label)}
      </VisuallyHidden>
      {content}
      {isDisabled ? null : <Glyph icon={EditGlyph} className={hooks.slotClass('icon')} />}
    </AriaButton>
  );
}

/**
 * A value read in place that turns into its editor where it stands: a click, Enter, Space or F2 on
 * the read view opens the editor; Enter or focus leaving it saves, and Escape cancels. A save may be
 * asynchronous: the editor stays open and pending until it settles, and shows why it failed.
 */
export function InlineEdit<T = string>(props: InlineEditProps<T>) {
  const { value, label, renderValue, renderEditor = renderTextEditor, placeholder } = props;
  const { showActions = false, className, id, ...rest } = props;
  const isDisabled = useScopedDisabled(props.isDisabled);
  const strings = useUiStrings();
  const nameId = useId();
  const valueId = `${nameId}-value`;
  const edit = useInlineEdit({
    value,
    onSave: props.onSave,
    isEditing: props.isEditing,
    defaultEditing: props.defaultEditing ?? false,
    onEditingChange: props.onEditingChange,
    failureMessage: strings.saveFailed,
    isDisabled,
  });
  const { isEditing, isPending, error, edited, setEdited, open, cancel, commit } = edit;
  const { editorHandlers, editorRef, readRef } = edit;
  const isEmpty = isEmptyValue(value);
  const data = {
    editing: isEditing,
    pending: isPending,
    invalid: error !== null,
    empty: isEmpty,
    disabled: isDisabled,
  };
  return (
    <div id={id} {...hooks.root({ className, props: rest, data })}>
      {isEditing ? (
        <div ref={editorRef} {...hooks.slot('editor')} {...editorHandlers}>
          <div {...hooks.slot('control')}>
            {renderEditor({
              value: edited,
              onChange: setEdited,
              commit: commit,
              cancel: cancel,
              label,
              isPending: isPending,
              isDisabled,
            })}
          </div>
          {showActions ? (
            <InlineEditActions
              isPending={isPending}
              isDisabled={isDisabled}
              onSave={() => commit()}
              onCancel={cancel}
            />
          ) : null}
          {error === null ? null : (
            <InlineError className={hooks.slotClass('error')}>{error}</InlineError>
          )}
        </div>
      ) : (
        <InlineEditRead
          ref={readRef}
          label={label}
          isDisabled={isDisabled}
          onOpen={open}
          content={
            isEmpty ? (
              <span id={valueId} {...hooks.slot('placeholder')}>
                {placeholder}
              </span>
            ) : (
              <span id={valueId} {...hooks.slot('value')}>
                {renderValue ? renderValue(value) : String(value)}
              </span>
            )
          }
          nameId={nameId}
          valueId={valueId}
        />
      )}
    </div>
  );
}
