'use client';

import { type ReactNode, useMemo } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Toolbar } from '../../primitives/index.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { renderCaretKeyToolbar } from '../../utils/toolbar-caret-keys.js';
import { useOverflowFocus } from '../../utils/use-overflow-focus.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { IconSource } from '../icon/icon.js';
import { ScrollStrip } from './scroll-strip.js';
import { useToolbarScroll } from './use-toolbar-scroll.js';

/** `scroll` lets the strip scroll; `menu` moves the tools that do not fit into a "more" menu. */
export type ToolbarScrollerOverflow = 'scroll' | 'menu';

/** One tool described as data, for a scroller that collapses tools into a menu. */
export interface ToolbarScrollerItem {
  id: Key;
  /** The tool's name, and its text in the overflow menu. */
  label: string;
  /** The tool's icon in the overflow menu. */
  icon?: IconSource;
  /** Disables the tool's menu entry. */
  isDisabled?: boolean | undefined;
  /** Runs when the tool is chosen from the overflow menu. */
  onAction?: (() => void) | undefined;
  /** Tools with a higher priority stay in the strip longer. Defaults to 0. */
  priority?: number | undefined;
}

export interface ToolbarScrollerProps<T extends ToolbarScrollerItem = ToolbarScrollerItem>
  extends
    RefProps<HTMLDivElement>,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>,
    BaseProps {
  /** The tools. They stay direct children of the scrolling strip, at their natural size and order. */
  children?: ReactNode;
  /** Show a scroll button at each edge that hides tools. Defaults to `true`. */
  scrollButtons?: boolean | undefined;
  /** Draws a decorative fade over each edge that hides tools. Defaults to `false`. */
  showEdgeFades?: boolean | undefined;
  /** The tools as data, drawn by `renderItem`, in place of `children`. */
  items?: readonly T[] | undefined;
  /** Draws one tool of `items`. */
  renderItem?: ((item: T) => ReactNode) | undefined;
  /**
   * What happens to tools that do not fit: `scroll` (the default) scrolls the strip; `menu` keeps
   * the tools that fit, highest `priority` first, and lists the others in a "more" menu. `menu`
   * needs `items`.
   */
  overflow?: ToolbarScrollerOverflow | undefined;
}

const hooks = createHooks('toolbar-scroller', [
  'strip',
  'item',
  'overflow',
  'fade',
  'scroll-button',
]);

const noItems: readonly never[] = Object.freeze([]);

const focusSelectors = {
  item: `.${hooks.slotClass('item')}`,
  overflow: `.${hooks.slotClass('overflow')} button`,
};

/** The menu of the tools that do not fit, at the end of the strip. */
function OverflowMenu<T extends ToolbarScrollerItem>({ hidden }: { hidden: readonly T[] }) {
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

/**
 * The strip of either overflow mode: scrolling, or keeping the tools that fit and handing the
 * others to the overflow menu. One strip serves both, with one ref.
 */
function useScrollerStrip<T extends ToolbarScrollerItem>(
  isMenu: boolean,
  items: readonly T[] | undefined,
) {
  const scroll = useToolbarScroll(!isMenu);
  const collapse = useOverflowItems({
    items: isMenu && items ? items : noItems,
    getPriority: (item) => item.priority ?? 0,
    getKey: (item) => item.id,
  });
  const focusRef = useOverflowFocus(focusSelectors);
  const { stripRef } = scroll;
  const { containerRef } = collapse;
  const ref = useMemo(
    () => (isMenu ? mergeRefs(stripRef, containerRef, focusRef) : mergeRefs(stripRef, focusRef)),
    [isMenu, stripRef, containerRef, focusRef],
  );
  return {
    scroll,
    ref,
    edges: isMenu ? { start: false, end: false } : scroll.edges,
    shown: isMenu ? collapse.visibleItems : items,
    hidden: isMenu ? collapse.hiddenItems : noItems,
  };
}

/**
 * One horizontal row of tools that scrolls instead of squeezing them, or collapses the tools that
 * do not fit into a menu. A toolbar gives the tools arrow-key focus; scroll buttons, and decorative
 * fades when asked for, appear only at an edge that hides tools. Both overflow modes draw the tools in the same
 * strip, so changing the mode keeps every tool that stays visible mounted, with its state and focus.
 */
export function ToolbarScroller<T extends ToolbarScrollerItem = ToolbarScrollerItem>({
  children,
  scrollButtons = true,
  showEdgeFades = false,
  items,
  renderItem,
  overflow: requestedOverflow = 'scroll',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...rest
}: ToolbarScrollerProps<T>) {
  const isMenu = requestedOverflow === 'menu' && items !== undefined && renderItem !== undefined;
  const { scroll, ref, edges, shown, hidden } = useScrollerStrip(isMenu, items);
  const data = isMenu
    ? { overflow: 'menu' }
    : { overflow: 'scroll', overflowStart: edges.start, overflowEnd: edges.end };
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data })}
      onFocus={isMenu ? undefined : scroll.onFocus}
    >
      <ScrollStrip
        hooks={hooks}
        edges={edges}
        onPage={scroll.pageToward}
        hasButtons={scrollButtons && !isMenu}
        fadeHooks={showEdgeFades && !isMenu ? hooks : undefined}
      >
        <Toolbar
          ref={ref}
          className={hooks.slotClass('strip')}
          orientation="horizontal"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          onScroll={isMenu ? undefined : scroll.syncOverflow}
          render={renderCaretKeyToolbar}
        >
          {shown && renderItem
            ? shown.map((item) => (
                <div key={toKeyIdentity(item.id)} {...hooks.slot('item')}>
                  {renderItem(item)}
                </div>
              ))
            : children}
          {hidden.length > 0 ? <OverflowMenu hidden={hidden} /> : null}
        </Toolbar>
      </ScrollStrip>
    </div>
  );
}

export { ScrollStrip } from './scroll-strip.js';
export { useToolbarScroll } from './use-toolbar-scroll.js';
