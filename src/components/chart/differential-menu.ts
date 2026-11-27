import type { useUiStrings } from '../../core/provider.js';
import type { MenuEntry } from '../menu/menu.js';
import {
  differentialKey,
  type LinkedChartDifferentialReading,
  type LinkedChartEndpoint,
} from './chart-differentials.js';
import { findNearestSample } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';
import type { useChartDifferentials } from './use-chart-differentials.js';

interface MenuContext {
  model: ReturnType<typeof useChartDifferentials>;
  lane: DrawnChannel;
  at: number;
  strings: ReturnType<typeof useUiStrings>;
}

function endpointChoices(
  reading: LinkedChartDifferentialReading,
  side: 'from' | 'to',
  context: MenuContext,
): MenuEntry[] {
  const { model, lane, at, strings: s } = context;
  const { cursor } = reading;
  const choose = (label: string, end: LinkedChartEndpoint): MenuEntry => ({
    id: JSON.stringify(end),
    label,
    onAction: () => model.change(cursor.id, side, end),
  });
  const scale = lane[cursor.axis];
  const nearest = findNearestSample(lane.line.displayed, at, lane.x);
  const value = reading[side] ?? scale.invert((scale.range[0] + scale.range[1]) / 2);
  const { cursors, markers, references, lanes } = model.sources;
  return [
    choose(s.chartFreePosition, value),
    ...(nearest
      ? [choose(s.chartNearest, { type: 'sample', channelId: lane.channel.id, x: nearest.x })]
      : []),
    ...cursors.map((c) =>
      choose(s.chartCursor(c.label ?? c.name), { type: 'cursor', name: c.name }),
    ),
    ...markers.map((m) => choose(m.label, { type: 'marker', id: m.id })),
    ...references.map((r) => choose(r.label, { type: 'reference', id: r.id })),
    ...lanes
      .filter((l) => cursor.axis === 'x' || l.channel.id === cursor.channelId)
      .flatMap((l) =>
        l.points.map((p) =>
          choose(l.channel.label + ' · ' + p.label, {
            type: 'point',
            channelId: l.channel.id,
            id: p.id,
          }),
        ),
      ),
  ];
}

export function differentialMenu(context: MenuContext, target?: string): MenuEntry[] {
  const { strings: s, model, lane } = context;
  const pairs: MenuEntry[] = [];
  const shortcuts: MenuEntry[] = [];
  for (const reading of model.readings) {
    const pair = reading.cursor;
    const id = differentialKey(pair.id);
    const remove = {
      id: id + '-remove',
      label: s.remove + ' ' + pair.label,
      onAction: () => model.remove(pair.id),
    };
    if (pair.axis === 'y' && pair.channelId !== lane.channel.id) {
      if (!model.sources.lanes.some((l) => l.channel.id === pair.channelId))
        pairs.push({ id, label: pair.label, items: [remove] });
      continue;
    }
    const entries = (['from', 'to'] as const).map((side) => ({
      id: id + side,
      label: side === 'from' ? s.chartFrom : s.chartTo,
      items: endpointChoices(reading, side, context),
    }));
    const hit = entries.find((item) => item.id === target);
    if (hit) shortcuts.push({ ...hit, label: pair.label + ' · ' + hit.label }, remove);
    pairs.push({ id, label: pair.label, items: [...entries, remove] });
  }
  return [
    ...shortcuts,
    {
      id: 'differentials',
      label: s.chartDifferentials,
      items: [
        { id: 'add-x', label: s.chartAddDifferential('ΔX'), onAction: () => model.add('x', lane) },
        { id: 'add-y', label: s.chartAddDifferential('ΔY'), onAction: () => model.add('y', lane) },
        ...pairs,
      ],
    },
  ];
}
