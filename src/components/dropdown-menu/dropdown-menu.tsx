import { useContext, type ReactNode } from 'react';
import { OverlayTriggerStateContext, type Placement } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { Button, type ButtonProps } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { IconButton } from '../icon-button/icon-button.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
  type MenuProps,
  type MenuSize,
  type MenuTriggerProps,
} from '../menu/menu.js';

export interface DropdownMenuProps
  extends
    Omit<MenuTriggerProps, 'children' | 'trigger'>,
    DropdownMenuMenuProps,
    Pick<ButtonProps, 'variant' | 'size' | 'isDisabled' | 'ref'>,
    BaseProps {
  /** The trigger's text, or its accessible name when `iconOnly` (then it must be text). */
  label: ReactNode;
  /** Drawn before the label, or alone when `iconOnly`. */
  icon?: IconSource;
  /** Draws the trigger as an `IconButton` showing only `icon` (`more` by default). */
  iconOnly?: boolean | undefined;
  /** Draws a caret after the label. Defaults to true, and to false when `iconOnly`. */
  showCaret?: boolean | undefined;
  /** Menu row density. Defaults to the trigger size (`sm` for an `xs` trigger). */
  menuSize?: MenuSize | undefined;
  /** Where the menu opens against the trigger. Defaults to `bottom start`. */
  placement?: Placement | undefined;
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
  | 'aria-label'
>;

type DropdownMenuTriggerProps = Omit<
  DropdownMenuProps,
  keyof DropdownMenuMenuProps | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'menuSize' | 'placement'
>;

const hooks = createHooks('dropdown-menu', ['caret']);

/** The menu button: a `Button` with a caret, or an `IconButton`, publishing the open state. */
function DropdownMenuTrigger({
  label,
  icon,
  iconOnly = false,
  showCaret = !iconOnly,
  variant,
  className,
  ...rest
}: DropdownMenuTriggerProps) {
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? false;
  const props = {
    ...rest,
    ...hooks.root({ props: rest, data: { open: isOpen } }),
    // A caller's `data-open` never shows on a closed trigger.
    'data-open': isOpen ? 'true' : undefined,
    className: mergeClassNames(hooks.className, className),
  };
  if (iconOnly) {
    return (
      <IconButton
        {...props}
        variant={variant ?? 'ghost'}
        icon={icon ?? 'more'}
        label={typeof label === 'string' ? label : ''}
      />
    );
  }
  const caret = <Glyph name="chevron-down" className={hooks.slotClass('caret')} />;
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
 * A button that opens a menu (React Aria `MenuTrigger`, which wires `aria-haspopup`,
 * `aria-expanded` and focus). Menu props pass to the `Menu`; the rest to the trigger.
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
  'aria-label': menuLabel,
  size = 'md',
  ...trigger
}: DropdownMenuProps) {
  const menu = {
    items,
    onAction,
    selectionMode,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys,
    disallowEmptySelection,
    shouldCloseOnSelect,
    'aria-label': menuLabel,
  };
  return (
    <MenuTrigger isOpen={isOpen} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger {...trigger} size={size} />
      <MenuPopover placement={placement}>
        <Menu {...menu} size={menuSize ?? (size === 'xs' ? 'sm' : size)}>
          {children}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}
