import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  RelativeTime,
  type RelativeTimeStyle,
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

const styles: readonly RelativeTimeStyle[] = ['full', 'long', 'medium', 'short'];

/** A timestamp stamped on the real clock, which ticks on from `Now`. */
function LiveStamp() {
  const [stamp, setStamp] = useState(() => new Date().toISOString());
  return (
    <p>
      Last saved <RelativeTime value={stamp} capitalize={false} data-lab-time="live" />.{' '}
      <Button size="sm" onPress={() => setStamp(new Date().toISOString())}>
        Save now
      </Button>
    </p>
  );
}

mountLab(
  <>
    <LabSection
      title="Relative words"
      description="Values against a clock fixed at 20 April 2026, 10:30: seconds, minutes and hours within a day, days within a week, then the absolute date. Mid-sentence keeps the words Intl gives."
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
  </>,
);
