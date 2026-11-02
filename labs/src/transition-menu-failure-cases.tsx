// Transition Menu cases for transitions the host refuses, directly and from a dialog, and for an
// open dialog whose transition is revoked before the reader confirms.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import {
  TransitionMenu,
  type TransitionMenuChange,
  type TransitionMenuState,
  type TransitionMenuTransition,
} from '../../src/components/transition-menu/transition-menu.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const states: TransitionMenuState[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In review', tone: 'info' },
  { id: 'approved', label: 'Approved', tone: 'success' },
  { id: 'changes', label: 'Changes requested', tone: 'warning' },
  { id: 'withdrawn', label: 'Withdrawn', tone: 'danger' },
];

const draftTransitions: TransitionMenuTransition[] = [
  { id: 'submit', to: 'review', label: 'Submit for review' },
  { id: 'withdraw', to: 'withdrawn', label: 'Withdraw', requiresComment: true },
];

/** The host refuses moves while the switch is on; it reports each refusal and keeps the state. */
function Refused() {
  const [refuses, setRefuses] = useState(true);
  const [value, setValue] = useState<Key>('draft');
  const [log, setLog] = useState<string[]>([]);
  const run = (change: TransitionMenuChange) =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (refuses) {
          setLog((list) => [...list, `${String(change.transition)} refused`]);
          reject(new Error('The server is offline. Try again later.'));
          return;
        }
        setLog((list) => [...list, `${String(change.transition)} ran`]);
        setValue(change.to);
        resolve();
      }, 400);
    });
  return (
    <div data-lab-demo="refused">
      <Switch isSelected={refuses} onChange={setRefuses}>
        The server refuses moves
      </Switch>{' '}
      <Button size="sm" variant="secondary" onPress={() => setValue('draft')}>
        Back to draft
      </Button>
      <TransitionMenu
        states={states}
        value={value}
        transitions={value === 'draft' ? draftTransitions : []}
        onTransition={run}
        data-lab-menu="refused"
      />
      <LabOutput name="Refused log">{log.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

const revocations = {
  removed: 'Remove the transition',
  unavailable: 'Make it unavailable',
  retargeted: 'Lead it elsewhere',
  moved: 'Move the record',
  disabled: 'Disable the menu',
} as const;

type Revocation = keyof typeof revocations;

const approve: TransitionMenuTransition = {
  id: 'approve',
  to: 'approved',
  label: 'Approve',
  confirmMessage: 'Approved documents can no longer be edited.',
};

function revokedProps(revocation: Revocation | null) {
  if (revocation === 'removed') return { transitions: [] };
  if (revocation === 'unavailable') {
    return { transitions: [{ ...approve, disabledReason: 'Approved elsewhere' }] };
  }
  if (revocation === 'retargeted') return { transitions: [{ ...approve, to: 'changes' }] };
  if (revocation === 'moved') return { value: 'changes' };
  if (revocation === 'disabled') return { isDisabled: true };
  return {};
}

/**
 * Arms a change that lands two seconds later, while the reader has the Approve dialog open (a
 * modal dialog blocks the page, so the change runs on a timer). The dialog closes and nothing runs.
 */
function Revoked() {
  const [choice, setChoice] = useState<Revocation>('removed');
  const [applied, setApplied] = useState<Revocation | null>(null);
  const [runs, setRuns] = useState<string[]>([]);
  return (
    <div data-lab-demo="revoked">
      <div role="group" aria-label="Change to arm">
        {(Object.keys(revocations) as Revocation[]).map((option) => (
          <Button
            key={option}
            size="sm"
            variant="secondary"
            isSelected={choice === option}
            onPress={() => setChoice(option)}
          >
            {revocations[option]}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        onPress={() => {
          setApplied(null);
          window.setTimeout(() => setApplied(choice), 2000);
        }}
      >
        Arm the change
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setApplied(null)}>
        Restore
      </Button>
      <TransitionMenu
        states={states}
        value="review"
        transitions={[approve]}
        onTransition={(change) => setRuns((list) => [...list, String(change.transition)])}
        {...revokedProps(applied)}
        data-lab-menu="revoked"
      />
      <LabOutput name="Applied change">{applied ? revocations[applied] : 'none'}</LabOutput>
      <LabOutput name="Revoked runs">{runs.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

export function TransitionMenuFailureSections() {
  return (
    <>
      <LabSection
        title="Refused transitions"
        description="With the switch on, onTransition rejects after a short wait. Submit for review runs at once: the trigger is pending, then the host lists the refusal and keeps Draft. Withdraw asks for a comment: the dialog stays open with the error and keeps the comment, so Withdraw can be pressed again once the switch is off."
      >
        <Refused />
      </LabSection>
      <LabSection
        title="Revoked while confirming"
        description="Pick a change and Arm it, then open the menu and choose Approve within two seconds. When the change lands (the transition removed or unavailable, leading elsewhere, the record moved, or the menu disabled) the dialog closes and Approve does not run, as Revoked runs shows. Restore brings the transition back without reopening the dialog."
      >
        <Revoked />
      </LabSection>
    </>
  );
}
