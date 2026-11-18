'use client';

import { type RefObject, useId, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import { createLinearScale } from '../../utils/linear-scale.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import { resolveSignalLayout, type SignalLayout } from './signal-layout.js';
import {
  readChannelExtent,
  type SignalChannel,
  type SignalCursors,
  type SignalTimeRange,
} from './signal-model.js';
import { SignalPlot } from './signal-plot.js';
import { SignalReadout } from './signal-readout.js';
import { SignalToolbar } from './signal-toolbar.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';
import { useSignalView } from './use-signal-view.js';

export type {
  SignalChannel,
  SignalCursors,
  SignalEnvelopeSample,
  SignalSample,
  SignalTimeRange,
} from './signal-model.js';

export interface SignalTracesProps extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The channels, stacked top to bottom in this order. */
  channels: readonly SignalChannel[];
  /** The data window: the times the view pans and zooms across, and shows when reset. */
  domain: SignalTimeRange;
  /** The visible time range (controlled). */
  range?: SignalTimeRange | undefined;
  /** The initial visible time range (uncontrolled). Defaults to the whole data window. */
  defaultRange?: SignalTimeRange | undefined;
  /** Called with the range a pan, zoom or reset asks for. */
  onRangeChange?: ((range: SignalTimeRange) => void) | undefined;
  /** The times of the two cursors (controlled). */
  cursors?: SignalCursors | undefined;
  /** The initial cursor times (uncontrolled). Default to a third and two thirds of the range. */
  defaultCursors?: SignalCursors | undefined;
  /** Called with both cursor times when a cursor moves. */
  onCursorsChange?: ((cursors: SignalCursors) => void) | undefined;
  /** Writes a time, or a time difference, in the caller's unit. */
  formatTime?: ((time: number) => string) | undefined;
  /** Writes one of a channel's values. */
  formatValue?: ((value: number, channel: SignalChannel) => string) | undefined;
  /** The height of each channel's plotted band, in pixels. Defaults to 96. */
  channelHeight?: number | undefined;
}

/** Pixels per value tick and per time tick. */
const pixelsPerValueTick = 32;
const pixelsPerTimeTick = 100;
/** The width estimated for each character of a value label before it is measured. */
const estimatedCharacterWidth = 7;
const significantDigits = 6;

/** Each channel with its value scale over its own extent, in its own band. */
function createChannelScales(options: {
  channels: readonly SignalChannel[];
  layout: Pick<SignalLayout, 'band'>;
  channelHeight: number;
  locale: string;
}) {
  return options.channels.map((channel, index) => {
    const [top, bottom] = options.layout.band(index);
    const scale = createLinearScale({
      domain: readChannelExtent(channel) ?? [0, 1],
      range: [bottom, top],
      nice: true,
      tickCount: Math.max(2, Math.floor(options.channelHeight / pixelsPerValueTick)),
      locale: options.locale,
    });
    return { channel, scale };
  });
}

/** The pixel layout and the channel scales, from the plot's width and the widest value label. */
function useSignalGeometry(options: {
  channels: readonly SignalChannel[];
  channelHeight: number;
  width: number | null;
  measureRef: RefObject<HTMLDivElement | null>;
}) {
  const { locale } = useLocale();
  const { channels, channelHeight } = options;
  const count = channels.length;
  // Value scales depend only on the bands' heights, so they are made before the gutter is known.
  const bands = resolveSignalLayout({ width: 0, count, channelHeight, labelWidth: 0 });
  const scaled = createChannelScales({ channels, layout: bands, channelHeight, locale });
  const labels = scaled.flatMap(({ scale }) => scale.ticks().map((tick) => tick.label));
  const measured = useWidestTextWidth(options.measureRef, labels);
  const estimated = Math.max(0, ...labels.map((label) => label.length * estimatedCharacterWidth));
  const labelWidth = measured ?? estimated;
  const layout = resolveSignalLayout({ width: options.width, count, channelHeight, labelWidth });
  return { layout, scaled, locale };
}

/** The time scale across the plotted area and its ticks, written by `formatTime` when given. */
function createTimeAxis(options: {
  range: SignalTimeRange;
  layout: SignalLayout;
  locale: string;
  formatTime: ((time: number) => string) | undefined;
}) {
  const { layout, formatTime } = options;
  const timeScale = createLinearScale({
    domain: options.range,
    range: [layout.left, layout.right],
    tickCount: Math.max(2, Math.floor((layout.right - layout.left) / pixelsPerTimeTick)),
    locale: options.locale,
  });
  const timeTicks = timeScale
    .ticks()
    .map((tick) => (formatTime ? { ...tick, label: formatTime(tick.value) } : tick));
  return { timeScale, timeTicks };
}

/**
 * Stacked signal channels over one shared numeric time axis, each on its own value scale, with a
 * pannable, zoomable time range and two linked cursors whose readings and time difference show in
 * a table under the drawing. The host supplies the display samples and every unit and format.
 */
export function SignalTraces({
  channels,
  domain,
  range,
  defaultRange,
  onRangeChange,
  cursors,
  defaultCursors,
  onCursorsChange,
  formatTime: givenFormatTime,
  formatValue: givenFormatValue,
  channelHeight = 96,
  className,
  ref,
  ...rest
}: SignalTracesProps) {
  const strings = useUiStrings();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [plot, setPlot] = useState<HTMLDivElement | null>(null);
  const width = useElementSize(plot)?.width ?? null;
  const view = useSignalView({
    ...{ domain, range, defaultRange, onRangeChange },
    ...{ cursors, defaultCursors, onCursorsChange },
  });
  const { layout, scaled, locale } = useSignalGeometry({
    ...{ channels, channelHeight, width },
    measureRef: rootRef,
  });
  const { timeScale, timeTicks } = createTimeAxis({
    ...{ range: view.range, layout, locale },
    formatTime: givenFormatTime,
  });
  const number = useNumberFormatter({ maximumSignificantDigits: significantDigits });
  const formatTime = givenFormatTime ?? ((time: number) => number.format(time));
  const formatValue = givenFormatValue ?? ((value: number) => number.format(value));
  const idPrefix = useId();
  const mergedRef = useMergedRefs(rootRef, ref);
  return (
    <div {...rest} {...hooks.root({ className, props: rest })} ref={mergedRef} role="group">
      <SignalToolbar
        domain={view.domain}
        range={view.range}
        setRange={view.setRange}
        rangeText={strings.signalTimeRange(formatTime(view.range[0]), formatTime(view.range[1]))}
        rangeId={`${idPrefix}-range`}
      />
      <SignalPlot
        {...{ view, layout, timeScale, timeTicks, formatTime, idPrefix, plot }}
        channels={scaled}
        setPlot={setPlot}
      />
      <SignalReadout
        channels={channels}
        cursors={view.cursors}
        formatTime={formatTime}
        formatValue={formatValue}
      />
    </div>
  );
}
