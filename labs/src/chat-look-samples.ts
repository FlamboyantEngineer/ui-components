// Sample conversations for the Chat lab's look: a reply with traces and code, one at work, a question.

import type { ChatMessageData, ChatQueuedMessage } from '../../src/components/chat/index.js';
import { plannerId, readerId } from './chat-samples.js';

const asked: ChatMessageData = {
  id: 'look-ask',
  authorId: readerId,
  createdAt: '2026-04-20T10:20:00',
  parts: [{ type: 'text', text: 'Add a dark mode toggle to the settings page.' }],
};

const toggleCode = `const { setTheme } = useTheme();

export function ModeToggle() {
  return <Switch onChange={(dark) => setTheme(dark ? 'dark' : 'light')}>Dark mode</Switch>;
}`;

/** A finished reply: what it thought, the command it ran, then the answer with a code block. */
export const lookReply: readonly ChatMessageData[] = [
  asked,
  {
    id: 'look-reply',
    authorId: plannerId,
    createdAt: '2026-04-20T10:21:00',
    parts: [
      {
        type: 'reasoning',
        id: 'look-thought',
        status: 'complete',
        durationMs: 4000,
        text: 'I need to know how themes are set up before I add a toggle. If a theme provider is already in the layout, the toggle only has to call `setTheme`.',
      },
      {
        type: 'tool-call',
        id: 'look-search',
        name: 'run_command',
        label: 'Ran',
        target: 'grep -rl ThemeProvider src',
        kind: 'command',
        status: 'succeeded',
        durationMs: 300,
        grouping: 'standalone',
        args: { command: 'grep -rl ThemeProvider src' },
        result: 'src/layout.tsx',
      },
      {
        type: 'text',
        text: [
          'The theme provider is already set up in `src/layout.tsx`, so the toggle only has to call `setTheme`.',
          '',
          '**Changes**',
          '',
          '- Added `src/mode-toggle.tsx` with a Light and Dark option.',
          '- Put `<ModeToggle />` next to the Appearance heading in `src/settings/page.tsx`.',
          '',
          '```tsx',
          toggleCode,
          '```',
        ].join('\n'),
      },
    ],
  },
];

/** The same conversation with a follow-up whose reply is still at work. */
export const lookRunning: readonly ChatMessageData[] = [
  ...lookReply,
  {
    id: 'look-follow',
    authorId: readerId,
    createdAt: '2026-04-20T10:24:00',
    parts: [{ type: 'text', text: 'Make it follow the system setting by default.' }],
  },
  {
    id: 'look-working',
    authorId: plannerId,
    createdAt: '2026-04-20T10:24:30',
    status: 'streaming',
    parts: [
      {
        type: 'reasoning',
        id: 'look-thinking',
        status: 'complete',
        durationMs: 2000,
        text: 'The provider takes a default theme; `system` follows the reader’s setting.',
      },
      {
        type: 'tool-call',
        id: 'look-edit',
        name: 'edit_file',
        label: 'Edited',
        target: 'src/layout.tsx',
        kind: 'edit',
        status: 'succeeded',
        durationMs: 800,
      },
      {
        type: 'tool-call',
        id: 'look-build',
        name: 'run_command',
        label: 'Build',
        target: 'npm run build',
        kind: 'command',
        status: 'running',
      },
    ],
  },
];

/** A reply that asks the reader to choose before it goes on. */
export const lookQuestion: readonly ChatMessageData[] = [
  asked,
  {
    id: 'look-asking',
    authorId: plannerId,
    createdAt: '2026-04-20T10:21:00',
    parts: [
      { type: 'text', text: 'Before I add it, one choice about where it goes.' },
      {
        type: 'question',
        id: 'look-where',
        status: 'pending',
        questions: [
          {
            id: 'place',
            question: 'Where should the toggle go?',
            selectionMode: 'single',
            allowsOther: true,
            options: [
              {
                id: 'heading',
                label: 'Next to the Appearance heading',
                isRecommended: true,
                description: 'Where readers look for theme settings.',
              },
              { id: 'header', label: 'In the page header' },
              { id: 'menu', label: 'In the account menu' },
            ],
          },
        ],
      },
    ],
  },
];

export const lookQueueOne: readonly ChatQueuedMessage[] = [
  { id: 'look-queued-a', text: 'Run the build before I ship it.' },
];

export const lookQueueSeveral: readonly ChatQueuedMessage[] = [
  ...lookQueueOne,
  { id: 'look-queued-b', text: 'Then add a test for the toggle in both themes.' },
  {
    id: 'look-queued-c',
    text: 'And note the change in the changelog, with a short line on the system default that stays readable when it is long.',
  },
];
