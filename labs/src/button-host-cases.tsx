import { useRef, useState } from 'react';
import { Button, runPendingAction } from '../../src/components/button/button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

/** Buttons mounted on demand, so autoFocus can act on mount. */
function FocusPolicies() {
  const [isMounted, setMounted] = useState(false);
  const [presses, setPresses] = useState(0);
  return (
    <div data-lab-case="focus-policies">
      <Button size="sm" onPress={() => setMounted((value) => !value)}>
        {isMounted ? 'Unmount the buttons' : 'Mount the buttons'}
      </Button>
      <TextField label="Search notes" />
      {isMounted ? (
        <div role="group" aria-label="Focus policies">
          <Button autoFocus>Focused on mount</Button>{' '}
          <Button preventFocusOnPress onPress={() => setPresses((value) => value + 1)}>
            Keeps focus where it was
          </Button>{' '}
          <Button excludeFromTabOrder>Skipped by Tab</Button>{' '}
          <Button>After the skipped button</Button>
        </div>
      ) : null}
      <p>
        Presses without focus: <output data-lab-output="presses">{presses}</output>
      </p>
    </div>
  );
}

type LogEntry = string;

/** Buttons whose press and hover callbacks append to a visible log. */
function EventLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const logged = (name: string) => {
    const add = (entry: string) => setLog((current) => [...current, `${name}: ${entry}`]);
    return {
      onPress: (event: { pointerType: string }) => add(`press (${event.pointerType})`),
      onPressStart: (event: { pointerType: string }) => add(`pressStart (${event.pointerType})`),
      onPressEnd: () => add('pressEnd'),
      onPressUp: () => add('pressUp'),
      onPressChange: (isPressed: boolean) => add(`pressChange ${String(isPressed)}`),
      onHoverStart: () => add('hoverStart'),
      onHoverEnd: () => add('hoverEnd'),
      onHoverChange: (isHovering: boolean) => add(`hoverChange ${String(isHovering)}`),
    };
  };
  return (
    <div data-lab-case="event-log">
      <div role="group" aria-label="Logged buttons">
        <Button {...logged('Logged')}>Logged</Button>{' '}
        <Button isDisabled {...logged('Disabled')}>
          Disabled
        </Button>{' '}
        <Button isPending pendingLabel="Working" {...logged('Pending')}>
          Pending
        </Button>{' '}
        <Button variant="ghost" size="sm" onPress={() => setLog([])}>
          Clear log
        </Button>
      </div>
      <ol aria-label="Event log" data-lab-output="events">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

/** A plain reset button: the browser restores the fields, with no action and no pending state. */
function ResetForm() {
  return (
    <form aria-label="Delivery note" data-lab-case="reset-form">
      <TextField label="Note" name="note" defaultValue="Leave at the door" />
      <Button type="reset">Reset</Button>
    </form>
  );
}

/** A host action run through runPendingAction rather than a button's own onPress promise. */
function HostPendingAction() {
  const [isPending, setPending] = useState(false);
  const [result, setResult] = useState('not run yet');
  const [error, setError] = useState('none');
  const settle = useRef<{ resolve: () => void; reject: (reason: Error) => void } | null>(null);
  const run = () => {
    void runPendingAction({
      blocked: isPending,
      setPending,
      action: () =>
        new Promise<void>((resolve, reject) => {
          settle.current = { resolve, reject };
        }),
      onError: (reason) => setError(String(reason)),
    }).then((ran) => setResult(ran ? 'ran' : 'did not run'));
  };
  return (
    <div data-lab-case="host-pending">
      <Button onPress={run}>Start export</Button>{' '}
      <Button variant="secondary" onPress={() => settle.current?.resolve()}>
        Finish export
      </Button>{' '}
      <Button
        variant="secondary"
        onPress={() => settle.current?.reject(new Error('The export failed'))}
      >
        Fail export
      </Button>
      <p>
        Pending: <output data-lab-output="pending">{String(isPending)}</output>
      </p>
      <p>
        Last result: <output data-lab-output="result">{result}</output>
      </p>
      <p>
        Handled error: <output data-lab-output="error">{error}</output>
      </p>
    </div>
  );
}

export function ButtonHostCases() {
  return (
    <div data-lab-family="button-host-cases">
      <LabSection
        title="Reference stylesheet import"
        description="The application opts into the reference styles with this import. Production bundles retain the stylesheet and remove unused JavaScript exports. Use the lab toolbar to preview the styles."
      >
        <pre>
          <code>{`import '@flamboyantengineer/ui-components/reference.css';
import { Button } from '@flamboyantengineer/ui-components';

<Button>Save note</Button>`}</code>
        </pre>
        <Button>Save note</Button>
      </LabSection>
      <LabSection
        title="Focus policies"
        description="Mount the buttons: autoFocus focuses the first. Type in Search notes and press Keeps focus where it was: preventFocusOnPress leaves focus in the field. Tab skips the excludeFromTabOrder button."
      >
        <FocusPolicies />
      </LabSection>
      <LabSection
        title="Press and hover events"
        description="Every press and hover callback appends to the log. Press Logged with the pointer and with Enter or Space; press it and drag off before releasing for a cancelled press (no press entry). Disabled and pending buttons log no press."
      >
        <EventLog />
      </LabSection>
      <LabSection
        title="Native reset"
        description="An ordinary reset button: edit the note and press Reset; the browser restores it. It runs no action and never shows pending, unlike the asynchronous submit button above."
      >
        <ResetForm />
      </LabSection>
      <LabSection
        title="Host pending action"
        description="Start export runs a host action through runPendingAction: pending until you finish or fail it. Starting again while pending is blocked and reports did not run; a failure reaches onError and also reports did not run."
      >
        <HostPendingAction />
      </LabSection>
    </div>
  );
}
