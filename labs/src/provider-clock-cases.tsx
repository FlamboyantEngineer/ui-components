import { useState } from 'react';
import { UiProvider } from '../../src/core/provider.js';
import { useToday } from '../../src/core/clock.js';
import { ActivityFeed } from '../../src/components/activity-feed/activity-feed.js';
import { RelativeDateField } from '../../src/components/relative-date-field/relative-date-field.js';
import { RelativeTime } from '../../src/components/relative-time/relative-time.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';

// Half past eleven at night in UTC: already tomorrow in Tokyo, still this evening in New York.
const fixedNow = new Date('2026-10-31T23:30:00Z');
const getNow = () => fixedNow;

const zones = ['UTC', 'Asia/Tokyo', 'America/New_York'] as const;

const entries = [
  { id: 'water', action: 'Watered the beds', time: '2026-10-31T22:00:00Z' },
  { id: 'seed', action: 'Sowed the peas', time: '2026-10-31' },
];

function ZoneReadout() {
  return <output data-lab-output="today">{useToday()}</output>;
}

/** One provider clock and zone read by every component below it; the zone choice switches it. */
export function ProviderClock() {
  const [zone, setZone] = useState<string>('UTC');
  return (
    <>
      <SegmentedChoice
        aria-label="Time zone"
        options={zones.map((value) => ({ value, label: value }))}
        value={zone}
        onChange={(value) => {
          if (value !== null) setZone(value);
        }}
      />
      <UiProvider getNow={getNow} timeZone={zone}>
        <p>
          Today: <ZoneReadout />. Watered the beds{' '}
          <RelativeTime value="2026-10-31T22:00:00Z" data-lab-time="watered" />.
        </p>
        <RelativeDateField label="Harvest" defaultValue="2026-11-01" data-lab-field="harvest" />
        <ActivityFeed aria-label="Garden log" items={entries} />
      </UiProvider>
    </>
  );
}
