'use client';

import { useMemo, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import {
  type ChartHiddenKeysProps,
  ChartLegend,
  type ChartLegendItem,
  useHiddenKeys,
} from './chart-legend.js';
import { ChartReferences, type PlacedReference } from './chart-references.js';
import type { LinkedChartChannel, LinkedChartLayer } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';
import { isAxisValue } from './numeric-axis.js';

const swatches = {
  measured: 'line',
  reference: 'dashed',
  envelope: 'band',
  threshold: 'dashed',
} as const;

function legendItems(channel: LinkedChartChannel): ChartLegendItem[] {
  if (!channel.legend) return [];
  const items: ChartLegendItem[] = [];
  const add = (key: LinkedChartLayer, present: boolean) => {
    const label = channel.legend?.labels[key];
    if (label && present) items.push({ id: key, label, swatch: swatches[key] });
  };
  const validY = (value: number | null | undefined) =>
    isAxisValue(value ?? NaN, channel.yScale ?? 'linear');
  const usable = (p: { x: number; y: number | null }) => Number.isFinite(p.x) && validY(p.y);
  add('measured', channel.samples.some(usable));
  add('reference', Boolean(channel.reference?.some(usable)));
  add(
    'envelope',
    channel.samples.some(
      (p) =>
        Number.isFinite(p.x) &&
        validY(p.lower) &&
        validY(p.upper) &&
        Number(p.lower) <= Number(p.upper),
    ),
  );
  add('threshold', validY(channel.threshold));
  return items;
}

/** Keep each channel's visibility when switching between its plot and the full capture table. */
export function useChannelVisibility() {
  const [byChannel, setByChannel] = useState<ReadonlyMap<Key, Set<Key>>>(() => new Map());
  return ({ id, legend }: LinkedChartChannel): ChartHiddenKeysProps => ({
    hiddenKeys: legend?.hiddenKeys ?? byChannel.get(id),
    defaultHiddenKeys: legend?.defaultHiddenKeys,
    onHiddenKeysChange: (keys) => {
      if (legend?.hiddenKeys === undefined)
        setByChannel((previous) => new Map(previous).set(id, keys));
      legend?.onHiddenKeysChange?.(keys);
    },
  });
}

export function useLinkedLegend(channel: LinkedChartChannel, visibility: ChartHiddenKeysProps) {
  const strings = useUiStrings();
  const items = useMemo(() => legendItems(channel), [channel]);
  const [hidden, setHidden] = useHiddenKeys(visibility);
  const [front, setFront] = useState<Key>();
  return {
    front,
    visible: (key: LinkedChartLayer) => !hidden.has(key) || !items.some((item) => item.id === key),
    legend: items.length ? (
      <ChartLegend
        aria-label={channel.label + ' · ' + strings.chartLegend}
        items={items}
        hiddenKeys={hidden}
        onHiddenKeysChange={setHidden}
        onHighlight={(key) => {
          if (key !== 'envelope') setFront(key);
        }}
      />
    ) : null,
  };
}

/** Keep envelopes below the traces and cursor handles above them, even when a line is raised. */
export function LinkedTraces({
  lane,
  layers,
  level,
  clip,
  emphasized,
}: {
  lane: DrawnChannel;
  layers: ReturnType<typeof useLinkedLegend>;
  level: readonly PlacedReference[];
  emphasized: boolean;
  clip: string;
}) {
  const paths = {
    measured: (
      <path {...hooks.slot('line', { highlighted: emphasized })} d={lane.line.path} fill="none" />
    ),
    reference: lane.reference ? (
      <path {...hooks.slot('comparison')} d={lane.reference} fill="none" />
    ) : null,
    threshold: <ChartReferences placed={level} />,
  };
  const order = (['reference', 'measured', 'threshold'] as const).filter(layers.visible);
  const front = order.find((key) => key === layers.front);
  const paint = front ? [...order.filter((key) => key !== front), front] : order;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {layers.visible('envelope') && lane.band ? (
        <path clipPath={clip} {...hooks.slot('envelope')} d={lane.band} />
      ) : null}
      {paint.map((key) => (
        <g key={key} clipPath={key === 'threshold' ? undefined : clip}>
          {paths[key]}
        </g>
      ))}
    </g>
  );
}
