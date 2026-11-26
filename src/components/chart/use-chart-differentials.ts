'use client';

import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import {
  differentialKey,
  type DifferentialSources,
  type LinkedChartDifferential,
  type LinkedChartEndpoint,
  readDifferential,
} from './chart-differentials.js';
import type { DrawnChannel } from './linked-model.js';

export interface ChartDifferentialProps {
  differentialCursors?: readonly LinkedChartDifferential[] | undefined;
  defaultDifferentialCursors?: readonly LinkedChartDifferential[] | undefined;
  onDifferentialCursorsChange?: ((cursors: readonly LinkedChartDifferential[]) => void) | undefined;
}

const empty: readonly LinkedChartDifferential[] = [];

export function useChartDifferentials(
  props: ChartDifferentialProps,
  sources: DifferentialSources,
  select: (key: string) => void,
) {
  const [pairs, setPairs] = useControllableState(
    props.differentialCursors,
    props.defaultDifferentialCursors ?? empty,
    props.onDifferentialCursorsChange,
  );
  const makeId = useIdFactory();
  const change = (id: Key, side: 'from' | 'to', end: LinkedChartEndpoint) => {
    setPairs(pairs.map((p) => (p.id === id ? { ...p, [side]: end } : p)));
    select(differentialKey(id));
  };
  const add = (axis: 'x' | 'y', lane: DrawnChannel) => {
    const scale = lane[axis];
    const [low, high] = scale.range;
    const id = makeId(pairs.map((p) => String(p.id)))();
    const prefix = axis === 'x' ? 'ΔX' : 'ΔY';
    let n = 1;
    while (pairs.some((p) => p.label === prefix + ' ' + n)) n++;
    const pair = {
      id,
      label: prefix + ' ' + n,
      from: scale.invert(low + (high - low) / 3),
      to: scale.invert(low + (2 * (high - low)) / 3),
    };
    setPairs([
      ...pairs,
      axis === 'x' ? { ...pair, axis } : { ...pair, axis, channelId: lane.channel.id },
    ]);
    select(differentialKey(id));
  };
  return {
    readings: pairs.map((p) => readDifferential(p, sources)),
    sources,
    change,
    add,
    remove: (id: Key) => setPairs(pairs.filter((p) => p.id !== id)),
  };
}
