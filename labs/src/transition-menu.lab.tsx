import { useState } from 'react';
import {
  TransitionMenu,
  type TransitionMenuChange,
  type TransitionMenuState,
  type TransitionMenuTransition,
} from '../../src/components/transition-menu/transition-menu.js';
import type { Key } from '../../src/core/props.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states: TransitionMenuState[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In review', tone: 'info' },
  { id: 'approved', label: 'Approved', tone: 'success' },
  { id: 'changes', label: 'Changes requested', tone: 'warning' },
  { id: 'withdrawn', label: 'Withdrawn', tone: 'danger' },
];

/** The transitions allowed from each state. */
const workflow: Record<string, TransitionMenuTransition[]> = {
  draft: [
    {
      id: 'submit',
      to: 'review',
      label: 'Submit for review',
      description: 'Notifies the reviewers',
    },
    {
      id: 'withdraw',
      to: 'withdrawn',
      requiresComment: true,
      description: 'Explain why in a comment',
    },
  ],
  review: [
    {
      id: 'approve',
      to: 'approved',
      label: 'Approve',
      confirmMessage: 'Approved documents can no longer be edited.',
    },
    { id: 'request', to: 'changes', label: 'Request changes', requiresComment: true },
    {
      id: 'publish',
      to: 'approved',
      label: 'Approve and publish',
      disabledReason: 'Needs a second reviewer',
    },
  ],
  changes: [{ id: 'resubmit', to: 'review', label: 'Resubmit' }],
  approved: [{ id: 'reopen', to: 'draft', label: 'Reopen as draft' }],
  withdrawn: [],
};

/** A document's state, moved through its workflow after a short wait, with a log of moves. */
function DocumentState() {
  const [state, setState] = useState<Key>('draft');
  const [log, setLog] = useState<string[]>([]);
  const run = (change: TransitionMenuChange) =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        const target = requireDefined(states.find((entry) => entry.id === change.to));
        setState(change.to);
        setLog((entries) => [
          ...entries,
          change.comment ? `${target.label}: “${change.comment}”` : target.label,
        ]);
        resolve();
      }, 400);
    });
  return (
    <div data-lab-demo="document">
      <TransitionMenu
        states={states}
        value={state}
        transitions={workflow[String(state)] ?? []}
        onTransition={run}
      />
      <ol data-lab-output="log" aria-label="Moves">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Each state's badge with its allowed transitions, without any (the badge alone), and disabled."
    >
      <StateMatrix
        axes={{
          state: ['draft', 'review', 'approved', 'changes', 'withdrawn'],
          menu: ['with transitions', 'no transitions', 'disabled'],
        }}
        render={({ state, menu }) => (
          <TransitionMenu
            states={states}
            value={state}
            label={`Status, ${menu}`}
            transitions={menu === 'no transitions' ? [] : (workflow[state] ?? [])}
            isDisabled={menu === 'disabled'}
            onTransition={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="A document's workflow"
      description="Submit, approve after a confirmation, request changes or withdraw with a required comment; an unavailable transition shows why. Each move waits a moment."
    >
      <DocumentState />
    </LabSection>
  </>,
);
