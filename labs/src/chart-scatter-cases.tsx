import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ScatterChart, type ScatterChartSeries } from '../../src/components/chart/index.js';
import { LabSection } from './chrome/index.js';

/** Rainfall against yield for two fields; one plot's rainfall was not recorded. */
const fields: ScatterChartSeries[] = [
  {
    id: 'east',
    label: 'East field',
    points: [
      { id: 'e1', x: 12, y: 3.1, label: 'Plot 1' },
      { id: 'e2', x: 18, y: 4.2, label: 'Plot 2' },
      { id: 'e3', x: 25, y: 4.8, label: 'Plot 3' },
      { id: 'e4', x: 31, y: 5.6, label: 'Plot 4' },
      { id: 'e5', x: null, y: 4.4, label: 'Plot 5' },
    ],
  },
  {
    id: 'west',
    label: 'West field',
    tone: 'info',
    points: [
      { id: 'w1', x: 12, y: 3.1, label: 'Plot 6' },
      { id: 'w2', x: 22, y: 3.6, label: 'Plot 7' },
      { id: 'w3', x: 28, y: 5.1, label: 'Plot 8' },
      { id: 'w4', x: 35, y: 4.9, label: 'Plot 9' },
    ],
  },
];

function ScatterDemo() {
  const [shifted, setShifted] = useState(false);
  const series = shifted
    ? fields.map((entry) => ({
        ...entry,
        points: entry.points.map((point) => ({ ...point, y: (point.y ?? 0) + 0.5 })),
      }))
    : fields;
  return (
    <div data-lab-demo="scatter">
      <Button onPress={() => setShifted((value) => !value)}>
        {shifted ? 'Restore yields' : 'Raise yields'}
      </Button>
      <ScatterChart
        label="Rainfall and yield"
        series={series}
        xLabel="Rain (mm)"
        yLabel="Yield (t)"
        minY={0}
        formatOptions={{ maximumFractionDigits: 1 }}
        showSummary
      />
    </div>
  );
}

export function ChartScatterCases() {
  return (
    <LabSection
      title="Scatter chart"
      description="Independent observations on two numeric axes. Plots 1 and 6 share coordinates and stay two focusable points; Plot 5 has no rainfall and draws nothing but keeps its table row. Raise yields moves every point, which keeps its identity and focus."
    >
      <ScatterDemo />
    </LabSection>
  );
}
