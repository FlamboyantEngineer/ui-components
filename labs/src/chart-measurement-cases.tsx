import { EventChart, type EventChartItem } from '../../src/components/chart/index.js';
import { LabSection } from './chrome/index.js';

const events: EventChartItem[] = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  label: 'Observation ' + (i + 1),
  start: Math.floor(i / 2) * 1e-6,
  ...(i % 3 === 0 ? { end: (Math.floor(i / 2) + 0.25) * 1e-6 } : {}),
}));

export function ChartMeasurementCases() {
  return (
    <LabSection
      title="Elapsed events"
      description="Arrow through the observations at each coordinate. The table includes the original numeric endpoints in seconds."
    >
      <EventChart
        label="Observation sequence"
        events={events}
        xLabel="Elapsed time"
        formatX={(x) => (x * 1e6).toFixed(2) + ' µs'}
      />
    </LabSection>
  );
}
