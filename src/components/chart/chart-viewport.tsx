'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isContextMenuKey } from '../../utils/is-context-menu-key.js';
import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { Button } from '../button/button.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import { chartHooks as hooks } from './chart-hooks.js';
import { countTicks } from './chart-layout.js';
import {
  type ChartViewportProps,
  createNumericAxis,
  isAxisRange,
  moveChartRange,
} from './numeric-axis.js';

export function useChartViewport(
  options: ChartViewportProps,
  extent: ScaleInterval,
  pixels: ScaleInterval,
) {
  const {
    xScale = 'linear',
    defaultVisibleRange,
    visibleRange,
    onVisibleRangeChange,
    formatX,
  } = options;
  const [own, setRange] = useControllableState<ScaleInterval | undefined>(
    visibleRange,
    defaultVisibleRange,
  );
  const low = Math.max(own?.[0] ?? -Infinity, extent[0]);
  const high = Math.min(own?.[1] ?? Infinity, extent[1]);
  const domain = useMemo(
    () => (isAxisRange([low, high], xScale) ? ([low, high] as const) : extent),
    [low, high, xScale, extent],
  );
  const { locale } = useLocale();
  const [left, right] = pixels;
  const axis = useMemo(
    () =>
      createNumericAxis({
        kind: xScale,
        domain,
        range: [left, right],
        format: formatX,
        locale,
        tickCount: countTicks(right - left, 100),
      }),
    [xScale, domain, left, right, formatX, locale],
  );
  const change = (requested: ScaleInterval) => {
    const range: ScaleInterval = [
      Math.max(extent[0], requested[0]),
      Math.min(extent[1], requested[1]),
    ];
    if (!isAxisRange(range, xScale) || (range[0] === domain[0] && range[1] === domain[1])) return;
    setRange(range[0] === extent[0] && range[1] === extent[1] ? undefined : range);
    onVisibleRangeChange?.(range);
  };
  const zoom = (factor: number, anchor = 0.5) =>
    change(moveChartRange(axis, extent, { factor, anchor, shift: 0 }));
  const pan = (shift: number, from = axis) =>
    change(moveChartRange(from, extent, { factor: 1, anchor: 0, shift }));
  return { axis, writeX: formatX ?? String, zoom, pan, change, reset: () => change(extent) };
}

export type NumericViewport = ReturnType<typeof useChartViewport>;

function useNavigationActions(view: NumericViewport) {
  const strings = useUiStrings();
  return [
    { id: 'left', label: strings.chartPanLeft, onAction: () => view.pan(-0.2) },
    { id: 'right', label: strings.chartPanRight, onAction: () => view.pan(0.2) },
    { id: 'in', label: strings.zoomIn, onAction: () => view.zoom(0.5) },
    { id: 'out', label: strings.zoomOut, onAction: () => view.zoom(2) },
    { id: 'reset', label: strings.resetZoom, onAction: view.reset },
  ];
}

export function ChartNavigation({ view }: { view: NumericViewport }) {
  const actions = useNavigationActions(view);
  return (
    <div {...hooks.slot('navigation')}>
      {actions.map((item) => (
        <Button size="sm" key={item.id} onPress={item.onAction}>
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function toFraction(element: HTMLElement, clientX: number, view: NumericViewport) {
  const rect = element.getBoundingClientRect();
  const [left, right] = view.axis.range;
  return (clientX - rect.left - left) / Math.max(1, right - left);
}

interface PlotGesture {
  move: (x: number) => void;
}

interface ViewportSurfaceProps {
  view: NumericViewport;
  label: string;
  children: ReactNode;
  /** Additional placement actions at the context pointer or the keyboard's focused coordinate. */
  getItems?: ((x: number) => MenuEntry[]) | undefined;
  /** Starts a marker drag from the element under the pointer. Other drags pan the plot. */
  startMark?: ((target: EventTarget) => PlotGesture | undefined) | undefined;
}

function usePlotWheel(view: NumericViewport) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useLatest(view);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const anchor = clamp(toFraction(element, event.clientX, latest.current), 0, 1);
      latest.current.zoom(event.deltaY < 0 ? 0.8 : 1.25, anchor);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [latest]);
  return root;
}

function navigateByKey(event: KeyboardEvent, view: NumericViewport) {
  if (
    event.target !== event.currentTarget ||
    isComposingKey(event.nativeEvent) ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  switch (event.key) {
    case 'ArrowLeft':
      view.pan(-0.2);
      break;
    case 'ArrowRight':
      view.pan(0.2);
      break;
    case '+':
    case '=':
      view.zoom(0.5);
      break;
    case '-':
      view.zoom(2);
      break;
    case 'Home':
      view.reset();
      break;
    default:
      return;
  }
  event.preventDefault();
}

interface ChartDrag {
  start: number;
  axis: LinearScale;
  markTarget: EventTarget | undefined;
  select: boolean;
}

function readPointerX(element: HTMLElement, clientX: number, view: NumericViewport) {
  const axis = view.axis;
  return axis.invert(
    axis.range[0] +
      clamp(toFraction(element, clientX, view), 0, 1) * (axis.range[1] - axis.range[0]),
  );
}

function useViewportDrag(view: NumericViewport, startMark: ViewportSurfaceProps['startMark']) {
  const [selection, setSelection] = useState<ScaleInterval | null>(null);
  const axis = view.axis;
  const drag = usePointerDrag<HTMLDivElement, ChartDrag>({
    onStart: (event) => {
      const mark = startMark?.(event.target);
      const select = event.shiftKey && !mark;
      if (select) event.preventDefault();
      return { start: event.clientX, axis, markTarget: mark ? event.target : undefined, select };
    },
    onMove: (event, state) => {
      // A controlled host can replace the marker list or the other cursor during a drag.
      if (state.markTarget)
        startMark?.(state.markTarget)?.move(readPointerX(event.currentTarget, event.clientX, view));
      else if (state.select) {
        const start = readPointerX(event.currentTarget, state.start, view);
        const end = readPointerX(event.currentTarget, event.clientX, view);
        setSelection([Math.min(start, end), Math.max(start, end)]);
      } else
        view.pan(
          (state.start - event.clientX) / Math.max(1, axis.range[1] - axis.range[0]),
          state.axis,
        );
    },
    onEnd: (event, state, cancelled) => {
      if (!state.select) return;
      setSelection(null);
      if (cancelled || Math.abs(event.clientX - state.start) < 4) return;
      const start = readPointerX(event.currentTarget, state.start, view);
      const end = readPointerX(event.currentTarget, event.clientX, view);
      view.change([Math.min(start, end), Math.max(start, end)]);
    },
    onCancel: () => setSelection(null),
  });
  return { selection, drag };
}

export function ViewportSurface({
  view,
  label,
  children,
  getItems,
  startMark,
}: ViewportSurfaceProps) {
  const root = usePlotWheel(view);
  const [location, setLocation] = useState<number | null>(null);
  const navigation = useNavigationActions(view);
  const { axis } = view;
  const middle = axis.invert((axis.range[0] + axis.range[1]) / 2);
  const { selection, drag } = useViewportDrag(view, startMark);
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isContextMenuKey(event)) {
      const target = event.target as Element;
      const value = target.closest('[data-coordinate]')?.getAttribute('data-coordinate');
      setLocation(value ? Number(value) : middle);
    }
    navigateByKey(event, view);
  };
  return (
    <ContextMenuTrigger>
      <div
        {...hooks.slot('viewport', { 'range-start': axis.domain[0], 'range-end': axis.domain[1] })}
        {...drag}
        ref={root}
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={keyDown}
        onDoubleClick={(event) => {
          if (!event.shiftKey) view.reset();
        }}
        onPointerDownCapture={(event) => {
          if (event.pointerType === 'touch')
            setLocation(readPointerX(event.currentTarget, event.clientX, view));
        }}
        onContextMenu={(event) =>
          setLocation(readPointerX(event.currentTarget, event.clientX, view))
        }
      >
        {children}
        {selection ? (
          <div
            {...hooks.slot('selection')}
            aria-hidden="true"
            style={{
              left: axis.map(selection[0]),
              width: axis.map(selection[1]) - axis.map(selection[0]),
            }}
          />
        ) : null}
      </div>
      <Menu aria-label={label} items={[...(getItems?.(location ?? middle) ?? []), ...navigation]} />
    </ContextMenuTrigger>
  );
}
