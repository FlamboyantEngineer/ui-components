'use client';

import { ChevronDownGlyph, MoreGlyph } from '../../core/glyphs.js';
import { useContext, type ReactNode } from 'react';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Placement } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button, type ButtonProps } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
  useMenuSelection,
  type MenuProps,
  type MenuSize,
  type MenuTriggerProps,
} from '../menu/menu.js';

export interface DropdownMenuProps
  extends
    Omit<MenuTriggerProps, 'children'>,
    DropdownMenuMenuProps,
    Pick<ButtonProps, 'variant' | 'size' | 'isDisabled' | 'ref' | 'onPress'>,
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
        label={typeof label === 'string' ? label : ''}
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
    className,
    iconOnly: _iconOnly,
    showCaret: _showCaret,
    ...rest
  } = trigger;
  const [data, button] = splitDataAttributes(rest);
  const shared = { variant, size, isDisabled };
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
          label={strings.moreOptions}
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
