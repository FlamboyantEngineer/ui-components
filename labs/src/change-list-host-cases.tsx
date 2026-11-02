import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChangeList, type ChangeListChange } from '../../src/components/change-list/change-list.js';
import { EmptyState } from '../../src/components/empty-state/empty-state.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { ZoneComparison, getNearMidnightNow, nearMidnightInstant } from './time-zone-samples.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };

/** Changes against a clock at 23:30 UTC: one late on the 19th, one three days back. */
const nightChanges: ChangeListChange[] = [
  {
    id: 'status',
    label: 'Status',
    before: 'Draft',
    after: 'Approved',
    person: maria,
    time: nearMidnightInstant,
  },
  {
    id: 'servings',
    label: 'Servings',
    before: '4',
    after: '6',
    person: maria,
    time: '2026-04-17T12:00:00Z',
  },
];

const thresholds = ['1', '7'] as const;

/** Who and when in a chosen zone, with times as dates after the chosen number of days. */
function ZonedChanges() {
  const [threshold, setThreshold] = useState<(typeof thresholds)[number]>('7');
  return (
    <div data-lab-demo="change-zones">
      <SegmentedChoice
        aria-label="Dates after (days)"
        size="sm"
        sizing="content"
        options={thresholds.map((value) => ({ value, label: value }))}
        value={threshold}
        onChange={(value) => {
          const match = thresholds.find((option) => option === value);
          if (match) setThreshold(match);
        }}
      />
      <ZoneComparison>
        {({ timeZone }) => (
          <ChangeList
            aria-label="Changes near midnight"
            changes={nightChanges}
            getNow={getNearMidnightNow}
            timeZone={timeZone}
            fallbackAfterDays={Number(threshold)}
          />
        )}
      </ZoneComparison>
    </div>
  );
}

/** No changes yet, with the caller's message and an action that records one. */
function OwnEmptyState() {
  const [changes, setChanges] = useState<ChangeListChange[]>([]);
  return (
    <div data-lab-demo="change-empty">
      <ChangeList
        aria-label="Recipe changes"
        changes={changes}
        renderEmptyState={() => (
          <EmptyState
            title="Nothing changed yet"
            description="Edits to the recipe are listed here."
            headingLevel={3}
            actions={
              <Button
                size="sm"
                onPress={() =>
                  setChanges([{ id: 'servings', label: 'Servings', before: '4', after: '6' }])
                }
              >
                Change the servings
              </Button>
            }
          />
        )}
      />
      <Button size="sm" variant="secondary" onPress={() => setChanges([])}>
        Undo every change
      </Button>
      <LabOutput name="changes">{String(changes.length)}</LabOutput>
    </div>
  );
}

export function ChangeListHostCases() {
  return (
    <div data-lab-family="change-list-host-cases">
      <LabSection
        title="Time zones and dates"
        description="The clock is fixed at 20 April 2026, 23:30 UTC. The status changed at 22:00 UTC on the 19th: yesterday in UTC and Los Angeles, two days ago in London. A one-day threshold turns both times into dates."
      >
        <ZonedChanges />
      </LabSection>
      <LabSection
        title="Caller empty state"
        description="renderEmptyState draws the caller's message while there are no changes, with an action that records one; Undo every change brings it back."
      >
        <OwnEmptyState />
      </LabSection>
    </div>
  );
}
