// User card trigger cases: hover timings, an initially open card, a trigger without a card, the
// press command beside a hover preview, and locking while open.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { UserCardTrigger } from '../../src/components/user-card-trigger/user-card-trigger.js';
import { MountOnDemand } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const timings = [0, 300, 1200] as const;

const cardOf = (name: string) => <UserCard name={name} description="Research team" />;

/** Appends to a short log of what happened, newest last. */
function useLog() {
  const [entries, setEntries] = useState<string[]>([]);
  return {
    text: entries.join(', ') || 'none',
    add: (entry: string) => setEntries((list) => [...list.slice(-5), entry]),
  };
}

/**
 * A hover card whose opening and closing delays the reader picks. Hover the name, or Tab to it:
 * the card opens `delay` milliseconds later and closes `closeDelay` milliseconds after the
 * pointer and focus leave.
 */
export function TimedHover() {
  const [delay, setDelay] = useState<number>(300);
  const [closeDelay, setCloseDelay] = useState<number>(300);
  const log = useLog();
  return (
    <div data-lab-demo="timed-hover">
      <p>
        Open after:{' '}
        {timings.map((ms) => (
          <Button key={ms} size="sm" onPress={() => setDelay(ms)}>{`Open after ${ms} ms`}</Button>
        ))}
      </p>
      <p>
        Close after:{' '}
        {timings.map((ms) => (
          <Button key={ms} size="sm" onPress={() => setCloseDelay(ms)}>
            {`Close after ${ms} ms`}
          </Button>
        ))}
      </p>
      <p>
        Reviewed by{' '}
        <UserCardTrigger
          trigger="hover"
          delay={delay}
          closeDelay={closeDelay}
          card={cardOf('Ada Moreau')}
          onOpenChange={(open) => log.add(open ? 'open' : 'closed')}
          data-lab-trigger="timed"
        >
          Ada Moreau
        </UserCardTrigger>
      </p>
      <LabOutput name="Timings">{`delay ${delay} ms, closeDelay ${closeDelay} ms`}</LabOutput>
      <LabOutput name="Timed card">{log.text}</LabOutput>
    </div>
  );
}

/** A card open from the trigger's first render, uncontrolled; the reader closes it as usual. */
export function InitiallyOpen() {
  const log = useLog();
  return (
    <MountOnDemand label="a card open at first">
      <UserCardTrigger
        defaultOpen
        card={cardOf('Noor Haddad')}
        onOpenChange={(open) => log.add(open ? 'open' : 'closed')}
        data-lab-trigger="default-open"
      >
        Noor Haddad
      </UserCardTrigger>
      <LabOutput name="Open at first">{log.text}</LabOutput>
    </MountOnDemand>
  );
}

/**
 * A trigger whose card arrives or leaves two seconds after the button, so the reader can focus
 * the trigger first: without a card it is a plain button that runs `onPress`, and the same button
 * keeps focus as the card comes and goes.
 */
export function LateCard() {
  const [hasCard, setHasCard] = useState(false);
  const presses = useLog();
  return (
    <div data-lab-demo="late-card">
      <p>
        Edited by{' '}
        <UserCardTrigger
          card={hasCard ? cardOf('Rui Costa') : undefined}
          onPress={() => presses.add(hasCard ? 'press with card' : 'press without card')}
          data-lab-trigger="late"
        >
          Rui Costa
        </UserCardTrigger>
      </p>
      <Button size="sm" onPress={() => window.setTimeout(() => setHasCard(!hasCard), 2000)}>
        {hasCard ? 'Remove the card in 2 s' : 'Attach the card in 2 s'}
      </Button>
      <LabOutput name="Card attached">{String(hasCard)}</LabOutput>
      <LabOutput name="Late presses">{presses.text}</LabOutput>
    </div>
  );
}

/**
 * A hover preview whose trigger is also a command: hovering or focusing shows the card, and a
 * press runs `onPress` instead of turning the preview into a dialog. Locking it while open closes
 * the card, and unlocking leaves it closed.
 */
export function HoverCommand() {
  const [isDisabled, setDisabled] = useState(false);
  const presses = useLog();
  const changes = useLog();
  return (
    <div data-lab-demo="hover-command">
      <p>
        Assigned to{' '}
        <UserCardTrigger
          trigger="hover"
          delay={0}
          isDisabled={isDisabled}
          card={cardOf('Elif Kaya')}
          onPress={() => presses.add('open profile')}
          onOpenChange={(open) => changes.add(open ? 'open' : 'closed')}
          data-lab-trigger="hover-command"
        >
          Elif Kaya
        </UserCardTrigger>
      </p>
      <Button
        size="sm"
        onPress={() =>
          isDisabled ? setDisabled(false) : window.setTimeout(() => setDisabled(true), 2000)
        }
      >
        {isDisabled ? 'Enable the trigger' : 'Disable the trigger in 2 s'}
      </Button>
      <LabOutput name="Hover presses">{presses.text}</LabOutput>
      <LabOutput name="Hover card">{changes.text}</LabOutput>
    </div>
  );
}
