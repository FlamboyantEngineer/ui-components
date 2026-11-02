// Zoom Control case: fractional levels shown with a chosen number format in two locales.

import { useState } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { ZoomControl } from '../../src/components/zoom-control/zoom-control.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const levels = [33.33, 66.67, 100, 137.5, 200];

const formats = {
  exact: undefined,
  whole: { maximumFractionDigits: 0 },
  'one decimal': { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  words: { unitDisplay: 'long', maximumFractionDigits: 1 },
} as const satisfies Record<string, Intl.NumberFormatOptions | undefined>;
type FormatName = keyof typeof formats;
const formatNames = Object.keys(formats) as FormatName[];

const isFormatName = (value: unknown): value is FormatName =>
  typeof value === 'string' && Object.hasOwn(formats, value);

const locales = ['en-US', 'de-DE'] as const;

function LocaleZoom({ locale, format }: { locale: string; format: FormatName }) {
  const [zoom, setZoom] = useState(137.5);
  const [requests, setRequests] = useState<number[]>([]);
  return (
    <div data-lab-locale={locale}>
      <UiProvider locale={locale}>
        <ZoomControl
          aria-label={`Zoom, ${locale}`}
          levels={levels}
          value={zoom}
          formatOptions={formats[format]}
          onChange={(next) => {
            setZoom(next);
            setRequests((previous) => [...previous.slice(-3), next]);
          }}
        />
      </UiProvider>
      <LabOutput name="requests">{requests.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

function FormattedZoom() {
  const [format, setFormat] = useState<FormatName>('exact');
  return (
    <div data-lab-demo="formatted-zoom">
      <SegmentedChoice
        aria-label="Number format"
        size="sm"
        sizing="content"
        options={formatNames.map((name) => ({ value: name, label: name }))}
        value={format}
        onChange={(value) => {
          if (isFormatName(value)) setFormat(value);
        }}
      />
      {locales.map((locale) => (
        <LocaleZoom key={locale} locale={locale} format={format} />
      ))}
    </div>
  );
}

export function ZoomControlFormatCases() {
  return (
    <div data-lab-family="zoom-control-format-cases">
      <LabSection
        title="Formatted values"
        description="Fractional levels (33.33, 66.67, 100, 137.5 and 200 percent) in English and German. Number format passes formatOptions: exact by default, whole numbers, one decimal, or the unit in words. The value and the slider's spoken value use the same text, while the requests stay raw percentages."
      >
        <FormattedZoom />
      </LabSection>
    </div>
  );
}
