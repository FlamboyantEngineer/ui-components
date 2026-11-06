import { useState } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TimeZoneField } from '../../src/components/time-zone-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabForm } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const states = {
  empty: {},
  chosen: { defaultValue: 'Europe/Paris' },
  'read-only': { defaultValue: 'Asia/Tokyo', isReadOnly: true },
  disabled: { defaultValue: 'UTC', isDisabled: true },
  required: { isRequired: true },
  unknown: { defaultValue: 'Mars/Base', validationMode: 'immediate' },
} as const;

/** A host's supported zones, read in January and in July to show daylight saving time. */
const supported = [
  'America/Los_Angeles',
  'America/New_York',
  'America/St_Johns',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Australia/Adelaide',
  'Australia/Lord_Howe',
  'Pacific/Chatham',
  'UTC',
];

const seasons = {
  January: new Date('2028-01-15T12:00:00Z'),
  July: new Date('2028-07-15T12:00:00Z'),
};

function SupportedZones() {
  const [season, setSeason] = useState<keyof typeof seasons>('January');
  const [zone, setZone] = useState<string | null>('Australia/Lord_Howe');
  return (
    <div data-lab-demo="supported">
      <LabForm label="Office">
        <TimeZoneField
          label="Office zone"
          name="zone"
          zones={supported}
          referenceDate={seasons[season]}
          value={zone}
          onChange={setZone}
          isClearable
        />
      </LabForm>
      <SegmentedChoice
        aria-label="Reference month"
        options={[
          { value: 'January', label: 'January' },
          { value: 'July', label: 'July' },
        ]}
        value={season}
        onChange={(next) => setSeason(next as keyof typeof seasons)}
      />
      <LabOutput name="zone">{zone ?? 'none'}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and sizes"
      description="No zone yet, a chosen zone, read-only, disabled, required without a zone and an identifier the platform does not read, in every field size."
    >
      <StateMatrix
        axes={{
          state: Object.keys(states) as Array<keyof typeof states>,
          size: ['sm', 'md', 'lg'],
        }}
        render={({ state, size }) => <TimeZoneField label="Zone" size={size} {...states[state]} />}
      />
    </LabSection>
    <LabSection
      title="Supported zones and daylight saving time"
      description="A host's set of zones, including half- and quarter-hour offsets. Switch the reference month: New York, London, Paris, Adelaide, Lord Howe (half an hour) and Chatham move their offsets and their order. Type a name (India), an identifier (kolkata) or an offset (+05:45) to filter."
    >
      <SupportedZones />
    </LabSection>
    <LabSection
      title="Every platform zone"
      description="Without zones the field lists every zone the browser knows, virtualized, at the current instant by the provider's clock."
    >
      <TimeZoneField label="Meeting zone" defaultValue="America/Sao_Paulo" />
    </LabSection>
  </>,
);
