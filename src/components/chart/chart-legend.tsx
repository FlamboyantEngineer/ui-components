'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ToggleButton, ToggleButtonGroup } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { ChartSeries } from './chart.js';
import { chartLegendHooks as hooks } from './chart-hooks.js';

/** Which series a chart hides, controlled or not. */
export interface ChartHiddenKeysProps {
  /** The hidden series, controlled. */
  hiddenKeys?: Iterable<Key> | undefined;
  /** The series hidden at first, uncontrolled. */
  defaultHiddenKeys?: Iterable<Key> | undefined;
  /** Called with the hidden series after the reader shows or hides one. */
  onHiddenKeysChange?: ((keys: Set<Key>) => void) | undefined;
}

export interface ChartLegendProps
  extends BaseProps, AriaLabellingProps, ChartHiddenKeysProps, RefProps<HTMLDivElement> {
  /** The series, in the order of their colour slots. */
  items: readonly ChartSeries[];
}

/**
 * Whether a bar or line chart draws its legend by default: with more than one series, or while a
 * series is hidden, so a series the owner's data left alone and hidden can still be shown again.
 */
export function hasLegendByDefault(
  series: readonly { id: Key }[],
  hidden: ReadonlySet<Key>,
): boolean {
  return series.length > 1 || series.some((entry) => hidden.has(entry.id));
}

/** The hidden series: the caller's when controlled, otherwise the component's own. */
export function useHiddenKeys({
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
}: ChartHiddenKeysProps): [ReadonlySet<Key>, (keys: Set<Key>) => void] {
  // One set per controlled value, so a render that keeps it keeps what the chart derived from it.
  const controlled = useMemo(
    () => (hiddenKeys === undefined ? undefined : new Set(hiddenKeys)),
    [hiddenKeys],
  );
  return useControllableState<ReadonlySet<Key>>(
    controlled,
    new Set(defaultHiddenKeys ?? []),
    onHiddenKeysChange as ((keys: ReadonlySet<Key>) => void) | undefined,
  );
}

/**
 * A chart's legend: one toggle button per series, with a swatch in the series' colour slot, that
 * shows or hides the series. The last shown series stays shown. The arrow keys move between items.
 */
export function ChartLegend({
  items,
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
  className,
  ...rest
}: ChartLegendProps) {
  const strings = useUiStrings();
  const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
  const shown = items.filter((item) => !hidden.has(item.id)).map((item) => item.id);
  return (
    <ToggleButtonGroup
      aria-label={rest['aria-labelledby'] ? undefined : strings.chartLegend}
      {...rest}
      {...hooks.root({ className, props: rest })}
      selectionMode="multiple"
      disallowEmptySelection
      selectedKeys={shown}
      onSelectionChange={(keys) =>
        setHidden(new Set(items.filter((item) => !keys.has(item.id)).map((item) => item.id)))
      }
    >
      {items.map((item, series) => (
        <ToggleButton
          key={toKeyIdentity(item.id)}
          id={item.id}
          {...hooks.slot('item', { series, tone: item.tone })}
        >
          <span {...hooks.slot('swatch', { series, tone: item.tone })} aria-hidden="true" />
          <span {...hooks.slot('label')}>{item.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
