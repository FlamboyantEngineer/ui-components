import {
  type ChartDatum,
  type ChartTooltipContext,
  LineChart,
  type LineChartSeries,
  type LineChartX,
} from '../../src/components/chart/index.js';
import { LabSection } from './chrome/index.js';

/** A day of a room: energy used in watt-hours and the share of seats taken. */
const room: LineChartSeries[] = [
  {
    id: 'energy',
    label: 'Energy',
    points: [
      { x: '2026-03-02T08:00:00Z', y: 1200 },
      { x: '2026-03-02T10:00:00Z', y: 4800 },
      { x: '2026-03-02T12:00:00Z', y: 6100 },
      { x: '2026-03-02T14:00:00Z', y: 5200 },
    ],
  },
  {
    id: 'seats',
    label: 'Seats taken',
    tone: 'info',
    points: [
      { x: '2026-03-02T08:00:00Z', y: 900 },
      { x: '2026-03-02T10:00:00Z', y: 3400 },
      { x: '2026-03-02T12:00:00Z', y: 5000 },
      { x: '2026-03-02T14:00:00Z', y: 2600 },
    ],
  },
];

const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });

/** Energy in kilowatt-hours with one decimal; seats as a share of 5,000. */
function writeValue(datum: ChartDatum<LineChartX>): string {
  return datum.seriesId === 'energy'
    ? `${(datum.value / 1000).toFixed(1)} kWh`
    : `${Math.round((datum.value / 5000) * 100)}% of seats`;
}

function RoomTooltip({ datum, value, at }: ChartTooltipContext<LineChartX>) {
  return (
    <span data-lab-tooltip="room">
      <strong>{datum.seriesLabel}</strong> at {at}: {value}
    </span>
  );
}

export function ChartFormatCases() {
  return (
    <LabSection
      title="Value formatters and custom tooltips"
      description="Each series writes its own unit in point names, tooltips and the table (kWh for energy, a share for seats), while the axis writes compact numbers. The tooltip's content is the host's, from the same datum whether a point is hovered or focused."
    >
      <div data-lab-demo="chart-format">
        <LineChart
          label="Room use"
          series={room}
          timeZone="UTC"
          formatValue={writeValue}
          formatAxisValue={(value) => compact.format(value)}
          renderTooltip={(context) => <RoomTooltip {...context} />}
        />
      </div>
    </LabSection>
  );
}
