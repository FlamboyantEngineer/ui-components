'use client';

import {
  createContext,
  type FocusEvent,
  type ReactNode,
  type Ref,
  useContext,
  useMemo,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, Orientation, RefProps } from '../../core/props.js';
import { Group, Toolbar } from '../../primitives/index.js';
import { renderCaretKeyToolbar } from '../../utils/toolbar-caret-keys.js';
import {
  type LayoutContainmentProps,
  type LayoutJustify,
  type LayoutSpace,
  type LayoutWrap,
  resolveContainment,
} from '../layout/layout.js';
import { Separator } from '../separator/separator.js';
import { ScrollStrip } from './scroll-strip.js';
import { type ToolbarRowItem, useToolbarRowItems } from './toolbar-row-menu.js';
import { useToolbarScroll } from './use-toolbar-scroll.js';

export type { ToolbarRowItem } from './toolbar-row-menu.js';

export type ToolbarRowRole = 'toolbar' | 'group' | 'none';
export type ToolbarRowVariant = 'plain' | 'surface';

/**
 * `wrap` flows the controls, and the groups holding them, onto more rows; `scroll` keeps them on
 * one scrolling row; `menu` keeps the tools given as `items` that fit and lists the others in a
 * "more" menu; `none` keeps one row and leaves overflow to the caller.
 */
export type ToolbarRowOverflow = 'wrap' | 'scroll' | 'menu' | 'none';

export interface ToolbarRowProps<T extends ToolbarRowItem = ToolbarRowItem>
  extends Omit<ContainerProps<'div'>, 'role'>, BaseProps, LayoutContainmentProps {
  /** `toolbar` (default) moves focus by arrow keys, `group` keeps tab stops, `none` has no role. */
  role?: ToolbarRowRole | undefined;
  /** The strip that holds the controls as its element children; `ref` is the row's root. */
  stripRef?: Ref<HTMLDivElement> | undefined;
  /** `surface` asks the stylesheet for a surface behind the row. Defaults to `plain`. */
  variant?: ToolbarRowVariant | undefined;
  /** `vertical` stacks the controls, and a toolbar moves focus with Up and Down. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Gap between controls. Defaults to `md`. */
  space?: LayoutSpace | undefined;
  /** Distribution of controls. Defaults to `end`. */
  justify?: LayoutJustify | undefined;
  /**
   * What happens to controls that do not fit on one horizontal row. Defaults to `wrap`. `menu`
   * needs `items` and `renderItem`; without them the row scrolls.
   */
  overflow?: ToolbarRowOverflow | undefined;
  /** The tools as data, each drawn by `renderItem`, in place of `children`. */
  items?: readonly T[] | undefined;
  /** Draws one tool of `items`. */
  renderItem?: ((item: T) => ReactNode) | undefined;
  /** With `overflow="scroll"`, draws a decorative fade over each edge that hides controls. Defaults to `true`; `false` draws none. */
  showEdgeFades?: boolean | undefined;
  /** With scrolling overflow, draw paging buttons at overflowing edges. Defaults to true. */
  showScrollButtons?: boolean | undefined;
  /** The row keeps its place but its controls are inert, as while the surface they serve starts. */
  isPending?: boolean | undefined;
}

export interface ToolbarRowGroupProps
  extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** The group's controls. Name the group with `aria-label` or `aria-labelledby`. */
  children?: ReactNode;
  /** Joins the controls into one segmented run, with no gap and shared borders. */
  attached?: boolean | undefined;
}

export type ToolbarRowSeparatorProps = RefProps<HTMLElement> & BaseProps;

const hooks = createHooks('toolbar-row', [
  'strip',
  'item',
  'overflow',
  'group',
  'separator',
  'fade',
  'scroll-button',
]);

interface ToolbarRowFlow {
  orientation: Orientation;
  wrap: LayoutWrap;
}

/** The direction and wrapping of the enclosing row, which its groups follow and its separators cross. */
const ToolbarRowContext = createContext<ToolbarRowFlow>({
  orientation: 'horizontal',
  wrap: 'wrap',
});

/**
 * The overflow a row applies: a vertical row is one column that never scrolls or collapses
 * sideways, and a row without tools as data has nothing to collapse, so it scrolls.
 */
function resolveOverflow(
  overflow: ToolbarRowOverflow,
  orientation: Orientation,
  hasItems: boolean,
): ToolbarRowOverflow {
  const applied = overflow === 'menu' && !hasItems ? 'scroll' : overflow;
  const isSideways = applied === 'scroll' || applied === 'menu';
  return orientation === 'vertical' && isSideways ? 'none' : applied;
}

interface ToolbarRowStripProps extends AriaLabellingProps {
  role: ToolbarRowRole;
  orientation: Orientation;
  stripRef: Ref<HTMLDivElement>;
  onScroll?: (() => void) | undefined;
  children: ReactNode;
}

/** The element holding the controls in every overflow mode: the toolbar, a group, or neither. */
function ToolbarRowStrip({ role, orientation, stripRef, children, ...rest }: ToolbarRowStripProps) {
  if (role === 'toolbar') {
    return (
      <Toolbar
        {...rest}
        ref={stripRef}
        className={hooks.slotClass('strip')}
        orientation={orientation}
        render={renderCaretKeyToolbar}
      >
        {children}
      </Toolbar>
    );
  }
  return (
    <div
      {...rest}
      ref={stripRef}
      className={hooks.slotClass('strip')}
      role={role === 'group' ? 'group' : undefined}
    >
      {children}
    </div>
  );
}

/** The edge controls that apply only to horizontal scrolling, with independent defaults. */
function resolveScrollControls({
  isScroll,
  showScrollButtons = true,
  showEdgeFades = true,
}: {
  isScroll: boolean;
  showScrollButtons: boolean | undefined;
  showEdgeFades: boolean | undefined;
}) {
  return {
    hasButtons: isScroll && showScrollButtons,
    fadeHooks: isScroll && showEdgeFades ? hooks : undefined,
  };
}

/**
 * A row of controls, vertically centred, with a gap; or a column of them when vertical. The
 * controls always sit in the same strip, so changing the overflow or the orientation never
 * remounts them; `scroll` only adds edge controls beside the strip, and `menu` the "more" menu at
 * its end. `ref` reaches the row's root and `stripRef` the strip, whose element children are the
 * controls.
 */
export function ToolbarRow<T extends ToolbarRowItem = ToolbarRowItem>({
  children,
  className,
  role = 'toolbar',
  variant = 'plain',
  orientation = 'horizontal',
  space = 'md',
  justify = 'end',
  overflow: requestedOverflow = 'wrap',
  showEdgeFades,
  showScrollButtons,
  items,
  renderItem,
  isPending = false,
  grow,
  fill,
  clip,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  onFocus,
  stripRef: callerStripRef,
  ...rest
}: ToolbarRowProps<T>) {
  const hasItems = items !== undefined && renderItem !== undefined;
  const overflow = resolveOverflow(requestedOverflow, orientation, hasItems);
  const isScroll = overflow === 'scroll';
  const wrap = overflow === 'wrap' ? 'wrap' : 'nowrap';
  const scroll = useToolbarScroll(isScroll);
  const tools = useToolbarRowItems({
    isMenu: overflow === 'menu',
    items,
    renderItem,
    stripRefs: [scroll.stripRef, callerStripRef],
    hooks,
  });
  // The row renders again as it scrolls; its controls read this only when it changes.
  const context = useMemo<ToolbarRowFlow>(() => ({ orientation, wrap }), [orientation, wrap]);
  const edges = isScroll ? scroll.edges : { start: false, end: false };
  const data = { variant, orientation, space, justify, wrap, overflow, pending: isPending };
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        data: {
          ...data,
          overflowStart: edges.start,
          overflowEnd: edges.end,
          ...resolveContainment({ grow, fill, clip }),
        },
      })}
      inert={isPending || undefined}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        scroll.onFocus(event);
      }}
    >
      <ScrollStrip
        hooks={hooks}
        edges={edges}
        onPage={scroll.pageToward}
        {...resolveScrollControls({ isScroll, showScrollButtons, showEdgeFades })}
      >
        <ToolbarRowStrip
          role={role}
          orientation={orientation}
          stripRef={tools.stripRef}
          onScroll={isScroll ? scroll.syncOverflow : undefined}
          aria-label={label}
          aria-labelledby={labelledBy}
        >
          <ToolbarRowContext value={context}>{tools.content ?? children}</ToolbarRowContext>
        </ToolbarRowStrip>
      </ScrollStrip>
    </div>
  );
}

/**
 * A named group of related controls inside a `ToolbarRow` (`role="group"`), laid out along the
 * row. In a toolbar, arrow keys still move through every control of the row.
 */
export function ToolbarRowGroup({
  children,
  className,
  attached = false,
  ...rest
}: ToolbarRowGroupProps) {
  const { orientation, wrap } = useContext(ToolbarRowContext);
  return (
    <Group {...rest} {...hooks.slot('group', { orientation, wrap, attached }, className)}>
      {children}
    </Group>
  );
}

/** A divider between controls or groups of a `ToolbarRow`, across the row: a `Separator`. */
export function ToolbarRowSeparator({ className, ...rest }: ToolbarRowSeparatorProps) {
  const across = useContext(ToolbarRowContext).orientation;
  const orientation = across === 'horizontal' ? 'vertical' : 'horizontal';
  return (
    <Separator
      {...rest}
      className={mergeClassNames(hooks.slotClass('separator'), className)}
      orientation={orientation}
    />
  );
}

export { ScrollStrip } from './scroll-strip.js';
export { useToolbarScroll } from './use-toolbar-scroll.js';
