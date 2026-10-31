import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  RelativeTime,
  type RelativeTimePrecision,
  type RelativeTimeStyle,
  type RelativeTimeUnitStyle,
} from '../../src/components/relative-time/relative-time.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

/** A fixed clock, so every label in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

/** A local moment as a UTC ISO text, as a server would send it. */
function instant(day: number, hours: number, minutes: number, seconds = 0): string {
  return new Date(2026, 3, day, hours, minutes, seconds).toISOString();
}

const samples = {
  seconds: instant(20, 10, 29, 48),
  minutes: instant(20, 10, 18),
  hours: instant(20, 7, 5),
  'in hours': instant(20, 13, 45),
  yesterday: '2026-04-19',
  'days ago': '2026-04-16',
  'in days': '2026-04-23',
  absolute: '2026-02-03',
} as const;

/** Instants near the fixed clock, where the two precisions read differently. */
const nearSamples = {
  'just now': instant(20, 10, 29, 48),
  '100 seconds ago': instant(20, 10, 28, 20),
  '25 minutes ago': instant(20, 10, 4, 40),
  'in 40 seconds': instant(20, 10, 30, 40),
} as const;

/** 01:44:30 EDT in New York on the night the hour from 01:00 to 02:00 repeats. */
const getRepeatedHourNow = () => new Date('2026-11-01T05:44:30Z');
const repeatedHour = {
  'second 01:30 (offset)': '2026-11-01T01:30:00-05:00',
  'second 01:30 (UTC)': '2026-11-01T06:30:00Z',
  'second 01:30 (zone)': '2026-11-01T01:30:00-05:00[America/New_York]',
  'first 01:30 (offset)': '2026-11-01T01:30:00-04:00',
} as const;

const precisions: readonly RelativeTimePrecision[] = ['minute', 'second'];

const unitStyles: readonly RelativeTimeUnitStyle[] = ['long', 'short', 'narrow'];

const styles: readonly RelativeTimeStyle[] = ['full', 'long', 'medium', 'short'];

/** A timestamp stamped on the real clock in both precisions, which tick on from `Now`. */
function LiveStamp() {
  const [stamp, setStamp] = useState(() => new Date().toISOString());
  return (
    <div>
      {precisions.map((precision) => (
        <p key={precision}>
          Last saved{' '}
          <RelativeTime
            value={stamp}
            precision={precision}
            capitalize={false}
            data-lab-time={precision}
          />{' '}
          ({precision} precision).
        </p>
      ))}
      <Button size="sm" onPress={() => setStamp(new Date().toISOString())}>
        Save now
      </Button>
    </div>
  );
}

/** A clock stopped exactly one minute before the value, where the words would change next. */
function FrozenClock() {
  const reads = useRef(0);
  const [count, setCount] = useState<number | null>(null);
  const getFrozenNow = () => {
    reads.current += 1;
    return new Date(2026, 3, 20, 10, 30);
  };
  return (
    <div data-lab-demo="frozen-clock">
      <p>
        Due <RelativeTime value={instant(20, 10, 31)} getNow={getFrozenNow} showTooltip={false} />
      </p>
      <Button size="sm" onPress={() => setCount(reads.current)}>
        Count clock reads
      </Button>{' '}
      <output data-lab-output="reads">{count ?? 'not counted'}</output>
    </div>
  );
}

function SharedClock() {
  const [stamp] = useState(() => new Date().toISOString());
  const [isVisible, setVisible] = useState(true);
  return (
    <div data-lab-demo="shared-clock">
      <Button size="sm" onPress={() => setVisible(!isVisible)}>
        {isVisible ? 'Remove timestamps' : 'Mount timestamps'}
      </Button>
      {isVisible ? (
        <ul>
          {Array.from({ length: 20 }, (_, index) => (
            <li key={index}>
              Entry {index + 1}: <RelativeTime value={stamp} showTooltip={false} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Relative words"
      description="Values against a clock fixed at 20 April 2026, 10:30: Now for the first minute, then minutes and hours within a day, days within a week, then the absolute date. Mid-sentence keeps the words Intl gives."
    >
      <StateMatrix
        axes={{
          value: Object.keys(samples) as (keyof typeof samples)[],
          casing: ['label', 'mid-sentence'],
        }}
        render={({ value, casing }) => (
          <RelativeTime value={samples[value]} getNow={getNow} capitalize={casing === 'label'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Precision"
      description="The default minute precision reads Now for the first minute, then whole elapsed minutes. Second precision counts live seconds and rounds minutes."
    >
      <StateMatrix
        axes={{
          value: Object.keys(nearSamples) as (keyof typeof nearSamples)[],
          precision: precisions,
        }}
        render={({ value, precision }) => (
          <RelativeTime value={nearSamples[value]} getNow={getNow} precision={precision} />
        )}
      />
    </LabSection>
    <LabSection
      title="Unit styles"
      description="How the words spell their units, as Intl gives them for the locale: long by default, short or narrow for dense places."
    >
      <StateMatrix
        axes={{ value: ['seconds', 'minutes', 'in hours'] as const, unitStyle: unitStyles }}
        render={({ value, unitStyle }) => (
          <RelativeTime
            value={samples[value]}
            getNow={getNow}
            precision="second"
            unitStyle={unitStyle}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Absolute styles"
      description="A date and time far enough away to read as its absolute date, in every date and time style. Hover a relative time above to see the default styles in its tooltip."
    >
      <StateMatrix
        axes={{ dateStyle: styles, timeStyle: styles }}
        render={({ dateStyle, timeStyle }) => (
          <RelativeTime
            value={instant(3, 16, 5)}
            getNow={getNow}
            dateStyle={dateStyle}
            timeStyle={timeStyle}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Tooltip and fallback"
      description="The absolute date in a tooltip on hover and keyboard focus; none when switched off or when the text is already absolute. A shorter fallback reads dates as absolute sooner."
    >
      <StateMatrix
        axes={{
          tooltip: ['shown', 'off'],
          fallback: ['7 days', '2 days'],
        }}
        render={({ tooltip, fallback }) => (
          <RelativeTime
            value="2026-04-16"
            getNow={getNow}
            showTooltip={tooltip === 'shown'}
            fallbackAfterDays={fallback === '7 days' ? 7 : 2}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Repeated daylight saving hour"
      description="Against 01:44 EDT on the night New York repeats an hour, each spelling of 01:30 EST keeps its instant: 45 minutes ahead. In other time zones the same instants read in local time."
    >
      <StateMatrix
        axes={{ value: Object.keys(repeatedHour) as Array<keyof typeof repeatedHour> }}
        render={({ value }) => (
          <RelativeTime
            value={repeatedHour[value]}
            getNow={getRepeatedHourNow}
            timeStyle="long"
            dateStyle="short"
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Missing values"
      description="A missing or unreadable value shows the placeholder, or nothing without one."
    >
      <StateMatrix
        axes={{ value: ['empty', 'unreadable'], placeholder: ['never', 'none'] }}
        render={({ value, placeholder }) => (
          <span>
            Last run:{' '}
            <RelativeTime
              value={value === 'empty' ? null : 'whenever'}
              placeholder={placeholder === 'never' ? 'never' : undefined}
              capitalize={false}
            />
          </span>
        )}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Stamped on the real clock: it reads now, then seconds and minutes ago, updating on one timer shared by every timestamp on the page."
    >
      <LiveStamp />
    </LabSection>
    <LabSection
      title="Frozen clock"
      description="A fixed clock stopped exactly at a boundary where the words would change. The timestamp wakes at most once to find the clock unmoved, then waits for a new render instead of waking again every millisecond."
    >
      <FrozenClock />
    </LabSection>
    <LabSection
      title="Shared clock"
      description="A batch of timestamps shares the same deadline and timer. Remove and remount them while the clock runs."
    >
      <SharedClock />
    </LabSection>
  </>,
);
