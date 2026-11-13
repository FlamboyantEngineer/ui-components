// The Chat lab's slow host: sending, queuing, steering and editing take a while to be accepted, so
// the progress line and the busy buttons show; and the reader's sending options in the "+" menu.

import { type ReactNode, useState } from 'react';
import { Chat, type ChatProps } from '../../src/components/chat/index.js';
import {
  type ChatSendFunction,
  useChatController,
} from '../../src/components/chat-controller/index.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { Stack } from '../../src/components/layout/layout.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

/** Thinks, then answers slowly, so there is time to queue and steer. */
const slowAnswer: ChatSendFunction = async function* (messages, { signal }) {
  const latest = messages.findLast((message) => message.authorId === readerId);
  const text = latest?.parts.map((part) => (part.type === 'text' ? part.text : '')).join('') ?? '';
  yield { type: 'status', text: 'Reading your message…' };
  await sleep(agentTiming.word * 10, signal);
  yield* streamText(
    `About **${text.trim()}**: I answer slowly, so you can queue or steer meanwhile.`,
    signal,
  );
  yield { type: 'finish' };
};

const delays = { instant: 0, quick: 250, slow: 1500, stalled: 6000 } as const;
type DelayName = keyof typeof delays;

const icons = { clock: undefined, spinner: true } as const;
type IconName = keyof typeof icons;

/** Calls `run` once the host has taken `delay` to accept, as a request to a server would. */
function later<T extends unknown[]>(delay: number, run: (...args: T) => void) {
  return async (...args: T) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    run(...args);
  };
}

/** The controller's callbacks, each accepted only after the chosen delay. */
function useSlowHost(delay: number): ChatProps {
  const controller = useChatController({
    send: slowAnswer,
    currentUserId: readerId,
    assistantId: plannerId,
  });
  const { props } = controller;
  return {
    ...props,
    participants: assistantPeople,
    currentUserId: readerId,
    onSend: later(delay, props.onSend),
    onSendNow: later(delay, props.onSendNow),
    onSteer: later(delay, props.onSteer),
    onQueueChange: later(delay, props.onQueueChange),
  };
}

function Options<T extends string>(props: {
  label: string;
  value: T;
  choices: Record<T, ReactNode>;
  onChange: (value: T) => void;
}) {
  return (
    <ChoiceGroup
      label={props.label}
      orientation="horizontal"
      value={props.value}
      onChange={(value) => {
        if (value !== null) props.onChange(value as T);
      }}
    >
      {Object.entries<ReactNode>(props.choices).map(([value, label]) => (
        <Choice key={value} value={value}>
          {label}
        </Choice>
      ))}
    </ChoiceGroup>
  );
}

function SlowHostDemo() {
  const [delayName, setDelayName] = useState<DelayName>('slow');
  const [iconName, setIconName] = useState<IconName>('clock');
  const chat = useSlowHost(delays[delayName]);
  return (
    <Stack space="sm" data-lab-demo="slow-host">
      <Options
        label="The host accepts"
        value={delayName}
        choices={{
          instant: 'At once',
          quick: 'In 250 ms',
          slow: 'In 1.5 s',
          stalled: 'In 6 s',
        }}
        onChange={setDelayName}
      />
      <Options
        label="Progress icon"
        value={iconName}
        choices={{ clock: 'Clock (default)', spinner: 'Spinner' }}
        onChange={setIconName}
      />
      <div style={{ height: 480, maxWidth: 560 }}>
        <Chat
          {...chat}
          conversationId="lab-slow-host"
          title="Slow host"
          placeholder="Send, queue or steer…"
          progressIcon={icons[iconName]}
          showSendOptions
        />
      </div>
    </Stack>
  );
}

export function ChatProgressCases() {
  return (
    <LabSection
      title="Slow host"
      description="The host takes a while to accept what the reader does, as a server would. Once it has waited 400 ms, the line above the composer says what the chat waits for (Sending…, Queuing… while a reply runs, Steering…, Saving… an edit of a queued message, Removing…) with the clock a message waiting for delivery shows, or the spinner with Progress icon; the pressed button shows itself busy too, and the line is announced once. A host that answers within 400 ms shows nothing. The + menu always holds the reader's sending options, stored for every conversation, whether or not a reply runs: Steer automatically sends a message written during a reply at once (Enter, Ctrl+Enter and Send all steer) instead of queuing it, and Send with Ctrl+Enter makes Enter break the line."
    >
      <SlowHostDemo />
    </LabSection>
  );
}
