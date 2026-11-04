import { useState } from 'react';
import { Attribution } from '../../src/components/attribution/attribution.js';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { samplePicture } from './people-samples.js';
import {
  getNearMidnightNow,
  nearMidnightDate,
  nearMidnightInstant,
  ZoneComparison,
} from './time-zone-samples.js';

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

/** The near-midnight instant and date under a chosen provider zone, override and tooltip setting. */
function ZonedAttribution() {
  const [showTooltip, setShowTooltip] = useState(true);
  return (
    <div data-lab-demo="attribution-zones">
      <Switch isSelected={showTooltip} onChange={setShowTooltip}>
        Show the time tooltip
      </Switch>
      <ZoneComparison>
        {({ timeZone }) => (
          <ul>
            {[
              { id: 'instant', time: nearMidnightInstant, template: 'Edited {time} by {person}' },
              { id: 'date', time: nearMidnightDate, template: 'Due {time}, set by {person}' },
            ].map((sample) => (
              <li key={sample.id}>
                <Attribution
                  time={sample.time}
                  getNow={getNearMidnightNow}
                  person={maria}
                  template={sample.template}
                  timeZone={timeZone}
                  showTooltip={showTooltip}
                  data-lab-zone-row={sample.id}
                />
              </li>
            ))}
          </ul>
        )}
      </ZoneComparison>
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
      title="Avatar with the name"
      description="Initials and a picture, as a plain name and opening a card, in a narrow column so the sentence wraps: the avatar stays centred on the name, and the name on the sentence's baseline."
    >
      <StateMatrix
        axes={{ avatar: ['initials', 'picture'], person: ['name', 'card'] }}
        render={({ avatar, person }) => {
          const who = avatar === 'picture' ? jon : maria;
          return (
            <p style={{ maxWidth: '14em', margin: 0 }}>
              <Attribution
                time={times.minutes}
                getNow={getNow}
                person={who}
                template="The summary was rewritten {time} by {person} after the review"
                showAvatar
                card={
                  person === 'card' ? (
                    <UserCard name={who.name} description="Field research" />
                  ) : undefined
                }
              />
            </p>
          );
        }}
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
      title="Time zones and tooltip"
      description="Now is 23:30 UTC; the edit was at 22:00 UTC the day before. Choose the provider's zone and the attribution's own override: the edit reads yesterday in UTC and Los Angeles but two days ago in London, and the tooltip's absolute time moves with the zone. The due date keeps Apr 19 in every zone. Switch the tooltip off where a surrounding control already shows the time: the time is no longer a tab stop."
    >
      <ZonedAttribution />
    </LabSection>
    <LabSection
      title="Live"
      description="Stamped on the real clock with a hover card on the author: the times keep themselves current."
    >
      <LiveNotes />
    </LabSection>
  </>,
);
