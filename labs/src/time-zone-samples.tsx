import { useState, type ReactNode } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { UiProvider } from '../../src/core/provider.js';

/**
 * A fixed instant half an hour before midnight UTC. Against it, `nearMidnightInstant` is 25½ hours
 * earlier: yesterday in UTC and Los Angeles, but two days ago in London, where the value falls just
 * before one midnight and now just after the next.
 */
export const getNearMidnightNow = () => new Date('2026-04-20T23:30:00Z');

export const nearMidnightInstant = '2026-04-19T22:00:00Z';

/** A date with no time: the same calendar day in every zone, whatever zone reads it. */
export const nearMidnightDate = '2026-04-19';

export const zoneNames = {
  UTC: 'UTC',
  London: 'Europe/London',
  'Los Angeles': 'America/Los_Angeles',
} as const;

export type ZoneLabel = keyof typeof zoneNames;

const zoneLabels = Object.keys(zoneNames) as ZoneLabel[];

const isZoneLabel = (value: unknown): value is ZoneLabel =>
  typeof value === 'string' && Object.hasOwn(zoneNames, value);

/** The override's choices: none, inheriting the provider, or one of the sample zones. */
const overrideOptions = [
  { value: 'none', label: 'None' },
  ...zoneLabels.map((label) => ({ value: label, label })),
];

export interface ZoneChoices {
  /** The provider's zone. */
  providerZone: string;
  /** The component's own zone, or undefined to inherit the provider's. */
  timeZone: string | undefined;
  /** The zone that wins: the override, else the provider's. */
  effectiveZone: string;
}

/**
 * A provider zone and a per-component override, both chosen by the reader, around content that
 * reads the chosen zones. The content renders inside a provider set to the chosen provider zone.
 */
export function ZoneComparison({ children }: { children: (zones: ZoneChoices) => ReactNode }) {
  const [provider, setProvider] = useState<ZoneLabel>('UTC');
  const [override, setOverride] = useState<ZoneLabel | 'none'>('none');
  const providerZone = zoneNames[provider];
  const timeZone = override === 'none' ? undefined : zoneNames[override];
  const effectiveZone = timeZone ?? providerZone;
  return (
    <div data-lab-demo="time-zones">
      <SegmentedChoice
        aria-label="Provider time zone"
        size="sm"
        sizing="content"
        options={zoneLabels.map((label) => ({ value: label, label }))}
        value={provider}
        onChange={(value) => {
          if (isZoneLabel(value)) setProvider(value);
        }}
      />{' '}
      <SegmentedChoice
        aria-label="Override time zone"
        size="sm"
        sizing="content"
        options={overrideOptions}
        value={override}
        onChange={(value) => {
          if (value === 'none' || isZoneLabel(value)) setOverride(value);
        }}
      />
      <p>
        Read in: <output data-lab-output="zone">{effectiveZone}</output>
      </p>
      <UiProvider timeZone={providerZone}>
        {children({ providerZone, timeZone, effectiveZone })}
      </UiProvider>
    </div>
  );
}
