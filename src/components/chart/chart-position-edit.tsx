'use client';

import { useUiStrings } from '../../core/provider.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { InlineEdit } from '../inline-edit/inline-edit.js';

interface PositionFormat {
  extent: ScaleInterval;
  formatX: (x: number) => string;
  units?: Readonly<Record<string, number>> | undefined;
}

/** Bare numbers are in source units. An optional suffix must match a host-supplied unit exactly. */
function parsePosition(text: string, units: PositionFormat['units']) {
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*)$/i.exec(text.trim());
  if (!match) return NaN;
  const suffix = match[2] ?? '';
  const scale = suffix && units && Object.hasOwn(units, suffix) ? units[suffix] : suffix ? NaN : 1;
  return Number(match[1]) * (scale ?? NaN);
}

export function ChartPositionEdit({
  label,
  x,
  move,
  format,
}: {
  label: string;
  x: number;
  move: (x: number) => void;
  format: PositionFormat;
}) {
  const s = useUiStrings();
  const shown = format.formatX(x);
  const draft = Number.isFinite(parsePosition(shown, format.units)) ? shown : String(x);
  const save = (text: string) => {
    const value = parsePosition(text, format.units);
    const [low, high] = format.extent;
    if (!Number.isFinite(value) || value < low || value > high)
      throw new Error(s.chartPositionError(format.formatX(low), format.formatX(high)));
    move(value);
  };
  return (
    <InlineEdit
      label={label}
      value={draft}
      renderValue={() => shown}
      onSave={save}
      showActions={false}
    />
  );
}
