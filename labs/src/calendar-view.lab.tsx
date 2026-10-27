import { useState, type CSSProperties } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import {
  CalendarView,
  type CalendarViewDay,
  type CalendarViewEvent,
  type CalendarViewMode,
} from '../../src/components/calendar-view/calendar-view.js';
import { UiProvider } from '../../src/core/provider.js';
import { fr } from '../../src/core/locales/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

/** A fixed clock, so today reads the same on every day: 18 March 2026, 10:30. */
const getNow = () => new Date(Date.UTC(2026, 2, 18, 10, 30));

const frame = (width: number): CSSProperties => ({ width, maxWidth: '100%' });

const events: CalendarViewEvent[] = [
  { id: 'trip', title: 'Trip to Lisbon', start: '2026-03-12', end: '2026-03-17', tone: 'info' },
  { id: 'fair', title: 'Trade fair', start: '2026-03-24', end: '2026-03-26', tone: 'warning' },
  { id: 'planning', title: 'Planning', start: '2026-03-16T09:00', end: '2026-03-16T10:30' },
  { id: 'lunch', title: 'Team lunch', start: '2026-03-18T12:00', end: '2026-03-18T13:00' },
  { id: 'review', title: 'Design review', start: '2026-03-18T12:30', end: '2026-03-18T14:00' },
  { id: 'call', title: 'Supplier call', start: '2026-03-18T16:00', end: '2026-03-18T16:30' },
  { id: 'release', title: 'Release 2.4', start: '2026-03-20', tone: 'success' },
  {
    id: 'audit',
    title: 'Audit',
    start: '2026-03-19T08:00',
    end: '2026-03-19T11:00',
    tone: 'danger',
  },
  { id: 'night', title: 'Maintenance window', start: '2026-03-19T22:00', end: '2026-03-20T02:00' },
  { id: 'demo', title: 'Demo', start: '2026-03-05T15:00', end: '2026-03-05T16:00' },
  { id: 'dentist', title: 'Dentist', start: '2026-03-27T08:30', end: '2026-03-27T09:15' },
];

const crowded: CalendarViewEvent[] = [
  ...events,
  { id: 1, title: 'Standup', start: '2026-03-18T09:00', end: '2026-03-18T09:15' },
  { id: '1', title: 'Interview', start: '2026-03-18T11:00', end: '2026-03-18T12:00' },
  { id: 'retro', title: 'Retrospective', start: '2026-03-18T15:00', end: '2026-03-18T16:00' },
];

const holidays = new Set(['2026-03-17', '2026-04-03']);

function renderWorkload(day: CalendarViewDay) {
  if (holidays.has(day.date)) {
    return (
      <Badge tone="success" size="sm">
        Holiday
      </Badge>
    );
  }
  return day.events.length >= 3 ? `${day.events.length} events` : null;
}

const states = {
  events: { events, maxEvents: 3 },
  crowded: { events: crowded, maxEvents: 3 },
  empty: { events: [], maxEvents: 3 },
} as const;

function InteractiveCalendar() {
  const [date, setDate] = useState('2026-03-18');
  const [view, setView] = useState<CalendarViewMode>('month');
  const [opened, setOpened] = useState('No event opened');
  return (
    <div style={frame(900)} data-lab-demo="interactive">
      <CalendarView
        events={crowded}
        timeZone="UTC"
        getNow={getNow}
        date={date}
        onDateChange={setDate}
        view={view}
        onViewChange={setView}
        onEventAction={(key) => setOpened(`Opened ${String(key)}`)}
        renderDay={renderWorkload}
      />
      <output data-lab-output>{`${date}, ${view}. ${opened}`}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The month and week views with events, with a crowded day and empty. Week events follow elapsed time and clip at midnight when they continue into another day. The crowded cases include distinct numeric and text event keys with the same spelling. The clock is fixed at 18 March 2026, 10:30 UTC."
    >
      <StateMatrix
        axes={{
          state: Object.keys(states) as Array<keyof typeof states>,
          view: ['month', 'week'] as const,
        }}
        render={({ state, view }) => (
          <div style={frame(620)}>
            <CalendarView
              events={states[state].events}
              maxEvents={states[state].maxEvents}
              timeZone="UTC"
              getNow={getNow}
              defaultDate="2026-03-18"
              defaultView={view}
              views={[view]}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Navigation and events"
      description="Move by month or week, back to today and between views; arrow keys, Home, End, PageUp and PageDown move between days. Press an event to open it, or +n more to list a crowded day. Each day shows its workload or a holiday."
    >
      <InteractiveCalendar />
    </LabSection>
    <LabSection
      title="Week starting Monday"
      description="A French locale and strings: the week starts on Monday, and days, months, times and controls read in French."
    >
      <div style={frame(900)} data-lab-demo="locale" lang="fr">
        <UiProvider locale="fr-FR" messages={fr}>
          <CalendarView
            events={events}
            timeZone="UTC"
            getNow={getNow}
            defaultDate="2026-03-18"
            defaultView="week"
          />
        </UiProvider>
      </div>
    </LabSection>
  </>,
);
