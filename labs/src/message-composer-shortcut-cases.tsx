// The MessageComposer lab's shortcuts: chords the reader types in, by state, with a log of what each key did.

import { useState } from 'react';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import {
  MessageComposer,
  type MessageComposerShortcuts,
} from '../../src/components/message-composer/index.js';
import { KeyHints } from '../../src/components/shortcut/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

type ShortcutAction = keyof MessageComposerShortcuts;

const actions: Record<ShortcutAction, { label: string; initial: string }> = {
  send: { label: 'Send while idle', initial: 'Enter, Ctrl+Enter' },
  queue: { label: 'Queue while a reply runs', initial: 'Enter' },
  sendNow: { label: 'Send now while a reply runs', initial: 'Ctrl+Enter' },
};

/** The chords typed in a field, separated by commas. */
function parseChords(text: string): string[] {
  return text
    .split(',')
    .map((chord) => chord.trim())
    .filter(Boolean);
}

/** Chords typed in for each action, a switch for the running reply, and what each send did. */
function ShortcutDemo() {
  const [chords, setChords] = useState<Record<ShortcutAction, string>>({
    send: actions.send.initial,
    queue: actions.queue.initial,
    sendNow: actions.sendNow.initial,
  });
  const [isPending, setIsPending] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const record = (entry: string) => setLog((list) => [...list, entry].slice(-4));
  const shortcuts = {
    send: parseChords(chords.send),
    queue: parseChords(chords.queue),
    sendNow: parseChords(chords.sendNow),
  };
  const shown = isPending ? (['queue', 'sendNow'] as const) : (['send'] as const);
  return (
    <Stack space="sm" data-lab-demo="shortcuts">
      <Cluster space="sm">
        {(Object.keys(actions) as ShortcutAction[]).map((action) => (
          <TextField
            key={action}
            label={actions[action].label}
            description="Chords, separated by commas"
            value={chords[action]}
            onChange={(text) => setChords((current) => ({ ...current, [action]: text }))}
          />
        ))}
      </Cluster>
      <Switch isSelected={isPending} onChange={setIsPending}>
        A reply is running
      </Switch>
      <KeyHints
        aria-label="What the keys do now"
        hints={shown
          .filter((action) => shortcuts[action].length > 0)
          .map((action) => ({ keys: shortcuts[action], action: actions[action].label }))}
      />
      <MessageComposer
        aria-label="Message with custom shortcuts"
        placeholder="Type, then try each chord"
        isPending={isPending}
        allowsPendingSubmit
        shortcuts={shortcuts}
        onStop={() => setIsPending(false)}
        onSubmit={(text) => record(`${isPending ? 'Queued' : 'Sent'}: ${text}`)}
        onSubmitNow={(text) => record(`Sent now: ${text}`)}
        data-lab-composer="shortcuts"
      />
      <p>
        Last sends: <output data-lab-output="shortcut-log">{log.join(' · ') || 'nothing'}</output>
      </p>
    </Stack>
  );
}

export function ComposerShortcutSection() {
  return (
    <LabSection
      title="Shortcuts"
      description="shortcuts={{ send, queue, sendNow }} takes any chord in Shortcut notation for each action, one or several (type them separated by commas; Ctrl is Command on macOS). While idle, send's chords send. While a reply runs, queue's chords send through onSubmit for the host to queue, and sendNow's go to onSubmitNow, for a host that stops the reply and sends at once. An Enter no chord takes breaks the line, and the button's tooltip shows the first chord that sends. Switch the running reply off and on, or press Stop, to see the keys change; the legend shows what they do now. On a touch screen a bare Enter always breaks the line."
    >
      <ShortcutDemo />
    </LabSection>
  );
}
