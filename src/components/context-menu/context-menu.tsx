'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  MenuContext,
  RootMenuTriggerStateContext,
  type RootMenuTriggerState,
} from '../../primitives/index.js';
import type { BaseProps, Key, Placement } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Menu, MenuOverlay, type MenuPopoverProps } from '../menu/menu.js';
import { useContextMenuTarget, type ContextMenuTargetProps } from './context-menu-target.js';
import { useMenuAnchor } from './menu-anchor.js';
import {
  useMenuControllerState,
  useMenuController,
  type MenuController,
} from './menu-controller.js';
import { useCloseOnSecondaryPress } from './menu-state.js';

export { useContextMenuTarget } from './context-menu-target.js';
export { createMenuController, useMenuController } from './menu-controller.js';
export type { MenuController } from './menu-controller.js';

export interface ContextMenuProps extends BaseProps {
  /** Holds the open state and anchor; open, move and close the menu through it. */
  controller: MenuController;
  /** The `Menu` to show. Defaults to a `Menu` of the controller's entries. */
  children?: ReactNode;
  /** The overlay layer. Defaults to `context-menu`. */
  layer?: MenuPopoverProps['layer'];
  /** Placement against an element anchor. Defaults to `bottom start`. */
  placement?: Placement | undefined;
  /**
   * The element a point menu belongs to: scrolling one of its scroll parents closes the menu.
   * Defaults to an empty element where the `ContextMenu` renders.
   */
  triggerRef?: RefObject<Element | null> | undefined;
  /** Names the popover and, unless its `Menu` has its own, the menu. Defaults to `contextMenu`. */
  'aria-label'?: string | undefined;
}

export interface ContextMenuTriggerProps extends Omit<
  ContextMenuProps,
  'controller' | 'children' | 'layer' | 'triggerRef'
> {
  /** The target element (it must take event handlers and a ref), then the `Menu` it opens. */
  children: ReactNode;
  /** Leaves the target's own context menu alone. */
  isDisabled?: boolean | undefined;
  /**
   * Opens the menu from Shift+F10 or the Context Menu key pressed in a text control inside the
   * target too, for a menu about that control, such as a field's. By default those keys stay with
   * the control.
   */
  opensFromTextKeys?: boolean | undefined;
}

/**
 * The root menu state React Aria reads for submenus and to close a whole menu tree, for a menu
 * whose open state lives elsewhere. `close` empties the submenu stack, then calls `onClose`.
 */
function useRootMenuState(isOpen: boolean, onClose: () => void): RootMenuTriggerState {
  const [expandedKeysStack, setExpandedKeysStack] = useState<Key[]>([]);
  const close = useCallback(() => {
    setExpandedKeysStack([]);
    onClose();
  }, [onClose]);
  return useMemo<RootMenuTriggerState>(
    () => ({
      isOpen,
      focusStrategy: 'first',
      point: null,
      setPoint: () => {},
      setOpen: (open) => {
        if (!open) close();
      },
      open: () => {},
      toggle: close,
      close,
      expandedKeysStack,
      openSubmenu: (triggerKey, level) =>
        setExpandedKeysStack((stack) =>
          level > stack.length ? stack : [...stack.slice(0, level), triggerKey],
        ),
      closeSubmenu: (triggerKey, level) =>
        setExpandedKeysStack((stack) =>
          stack[level] === triggerKey ? stack.slice(0, level) : stack,
        ),
    }),
    [isOpen, close, expandedKeysStack],
  );
}

/**
 * A menu opened, moved and closed through a `MenuController`, at a viewport point or against an
 * element. Focus enters the first item on open and returns where it was on close.
 */
export function ContextMenu({
  controller,
  children,
  layer = 'context-menu',
  placement = 'bottom start',
  triggerRef,
  'aria-label': ariaLabel,
  ...rest
}: ContextMenuProps) {
  const strings = useUiStrings();
  const label = ariaLabel ?? strings.contextMenu;
  const { isOpen, anchor, items } = useMenuControllerState(controller);
  const fallbackRef = useRef<HTMLSpanElement>(null);
  const state = useRootMenuState(isOpen, controller.close);
  const anchorProps = useMenuAnchor({ anchor, placement, owner: triggerRef ?? fallbackRef });
  useCloseOnSecondaryPress(isOpen, state.close, triggerRef ?? fallbackRef);
  const menuDefaults = useMemo(
    () => ({ onClose: state.close, autoFocus: 'first' as const, 'aria-label': label }),
    [state.close, label],
  );
  return (
    <>
      {triggerRef ? null : <span ref={fallbackRef} hidden />}
      <RootMenuTriggerStateContext value={state}>
        <MenuOverlay
          {...rest}
          {...anchorProps}
          aria-label={label}
          layer={layer}
          // Like a platform context menu, it holds the page still while open.
          isNonModal={false}
          isOpen={isOpen}
          onOpenChange={state.setOpen}
          onContextMenu={(event) => event.preventDefault()}
        >
          <MenuContext value={menuDefaults}>{children ?? <Menu items={items ?? []} />}</MenuContext>
        </MenuOverlay>
      </RootMenuTriggerStateContext>
    </>
  );
}

/**
 * Opens a `ContextMenu` from any element: at the pointer on a secondary click or a long touch, and
 * below the element on the Context Menu key or Shift+F10.
 */
export function ContextMenuTrigger({
  children,
  isDisabled = false,
  opensFromTextKeys = false,
  ...rest
}: ContextMenuTriggerProps) {
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const [target, ...menu] = Children.toArray(children);
  const own: ContextMenuTargetProps = isValidElement<ContextMenuTargetProps>(target)
    ? target.props
    : {};
  const targetProps = useContextMenuTarget({
    controller,
    isDisabled,
    opensFromTextKeys,
    own,
    targetRef,
  });
  useEffect(() => {
    if (isDisabled) controller.close();
  }, [isDisabled, controller]);
  if (!isValidElement<ContextMenuTargetProps>(target)) {
    throw new Error('ContextMenuTrigger needs a target element as its first child.');
  }
  // A disabled target opens no menu, so it mounts none.
  return (
    <>
      {cloneElement(target, targetProps)}
      {isDisabled ? null : (
        <ContextMenu {...rest} controller={controller} triggerRef={targetRef}>
          {menu.length > 0 ? menu : undefined}
        </ContextMenu>
      )}
    </>
  );
}
