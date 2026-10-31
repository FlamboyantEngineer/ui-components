'use client';

import { PlusGlyph } from '../../core/glyphs.js';
// The parts around a list of tabs: scroll buttons, the "more" menu of hidden tabs and the add button.

import { useContext, useMemo, type ReactNode } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { ScrollStrip, type useToolbarScroll } from '../toolbar-scroller/toolbar-scroller.js';
import { TabsSharedContext, type TabListModel } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';

/** Which tabs a menu list keeps, and the elements that measure them. */
type TabOverflow = ReturnType<typeof useTabOverflow>;

interface TabBarProps {
  state: TabListModel;
  orientation: Orientation;
  isMenu: boolean;
  hasButtons: boolean;
  menu: TabOverflow;
  /** The edges past which the list hides tabs, and paging toward one. */
  scroll: Pick<ReturnType<typeof useToolbarScroll>, 'edges' | 'pageToward'>;
  onAdd: (() => void) | undefined;
  children: ReactNode;
}

const noKeys: readonly Key[] = Object.freeze([]);

/** The menu entries of the hidden tabs: their text, disabled state and link. */
function toMenuEntries(state: TabListModel, keys: readonly Key[], isDisabled: boolean) {
  return keys.map((key) => {
    const node = state.collection.getItem(key);
    const props = (node?.props ?? {}) as { isDisabled?: boolean; href?: string };
    return {
      id: key,
      label: node?.textValue || String(key),
      isDisabled: isDisabled || state.disabledKeys.has(key) || props.isDisabled === true,
      href: props.href,
    };
  });
}

/**
 * Which tabs a menu list keeps: the tab being renamed, the selected and focused tabs first, then
 * from the start.
 */
export function useTabOverflow(
  state: TabListModel | null,
  isMenu: boolean,
  editingKey: Key | null,
) {
  const keys = isMenu && state ? [...state.collection].map((node) => node.key) : noKeys;
  const selectedKey = state?.selectedKey ?? null;
  const manager = state?.selectionManager;
  const focusedKey = manager?.isFocused ? manager.focusedKey : null;
  const overflow = useOverflowItems({
    items: keys,
    getPriority: (key) =>
      key === editingKey ? 3 : key === selectedKey ? 2 : key === focusedKey ? 1 : 0,
  });
  const visibleKeys = useMemo(() => new Set(overflow.visibleItems), [overflow.visibleItems]);
  return { ...overflow, visibleKeys: isMenu ? visibleKeys : null };
}

/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
export function TabBar({
  state,
  orientation,
  isMenu,
  hasButtons,
  menu,
  scroll,
  onAdd,
  children,
}: TabBarProps) {
  const strings = useUiStrings();
  const { isDisabled } = useContext(TabsSharedContext);
  return (
    <div
      ref={isMenu ? menu.containerRef : undefined}
      {...hooks.slot('bar', { overflow: isMenu ? 'menu' : 'scroll', orientation })}
    >
      <ScrollStrip
        hooks={hooks}
        edges={scroll.edges}
        onPage={scroll.pageToward}
        hasButtons={hasButtons}
      >
        {children}
      </ScrollStrip>
      {isMenu && menu.hiddenItems.length > 0 ? (
        <div ref={menu.indicatorRef} {...hooks.slot('overflow')}>
          <DropdownMenu
            iconOnly
            size="sm"
            placement="bottom end"
            label={strings.moreItems(menu.hiddenItems.length)}
            isDisabled={isDisabled}
            items={toMenuEntries(state, menu.hiddenItems, isDisabled)}
            onAction={(key) => state.setSelectedKey(key)}
          />
        </div>
      ) : null}
      {onAdd ? (
        <Button
          {...hooks.slot('add')}
          icon={PlusGlyph}
          label={strings.addTab}
          size="sm"
          onPress={onAdd}
        />
      ) : null}
    </div>
  );
}
