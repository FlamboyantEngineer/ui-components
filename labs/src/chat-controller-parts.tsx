// A minimal rendering of controller messages: text as plain text, tool calls and questions as their
// cards so the reader can answer them, and a one-line summary of every other part.

import {
  isAwaitingReader,
  type ChatControllerProps,
} from '../../src/components/chat-controller/chat-controller.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/chat-parts.js';
import { ChatQuestion } from '../../src/components/chat-question/chat-question.js';
import { ChatToolCall } from '../../src/components/chat-tool-call/chat-tool-call.js';
import { ChatMessage } from '../../src/components/chat-transcript/chat-transcript.js';
import { readerId } from './chat-controller-agents.js';

/** The answers a reply's cards take, when the reader may answer them. */
export type LabResponses = Pick<
  ChatControllerProps,
  'onApprove' | 'onDeny' | 'onAlwaysAllow' | 'onAnswerQuestion' | 'onDismissQuestion' | 'onRetry'
>;

const reader = { name: 'Ana Lopez', colorKey: 'ana' };
const helper = { name: 'Helper', colorKey: 'helper' };

/** One line that names a part this minimal rendering does not draw. */
function summarize(part: ChatPart): string {
  switch (part.type) {
    case 'reasoning':
      return `Reasoning (${part.status}${part.durationMs === undefined ? '' : `, ${part.durationMs} ms`}): ${part.text}`;
    case 'plan':
      return `Plan ${part.title ?? ''}: ${part.steps.map((step) => `${step.label} (${step.status})`).join(', ')}`;
    case 'sources':
      return `Sources: ${part.sources.map((source) => source.title).join(', ')}`;
    case 'files':
      return `Files: ${part.attachments.map((file) => file.name).join(', ')}`;
    case 'code':
      return `${part.variant === 'terminal' ? 'Terminal' : 'Code'}: ${part.code.split('\n')[0] ?? ''}`;
    case 'diff':
      return `Diff of ${part.title ?? 'a text'}: ${part.oldText} → ${part.newText}`;
    case 'custom':
      return `Custom part ${part.name}: ${JSON.stringify(part.data)}`;
    default:
      return '';
  }
}

function LabPart({ part, responses }: { part: ChatPart; responses?: LabResponses | undefined }) {
  if (part.type === 'text') return <p data-lab-part="text">{part.text}</p>;
  if (part.type === 'tool-call') {
    const { type: _type, ...call } = part;
    return (
      <ChatToolCall
        {...call}
        onApprove={responses && (() => responses.onApprove(part.id))}
        onDeny={responses && ((reason) => responses.onDeny(part.id, reason))}
        onAlwaysAllow={responses && (() => responses.onAlwaysAllow(part.id))}
      />
    );
  }
  if (part.type === 'question') {
    const { type: _type, ...card } = part;
    return (
      <ChatQuestion
        {...card}
        onSubmit={responses && ((answers) => responses.onAnswerQuestion(part.id, answers))}
        onDismiss={responses && (() => responses.onDismissQuestion(part.id))}
      />
    );
  }
  return <p data-lab-part={part.type}>{summarize(part)}</p>;
}

/** One controller message as a `ChatMessage`. */
export function LabMessage({
  message,
  responses,
}: {
  message: ChatMessageData;
  responses?: LabResponses | undefined;
}) {
  const isReader = message.authorId === readerId;
  // A reply that waits for the reader's answer is not busy, so its cards stay readable.
  const isWaiting = message.parts.some(isAwaitingReader);
  return (
    <ChatMessage
      id={message.id}
      origin={isReader ? 'sent' : 'received'}
      author={isReader ? reader : helper}
      time={message.createdAt}
      status={isWaiting && message.status === 'streaming' ? 'complete' : message.status}
      error={message.error}
      onRetry={responses && (() => responses.onRetry(message.id))}
    >
      {message.parts.map((part, index) => (
        <LabPart key={part.id ?? index} part={part} responses={responses} />
      ))}
    </ChatMessage>
  );
}
