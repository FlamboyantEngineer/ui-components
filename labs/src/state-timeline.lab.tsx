import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  StateTimeline,
  type StateTimelineEntry,
  type StateTimelineState,
} from '../../src/components/state-timeline/state-timeline.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every time in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };

const history: StateTimelineEntry[] = [
  { id: 'draft', label: 'Draft', time: '2026-04-14T09:12:00', person: maria },
  {
    id: 'review',
    label: 'In review',
    tone: 'info',
    time: '2026-04-19T16:40:00',
    person: jon,
    comment: 'Two figures need their units checked.',
  },
  {
    id: 'changes',
    label: 'Changes requested',
    tone: 'warning',
    time: new Date(2026, 3, 20, 9, 5).toISOString(),
    person: jon,
  },
  {
    id: 'approved',
    label: 'Approved',
    tone: 'success',
    time: new Date(2026, 3, 20, 10, 18).toISOString(),
    person: maria,
    comment: 'Units fixed. Good to go.',
  },
];

const upcoming: StateTimelineState[] = [
  { id: 'released', label: 'Released' },
  { id: 'archived', label: 'Archived' },
];

const lifecycle: StateTimelineState[] = [
  { id: 'open', label: 'Open' },
  { id: 'progress', label: 'In progress', tone: 'info' },
  { id: 'blocked', label: 'Blocked', tone: 'danger' },
  { id: 'done', label: 'Done', tone: 'success' },
];

/** A task moved through its states on the real clock, with a note on each move. */
function LiveTask() {
  const [entries, setEntries] = useState<StateTimelineEntry[]>([
    { ...lifecycle[0]!, time: new Date().toISOString(), person: maria },
  ]);
  const next = lifecycle[entries.length];
  return (
    <div data-lab-demo="live">
      <StateTimeline
        aria-label="Task history"
        entries={entries}
        upcoming={lifecycle.slice(entries.length)}
        showAvatar
      />
      <Button
        size="sm"
        isDisabled={!next}
        onPress={() => {
          if (!next) return;
          setEntries((list) => [
            ...list,
            {
              ...next,
              id: `${String(next.id)}-${list.length}`,
              time: new Date().toISOString(),
              person: jon,
              comment: `Moved to ${String(next.label)}.`,
            },
          ]);
        }}
      >
        {next ? `Move to ${String(next.label)}` : 'Finished'}
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Direction and upcoming states"
      description="Oldest or newest first, with and without the states still to come. The current state is marked; the clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{ upcoming: ['none', 'two'], direction: ['ascending', 'descending'] }}
        render={({ upcoming: future, direction }) => (
          <StateTimeline
            aria-label={`History, ${direction}, ${future} upcoming`}
            entries={history}
            upcoming={future === 'two' ? upcoming : undefined}
            direction={direction}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="People and times"
      description="Names alone or with avatars, and a shorter fallback that reads older changes as their dates."
    >
      <StateMatrix
        axes={{ avatar: ['name', 'avatar'], fallback: ['7 days', '1 day'] }}
        render={({ avatar, fallback }) => (
          <StateTimeline
            aria-label={`History, ${avatar}, ${fallback}`}
            entries={history.slice(0, 3)}
            showAvatar={avatar === 'avatar'}
            fallbackAfterDays={fallback === '7 days' ? 7 : 1}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Each move stamps the real clock and a comment; the remaining states follow as upcoming."
    >
      <LiveTask />
    </LabSection>
  </>,
);
