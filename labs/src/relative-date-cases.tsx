// Relative date field cases: time zones near midnight, the absolute cutoff, and open state.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { DateRangeValue } from '../../src/components/date-time-field/index.js';
import { RelativeDateField } from '../../src/components/relative-date-field/relative-date-field.js';
import { StateMatrix } from './chrome/index.js';
import { MountOnDemand } from './lab-form.js';
import { useHostOpen } from './lab-open-state.js';
import { LabOutput } from './lab-output.js';

/** A fixed clock, as in the rest of the lab. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

/** 23:30 UTC on 20 April 2026: still the 20th in New York, already the 21st in Tokyo. */
const nearMidnight = () => new Date(Date.UTC(2026, 3, 20, 23, 30));

const zones = { 'New York': 'America/New_York', Tokyo: 'Asia/Tokyo' } as const;
type ZoneName = keyof typeof zones;

const describe = (value: string | DateRangeValue | null) =>
  value === null ? 'none' : typeof value === 'string' ? value : `${value.start} to ${value.end}`;

/**
 * One instant read in two zones with different calendar days: the same date reads as today in
 * one and tomorrow in the other, and a preset commits that zone's day.
 */
export function ZonedNow() {
  const [zone, setZone] = useState<ZoneName>('New York');
  const [committed, setCommitted] = useState('none');
  return (
    <div data-lab-demo="zoned-now">
      <p>
        {(Object.keys(zones) as ZoneName[]).map((name) => (
          <Button key={name} size="sm" onPress={() => setZone(name)}>
            {`Read in ${name}`}
          </Button>
        ))}
      </p>
      <RelativeDateField
        label={`Due, read in ${zone}`}
        getNow={nearMidnight}
        timeZone={zones[zone]}
        defaultValue="2026-04-21"
        onCommit={(value) => setCommitted(describe(value))}
      />
      <LabOutput name="Zone">{zones[zone]}</LabOutput>
      <LabOutput name="Zoned commit">{committed}</LabOutput>
    </div>
  );
}

const cutoffs = ['3', '4', '5'] as const;

/**
 * A date and a range four days away against cutoffs either side of four: from the cutoff on,
 * values read as absolute dates; nearer ones read relative to now.
 */
export function Cutoffs() {
  return (
    <StateMatrix
      axes={{ cutoff: cutoffs }}
      render={({ cutoff }) => (
        <>
          <RelativeDateField
            label={`In four days, cutoff ${cutoff}`}
            getNow={getNow}
            fallbackAfterDays={Number(cutoff)}
            defaultValue="2026-04-24"
          />
          <RelativeDateField
            label={`Range ending in four days, cutoff ${cutoff}`}
            mode="date-range"
            getNow={getNow}
            fallbackAfterDays={Number(cutoff)}
            defaultValue={{ start: '2026-04-20', end: '2026-04-24' }}
          />
        </>
      )}
    />
  );
}

/**
 * The host holds whether the presets are open (see `useHostOpen`): its buttons open, close and
 * lock the field, and each request the field makes (the trigger, Escape, a pick) shows first.
 * Clearing the value shows the field's own placeholder.
 */
export function HostOpen() {
  const host = useHostOpen('due date');
  const [value, setValue] = useState<string | null>('2026-04-21');
  return (
    <div data-lab-demo="host-open">
      <RelativeDateField
        label="Host-opened due date"
        getNow={getNow}
        placeholder="No due date"
        value={value}
        onChange={setValue}
        {...host.props}
      />
      {host.panel}
      <Button size="sm" onPress={() => setValue(null)}>
        Clear the due date
      </Button>
      <LabOutput name="Due value">{value ?? 'none'}</LabOutput>
    </div>
  );
}

/** Presets open from the first render, uncontrolled; the reader closes them as usual. */
export function InitiallyOpen() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <MountOnDemand label="an initially open due date">
      <RelativeDateField
        label="Open at first"
        getNow={getNow}
        defaultOpen
        onOpenChange={(next) => setChanges((list) => [...list, next ? 'open' : 'close'])}
      />
      <LabOutput name="Open at first">{changes.join(', ') || 'none'}</LabOutput>
    </MountOnDemand>
  );
}
