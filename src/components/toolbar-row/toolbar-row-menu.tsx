'use client';

// The tools of a toolbar row described as data, and the "more" menu that takes the ones that do
// not fit when the row collapses them by priority.

import { type ReactNode, type Ref, useMemo } from 'react';
import type { ComponentHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useOverflowFocus } from '../../utils/use-overflow-focus.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { IconSource } from '../icon/icon.js';

/** One tool described as data, for a row that draws it with `renderItem` or collapses it into a menu. */
export interface ToolbarRowItem {
  id: Key;
  /** The tool's name, and its text in the overflow menu. */
  label: string;
  /** The tool's icon in the overflow menu. */
  icon?: IconSource;
  /** Disables the tool's menu entry. */
  isDisabled?: boolean | undefined;
  /** Runs when the tool is chosen from the overflow menu. */
  onAction?: (() => void) | undefined;
  /** Tools with a higher priority stay in the row longer. Defaults to 0. */
  priority?: number | undefined;
}

type RowHooks = ComponentHooks<'item' | 'overflow'>;

const noItems: readonly never[] = Object.freeze([]);

/** The menu of the tools that do not fit, at the end of the strip. */
function OverflowMenu<T extends ToolbarRowItem>({
  hidden,
  hooks,
}: {
  hidden: readonly T[];
  hooks: RowHooks;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('overflow')}>
      <DropdownMenu
        iconOnly
        size="sm"
        placement="bottom end"
        label={strings.moreItems(hidden.length)}
        items={hidden.map(({ id, label, icon, isDisabled }) => ({ id, label, icon, isDisabled }))}
        onAction={(key) => hidden.find((item) => item.id === key)?.onAction?.()}
      />
    </div>
  );
}

interface ToolbarRowItemsOptions<T extends ToolbarRowItem> {
  /** Whether the row collapses the tools that do not fit into the menu. */
  isMenu: boolean;
  items: readonly T[] | undefined;
  renderItem: ((item: T) => ReactNode) | undefined;
  /** The row's own refs to its strip, merged with the ones measuring and keeping focus. */
  stripRefs: ReadonlyArray<Ref<HTMLDivElement> | undefined>;
  hooks: RowHooks;
}

/**
 * The strip's ref and content for tools given as data: each drawn in an item element keyed by
 * `id`, only the ones that fit while collapsing, then the menu of the others. Without `items` and
 * `renderItem` the content is `null` and the caller draws its children.
 */
export function useToolbarRowItems<T extends ToolbarRowItem>({
  isMenu,
  items,
  renderItem,
  stripRefs,
  hooks,
}: ToolbarRowItemsOptions<T>) {
  const collapse = useOverflowItems({
    items: isMenu && items ? items : noItems,
    getPriority: (item) => item.priority ?? 0,
    getKey: (item) => item.id,
  });
  const focusRef = useOverflowFocus({
    item: `.${hooks.slotClass('item')}`,
    overflow: `.${hooks.slotClass('overflow')} button`,
  });
  const { containerRef } = collapse;
  const [first, second] = stripRefs;
  const stripRef = useMemo(
    () =>
      isMenu
        ? mergeRefs(first, second, containerRef, focusRef)
        : mergeRefs(first, second, focusRef),
    [isMenu, first, second, containerRef, focusRef],
  );
  const shown = isMenu ? collapse.visibleItems : items;
  const hidden = isMenu ? collapse.hiddenItems : noItems;
  const content =
    shown && renderItem ? (
      <>
        {shown.map((item) => (
          <div key={toKeyIdentity(item.id)} {...hooks.slot('item')}>
            {renderItem(item)}
          </div>
        ))}
        {hidden.length > 0 ? <OverflowMenu hidden={hidden} hooks={hooks} /> : null}
      </>
    ) : null;
  return { stripRef, content };
}
