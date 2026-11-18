// Where signal traces draw: the stacked channel bands, the shared time axis and the gutters.

import type { SignalTimeRange } from './signal-model.js';

/** The pixel box of signal traces, from the measured width and the channel count. */
export interface SignalLayout {
  /** The drawing's full width and height. */
  width: number;
  height: number;
  /** The x of the plotted area's left and right edges. */
  left: number;
  right: number;
  /** The top and bottom of the plotted area of channel `index`. */
  band: (index: number) => SignalTimeRange;
  /** The y of the time axis, under the last channel. */
  axisY: number;
  /** The span the cursor lines cover, from the first channel's top to the time axis. */
  cursorSpan: SignalTimeRange;
}

/** Room above each channel for its label, between channels, and under the time axis. */
const labelRow = 20;
const channelGap = 12;
const axisRoom = 24;
const rightRoom = 16;
const gutterGap = 12;
const minimumGutter = 32;
/** The width the drawing assumes before it is measured. */
const unmeasuredWidth = 480;

/** The layout for `count` channels of `channelHeight` pixels, with value labels `labelWidth` wide. */
export function resolveSignalLayout(options: {
  width: number | null;
  count: number;
  channelHeight: number;
  labelWidth: number;
}): SignalLayout {
  const width = options.width ?? unmeasuredWidth;
  const left = Math.max(minimumGutter, options.labelWidth + gutterGap);
  const right = Math.max(left + 1, width - rightRoom);
  const pitch = labelRow + options.channelHeight + channelGap;
  const band = (index: number): SignalTimeRange => {
    const top = index * pitch + labelRow;
    return [top, top + options.channelHeight];
  };
  const axisY = Math.max(0, options.count * pitch - channelGap);
  return {
    width,
    height: axisY + axisRoom,
    left,
    right,
    band,
    axisY,
    cursorSpan: [labelRow, axisY],
  };
}
