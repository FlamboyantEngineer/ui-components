'use client';

import { useMemo, type KeyboardEvent, type ReactNode } from 'react';
import { Toolbar } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import type { ButtonSize } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button, type ButtonProps } from '../button/button.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
  type MenuEntry,
  type MenuItemEntry,
  type MenuSize,
} from '../menu/menu.js';
import { useActionFocus } from './use-action-focus.js';
import { useActionPending, type ActionPress } from './use-action-pending.js';
import { toActionContent, toActionKey, type ActionRowAction } from './action-verbs.js';

interface ActionRowActionsProps extends Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  actions: readonly ActionRowAction[];
  size: ButtonSize;
  /** Draws the actions as one toolbar. */
  isToolbar: boolean;
  /** Collapses the actions that do not fit into a "more" menu. */
  isCollapsing: boolean;
}

const hooks = createHooks('action-row', ['actions', 'action', 'overflow']);

/** An action without a menu presses and states its own popup; a menu trigger leaves both to the menu. */
function toPressProps(
  action: ActionRowAction,
  press: ActionPress,
  hasMenu: boolean,
): Partial<ButtonProps> {
  if (hasMenu) return {};
  return {
    'aria-expanded': action.isExpanded,
    'aria-haspopup': action['aria-haspopup'],
    onPress: press.onPress,
  };
}

/** The action's menu, opened by its button (with the button's tooltip) at the button's end. */
function ActionRowMenu({
  action,
  size,
  children,
}: {
  action: ActionRowAction;
  size: ButtonSize;
  children: ReactNode;
}) {
  const menuSize: MenuSize = size === 'xs' ? 'sm' : size;
  return (
    <MenuTrigger>
      {children}
      <MenuPopover placement="bottom end">
        <Menu items={action.items} onAction={action.onAction} size={menuSize} />
      </MenuPopover>
    </MenuTrigger>
  );
}

/** A custom action's ref and toggle state, which report `aria-pressed` either way once set. */
function toCustomButtonProps(action: ActionRowAction): Partial<ButtonProps> {
  if (action.verb !== 'custom') return {};
  if (action.isSelected === undefined) return { ref: action.ref };
  return { ref: action.ref, isSelected: action.isSelected, 'aria-pressed': action.isSelected };
}

function ActionRowButton({
  action,
  press,
  size,
}: {
  action: ActionRowAction;
  press: ActionPress;
  size: ButtonSize;
}) {
  const { icon, label, pendingLabel } = toActionContent(action, useUiStrings());
  const hasMenu = Boolean(action.items?.length);
  const button = (
    <Button
      {...pickDataAttributes(action)}
      {...hooks.slot('action', { verb: action.verb })}
      {...toCustomButtonProps(action)}
      {...toPressProps(action, press, hasMenu)}
      icon={icon}
      label={label}
      size={size}
      isDisabled={action.isDisabled}
      // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
      focusableWhenDisabled={action.tooltip !== undefined}
      isPending={press.isPending}
      pendingLabel={pendingLabel}
      aria-controls={action['aria-controls']}
      // A tooltip that only repeats the label names the button already, so it describes nothing.
      tooltip={action.tooltip ?? label}
    />
  );
  if (!hasMenu) return button;
  return (
    <ActionRowMenu action={action} size={size}>
      {button}
    </ActionRowMenu>
  );
}

/**
 * An action's menu entries with each item bound to that action: choosing one calls the item's own
 * `onAction` and the action's `onAction` with the item's `id`, in sections and submenus too. Ids
 * are unique only within one action's menu, so the overflow menu cannot find the owner by id.
 */
function bindMenuEntries(entries: readonly MenuEntry[], action: ActionRowAction): MenuEntry[] {
  return entries.map((entry) => {
    if (entry.type === 'separator') return entry;
    if (entry.type === 'section') return { ...entry, items: bindMenuEntries(entry.items, action) };
    if (entry.items?.length) return { ...entry, items: bindMenuEntries(entry.items, action) };
    return {
      ...entry,
      onAction: () => {
        entry.onAction?.();
        action.onAction?.(entry.id);
      },
    };
  });
}

/** A hidden action as an overflow menu entry: a press, or a submenu of its own menu. */
function toMenuEntry({ action, key, press }: KeyedAction, strings: UiStrings): MenuItemEntry {
  const { icon, label } = toActionContent(action, strings);
  const entry = {
    id: key,
    label,
    icon,
    isDisabled: action.isDisabled,
    isPending: press.isPending,
  };
  return action.items?.length
    ? { ...entry, items: bindMenuEntries(action.items, action) }
    : { ...entry, onPress: press.onPress };
}

interface KeyedAction {
  action: ActionRowAction;
  key: string;
  press: ActionPress;
}

/** The menu of the actions that do not fit, at the end of the row. */
function OverflowMenu({ keyed, size }: { keyed: readonly KeyedAction[]; size: ButtonSize }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('overflow')}>
      <DropdownMenu
        iconOnly
        size={size}
        placement="bottom end"
        label={strings.moreItems(keyed.length)}
        items={keyed.map((entry) => toMenuEntry(entry, strings))}
      />
    </div>
  );
}

/**
 * The actions slot: the buttons, optionally as one toolbar, optionally keeping only the
 * actions that fit and listing the others in a "more" menu at the end.
 */
export function ActionRowActions({
  actions,
  size,
  isToolbar,
  isCollapsing,
  ...labels
}: ActionRowActionsProps) {
  const { containerRef, visibleItems, hiddenItems } = useOverflowItems({
    items: isCollapsing ? actions : [],
  });
  const focusRef = useActionFocus();
  const toPress = useActionPending();
  const toKeyed = (action: ActionRowAction): KeyedAction => {
    const key = toActionKey(action);
    return { action, key, press: toPress(action, key) };
  };
  const shown = (isCollapsing ? visibleItems : actions).map(toKeyed);
  const children = (
    <>
      {shown.map(({ action, key, press }) => (
        <ActionRowButton key={key} action={action} press={press} size={size} />
      ))}
      {isCollapsing && hiddenItems.length > 0 ? (
        <OverflowMenu keyed={hiddenItems.map(toKeyed)} size={size} />
      ) : null}
    </>
  );
  const ref = useMemo(
    () => (isCollapsing ? mergeRefs(containerRef, focusRef) : focusRef),
    [isCollapsing, containerRef, focusRef],
  );
  if (isToolbar) {
    return (
      <Toolbar {...labels} ref={ref} className={hooks.slotClass('actions')}>
        {children}
      </Toolbar>
    );
  }
  return (
    <div ref={ref} {...hooks.slot('actions')}>
      {children}
    </div>
  );
}

/** Escape clears a selection, unless something inside the row handled it. */
export function createClearKey(onClear: (() => void) | undefined) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (!onClear || event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    onClear();
  };
}
