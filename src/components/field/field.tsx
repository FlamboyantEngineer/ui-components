'use client';

import { type ReactNode, type RefObject, useRef, useState } from 'react';
import type { BaseProps, ControlSize, Key, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { createSlotRegistry } from '../../utils/slot-registry.js';
import { type FieldSlots, useFieldBehaviour } from './field-behaviour.js';
import { focusControl } from './field-form.js';
import { FieldHelpParts } from './field-help.js';
import {
  defaultFieldMenu,
  type FieldMenuEntry,
  type FieldMenuIcons,
} from './field-menu-entries.js';
import { type FieldMessageDisplay, FieldMessageTooltip } from './field-message-tooltip.js';
import {
  type FieldChangeLayout,
  type FieldControlProps,
  type FieldDensity,
  fieldHooks as hooks,
  FieldLabel,
  type FieldLabelLayout,
  FieldMessage,
  toFieldControlProps,
  toInnerControlSize,
  useFieldIds,
} from './field-parts.js';
import { FieldChangeLayoutContext } from './field-previous-value.js';
import { FieldRestoreButton } from './field-restore-button.js';
import type { FieldIssue, FieldState, FieldValidation } from './field-state.js';

export interface FieldProps<T> extends BaseProps, RefProps<HTMLDivElement> {
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
  /**
   * Where the control shows the value a dirty field's edit replaced (`FieldPreviousValue`): before
   * the current value (`inline`, the default), on its own line above it (`stacked`), or nowhere
   * (`hidden`), leaving the dirty state, the restore button and the menu's Reset.
   */
  changeLayout?: FieldChangeLayout | undefined;
  /**
   * Where the validation message shows: in a line below the control (`inline`, the default), or in
   * a tooltip against the control while the field is focused or hovered (`tooltip`), which never
   * takes room or moves the layout as the message comes and goes.
   */
  messageDisplay?: FieldMessageDisplay | undefined;
  /** Help text below the control, which describes it. */
  description?: ReactNode;
  /**
   * Help shown in a tooltip from a help button after the control, and from Help, which the
   * context menu then offers.
   */
  help?: ReactNode;
  /**
   * Draws the help button. Defaults to true; false leaves the help to the context menu's Help, and
   * the help then describes the control.
   */
  showHelpButton?: boolean | undefined;
  /** Badges and other marks the host renders for the field; they describe the control. */
  decoration?: ReactNode;
  /**
   * The field's context menu, opened by a secondary click or long touch on the field or Shift+F10
   * or the Context Menu key in it. Defaults to Clear (when the field may be cleared) and Reset; an
   * empty list leaves the browser's context menu alone.
   */
  menu?: readonly FieldMenuEntry[] | undefined;
  /**
   * Icons for the menu's built-in actions, by action (`clear`, `reset`, `set-default`, `help`):
   * an icon replaces the action's own, `null` removes it. Custom entries take theirs from the entry.
   */
  menuIcons?: FieldMenuIcons | undefined;
  /** Called with the id of the chosen menu entry, after a built-in action has run. */
  onMenuAction?: ((key: Key) => void) | undefined;
  /**
   * Renders the message the field shows, from its validation and every issue behind it (each with
   * its `validity`), to word a message per validity state or list every issue. Defaults to the
   * validation's message.
   */
  renderMessage?:
    ((validation: FieldValidation, issues: readonly FieldIssue[]) => ReactNode) | undefined;
  /** Focuses the control when the field mounts (its first focusable element for a group). */
  autoFocus?: boolean | undefined;
  /**
   * Commits the value once focus leaves the field (its control, its buttons and the popovers they
   * open), for a control that commits on blur: moving to the field's own buttons does not commit.
   */
  commitOnBlur?: boolean | undefined;
  /** Renders the control with the props that name, describe and lock it. */
  children: (control: FieldControlProps) => ReactNode;
}

/** Puts the committed value back; the button leaves with it, so keyboard focus moves to the control first. */
function restoreField(state: FieldState<unknown>, slots: FieldSlots) {
  focusControl(slots.read('control'));
  state.restore();
}

/** What the root publishes: its layout, and its states from the field state and its focus. */
function toFieldData(
  layout: {
    labelLayout: FieldLabelLayout;
    size: ControlSize;
    density: FieldDensity | undefined;
    changeLayout: FieldChangeLayout | undefined;
    messageDisplay: FieldMessageDisplay | undefined;
  },
  state: FieldState<unknown>,
  focused: boolean,
) {
  return {
    ...layout,
    density: layout.density ?? 'default',
    changeLayout: layout.changeLayout ?? 'inline',
    messageDisplay: layout.messageDisplay ?? 'inline',
    focused,
    validation: state.validation.status,
    dirty: state.isDirty,
    required: state.isRequired,
    readonly: state.isReadOnly,
    disabled: state.isDisabled,
    touched: state.isTouched,
    filled: !state.isEmpty,
  };
}

/** The parts after the control, one size below the field: restore while dirty, and the help. */
function FieldButtons({
  props: { label, size = 'md', help, showHelpButton = true },
  ids,
  state,
  slots,
  behaviour,
  controlSlot,
}: {
  props: Pick<FieldProps<unknown>, 'label' | 'size' | 'help' | 'showHelpButton'>;
  ids: ReturnType<typeof useFieldIds>;
  state: FieldState<unknown>;
  slots: FieldSlots;
  behaviour: ReturnType<typeof useFieldBehaviour>;
  controlSlot: RefObject<Element | null>;
}) {
  const button = { label, size: toInnerControlSize(size) };
  return (
    <>
      {state.isDirty ? (
        <FieldRestoreButton {...button} onPress={() => restoreField(state, slots)} />
      ) : null}
      {isEmptyNode(help) ? null : (
        <FieldHelpParts
          {...button}
          help={{ id: ids.help, content: help }}
          showButton={showHelpButton}
          tooltip={behaviour.help}
          controlSlot={controlSlot}
          getRoot={behaviour.getRoot}
        />
      )}
    </>
  );
}

/** The parts after the control's row: the decoration, the description and the message. */
function FieldNotes({
  ids,
  state,
  decoration,
  description,
  renderMessage,
  tooltip,
}: {
  ids: ReturnType<typeof useFieldIds>;
  state: FieldState<unknown>;
  decoration: ReactNode;
  description: ReactNode;
  renderMessage: FieldProps<unknown>['renderMessage'];
  tooltip: { isOpen: boolean; anchor: RefObject<Element | null> } | null;
}) {
  const message = renderMessage
    ? renderMessage(state.validation, state.issues)
    : state.validation.message;
  return (
    <>
      {isEmptyNode(decoration) ? null : (
        <div {...hooks.slot('decoration')} id={ids.decoration}>
          {decoration}
        </div>
      )}
      {isEmptyNode(description) ? null : (
        <div {...hooks.slot('description')} id={ids.description}>
          {description}
        </div>
      )}
      <FieldMessage id={ids.message} validation={state.validation}>
        {message}
      </FieldMessage>
      {tooltip ? (
        <FieldMessageTooltip
          isOpen={tooltip.isOpen}
          anchor={tooltip.anchor}
          validation={state.validation}
        >
          {message}
        </FieldMessageTooltip>
      ) : null}
    </>
  );
}

/**
 * Lays out a field around its control: the label, the control, the restore and help buttons,
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
  changeLayout,
  messageDisplay = 'inline',
  description,
  help,
  showHelpButton,
  decoration,
  menu = defaultFieldMenu,
  menuIcons,
  onMenuAction,
  renderMessage,
  autoFocus,
  commitOnBlur = false,
  children,
  className,
  id,
  ref,
  ...rest
}: FieldProps<T>) {
  const ids = useFieldIds(id);
  const [slots] = useState<FieldSlots>(() => createSlotRegistry());
  const behaviour = useFieldBehaviour(state, slots, {
    ...{ label, menu, menuIcons, onMenuAction },
    ...{ commitOnBlur, autoFocus, messageDisplay, ref },
    hasHelp: !isEmptyNode(help),
  });
  const controlSlot = useRef<HTMLDivElement>(null);
  const hasLabel = labelLayout !== 'control-only';
  const control = toFieldControlProps(state, ids, {
    ref: slots.ref('control'),
    label: hasLabel ? undefined : label,
    hasDescription: !isEmptyNode(description),
    hasDecoration: !isEmptyNode(decoration),
    hasHelp: showHelpButton === false && !isEmptyNode(help),
  });
  const labelElement = hasLabel ? (
    <FieldLabel ids={ids} label={label} layout={labelLayout} isRequired={state.isRequired} />
  ) : null;
  const data = toFieldData(
    { labelLayout, size, density, changeLayout, messageDisplay },
    state,
    behaviour.isFocused,
  );
  return (
    <div {...hooks.root({ className, props: rest, data })} {...behaviour.rootProps} id={id}>
      {labelLayout === 'control-label' ? null : labelElement}
      <div {...hooks.slot('control')} ref={controlSlot}>
        <FieldChangeLayoutContext value={changeLayout ?? 'inline'}>
          {children(control)}
        </FieldChangeLayoutContext>
      </div>
      {labelLayout === 'control-label' ? labelElement : null}
      <FieldButtons
        props={{ label, size, help, showHelpButton }}
        {...{ ids, state, slots, behaviour, controlSlot }}
      />
      <FieldNotes
        ids={ids}
        state={state}
        decoration={decoration}
        description={description}
        renderMessage={renderMessage}
        tooltip={
          messageDisplay === 'tooltip'
            ? { isOpen: behaviour.isTooltipOpen, anchor: controlSlot }
            : null
        }
      />
      {behaviour.menu}
    </div>
  );
}

export { toAriaControlProps } from './aria-control-props.js';
export type {
  FieldControl,
  FieldControlOptions,
  FieldEnterKeyHint,
  FieldInputMode,
  FieldInputProps,
  FieldLayoutProps,
  FieldTextInputProps,
} from './field-control.js';
export { toSpellCheckAttribute, useFieldControl } from './field-control.js';
export { FieldFormValue } from './field-form-value.js';
export type { FieldMenuAction, FieldMenuEntry, FieldMenuIcons } from './field-menu-entries.js';
export type { FieldMessageDisplay } from './field-message-tooltip.js';
export type {
  FieldChangeLayout,
  FieldControlProps,
  FieldDensity,
  FieldLabelLayout,
} from './field-parts.js';
export { FieldMessage, toInnerControlSize } from './field-parts.js';
export { PickerOptionRow, usePickerEmptyContent, usePickerPopoverStyle } from './field-picker.js';
export type { PickerItem, PickerOption, PickerSection } from './field-picker-items.js';
export { flattenPickerItems, isPickerSection, pickerListLayout } from './field-picker-items.js';
export type { FieldPreviousValueProps } from './field-previous-value.js';
export { FieldPreviousValue } from './field-previous-value.js';
export type { FieldRestoreButtonProps } from './field-restore-button.js';
export { FieldRestoreButton } from './field-restore-button.js';
export type { FieldRegistration, FieldScope } from './field-scope.js';
export {
  FieldScopeContext,
  useFieldScope,
  useRevealScope,
  useScopedDisabled,
} from './field-scope.js';
export type {
  FieldAsyncValidate,
  FieldErrorSource,
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
  FieldValueContract,
} from './field-state.js';
export { useFieldState } from './field-state.js';
export type { FieldUndo } from './field-undo.js';
export { getFieldUndo } from './field-undo.js';
export { resolveFieldValidation, toIssueList } from './field-validation.js';
export { isFieldValueEqual } from './field-value.js';
export type { FieldsetProps } from './fieldset.js';
export { Fieldset } from './fieldset.js';
export type { StringRuleMessages, StringRules } from './string-rules.js';
export { countCodePoints, validateString } from './string-rules.js';
