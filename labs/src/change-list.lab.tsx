import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { ChangeList, type ChangeListChange } from '../../src/components/change-list/change-list.js';
import { ChangeListHostCases } from './change-list-host-cases.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { samplePicture } from './people-samples.js';
import { requireDefined } from './require-defined.js';

/** A fixed clock, so every time in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };

const changes: ChangeListChange[] = [
  { id: 1, label: 'Status', before: 'Draft', after: 'Approved' },
  {
    id: '1',
    label: 'Method',
    type: 'text',
    before: 'Knead the dough for ten minutes, then rest it covered for an hour.',
    after: 'Knead the dough for eight minutes, then rest it covered overnight in the fridge.',
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'list',
    before: ['bread', 'vegan', 'weekday'],
    after: ['bread', 'vegan', 'weekend', 'slow'],
  },
  { id: 'servings', label: 'Servings', before: '4', after: '6' },
  { id: 'reviewer', label: 'Reviewer', after: 'Lena Ortiz' },
  { id: 'deadline', label: 'Deadline', before: '2026-05-01', after: null },
];

const attributed: ChangeListChange[] = changes.slice(0, 3).map((change, index) => ({
  ...change,
  person: index === 1 ? jon : maria,
  time: ['2026-04-20T10:12:00', '2026-04-19T15:40:00', '2026-04-12'][index],
}));

const statusTone: Record<string, 'neutral' | 'success'> = { Draft: 'neutral', Approved: 'success' };

/** Draws status values as badges and every other value as text. */
function renderValue(value: string) {
  const tone = statusTone[value];
  return tone ? (
    <Badge tone={tone} variant="status" announce={false}>
      {value}
    </Badge>
  ) : (
    value
  );
}

const revisions = [
  { title: 'Lemon tart', servings: '8', notes: 'Bake the shell blind for 15 minutes.' },
  { title: 'Lemon tart', servings: '10', notes: 'Bake the shell blind for 20 minutes.' },
  { title: 'Lemon and lime tart', servings: '10', notes: 'Bake the shell blind for 20 minutes.' },
];

/** The changes between two revisions of a record, one step at a time. */
function Revisions() {
  const [step, setStep] = useState(1);
  const [before, after] = [requireDefined(revisions[step - 1]), requireDefined(revisions[step])];
  const diff: ChangeListChange[] = (['title', 'servings', 'notes'] as const)
    .filter((key) => before[key] !== after[key])
    .map((key) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      type: key === 'notes' ? 'text' : 'value',
      before: before[key],
      after: after[key],
    }));
  return (
    <div data-lab-demo="revisions">
      <ChangeList aria-label={`Changes in revision ${step + 1}`} changes={diff} />
      <Button size="sm" onPress={() => setStep(step === 1 ? 2 : 1)}>
        {step === 1 ? 'Next revision' : 'Previous revision'}
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants"
      description="Old → new on one line, or the old and new values stacked under captions: plain values, a word diff of text, list items added and removed, a value set and a value cleared."
    >
      <StateMatrix
        axes={{ variant: ['compact', 'detailed'] }}
        render={({ variant }) => (
          <ChangeList aria-label={`Changes, ${variant}`} changes={changes} variant={variant} />
        )}
      />
    </LabSection>
    <LabSection
      title="Who and when"
      description="Each change with its author and time, names alone or with avatars. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{ avatar: ['name', 'avatar'], variant: ['compact', 'detailed'] }}
        render={({ avatar, variant }) => (
          <ChangeList
            aria-label={`Attributed changes, ${avatar}, ${variant}`}
            changes={attributed}
            variant={variant}
            showAvatar={avatar === 'avatar'}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Custom values and no changes"
      description="Status values drawn as badges through renderValue, and the empty state."
    >
      <StateMatrix
        axes={{ content: ['badges', 'no changes'] }}
        render={({ content }) =>
          content === 'badges' ? (
            <ChangeList
              aria-label="Status change"
              changes={changes.slice(0, 1)}
              renderValue={renderValue}
            />
          ) : (
            <ChangeList aria-label="No changes" changes={[]} />
          )
        }
      />
    </LabSection>
    <LabSection
      title="Between revisions"
      description="The changes between consecutive revisions of a recipe, computed as the reader steps through them."
    >
      <Revisions />
    </LabSection>
    <ChangeListHostCases />
  </>,
);
