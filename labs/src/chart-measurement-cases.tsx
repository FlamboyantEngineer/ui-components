import { type ReactNode, useMemo, useState } from 'react';
import {
  type ChartReferenceLine,
  EventChart,
  type LinkedChartDifferential,
  LinkedLineChart,
} from '../../src/components/chart/index.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/tabs/tabs.js';
import {
  captureMeasurements,
  current,
  events,
  fixed,
  frequencies,
  frequencyReferences,
  frequencyUnits,
  lastTime,
  ns,
  timeUnits,
  voltage,
} from './chart-measurement-data.js';

const hz = (value: number) =>
  value >= 1000
    ? Number((value / 1000).toPrecision(4)) + ' kHz'
    : Number(value.toPrecision(4)) + ' Hz';

function Notes({ children, title }: { children: ReactNode; title: string }) {
  return (
    <aside className="notes" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </aside>
  );
}
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
function Capture() {
  const [threshold, setThreshold] = useState<number | null>(1);
  const [range, setRange] = useState<readonly [number, number]>([0, lastTime]);
  const [cursors, setCursors] = useState<readonly [number, number]>([80e-9, 240e-9]);
  const [differentials, setDifferentials] = useState<readonly LinkedChartDifferential[]>([
    {
      id: 'delay',
      label: 'Edge delay',
      axis: 'x',
      from: { type: 'reference', id: 'origin' },
      to: { type: 'cursor', name: 'B' },
    },
    {
      id: 'amplitude',
      label: 'Voltage excursion',
      axis: 'y',
      channelId: 'v',
      from: 0,
      to: { type: 'point', channelId: 'v', id: 'peak' },
    },
  ]);
  const [markers, setMarkers] = useState<readonly ChartReferenceLine[]>([]);
  const channels = useMemo(
    () => [{ ...voltage, threshold: threshold ?? undefined }, current],
    [threshold],
  );
  return (
    <div className="workspace">
      <div className="instrument">
        <LinkedLineChart
          label="Captured signals"
          xLabel="Time (ns)"
          formatX={ns}
          xUnits={timeUnits}
          channels={channels}
          measurements={captureMeasurements}
          differentialCursors={differentials}
          onDifferentialCursorsChange={setDifferentials}
          xReferences={fixed}
          visibleRange={range}
          onVisibleRangeChange={setRange}
          cursors={cursors}
          onCursorsChange={setCursors}
          markers={markers}
          onMarkersChange={setMarkers}
        />
      </div>
      <Notes title="Capture notes">
        <dl>
          <Fact label="Voltage samples">24,576</Fact>
          <Fact label="Sample interval">40 ps</Fact>
          <Fact label="Capture span">983.00 ns</Fact>
        </dl>
        <h4>Inspect the transient</h4>
        <p>
          Select a peak to reveal its readout row, or select a row to highlight what it measures on
          the plots. Each channel repeats the shared time axis. Click, drag, or keyboard-focus a
          cursor to highlight its row while you measure. Use the legend to toggle a trace, or hover
          or focus its name to bring it forward. Voltage reaches 5 V and current reaches 42 mA at
          324 ns. Enter 324.01 ns for cursor A to snap to that acquired peak. The next voltage
          sample drops to −5 V. Shift-drag across the spike to inspect it.
        </p>
        <h4>Measure the excursion</h4>
        <p>
          The host calculates the 0.2–1.8 V rise time and both channels’ peak and peak-to-peak
          amplitudes between A and B. Move B to 820 ns to include the spike.
        </p>
        <h4>Differential cursors</h4>
        <p>
          Move B to widen or narrow the shaded trigger-to-B interval. Drag the lower voltage diamond
          up to change the baseline of the peak measurement. Right-click a diamond to change its
          snap target, or open “Differential cursors” in a plot menu to add a pair. Values show end
          minus start.
        </p>
        <h4>Threshold and error band</h4>
        <NumberField
          label="Voltage threshold (V)"
          value={threshold}
          onChange={setThreshold}
          commitBehavior="validate"
        />
        <p>
          In the plot menu, choose a cursor or add a marker at a threshold crossing or the first
          sample outside the shaded ±0.25 V band.
        </p>
      </Notes>
    </div>
  );
}
function Frequency() {
  return (
    <div className="workspace">
      <div className="instrument">
        <LinkedLineChart
          label="Frequency response"
          xLabel="Frequency (Hz)"
          formatX={hz}
          xUnits={frequencyUnits}
          channels={frequencies}
          xScale="log"
          xReferences={frequencyReferences}
          defaultCursors={[100, 1000]}
          defaultDifferentialCursors={[
            {
              id: 'span',
              label: 'Frequency span',
              axis: 'x',
              from: 60,
              to: { type: 'reference', id: 'cutoff' },
            },
          ]}
        />
      </div>
      <Notes title="Frequency notes">
        <dl>
          <Fact label="Frequency range">10 Hz – 100 kHz</Fact>
          <Fact label="Samples per channel">601</Fact>
          <Fact label="Cutoff">1 kHz</Fact>
        </dl>
        <h4>Inspect the cutoff</h4>
        <p>
          The second-order Butterworth low-pass filter reaches −3.01 dB and −90° at 1 kHz. Above
          cutoff, magnitude falls by about 40 dB per decade and phase approaches −180°.
        </p>
        <h4>Compare frequencies</h4>
        <p>
          Cursors start at 100 Hz and 1 kHz. Right-click either plot and choose “Insert cursor” to
          compare a third frequency. Zoom in around 1 kHz until the 1,000 Hz and 1,015.47 Hz samples
          are well apart. Place a cursor between them to see interpolated magnitude and phase,
          marked ≈.
        </p>
      </Notes>
    </div>
  );
}
function Events() {
  return (
    <div className="workspace">
      <div className="instrument">
        <EventChart
          label="Observation sequence"
          events={events}
          xLabel="Elapsed time"
          formatX={(x) => (x * 1e6).toFixed(2) + ' µs'}
        />
      </div>
      <Notes title="Sequence notes">
        <dl>
          <Fact label="Observations">36</Fact>
          <Fact label="Start spacing">1 µs</Fact>
          <Fact label="Interval duration">250 ns</Fact>
        </dl>
        <h4>Inspect coincident events</h4>
        <p>
          Focus the first mark and press the right arrow. Observations 1 and 2 both start at zero.
          The first spans 250 ns and the second is a point.
        </p>
        <h4>Check the raw times</h4>
        <p>
          Choose “Show as table” to inspect each event’s formatted time and original numeric
          endpoints in seconds.
        </p>
      </Notes>
    </div>
  );
}
export function ChartMeasurementShowcase() {
  return (
    <div id="measurement-showcase" className="measurement-showcase">
      <style>{`
.measurement-showcase {
  min-width: 0;
  container: measurement-showcase / inline-size;
}
.measurement-showcase .workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 24%);
  align-items: start;
  gap: 1rem;
}
.measurement-showcase :is(.instrument, .notes, .guide) {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--ref-border);
  border-radius: var(--ref-radius);
}
.measurement-showcase .notes {
  background: var(--ref-surface);
}
.measurement-showcase .notes :is(h3, h4, dl) {
  margin-block: 0 0.4rem;
}
.measurement-showcase .notes h4 {
  margin-block-start: 1rem;
}
.measurement-showcase .notes p {
  margin-block: 0.4rem;
}
.measurement-showcase .fact {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}
.measurement-showcase .fact dd {
  margin: 0;
}
.measurement-showcase .guide {
  margin-block: 1rem;
}
.measurement-showcase summary {
  cursor: pointer;
}
.measurement-showcase .keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding-block-start: 1rem;
}
.measurement-showcase .keys p {
  margin-block: 0.25rem;
}
.measurement-showcase .ui-tabs__panel {
  min-width: 0;
}
.measurement-showcase .ui-linked-line-chart__channel[data-key='i'] {
  --ref-accent-ink: var(--ref-warning);
}
@container measurement-showcase (max-width: 46rem) {
  .measurement-showcase :is(.workspace, .keys) {
    grid-template-columns: minmax(0, 1fr);
  }
}
`}</style>
      <Tabs defaultSelectedKey="capture">
        <TabsList aria-label="Chart examples">
          <TabsTrigger id="capture">Signal capture</TabsTrigger>
          <TabsTrigger id="frequency">Frequency response</TabsTrigger>
          <TabsTrigger id="events">Elapsed events</TabsTrigger>
        </TabsList>
        <TabsContent id="capture" shouldForceMount>
          <Capture />
        </TabsContent>
        <TabsContent id="frequency" shouldForceMount>
          <Frequency />
        </TabsContent>
        <TabsContent id="events" shouldForceMount>
          <Events />
        </TabsContent>
      </Tabs>
      <details className="guide">
        <summary>Pointer and keyboard controls</summary>
        <div className="keys">
          <div>
            <strong>Pan and zoom</strong>
            <p>
              Drag a zoomed plot to pan. Shift-drag selects an interval. Ctrl+wheel zooms around the
              pointer. Right-click and choose “Reset view” to restore the full range.
            </p>
          </div>
          <div>
            <strong>Navigate a focused plot</strong>
            <p>
              Use ← or → to pan, + or − to zoom, and Home to reset. Shift+F10 opens its context
              menu.
            </p>
          </div>
          <div>
            <strong>Position a marker</strong>
            <p>
              Click a cursor name in the readings table to rename it. Drag a cursor or marker, click
              its position to type a value such as 820 ns, or focus a mark and use the arrow keys.
              Bare numbers use seconds for the capture and hertz for the frequency response.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
