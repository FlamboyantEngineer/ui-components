'use client';

import { Fragment, type KeyboardEvent, useImperativeHandle, useState } from 'react';
import type { ControlSize, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { resolveContainment } from '../layout/layout.js';
import { ResizeHandle } from './resize-handle.js';
import {
  applySplitSeparatorValue,
  isSplitPaneCollapsed,
  resolveFlexiblePane,
  resolveSplitPaneBasis,
  resolveSplitSeparator,
  type SplitViewPane,
} from './split-layout.js';
import type { ResizableSplitViewProps } from './split-view.js';
import { splitViewHooks as hooks } from './styling-hooks.js';
import { type SplitSizes, type SplitSizesOptions, useSplitSizes } from './use-split-sizes.js';

interface SeparatorHandleProps {
  /** The separator's position: between pane `index` and the next one. */
  index: number;
  panes: readonly SplitViewPane[];
  split: SplitSizes;
  /** Pixels the percent panes hold, which a pixel pane may grow into. */
  available: number;
  /** The direction of the bar. */
  orientation: Orientation;
  /** Full length of the split in pixels, once measured. */
  length: number;
  /** The split's inner length along its axis, read when a drag starts. */
  getLength: () => number;
  label: string;
  controls: string;
  size: ControlSize | undefined;
  onResizingChange: (isResizing: boolean) => void;
}

type SizeProps = Omit<SplitSizesOptions, 'panes'>;

/** The names the first two panes publish in `data-pane`. */
const paneNames = ['first', 'second'] as const;

/** The pixels pixel panes take; percent sizes are shares of what they leave. */
function sumPixelSizes(panes: readonly SplitViewPane[], sizes: readonly number[]): number {
  return panes.reduce(
    (sum, pane, index) => (pane.unit === 'pixel' ? sum + (sizes[index] ?? 0) : sum),
    0,
  );
}

/** Separates the props that drive the pane sizes from those the root element takes. */
function splitSizeProps<P extends SizeProps>({
  sizes,
  defaultSizes,
  size,
  defaultSize,
  persistKey,
  onSizesChange,
  onSizesChangeEnd,
  onSizeChange,
  onSizeChangeEnd,
  onCollapse,
  onExpand,
  ...rest
}: P): [SizeProps, Omit<P, keyof SizeProps>] {
  const changes = { onSizesChange, onSizesChangeEnd, onSizeChange, onSizeChangeEnd };
  const state = { sizes, defaultSizes, size, defaultSize, persistKey, onCollapse, onExpand };
  return [{ ...state, ...changes }, rest];
}

/**
 * The separator between two panes: its value sizes a pixel pane beside it, else the pane before it,
 * and Enter collapses or opens a collapsible pane beside it.
 */
function SeparatorHandle({
  index,
  panes,
  split,
  available,
  length,
  getLength,
  ...handle
}: SeparatorHandleProps) {
  const separator = resolveSplitSeparator(panes, split.current, { index, available });
  const fixed = sumPixelSizes(panes, split.current);
  const toggled = [separator.sized, separator.partner].find((pane) => panes[pane]?.collapsible);
  const apply = (value: number) =>
    applySplitSeparatorValue(panes, split.current, { index, available, value });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || toggled === undefined) return;
    event.preventDefault();
    const isCollapsed = isSplitPaneCollapsed(panes[toggled], split.current[toggled] ?? 0);
    if (isCollapsed) split.expand(toggled);
    else split.collapse(toggled);
  };
  return (
    <ResizeHandle
      orientation={handle.orientation}
      value={separator.value}
      minValue={separator.min}
      maxValue={separator.max}
      extent={separator.pixel && length > 0 ? length : 100}
      sizedPane={separator.sizedPane}
      getUnitsPerPixel={() => {
        if (separator.pixel) return 1;
        const flexible = getLength() - fixed;
        return flexible > 0 ? 100 / flexible : 0;
      }}
      aria-label={handle.label}
      aria-controls={handle.controls}
      size={handle.size}
      onResizingChange={handle.onResizingChange}
      resetKey={split.owner}
      onChange={(value) => split.update(apply(value), 'change')}
      onChangeEnd={(value) => split.update(apply(value), 'end')}
      onChangeCancel={split.cancel}
      onKeyDown={onKeyDown}
    />
  );
}

/** A split of two or more panes with a window splitter between each pair. */
export function ResizableSplitView({
  children,
  className,
  orientation = 'horizontal',
  panes,
  separatorLabel,
  separatorSize,
  handleRef,
  grow,
  fill,
  clip,
  ref,
  ...props
}: ResizableSplitViewProps) {
  const strings = useUiStrings();
  const [sizeOptions, rest] = splitSizeProps(props);
  const split = useSplitSizes({ panes, ...sizeOptions });
  const [isResizing, setResizing] = useState(false);
  const [root, setRoot] = useForwardedRef(ref);
  const horizontal = orientation === 'horizontal';
  const enabled = panes.some((pane) => pane.unit === 'pixel');
  const measured = useElementSize(root, { box: 'client', enabled });
  const length = (horizontal ? measured?.width : measured?.height) ?? 0;
  // Until the split is measured, pixel panes grow up to their largest size.
  const available =
    length > 0
      ? Math.max(0, length - sumPixelSizes(panes, split.current))
      : Number.POSITIVE_INFINITY;
  useImperativeHandle(handleRef, () => ({
    collapse: split.collapse,
    expand: split.expand,
    resize: (next) => split.update(next, 'set'),
  }));
  const ids = panes.map((pane) => pane.id);
  const flexible = resolveFlexiblePane(panes);
  const containment = resolveContainment({ grow, fill, clip }, { fill: true, clip: true });
  const data = { orientation, resizable: true, resizing: isResizing, ...containment };
  const getLength = () =>
    (horizontal ? root.current?.clientWidth : root.current?.clientHeight) ?? 0;
  const labelOf = (index: number) =>
    typeof separatorLabel === 'function'
      ? separatorLabel(index)
      : (separatorLabel ?? strings.resize);

  return (
    <div {...rest} ref={setRoot} {...hooks.root({ className, data })}>
      {panes.map((pane, index) => (
        <Fragment key={ids[index]}>
          {index > 0 ? (
            <SeparatorHandle
              index={index - 1}
              panes={panes}
              split={split}
              available={available}
              orientation={horizontal ? 'vertical' : 'horizontal'}
              length={length}
              getLength={getLength}
              label={labelOf(index - 1)}
              controls={`${ids[index - 1]} ${ids[index]}`}
              size={separatorSize}
              onResizingChange={setResizing}
            />
          ) : null}
          <div
            {...hooks.slot('pane', {
              pane: paneNames[index],
              flexible: index === flexible,
              collapsed: isSplitPaneCollapsed(pane, split.current[index] ?? 0),
            })}
            inert={isSplitPaneCollapsed(pane, split.current[index] ?? 0) && !split.current[index]}
            id={ids[index]}
            style={{ flexBasis: resolveSplitPaneBasis(panes, split.current, index) }}
          >
            {children[index]}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
