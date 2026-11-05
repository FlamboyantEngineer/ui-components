// A working session for the Chat Parts lab: an assistant edits a small recipe site, writing what it
// found between its runs of tool calls, so each run sums up in one quiet line.

import { useState } from 'react';
import {
  type ChatPart,
  ChatParts,
  type ChatToolCallPart,
} from '../../src/components/chat-parts/index.js';

const succeeded = (call: Omit<ChatToolCallPart, 'type' | 'status'>): ChatToolCallPart => ({
  type: 'tool-call',
  status: 'succeeded',
  ...call,
});

const read = (id: string, target: string) =>
  succeeded({ id, name: 'read_file', label: 'Read', target, kind: 'read', durationMs: 40 });

const edit = (id: string, target: string) =>
  succeeded({
    id,
    name: 'edit_file',
    label: 'Edited',
    target,
    kind: 'edit',
    args: { path: target },
    durationMs: 60,
  });

const run = (id: string, command: string, output: string) =>
  succeeded({
    id,
    name: 'run_command',
    label: 'Ran',
    target: command,
    kind: 'command',
    args: { command },
    result: output,
    durationMs: 4200,
  });

const text = (value: string): ChatPart => ({ type: 'text', text: value });

/** The session's parts: reasoning and runs of calls, with the assistant's notes between them. */
const sessionParts: ChatPart[] = [
  {
    type: 'reasoning',
    id: 'session-plan',
    text: 'The timer resets when the page reloads; the saved state is read too late.',
    status: 'complete',
    durationMs: 3000,
  },
  read('session-read-1', 'src/timer.ts'),
  read('session-read-2', 'src/storage.ts'),
  edit('session-edit-1', 'src/timer.ts'),
  edit('session-edit-2', 'src/storage.ts'),
  run('session-run-1', 'npm test', '18 passed, 1 failed'),
  run('session-run-2', 'npm test -- timer', '6 passed'),
  text(
    'The timer now restores its state on reload. One remaining failure comes from the shopping list test, which reads the page before the recipes load.',
  ),
  read('session-read-3', 'test/shopping-list.test.ts'),
  edit('session-edit-3', 'test/shopping-list.test.ts'),
  run('session-run-3', 'npm test', '19 passed'),
  text('All 19 tests pass. I checked the shopping list test three times in a row.'),
  read('session-read-4', 'notes.txt'),
  run('session-run-4', 'npm run build', 'Built in 2.4 s'),
  text('The build passes too. I updated the notes and the changes are ready.'),
];

/** The session, its last run open so its quiet rows show. */
export function WorkingSession() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'steps:session-read-4': true,
  });
  return (
    <div style={{ width: 560 }} data-lab-demo="working-session">
      <ChatParts
        parts={sessionParts}
        messageId="session"
        expandedParts={expanded}
        onExpandedPartsChange={setExpanded}
      />
    </div>
  );
}
