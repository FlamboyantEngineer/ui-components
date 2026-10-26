// The state a navigation rail shares with its sections, items and groups.

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState, type PersistCodec } from '../../core/provider.js';

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
  /** Reads and writes the stored value; a stored value it cannot read gives the default. */
  codec: PersistCodec<T>;
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

/** A JSON codec that refuses a stored value `isValid` rejects, so the default applies. */
function createCheckedCodec<T>(isValid: (value: unknown) => value is T): PersistCodec<T> {
  return {
    parse: (raw) => {
      const value: unknown = JSON.parse(raw);
      if (!isValid(value)) throw new TypeError('Unexpected stored value');
      return value;
    },
    stringify: (value) => JSON.stringify(value),
  };
}

/** The stored collapsed state: a boolean. */
export const collapsedCodec = createCheckedCodec(
  (value): value is boolean => typeof value === 'boolean',
);

/** The stored width: a finite number of pixels. */
export const widthCodec = createCheckedCodec(
  (value): value is number => typeof value === 'number' && Number.isFinite(value),
);

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
  codec,
}: PersistedValueOptions<T>): [T, (next: T) => void] {
  const [own, setOwn] = usePersistentState(
    value === undefined ? persistKey : undefined,
    defaultValue,
    codec,
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
