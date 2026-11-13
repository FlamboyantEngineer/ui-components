// The options every chart takes, driven from one set of controls: the view (chart or table), the
// summary shown or kept for assistive technology, the legend shown or not, and the hidden series
// held by the host. Beside them, each chart's own options: a bar chart's value and axis writers,
// tooltip, currency and series hidden at first, opening on its table; a heatmap's bounds, levels,
// cell size and number format; a scatter chart's height and axis bounds; and a legend that hides a
// series at first.

import { useState } from 'react';
import { Chart, type ChartView } from '../../src/components/chart/chart.js';
import {
  BarChart,
  type BarChartSeries,
  CalendarHeatmap,
  type CalendarHeatmapDay,
  ChartLegend,
  DonutChart,
  LineChart,
  type LineChartSeries,
  ScatterChart,
  type ScatterChartSeries,
} from '../../src/components/chart/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const sales: BarChartSeries[] = [
  { id: 'north', label: 'North', values: [1200, 1350, 1610, 1480] },
  { id: 'south', label: 'South', values: [940, 1020, 1180, 1300] },
];
const trend: LineChartSeries[] = [
  { id: 'north', label: 'North', points: quarters.map((x, index) => ({ x, y: 10 + index * 4 })) },
  { id: 'south', label: 'South', points: quarters.map((x, index) => ({ x, y: 18 - index * 2 })) },
];
const share = [
  { id: 'north', label: 'North', value: 56 },
  { id: 'south', label: 'South', value: 44 },
];
const spread: ScatterChartSeries[] = [
  {
    id: 'north',
    label: 'North',
    points: [
      { id: 'n1', x: 2, y: 4, label: 'Store 1' },
      { id: 'n2', x: 5, y: 7, label: 'Store 2' },
      { id: 'n3', x: 8, y: 9, label: 'Store 3' },
    ],
  },
  {
    id: 'south',
    label: 'South',
    points: [
      { id: 's1', x: 3, y: 2, label: 'Store 4' },
      { id: 's2', x: 6, y: 5, label: 'Store 5' },
    ],
  },
];
// Four weeks of daily values, every day of March 2026.
const days: CalendarHeatmapDay[] = Array.from({ length: 28 }, (_, index) => ({
  date: `2026-03-${String(index + 1).padStart(2, '0')}`,
  value: (index * 7) % 12,
}));

const euros: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
};

/** Every chart under the same controls. */
function SharedOptions() {
  const [view, setView] = useState<ChartView>('chart');
  const [summary, setSummary] = useState(false);
  const [legend, setLegend] = useState(true);
  const [hidden, setHidden] = useState<Set<Key>>(new Set());
  const shared = {
    view,
    onViewChange: setView,
    showSummary: summary,
    showLegend: legend,
  };
  const series = { hiddenKeys: hidden, onHiddenKeysChange: setHidden };
  return (
    <div data-lab-demo="shared-options">
      <Switch
        isSelected={view === 'table'}
        onChange={(table) => setView(table ? 'table' : 'chart')}
      >
        Tables
      </Switch>
      <Switch isSelected={summary} onChange={setSummary}>
        Show summaries
      </Switch>
      <Switch isSelected={legend} onChange={setLegend}>
        Show legends
      </Switch>
      <Switch
        isSelected={hidden.has('south')}
        onChange={(hide) => setHidden(hide ? new Set(['south']) : new Set())}
      >
        Hide South
      </Switch>
      <LabOutput name="view">{view}</LabOutput>
      <BarChart
        label="Sales by quarter"
        categories={quarters}
        series={sales}
        summary="North sells more than South in every quarter."
        {...shared}
        {...series}
      />
      <LineChart
        label="Orders by quarter"
        series={trend}
        summary="North rises while South falls."
        {...shared}
        {...series}
      />
      <DonutChart
        label="Share of sales"
        segments={share}
        summary="North holds just over half."
        {...shared}
        {...series}
      />
      <ScatterChart
        label="Size and sales"
        series={spread}
        summary="Larger stores sell more."
        {...shared}
        {...series}
      />
      <CalendarHeatmap
        label="Daily visits"
        days={days}
        summary="Visits cycle every twelve days."
        {...shared}
      />
    </div>
  );
}

export function ChartOptionsCases() {
  const [chartView, setChartView] = useState<ChartView>('table');
  return (
    <>
      <LabSection
        title="Options every chart takes"
        description="The view (chart or table), the summary shown or read only by assistive technology, the legend shown or not, and the series the host hides, applied to every chart at once."
      >
        <SharedOptions />
      </LabSection>
      <LabSection
        title="Each chart's own options"
        description="A bar chart in euros with its own value and axis writers and tooltip, opening on its table with South hidden; a heatmap with bounds, three levels, larger cells and a percent format; a scatter chart with fixed bounds and height; a legend hiding a series at first; and a host's chart frame opening on its table."
      >
        <div data-lab-demo="bar-formats">
          <BarChart
            label="Revenue"
            categories={quarters}
            series={sales}
            formatOptions={euros}
            formatValue={({ seriesLabel, value }) => `${seriesLabel}: ${String(value)} €`}
            formatAxisValue={(value) => `${String(value / 1000)}k`}
            renderTooltip={({ datum, value }) => (
              <strong>
                {datum.seriesLabel} · {value}
              </strong>
            )}
            defaultHiddenKeys={['south']}
            defaultView="table"
          />
        </div>
        <div data-lab-demo="heatmap-options">
          <CalendarHeatmap
            label="Occupancy"
            days={days.map((day) => ({ ...day, value: (day.value ?? 0) / 12 }))}
            minValue={0}
            maxValue={1}
            levels={3}
            cellSize={18}
            formatOptions={{ style: 'percent' }}
            showLegend={false}
            defaultView="chart"
          />
        </div>
        <div data-lab-demo="scatter-bounds">
          <ScatterChart
            label="Size and sales, fixed axes"
            series={spread}
            height={160}
            minX={0}
            maxX={10}
            minY={0}
            maxY={12}
          />
        </div>
        <div data-lab-demo="legend-default">
          <ChartLegend
            items={sales.map(({ id, label }) => ({ id, label }))}
            defaultHiddenKeys={['north']}
          />
        </div>
        <div data-lab-demo="frame-view">
          <Chart
            label="Host chart"
            summary="A host's drawing with its own table."
            view={chartView}
            onViewChange={setChartView}
            table={{ columns: ['Quarter', 'Value'], rows: quarters.map((q, i) => [q, String(i)]) }}
          >
            <svg width={120} height={40} role="img" aria-label="Host drawing" />
          </Chart>
          <LabOutput name="frame view">{chartView}</LabOutput>
        </div>
      </LabSection>
    </>
  );
}
