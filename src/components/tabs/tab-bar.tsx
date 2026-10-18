// The parts around a list of tabs: scroll buttons, the "more" menu of hidden tabs and the add button.

import { useMemo, type ReactNode, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { Key, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { scrollStripPage, type ScrollStripState } from '../../utils/use-scroll-strip-overflow.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { IconButton } from '../icon-button/icon-button.js';
import type { TabListModel } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';

type Edge = 'start' | 'end';

interface TabScrollButtonProps {
  edge: Edge;
  isHidden: boolean;
  onPress: (edge: Edge) => void;
}

/** Which tabs a menu list keeps, and the elements that measure them. */
export type TabOverflow = ReturnType<typeof useTabOverflow>;

export interface TabBarProps {
  state: TabListModel;
  orientation: Orientation;
  isMenu: boolean;
  hasButtons: boolean;
  menu: TabOverflow;
  strip: ScrollStripState & { stripRef: RefObject<HTMLDivElement | null> };
  onAdd: (() => void) | undefined;
  children: ReactNode;
}

const noKeys: readonly Key[] = Object.freeze([]);

/** The menu entries of the hidden tabs: their text, disabled state and link. */
function toMenuEntries(state: TabListModel, keys: readonly Key[]) {
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

function TabScrollButton({ edge, isHidden, onPress }: TabScrollButtonProps) {
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

/** Which tabs a menu list keeps: the selected and focused tabs first, then from the start. */
export function useTabOverflow(state: TabListModel | null, isMenu: boolean) {
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

/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
export function TabBar({
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
