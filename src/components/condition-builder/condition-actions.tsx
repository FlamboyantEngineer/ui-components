'use client';

import { cloneElement, type KeyboardEvent, type ReactElement } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Menu } from '../menu/menu.js';
import { resolveActionIcon } from '../menu/menu-action-icons.js';
import {
  conditionBuilderHooks as hooks,
  useConditionBuilder,
  type ConditionMenuAction,
} from './condition-context.js';

interface ConditionActionsProps {
  /** The rule's or the group's id. */
  id: string;
  /** Its position among its siblings. */
  index: number;
  /** How many siblings it has, itself included. */
  count: number;
}

const moveKeys: Readonly<Record<string, -1 | 1>> = { ArrowUp: -1, ArrowDown: 1 };

/** The move Alt+Arrow Up or Alt+Arrow Down asks for, if `event` is one. */
function toMoveDelta(event: KeyboardEvent): -1 | 1 | undefined {
  return event.altKey ? moveKeys[event.key] : undefined;
}

/** A rule's or a group's actions, as its menu button and its context menu offer them. */
function useConditionMenu({ id, index, count }: ConditionActionsProps) {
  const strings = useUiStrings();
  const { actions, menuIcons } = useConditionBuilder();
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const item = (id: ConditionMenuAction, label: string) => ({
    id,
    label,
    icon: resolveActionIcon(menuIcons, id),
  });
  return {
    label: strings.conditionActions,
    items: [
      item('move-up', strings.moveItem('up')),
      item('move-down', strings.moveItem('down')),
      item('duplicate', strings.duplicate),
      item('delete', strings.delete),
    ],
    disabledKeys: [...(isFirst ? ['move-up'] : []), ...(isLast ? ['move-down'] : [])],
    /** Moves the node for Alt+Arrow keys, unless it is at that end; returns whether it was one. */
    moveByKey: (event: KeyboardEvent) => {
      const delta = toMoveDelta(event);
      if (!delta) return false;
      if (!(delta === -1 ? isFirst : isLast)) actions.move(id, delta);
      return true;
    },
    onAction: (key: Key) => {
      if (key === 'move-up') actions.move(id, -1);
      else if (key === 'move-down') actions.move(id, 1);
      else if (key === 'duplicate') actions.duplicate(id);
      else actions.remove(id);
    },
  };
}

/**
 * A rule's or a group's menu button: move up, move down, duplicate and delete. Alt+Arrow Up and
 * Alt+Arrow Down on the button move the node without opening the menu.
 */
export function ConditionActions(props: ConditionActionsProps) {
  const { moveByKey, ...menu } = useConditionMenu(props);
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    // Keys from the open menu reach here through its portal; only the button's own keys move.
    if (!event.currentTarget.contains(event.target as Node) || !moveByKey(event)) return;
    // Captured before the menu button, which would open its menu on Alt+Arrow Down.
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <span {...hooks.slot('actions')} onKeyDownCapture={onKeyDown}>
      <DropdownMenu {...menu} iconOnly size="sm" placement="bottom end" />
    </span>
  );
}

interface NodeElementProps {
  tabIndex?: number | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

/**
 * Opens a rule's or a group's actions as a context menu from `children`, its element: a secondary
 * click, a long touch, or the Context Menu key or Shift+F10 on the element or a control in it. A
 * control inside with a context menu of its own, such as a field, or a text control, keeps the
 * request, so a nested node's or a field's menu never opens its parent's too. Without menu
 * buttons, the element takes their place in the tab order: the menu keys and Alt+Arrow keys on it
 * act on the node.
 */
export function ConditionMenuTarget({
  children,
  ...props
}: ConditionActionsProps & { children: ReactElement<NodeElementProps> }) {
  const { showActionButtons } = useConditionBuilder();
  const { label, moveByKey, ...menu } = useConditionMenu(props);
  const target = showActionButtons
    ? children
    : cloneElement(children, {
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.target === event.currentTarget && moveByKey(event)) event.preventDefault();
        },
      });
  return (
    <ContextMenuTrigger aria-label={label}>
      {target}
      <Menu {...menu} />
    </ContextMenuTrigger>
  );
}
