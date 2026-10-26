import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { TooltipTriggerStateContext, type TooltipTriggerState } from '../../primitives/index.js';
import type { Tone } from '../../core/props.js';
import { TooltipPanel } from '../tooltip/tooltip.js';
import { chartHooks as hooks } from './chart-hooks.js';

/** A drawn value a reader can focus: its series' position and its position along the series. */
export interface ChartPoint {
  key: string;
  series: number;
  index: number;
}

/** The props a drawn value's element takes to join the chart's focus order and tooltip. */
export interface ChartPointProps {
  ref: (element: SVGElement | null) => void;
  tabIndex: number;
  onFocus: (event: FocusEvent<SVGElement>) => void;
  onBlur: () => void;
  onPointerEnter: (event: PointerEvent<SVGElement>) => void;
  onPointerLeave: () => void;
  onKeyDown: (event: KeyboardEvent<SVGElement>) => void;
}

export interface ChartPoints {
  /** The value whose tooltip shows, while one is hovered or focused. */
  activeKey: string | null;
  /** The element the tooltip points at. */
  anchor: RefObject<SVGElement | null>;
  getPointProps: (point: ChartPoint) => ChartPointProps;
}

/** The keys that move along a series and across series. */
interface PointKeys {
  previous: string;
  next: string;
  previousSeries: string;
  nextSeries: string;
}

const horizontalKeys: PointKeys = {
  previous: 'ArrowLeft',
  next: 'ArrowRight',
  previousSeries: 'ArrowUp',
  nextSeries: 'ArrowDown',
};

const verticalKeys: PointKeys = {
  previous: 'ArrowUp',
  next: 'ArrowDown',
  previousSeries: 'ArrowLeft',
  nextSeries: 'ArrowRight',
};

/** The nearest point in the nearest drawn series in `step`'s direction. */
function findAcross(points: readonly ChartPoint[], from: ChartPoint, step: 1 | -1) {
  let target: ChartPoint | undefined;
  let seriesDistance = Infinity;
  let pointDistance = Infinity;
  for (const point of points) {
    const distance = (point.series - from.series) * step;
    if (distance <= 0 || distance > seriesDistance) continue;
    const proximity = Math.abs(point.index - from.index);
    if (distance < seriesDistance || proximity < pointDistance) {
      target = point;
      seriesDistance = distance;
      pointDistance = proximity;
    }
  }
  return target;
}

function findAlong(
  points: readonly ChartPoint[],
  from: ChartPoint,
  { key, keys }: { key: string; keys: PointKeys },
): ChartPoint | undefined {
  let target: ChartPoint | undefined;
  const isFirst = key === keys.next || key === 'Home';
  for (const point of points) {
    if (point.series !== from.series) continue;
    if (key === keys.previous && point.index >= from.index) continue;
    if (key === keys.next && point.index <= from.index) continue;
    if (!target || (isFirst ? point.index < target.index : point.index > target.index)) {
      target = point;
    }
  }
  return target;
}

/**
 * The point a key moves focus to from `from`, or `undefined` for a key that does not move it. Each
 * key scans the points once, without sorting them; keys outside navigation read none.
 */
function findNextPoint(
  points: readonly ChartPoint[],
  from: ChartPoint,
  { key, keys }: { key: string; keys: PointKeys },
): ChartPoint | undefined {
  switch (key) {
    case keys.previous:
    case keys.next:
    case 'Home':
    case 'End':
      return findAlong(points, from, { key, keys });
    case keys.previousSeries:
      return findAcross(points, from, -1);
    case keys.nextSeries:
      return findAcross(points, from, 1);
    default:
      return undefined;
  }
}

/**
 * Closes an open tooltip on Escape wherever focus is, as React Aria's tooltips do, so a tooltip
 * opened by hover can be dismissed without moving the pointer. The press goes no further.
 */
function useEscapeToClose(isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, close]);
}

/**
 * One tab stop for a chart's drawn values: the arrow keys move along a series (across the
 * categories) and between series, Home and End jump to a series' ends, and the value hovered or
 * focused shows the tooltip until the pointer leaves, focus moves on or Escape is pressed.
 * `isVertical` runs the categories down, as the bars of a horizontal bar chart do.
 */
export function useChartPoints(points: readonly ChartPoint[], isVertical = false): ChartPoints {
  const elements = useRef(new Map<string, SVGElement>());
  const anchor = useRef<SVGElement | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const close = useCallback(() => setActiveKey(null), []);
  useEscapeToClose(activeKey !== null, close);
  const tabKey = points.some((point) => point.key === focusKey) ? focusKey : points[0]?.key;
  const keys = isVertical ? verticalKeys : horizontalKeys;
  const activate = (key: string, element: SVGElement) => {
    anchor.current = element;
    setActiveKey(key);
  };
  return {
    activeKey,
    anchor,
    getPointProps: (point) => ({
      ref: (element) => {
        if (element) elements.current.set(point.key, element);
        else elements.current.delete(point.key);
      },
      tabIndex: point.key === tabKey ? 0 : -1,
      onFocus: (event) => {
        setFocusKey(point.key);
        activate(point.key, event.currentTarget);
      },
      onBlur: () => setActiveKey(null),
      onPointerEnter: (event) => activate(point.key, event.currentTarget),
      onPointerLeave: () => setActiveKey(null),
      onKeyDown: (event) => {
        const next = findNextPoint(points, point, { key: event.key, keys });
        if (!next) return;
        event.preventDefault();
        elements.current.get(next.key)?.focus();
      },
    }),
  };
}

export interface ChartTooltipProps {
  /** The value whose tooltip shows; `null` hides it. */
  activeKey: string | null;
  anchor: RefObject<SVGElement | null>;
  /** Where the value sits on the other axis: its category or date. */
  title?: string | undefined;
  /** The series' name, beside a swatch in its colour slot. */
  label: string;
  series: number;
  tone: Tone | undefined;
  /** The formatted value. */
  value: ReactNode;
}

/** The tooltip of the hovered or focused value, pointing at its element. */
export function ChartTooltip({
  activeKey,
  anchor,
  title,
  label,
  series,
  tone,
  value,
}: ChartTooltipProps) {
  const isOpen = activeKey !== null;
  const state = useMemo<TooltipTriggerState>(
    () => ({ isOpen, shouldSkipAnimation: false, open: () => {}, close: () => {} }),
    [isOpen],
  );
  return (
    <TooltipTriggerStateContext.Provider value={state}>
      {isOpen ? (
        <TooltipPanel
          key={activeKey}
          variant="default"
          className={hooks.slotClass('tooltip')}
          triggerRef={anchor}
        >
          {title ? (
            <>
              <span {...hooks.slot('tooltip-title')}>{title}</span>{' '}
            </>
          ) : null}
          <span {...hooks.slot('tooltip-swatch', { series, tone })} aria-hidden="true" />
          <span {...hooks.slot('tooltip-label')}>{label}</span>{' '}
          <span {...hooks.slot('tooltip-value')}>{value}</span>
        </TooltipPanel>
      ) : null}
    </TooltipTriggerStateContext.Provider>
  );
}
