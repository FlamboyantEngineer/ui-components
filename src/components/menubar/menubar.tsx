'use client';

import { type ReactNode, useContext, useId, useLayoutEffect, useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize, NativeProps, Orientation } from '../../core/props.js';
import {
  Button as AriaButton,
  RootMenuTriggerStateContext,
  useInteractOutside,
  useLocale,
} from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useLatest } from '../../utils/use-latest.js';
import { Menu, MenuOverlay, type MenuProps, MenuTrigger } from '../menu/menu.js';
import { MenubarContext, useMenubarContext, useMenubarState } from './menubar-state.js';

export interface MenubarProps
  extends Omit<NativeProps<'div'>, 'role' | 'children' | 'aria-orientation'>, BaseProps {
  /** The top-level menus, as `MenubarMenu` elements. */
  children?: ReactNode;
  /** Lays the top-level items out in a row (the default) or a column; the arrow keys follow it. */
  orientation?: Orientation | undefined;
  /** Row density of the bar and its menus. Defaults to `md`. */
  size?: ControlSize | undefined;
}

export interface MenubarMenuProps
  extends Pick<MenuProps, 'items' | 'children' | 'onAction'>, BaseProps {
  /** The top-level item's text, which also names its menu. */
  label: ReactNode;
}

const hooks = createHooks('menubar', ['trigger']);

/**
 * A menubar (`role="menubar"`): a row or column of top-level items that each open a menu, like an
 * application's File, Edit and View menus. It is one tab stop; the arrow keys move between the
 * items and from one open menu to the next, and once a menu is open, pointing at another item
 * opens its menu instead.
 */
export function Menubar({
  orientation = 'horizontal',
  size = 'md',
  className,
  children,
  ref,
  ...rest
}: MenubarProps) {
  const [rootRef, setRootRef] = useForwardedRef(ref);
  const { direction } = useLocale();
  const { context, onKeyDownCapture } = useMenubarState({
    rootRef,
    orientation,
    size: size === 'xs' ? 'sm' : size,
    direction,
  });
  return (
    <div
      {...mergeProps(rest, { ref: setRootRef, onKeyDownCapture })}
      {...hooks.root({ className, props: rest, data: { orientation, size } })}
      role="menubar"
      aria-orientation={orientation}
    >
      <MenubarContext value={context}>{children}</MenubarContext>
    </div>
  );
}

interface MenubarTriggerProps extends Omit<MenubarMenuProps, 'items' | 'children' | 'onAction'> {
  itemKey: string;
  isOpen: boolean;
}

/**
 * The top-level item: React Aria's button, given the `menuitem` role, inside the menu's trigger,
 * where it can hand React Aria's menu state to the bar.
 */
function MenubarTrigger({ itemKey, isOpen, label, className, ...rest }: MenubarTriggerProps) {
  const bar = useMenubarContext();
  const state = useContext(RootMenuTriggerStateContext);
  const stateRef = useLatest(state);
  const ref = useRef<HTMLButtonElement>(null);
  const { register } = bar;
  // React Aria hands the button a new merged ref on every render, so registration waits for mount.
  useLayoutEffect(() => {
    const element = ref.current;
    return element ? register(itemKey, { element, state: stateRef }) : undefined;
  }, [register, itemKey, stateRef]);
  return (
    <AriaButton
      {...rest}
      {...hooks.slot('trigger', { open: isOpen }, className)}
      ref={ref}
      excludeFromTabOrder={bar.tabKey !== itemKey}
      onFocus={() => bar.setTabKey(itemKey)}
      onHoverStart={() => bar.switchTo(itemKey)}
      onPressStart={(event) => {
        // React Aria's trigger only opens on a pointer press; a second press closes the menu.
        if (isOpen && event.pointerType !== 'touch' && event.pointerType !== 'keyboard') {
          bar.close(itemKey);
        }
      }}
      // React Aria's button takes no role; the items of a menubar are menu items.
      render={(props) => <button {...props} role="menuitem" />}
    >
      {label}
    </AriaButton>
  );
}

/**
 * One top-level item of a `Menubar` and the menu it opens (React Aria `MenuTrigger` with the
 * library `Menu`, so the menu takes items, sections, separators, selection, shortcuts and submenus).
 * The menu floats without hiding the page, so the bar stays reachable while it is open.
 */
export function MenubarMenu({ items, children, onAction, ...trigger }: MenubarMenuProps) {
  const bar = useMenubarContext();
  const key = useId();
  const popoverRef = useRef<HTMLElement>(null);
  const isOpen = bar.openKey === key;
  // A menu that leaves the page usable does not close on a press outside by itself.
  useInteractOutside({
    ref: popoverRef,
    isDisabled: !isOpen,
    onInteractOutside: (event) => {
      if (!bar.isInside(event.target as Element)) bar.close(key);
    },
  });
  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={(open) => bar.setOpen(key, open)}>
      <MenubarTrigger {...trigger} itemKey={key} isOpen={isOpen} />
      <MenuOverlay
        ref={popoverRef}
        placement={bar.orientation === 'horizontal' ? 'bottom start' : 'end top'}
        isNonModal
        shouldCloseOnInteractOutside={(element) => !bar.isInside(element)}
      >
        <Menu items={items} onAction={onAction} size={bar.size}>
          {children}
        </Menu>
      </MenuOverlay>
    </MenuTrigger>
  );
}
