import { useState } from 'react';
import { Attribution } from '../../src/components/attribution/attribution.js';
import { Button } from '../../src/components/button/button.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every sentence in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };

const templates = {
  default: undefined,
  edited: 'Edited {time} by {person}',
  'person first': '{person} commented {time}',
} as const;

const times = {
  minutes: new Date(2026, 3, 20, 10, 12).toISOString(),
  yesterday: '2026-04-19',
  absolute: '2026-01-14',
  missing: null,
} as const;

/** Notes stamped on the real clock, each with its author's card. */
function LiveNotes() {
  const [notes, setNotes] = useState(() => [{ id: 1, time: new Date().toISOString() }]);
  return (
    <div>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            Note {note.id}:{' '}
            <Attribution
              time={note.time}
              person={jon}
              template="added {time} by {person}"
              showAvatar
              cardTrigger="hover"
              card={<UserCard name={jon.name} src={jon.src} description="Field research" />}
              data-lab-note={note.id}
            />
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        onPress={() =>
          setNotes((list) => [...list, { id: list.length + 1, time: new Date().toISOString() }])
        }
      >
        Add a note
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Templates and people"
      description="The default sentence, a caller template and one that starts with the person; the person as a name, with an avatar, or opening their card. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          template: Object.keys(templates) as (keyof typeof templates)[],
          person: ['name', 'avatar', 'card'],
        }}
        render={({ template, person }) => (
          <Attribution
            time={times.minutes}
            getNow={getNow}
            person={maria}
            template={templates[template]}
            showAvatar={person === 'avatar'}
            card={
              person === 'card' ? (
                <UserCard name={maria.name} description="maria@example.com" />
              ) : undefined
            }
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Times"
      description="Minutes ago, yesterday, an absolute date past the fallback and a missing time, at the start of the sentence and inside it."
    >
      <StateMatrix
        axes={{
          time: Object.keys(times) as (keyof typeof times)[],
          template: ['default', 'edited'],
        }}
        render={({ time, template }) => (
          <Attribution
            time={times[time]}
            getNow={getNow}
            person={maria}
            template={templates[template]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Without a person"
      description="Only the time, and a shorter fallback that reads yesterday as its date."
    >
      <StateMatrix
        axes={{ fallback: ['7 days', '1 day'] }}
        render={({ fallback }) => (
          <Attribution
            time={times.yesterday}
            getNow={getNow}
            fallbackAfterDays={fallback === '7 days' ? 7 : 1}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Stamped on the real clock with a hover card on the author: the times keep themselves current."
    >
      <LiveNotes />
    </LabSection>
  </>,
);
