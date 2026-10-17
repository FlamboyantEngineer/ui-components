import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Toolbar, useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';

export interface ToolbarScrollerProps {
  /** The tools. They stay direct children of the scrolling strip, at their natural size and order. */
  children?: ReactNode;
  /** Show a scroll button at each edge that hides tools. Defaults to `true`; edge fades always render. */
  scrollButtons?: boolean | undefined;
  /** Names the toolbar. */
  'aria-label'?: string | undefined;
  /** Names the toolbar by another element. */
  'aria-labelledby'?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

/** Which edges of a horizontal strip have content hidden past them. */
interface EdgeOverflow {
  start: boolean;
  end: boolean;
}

/** Fraction of the visible width a scroll button moves the strip. */
const PAGE_FRACTION = 0.8;
/** Pixels per line for wheel input reported in lines. */
const LINE_HEIGHT = 16;
/** Popups open inside the strip keep their own wheel input. */
const POPUP_SELECTOR =
  '[role="menu"], [role="listbox"], [role="dialog"], [role="tree"], [role="grid"]';

const hooks = createHooks('toolbar-scroller', ['strip', 'fade', 'scroll-button']);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Distance scrolled from the start edge, whatever the writing direction. */
function scrollOffset(strip: HTMLElement): number {
  return Math.abs(strip.scrollLeft);
}

function maxScrollOffset(strip: HTMLElement): number {
  return Math.max(0, strip.scrollWidth - strip.clientWidth);
}

/**
 * Scrolls to a physical `scrollLeft`. `auto` follows the stylesheet's `scroll-behavior`; `instant`
 * skips any smooth scrolling, for wheel input and focus that must land at once.
 */
function scrollStripTo(strip: HTMLElement, left: number, behavior: ScrollBehavior) {
  if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior });
  else strip.scrollLeft = left;
}

/**
 * Tracks whether content is hidden past each edge of a horizontal strip. It remeasures when the strip
 * scrolls (call `measure` from its scroll handler), when the strip or a direct child resizes, and when a
 * direct child mounts or unmounts.
 */
function useEdgeOverflow(stripRef: RefObject<HTMLElement | null>) {
  const [overflow, setOverflow] = useState<EdgeOverflow>({ start: false, end: false });

  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const offset = scrollOffset(strip);
    const start = offset > 1;
    const end = offset + strip.clientWidth < strip.scrollWidth - 1;
    setOverflow((current) =>
      current.start === start && current.end === end ? current : { start, end },
    );
  }, [stripRef]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return undefined;
    measure();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    const observe = () => {
      if (!resize) return;
      resize.disconnect();
      resize.observe(strip);
      for (const child of Array.from(strip.children)) resize.observe(child);
    };
    observe();
    const mutations =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            observe();
            measure();
          });
    mutations?.observe(strip, { childList: true });
    return () => {
      resize?.disconnect();
      mutations?.disconnect();
    };
  }, [measure, stripRef]);

  return { overflow, measure };
}

/** How far visible overlays (scroll buttons, fades) cover each side of the strip, in pixels. */
function coveredInsets(strip: HTMLElement, overlays: Array<HTMLElement | null>) {
  const box = strip.getBoundingClientRect();
  let left = 0;
  let right = 0;
  for (const overlay of overlays) {
    if (!overlay || overlay.hidden) continue;
    const rect = overlay.getBoundingClientRect();
    const overlap = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
    if (rect.width === 0 || overlap <= 0) continue;
    if (rect.left + rect.right < box.left + box.right) left = Math.max(left, rect.right - box.left);
    else right = Math.max(right, box.right - rect.left);
  }
  return { left, right };
}

/**
 * One horizontal row of tools that scrolls instead of squeezing them. A React Aria toolbar gives the
 * tools arrow-key focus; scroll buttons and decorative fades appear only at an edge that hides tools.
 */
export function ToolbarScroller({
  children,
  scrollButtons = true,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  id,
  ...rest
}: ToolbarScrollerProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const rtl = direction === 'rtl';
  const stripRef = useRef<HTMLDivElement | null>(null);
  const startFade = useRef<HTMLSpanElement | null>(null);
  const endFade = useRef<HTMLSpanElement | null>(null);
  const startButton = useRef<HTMLButtonElement | null>(null);
  const endButton = useRef<HTMLButtonElement | null>(null);
  const { overflow, measure } = useEdgeOverflow(stripRef);

  // A vertical wheel scrolls the strip along its row; horizontal input scrolls it natively.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return undefined;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const target = event.target as Element | null;
      const popup = target?.closest?.(POPUP_SELECTOR);
      if (popup && strip.contains(popup)) return;
      const max = maxScrollOffset(strip);
      if (max === 0) return;
      const delta =
        event.deltaMode === 1
          ? event.deltaY * LINE_HEIGHT
          : event.deltaMode === 2
            ? event.deltaY * strip.clientWidth
            : event.deltaY;
      const offset = scrollOffset(strip);
      const next = clamp(offset + delta, 0, max);
      if (next === offset) return;
      event.preventDefault();
      scrollStripTo(strip, rtl ? -next : next, 'instant');
      measure();
    };
    // Keep a focused tool clear of the scroll buttons and fades that cover the strip's edges.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target === strip || !(target instanceof HTMLElement)) return;
      const box = strip.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const insets = coveredInsets(strip, [
        startFade.current,
        endFade.current,
        startButton.current,
        endButton.current,
      ]);
      const visibleLeft = box.left + insets.left;
      const visibleRight = box.right - insets.right;
      let delta = 0;
      if (item.left < visibleLeft) delta = item.left - visibleLeft;
      else if (item.right > visibleRight) delta = item.right - visibleRight;
      if (delta !== 0) scrollStripTo(strip, strip.scrollLeft + delta, 'instant');
    };
    strip.addEventListener('wheel', onWheel, { passive: false });
    strip.addEventListener('focusin', onFocusIn);
    return () => {
      strip.removeEventListener('wheel', onWheel);
      strip.removeEventListener('focusin', onFocusIn);
    };
  }, [measure, rtl]);

  const scrollPage = useCallback(
    (towardEnd: boolean) => {
      const strip = stripRef.current;
      if (!strip) return;
      const step = Math.max(1, strip.clientWidth * PAGE_FRACTION);
      const next = clamp(
        scrollOffset(strip) + (towardEnd ? step : -step),
        0,
        maxScrollOffset(strip),
      );
      scrollStripTo(strip, rtl ? -next : next, 'auto');
      measure();
    },
    [measure, rtl],
  );

  return (
    <div
      {...hooks.root({
        className,
        props: rest,
        data: { overflowStart: overflow.start, overflowEnd: overflow.end },
      })}
      id={id}
    >
      {scrollButtons ? (
        <IconButton
          ref={startButton}
          {...hooks.slot('scroll-button', { edge: 'start' })}
          icon={rtl ? 'chevron-right' : 'chevron-left'}
          label={strings.scrollBackward}
          size="sm"
          excludeFromTabOrder
          hidden={!overflow.start}
          onPress={() => scrollPage(false)}
        />
      ) : null}
      <Toolbar
        ref={stripRef}
        className={hooks.slotClass('strip')}
        orientation="horizontal"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onScroll={measure}
      >
        {children}
      </Toolbar>
      <span
        ref={startFade}
        {...hooks.slot('fade', { edge: 'start' })}
        aria-hidden="true"
        hidden={!overflow.start}
      />
      <span
        ref={endFade}
        {...hooks.slot('fade', { edge: 'end' })}
        aria-hidden="true"
        hidden={!overflow.end}
      />
      {scrollButtons ? (
        <IconButton
          ref={endButton}
          {...hooks.slot('scroll-button', { edge: 'end' })}
          icon={rtl ? 'chevron-left' : 'chevron-right'}
          label={strings.scrollForward}
          size="sm"
          excludeFromTabOrder
          hidden={!overflow.end}
          onPress={() => scrollPage(true)}
        />
      ) : null}
    </div>
  );
}
