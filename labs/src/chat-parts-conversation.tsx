// Interactive demos for the Chat Parts lab: a conversation mixing every part, whose host records
// each callback; tool renderers; and expansion kept by the host across remounts.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatParts,
  type ChatMessageData,
  type ChatPart,
  type ChatParticipant,
  type ChatToolCallHandlers,
  type ChatToolCallPart,
  type ChatToolRenderer,
} from '../../src/components/chat-parts/index.js';
import { ChatMessage } from '../../src/components/chat-transcript/chat-transcript.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { kindSamples, tripAttachments } from './chat-attachment-samples.js';
import {
  bookingCall,
  forecastRenderer,
  partSamples,
  renderLabPart,
  textTokens,
  tokenText,
  tripQuestion,
  tripSources,
  weatherCall,
  weatherCard,
} from './chat-parts-samples.js';

const participants: ChatParticipant[] = [
  { id: 'me', name: 'Sam Reed', kind: 'person' },
  { id: 'planner', name: 'Trip planner', kind: 'assistant', colorKey: 'planner' },
];

const getNow = () => new Date('2026-04-18T09:06:00Z');

const answer =
  'The **8:05** arrives at 10:50 [2], and spring is mild [1]. Save the plan with:\n\n```console\n$ trips save porto\n```';

const conversation: ChatMessageData[] = [
  {
    id: 'm1',
    authorId: 'me',
    createdAt: '2026-04-18T09:00:00Z',
    parts: [
      { type: 'text', text: tokenText, tokens: textTokens },
      { type: 'files', attachments: tripAttachments.slice(0, 2) },
    ],
  },
  {
    id: 'm2',
    authorId: 'planner',
    createdAt: '2026-04-18T09:01:00Z',
    parts: [
      ...partSamples.plan,
      ...partSamples.reasoning,
      weatherCall,
      bookingCall,
      { type: 'text', text: answer },
      { type: 'sources', sources: tripSources },
      tripQuestion,
      ...partSamples.code,
      ...partSamples.diff,
      weatherCard,
      { type: 'files', attachments: [{ ...kindSamples.text, status: 'error' }] },
    ],
  },
];

type PartUpdate = (part: ChatPart) => ChatPart;

/** The messages with one part changed, found by its id. */
function updatePart(messages: ChatMessageData[], id: string, update: PartUpdate) {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => (part.id === id ? update(part) : part)),
  }));
}

function decide(decision: 'approved' | 'denied' | 'always', reason?: string): PartUpdate {
  return (part) =>
    part.type === 'tool-call'
      ? {
          ...part,
          status: decision === 'denied' ? 'denied' : 'succeeded',
          approval: { ...part.approval, decision, reason },
          result: decision === 'denied' ? undefined : { booked: true, seats: 2 },
        }
      : part;
}

/** A conversation whose host records each decision, answer and retry, and logs the callbacks. */
export function MixedConversation() {
  const [messages, setMessages] = useState(conversation);
  const [log, setLog] = useState<string[]>([]);
  const record = (entry: string, id?: string, update?: PartUpdate) => {
    setLog((entries) => [...entries, entry]);
    if (id && update) setMessages((current) => updatePart(current, id, update));
  };
  return (
    <Stack space="md" data-lab-demo="conversation">
      {messages.map((message) => {
        const participant = participants.find((entry) => entry.id === message.authorId);
        // The participant's kind says who answers; the avatar draws a person either way.
        const author = participant && { name: participant.name, colorKey: participant.colorKey };
        return (
          <ChatMessage
            key={message.id}
            id={message.id}
            origin={message.authorId === 'me' ? 'sent' : 'received'}
            author={author}
            time={message.createdAt}
            getNow={getNow}
          >
            <ChatParts
              parts={message.parts}
              messageId={message.id}
              toolRenderers={{ get_weather: forecastRenderer }}
              renderPart={renderLabPart}
              onApprove={(id) => record(`onApprove(${id})`, id, decide('approved'))}
              onDeny={(id, reason) =>
                record(`onDeny(${id}, ${reason ?? 'no reason'})`, id, decide('denied', reason))
              }
              onAlwaysAllow={(id) => record(`onAlwaysAllow(${id})`, id, decide('always'))}
              onAnswerQuestion={(id, answers) =>
                record(`onAnswerQuestion(${id}, ${JSON.stringify(answers)})`, id, (part) =>
                  part.type === 'question' ? { ...part, status: 'answered', answers } : part,
                )
              }
              onDismissQuestion={(id) =>
                record(`onDismissQuestion(${id})`, id, (part) =>
                  part.type === 'question' ? { ...part, status: 'dismissed' } : part,
                )
              }
              onRetryAttachment={(id) => record(`onRetryAttachment(${id})`)}
              onApplyCode={(code, part) =>
                record(`onApplyCode(${JSON.stringify(code)}, ${part.language ?? 'no language'})`)
              }
            />
          </ChatMessage>
        );
      })}
      <section aria-label="Callbacks">
        <ol data-lab-log="conversation">
          {log.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ol>
      </section>
    </Stack>
  );
}

/** A host's own booking card, drawn in place of the whole tool call card. */
function BookingCard({
  call,
  handlers,
}: {
  call: ChatToolCallPart;
  handlers: ChatToolCallHandlers;
}) {
  const decision = call.approval?.decision;
  return (
    <section aria-label="Train booking" data-lab-booking={decision ?? 'pending'}>
      <p>
        Book the <strong>8:05</strong> to Porto for two?
      </p>
      {decision ? (
        <p>{decision === 'denied' ? 'Not booked.' : 'Booked.'}</p>
      ) : (
        <Cluster space="sm">
          <Button variant="primary" onPress={() => handlers.onApprove?.()}>
            Book it
          </Button>
          <Button onPress={() => handlers.onDeny?.()}>Not now</Button>
        </Cluster>
      )}
    </section>
  );
}

const bookingRenderer: ChatToolRenderer = {
  replaces: 'card',
  render: (call, handlers) => <BookingCard call={call} handlers={handlers} />,
};

/** A forecast drawn inside the default card, and a booking drawn in place of the whole card. */
export function ToolRenderers() {
  const [booking, setBooking] = useState(bookingCall);
  const decideBooking = (decision: 'approved' | 'denied') =>
    setBooking((call) => decide(decision)(call) as ChatToolCallPart);
  return (
    <Stack space="sm" data-lab-demo="tool-renderers">
      <ChatParts
        parts={[weatherCall]}
        messageId="renderer-body"
        toolRenderers={{ get_weather: forecastRenderer }}
        expandedParts={{ [weatherCall.id]: true }}
      />
      <ChatParts
        parts={[booking]}
        messageId="renderer-card"
        toolRenderers={{ book_train: bookingRenderer }}
        onApprove={() => decideBooking('approved')}
        onDeny={() => decideBooking('denied')}
      />
      <Button onPress={() => setBooking(bookingCall)}>Ask again</Button>
      <ChatParts
        parts={[
          {
            type: 'tool-call',
            id: 'call-to-string',
            name: 'toString',
            label: 'Convert the notes to text',
            status: 'succeeded',
          },
        ]}
        messageId="renderer-own-key"
        toolRenderers={{ get_weather: forecastRenderer }}
      />
    </Stack>
  );
}

/** Steps whose open and closed choices the host keeps, so they survive a remount. */
export function KeptExpansion() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'steps:r1': true, r1: true });
  const [mount, setMount] = useState(0);
  return (
    <Stack space="sm" data-lab-demo="kept-expansion">
      <Cluster space="sm">
        <Button onPress={() => setMount((value) => value + 1)}>Remount</Button>
        <Button onPress={() => setExpanded({})}>Forget the choices</Button>
      </Cluster>
      <ChatParts
        key={mount}
        parts={[...partSamples.reasoning, weatherCall, { type: 'text', text: 'Pack a jacket.' }]}
        messageId="kept"
        toolRenderers={{ get_weather: forecastRenderer }}
        expandedParts={expanded}
        onExpandedPartsChange={setExpanded}
      />
      <p>
        expandedParts: <code data-lab-expanded="">{JSON.stringify(expanded)}</code>
      </p>
    </Stack>
  );
}
