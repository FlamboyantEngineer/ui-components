'use client';

import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { findNearestSample, type SignalChannel, type SignalCursors } from './signal-model.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';

interface SignalReadoutProps {
  channels: readonly SignalChannel[];
  cursors: SignalCursors;
  formatTime: (time: number) => string;
  formatValue: (value: number, channel: SignalChannel) => string;
}

/** A channel's nearest-sample value at a cursor, formatted, or empty text where it has none. */
function readValue(props: SignalReadoutProps, channel: SignalChannel, time: number): string {
  const value = findNearestSample(channel.samples, time)?.value;
  return value === undefined || value === null || !Number.isFinite(value)
    ? ''
    : props.formatValue(value, channel);
}

/**
 * The readings at the cursors: a table of the cursor times and each channel's nearest-sample value
 * at each cursor, then the time from the first cursor to the second.
 */
export function SignalReadout(props: SignalReadoutProps) {
  const { channels, cursors, formatTime } = props;
  const strings = useUiStrings();
  return (
    <>
      <table {...hooks.slot('readout')} aria-label={strings.signalReadings}>
        <thead>
          <tr>
            <th scope="col">{strings.signalChannel}</th>
            <th scope="col">{strings.signalCursor(1)}</th>
            <th scope="col">{strings.signalCursor(2)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{strings.signalTime}</th>
            <td>{formatTime(cursors[0])}</td>
            <td>{formatTime(cursors[1])}</td>
          </tr>
          {channels.map((channel) => (
            <tr key={toKeyIdentity(channel.id)}>
              <th scope="row">
                {channel.label}
                {channel.unit ? <span {...hooks.slot('unit')}>{` (${channel.unit})`}</span> : null}
              </th>
              <td>{readValue(props, channel, cursors[0])}</td>
              <td>{readValue(props, channel, cursors[1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p {...hooks.slot('delta')}>
        {strings.signalTimeDifference(formatTime(cursors[1] - cursors[0]))}
      </p>
    </>
  );
}
