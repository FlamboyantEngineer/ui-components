// The Chat lab's look: an assistant thread drawn as the reference image shows it, at full and narrow width.

import { useState } from 'react';
import {
  Chat,
  type ChatMessageData,
  type ChatQueuedMessage,
} from '../../src/components/chat/index.js';
import {
  lookQuestion,
  lookQueueOne,
  lookQueueSeveral,
  lookReply,
  lookRunning,
} from './chat-look-samples.js';
import { assistantPeople, getLabNow, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

interface LookDemoProps {
  /** The demo's name, for the browser tests and the showcase. */
  name: string;
  messages: readonly ChatMessageData[];
  queue?: readonly ChatQueuedMessage[] | undefined;
  /** A reply is at work: the send button stops it and messages queue. */
  isPending?: boolean | undefined;
  width: number;
}

/** One assistant thread: no avatars or names, the reply as plain text, the time in a tooltip. */
function LookDemo({ name, messages, queue: initialQueue = [], isPending, width }: LookDemoProps) {
  const [queue, setQueue] = useState(initialQueue);
  return (
    <div
      data-lab-demo={name}
      style={{ display: 'flex', flexDirection: 'column', height: 640, maxWidth: width }}
    >
      <Chat
        messages={messages}
        participants={assistantPeople}
        currentUserId={readerId}
        conversationId={name}
        getNow={getLabNow}
        showAvatars={false}
        showAuthorNames={false}
        receivedVariant="plain"
        timePlacement="tooltip"
        activityTimePlacement="none"
        thinkingUntil="content"
        isPending={isPending}
        queue={queue}
        onQueueChange={setQueue}
        onSend={(text) =>
          setQueue((current) => [...current, { id: `${name}-${current.length}`, text }])
        }
        // The host never settles a steer here, so the row stays in its steering state.
        onSteer={() => new Promise<void>(() => undefined)}
        onAnswerQuestion={() => undefined}
        presentation="embedded"
        showSendOptions
        placeholder="Ask a follow-up"
      />
    </div>
  );
}

export function ChatLookCases() {
  return (
    <LabSection
      title="Look"
      description="An assistant thread as the reference stylesheet draws it: the reader's messages in bubbles on the right, the reply as text, reasoning and commands as trace lines that open onto a ruled panel, code in a rounded card with its copy button, a round button that jumps to the latest message, the composer as one rounded box and queued messages in a box that sits on its top edge, a little narrower than the composer. Press Steer on a queued message to see its steering state."
    >
      <LookDemo name="look-reply" messages={lookReply} queue={lookQueueOne} width={720} />
      <LookDemo
        name="look-running"
        messages={lookRunning}
        queue={lookQueueSeveral}
        isPending
        width={720}
      />
      <LookDemo name="look-question" messages={lookQuestion} width={720} />
      <LookDemo
        name="look-narrow"
        messages={lookRunning}
        queue={lookQueueSeveral}
        isPending
        width={360}
      />
    </LabSection>
  );
}
