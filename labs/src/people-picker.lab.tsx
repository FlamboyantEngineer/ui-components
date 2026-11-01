import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import {
  PeoplePicker,
  type PeoplePickerLoader,
  type PeoplePickerPerson,
} from '../../src/components/people-picker/people-picker.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['resting', 'with value', 'disabled', 'read-only', 'invalid'] as const;

const me: PeoplePickerPerson = {
  id: 'sam',
  name: 'Sam Rivera',
  description: 'sam.rivera@example.com',
};

const directory: PeoplePickerPerson[] = [
  me,
  { id: 'ada', name: 'Ada Moreno', description: 'ada.moreno@example.com' },
  { id: 'ben', name: 'Ben Okafor', description: 'ben.okafor@example.com' },
  { id: 'chen', name: 'Chen Wei', description: 'chen.wei@example.com' },
  {
    id: 'cleo',
    name: 'Cleo Varga',
    description: 'cleo.varga@example.com',
    isDisabled: true,
    disabledReason: 'Account inactive',
  },
  { id: 'dara', name: 'Dara Nkemelu', description: 'dara.nkemelu@example.com' },
  { id: 'eli', name: 'Eli Brandt', description: 'eli.brandt@example.com' },
  { id: 'design', name: 'Design team', kind: 'group', description: 'Group · 8 members' },
  { id: 'support', name: 'Support desk', kind: 'group', description: 'Group · 14 members' },
];

const recent = directory.filter((person) => ['ada', 'design'].includes(String(person.id)));
const savedWatchers = directory.filter((person) => ['chen', 'support'].includes(String(person.id)));

/** Searches the directory as a server would, after 300 milliseconds, stopping when aborted. */
const searchDirectory: PeoplePickerLoader = (query, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.toLowerCase();
      resolve(
        directory.filter((person) =>
          `${person.name} ${person.description ?? ''}`.toLowerCase().includes(needle),
        ),
      );
    }, 300);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

function Assignee() {
  const [assignee, setAssignee] = useState<Key | null>(null);
  return (
    <>
      <PeoplePicker
        label="Assignee"
        placeholder="Search people"
        description="Pick yourself or someone recent, or type to search."
        currentUser={me}
        recent={recent}
        loadItems={searchDirectory}
        onChange={setAssignee}
      />
      <p>
        Assignee:{' '}
        <output data-lab-output="assignee">{assignee === null ? 'none' : String(assignee)}</output>
      </p>
    </>
  );
}

function Reviewers() {
  const [reviewers, setReviewers] = useState<Key[]>(['ada']);
  return (
    <>
      <PeoplePicker
        label="Reviewers"
        selectionMode="multiple"
        description="People and groups; inactive accounts cannot be picked."
        currentUser={me}
        recent={recent}
        loadItems={searchDirectory}
        value={reviewers}
        onChange={setReviewers}
      />
      <p>
        Reviewers:{' '}
        <output data-lab-output="reviewers">{reviewers.map(String).join(', ') || 'none'}</output>
      </p>
    </>
  );
}

/** A record saved before Eli's account was restored, so a search returns a newer copy. */
const savedEli: PeoplePickerPerson = {
  id: 'eli',
  name: 'Eli Brandt (old record)',
  isDisabled: true,
  disabledReason: 'Account inactive when saved',
};

function Handover() {
  const [owner, setOwner] = useState<Key | null>(null);
  return (
    <>
      <PeoplePicker
        label="Handover owner"
        description="Search for someone, then search again and restore Dara: the picker still knows her."
        knownPeople={[savedEli]}
        loadItems={searchDirectory}
        value={owner}
        onChange={setOwner}
      />
      <p>
        <button type="button" onClick={() => setOwner('dara')}>
          Restore Dara
        </button>{' '}
        Owner: <output data-lab-output="owner">{owner === null ? 'none' : String(owner)}</output>
      </p>
    </>
  );
}

mountLab(
  <>
    <LabSection title="Sizes and states" description="Each cell is a live people picker.">
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <PeoplePicker
            aria-label={`Owner ${state} ${size}`}
            size={size}
            currentUser={me}
            loadItems={searchDirectory}
            placeholder="Search people"
            {...(state === 'resting' ? {} : { defaultValue: 'sam' })}
            isDisabled={state === 'disabled'}
            isReadOnly={state === 'read-only'}
            isInvalid={state === 'invalid'}
            errorMessage={state === 'invalid' ? 'Choose someone on the team' : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Single person"
      description="The list starts with you and your recent people; typing searches the directory."
    >
      <Assignee />
    </LabSection>
    <LabSection
      title="People and groups"
      description="A multiple picker shows chosen people and groups as chips with their avatars."
    >
      <Reviewers />
    </LabSection>
    <LabSection
      title="Saved value"
      description="A saved value names people no search has returned yet; the picker knows them, so the chips read their names and the list shows them before a search."
    >
      <PeoplePicker
        label="Watchers"
        selectionMode="multiple"
        loadItems={searchDirectory}
        defaultValue={savedWatchers.map((person) => person.id)}
        knownPeople={savedWatchers}
      />
    </LabSection>
    <LabSection
      title="Restoring a chosen person"
      description="A value set from outside names a person an earlier search returned, and a search's newer copy of a saved person replaces the saved one everywhere."
    >
      <Handover />
    </LabSection>
    <LabSection
      title="Required, with a short delay"
      description="Searches 100 milliseconds after typing pauses."
    >
      <PeoplePicker
        label="Approver"
        isRequired
        searchDelay={100}
        loadItems={searchDirectory}
        recent={recent}
      />
    </LabSection>
  </>,
);
