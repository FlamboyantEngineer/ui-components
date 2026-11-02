import { useRef, useState, type CSSProperties } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import {
  CalendarView,
  type CalendarViewDay,
  type CalendarViewEvent,
  type CalendarViewMode,
} from '../../src/components/calendar-view/calendar-view.js';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import type { CalendarEventMenuEntry } from '../../src/components/calendar-view/index.js';
import type { Key } from '../../src/core/props.js';
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

const editable: CalendarViewEvent[] = [
  ...crowded.map((event) =>
    event.id === 'release' ? { ...event, title: 'Release 2.4 (locked)', isReadOnly: true } : event,
  ),
];

const editMenu: CalendarEventMenuEntry[] = [
  'edit',
  { id: 'duplicate', label: 'Duplicate' },
  { type: 'separator', id: 'host-actions' },
  { id: 'delete', label: 'Delete' },
];

/**
 * A host that owns its events and applies every change: Edit opens the editor, Duplicate and
 * Delete are its own entries, and a button removes Design review two seconds later, so the reader can
 * open its menu or editor first.
 */
function EditableCalendar() {
  const [items, setItems] = useState(editable);
  const [view, setView] = useState<CalendarViewMode>('month');
  const [log, setLog] = useState('No change yet');
  const copies = useRef(0);
  const act = (key: Key, event: CalendarViewEvent) => {
    if (key === 'duplicate') {
      copies.current += 1;
      const id = `${String(event.id)}-copy-${copies.current}`;
      setItems((current) => [...current, { ...event, id, title: `${event.title} (copy)` }]);
    }
    if (key === 'delete') setItems((current) => current.filter((item) => item.id !== event.id));
    setLog(`${String(key)} on ${event.title}`);
  };
  return (
    <div style={frame(900)} data-lab-demo="editing">
      <p>
        <Button
          size="sm"
          onPress={() =>
            window.setTimeout(
              () => setItems((current) => current.filter((item) => item.id !== 'review')),
              2000,
            )
          }
        >
          Remove Design review in two seconds
        </Button>
      </p>
      <CalendarView
        events={items}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-18"
        view={view}
        onViewChange={setView}
        eventMenu={editMenu}
        onEventMenuAction={act}
        onEventChange={(next, previous) => {
          setItems((current) => current.map((item) => (item.id === previous.id ? next : item)));
          setLog(`Saved ${next.title}: ${next.start} to ${next.end ?? next.start}`);
        }}
      />
      <output data-lab-output>{log}</output>
    </div>
  );
}

const draggable: CalendarViewEvent[] = [
  { id: 'standup', title: 'Standup', start: '2026-11-02T09:00', end: '2026-11-02T09:30' },
  { id: 'night-shift', title: 'Night shift', start: '2026-10-31T22:00', end: '2026-11-01T06:00' },
  { id: 'offsite', title: 'Offsite', start: '2026-11-03', end: '2026-11-05', tone: 'info' },
  {
    id: 'fixed',
    title: 'Fixed-length review',
    start: '2026-11-04T13:00',
    end: '2026-11-04T14:00',
    tone: 'warning',
  },
  {
    id: 'locked',
    title: 'Locked audit',
    start: '2026-11-05T10:00',
    end: '2026-11-05T11:30',
    tone: 'danger',
    isReadOnly: true,
  },
  { id: 'deadline', title: 'Deadline', start: '2026-11-06' },
];

/**
 * Editable events in New York, the week the clocks go back: each moves by its handle and resizes
 * by its end, except the read-only Locked audit and Fixed-length review, which only moves.
 */
function DraggableCalendar() {
  const [items, setItems] = useState(draggable);
  const [log, setLog] = useState('No change yet');
  return (
    <div style={frame(900)} data-lab-demo="dragging">
      <CalendarView
        events={items}
        timeZone="America/New_York"
        getNow={getNow}
        defaultDate="2026-11-02"
        defaultView="week"
        canChangeEvent={(event, change) => !(event.id === 'fixed' && change === 'resize')}
        onEventChange={(next, previous) => {
          setItems((current) => current.map((item) => (item.id === previous.id ? next : item)));
          setLog(`${next.title}: ${next.start} to ${next.end ?? next.start}`);
        }}
      />
      <output data-lab-output>{log}</output>
    </div>
  );
}

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

// New York changes its clocks in the weeks of 8 March (forward at 2 AM) and 1 November 2026 (back at 2 AM).
const clockChanges: CalendarViewEvent[] = [
  { id: 'spring-noon', title: 'Noon call', start: '2026-03-08T12:00', end: '2026-03-08T13:00' },
  { id: 'spring-day', title: 'Open day', start: '2026-03-08T00:00', end: '2026-03-09T00:00' },
  { id: 'spring-gap', title: 'Night shift', start: '2026-03-08T01:30', end: '2026-03-08T03:30' },
  { id: 'spring-next', title: 'Noon call', start: '2026-03-09T12:00', end: '2026-03-09T13:00' },
  { id: 'fall-noon', title: 'Noon call', start: '2026-11-01T12:00', end: '2026-11-01T13:00' },
  {
    id: 'fall-first',
    title: 'First pass',
    start: '2026-11-01T01:30-04:00',
    end: '2026-11-01T01:45-04:00',
  },
  {
    id: 'fall-between',
    title: 'Between passes',
    start: '2026-11-01T01:50-04:00',
    end: '2026-11-01T01:55-04:00',
  },
  {
    id: 'fall-second',
    title: 'Second pass',
    start: '2026-11-01T01:30-05:00',
    end: '2026-11-01T01:45-05:00',
  },
  { id: 'fall-next', title: 'Noon call', start: '2026-11-02T12:00', end: '2026-11-02T13:00' },
];

const shortEvents: CalendarViewEvent[] = [
  { id: 'short-5', title: 'Five', start: '2026-03-02T09:00', end: '2026-03-02T09:05' },
  { id: 'short-10', title: 'Ten', start: '2026-03-02T09:05', end: '2026-03-02T09:15' },
  { id: 'short-15', title: 'Fifteen', start: '2026-03-02T09:15', end: '2026-03-02T09:30' },
  { id: 'first', title: 'First', start: '2026-03-03T09:00', end: '2026-03-03T09:10' },
  { id: 'second', title: 'Second', start: '2026-03-03T09:10', end: '2026-03-03T09:20' },
  { id: 'third', title: 'Third', start: '2026-03-03T09:20', end: '2026-03-03T09:30' },
  { id: 'check-in', title: 'Check-in', start: '2026-03-04T10:00', end: '2026-03-04T10:15' },
  { id: 'workshop', title: 'Workshop', start: '2026-03-04T10:00', end: '2026-03-04T11:00' },
  { id: 'deadline', title: 'Deadline', start: '2026-03-05T12:00', end: '2026-03-05T12:00' },
  { id: 'late', title: 'Last call', start: '2026-03-06T23:50', end: '2026-03-07T00:00' },
];

// A host ruler twice the reference height, where 15 minutes is as tall as the reference's 30.
const tallRuler = `[data-lab-demo='short-tall'] .ui-calendar-view[data-view='week'] .ui-calendar-view__week {
  grid-template-rows: auto 1920px;
}`;

/** Short events in a week, drawn at least `minEventMinutes` tall; the last press shows its key. */
function ShortEvents({ minEventMinutes, demo }: { minEventMinutes?: number; demo: string }) {
  const [opened, setOpened] = useState('No event opened');
  return (
    <div style={frame(900)} data-lab-demo={demo}>
      <CalendarView
        events={shortEvents}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-02"
        defaultView="week"
        views={['week']}
        minEventMinutes={minEventMinutes}
        onEventAction={(key) => setOpened(`Opened ${String(key)}`)}
      />
      <output data-lab-output>{opened}</output>
    </div>
  );
}

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

const shelfDay: CalendarViewEvent[] = [
  { id: 'inventory', title: 'Inventory count', start: '2026-03-20' },
];

/**
 * All-day events that change a second after a button press, so the reader can focus an event
 * first: one added before it, or one renamed so that it sorts into a later lane.
 */
function LiveLanes() {
  const [items, setItems] = useState(shelfDay);
  const [view, setView] = useState<CalendarViewMode>('month');
  const [opened, setOpened] = useState('No event opened');
  const later = (change: (current: CalendarViewEvent[]) => CalendarViewEvent[]) =>
    window.setTimeout(() => setItems(change), 1000);
  return (
    <div style={frame(900)} data-lab-demo="live-lanes">
      <p>
        <Button
          size="sm"
          onPress={() =>
            later((current) => [
              ...current,
              { id: 'prep', title: 'Audit prep', start: '2026-03-20' },
            ])
          }
        >
          Add an earlier event in a second
        </Button>{' '}
        <Button
          size="sm"
          onPress={() =>
            later((current) =>
              current.map((item) => (item.id === 'prep' ? { ...item, title: 'Wrap-up' } : item)),
            )
          }
        >
          Rename Audit prep in a second
        </Button>
      </p>
      <CalendarView
        events={items}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-20"
        view={view}
        onViewChange={setView}
        onEventAction={(key) => setOpened(`Opened ${String(key)}`)}
      />
      <output data-lab-output>{opened}</output>
    </div>
  );
}

/** An uncontrolled calendar whose allowed views the host changes (UIC-CALENDAR-VIEW-1.3). */
function AllowedViews() {
  const [allowed, setAllowed] = useState<readonly CalendarViewMode[]>(['week']);
  const toggle = (mode: CalendarViewMode, isAllowed: boolean) =>
    setAllowed((current) =>
      (['month', 'week'] as const).filter((entry) =>
        entry === mode ? isAllowed : current.includes(entry),
      ),
    );
  return (
    <div data-lab-case="allowed-views">
      <Checkbox isSelected={allowed.includes('month')} onChange={(on) => toggle('month', on)}>
        Allow month
      </Checkbox>{' '}
      <Checkbox isSelected={allowed.includes('week')} onChange={(on) => toggle('week', on)}>
        Allow week
      </Checkbox>
      <div style={frame(720)}>
        <CalendarView
          events={events}
          views={allowed}
          timeZone="UTC"
          getNow={getNow}
          defaultDate="2026-03-18"
        />
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The month and week views with events, with a crowded day and empty. Week events sit at their wall-clock times under the hour labels and clip at midnight when they continue into another day. The crowded cases include distinct numeric and text event keys with the same spelling. The clock is fixed at 18 March 2026, 10:30 UTC."
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
      title="Event menus and editor"
      description="Click an event (or focus it and press Enter) to open its editor. Right-click an event, long-press it, or focus it and press Shift+F10 (or the Context Menu key) for its menu: Edit opens a dialog with the event's title, all-day state and start and end, Duplicate and Delete are the host's own entries. Save is disabled while the title is blank or the end comes before the start; Cancel and Escape keep the event. Release 2.4 is locked: a click only reports it, and its menu has no Edit. Events behind +n more on 18 March have the same menu. Open Design review's menu or editor, then remove it with the button: the menu or editor closes and focus goes to its day."
    >
      <EditableCalendar />
    </LabSection>
    <LabSection
      title="Moving and resizing"
      description="Editable events show a grip that moves them and an end that resizes them; dragging shows a dashed preview where the event would land, and releasing hands the change to the host. Timed events snap to 15 minutes. Focus a handle (Tab from the focused day) and use the arrow keys: Left and Right move a day, Up and Down 15 minutes on the time grid or a week on a bar. Escape or a cancelled pointer abandons a drag. Night shift crosses midnight and the clocks going back on 1 November keep its wall-clock times when moved; Offsite is a multi-day bar moved as one event; Fixed-length review only moves; Locked audit is read-only and shows no handles."
    >
      <DraggableCalendar />
    </LabSection>
    <LabSection
      title="Allowed views"
      description="Starts with only the week allowed, so it opens on the week. Allow the month and switch to it, then disallow the month: the calendar moves to the week, and returns to the month once it is allowed again. With neither box ticked both views are allowed."
    >
      <AllowedViews />
    </LabSection>
    <LabSection
      title="Events that change while focused"
      description="Focus an event after pressing a button: a second later an event is added before it, or the added event is renamed so it sorts after the other. The focused event keeps its button and focus, and Enter opens it, not the event now in its lane."
    >
      <LiveLanes />
    </LabSection>
    <LabSection
      title="Short events"
      description="Consecutive 5, 10 and 15 minute events, 10 minute events back to back, a short event inside a longer one, a deadline with no duration and a last call before midnight. Each is drawn at least 30 minutes of the ruler tall, and events whose drawn areas overlap sit side by side, so every event can be read and pressed on its own. The second calendar sizes its ruler twice as tall and draws events at least 15 minutes tall."
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <ShortEvents demo="short-default" />
        <style>{tallRuler}</style>
        <ShortEvents demo="short-tall" minEventMinutes={15} />
      </div>
    </LabSection>
    <LabSection
      title="Clock changes"
      description="Weeks in New York when the clocks go forward (8 March) and back (1 November). Events sit under the hour labels at their wall-clock times, so noon lines up on every day. The skipped 2 AM hour stays empty and a shift across it spans it; Open day runs midnight to midnight, 23 hours that day, and is still a bar; both passes of the repeated 1 AM hour share its place side by side and name their offsets (EDT, EST), each in its own lane even with Between passes, later in the first pass, between them in time."
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {(['2026-03-08', '2026-11-01'] as const).map((date) => (
          <div key={date} style={frame(900)} data-lab-demo={`clock-change-${date}`}>
            <CalendarView
              events={clockChanges}
              timeZone="America/New_York"
              getNow={getNow}
              defaultDate={date}
              defaultView="week"
              views={['week']}
            />
          </div>
        ))}
      </div>
    </LabSection>
    <LabSection
      title="Ends of the calendar"
      description="Days outside the supported range, 2 January 0001 and 31 December 9999, show the first supported month (January of year 2) and the last supported week (ending in 9998, with its last days in 9999). Moving past either end keeps the first or last supported day focused."
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={frame(620)} data-lab-demo="range-start">
          <CalendarView events={[]} timeZone="UTC" getNow={getNow} defaultDate="0001-01-02" />
        </div>
        <div style={frame(620)} data-lab-demo="range-end">
          <CalendarView
            events={[]}
            timeZone="UTC"
            getNow={getNow}
            defaultDate="9999-12-31"
            defaultView="week"
          />
        </div>
      </div>
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
    <LabSection
      title="Right to left"
      description="An Arabic locale, right to left: the days run from the right, the chevrons mirror, and the overlapping Team lunch and Design review on 18 March pack from the right edge."
    >
      <div style={frame(900)} data-lab-demo="rtl" dir="rtl">
        <UiProvider locale="ar-EG">
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
