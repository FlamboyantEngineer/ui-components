import { useState } from 'react';
import { LineChart, type LineChartSeries } from '../../src/components/chart/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

/** A day of readings every few seconds: 20 000 values with a spike and a gap. */
const readings: LineChartSeries[] = [
  {
    id: 'load',
    label: 'Load',
    points: Array.from({ length: 20_000 }, (_, index) => ({
      x: index,
      y:
        index === 12_345
          ? 250
          : index >= 9_000 && index < 9_400
            ? null
            : 50 + 30 * Math.sin(index / 400) + (index % 13),
    })),
  },
];

function DenseSeries() {
  const [downsample, setDownsample] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  return (
    <div data-lab-demo="dense-series">
      <Switch isSelected={downsample} onChange={setDownsample}>
        Downsample
      </Switch>
      <Switch isSelected={showSummary} onChange={setShowSummary}>
        Show summary
      </Switch>
      <LineChart
        label="Load over a day"
        series={readings}
        downsample={downsample}
        showSummary={showSummary}
        formatOptions={{ maximumFractionDigits: 0 }}
      />
    </div>
  );
}

export function ChartDenseCases() {
  return (
    <LabSection
      title="Dense series"
      description="20 000 values. Downsample draws each pixel column's first, lowest, highest and last value, so the spike and the gap stay while a few thousand points draw; turn it off to draw every value. Show summary renders the frame again without redrawing the plot, and the table, built only when shown, lists every value."
    >
      <DenseSeries />
    </LabSection>
  );
}
