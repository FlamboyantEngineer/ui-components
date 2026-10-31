'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Toolbar } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
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
import { toActionContent, type ActionRowAction } from './action-verbs.js';

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
function toPressProps(action: ActionRowAction, hasMenu: boolean): Partial<ButtonProps> {
  if (hasMenu) return {};
  return {
    'aria-expanded': action.isExpanded,
    'aria-haspopup': action['aria-haspopup'],
    onPress: action.onPress,
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

function ActionRowButton({ action, size }: { action: ActionRowAction; size: ButtonSize }) {
  const { icon, label, pendingLabel } = toActionContent(action, useUiStrings());
  const hasMenu = Boolean(action.items?.length);
  const button = (
    <Button
      {...pickDataAttributes(action)}
      {...hooks.slot('action', { verb: action.verb })}
      {...toCustomButtonProps(action)}
      {...toPressProps(action, hasMenu)}
      id={action.id}
      icon={icon}
      label={label}
      size={size}
      isDisabled={action.isDisabled}
      // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
      focusableWhenDisabled={action.tooltip !== undefined}
      isPending={action.isPending}
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

function actionKey(action: ActionRowAction, index: number): string {
  return action.id ?? `${action.verb}-${index}`;
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
function toMenuEntry(action: ActionRowAction, key: string, strings: UiStrings): MenuItemEntry {
  const { icon, label } = toActionContent(action, strings);
  const entry = {
    id: key,
    label,
    icon,
    isDisabled: action.isDisabled,
    isPending: action.isPending,
  };
  return action.items?.length
    ? { ...entry, items: bindMenuEntries(action.items, action) }
    : { ...entry, onPress: action.onPress as MenuItemEntry['onPress'] };
}

interface KeyedAction {
  action: ActionRowAction;
  key: string;
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
        items={keyed.map(({ action, key }) => toMenuEntry(action, key, strings))}
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
  const toKeyed = (action: ActionRowAction) => ({
    action,
    key: actionKey(action, actions.indexOf(action)),
  });
  const shown = (isCollapsing ? visibleItems : actions).map(toKeyed);
  const children = (
    <>
      {shown.map(({ action, key }) => (
        <ActionRowButton key={key} action={action} size={size} />
      ))}
      {isCollapsing && hiddenItems.length > 0 ? (
        <OverflowMenu keyed={hiddenItems.map(toKeyed)} size={size} />
      ) : null}
    </>
  );
  const ref = isCollapsing ? containerRef : undefined;
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
