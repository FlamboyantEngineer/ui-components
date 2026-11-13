'use client';

import { type ReactNode, useContext } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { ChevronDownGlyph, MoreGlyph } from '../../core/glyphs.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { Button, type ButtonProps } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import {
  Menu,
  MenuPopover,
  type MenuProps,
  type MenuSize,
  MenuTrigger,
  type MenuTriggerProps,
  useMenuSelection,
} from '../menu/menu.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

export interface DropdownMenuProps
  extends
    Omit<MenuTriggerProps, 'children'>,
    DropdownMenuMenuProps,
    Pick<
      ButtonProps,
      'variant' | 'size' | 'isDisabled' | 'focusableWhenDisabled' | 'tooltip' | 'ref' | 'onPress'
    >,
    BaseProps {
  /** The trigger's text, or its accessible name when `iconOnly` (then it must be text). */
  label: ReactNode;
  /** Drawn before the label, or alone when `iconOnly`. */
  icon?: IconSource;
  /** Draws the trigger as a `Button` showing only `icon` (`more` by default). */
  iconOnly?: boolean | undefined;
  /** Draws a caret after the label of a button trigger. Defaults to true. */
  showCaret?: boolean | undefined;
  /** Menu row density. Defaults to the trigger size (`sm` for an `xs` trigger). */
  menuSize?: MenuSize | undefined;
  /** Where the menu opens against the trigger. Defaults to `bottom start`. */
  placement?: Placement | undefined;
  /** Makes a split button: the labelled button runs `onPress`, a chevron beside it opens the menu. */
  onPress?: ButtonProps['onPress'];
  /**
   * Names the button that opens the menu, for a trigger that shows only its current value: read
   * before that value, which stays part of the name; `aria-label` names the menu. It is the whole
   * name of an `iconOnly` trigger and of a split button's chevron.
   */
  triggerLabel?: string | undefined;
}

type DropdownMenuMenuProps = Pick<
  MenuProps,
  | 'items'
  | 'children'
  | 'onAction'
  | 'selectionMode'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'onSelectionChange'
  | 'disabledKeys'
  | 'disallowEmptySelection'
  | 'shouldCloseOnSelect'
  | 'filterable'
  | 'aria-label'
  | 'aria-labelledby'
>;

type DropdownMenuTriggerProps = Omit<
  DropdownMenuProps,
  | keyof DropdownMenuMenuProps
  | 'isOpen'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'menuSize'
  | 'placement'
  | 'onPress'
>;

interface DropdownMenuPartsProps {
  trigger: DropdownMenuTriggerProps & Required<Pick<DropdownMenuProps, 'size'>>;
  menu: MenuProps;
  placement: Placement;
}

const hooks = createHooks('dropdown-menu', ['caret', 'action', 'toggle']);

/** The menu button: a `Button` with a caret, or showing only an icon, publishing the open state. */
function DropdownMenuTrigger({
  label,
  icon,
  iconOnly = false,
  showCaret = true,
  variant,
  className,
  triggerLabel,
  ...rest
}: DropdownMenuTriggerProps) {
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? false;
  const props = { ...rest, ...hooks.root({ className, props: rest, data: { open: isOpen } }) };
  if (iconOnly) {
    return (
      <Button
        {...props}
        variant={variant ?? 'ghost'}
        icon={icon ?? MoreGlyph}
        label={triggerLabel ?? (typeof label === 'string' ? label : '')}
      />
    );
  }
  const caret = <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('caret')} />;
  return (
    <Button
      {...props}
      variant={variant ?? 'secondary'}
      startIcon={icon}
      endIcon={showCaret ? caret : undefined}
    >
      {/* Read before the value the trigger shows, so its name still holds that visible text. */}
      {triggerLabel ? <VisuallyHidden>{`${triggerLabel} `}</VisuallyHidden> : null}
      {label}
    </Button>
  );
}

/**
 * A split button: the labelled button runs its own action, and a chevron button beside it opens the
 * menu. The group publishes the open state, which it holds for the menu trigger.
 */
function DropdownSplitButton({
  trigger,
  menu,
  placement,
  open,
  onPress,
}: DropdownMenuPartsProps & {
  open: Pick<DropdownMenuProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>;
  onPress: NonNullable<DropdownMenuProps['onPress']>;
}) {
  const strings = useUiStrings();
  const [isOpen, setOpen] = useControllableState(
    open.isOpen,
    open.defaultOpen ?? false,
    open.onOpenChange,
  );
  const {
    label,
    icon,
    variant = 'secondary',
    size,
    isDisabled,
    focusableWhenDisabled,
    className,
    triggerLabel,
    iconOnly: _iconOnly,
    showCaret: _showCaret,
    ...rest
  } = trigger;
  const [data, button] = splitDataAttributes(rest);
  const shared = { variant, size, isDisabled, focusableWhenDisabled };
  return (
    <div {...data} {...hooks.root({ className, data: { open: isOpen, split: true } })} role="group">
      <Button
        {...button}
        {...shared}
        className={hooks.slotClass('action')}
        startIcon={icon}
        onPress={onPress}
      >
        {label}
      </Button>
      <MenuTrigger isOpen={isOpen} onOpenChange={setOpen} isDisabled={isDisabled}>
        <Button
          {...shared}
          icon={ChevronDownGlyph}
          label={triggerLabel ?? strings.moreOptions}
          className={hooks.slotClass('toggle')}
        />
        <MenuPopover placement={placement}>
          <Menu {...menu} />
        </MenuPopover>
      </MenuTrigger>
    </div>
  );
}

/**
 * A button that opens a menu (React Aria `MenuTrigger`, which wires `aria-haspopup`,
 * `aria-expanded` and focus). Menu props pass to the `Menu`; the rest to the trigger. With
 * `onPress` it is a split button whose chevron opens the menu.
 */
export function DropdownMenu({
  isOpen,
  defaultOpen,
  onOpenChange,
  placement = 'bottom start',
  menuSize,
  items,
  children,
  onAction,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disabledKeys,
  disallowEmptySelection,
  shouldCloseOnSelect,
  filterable,
  'aria-label': menuLabel,
  'aria-labelledby': menuLabelledBy,
  size = 'md',
  onPress,
  ...trigger
}: DropdownMenuProps) {
  // Held above the popover, which unmounts the menu on close, so reopening keeps the choice.
  const selection = useMenuSelection({ selectedKeys, defaultSelectedKeys, onSelectionChange });
  const menu: MenuProps = {
    items,
    children,
    onAction,
    selectionMode,
    ...selection,
    disabledKeys,
    disallowEmptySelection,
    shouldCloseOnSelect,
    filterable,
    'aria-label': menuLabel,
    'aria-labelledby': menuLabelledBy,
    size: menuSize ?? (size === 'xs' ? 'sm' : size),
  };
  const parts = { trigger: { ...trigger, size }, menu, placement };
  if (onPress) {
    return (
      <DropdownSplitButton
        {...parts}
        open={{ isOpen, defaultOpen, onOpenChange }}
        onPress={onPress}
      />
    );
  }
  return (
    <MenuTrigger
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDisabled={trigger.isDisabled}
    >
      <DropdownMenuTrigger {...parts.trigger} />
      <MenuPopover placement={placement}>
        <Menu {...menu} />
      </MenuPopover>
    </MenuTrigger>
  );
}
