import { useRef, type FocusEvent, type ReactNode } from 'react';
import { Toolbar, useLocale, type ToolbarProps as AriaToolbarProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useScrollStripOverflow } from '../../utils/use-scroll-strip-overflow.js';
import { IconButton } from '../icon-button/icon-button.js';

export interface ToolbarScrollerProps
  extends Pick<AriaToolbarProps, 'aria-label' | 'aria-labelledby'>, BaseProps {
  /** The tools. They stay direct children of the scrolling strip, at their natural size and order. */
  children?: ReactNode;
  /** Show a scroll button at each edge that hides tools. Defaults to `true`; edge fades always render. */
  scrollButtons?: boolean | undefined;
}

type Edge = 'start' | 'end';

interface ScrollButtonProps {
  edge: Edge;
  isHidden: boolean;
  onPress: (edge: Edge) => void;
}

/** Fraction of the visible width a scroll button moves the strip. */
const pageFraction = 0.8;

const hooks = createHooks('toolbar-scroller', ['strip', 'fade', 'scroll-button']);

/**
 * Scrolls to a physical `scrollLeft`. `auto` follows the stylesheet's `scroll-behavior`; `instant`
 * skips any smooth scrolling, for focus that must land at once.
 */
function scrollStripTo(strip: HTMLElement, left: number, behavior: ScrollBehavior) {
  if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior });
  else strip.scrollLeft = left;
}

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

/** Scrolls the strip by most of its visible width toward `edge`. Right-to-left offsets are negative. */
function scrollPage(strip: HTMLElement, { edge, rtl }: { edge: Edge; rtl: boolean }) {
  const step = Math.max(1, strip.clientWidth * pageFraction);
  const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
  const next = clamp(Math.abs(strip.scrollLeft) + (edge === 'end' ? step : -step), 0, range);
  scrollStripTo(strip, rtl ? -next : next, 'auto');
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
  ...rest
}: ToolbarScrollerProps) {
  const rtl = useLocale().direction === 'rtl';
  const stripRef = useRef<HTMLDivElement | null>(null);
  const { overflow, syncOverflow } = useScrollStripOverflow(stripRef);

  const pageToward = (edge: Edge) => {
    if (!stripRef.current) return;
    scrollPage(stripRef.current, { edge, rtl });
    syncOverflow();
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    if (strip && event.target !== strip && strip.contains(event.target)) {
      revealTool(strip, event.target);
    }
  };

  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { overflowStart: overflow.start, overflowEnd: overflow.end },
      })}
      onFocus={onFocus}
    >
      {scrollButtons ? (
        <ScrollButton edge="start" isHidden={!overflow.start} onPress={pageToward} />
      ) : null}
      <Toolbar
        ref={stripRef}
        className={hooks.slotClass('strip')}
        orientation="horizontal"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onScroll={syncOverflow}
      >
        {children}
      </Toolbar>
      <span
        {...hooks.slot('fade', { edge: 'start' })}
        aria-hidden="true"
        hidden={!overflow.start}
      />
      <span {...hooks.slot('fade', { edge: 'end' })} aria-hidden="true" hidden={!overflow.end} />
      {scrollButtons ? (
        <ScrollButton edge="end" isHidden={!overflow.end} onPress={pageToward} />
      ) : null}
    </div>
  );
}
