import { useState, type CSSProperties } from 'react';
import { BarChart, type BarChartSeries } from '../../src/components/chart/index.js';
import { Chart, type ChartView } from '../../src/components/chart/chart.js';
import { ChartAxis } from '../../src/components/chart/index.js';
import { ChartLegend } from '../../src/components/chart/index.js';
import { Button } from '../../src/components/button/button.js';
import { DonutChart, type DonutChartSegment } from '../../src/components/chart/index.js';
import { LineChart, type LineChartSeries } from '../../src/components/chart/index.js';
import type { Key } from '../../src/core/props.js';
import { createBandScale } from '../../src/utils/band-scale.js';
import { createLinearScale } from '../../src/utils/linear-scale.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const box = (width: number): CSSProperties => ({ width });

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const crates: BarChartSeries[] = [
  { id: 'apples', label: 'Apples', values: [42, 55, 61, 48] },
  { id: 'pears', label: 'Pears', values: [24, 31, 28, 35] },
  { id: 'plums', label: 'Plums', values: [12, 18, 26, 15] },
];

const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
const checks: BarChartSeries[] = [
  { id: 'passed', label: 'Passed', tone: 'success', values: [180, 192, 201, 188, 214] },
  { id: 'failed', label: 'Failed', tone: 'danger', values: [14, 9, 11, 22, 6] },
  { id: 'skipped', label: 'Skipped', tone: 'neutral', values: [6, 4, 3, 5, 2] },
];

const sprintDays = [
  '2026-03-02',
  '2026-03-03',
  '2026-03-04',
  '2026-03-05',
  '2026-03-06',
  '2026-03-09',
  '2026-03-10',
  '2026-03-11',
  '2026-03-12',
  '2026-03-13',
];
const remaining = [40, 38, 35, 35, 30, Number.NaN, 24, 19, 14, 9];
const burndown: LineChartSeries[] = [
  {
    id: 'remaining',
    label: 'Remaining',
    points: sprintDays.map((x, index) => ({ x, y: requireDefined(remaining[index]) })),
  },
  {
    id: 'ideal',
    label: 'Ideal',
    tone: 'neutral',
    points: [
      { x: requireDefined(sprintDays[0]), y: 40 },
      { x: requireDefined(sprintDays.at(-1)), y: 0 },
    ],
  },
];

const buildTimes: LineChartSeries[] = [
  {
    id: 'minutes',
    label: 'Build minutes',
    points: [1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208].map((x, index) => ({
      x,
      y: requireDefined([6.2, 6.8, 6.1, 7.4, 9.2, 8.1, 7.3, 6.9][index]),
    })),
  },
];

/** A sparse series beside a dense one: moving between them keeps the reading's x, not its position. */
const samples: LineChartSeries[] = [
  {
    id: 'hourly',
    label: 'Hourly reading',
    points: [0, 6, 12, 18, 24].map((x) => ({ x, y: 10 + x / 4 })),
  },
  {
    id: 'spot',
    label: 'Spot check',
    points: [0, 1, 2, 3, 24].map((x) => ({ x, y: 4 + x / 3 })),
  },
];

const results: DonutChartSegment[] = [
  { id: 'passed', label: 'Passed', tone: 'success', value: 214 },
  { id: 'failed', label: 'Failed', tone: 'danger', value: 6 },
  { id: 'blocked', label: 'Blocked', tone: 'warning', value: 9 },
  { id: 'skipped', label: 'Skipped', tone: 'neutral', value: 2 },
];

const fruit: DonutChartSegment[] = [
  { id: 'apples', label: 'Apples', value: 48 },
  { id: 'pears', label: 'Pears', value: 35 },
  { id: 'plums', label: 'Plums', value: 15 },
  { id: 'figs', label: 'Figs', value: 9 },
];

const states = ['default', 'summary', 'table', 'empty'] as const;

/** A host's own drawing (a grid of cells shaded by value) in the shared frame, axis and legend. */
function CustomDrawing() {
  const rooms = ['Lab A', 'Lab B', 'Lab C'];
  const hours = ['8:00', '10:00', '12:00', '14:00', '16:00'];
  const usage = [
    [2, 5, 8, 6, 3],
    [1, 3, 4, 7, 9],
    [6, 6, 2, 1, 0],
  ];
  const columns = createBandScale({ domain: hours, range: [56, 356], padding: 0.05 });
  const rows = createBandScale({ domain: rooms, range: [8, 128], padding: 0.05 });
  const shade = createLinearScale({ domain: [0, 9], range: [0, 4] });
  const [hidden, setHidden] = useState<Set<Key>>(new Set());
  return (
    <Chart
      label="Room use by hour"
      summary="Three rooms over five hours; Lab B is busiest at 16:00"
      showSummary
      data-lab-demo="custom"
      table={{
        columns: ['Room', ...hours],
        rows: rooms.map((room, index) => [room, ...requireDefined(usage[index]).map(String)]),
      }}
      legend={
        <ChartLegend
          items={rooms.map((room) => ({ id: room, label: room }))}
          hiddenKeys={hidden}
          onHiddenKeysChange={setHidden}
        />
      }
    >
      <svg width={372} height={156} role="group" aria-label="Room use cells">
        <ChartAxis position="left" offset={56} range={[8, 128]} ticks={rows.ticks()} />
        <ChartAxis position="bottom" offset={128} range={[56, 356]} ticks={columns.ticks()} />
        {rooms.map((room, row) =>
          hidden.has(room)
            ? null
            : hours.map((hour, column) => (
                <rect
                  key={`${room}-${hour}`}
                  role="img"
                  aria-label={`${room}, ${hour}: ${requireDefined(usage[row])[column]} people`}
                  data-lab-shade={Math.round(
                    shade.map(requireDefined(requireDefined(usage[row])[column])),
                  )}
                  fill="currentColor"
                  fillOpacity={
                    0.1 + 0.2 * shade.map(requireDefined(requireDefined(usage[row])[column]))
                  }
                  x={columns.map(hour)}
                  y={rows.map(room)}
                  width={columns.bandwidth}
                  height={rows.bandwidth}
                />
              )),
        )}
      </svg>
    </Chart>
  );
}

/** A legend and view controlled from outside the chart. */
function ControlledChart() {
  const [hidden, setHidden] = useState<Set<Key>>(new Set(['plums']));
  const [view, setView] = useState<ChartView>('chart');
  return (
    <div style={box(520)} data-lab-demo="controlled">
      <BarChart
        label="Crates by quarter"
        categories={quarters}
        series={crates}
        hiddenKeys={hidden}
        onHiddenKeysChange={setHidden}
        view={view}
        onViewChange={setView}
        height={200}
      />
      <p data-lab-output="hidden">
        Hidden: {[...hidden].join(', ') || 'none'}; view: {view}
      </p>
    </div>
  );
}

const typedSeries: BarChartSeries[] = [
  { id: 1, label: 'Numeric series', values: [2, 3] },
  { id: '1', label: 'Text series', values: [4, 5] },
];

function TypedKeys() {
  const [isReversed, setReversed] = useState(false);
  const [hidden, setHidden] = useState<Set<Key>>(new Set());
  const items = [
    { id: 1, label: 'Numeric series' },
    { id: '1', label: 'Text series' },
  ];
  const ticks = [
    { value: 1, position: 20, label: 'Number 1' },
    { value: '1', position: 140, label: 'Text 1' },
  ];
  return (
    <div data-lab-demo="typed-keys">
      <Button onPress={() => setReversed(!isReversed)}>Reverse typed entries</Button>
      <ChartLegend
        items={isReversed ? items.reverse() : items}
        hiddenKeys={hidden}
        onHiddenKeysChange={setHidden}
      />
      <svg width={180} height={70} aria-hidden="true">
        <ChartAxis
          position="bottom"
          ticks={isReversed ? ticks.reverse() : ticks}
          offset={35}
          range={[0, 180]}
          gridLength={30}
        />
      </svg>
      <div style={box(320)}>
        <BarChart
          label="Typed series"
          categories={['First', 'Second']}
          series={isReversed ? [...typedSeries].reverse() : typedSeries}
          height={140}
          showLegend={false}
        />
      </div>
      <output data-lab-output="typed-hidden">
        {[...hidden].map((key) => `${typeof key} ${key}`).join(', ') || 'none'}
      </output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Typed identities"
      description="Numeric and text series IDs and tick values with the same spelling remain distinct when reordered. A focused or hovered bar keeps its series through the reorder, though its colour slot follows the new position."
    >
      <TypedKeys />
    </LabSection>
    <LabSection
      title="Bar layouts"
      description="Grouped and stacked bars, vertical and horizontal, with a legend that shows and hides each series. Arrow keys move between values and series, Home and End jump to the series ends, and Tab leaves the plot without scanning its points."
    >
      <StateMatrix
        axes={{ layout: ['grouped', 'stacked'], orientation: ['vertical', 'horizontal'] }}
        render={({ layout, orientation }) => (
          <div style={box(420)}>
            <BarChart
              label="Crates by quarter"
              categories={quarters}
              series={crates}
              layout={layout}
              orientation={orientation}
              height={200}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Tones"
      description="Series with tones (passed, failed, skipped) keep their meaning in every chart; the colour slot falls back to the series position."
    >
      <div style={box(560)} data-lab-demo="tones">
        <BarChart
          label="Checks by week"
          categories={weeks}
          series={checks}
          layout="stacked"
          categoryLabel="Week"
          height={220}
        />
      </div>
    </LabSection>
    <LabSection
      title="Line charts"
      description="A burndown over working days on a time axis (with a gap on a missing day and an ideal line), as lines and as areas, and build minutes on a numeric axis. Dates preserve explicit offsets and millisecond precision. In the unevenly sampled readings, the up and down arrow keys move to the other series' reading nearest in hour, not in position."
    >
      <StateMatrix
        axes={{ variant: ['line', 'area'] }}
        render={({ variant }) => (
          <div style={box(440)}>
            <LineChart
              label="Sprint burndown"
              series={burndown}
              variant={variant}
              timeZone="UTC"
              categoryLabel="Day"
              height={200}
            />
          </div>
        )}
      />
      <div style={box(440)} data-lab-demo="numeric">
        <LineChart
          label="Build time by build"
          series={buildTimes}
          minValue={0}
          maxValue={10}
          categoryLabel="Build"
          formatOptions={{ maximumFractionDigits: 1 }}
          height={180}
        />
      </div>
      <div style={box(440)} data-lab-demo="uneven">
        <LineChart
          label="Readings by hour"
          series={samples}
          categoryLabel="Hour"
          formatOptions={{ maximumFractionDigits: 1 }}
          height={180}
        />
      </div>
    </LabSection>
    <LabSection
      title="Donuts"
      description="The parts of a whole around their total, in tones and in position slots, and a smaller ring without a legend. The table lists every segment with its amount and share, including hidden segments."
    >
      <StateMatrix
        axes={{ data: ['results', 'fruit', 'small'] }}
        render={({ data }) => (
          <DonutChart
            label={data === 'results' ? 'Run results' : 'Fruit sold'}
            segments={data === 'results' ? results : fruit}
            categoryLabel={data === 'results' ? 'Result' : 'Fruit'}
            diameter={data === 'small' ? 96 : 160}
            showLegend={data !== 'small'}
            formatOptions={data === 'fruit' ? { style: 'unit', unit: 'kilogram' } : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Large amounts"
      description="Two equal finite amounts keep equal slices and table shares even when their total exceeds the numeric range."
    >
      <DonutChart
        label="Large amounts"
        segments={[
          { id: 'first', label: 'First', value: Number.MAX_VALUE },
          { id: 'second', label: 'Second', value: Number.MAX_VALUE },
        ]}
        formatOptions={{ notation: 'scientific' }}
      />
    </LabSection>
    <LabSection
      title="States"
      description="The summary shown under the title, the table view, and a chart with no values."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) => (
          <div style={box(320)}>
            <BarChart
              label="Crates by quarter"
              categories={state === 'empty' ? [] : quarters}
              series={crates.slice(0, 2)}
              showSummary={state === 'summary'}
              defaultView={state === 'table' ? 'table' : 'chart'}
              height={160}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Controlled legend and view"
      description="The hidden series and the view held by the page, which prints them. Hiding the series of a hovered or focused value closes its tooltip, and Escape then reaches the page again."
    >
      <ControlledChart />
    </LabSection>
    <LabSection
      title="Repeated coordinates"
      description="Each series keeps its first reading at a repeated coordinate. A missing first reading leaves that table cell blank."
    >
      <LineChart
        label="Repeated readings"
        defaultView="table"
        series={[
          {
            id: 'a',
            label: 'First',
            points: [
              { x: 0, y: 4 },
              { x: 0, y: 8 },
              { x: 1, y: Number.NaN },
              { x: 1, y: 6 },
            ],
          },
          { id: 'b', label: 'Second', points: [{ x: 1, y: 3 }] },
        ]}
      />
    </LabSection>
    <LabSection
      title="Custom drawing"
      description="A host's own drawing inside the shared frame, with the library's axis, legend, band scale and table view."
    >
      <CustomDrawing />
    </LabSection>
  </>,
);
