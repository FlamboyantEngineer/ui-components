import type { CSSProperties } from 'react';
import { Sparkline } from '../../src/components/sparkline/sparkline.js';
import { createLinearScale } from '../../src/utils/linear-scale.js';
import { createTimeScale } from '../../src/utils/time-scale.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const series = {
  rising: [2, 3, 3, 5, 4, 7, 8, 11],
  falling: [12, 10, 11, 7, 6, 6, 4, 3],
  flat: [5, 5, 5, 5, 5, 5, 5, 5],
  single: [6],
} as const;

const markerSets = {
  none: [],
  last: ['last'],
  'min max last': ['min', 'max', 'last'],
} as const;

const gapped = [4, 6, 5, Number.NaN, Number.NaN, 7, 9, 8, Number.NaN, 6];

const regions = [
  { name: 'North', visits: [40, 42, 47, 45, 52, 58, 61] },
  { name: 'South', visits: [12, 14, 13, 18, 17, 16, 21] },
  { name: 'East', visits: [80, 76, 71, 74, 70, 66, 64] },
];

const quarter = Array.from({ length: 13 }, (_, week) => 20 + Math.round(8 * Math.sin(week / 2)));

const cell: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const row: CSSProperties = { display: 'grid', gridTemplateColumns: '80px 140px 48px', gap: 12 };
const axis: CSSProperties = { position: 'relative', height: 20, width: 320, fontSize: 11 };

/** A wide sparkline with week and month ticks laid out by the scale utilities. */
function QuarterWithTicks() {
  const width = 320;
  const time = createTimeScale({
    domain: ['2026-01-05', '2026-03-30'],
    range: [3, width - 3],
    timeZone: 'UTC',
    locale: 'en-US',
  });
  const values = createLinearScale({
    domain: [0, Math.max(...quarter)],
    range: [0, 1],
    nice: true,
  });
  return (
    <div data-lab-demo="ticks">
      <Sparkline
        aria-label="Weekly orders, first quarter"
        values={quarter}
        variant="area"
        minValue={values.domain[0]}
        maxValue={values.domain[1]}
        width={width}
        height={48}
        markers={['max', 'last']}
      />
      <div style={axis} aria-hidden="true">
        {time.ticks({ unit: 'month' }).map((tick) => (
          <span
            key={tick.value}
            data-lab-tick={tick.value}
            style={{ position: 'absolute', left: tick.position }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <p>
        Value ticks:{' '}
        {values
          .ticks()
          .map((tick) => tick.label)
          .join(', ')}
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants and markers"
      description="Lines and areas with no markers, the last value marked, or the lowest, highest and last marked."
    >
      <StateMatrix
        axes={{
          variant: ['line', 'area'],
          markers: Object.keys(markerSets) as Array<keyof typeof markerSets>,
        }}
        render={({ variant, markers }) => (
          <Sparkline
            aria-label="Daily sign-ups"
            values={series.rising}
            variant={variant}
            markers={markerSets[markers]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Shapes"
      description="Rising, falling and flat series, a single value, a series with gaps and one with no values."
    >
      <StateMatrix
        axes={{ shape: [...(Object.keys(series) as Array<keyof typeof series>), 'gaps', 'empty'] }}
        render={({ shape }) => (
          <Sparkline
            aria-label={`${shape} series`}
            values={
              shape === 'gaps'
                ? gapped
                : shape === 'empty'
                  ? []
                  : series[shape as keyof typeof series]
            }
            variant="area"
            markers={['last']}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="One scale for a table"
      description="Rows on one shared range (0 to 100) so their heights compare, with the last value printed."
    >
      <div data-lab-demo="regions">
        {regions.map(({ name, visits }) => (
          <div key={name} style={row}>
            <span>{name}</span>
            <span style={cell}>
              <Sparkline
                aria-label={`${name} visits this week`}
                values={visits}
                minValue={0}
                maxValue={100}
                width={140}
                height={24}
                markers={['last']}
              />
            </span>
            <span>{visits.at(-1)}</span>
          </div>
        ))}
      </div>
    </LabSection>
    <LabSection
      title="Percent summary"
      description="Values formatted as percentages in the accessible summary."
    >
      <Sparkline
        aria-label="Conversion rate"
        values={[0.021, 0.034, 0.028, 0.041]}
        formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
        data-lab-demo="percent"
      />
    </LabSection>
    <LabSection
      title="Scale ticks"
      description="A wide area with month ticks from the time scale and nice value ticks from the linear scale."
    >
      <QuarterWithTicks />
    </LabSection>
  </>,
);
