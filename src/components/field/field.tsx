import { useCallback, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import type { BaseProps } from '../../core/props.js';
import { createSlotRegistry } from '../../utils/slot-registry.js';
import {
  FieldContextMenu,
  FieldMenuButton,
  useFieldMenu,
  type FieldMenuEntry,
} from './field-menu.js';
import {
  FieldHelp,
  FieldLabel,
  FieldMessage,
  fieldHooks as hooks,
  toFieldControlProps,
  useFieldIds,
  type FieldControlProps,
  type FieldLabelLayout,
} from './field-parts.js';
import { FieldRestoreButton } from './field-restore-button.js';
import type { FieldState } from './field-state.js';
import { useFieldUndo } from './field-undo.js';

export interface FieldProps<T> extends BaseProps {
  /** The field's controller, from `useFieldState`. */
  state: FieldState<T>;
  /** The field's name: the label text, and the accessible name of its control. */
  label: string;
  /** Where the label sits against the control. Defaults to `label-control`. */
  labelLayout?: FieldLabelLayout | undefined;
  /** Help text below the control, which describes it. */
  description?: ReactNode;
  /** Help shown in a tooltip from a help button after the control. */
  help?: ReactNode;
  /** Badges and other marks the host renders for the field; they describe the control. */
  decoration?: ReactNode;
  /** The field menu, opened from a menu button and as the field's context menu. */
  menu?: readonly FieldMenuEntry[] | undefined;
  /** Called with the id of the chosen menu entry, after a built-in action has run. */
  onMenuAction?: ((key: Key) => void) | undefined;
  /** Renders the control with the props that name, describe and lock it. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Lays out a field around its control: the label, the control, the restore, help and menu buttons,
 * the host's decoration, the description and the validation message. It gives the control its ids
 * and ARIA, applies undo and redo chords pressed inside it and registers its undo for `getFieldUndo`.
 */
export function Field<T>({
  state,
  label,
  labelLayout = 'label-control',
  description,
  help,
  decoration,
  menu = [],
  onMenuAction,
  children,
  className,
  id,
  ...rest
}: FieldProps<T>) {
  const ids = useFieldIds(id);
  const [slots] = useState(() => createSlotRegistry<'root' | 'control'>());
  const getRoot = useCallback(() => slots.read('root'), [slots]);
  const onKeyDown = useFieldUndo(getRoot, state);
  const menuModel = useFieldMenu(state, label, { menu, onMenuAction });
  const hasLabel = labelLayout !== 'control-only';
  const control = toFieldControlProps(state, ids, {
    ref: slots.ref('control'),
    label: hasLabel ? undefined : label,
    hasDescription: Boolean(description),
    hasDecoration: Boolean(decoration),
  });
  const labelElement = hasLabel ? (
    <FieldLabel ids={ids} label={label} layout={labelLayout} isRequired={state.isRequired} />
  ) : null;
  const restore = () => {
    // The button leaves once the value is restored, so keyboard focus moves to the control first.
    slots.read('control')?.focus();
    state.restore();
  };
  const data = {
    labelLayout,
    validation: state.validation.status,
    dirty: state.isDirty,
    required: state.isRequired,
    readonly: state.isReadOnly,
    disabled: state.isDisabled,
  };
  return (
    <FieldContextMenu model={menuModel}>
      <div
        {...hooks.root({ className, props: rest, data })}
        id={id}
        ref={slots.ref('root')}
        onKeyDown={onKeyDown}
      >
        {labelLayout === 'control-label' ? null : labelElement}
        <div {...hooks.slot('control')}>{children(control)}</div>
        {labelLayout === 'control-label' ? labelElement : null}
        {state.isDirty ? <FieldRestoreButton label={label} size="sm" onPress={restore} /> : null}
        {help ? (
          <FieldHelp id={ids.help} label={label}>
            {help}
          </FieldHelp>
        ) : null}
        {menu.length > 0 ? (
          <FieldMenuButton model={menuModel} className={hooks.slotClass('menu')} />
        ) : null}
        {decoration ? (
          <div {...hooks.slot('decoration')} id={ids.decoration}>
            {decoration}
          </div>
        ) : null}
        {description ? (
          <div {...hooks.slot('description')} id={ids.description}>
            {description}
          </div>
        ) : null}
        <FieldMessage id={ids.message} validation={state.validation} />
      </div>
    </FieldContextMenu>
  );
}

export type { FieldControlProps, FieldLabelLayout } from './field-parts.js';
export type { FieldMenuAction, FieldMenuEntry } from './field-menu.js';
export { FieldRestoreButton } from './field-restore-button.js';
export type { FieldRestoreButtonProps } from './field-restore-button.js';
export { useFieldState } from './field-state.js';
export type {
  FieldIssue,
  FieldSeverity,
  FieldState,
  FieldStateOptions,
  FieldStatus,
  FieldValidation,
} from './field-state.js';
export { getFieldUndo } from './field-undo.js';
export type { FieldUndo } from './field-undo.js';
export { validateString } from './string-rules.js';
export type { StringRuleMessages, StringRules } from './string-rules.js';
