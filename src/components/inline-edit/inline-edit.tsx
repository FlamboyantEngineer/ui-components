import { useId, type ReactNode } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { TextField } from '../text-field/text-field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { isEmptyValue, useInlineEdit } from './use-inline-edit.js';

/** What `renderEditor` receives to draw the editor of an inline edit. */
export interface InlineEditEditorProps<T> {
  /** The value being edited. */
  value: T;
  /** Changes the value being edited. */
  onChange: (value: T) => void;
  /** Saves the value being edited, or `value` when given, and closes the editor once saved. */
  commit: (value?: T) => void;
  /** Closes the editor without saving. */
  cancel: () => void;
  /** The inline edit's label, which names the editor's control. */
  label: string;
  /** A save is running. */
  isPending: boolean;
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
  /** Keeps the value read only: the read view does not open the editor. */
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
function renderTextEditor<T>({ value, onChange, label, isPending }: InlineEditEditorProps<T>) {
  const text = String(value ?? '');
  return (
    <TextField
      label={label}
      labelLayout="control-only"
      value={text}
      // The draft is the field's committed value, so the field never shows its own dirty state.
      committedValue={text}
      onChange={(next) => onChange(next as T)}
      isPending={isPending}
    />
  );
}

/** The save and cancel buttons after the editor. */
function InlineEditActions({
  isPending,
  onSave,
  onCancel,
}: {
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot('actions')}>
      <IconButton
        icon="check"
        label={strings.save}
        size="sm"
        variant="secondary"
        className={hooks.slotClass('save')}
        isPending={isPending}
        onPress={onSave}
      />
      <IconButton
        icon="close"
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

/**
 * A value read in place that turns into its editor where it stands: a click, Enter, Space or F2 on
 * the read view opens the editor; Enter or focus leaving it saves, and Escape cancels. A save may be
 * asynchronous: the editor stays open and pending until it settles, and shows why it failed.
 */
export function InlineEdit<T = string>(props: InlineEditProps<T>) {
  const { value, label, renderValue, renderEditor = renderTextEditor, placeholder } = props;
  const { showActions = false, isDisabled = false, className, id, ...rest } = props;
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
  });
  const isEmpty = isEmptyValue(value);
  const data = {
    editing: edit.isEditing,
    pending: edit.isPending,
    invalid: edit.error !== null,
    empty: isEmpty,
    disabled: isDisabled,
  };
  return (
    <div id={id} {...hooks.root({ className, props: rest, data })}>
      {edit.isEditing ? (
        <div ref={edit.editorRef} {...hooks.slot('editor')} {...edit.editorHandlers}>
          <div {...hooks.slot('control')}>
            {renderEditor({
              value: edit.current,
              onChange: edit.setCurrent,
              commit: edit.commit,
              cancel: edit.cancel,
              label,
              isPending: edit.isPending,
            })}
          </div>
          {showActions ? (
            <InlineEditActions
              isPending={edit.isPending}
              onSave={() => edit.commit()}
              onCancel={edit.cancel}
            />
          ) : null}
          {edit.error === null ? null : (
            <InlineError className={hooks.slotClass('error')}>{edit.error}</InlineError>
          )}
        </div>
      ) : (
        <AriaButton
          ref={edit.readRef}
          className={hooks.slotClass('read')}
          aria-labelledby={`${nameId} ${valueId}`}
          isDisabled={isDisabled}
          onPress={edit.open}
          onKeyDown={(event) => {
            if (event.key === 'F2') edit.open();
            else event.continuePropagation();
          }}
        >
          <VisuallyHidden elementType="span" id={nameId}>
            {strings.editValue(label)}
          </VisuallyHidden>
          {isEmpty ? (
            <span id={valueId} {...hooks.slot('placeholder')}>
              {placeholder}
            </span>
          ) : (
            <span id={valueId} {...hooks.slot('value')}>
              {renderValue ? renderValue(value) : String(value)}
            </span>
          )}
          {isDisabled ? null : <Glyph name="edit" className={hooks.slotClass('icon')} />}
        </AriaButton>
      )}
    </div>
  );
}
