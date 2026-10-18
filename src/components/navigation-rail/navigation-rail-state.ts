// The state a navigation rail shares with its sections, items and groups.

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState } from '../../core/provider.js';

export interface NavigationRailState {
  /** The rail shows icons only. */
  isCollapsed: boolean;
  /** Expands a collapsed rail, as pressing a group in it does. */
  expand: () => void;
}

/** Counts the current items inside a group, so the group can say it holds the current page. */
export type CurrentItemRegistry = () => () => void;

export interface PersistedValueOptions<T> {
  /** The controlled value, which storage never overrides. */
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  /** Where the uncontrolled value persists. */
  persistKey: string | undefined;
}

export const navigationRailHooks = createHooks('navigation-rail', [
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
]);

export const NavigationRailContext = createContext<NavigationRailState>({
  isCollapsed: false,
  expand: () => {},
});

export const CurrentItemContext = createContext<CurrentItemRegistry | null>(null);

/**
 * A value the caller may control that otherwise persists through the provider storage under
 * `persistKey`. Every change is reported through `onChange`.
 */
export function usePersistedValue<T>({
  value,
  defaultValue,
  onChange,
  persistKey,
}: PersistedValueOptions<T>): [T, (next: T) => void] {
  const [own, setOwn] = usePersistentState(
    value === undefined ? persistKey : undefined,
    defaultValue,
  );
  const setValue = useCallback(
    (next: T) => {
      setOwn(next);
      onChange?.(next);
    },
    [setOwn, onChange],
  );
  return [value ?? own, setValue];
}

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
