'use client';

import { useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { type DrawnChannel, type LinkedChartReadout, readCursors } from './linked-model.js';

/** A movable measurement cursor. Its unique name is stable across insertions and deletions. */
export interface LinkedChartCursor {
  name: string;
  /** Editable display name, initially the stable name when omitted. */
  label?: string | undefined;
  x: number;
}

export interface ChartCursorProps {
  /** A complete cursor collection. Takes precedence over the A/B pair. */
  cursorList?: readonly LinkedChartCursor[] | undefined;
  defaultCursorList?: readonly LinkedChartCursor[] | undefined;
  onCursorListChange?: ((next: readonly LinkedChartCursor[]) => void) | undefined;
  cursors?: ScaleInterval | undefined;
  defaultCursors?: ScaleInterval | undefined;
  onCursorsChange?: ((pair: ScaleInterval, readout: LinkedChartReadout) => void) | undefined;
}

function nextName(cursors: readonly LinkedChartCursor[]) {
  const used = new Set(cursors.flatMap((c) => [c.name, c.label ?? c.name]));
  for (let index = 1; ; index++) {
    let name = '';
    for (let n = index; n > 0; n = Math.floor((n - 1) / 26))
      name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    if (!used.has(name)) return name;
  }
}

function atPosition(
  name: string,
  x: number,
  cursors: readonly LinkedChartCursor[],
): LinkedChartCursor {
  const saved = cursors.find((c) => c.name === name);
  if (saved) return { ...saved, x };
  return cursors.some((c) => c.label === name)
    ? { name, x, label: nextName(cursors) }
    : { name, x };
}

export function useChartCursors(
  props: ChartCursorProps,
  model: { extent: ScaleInterval; lanes: DrawnChannel[] },
) {
  const s = useUiStrings();
  const [list, setList] = useControllableState(props.cursorList, props.defaultCursorList);
  const pairInput = props.cursorList === undefined ? props.cursors : undefined;
  const [initialPair] = useState(props.defaultCursors);
  const defaults = pairInput ?? initialPair ?? model.extent;
  const initial: LinkedChartCursor[] = [
    { name: 'A', x: defaults[0] },
    { name: 'B', x: defaults[1] },
  ];
  const cursorList = (list ?? initial).map((c) => {
    if (!pairInput) return c;
    if (c.name === 'A') return { ...c, x: pairInput[0] };
    if (c.name === 'B') return { ...c, x: pairInput[1] };
    return c;
  });
  const a = cursorList.find((c) => c.name === 'A'),
    b = cursorList.find((c) => c.name === 'B');
  const cursors: ScaleInterval = [a?.x ?? defaults[0], b?.x ?? defaults[1]];
  const change = (next: readonly LinkedChartCursor[]) => {
    setList(next);
    props.onCursorListChange?.(next);
    const ax = next.find((c) => c.name === 'A')?.x,
      bx = next.find((c) => c.name === 'B')?.x;
    const pair: ScaleInterval = [ax ?? cursors[0], bx ?? cursors[1]];
    if (
      (pairInput || (ax !== undefined && bx !== undefined)) &&
      (pair[0] !== cursors[0] || pair[1] !== cursors[1])
    )
      props.onCursorsChange?.(pair, readCursors(model.lanes, pair));
  };
  const setCursors = (pair: ScaleInterval) => {
    if (!pair.every(Number.isFinite)) return;
    const first = atPosition('A', pair[0], cursorList);
    change([
      first,
      atPosition('B', pair[1], [...cursorList, first]),
      ...cursorList.filter((c) => c.name !== 'A' && c.name !== 'B'),
    ]);
  };
  return {
    cursors,
    cursorList,
    hasPair: Boolean(a && b),
    differenceLabel: (b?.label ?? 'B') + ' − ' + (a?.label ?? 'A'),
    setCursors,
    moveCursor: (name: string, x: number) => {
      if (Number.isFinite(x) && cursorList.some((c) => c.name === name && c.x !== x))
        change(cursorList.map((c) => (c.name === name ? { ...c, x } : c)));
    },
    renameCursor: (name: string, input: string) => {
      const label = input.trim();
      if (!label || cursorList.some((c) => c.name !== name && (c.label ?? c.name) === label))
        throw new Error(s.chartCursorNameError);
      change(cursorList.map((c) => (c.name === name ? { ...c, label } : c)));
    },
    insertCursor: (x: number) => change([...cursorList, { name: nextName(cursorList), x }]),
    deleteCursor: (name: string) => change(cursorList.filter((c) => c.name !== name)),
  };
}
