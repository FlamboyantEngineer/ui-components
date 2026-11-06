import { useState } from 'react';
import {
  BarChart,
  type ChartReference,
  LineChart,
  type LineChartSeries,
  type LineChartX,
} from '../../src/components/chart/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const valueReferences: ChartReference[] = [
  { id: 'goal', label: 'Goal', value: 50, tone: 'success' },
  { id: 'usual', type: 'band', label: 'Usual range', from: 20, to: 35 },
  { id: 'stretch', label: 'Stretch goal', value: 500 },
];

const visits: LineChartSeries[] = [
  {
    id: 'visits',
    label: 'Visits',
    points: [
      { x: '2026-03-02', y: 120 },
      { x: '2026-03-09', y: 140 },
      { x: '2026-03-16', y: 90 },
      { x: '2026-03-23', y: 160 },
      { x: '2026-03-30', y: 150 },
    ],
  },
];
const visitLimit: ChartReference[] = [{ id: 'cap', label: 'Capacity', value: 150, tone: 'danger' }];
const closures: ChartReference<LineChartX>[] = [
  { id: 'works', type: 'band', label: 'Roadworks', from: '2026-03-12', to: '2026-03-19' },
  { id: 'launch', label: 'Launch', value: '2026-03-23', tone: 'info' },
];

function BarReferences() {
  const [isHorizontal, setHorizontal] = useState(false);
  return (
    <div data-lab-demo="bar-references">
      <Switch isSelected={isHorizontal} onChange={setHorizontal}>
        Horizontal bars
      </Switch>
      <BarChart
        label="Crates sold"
        categories={quarters}
        series={[{ id: 'crates', label: 'Crates', values: [42, 28, 61, 33] }]}
        orientation={isHorizontal ? 'horizontal' : 'vertical'}
        references={valueReferences}
        showSummary
      />
    </div>
  );
}

export function ChartReferencesCases() {
  return (
    <LabSection
      title="Reference lines and bands"
      description="A goal line and a usual-range band in data values, under the bars and lines, which still take hover and focus. The stretch goal is beyond the axis, so it draws nothing but stays in the summary; references never stretch the axis. The line chart also marks dates: a roadworks band and a launch line."
    >
      <BarReferences />
      <div data-lab-demo="line-references">
        <LineChart
          label="Weekly visits"
          series={visits}
          timeZone="UTC"
          references={visitLimit}
          xReferences={closures}
          showSummary
        />
      </div>
    </LabSection>
  );
}
