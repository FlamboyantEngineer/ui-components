import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  TabList as AriaTabList,
  TabListStateContext,
  TabsContext,
  useLocale,
  useSlottedContext,
  type Key,
  type TabListProps as AriaTabListProps,
  type TabListState,
} from 'react-aria-components';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import {
  scrollStripPage,
  useScrollStripOverflow,
  type ScrollStripState,
} from '../../utils/use-scroll-strip-overflow.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { IconButton } from '../icon-button/icon-button.js';
import { VisibleCollection } from '../overflow-list/overflow-list.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useCenterSelectedTab, useListOverflow } from './tab-list-overflow.js';

/** `scroll` lets an overflowing list scroll; `menu` collapses the tabs that do not fit into a menu. */
export type TabListOverflow = 'scroll' | 'menu';

export interface TabListProps<T>
  extends
    Omit<AriaTabListProps<T>, 'className' | 'style'>,
    Pick<NativeProps<'div'>, 'ref'>,
    BaseProps {
  /**
   * What a horizontal list does with tabs that do not fit: `scroll` (the default) or `menu`, which
   * keeps the selected tab and as many others as fit and lists the rest in a "more" menu.
   */
  overflow?: TabListOverflow | undefined;
  /** Draws previous and next buttons beside a horizontal list that scrolls, at an edge hiding tabs. */
  scrollButtons?: boolean | undefined;
  /** Makes the tabs removable: a close mark on each and Delete or Backspace on the focused one. */
  onRemove?: ((keys: Set<Key>) => void) | undefined;
  /** Draws an add button after the tabs. */
  onAdd?: (() => void) | undefined;
}

type Edge = 'start' | 'end';

/** The list's `onRemove`, for the tabs inside it. */
export const TabRemoveContext = createContext<((keys: Set<Key>) => void) | undefined>(undefined);

const noKeys: readonly Key[] = Object.freeze([]);

/** The menu entries of the hidden tabs: their text, disabled state and link. */
function toMenuEntries(state: TabListState<object>, keys: readonly Key[]) {
  return keys.map((key) => {
    const node = state.collection.getItem(key);
    const props = (node?.props ?? {}) as { isDisabled?: boolean; href?: string };
    return {
      id: key,
      label: node?.textValue || String(key),
      isDisabled: state.disabledKeys.has(key) || props.isDisabled === true,
      href: props.href,
    };
  });
}

/** Which tabs a menu list keeps: the selected and focused tabs first, then from the start. */
function useTabOverflow(state: TabListState<object> | null, isMenu: boolean) {
  const keys = isMenu && state ? [...state.collection].map((node) => node.key) : noKeys;
  const selectedKey = state?.selectedKey ?? null;
  const manager = state?.selectionManager;
  const focusedKey = manager?.isFocused ? manager.focusedKey : null;
  const overflow = useOverflowItems({
    items: keys,
    getPriority: (key) => (key === selectedKey ? 2 : key === focusedKey ? 1 : 0),
  });
  const visibleKeys = useMemo(() => new Set(overflow.visibleItems), [overflow.visibleItems]);
  return { ...overflow, visibleKeys: isMenu ? visibleKeys : null };
}

function TabScrollButton({
  edge,
  isHidden,
  onPress,
}: { edge: Edge; isHidden: boolean } & {
  onPress: (edge: Edge) => void;
}) {
  const strings = useUiStrings();
  const pointsLeft = (edge === 'start') !== (useLocale().direction === 'rtl');
  return (
    <IconButton
      {...hooks.slot('scroll-button', { edge })}
      icon={pointsLeft ? 'chevron-left' : 'chevron-right'}
      label={edge === 'start' ? strings.scrollBackward : strings.scrollForward}
      size="sm"
      excludeFromTabOrder
      hidden={isHidden}
      onPress={() => onPress(edge)}
    />
  );
}

/** Menus and scroll buttons serve horizontal lists; a vertical list scrolls. */
function resolveParts({
  orientation,
  overflow,
  scrollButtons,
}: {
  orientation: Orientation;
  overflow: TabListOverflow;
  scrollButtons: boolean;
}) {
  const horizontal = orientation === 'horizontal';
  return {
    isMenu: horizontal && overflow === 'menu',
    hasButtons: horizontal && overflow === 'scroll' && scrollButtons,
  };
}

/** Adds the remove keys to the list element, which React Aria keeps its own keyboard handling on. */
function renderRemoveKeys(
  render: AriaTabListProps<object>['render'],
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void,
): AriaTabListProps<object>['render'] {
  return (props, state) => {
    const merged = mergeProps(props, { onKeyDown });
    return render ? render(merged, state) : <div {...merged} />;
  };
}

/** Delete and Backspace remove the focused tab of a removable list. */
function useRemoveKey(
  state: TabListState<object> | null,
  onRemove: TabListProps<object>['onRemove'],
) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onRemove || !state || (event.key !== 'Delete' && event.key !== 'Backspace')) return;
    const key = state.selectionManager.focusedKey;
    if (key === null || state.disabledKeys.has(key)) return;
    event.preventDefault();
    onRemove(new Set([key]));
  };
}

interface TabBarProps {
  state: TabListState<object>;
  orientation: Orientation;
  isMenu: boolean;
  hasButtons: boolean;
  menu: ReturnType<typeof useTabOverflow>;
  strip: ScrollStripState & { stripRef: RefObject<HTMLDivElement | null> };
  onAdd: (() => void) | undefined;
  children: ReactNode;
}

/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
function TabBar({
  state,
  orientation,
  isMenu,
  hasButtons,
  menu,
  strip,
  onAdd,
  children,
}: TabBarProps) {
  const strings = useUiStrings();
  const rtl = useLocale().direction === 'rtl';
  const pageToward = (edge: Edge) => {
    if (!strip.stripRef.current) return;
    scrollStripPage(strip.stripRef.current, { edge, rtl });
    strip.syncOverflow();
  };
  const scrollButton = (edge: Edge) =>
    hasButtons ? (
      <TabScrollButton edge={edge} isHidden={!strip.overflow[edge]} onPress={pageToward} />
    ) : null;
  return (
    <div
      ref={isMenu ? menu.containerRef : undefined}
      {...hooks.slot('bar', { overflow: isMenu ? 'menu' : 'scroll', orientation })}
    >
      {scrollButton('start')}
      {children}
      {scrollButton('end')}
      {isMenu && menu.hiddenItems.length > 0 ? (
        <div ref={menu.indicatorRef} {...hooks.slot('overflow')}>
          <DropdownMenu
            iconOnly
            size="sm"
            placement="bottom end"
            label={strings.moreItems(menu.hiddenItems.length)}
            items={toMenuEntries(state, menu.hiddenItems)}
            onAction={(key) => state.setSelectedKey(key)}
          />
        </div>
      ) : null}
      {onAdd ? (
        <IconButton
          {...hooks.slot('add')}
          icon="plus"
          label={strings.addTab}
          size="sm"
          onPress={onAdd}
        />
      ) : null}
    </div>
  );
}

/**
 * The row (or column) of tabs. An overflowing list scrolls the selected tab toward its middle, or
 * collapses the tabs that do not fit into a "more" menu; it can draw scroll buttons, removable tabs
 * and an add button.
 */
export function TabList<T extends object>({
  overflow = 'scroll',
  scrollButtons = false,
  onRemove,
  onAdd,
  className,
  ref,
  ...rest
}: TabListProps<T>) {
  const state = useContext(TabListStateContext);
  const orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
  const { isMenu, hasButtons } = resolveParts({ orientation, overflow, scrollButtons });
  const [listRef, setListRef] = useForwardedRef(ref);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const menu = useTabOverflow(state, isMenu);
  const strip = useScrollStripOverflow(stripRef);
  const scrollOverflowing = useListOverflow(listRef, orientation);
  useCenterSelectedTab(listRef, { orientation, selectedKey: state?.selectedKey ?? null });
  const onRemoveKey = useRemoveKey(state, onRemove);
  const elementRef = useMemo(
    () => mergeRefs(setListRef, menu.itemContainerRef, hasButtons ? stripRef : undefined),
    [setListRef, menu.itemContainerRef, hasButtons],
  );
  // React Aria builds the collection from a hidden render of the list, which draws no parts.
  if (!state) {
    return (
      <TabRemoveContext.Provider value={onRemove}>
        <AriaTabList {...rest} />
      </TabRemoveContext.Provider>
    );
  }

  const overflowing = isMenu ? menu.hiddenItems.length > 0 : scrollOverflowing;
  const list = (
    <TabRemoveContext.Provider value={onRemove}>
      <VisibleCollection keys={menu.visibleKeys}>
        <AriaTabList
          {...mergeProps(rest, { onScroll: hasButtons ? strip.syncOverflow : undefined })}
          render={onRemove ? renderRemoveKeys(rest.render, onRemoveKey) : rest.render}
          ref={elementRef}
          {...hooks.slot('list', { overflowing }, className)}
        />
      </VisibleCollection>
    </TabRemoveContext.Provider>
  );
  if (!isMenu && !hasButtons && !onAdd) return list;
  return (
    <TabBar
      {...{ state, orientation, isMenu, hasButtons, menu, onAdd }}
      strip={{ ...strip, stripRef }}
    >
      {list}
    </TabBar>
  );
}
