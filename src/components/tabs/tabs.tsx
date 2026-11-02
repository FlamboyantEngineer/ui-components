'use client';

import { useMemo, type ReactNode } from 'react';
import { TabPanel as AriaTabPanel, Tabs as AriaTabs } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, Orientation, Size, RefProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionItemKey, toCollectionKey } from '../../utils/to-collection-key.js';
import { TabsSharedContext, useTabsShared } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { keyCodec } from '../../utils/json-codec.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';

export type TabsSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `automatic` selects a tab when focus reaches it; `manual` waits for Space or Enter. */
export type TabsKeyboardActivation = 'automatic' | 'manual';

/** The state `Tabs` passes to `render` with its root's props. */
export interface TabsRenderState {
  orientation: Orientation;
}

/** The states a `TabPanel` passes to `render` with its element's props. */
export interface TabPanelRenderState {
  isFocused: boolean;
  isFocusVisible: boolean;
  /** A force-mounted panel whose tab is not selected. */
  isInert: boolean;
  isEntering: boolean;
  isExiting: boolean;
}

export interface TabsProps extends BaseProps, RefProps<HTMLDivElement> {
  /** The selected tab's `id` (controlled). */
  selectedKey?: Key | undefined;
  /** The initially selected tab's `id` when uncontrolled. Defaults to the first enabled tab. */
  defaultSelectedKey?: Key | undefined;
  /** Receives the `id` of the tab the reader selects. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** Keeps an uncontrolled selection in the provider's storage under this key. */
  persistKey?: string | undefined;
  /** The `id`s of tabs that cannot be selected or focused. */
  disabledKeys?: Iterable<Key> | undefined;
  /** Disables every tab. */
  isDisabled?: boolean | undefined;
  /** Lays the tabs out in a row or a column. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Whether focus alone selects a tab. Defaults to `automatic`. */
  keyboardActivation?: TabsKeyboardActivation | undefined;
  /** Tab block size. Defaults to `md`. */
  size?: TabsSize | undefined;
  /** The `TabList` and the `TabPanel`s. */
  children?: ReactNode;
  /** Replaces the root `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabsRenderState> | undefined;
}

export interface TabPanelProps extends Omit<BaseProps, 'id'>, RefProps<HTMLDivElement> {
  /** Pairs the panel with the `Tab` of the same `id`. */
  id?: Key | undefined;
  /** Keeps the panel mounted, inert and hidden, while its tab is not selected. */
  shouldForceMount?: boolean | undefined;
  /** The panel's content. */
  children?: ReactNode;
  /** Replaces the panel's `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabPanelRenderState> | undefined;
}

type SelectionOptions = Pick<
  TabsProps,
  'persistKey' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
>;

/**
 * The selection props for the building block: the caller's, or, with `persistKey` and no
 * `selectedKey`, an uncontrolled selection that starts from the provider's storage and is written
 * back on every change. With nothing stored it starts from `defaultSelectedKey`; the building block
 * replaces a key that no enabled tab has with the first enabled tab, which is then stored.
 */
function usePersistedSelection({
  persistKey,
  ...selection
}: SelectionOptions): Omit<SelectionOptions, 'persistKey'> {
  const { selectedKey, onSelectionChange } = selection;
  const [storedKey, setStoredKey] = usePersistedValue<Key | null>({
    value: selectedKey,
    defaultValue: selection.defaultSelectedKey ?? null,
    onChange:
      onSelectionChange &&
      ((key) => {
        if (key !== null) onSelectionChange(key);
      }),
    persistKey,
    codec: keyCodec,
  });
  if (persistKey === undefined || selectedKey !== undefined) return selection;
  return { defaultSelectedKey: storedKey ?? undefined, onSelectionChange: setStoredKey };
}

/**
 * Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. With
 * `persistKey` it remembers the selected tab through the provider's storage.
 */
export function Tabs({
  size = 'md',
  className,
  persistKey,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  ...rest
}: TabsProps) {
  const selection = usePersistedSelection({
    persistKey,
    selectedKey,
    defaultSelectedKey,
    onSelectionChange,
  });
  const disabledKeys = useMemo(
    () => rest.disabledKeys && Array.from(rest.disabledKeys, toCollectionKey),
    [rest.disabledKeys],
  );
  const shared = useTabsShared({
    orientation: rest.orientation ?? 'horizontal',
    isDisabled: rest.isDisabled ?? false,
    disabledKeys,
  });
  return (
    <TabsSharedContext value={shared}>
      <AriaTabs
        // Another storage key restores that key's selection.
        key={persistKey}
        {...rest}
        selectedKey={toCollectionItemKey(selection.selectedKey)}
        defaultSelectedKey={toCollectionItemKey(selection.defaultSelectedKey)}
        onSelectionChange={(key) => selection.onSelectionChange?.(fromCollectionKey(key))}
        disabledKeys={disabledKeys}
        {...hooks.root({ className, props: rest, data: { size } })}
      />
    </TabsSharedContext>
  );
}

/** The content shown for the tab with the same `id`. */
export function TabPanel({ className, id, ...rest }: TabPanelProps) {
  return (
    <AriaTabPanel
      {...rest}
      id={toCollectionItemKey(id)}
      className={mergeClassNames(hooks.slotClass('panel'), className)}
    />
  );
}

export { Tab } from './tab.js';
export type { TabProps } from './tab.js';
export { TabList } from './tab-list.js';
export type {
  TabListOverflow,
  TabListProps,
  TabListRenderState,
  TabMenuAction,
  TabMenuIcons,
  TabMenuItems,
  TabMove,
  TabNameValidate,
} from './tab-list.js';
