'use client';

import { type KeyboardEvent, type ReactNode, useMemo, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isContextMenuKey } from '../../utils/is-context-menu-key.js';
import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
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
import { plotFraction, usePlotPointer } from './use-plot-pointer.js';

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
  const canPan = domain[0] > extent[0] || domain[1] < extent[1];
  return {
    axis,
    canPan,
    writeX: formatX ?? String,
    zoom,
    pan,
    change,
    reset: () => change(extent),
  };
}

export type NumericViewport = ReturnType<typeof useChartViewport>;

interface PlotGesture {
  axis?: 'x' | 'y';
  scale?: LinearScale;
  id: string;
  move: (x: number) => void;
}

interface ViewportSurfaceProps {
  view: NumericViewport;
  label: string;
  children: ReactNode | ((draggedMark: string | undefined) => ReactNode);
  /** Additional placement actions at the context pointer or the keyboard's focused coordinate. */
  getItems?: ((x: number, target?: string) => MenuEntry[]) | undefined;
  /** Starts a marker drag from the element under the pointer. Other drags pan the plot. */
  startMark?: ((target: EventTarget) => PlotGesture | undefined) | undefined;
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
    axis.range[0] + plotFraction(element, clientX, view) * (axis.range[1] - axis.range[0]),
  );
}

function moveGesture(
  mark: PlotGesture | undefined,
  event: React.PointerEvent<HTMLDivElement>,
  view: NumericViewport,
) {
  if (!mark) return;
  if (mark.axis !== 'y' || !mark.scale) {
    mark.move(readPointerX(event.currentTarget, event.clientX, view));
    return;
  }
  const svg = event.currentTarget.querySelector('svg');
  const bounds = svg?.getBoundingClientRect();
  if (!svg || !bounds?.height) return;
  const pixel = ((event.clientY - bounds.top) * svg.viewBox.baseVal.height) / bounds.height;
  const [bottom, top] = mark.scale.range;
  mark.move(mark.scale.invert(clamp(pixel, top, bottom)));
}

function useViewportDrag(view: NumericViewport, startMark: ViewportSurfaceProps['startMark']) {
  const [selection, setSelection] = useState<ScaleInterval | null>(null);
  const [active, setActive] = useState<{
    gesture: 'panning' | 'selecting' | 'move-mark' | 'move-y';
    markId: string | undefined;
  }>();
  const finish = () => {
    setActive(undefined);
    setSelection(null);
  };
  const axis = view.axis;
  const drag = usePointerDrag<HTMLDivElement, ChartDrag>({
    onStart: (event) => {
      const mark = startMark?.(event.target);
      const select = event.shiftKey && !mark;
      if (!mark && !select && !view.canPan) return null;
      if (select) event.preventDefault();
      setActive({
        gesture: mark
          ? mark.axis === 'y'
            ? 'move-y'
            : 'move-mark'
          : select
            ? 'selecting'
            : 'panning',
        markId: mark?.id,
      });
      return { start: event.clientX, axis, markTarget: mark ? event.target : undefined, select };
    },
    onMove: (event, state) => {
      // A controlled host can replace the marker list or the other cursor during a drag.
      if (state.markTarget) moveGesture(startMark?.(state.markTarget), event, view);
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
      finish();
      if (!state.select || cancelled || Math.abs(event.clientX - state.start) < 4) return;
      const start = readPointerX(event.currentTarget, state.start, view);
      const end = readPointerX(event.currentTarget, event.clientX, view);
      view.change([Math.min(start, end), Math.max(start, end)]);
    },
    onCancel: finish,
  });
  return { selection, active, drag };
}

export function ViewportSurface({
  view,
  label,
  children,
  getItems,
  startMark,
}: ViewportSurfaceProps) {
  const { rootRef, hint } = usePlotPointer(view);
  const [location, setLocation] = useState<{ x: number; target?: string | undefined }>();
  const locate = (target: EventTarget, x: number) =>
    setLocation({ x, target: startMark?.(target)?.id });
  const strings = useUiStrings();
  const { axis } = view;
  const middle = axis.invert((axis.range[0] + axis.range[1]) / 2);
  const { selection, active, drag } = useViewportDrag(view, startMark);
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isContextMenuKey(event)) {
      const target = event.target as Element;
      const value = target.closest('[data-coordinate]')?.getAttribute('data-coordinate');
      locate(
        event.target,
        value && startMark?.(event.target)?.axis !== 'y' ? Number(value) : middle,
      );
    }
    navigateByKey(event, view);
  };
  return (
    <ContextMenuTrigger>
      <div
        {...hooks.slot('viewport', {
          gesture: active?.gesture ?? hint ?? (view.canPan ? 'pan' : 'idle'),
          'range-start': axis.domain[0],
          'range-end': axis.domain[1],
        })}
        {...drag}
        ref={rootRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={keyDown}
        onPointerDownCapture={(event) => {
          if (event.pointerType === 'touch')
            locate(event.target, readPointerX(event.currentTarget, event.clientX, view));
        }}
        onContextMenu={(event) =>
          locate(event.target, readPointerX(event.currentTarget, event.clientX, view))
        }
      >
        {typeof children === 'function' ? children(active?.markId) : children}
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
      <Menu
        aria-label={label}
        items={[
          ...(getItems?.(location?.x ?? middle, location?.target) ?? []),
          { id: 'reset', label: strings.chartResetView, onAction: view.reset },
        ]}
      />
    </ContextMenuTrigger>
  );
}
