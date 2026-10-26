import { useId, useMemo, type ReactNode, type RefCallback } from 'react';
import { Breadcrumb as AriaBreadcrumb } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { MenuEntry } from '../menu/menu.js';

/** What the overflow logic reads of a crumb. */
export interface CrumbEntry {
  id?: Key | undefined;
  label: ReactNode;
  textValue?: string | undefined;
  href?: string | undefined;
}

export interface CrumbOverflow {
  /** The key of the overflow crumb, which sits after the first crumb while crumbs are hidden. */
  overflowKey: string;
  /** The keys to render, or `null` to render every crumb with no overflow crumb. */
  visibleKeys: ReadonlySet<Key> | null;
  /** The hidden crumbs' positions in the trail. */
  hiddenIndices: readonly number[];
  containerRef: RefCallback<HTMLElement>;
  indicatorRef: RefCallback<HTMLElement>;
}

interface OverflowCrumbProps {
  id: string;
  menuRef: RefCallback<HTMLElement>;
  items: readonly MenuEntry[];
  onAction: ((key: Key) => void) | undefined;
  isDisabled: boolean | undefined;
  separator: ReactNode;
}

const hooks = createHooks('breadcrumb', ['item', 'overflow']);

/** A crumb's key: its `id`, or its index. */
export function toCrumbKey(item: CrumbEntry, index: number): Key {
  return item.id ?? index;
}

/** A crumb's text for a menu: `textValue`, a plain-text label, or its key. */
export function toCrumbText(item: CrumbEntry, index: number): string {
  if (item.textValue) return item.textValue;
  return typeof item.label === 'string' ? item.label : String(toCrumbKey(item, index));
}

/**
 * Which crumbs a trail collapsing into a menu keeps: the first and the current crumb, then as many
 * as fit from the current end. The others leave the trail but stay in its collection.
 */
export function useCrumbOverflow(items: readonly CrumbEntry[], isMenu: boolean): CrumbOverflow {
  const overflowKey = useId();
  const collapses = isMenu && items.length > 2;
  const keys = collapses ? items.map(toCrumbKey) : [];
  const last = keys.length - 1;
  const overflow = useOverflowItems({
    items: keys,
    collapseFrom: 'start',
    getPriority: (_key, index) => (index === 0 || index === last ? 1 : 0),
  });
  const visibleKeys = useMemo(() => {
    const visible = new Set<Key>(overflow.visibleItems);
    if (overflow.hiddenItems.length > 0) visible.add(overflowKey);
    return visible;
  }, [overflow.visibleItems, overflow.hiddenItems, overflowKey]);
  const hidden = new Set(overflow.hiddenItems);
  return {
    overflowKey,
    visibleKeys: collapses ? visibleKeys : null,
    hiddenIndices: keys.flatMap((key, index) => (hidden.has(key) ? [index] : [])),
    containerRef: overflow.containerRef,
    indicatorRef: overflow.indicatorRef,
  };
}

/** The crumb that stands for the hidden ones: a "more" menu of them, then a separator. */
export function OverflowCrumb(props: OverflowCrumbProps) {
  const { id, menuRef, items, onAction, isDisabled, separator } = props;
  const strings = useUiStrings();
  return (
    <AriaBreadcrumb
      id={id}
      ref={menuRef}
      className={mergeClassNames(hooks.slotClass('item'), hooks.slotClass('overflow'))}
    >
      <DropdownMenu
        iconOnly
        size="xs"
        variant="ghost"
        label={strings.moreItems(items.length)}
        isDisabled={isDisabled}
        items={items}
        onAction={(key) => onAction?.(key)}
      />
      {separator}
    </AriaBreadcrumb>
  );
}
