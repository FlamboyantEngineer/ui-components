import { type CSSProperties, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  EventTimeline,
  type EventTimelineEvent,
} from '../../src/components/event-timeline/index.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const box: CSSProperties = { width: 520, maxWidth: '100%' };

/** A recorded run in milliseconds: markers, intervals and a coincident pair. */
const run: EventTimelineEvent[] = [
  { id: 'start', label: 'Start', at: 0 },
  {
    id: 'warm',
    label: 'Warm-up',
    at: 1.5,
    duration: 4,
    tone: 'info',
    details: 'Heater on until the reading settles.',
  },
  { id: 'sample-a', label: 'Sample A', at: 7, tone: 'success' },
  { id: 'sample-b', label: 'Sample B', at: 7, tone: 'success' },
  { id: 'pause', label: 'Pause', at: 9.25, duration: 2.5, tone: 'warning' },
  { id: 'fault', label: 'Fault', at: 10, tone: 'danger', details: 'Reading out of bounds.' },
  { id: 'stop', label: 'Stop', at: 14 },
];

/** Coincident events: three markers at one time and a marker inside an interval. */
const coincident: EventTimelineEvent[] = [
  { id: 1, label: 'Open', at: 2 },
  { id: '1', label: 'Open again', at: 2, tone: 'info' },
  { id: 'echo', label: 'Echo', at: 2, tone: 'warning' },
  { id: 'hold', label: 'Hold', at: 4, duration: 3, tone: 'success' },
  { id: 'tick', label: 'Tick', at: 5 },
];

/** Microsecond-scale durations, in seconds. */
const microseconds: EventTimelineEvent[] = [
  { id: 'trigger', label: 'Trigger', at: 0.000001 },
  { id: 'pulse', label: 'Pulse', at: 0.0000025, duration: 0.0000004, tone: 'info' },
  { id: 'echo', label: 'Echo', at: 0.000006, duration: 0.0000015, tone: 'success' },
];

/** Sub-microsecond events, in seconds. */
const subMicrosecond: EventTimelineEvent[] = [
  { id: 'edge', label: 'Edge', at: 0.00000012 },
  { id: 'glitch', label: 'Glitch', at: 0.00000031, duration: 0.000000045, tone: 'danger' },
  { id: 'settle', label: 'Settle', at: 0.0000007, tone: 'success' },
];

const cases = {
  'markers and intervals': { events: run, unit: 'ms', range: { start: 0, end: 15 } },
  coincident: { events: coincident, unit: 'ms', range: { start: 0, end: 8 } },
  microseconds: { events: microseconds, unit: 's', range: undefined },
  'sub-microsecond': { events: subMicrosecond, unit: 's', range: { start: 0, end: 0.000001 } },
  empty: { events: [], unit: 'ms', range: { start: 0, end: 10 } },
} as const;

/** Writes seconds as nanoseconds with grouping, for the formatter demo. */
const nanoseconds = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const formatNanoseconds = (value: number) => `${nanoseconds.format(value * 1e9)} ns`;

function ControlledCurrent() {
  const [currentKey, setCurrentKey] = useState<Key | null>('pause');
  const index = run.findIndex((event) => event.id === currentKey);
  const step = (by: number) => {
    const next = run[Math.min(Math.max(index + by, 0), run.length - 1)];
    if (next) setCurrentKey(next.id);
  };
  return (
    <div style={box} data-lab-demo="controlled">
      <EventTimeline
        label="Controlled run"
        events={run}
        unit="ms"
        range={{ start: 0, end: 15 }}
        currentKey={currentKey}
        onCurrentKeyChange={setCurrentKey}
      />
      <p>
        <Button size="sm" onPress={() => step(-1)}>
          Previous event
        </Button>{' '}
        <Button size="sm" onPress={() => step(1)}>
          Next event
        </Button>
      </p>
      <p>Current: {currentKey === null ? 'none' : String(currentKey)}</p>
    </div>
  );
}

/** Samples a run in windows of 10 ms; each window brings its own events. */
function windowEvents(windowIndex: number): EventTimelineEvent[] {
  const start = windowIndex * 10;
  return [
    { id: `w${windowIndex}-open`, label: `Window ${windowIndex + 1} open`, at: start + 1 },
    { id: 'shared', label: 'Heartbeat', at: start + 5, tone: 'info' },
    { id: `w${windowIndex}-burst`, label: 'Burst', at: start + 6, duration: 2, tone: 'warning' },
  ];
}

function ChangingWindow() {
  const [windowIndex, setWindowIndex] = useState(0);
  const start = windowIndex * 10;
  return (
    <div style={box} data-lab-demo="window">
      <EventTimeline
        label="Data window"
        events={windowEvents(windowIndex)}
        unit="ms"
        range={{ start, end: start + 10 }}
        defaultCurrentKey="shared"
        showTable
      />
      <p>
        <Button size="sm" onPress={() => setWindowIndex(windowIndex + 1)}>
          Next window
        </Button>{' '}
        <Button size="sm" isDisabled={windowIndex === 0} onPress={() => setWindowIndex(0)}>
          First window
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Events and intervals"
      description="Markers and short intervals on a numeric elapsed-time axis, in the caller's unit, with the companion table. Coincident and overlapping events take separate lanes; microsecond and sub-microsecond durations keep their exact proportions; without events the axis keeps its range. Tab to the events, move with the arrow keys, Home and End, and press or focus one to see its details."
    >
      <StateMatrix
        axes={{ content: Object.keys(cases) as Array<keyof typeof cases> }}
        render={({ content }) => {
          const { events, unit, range } = cases[content];
          return (
            <div style={box}>
              <EventTimeline
                label={`Run: ${content}`}
                events={events}
                unit={unit}
                range={range}
                showTable
              />
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Caller formatters"
      description="formatValue writes every start and duration (here seconds as nanoseconds), and formatAxisValue writes the ticks. The details and the table use the same values."
    >
      <div style={box} data-lab-demo="formatters">
        <EventTimeline
          label="Pulse train"
          events={microseconds}
          range={{ start: 0, end: 0.000008 }}
          unit="ns"
          formatValue={formatNanoseconds}
          formatAxisValue={(value) => nanoseconds.format(value * 1e9)}
          defaultCurrentKey="pulse"
          showTable
        />
      </div>
    </LabSection>
    <LabSection
      title="Event spacing"
      description="eventSpacing is the share of the axis each event keeps free after it before another event shares its lane, so labels have room: 0.15 by default, 0 packs lanes as tightly as time allows, 0.3 spreads them further."
    >
      <StateMatrix
        axes={{ spacing: ['0', 'default', '0.3'] }}
        render={({ spacing }) => (
          <div style={box}>
            <EventTimeline
              label={`Spacing ${spacing}`}
              events={run}
              unit="ms"
              range={{ start: 0, end: 15 }}
              eventSpacing={spacing === 'default' ? undefined : Number(spacing)}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Range and clipping"
      description="A range narrower than the run leaves out the events outside it and cuts intervals at its ends; the table still lists every event."
    >
      <div style={box} data-lab-demo="clipped">
        <EventTimeline
          label="Middle of the run"
          events={run}
          unit="ms"
          range={{ start: 3, end: 10.5 }}
          showTable
        />
      </div>
    </LabSection>
    <LabSection
      title="Controlled current event"
      description="currentKey and onCurrentKeyChange let the host move the current event; the tab stop follows it."
    >
      <ControlledCurrent />
    </LabSection>
    <LabSection
      title="Changing data window"
      description="Each window brings new events and a new range. The heartbeat keeps its key, so its details stay current across windows."
    >
      <ChangingWindow />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left locale time runs from the right edge and the arrow keys follow it."
    >
      <div dir="rtl" style={box} data-lab-demo="rtl">
        <UiProvider locale="ar-EG">
          <EventTimeline aria-label="Run, right to left" events={coincident} unit="ms" />
        </UiProvider>
      </div>
    </LabSection>
  </>,
);
