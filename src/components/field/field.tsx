'use client';

import { isEmptyValue } from '../../utils/is-empty-value.js';
import { useCallback, useState, type ReactNode } from 'react';
import type { BaseProps, ControlSize, Key } from '../../core/props.js';
import { createSlotRegistry, type SlotRegistry } from '../../utils/slot-registry.js';
import {
  FieldContextMenu,
  FieldMenuButton,
  useFieldMenu,
  type FieldMenuEntry,
  type FieldMenuModel,
} from './field-menu.js';
import {
  FieldHelp,
  FieldLabel,
  FieldMessage,
  fieldHooks as hooks,
  toFieldControlProps,
  toInnerControlSize,
  useFieldIds,
  type FieldControlProps,
  type FieldDensity,
  type FieldLabelLayout,
} from './field-parts.js';
import { useFieldFocus } from './field-focus.js';
import { useFieldFormBinding } from './field-form.js';
import { FieldRestoreButton } from './field-restore-button.js';
import type { FieldIssue, FieldState, FieldValidation } from './field-state.js';
import { useFieldUndo } from './field-undo.js';

export interface FieldProps<T> extends BaseProps {
  /** The field's controller, from `useFieldState`. */
  state: FieldState<T>;
  /** The field's name: the label text, and the accessible name of its control. */
  label: string;
  /** Where the label sits against the control. Defaults to `label-control`. */
  labelLayout?: FieldLabelLayout | undefined;
  /**
   * The control's height on the shared control scale, which sizes the field's type and its
   * buttons with it. Defaults to `md`.
   */
  size?: ControlSize | undefined;
  /**
   * Whether the field keeps room for its message and restore button while it has neither
   * (`default`), or only takes it while it shows them (`compact`), for dense rows.
   */
  density?: FieldDensity | undefined;
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
  /**
   * Renders the message the field shows, from its validation and every issue behind it (each with
   * its `validity`), to word a message per validity state or list every issue. Defaults to the
   * validation's message.
   */
  renderMessage?:
    | ((validation: FieldValidation, issues: readonly FieldIssue[]) => ReactNode)
    | undefined;
  /**
   * Commits the value once focus leaves the field (its control, its buttons and the popovers they
   * open), for a control that commits on blur: moving to the field's own buttons does not commit.
   */
  commitOnBlur?: boolean | undefined;
  /** Renders the control with the props that name, describe and lock it. */
  children: (control: FieldControlProps) => ReactNode;
}

type FieldSlots = SlotRegistry<'root' | 'control'>;

/** Focus in the field: leaving it touches the field and, with `commitOnBlur`, commits first. */
function useFieldLeave(state: FieldState<unknown>, slots: FieldSlots, commitOnBlur: boolean) {
  return useFieldFocus({
    getRoot: () => slots.read('root'),
    getControl: () => slots.read('control'),
    onLeave: () => {
      if (commitOnBlur) state.commit();
      state.touch();
    },
  });
}

/** Puts the committed value back; the button leaves with it, so keyboard focus moves to the control first. */
function restoreField(state: FieldState<unknown>, slots: FieldSlots) {
  slots.read('control')?.focus();
  state.restore();
}

/** What the root publishes: its layout, and its states from the field state and its focus. */
function toFieldData(
  layout: { labelLayout: FieldLabelLayout; size: ControlSize; density: FieldDensity | undefined },
  state: FieldState<unknown>,
  focused: boolean,
) {
  return {
    ...layout,
    density: layout.density ?? 'default',
    focused,
    validation: state.validation.status,
    dirty: state.isDirty,
    required: state.isRequired,
    readonly: state.isReadOnly,
    disabled: state.isDisabled,
    touched: state.isTouched,
    filled: !isEmptyValue(state.value),
  };
}

/** The buttons after the control, one size below the field: restore while dirty, help and menu. */
function FieldButtons({
  label,
  size,
  help,
  menu,
  onRestore,
}: {
  label: string;
  size: ControlSize;
  help: { id: string; content: ReactNode } | null;
  menu: FieldMenuModel | null;
  onRestore: (() => void) | null;
}) {
  return (
    <>
      {onRestore ? <FieldRestoreButton label={label} size={size} onPress={onRestore} /> : null}
      {help ? (
        <FieldHelp id={help.id} label={label} size={size}>
          {help.content}
        </FieldHelp>
      ) : null}
      {menu ? (
        <FieldMenuButton model={menu} size={size} className={hooks.slotClass('menu')} />
      ) : null}
    </>
  );
}

/**
 * Lays out a field around its control: the label, the control, the restore, help and menu buttons,
 * the host's decoration, the description and the validation message. It gives the control its ids
 * and ARIA, applies undo and redo chords pressed inside it, registers its undo for `getFieldUndo`
 * and takes part in an enclosing form.
 */
export function Field<T>({
  state,
  label,
  labelLayout = 'label-control',
  size = 'md',
  density,
  description,
  help,
  decoration,
  menu = [],
  onMenuAction,
  renderMessage,
  commitOnBlur = false,
  children,
  className,
  id,
  ...rest
}: FieldProps<T>) {
  const ids = useFieldIds(id);
  const [slots] = useState<FieldSlots>(() => createSlotRegistry());
  const getRoot = useCallback(() => slots.read('root'), [slots]);
  const onKeyDown = useFieldUndo(getRoot, state);
  const focus = useFieldLeave(state as FieldState<unknown>, slots, commitOnBlur);
  useFieldFormBinding(state as FieldState<unknown>, slots, label);
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
  const data = toFieldData(
    { labelLayout, size, density },
    state as FieldState<unknown>,
    focus.isFocused,
  );
  return (
    <FieldContextMenu model={menuModel}>
      <div
        {...hooks.root({ className, props: rest, data })}
        id={id}
        ref={slots.ref('root')}
        onKeyDown={onKeyDown}
        onFocus={focus.onFocus}
        onBlur={focus.onBlur}
      >
        {labelLayout === 'control-label' ? null : labelElement}
        <div {...hooks.slot('control')}>{children(control)}</div>
        {labelLayout === 'control-label' ? labelElement : null}
        <FieldButtons
          label={label}
          size={toInnerControlSize(size)}
          help={help ? { id: ids.help, content: help } : null}
          menu={menu.length > 0 ? menuModel : null}
          onRestore={state.isDirty ? () => restoreField(state as FieldState<unknown>, slots) : null}
        />
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
        <FieldMessage id={ids.message} validation={state.validation}>
          {renderMessage ? renderMessage(state.validation, state.issues) : state.validation.message}
        </FieldMessage>
      </div>
    </FieldContextMenu>
  );
}

export type { FieldControlProps, FieldDensity, FieldLabelLayout } from './field-parts.js';
export { toAriaControlProps, useFieldControl } from './field-control.js';
export type {
  FieldControl,
  FieldControlOptions,
  FieldInputMode,
  FieldInputProps,
  FieldLayoutProps,
  FieldTextInputProps,
} from './field-control.js';
export type { FieldMenuAction, FieldMenuEntry } from './field-menu.js';
export { FieldPreviousValue } from './field-previous-value.js';
export type { FieldPreviousValueProps } from './field-previous-value.js';
export { FieldRestoreButton } from './field-restore-button.js';
export type { FieldRestoreButtonProps } from './field-restore-button.js';
export { useFieldState } from './field-state.js';
export type {
  FieldAsyncValidate,
  FieldIssue,
  FieldIssues,
  FieldSeverity,
  FieldState,
  FieldStateOptions,
  FieldStatus,
  FieldValidation,
  FieldValidationBehavior,
  FieldValidationErrors,
  FieldValidationMode,
  FieldValidity,
} from './field-state.js';
export { FieldScopeContext, useFieldScope } from './field-scope.js';
export type { FieldRegistration, FieldScope } from './field-scope.js';
export { Fieldset } from './fieldset.js';
export type { FieldsetProps } from './fieldset.js';
export { getFieldUndo } from './field-undo.js';
export type { FieldUndo } from './field-undo.js';
export { countCodePoints, validateString } from './string-rules.js';
export type { StringRuleMessages, StringRules } from './string-rules.js';
