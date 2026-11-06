import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CalendarHeatmap, type CalendarHeatmapDay } from '../../src/components/chart/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

const dayLength = 86_400_000;

/**
 * Daily counts over a quarter from `first`: quiet weekends, a missing reading every 17th day,
 * no entry every 23rd day, and one outlier above the scale's bound.
 */
function makeDays(first: string, length: number, seed: number): CalendarHeatmapDay[] {
  const start = Date.parse(`${first}T00:00:00Z`);
  const days: CalendarHeatmapDay[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    if (offset % 23 === 22) continue;
    const date = new Date(start + offset * dayLength).toISOString().slice(0, 10);
    const weekday = new Date(start + offset * dayLength).getUTCDay();
    const base = weekday === 0 || weekday === 6 ? 1 : 6;
    const value = offset % 17 === 16 ? null : base + ((offset * 7 + seed) % 11);
    days.push({ date, value: offset === 40 ? 48 : value });
  }
  return days;
}

const quarters = [
  { start: '2028-01-01', end: '2028-03-31', days: makeDays('2028-01-01', 91, 3) },
  { start: '2028-04-01', end: '2028-06-30', days: makeDays('2028-04-01', 91, 5) },
];

function HeatmapDemo() {
  const [quarter, setQuarter] = useState(0);
  const [mondays, setMondays] = useState(true);
  const shown = quarters[quarter] ?? quarters[0];
  return (
    <div data-lab-demo="calendar-heatmap">
      <Switch isSelected={mondays} onChange={setMondays}>
        Weeks start on Monday
      </Switch>
      <Button onPress={() => setQuarter((value) => 1 - value)}>
        {quarter === 0 ? 'Next quarter' : 'Previous quarter'}
      </Button>
      <CalendarHeatmap
        label="Daily sign-ins"
        days={shown?.days ?? []}
        start={shown?.start}
        end={shown?.end}
        firstDayOfWeek={mondays ? 'mon' : 'sun'}
        maxValue={20}
        showSummary
      />
    </div>
  );
}

export function ChartHeatmapCases() {
  return (
    <LabSection
      title="Calendar heatmap"
      description="A quarter of daily counts, a week per column. Zero, missing readings (dashed) and days with no entry (faded) are told apart in names, the tooltip, the legend and the table; 29 February sits in its own week. The value 48 lies above the bound of 20 and draws at the top level. The arrow keys move by day (up and down) and by week (left and right)."
    >
      <HeatmapDemo />
    </LabSection>
  );
}
