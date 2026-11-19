'use client';

import type { ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type {
  AriaLabellingProps,
  OpenStateProps,
  OverlayPositionProps,
} from '../../core/events.js';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Button,
  Header,
  Label,
  ListBox,
  ListBoxSection,
  Popover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
} from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { DEFAULT_DROPDOWN_OFFSET, DEFAULT_OVERLAY_GUTTER } from '../../utils/overlay-defaults.js';
import { toCollectionItemKey, toCollectionKey } from '../../utils/to-collection-key.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import {
  FieldFormValue,
  PickerOptionRow,
  usePickerPopoverStyle,
  useScopedDisabled,
} from '../field/field.js';
import { PopoverPresence } from '../popover/popover.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';
import type { SelectFieldOption } from './select-options.js';

export interface SelectProps
  extends BaseProps, AriaLabellingProps, OpenStateProps, RefProps<HTMLDivElement> {
  /** The selected option's id, or null to show the placeholder (controlled). */
  value: Key | null;
  /** Called with the original option id. */
  onChange: (value: Key | null) => void;
  /** A visible label. Without one, pass an accessible name. */
  label?: ReactNode;
  placeholder?: string | undefined;
  isDisabled?: boolean | undefined;
  isRequired?: boolean | undefined;
  isInvalid?: boolean | undefined;
  /** The form name the chosen id is submitted under. */
  name?: string | undefined;
  /** The id of the native form the submitted value belongs to. */
  form?: string | undefined;
  /** The trigger and the content it opens. */
  children: ReactNode;
}

/** A controlled single select with a caller-composed trigger and option list. */
export function Select({
  value,
  onChange,
  label,
  children,
  name,
  form,
  placeholder,
  isDisabled,
  className,
  isOpen,
  defaultOpen,
  onOpenChange,
  ...rest
}: SelectProps) {
  const disabled = useScopedDisabled(isDisabled);
  const strings = useUiStrings();
  const [open, setOpen] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
  useCloseWhenLocked(open, disabled, () => setOpen(false));
  return (
    <AriaSelect
      {...rest}
      {...hooks.root({
        className: mergeClassNames(hooks.slotClass('select'), className),
        props: rest,
      })}
      isDisabled={disabled}
      isOpen={open && !disabled}
      onOpenChange={setOpen}
      form={form}
      placeholder={placeholder ?? strings.selectPlaceholder}
      value={value === null ? null : toCollectionKey(value)}
      onChange={(key) => onChange(key === null ? null : fromCollectionKey(key))}
    >
      {isEmptyNode(label) ? null : <Label {...hooks.slot('select-label')}>{label}</Label>}
      {children}
      <FieldFormValue
        name={name}
        value={value === null ? null : String(value)}
        isDisabled={disabled}
        form={form}
      />
    </AriaSelect>
  );
}

export interface SelectTriggerProps extends BaseProps, RefProps<HTMLButtonElement> {
  children: ReactNode;
}

/** Opens the select. Put a SelectValue inside to display and name its current value. */
export function SelectTrigger({ className, children, ...rest }: SelectTriggerProps) {
  return (
    <div {...hooks.slot('frame')}>
      <Button {...rest} {...hooks.slot('trigger', {}, className)}>
        {children}
        <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('chevron')} />
      </Button>
    </div>
  );
}

export interface SelectValueProps extends BaseProps, RefProps<HTMLSpanElement> {}

/** Displays the chosen text, or the select's placeholder when it has no value. */
export function SelectValue({ className, ...rest }: SelectValueProps) {
  return (
    <AriaSelectValue {...rest} {...hooks.slot('value', {}, className)}>
      {({ selectedText, defaultChildren }) => (
        <span {...hooks.slot('value-label')}>{selectedText || defaultChildren}</span>
      )}
    </AriaSelectValue>
  );
}

export interface SelectContentProps extends BaseProps, OverlayPositionProps, RefProps<HTMLElement> {
  children: ReactNode;
}

/** The select's anchored dropdown and listbox. */
export function SelectContent({
  className,
  children,
  offset = DEFAULT_DROPDOWN_OFFSET,
  containerPadding = DEFAULT_OVERLAY_GUTTER,
  ...rest
}: SelectContentProps) {
  const style = usePickerPopoverStyle();
  return (
    <>
      <PopoverPresence />
      <Popover
        {...rest}
        {...hooks.slot('popover', { layer: 'dropdown' }, className)}
        offset={offset}
        containerPadding={containerPadding}
        style={style}
      >
        <ListBox className={hooks.slotClass('listbox')}>{keyCollectionChildren(children)}</ListBox>
      </Popover>
    </>
  );
}

export interface SelectItemProps
  extends
    Omit<BaseProps, 'id'>,
    RefProps<HTMLDivElement>,
    Omit<SelectFieldOption, 'isIndeterminate'> {}

/** A choice identified by its original id, with the same content and states as a field option. */
export function SelectItem({
  id,
  label,
  icon,
  description,
  shortcut,
  isDisabled,
  tooltip,
  ...rest
}: SelectItemProps) {
  const option = { id, label, icon, description, shortcut, isDisabled, tooltip };
  return <PickerOptionRow {...rest} id={toCollectionKey(id)} option={option} hooks={hooks} />;
}

export interface SelectGroupProps extends Omit<BaseProps, 'id'>, RefProps<HTMLElement> {
  /** Distinct from all other item and group ids. */
  id?: Key | undefined;
  /** A visible heading that names the group. */
  title?: ReactNode;
  children: ReactNode;
}

/** An optionally headed group of select items. */
export function SelectGroup({ id, title, children, className, ...rest }: SelectGroupProps) {
  return (
    <ListBoxSection
      {...rest}
      id={toCollectionItemKey(id)}
      {...hooks.slot('section', {}, className)}
    >
      {isEmptyNode(title) ? null : (
        <Header className={hooks.slotClass('section-header')}>{title}</Header>
      )}
      {keyCollectionChildren(children)}
    </ListBoxSection>
  );
}
