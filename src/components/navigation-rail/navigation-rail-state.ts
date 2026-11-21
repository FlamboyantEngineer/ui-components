'use client';

// The state a navigation rail shares with its sections, items and groups.

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';

interface NavigationRailState {
  /** The rail shows icons only. */
  isCollapsed: boolean;
  /** Expands a collapsed rail, as pressing a group in it does. */
  expand: () => void;
}

/** Counts the current items inside a group, so the group can say it holds the current page. */
type CurrentItemRegistry = () => () => void;

export const navigationRailHooks = createHooks(
  'navigation-rail',
  [
    'header',
    'toggle',
    'body',
    'footer',
    'resize-handle',
    'section',
    'section-title',
    'list',
    'item',
    'link',
    'icon',
    'monogram',
    'label',
    'count',
    'group',
    'group-trigger',
    'indicator',
    'group-panel',
  ],
  {
    root: 'sidebar',
    header: 'sidebar-header',
    toggle: 'sidebar-trigger',
    body: 'sidebar-content',
    footer: 'sidebar-footer',
    'resize-handle': 'sidebar-rail',
    section: 'sidebar-group',
    'section-title': 'sidebar-group-label',
    list: 'sidebar-menu',
    item: 'sidebar-menu-item',
    link: 'sidebar-menu-button',
    count: 'sidebar-menu-badge',
    'group-panel': 'sidebar-menu-sub',
  },
);

export const NavigationRailContext = createContext<NavigationRailState>({
  isCollapsed: false,
  expand: () => {},
});

export const CurrentItemContext = createContext<CurrentItemRegistry | null>(null);

/** Tells the enclosing group, while `isCurrent` holds, that it holds a current item. */
export function useReportCurrent(isCurrent: boolean) {
  const register = useContext(CurrentItemContext);
  useLayoutEffect(() => (isCurrent && register ? register() : undefined), [isCurrent, register]);
}

/** A registry for the current items below a group, and whether it holds any. */
export function useCurrentItems(): [boolean, CurrentItemRegistry] {
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount((value) => value + 1);
    return () => setCount((value) => value - 1);
  }, []);
  return [count > 0, register];
}
