import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  type SignalCursors,
  type SignalTimeRange,
  SignalTraces,
} from '../../src/components/signal-traces/index.js';
import { LabSection, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { createFastChannels, createSlowChannels } from './signal-traces-samples.js';

const seconds = new Intl.NumberFormat('en', { maximumFractionDigits: 3 });
const nanoseconds = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const values = new Intl.NumberFormat('en', { maximumFractionDigits: 3 });

const formatSeconds = (time: number) => `${seconds.format(time)} s`;
const formatNanoseconds = (time: number) => `${nanoseconds.format(time * 1e9)} ns`;
const formatPair = (pair: readonly [number, number], format: (time: number) => string) =>
  `${format(pair[0])} ${format(pair[1])}`;

const slowWindow: SignalTimeRange = [0, 4];
const slowChannels = createSlowChannels(slowWindow);
const fastChannels = createFastChannels();

/** Three uncontrolled channels in seconds, reporting each change of range and cursors. */
function LinkedDemo() {
  const [range, setRange] = useState('none');
  const [cursors, setCursors] = useState('none');
  return (
    <div data-lab-demo="linked">
      <SignalTraces
        aria-label="Bench signals"
        channels={slowChannels}
        domain={slowWindow}
        formatTime={formatSeconds}
        formatValue={(value) => values.format(value)}
        onRangeChange={(next) => setRange(formatPair(next, formatSeconds))}
        onCursorsChange={(next) => setCursors(formatPair(next, formatSeconds))}
      />
      <LabOutput name="range">{range}</LabOutput>
      <LabOutput name="cursors">{cursors}</LabOutput>
    </div>
  );
}

/** A 400 ns window with a controlled range and controlled cursors the host can also set. */
function FastDemo() {
  const [range, setRange] = useState<SignalTimeRange>([20e-9, 220e-9]);
  const [cursors, setCursors] = useState<SignalCursors>([40e-9, 100e-9]);
  return (
    <div data-lab-demo="fast">
      <SignalTraces
        aria-label="Edge capture"
        channels={fastChannels}
        domain={[0, 400e-9]}
        range={range}
        onRangeChange={setRange}
        cursors={cursors}
        onCursorsChange={setCursors}
        formatTime={formatNanoseconds}
        formatValue={(value) => values.format(value)}
        channelHeight={120}
      />
      <Button size="sm" onPress={() => setCursors([range[0], range[1]])}>
        Cursors to view edges
      </Button>
      <LabOutput name="fast-range">{formatPair(range, formatNanoseconds)}</LabOutput>
    </div>
  );
}

/** One channel that has samples beside one that has none yet. */
function EmptyDemo() {
  const [level] = slowChannels;
  return (
    <div data-lab-demo="empty">
      <SignalTraces
        aria-label="Partial capture"
        channels={[
          ...(level ? [level] : []),
          { id: 'idle', label: 'Idle', unit: 'V', samples: [] },
        ]}
        domain={slowWindow}
        formatTime={formatSeconds}
        channelHeight={64}
      />
    </div>
  );
}

/** The host moves the data window on; the held range and cursors start again over the new one. */
function WindowDemo() {
  const [start, setStart] = useState(0);
  const window: SignalTimeRange = [start, start + 2];
  return (
    <div data-lab-demo="window">
      <Button size="sm" onPress={() => setStart(start + 2)}>
        Next window
      </Button>
      <SignalTraces
        aria-label="Rolling capture"
        channels={createSlowChannels(window, 200).slice(0, 2)}
        domain={window}
        defaultRange={[start + 0.5, start + 1]}
        formatTime={formatSeconds}
        channelHeight={64}
      />
      <LabOutput name="window">{formatPair(window, formatSeconds)}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Linked channels"
      description="Three channels on their own value scales share one time axis. Drag or use the arrow keys on the focused plot to pan, Ctrl and the wheel, plus and minus or the buttons to zoom, and 0 or Reset zoom for the whole window. Each cursor is a slider; the table reads every channel at both cursors."
    >
      <LinkedDemo />
    </LabSection>
    <LabSection
      title="Sub-microsecond window"
      description="Times in seconds over a 400 ns window, written in nanoseconds by the host. The range and the cursors are controlled: the button moves the cursors to the edges of the view."
    >
      <FastDemo />
    </LabSection>
    <LabSection
      title="Empty channel"
      description="A channel without samples shows that it has no data and leaves its readings blank."
    >
      <EmptyDemo />
    </LabSection>
    <LabSection
      title="Changed data window"
      description="Next window moves the data window on by two seconds: the held range and cursors start again over the whole new window."
    >
      <WindowDemo />
    </LabSection>
  </>,
);
