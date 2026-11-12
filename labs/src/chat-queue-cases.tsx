// The Chat lab's send shortcuts and queue: a slow assistant, the chords by state, and what each key does.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import {
  type ChatSendFunction,
  useChatController,
} from '../../src/components/chat-controller/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import type { MessageComposerShortcuts } from '../../src/components/message-composer/index.js';
import { type KeyHint, KeyHints } from '../../src/components/shortcut/index.js';
import { fakeUpload } from './chat-agent.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';
import { requireDefined } from './require-defined.js';

/** Thinks for a moment, then echoes the reader's latest message slowly, so a queue can build up. */
const slowEcho: ChatSendFunction = async function* (messages, { signal }) {
  const latest = messages.findLast((message) => message.authorId === readerId);
  const text = latest?.parts.map((part) => (part.type === 'text' ? part.text : '')).join('') ?? '';
  const files = latest?.parts.flatMap((part) => (part.type === 'files' ? part.attachments : []));
  const seen = files?.length ? ` with ${files.map((file) => file.name).join(' and ')}` : '';
  yield { type: 'status', text: 'Reading your message…' };
  await sleep(agentTiming.word * 15, signal);
  yield* streamText(
    `Noted: **${text.trim() || 'a picture'}**${seen}. I'll take my time answering, so anything you send meanwhile waits in the queue and goes out next, in order.`,
    signal,
  );
  yield { type: 'finish' };
};

const sampleImages = [
  { name: 'harbour.svg', color: '#2f6f9f', label: 'Harbour' },
  { name: 'market.svg', color: '#b5642a', label: 'Market' },
  { name: 'tram.svg', color: '#3f8a4f', label: 'Tram' },
];

/** A small picture, as a file the clipboard could carry. */
function createSampleImage(index: number): File {
  const { name, color, label } = requireDefined(sampleImages[index % sampleImages.length]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${color}"/><text x="24" y="110" font-family="sans-serif" font-size="40" fill="#fff">${label}</text></svg>`;
  return new File([svg], name, { type: 'image/svg+xml' });
}

/** Pastes a file into the composer's text box, as Ctrl+V with an image on the clipboard does. */
function pasteImage(scope: HTMLElement | null, file: File) {
  const box = scope?.querySelector<HTMLElement>('.ui-chat__composer [role="textbox"]');
  if (!box) return;
  box.focus();
  const transfer = new DataTransfer();
  transfer.items.add(file);
  box.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }),
  );
}

interface KeyPreset {
  label: string;
  /** The chords that send, queue and send now; the composer's defaults without them. */
  shortcuts?: MessageComposerShortcuts;
  /** The chords as the legend shows them. */
  send: readonly string[];
  queue: readonly string[];
  sendNow: readonly string[];
}

const presets = {
  default: {
    label: 'Enter sends, and queues while a reply runs',
    send: ['Enter', 'Ctrl+Enter'],
    queue: ['Enter'],
    sendNow: ['Ctrl+Enter'],
  },
  busy: {
    label: 'Enter sends; Ctrl+Enter while a reply runs',
    shortcuts: { send: 'Enter', queue: 'Ctrl+Enter', sendNow: 'Ctrl+Shift+Enter' },
    send: ['Enter'],
    queue: ['Ctrl+Enter'],
    sendNow: ['Ctrl+Shift+Enter'],
  },
  modifier: {
    label: 'Always Ctrl+Enter',
    shortcuts: { send: 'Ctrl+Enter', queue: 'Ctrl+Enter', sendNow: 'Ctrl+Shift+Enter' },
    send: ['Ctrl+Enter'],
    queue: ['Ctrl+Enter'],
    sendNow: ['Ctrl+Shift+Enter'],
  },
} as const satisfies Record<string, KeyPreset>;

type PresetName = keyof typeof presets;

/** The keys the composer answers to now, by whether a reply runs and the queue holds a message. */
function keyHints(
  preset: KeyPreset,
  state: { isPending: boolean; hasQueue: boolean; canSendNow: boolean },
): KeyHint[] {
  const sending: KeyHint[] = state.isPending
    ? [
        { keys: preset.queue, action: 'queue' },
        {
          keys: preset.sendNow,
          action: state.canSendNow ? 'stop the reply and send now' : 'queue',
        },
      ]
    : [{ keys: preset.send, action: 'send' }];
  const taken = new Set([...preset.send, ...preset.queue, ...preset.sendNow]);
  return [
    ...sending,
    { keys: taken.has('Enter') ? ['Shift+Enter'] : ['Enter'], action: 'new line' },
    {
      keys: ['↑'],
      action: state.hasQueue ? 'edit the newest queued message' : 'recall an earlier message',
    },
  ];
}

/** The slow assistant with a key preset, send now, the live key legend and the queue's state. */
function QueueDemo() {
  const [presetName, setPresetName] = useState<PresetName>('default');
  const [canSendNow, setCanSendNow] = useState(true);
  const [pasted, setPasted] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const controller = useChatController({
    send: slowEcho,
    currentUserId: readerId,
    assistantId: plannerId,
    upload: fakeUpload,
  });
  const { isPending, queue } = controller.props;
  const preset: KeyPreset = presets[presetName];
  return (
    <Stack space="sm" data-lab-demo="queue">
      <ChoiceGroup
        label="Keys"
        orientation="horizontal"
        value={presetName}
        onChange={(value) => setPresetName((value ?? 'default') as PresetName)}
      >
        {Object.entries(presets).map(([value, { label }]) => (
          <Choice key={value} value={value}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <Cluster space="md">
        <Checkbox isSelected={canSendNow} onChange={setCanSendNow}>
          Send now stops the reply
        </Checkbox>
        <Button
          variant="secondary"
          onPress={() => {
            pasteImage(chatRef.current, createSampleImage(pasted));
            setPasted((count) => count + 1);
          }}
        >
          Paste a sample image
        </Button>
      </Cluster>
      <KeyHints
        aria-label="Composer keys"
        hints={keyHints(preset, { isPending, hasQueue: queue.length > 0, canSendNow })}
      />
      <div ref={chatRef} style={{ height: 520, maxWidth: 560 }}>
        <Chat
          {...controller.props}
          onSendNow={canSendNow ? controller.props.onSendNow : undefined}
          participants={assistantPeople}
          currentUserId={readerId}
          conversationId="lab-queue"
          title="Slow assistant"
          placeholder="Send a few messages in a row…"
          shortcuts={preset.shortcuts}
        />
      </div>
      <p>
        Reply: <output data-lab-output="queue-state">{isPending ? 'running' : 'idle'}</output>
        {' · '}
        Queued: <output data-lab-output="queue-count">{queue.length}</output>
      </p>
    </Stack>
  );
}

export function ChatQueueCases() {
  return (
    <LabSection
      title="Shortcuts and queue"
      description="A slow assistant that echoes each message, to try the send keys and the queue. Paste an image into the composer (or press Paste a sample image, or attach or drop one): it uploads in a second and goes out with the next message, or waits with it in the queue, where it shows beside the text and opens in the media viewer. Pick the keys: by default Enter sends (Shift+Enter breaks the line) and, while a reply runs, Enter queues and Ctrl+Enter stops the reply and sends at once; or Enter sends while idle and Ctrl+Enter queues while a reply runs (Ctrl+Shift+Enter sends now); or Ctrl+Enter always. Without Send now stops the reply, the send-now chord queues too. Queued messages wait above the composer in order; Up in the empty composer edits the newest one (Escape cancels, Save keeps the change), Steer stops the reply and sends that message at once, ahead of the others, Edit and Remove act on any one (removing the message you edit ends the edit), and once the reply ends the first goes out, then the next. A message sent now goes out at once and the queue follows it. The send button is Send while there is text and Stop while the composer is empty; Stop holds the queue: the next message you send joins its end, and the first queued message goes out. The legend shows the keys for the current state; on a touch screen Enter always breaks the line."
    >
      <QueueDemo />
    </LabSection>
  );
}
