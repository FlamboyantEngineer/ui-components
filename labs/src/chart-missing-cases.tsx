import { useState } from 'react';
import { LineChart, type LineChartSeries } from '../../src/components/chart/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

/** Hourly readings as JSON gives them, with `null` where a sensor sent nothing. */
const readings: LineChartSeries[] = [
  {
    id: 'north',
    label: 'North sensor',
    points: [
      { x: '2026-03-02T06:00:00Z', y: 4 },
      { x: '2026-03-02T07:00:00Z', y: 6 },
      { x: '2026-03-02T08:00:00Z', y: null },
      { x: '2026-03-02T09:00:00Z', y: null },
      { x: '2026-03-02T10:00:00Z', y: 9 },
      { x: '2026-03-02T11:00:00Z', y: 7 },
    ],
  },
  {
    id: 'south',
    label: 'South sensor',
    tone: 'info',
    points: [
      { x: '2026-03-02T06:00:00Z', y: -3 },
      { x: '2026-03-02T07:00:00Z', y: null },
      { x: '2026-03-02T08:00:00Z', y: -1 },
      { x: '2026-03-02T09:00:00Z', y: 2 },
      { x: '2026-03-02T10:00:00Z', y: null },
      { x: '2026-03-02T11:00:00Z', y: 3 },
    ],
  },
];

function MissingValues() {
  const [connects, setConnects] = useState(false);
  return (
    <div data-lab-demo="missing-values">
      <Switch isSelected={connects} onChange={setConnects}>
        Connect missing values
      </Switch>
      <LineChart
        label="Sensor readings"
        series={readings}
        variant="area"
        timeZone="UTC"
        connectsMissing={connects}
        showSummary
      />
    </div>
  );
}

export function ChartMissingCases() {
  return (
    <LabSection
      title="Missing values"
      description="Values given as null break the lines and areas, draw no point, are skipped by the arrow keys and leave blank table cells; they never count as zero. Connect missing values draws straight across the gaps."
    >
      <MissingValues />
    </LabSection>
  );
}
