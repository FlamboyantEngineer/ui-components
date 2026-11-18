import type { LinearScale } from '../../utils/linear-scale.js';
import { ChartAxis } from '../chart/chart-axis.js';
import {
  buildEnvelopePath,
  buildTracePath,
  type SignalChannel as SignalChannelData,
  type SignalProjection,
  type SignalTimeRange,
  sliceVisible,
} from './signal-model.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';

interface SignalChannelProps {
  channel: SignalChannelData;
  index: number;
  /** The channel's value scale, mapped to its band. */
  valueScale: LinearScale;
  /** The plotted area's left and right edges. */
  plotX: SignalTimeRange;
  /** The visible time range and the projection of times into the plot. */
  range: SignalTimeRange;
  mapTime: (time: number) => number;
  clipId: string;
  emptyText: string;
}

/** The space between a channel's label and the top of its band. */
const labelGap = 6;

/**
 * One channel's band: its label and unit, its value axis, and its envelope, reference and trace,
 * clipped to the band, or the no-data text when it has no samples.
 */
export function SignalChannel({
  channel,
  index,
  valueScale,
  plotX,
  range,
  mapTime,
  clipId,
  emptyText,
}: SignalChannelProps) {
  const [top, bottom] = [valueScale.range[1], valueScale.range[0]];
  const projection: SignalProjection = { x: mapTime, y: (value) => valueScale.map(value) };
  const isEmpty = channel.samples.length === 0;
  const data = { channel: String(index) };
  const width = plotX[1] - plotX[0];
  return (
    <g {...hooks.slot('channel', { ...data, empty: isEmpty })}>
      <text {...hooks.slot('label')} x={plotX[0]} y={top - labelGap}>
        {channel.label}
        {channel.unit ? <tspan {...hooks.slot('unit')}>{` (${channel.unit})`}</tspan> : null}
      </text>
      <clipPath id={clipId}>
        <rect x={plotX[0]} y={top} width={Math.max(0, width)} height={bottom - top} />
      </clipPath>
      <ChartAxis
        className={hooks.slotClass('value-axis')}
        position="left"
        ticks={valueScale.ticks()}
        offset={plotX[0]}
        range={[bottom, top]}
        gridLength={width}
      />
      <g clipPath={`url(#${clipId})`}>
        {channel.envelope ? (
          <path
            {...hooks.slot('envelope', data)}
            d={buildEnvelopePath(sliceVisible(channel.envelope, range), projection)}
          />
        ) : null}
        {channel.reference ? (
          <path
            {...hooks.slot('reference', data)}
            fill="none"
            d={buildTracePath(sliceVisible(channel.reference, range), projection)}
          />
        ) : null}
        <path
          {...hooks.slot('trace', data)}
          fill="none"
          d={buildTracePath(sliceVisible(channel.samples, range), projection)}
        />
      </g>
      {isEmpty ? (
        <text
          {...hooks.slot('empty')}
          x={(plotX[0] + plotX[1]) / 2}
          y={(top + bottom) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {emptyText}
        </text>
      ) : null}
    </g>
  );
}
