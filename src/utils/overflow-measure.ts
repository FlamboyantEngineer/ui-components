// DOM measurement for `useOverflowItems`: item sizes, the room a row offers and which rendered
// element is which (specs/OVERFLOW-LIST.md).

/** The end of a row that hidden items leave from: `end` keeps the first items, `start` the last. */
export type OverflowCollapseFrom = 'start' | 'end';

/** The elements one commit rendered: the items, the indicator and the parts that keep their size. */
export interface OverflowParts {
  items: Element[];
  indicator: Element | null;
  fixed: Element[];
}

/** The room the items share and the gaps that separate them. */
export interface OverflowRoom {
  /** The container's content box. */
  width: number;
  height: number;
  /** What the items and the indicator share, after the parts that keep their size. */
  available: number;
  /** The gap between neighbouring items. */
  gap: number;
  /** The gap before the indicator. */
  indicatorGap: number;
}

export interface RenderedLayout {
  /** Whether this commit rendered the indicator. */
  hasIndicator: boolean;
  /** The indicator element when the caller marked it, wherever it stands. */
  indicator: Element | null;
  collapseFrom: OverflowCollapseFrom;
}

function readPixels(value: string | undefined): number {
  const pixels = Number.parseFloat(value ?? '');
  return Number.isFinite(pixels) ? pixels : 0;
}

function getStyle(element: Element): CSSStyleDeclaration | undefined {
  return element.ownerDocument.defaultView?.getComputedStyle(element);
}

/** The inline space an element's box adds around its content: margins, borders and padding. */
function measureInlineChrome(element: Element): number {
  const style = getStyle(element);
  if (!style) return 0;
  return [
    style.marginLeft,
    style.marginRight,
    style.borderLeftWidth,
    style.borderRightWidth,
    style.paddingLeft,
    style.paddingRight,
  ].reduce((sum, value) => sum + readPixels(value), 0);
}

/** An element's border-box width plus its inline margins. */
export function measureOuterSize(element: Element): number {
  const style = getStyle(element);
  const margins = style ? readPixels(style.marginLeft) + readPixels(style.marginRight) : 0;
  return element.getBoundingClientRect().width + margins;
}

/** The container's content box. */
export function measureContentBox(container: HTMLElement) {
  const style = getStyle(container);
  const inline = style ? readPixels(style.paddingLeft) + readPixels(style.paddingRight) : 0;
  const block = style ? readPixels(style.paddingTop) + readPixels(style.paddingBottom) : 0;
  return {
    width: Math.max(0, container.clientWidth - inline),
    height: Math.max(0, container.clientHeight - block),
  };
}

/** The room of a flat row, or of a nested item container beside the indicator and fixed parts. */
export function measureRoom(
  container: HTMLElement,
  itemContainer: HTMLElement | null,
  fixed: readonly Element[],
): OverflowRoom {
  const { width, height } = measureContentBox(container);
  const outerGap = readPixels(getStyle(container)?.columnGap);
  if (!itemContainer) {
    return { width, height, available: width, gap: outerGap, indicatorGap: outerGap };
  }
  const fixedSize = fixed.reduce((sum, part) => sum + measureOuterSize(part) + outerGap, 0);
  return {
    width,
    height,
    available: Math.max(0, width - fixedSize - measureInlineChrome(itemContainer)),
    gap: readPixels(getStyle(itemContainer)?.columnGap),
    indicatorGap: outerGap,
  };
}

/** The marked indicator among `children`, or else the fallback while an indicator is rendered. */
function findIndicator(
  children: readonly Element[],
  layout: RenderedLayout,
  fallback: Element | undefined,
): Element | null {
  if (layout.indicator && children.includes(layout.indicator)) return layout.indicator;
  return layout.hasIndicator ? (fallback ?? null) : null;
}

/**
 * The items, indicator and fixed parts this commit rendered. A flat row's element children are the
 * items and the indicator (the marked element, or else the child at the collapsing end). With a
 * nested item container, its element children are the items, the indicator is the marked element
 * or else the item container's neighbour at the collapsing end, and the container's other element
 * children are fixed parts.
 */
export function readParts(
  container: HTMLElement,
  itemContainer: HTMLElement | null,
  layout: RenderedLayout,
): OverflowParts {
  const children = Array.from(container.children);
  const fromStart = layout.collapseFrom === 'start';
  if (itemContainer && itemContainer.parentElement === container) {
    const at = children.indexOf(itemContainer);
    const indicator = findIndicator(children, layout, children[fromStart ? at - 1 : at + 1]);
    return {
      items: Array.from(itemContainer.children),
      indicator,
      fixed: children.filter((child) => child !== itemContainer && child !== indicator),
    };
  }
  const indicator = findIndicator(children, layout, fromStart ? children[0] : children.at(-1));
  return { items: children.filter((child) => child !== indicator), indicator, fixed: [] };
}
