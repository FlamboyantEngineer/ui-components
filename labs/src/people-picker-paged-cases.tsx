// People Picker case for a remote directory that answers in pages, fails on request and logs aborts.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  PeoplePicker,
  type PeoplePickerLoader,
  type PeoplePickerPerson,
} from '../../src/components/people-picker/people-picker.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const firstNames = ['Alex', 'Bea', 'Cal', 'Dee', 'Emi', 'Finn', 'Gus'];
const lastNames = ['Lund', 'Marsh', 'North'];

/** Twenty-one people, in name order, who all match "a" in their email. */
const staff: PeoplePickerPerson[] = lastNames.flatMap((last) =>
  firstNames.map((first) => ({
    id: `${first}-${last}`.toLowerCase(),
    name: `${first} ${last}`,
    description: `${first}.${last}@example.com`.toLowerCase(),
  })),
);

const pageSize = 5;

interface DirectoryEvents {
  /** A request, page, failure or abort, as a log line. */
  log(line: string): void;
  /** Whether the next search will fail. */
  onFailNextChange(failsNext: boolean): void;
}

/**
 * A directory that answers 300 milliseconds later, five people a page, with the offset of the next
 * page as its cursor. `failNext` makes the next search fail; every request, page, failure and abort
 * is logged.
 */
function createPagedDirectory(events: DirectoryEvents) {
  let failsNext = false;
  const load: PeoplePickerLoader = (query, signal, cursor) =>
    new Promise((resolve, reject) => {
      const from = Number(cursor ?? 0);
      events.log(`search "${query}" from ${from}`);
      let isSettled = false;
      const timer = setTimeout(() => {
        isSettled = true;
        if (failsNext) {
          failsNext = false;
          events.onFailNextChange(false);
          events.log(`failed "${query}"`);
          reject(new Error('The directory is unavailable.'));
          return;
        }
        const needle = query.toLowerCase();
        const found = staff.filter((person) =>
          `${person.name} ${person.description ?? ''}`.toLowerCase().includes(needle),
        );
        const items = found.slice(from, from + pageSize);
        const next = from + pageSize < found.length ? String(from + pageSize) : undefined;
        events.log(`page "${query}" ${from + 1}-${from + items.length} of ${found.length}`);
        resolve({ items, cursor: next });
      }, 300);
      signal.addEventListener('abort', () => {
        // A search that already answered has nothing left to stop.
        if (isSettled) return;
        clearTimeout(timer);
        events.log(`aborted "${query}" from ${from}`);
        reject(signal.reason);
      });
    });
  const failNext = () => {
    failsNext = true;
    events.onFailNextChange(true);
  };
  return { load, failNext };
}

function PagedDirectory() {
  const [failsNext, setFailsNext] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [watchers, setWatchers] = useState<Key[]>([]);
  // Created once: a new loader would search again.
  const [directory] = useState(() =>
    createPagedDirectory({
      log: (line) => setLines((previous) => [...previous, line]),
      onFailNextChange: setFailsNext,
    }),
  );
  return (
    <div data-lab-demo="paged-directory">
      <Button size="sm" variant="secondary" isDisabled={failsNext} onPress={directory.failNext}>
        Fail the next search
      </Button>{' '}
      <Button size="sm" variant="ghost" onPress={() => setLines([])}>
        Clear the log
      </Button>
      <LabOutput name="next search">{failsNext ? 'fails' : 'answers'}</LabOutput>
      <PeoplePicker
        label="Watchers"
        selectionMode="multiple"
        description="Five people a page; scroll to the end of the list for the next page."
        loadItems={directory.load}
        value={watchers}
        onChange={setWatchers}
      />
      <LabOutput name="watchers">{watchers.map(String).join(', ') || 'none'}</LabOutput>
      <ol data-lab-output="directory-log">
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </div>
  );
}

export function PeoplePickerPagedCases() {
  return (
    <div data-lab-family="people-picker-paged-cases">
      <LabSection
        title="A paged directory"
        description="The directory answers five people a page with a cursor for the next, so the list loads more as its end comes into view. Typing again aborts the running search (logged). Fail the next search makes the next request fail, and the list shows the search status; changing the text retries the search. A person picked from a later page keeps their chip after the next search leaves them out."
      >
        <PagedDirectory />
      </LabSection>
    </div>
  );
}
