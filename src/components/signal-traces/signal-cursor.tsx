'use client';

import type { KeyboardEvent } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { clampTime, type SignalTimeRange } from './signal-model.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';

interface SignalCursorProps {
  /** The cursor's number, counting from 1. */
  number: 1 | 2;
  time: number;
  domain: SignalTimeRange;
  range: SignalTimeRange;
  /** The cursor's x in the plot, kept at the plot's edge while it lies outside the range. */
  x: number;
  top: number;
  height: number;
  label: string;
  valueText: string;
  onChange: (time: number) => void;
  timeAtClientX: (clientX: number) => number;
}

/** The share of the visible span an arrow key moves a cursor, and Page Up or Page Down. */
const stepShare = 0.01;
const pageShare = 0.1;

/**
 * A number as plain decimal text: ARIA values do not take exponents, which JavaScript writes for
 * magnitudes below 1e-6 and from 1e21.
 */
function toDecimalText(value: number): string {
  const text = String(value);
  const match = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (!match) return text;
  const [, sign = '', lead = '', rest = '', exponent = '0'] = match;
  const power = Number(exponent);
  if (power < 0) return `${sign}0.${'0'.repeat(-power - 1)}${lead}${rest}`;
  return `${sign}${lead}${rest}${'0'.repeat(Math.max(0, power - rest.length))}`;
}

/** The slider's ARIA bounds and value as decimal text, which React's number types do not allow. */
function readAriaValues([min, max, now]: readonly [number, number, number]): Record<
  string,
  string
> {
  return {
    'aria-valuemin': toDecimalText(min),
    'aria-valuemax': toDecimalText(max),
    'aria-valuenow': toDecimalText(now),
  };
}

/** The time a slider key moves the cursor to, or `null` for a key the cursor leaves alone. */
function readKeyTime(key: string, { time, range }: SignalCursorProps): number | null {
  const span = range[1] - range[0];
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return time - span * stepShare;
    case 'ArrowRight':
    case 'ArrowUp':
      return time + span * stepShare;
    case 'PageDown':
      return time - span * pageShare;
    case 'PageUp':
      return time + span * pageShare;
    case 'Home':
      return range[0];
    case 'End':
      return range[1];
    default:
      return null;
  }
}

/**
 * A time cursor's handle: a slider over the data window that the arrow keys, Page Up and Page
 * Down step through the visible range, Home and End move to its ends, and the pointer drags.
 */
export function SignalCursor(props: SignalCursorProps) {
  const { number, time, domain, range, x, top, height, label, valueText } = props;
  const drag = usePointerDrag<HTMLDivElement, true>({
    onStart: () => true,
    onMove: (event) => props.onChange(clampTime(props.timeAtClientX(event.clientX), range)),
  });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = readKeyTime(event.key, props);
    if (next === null) return;
    event.preventDefault();
    props.onChange(clampTime(next, domain));
  };
  const isOutside = time < range[0] || time > range[1];
  return (
    <div
      {...hooks.slot('cursor', { cursor: String(number), outside: isOutside })}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      {...readAriaValues([domain[0], domain[1], time])}
      aria-valuetext={valueText}
      style={{ position: 'absolute', left: x, top, height, touchAction: 'none' }}
      onKeyDown={onKeyDown}
      {...drag}
    />
  );
}
