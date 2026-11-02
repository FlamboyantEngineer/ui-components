// A host that owns a picker's open state, for the open-state sections of the picker labs.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { LabOutput } from './lab-output.js';

/** How long the host waits before closing or locking, so the reader can open the picker first. */
const hostDelay = 2000;

/**
 * The host side of a controlled picker: `props` holds `isOpen`, `onOpenChange` and the locks;
 * `panel` holds the buttons that change them and the outputs that show them. Each request the
 * picker makes is logged before the host grants it. Closing and locking wait two seconds, since
 * a press outside an open picker would itself close it.
 */
export function useHostOpen(name: string) {
  const [isOpen, setOpen] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const [isDisabled, setDisabled] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const later = (change: () => void) => window.setTimeout(change, hostDelay);
  const props = {
    isOpen,
    onOpenChange: (next: boolean) => {
      setRequests((list) => [...list.slice(-4), next ? 'open' : 'close']);
      setOpen(next);
    },
    isDisabled,
    isReadOnly,
  };
  const panel = (
    <p>
      <Button size="sm" onPress={() => setOpen(true)}>{`Open the ${name}`}</Button>{' '}
      <Button size="sm" onPress={() => later(() => setOpen(false))}>
        {`Close the ${name} in 2 s`}
      </Button>{' '}
      <Button
        size="sm"
        onPress={() => (isDisabled ? setDisabled(false) : later(() => setDisabled(true)))}
      >
        {isDisabled ? `Enable the ${name}` : `Disable the ${name} in 2 s`}
      </Button>{' '}
      <Button
        size="sm"
        onPress={() => (isReadOnly ? setReadOnly(false) : later(() => setReadOnly(true)))}
      >
        {isReadOnly ? `Make the ${name} editable` : `Make the ${name} read-only in 2 s`}
      </Button>
      <LabOutput name={`Host open ${name}`}>{String(isOpen)}</LabOutput>
      <LabOutput name={`Open requests ${name}`}>{requests.join(', ') || 'none'}</LabOutput>
    </p>
  );
  return { props, panel };
}
