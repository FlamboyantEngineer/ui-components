import { Fragment, useRef, type FocusEvent, type ReactNode } from 'react';
import { Toolbar, useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import {
  scrollStripPage,
  scrollStripTo,
  useScrollStripOverflow,
} from '../../utils/use-scroll-strip-overflow.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { IconSource } from '../icon/icon.js';
import { IconButton } from '../icon-button/icon-button.js';

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
  extends Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>, BaseProps {
  /** The tools. They stay direct children of the scrolling strip, at their natural size and order. */
  children?: ReactNode;
  /** Show a scroll button at each edge that hides tools. Defaults to `true`; edge fades always render. */
  scrollButtons?: boolean | undefined;
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

type Edge = 'start' | 'end';

interface ScrollButtonProps {
  edge: Edge;
  isHidden: boolean;
  onPress: (edge: Edge) => void;
}

const hooks = createHooks('toolbar-scroller', [
  'strip',
  'item',
  'overflow',
  'fade',
  'scroll-button',
]);

/** How far the visible overlays (scroll buttons, fades) cover each side of the strip, in pixels. */
function measureCoveredInsets(strip: HTMLElement, overlays: readonly Element[]) {
  const box = strip.getBoundingClientRect();
  let left = 0;
  let right = 0;
  for (const overlay of overlays) {
    if (!(overlay instanceof HTMLElement) || overlay.hidden) continue;
    const rect = overlay.getBoundingClientRect();
    const overlap = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
    if (rect.width === 0 || overlap <= 0) continue;
    if (rect.left + rect.right < box.left + box.right) left = Math.max(left, rect.right - box.left);
    else right = Math.max(right, box.right - rect.left);
  }
  return { left, right };
}

/** Scrolls the strip so a focused tool lies clear of the overlays beside the strip that cover it. */
function revealTool(strip: HTMLElement, tool: Element) {
  const overlays = Array.from(strip.parentElement?.children ?? []).filter((node) => node !== strip);
  const insets = measureCoveredInsets(strip, overlays);
  const box = strip.getBoundingClientRect();
  const item = tool.getBoundingClientRect();
  const visibleLeft = box.left + insets.left;
  const visibleRight = box.right - insets.right;
  let delta = 0;
  if (item.left < visibleLeft) delta = item.left - visibleLeft;
  else if (item.right > visibleRight) delta = item.right - visibleRight;
  if (delta !== 0) scrollStripTo(strip, strip.scrollLeft + delta, 'instant');
}

function ScrollButton({ edge, isHidden, onPress }: ScrollButtonProps) {
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

interface MenuStripProps<T extends ToolbarScrollerItem> {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  stripProps: Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>;
}

/** The strip of a scroller that collapses tools into a menu: the tools that fit, then the menu. */
function MenuStrip<T extends ToolbarScrollerItem>({
  items,
  renderItem,
  stripProps,
}: MenuStripProps<T>) {
  const strings = useUiStrings();
  const { containerRef, visibleItems, hiddenItems } = useOverflowItems({
    items,
    getPriority: (item) => item.priority ?? 0,
  });
  return (
    <Toolbar
      {...stripProps}
      ref={containerRef}
      className={hooks.slotClass('strip')}
      orientation="horizontal"
    >
      {visibleItems.map((item) => (
        <div key={item.id} {...hooks.slot('item')}>
          {renderItem(item)}
        </div>
      ))}
      {hiddenItems.length > 0 ? (
        <div {...hooks.slot('overflow')}>
          <DropdownMenu
            iconOnly
            size="sm"
            placement="bottom end"
            label={strings.moreItems(hiddenItems.length)}
            items={hiddenItems.map(({ id, label, icon, isDisabled }) => ({
              id,
              label,
              icon,
              isDisabled,
            }))}
            onAction={(key) => hiddenItems.find((item) => item.id === key)?.onAction?.()}
          />
        </div>
      ) : null}
    </Toolbar>
  );
}

/**
 * One horizontal row of tools that scrolls instead of squeezing them. A toolbar gives the tools
 * arrow-key focus; scroll buttons and decorative fades appear only at an edge that hides tools.
 */
export function ToolbarScroller<T extends ToolbarScrollerItem = ToolbarScrollerItem>({
  children,
  scrollButtons = true,
  items,
  renderItem,
  overflow = 'scroll',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...rest
}: ToolbarScrollerProps<T>) {
  const rtl = useLocale().direction === 'rtl';
  const stripRef = useRef<HTMLDivElement | null>(null);
  const { overflow: edges, syncOverflow } = useScrollStripOverflow(stripRef);

  const pageToward = (edge: Edge) => {
    if (!stripRef.current) return;
    scrollStripPage(stripRef.current, { edge, rtl });
    syncOverflow();
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    if (strip && event.target !== strip && strip.contains(event.target)) {
      revealTool(strip, event.target);
    }
  };

  const stripProps = { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy };
  if (overflow === 'menu' && items && renderItem) {
    return (
      <div {...rest} {...hooks.root({ className, props: rest, data: { overflow } })}>
        <MenuStrip items={items} renderItem={renderItem} stripProps={stripProps} />
      </div>
    );
  }
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { overflow: 'scroll', overflowStart: edges.start, overflowEnd: edges.end },
      })}
      onFocus={onFocus}
    >
      {scrollButtons ? (
        <ScrollButton edge="start" isHidden={!edges.start} onPress={pageToward} />
      ) : null}
      <Toolbar
        ref={stripRef}
        className={hooks.slotClass('strip')}
        orientation="horizontal"
        {...stripProps}
        onScroll={syncOverflow}
      >
        {items && renderItem
          ? items.map((item) => <Fragment key={item.id}>{renderItem(item)}</Fragment>)
          : children}
      </Toolbar>
      <span {...hooks.slot('fade', { edge: 'start' })} aria-hidden="true" hidden={!edges.start} />
      <span {...hooks.slot('fade', { edge: 'end' })} aria-hidden="true" hidden={!edges.end} />
      {scrollButtons ? (
        <ScrollButton edge="end" isHidden={!edges.end} onPress={pageToward} />
      ) : null}
    </div>
  );
}
