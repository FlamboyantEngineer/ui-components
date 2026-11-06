'use client';

import {
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useInteractOutside } from '../../primitives/index.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import {
  NavigationMenuContext,
  navigationMenuHooks as hooks,
  type NavigationMenuOpenReason,
  type NavigationMenuState,
} from './navigation-menu-state.js';

export interface NavigationMenuProps extends RefProps<HTMLElement>, BaseProps, AriaLabellingProps {
  /** The menu's `NavigationMenuItem`s and top-level `NavigationMenuLink`s. */
  children?: ReactNode;
  /** The key of the item whose panel is open, or `null` for none (controlled). */
  openKey?: Key | null | undefined;
  /** The item open at first when uncontrolled. Defaults to none. */
  defaultOpenKey?: Key | null | undefined;
  /** Called when a panel opens, or with `null` when the open one closes. */
  onOpenKeyChange?: ((key: Key | null) => void) | undefined;
  /** A resting mouse or pen opens an item's panel. Defaults to true. */
  openOnHover?: boolean | undefined;
  /** Milliseconds a pointer rests on an item before its panel opens. Defaults to 200. */
  openDelay?: number | undefined;
  /** Milliseconds a panel opened by hover stays open after the pointer leaves. Defaults to 300. */
  closeDelay?: number | undefined;
}

/** The open panel's border box as the menu's measured properties. */
function toPanelSize(size: { width: number; height: number } | null): CSSProperties | undefined {
  if (!size) return undefined;
  return {
    ...measuredProperty('navigation-menu-panel-width', size.width),
    ...measuredProperty('navigation-menu-panel-height', size.height),
  } as CSSProperties;
}

interface MenuStateOptions {
  /** Receives the open panel. */
  panelRef: (panel: HTMLDivElement | null) => void;
  openOnHover: boolean;
  openDelay: number;
  closeDelay: number;
}

/** The state items share: the open key, why it opened, and the hover delays before it changes. */
function useMenuState(
  openKey: Key | null,
  setOpenKey: (key: Key | null) => void,
  { panelRef, openOnHover, openDelay, closeDelay }: MenuStateOptions,
): NavigationMenuState {
  const reasonRef = useRef<NavigationMenuOpenReason>('press');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return useMemo<NavigationMenuState>(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    const setOpen = (key: Key | null, reason: NavigationMenuOpenReason) => {
      clearTimer();
      reasonRef.current = reason;
      setOpenKey(key);
    };
    return {
      openKey,
      setOpen,
      getOpenReason: () => reasonRef.current,
      hoverStart: (key) => {
        if (!openOnHover) return;
        clearTimer();
        // A pressed panel stays until pressed again; one the pointer opened switches at once.
        if (openKey === key) return;
        if (openKey !== null && reasonRef.current === 'press') return;
        if (openKey !== null) setOpen(key, 'hover');
        else timerRef.current = setTimeout(() => setOpen(key, 'hover'), openDelay);
      },
      hoverEnd: () => {
        clearTimer();
        if (openKey === null || reasonRef.current !== 'hover') return;
        timerRef.current = setTimeout(() => setOpen(null, 'hover'), closeDelay);
      },
      panelRef,
    };
  }, [openKey, setOpenKey, panelRef, openOnHover, openDelay, closeDelay]);
}

/**
 * Site navigation: a `<nav>` landmark with a list of top-level links and items whose panels hold
 * links and other content. One panel opens at a time, by press or by a resting pointer, and closes
 * on Escape, a press outside, focus leaving the menu, or a press on one of its links. It publishes
 * `data-open` and the open panel's size, so a stylesheet can place and animate one shared box.
 */
export function NavigationMenu({
  children,
  openKey: openKeyProp,
  defaultOpenKey = null,
  onOpenKeyChange,
  openOnHover = true,
  openDelay = 200,
  closeDelay = 300,
  ref,
  className,
  ...rest
}: NavigationMenuProps) {
  const rootRef = useRef<HTMLElement>(null);
  const rootRefs = useMergedRefs(rootRef, ref);
  const [openKey, setOpenKey] = useControllableState(openKeyProp, defaultOpenKey, onOpenKeyChange);
  // The open item's panel; an open key whose item was removed has none, so the menu shows closed.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const panelSize = useElementSize(panel, { box: 'border-box' });
  const state = useMenuState(openKey, setOpenKey, {
    panelRef: setPanel,
    openOnHover,
    openDelay,
    closeDelay,
  });
  const isOpen = panel !== null;

  useInteractOutside({
    ref: rootRef,
    isDisabled: !isOpen,
    onInteractOutside: () => state.setOpen(null, 'press'),
  });

  // Focus moving to an element outside the menu closes it; focus dropped on nothing (a press on
  // a panel's text) leaves it open, and a press outside closes it on its own.
  const closeOnFocusLeave = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (isOpen && next !== null && !event.currentTarget.contains(next as Node)) {
      state.setOpen(null, 'press');
    }
  };

  return (
    <nav
      ref={rootRefs}
      {...rest}
      {...hooks.root({ className, data: { open: isOpen } })}
      style={toPanelSize(isOpen ? panelSize : null)}
      onBlur={closeOnFocusLeave}
    >
      <NavigationMenuContext value={state}>
        <ul {...hooks.slot('list')}>{children}</ul>
      </NavigationMenuContext>
    </nav>
  );
}
