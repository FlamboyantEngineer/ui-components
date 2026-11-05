'use client';

// The parts around a list of tabs: scroll buttons, the "more" menu of hidden tabs and the add button.
import { type ReactNode, useContext } from 'react';
import { PlusGlyph } from '../../core/glyphs.js';
import type { Key, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { ScrollStrip, type useToolbarScroll } from '../toolbar-scroller/toolbar-scroller.js';
import { type TabListModel, TabsSharedContext } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import type { TabListPartsModel } from './tab-list-parts.js';

/** Which tabs a menu list keeps, and the elements that measure them. */
type TabOverflow = ReturnType<typeof useTabOverflow>;

interface TabBarProps {
  state: TabListModel;
  orientation: Orientation;
  isMenu: boolean;
  hasButtons: boolean;
  hasActions: boolean;
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
  { editingKey, parts }: { editingKey: Key | null; parts: TabListPartsModel | null },
) {
  const keys =
    isMenu && state ? (parts ? parts.ids : [...state.collection].map((node) => node.key)) : noKeys;
  const selectedKey = state?.selectedKey ?? null;
  const manager = state?.selectionManager;
  const focusedKey = manager?.isFocused ? manager.focusedKey : null;
  const overflow = useOverflowItems({
    items: keys,
    getPriority: (key) => {
      const part = parts?.byId.get(String(key));
      if (part?.kind === 'action') return 4;
      const tabKey = part?.key ?? key;
      return tabKey === editingKey ? 3 : tabKey === selectedKey ? 2 : tabKey === focusedKey ? 1 : 0;
    },
  });
  const tabKeys = (ids: readonly Key[]) =>
    parts
      ? ids.flatMap((id) => {
          const part = parts.byId.get(String(id));
          return part?.kind === 'tab' ? [part.key] : [];
        })
      : ids;
  const visibleKeys = new Set(tabKeys(overflow.visibleItems));
  return {
    ...overflow,
    hiddenItems: tabKeys(overflow.hiddenItems),
    visibleKeys: isMenu ? visibleKeys : null,
    visibleParts: parts && isMenu ? new Set(overflow.visibleItems.map(String)) : null,
  };
}

/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
export function TabBar({
  state,
  orientation,
  isMenu,
  hasButtons,
  hasActions,
  menu,
  scroll,
  onAdd,
  children,
}: TabBarProps) {
  const { containerRef, indicatorRef, hiddenItems } = menu;
  const strings = useUiStrings();
  const { isDisabled } = useContext(TabsSharedContext);
  return (
    <div
      ref={isMenu ? containerRef : undefined}
      {...hooks.slot('bar', {
        overflow: isMenu ? 'menu' : 'scroll',
        orientation,
        inlineActions: hasActions,
      })}
    >
      <ScrollStrip
        hooks={hooks}
        edges={scroll.edges}
        onPage={scroll.pageToward}
        hasButtons={hasButtons}
      >
        {children}
      </ScrollStrip>
      {isMenu && hiddenItems.length > 0 ? (
        <div ref={indicatorRef} {...hooks.slot('overflow')}>
          <DropdownMenu
            iconOnly
            size="sm"
            placement="bottom end"
            label={strings.moreItems(hiddenItems.length)}
            isDisabled={isDisabled}
            items={toMenuEntries(state, hiddenItems, isDisabled)}
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
