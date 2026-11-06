'use client';

// The items and links a navigation menu lists.

import { type KeyboardEvent, type PointerEvent, type ReactNode, useContext, useRef } from 'react';
import type { PressEvent } from '../../core/events.js';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
} from '../../primitives/index.js';
import { DisclosureContentScope } from '../disclosure/disclosure.js';
import { Link, type LinkProps } from '../link/link.js';
import {
  navigationMenuHooks as hooks,
  NavigationMenuPanelContext,
  useNavigationMenu,
} from './navigation-menu-state.js';

export interface NavigationMenuItemProps extends RefProps<HTMLLIElement>, Omit<BaseProps, 'id'> {
  /** The item's key, the menu's `openKey` while its panel is open. */
  id: Key;
  /** The trigger's content. */
  label: ReactNode;
  /** The panel's content: `NavigationMenuLink`s and any other content. */
  children?: ReactNode;
  /** The trigger refuses presses and hover, and the panel stays closed. */
  isDisabled?: boolean | undefined;
}

export interface NavigationMenuLinkProps extends Omit<LinkProps, 'aria-current'> {
  /** The link is the current page: `aria-current="page"` and `data-current`. */
  isCurrent?: boolean | undefined;
}

/** A pointer that rests, unlike a touch, which presses instead. */
function isHoverPointer(event: PointerEvent): boolean {
  return event.pointerType === 'mouse' || event.pointerType === 'pen';
}

/**
 * A top-level item whose trigger opens a panel of links and content under it. A press opens or
 * closes the panel; a resting mouse or pen opens it, and the panel stays while the pointer moves
 * from the trigger into it. Escape closes the panel and returns focus to the trigger.
 */
export function NavigationMenuItem({
  id,
  label,
  children,
  isDisabled = false,
  className,
  ...rest
}: NavigationMenuItemProps) {
  const menu = useNavigationMenu();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isOpen = menu.openKey === id && !isDisabled;
  const changeExpanded = (isExpanded: boolean) => {
    // A press on a panel the pointer opened keeps it open rather than closing it under the press.
    if (!isExpanded && menu.getOpenReason() === 'hover') menu.setOpen(id, 'press');
    else menu.setOpen(isExpanded ? id : null, 'press');
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen) return;
    event.stopPropagation();
    menu.setOpen(null, 'press');
    triggerRef.current?.focus();
  };
  return (
    <li
      {...rest}
      {...hooks.slot('item', { open: isOpen, disabled: isDisabled }, className)}
      onKeyDown={closeOnEscape}
      onPointerEnter={(event) => {
        if (!isDisabled && isHoverPointer(event)) menu.hoverStart(id);
      }}
      onPointerLeave={(event) => {
        if (isHoverPointer(event)) menu.hoverEnd();
      }}
    >
      <AriaDisclosure isExpanded={isOpen} onExpandedChange={changeExpanded} isDisabled={isDisabled}>
        <AriaButton ref={triggerRef} className={hooks.slotClass('trigger')} slot="trigger">
          {label}
          <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('indicator')} />
        </AriaButton>
        <AriaDisclosurePanel
          ref={isOpen ? menu.panelRef : undefined}
          className={hooks.slotClass('panel')}
        >
          <DisclosureContentScope>
            <NavigationMenuPanelContext value>{children}</NavigationMenuPanelContext>
          </DisclosureContentScope>
        </AriaDisclosurePanel>
      </AriaDisclosure>
    </li>
  );
}

/**
 * A link in a navigation menu, through the library `Link`: the provider's router, native
 * modified clicks and `aria-current="page"` for the current page. At the top level it is an item
 * of its own; inside a panel it is panel content. A press on it closes the open panel.
 */
export function NavigationMenuLink({
  isCurrent = false,
  onPress,
  className,
  variant = 'secondary',
  isStandalone = true,
  underline = 'none',
  ...rest
}: NavigationMenuLinkProps) {
  const menu = useNavigationMenu();
  const isInPanel = useContext(NavigationMenuPanelContext);
  const press = (event: PressEvent) => {
    onPress?.(event);
    menu.setOpen(null, 'press');
  };
  const link = (
    <Link
      {...rest}
      {...hooks.slot('link', { current: isCurrent }, className)}
      variant={variant}
      isStandalone={isStandalone}
      underline={underline}
      aria-current={isCurrent ? 'page' : undefined}
      onPress={press}
    />
  );
  if (isInPanel) return link;
  return <li {...hooks.slot('item', { current: isCurrent })}>{link}</li>;
}
