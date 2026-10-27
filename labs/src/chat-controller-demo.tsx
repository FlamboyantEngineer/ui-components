// The controller driving a fake streaming agent, with its event log beside the conversation.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatStatusLine } from '../../src/components/chat-activity/index.js';
import { ChatAttachmentList } from '../../src/components/chat-attachment/chat-attachment.js';
import {
  useChatController,
  type ChatQueuedMessage,
  type ChatSendFunction,
  type ChatStreamEvent,
  type ChatUploadFunction,
} from '../../src/components/chat-controller/chat-controller.js';
import type { ChatMessageData } from '../../src/components/chat-parts/chat-parts.js';
import { ChatTranscript } from '../../src/components/chat-transcript/index.js';
import { Cluster, Grid, Stack } from '../../src/components/layout/layout.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import {
  agents,
  helperId,
  readerId,
  scenarios,
  type LabScenario,
} from './chat-controller-agents.js';
import { LabMessage } from './chat-controller-parts.js';

const initialMessages: ChatMessageData[] = [
  {
    id: 'welcome-question',
    authorId: readerId,
    createdAt: '2026-04-20T10:00:00.000Z',
    parts: [{ type: 'text', text: 'What can you cook with beans?' }],
  },
  {
    id: 'welcome-answer',
    authorId: helperId,
    createdAt: '2026-04-20T10:00:05.000Z',
    parts: [{ type: 'text', text: 'Plenty. Pick how I behave above, then ask me something.' }],
  },
];

/** Uploads in a second, a quarter at a time; a file named `broken…` fails its first upload. */
const failedOnce = new Set<string>();
const fakeUpload: ChatUploadFunction = (file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 0.25;
      onProgress(progress);
      if (progress < 1) return;
      clearInterval(timer);
      if (file.name.startsWith('broken') && !failedOnce.has(file.name)) {
        failedOnce.add(file.name);
        reject(new Error(`${file.name} is damaged. Try again.`));
        return;
      }
      const url = URL.createObjectURL(file);
      resolve(file.type.startsWith('image/') ? { url, thumbnailUrl: url } : { url });
    }, 250);
    signal.addEventListener('abort', () => clearInterval(timer));
  });

/** One line of the event log. */
function describeEvent(event: ChatStreamEvent): string {
  const { type, ...rest } = event;
  const detail = JSON.stringify(rest);
  return detail === '{}'
    ? type
    : `${type} ${detail.length > 90 ? `${detail.slice(0, 90)}…` : detail}`;
}

/** Wraps `send` so every call, event and awaited response lands in the log. */
function withLog(send: ChatSendFunction, log: (line: string) => void): ChatSendFunction {
  return async function* (messages, context) {
    log(`send(${messages.length} messages)`);
    const waitFor = async (id: string) => {
      const response = await context.waitFor(id);
      log(`waitFor(${id}) → ${JSON.stringify(response)}`);
      return response;
    };
    for await (const event of send(messages, { ...context, waitFor })) {
      log(describeEvent(event));
      yield event;
    }
  };
}

function QueueList({
  queue,
  onQueueChange,
}: {
  queue: readonly ChatQueuedMessage[];
  onQueueChange: (queue: readonly ChatQueuedMessage[]) => void;
}) {
  if (queue.length === 0) return null;
  return (
    <ol aria-label="Queued messages" data-lab-queue="">
      {queue.map((entry, index) => (
        <li key={entry.id}>
          <TextField
            label={`Queued message ${index + 1}`}
            value={entry.text}
            onChange={(text) =>
              onQueueChange(queue.map((item) => (item.id === entry.id ? { ...item, text } : item)))
            }
          />
          <Button
            size="sm"
            onPress={() => onQueueChange(queue.filter((item) => item.id !== entry.id))}
          >
            Remove queued message {index + 1}
          </Button>
        </li>
      ))}
    </ol>
  );
}

export function ChatControllerDemo() {
  const [scenario, setScenario] = useState<LabScenario>('answer');
  const [log, setLog] = useState<string[]>([]);
  const [allowed, setAllowed] = useState<readonly string[]>([]);
  const started = useRef(Date.now());
  const append = (line: string) => {
    const seconds = ((Date.now() - started.current) / 1000).toFixed(1);
    setLog((lines) => [...lines.slice(-199), `+${seconds} s ${line}`]);
  };
  const chat = useChatController({
    send: withLog(agents[scenario], append),
    currentUserId: readerId,
    assistantId: helperId,
    initialMessages,
    upload: fakeUpload,
    alwaysAllowed: allowed,
    onAlwaysAllowedChange: setAllowed,
  });
  const { props } = chat;
  const reply = props.messages.at(-1);
  const isThinking = props.isPending && reply?.authorId === helperId && reply.parts.length === 0;
  const hasUploaded = props.attachments.some((entry) => entry.status === 'complete');
  return (
    <Stack space="md" data-lab-demo="controller">
      <ChoiceGroup
        label="Agent behaviour"
        orientation="horizontal"
        value={scenario}
        onChange={(value) => setScenario((value ?? 'answer') as LabScenario)}
      >
        {Object.entries(scenarios).map(([value, label]) => (
          <Choice key={value} value={value}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <Grid columns={2} space="md">
        <Stack space="sm">
          <div style={{ height: 420 }}>
            <ChatTranscript aria-label="Conversation with the helper">
              {props.messages.map((message) => (
                <LabMessage key={message.id} message={message} responses={props} />
              ))}
            </ChatTranscript>
          </div>
          <ChatStatusLine
            text={chat.statusText}
            isRunning={isThinking || chat.statusText !== undefined}
          />
          <QueueList queue={chat.queue} onQueueChange={props.onQueueChange} />
          <MessageComposer
            aria-label="Message the helper"
            placeholder="Ask the helper…"
            allowsEmptySubmit={hasUploaded}
            onSubmit={(text) => props.onSend(text)}
            attachments={
              <ChatAttachmentList
                attachments={props.attachments}
                onRemove={props.onRemoveAttachment}
                onRetry={props.onRetryAttachment}
              />
            }
            startControls={
              <>
                <label>
                  Attach files{' '}
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      props.onAttach?.([...(event.currentTarget.files ?? [])]);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <Button size="sm" isDisabled={!chat.isPending} onPress={chat.stop}>
                  Stop
                </Button>
              </>
            }
          />
          <Stack space="xs">
            <span>Always allowed: {allowed.length ? allowed.join(', ') : 'none'}</span>
            <Cluster>
              <Button size="sm" isDisabled={allowed.length === 0} onPress={() => setAllowed([])}>
                Forget always allowed tools
              </Button>
              <Button size="sm" isDisabled={chat.isPending} onPress={() => chat.setMessages([])}>
                Clear the conversation
              </Button>
              <Button
                size="sm"
                isDisabled={chat.isPending || reply?.status !== 'error'}
                onPress={chat.retry}
              >
                Retry the last turn
              </Button>
            </Cluster>
          </Stack>
          <ol aria-label="Sent prompts">
            {props.history.map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ol>
        </Stack>
        <div style={{ position: 'relative', height: 640 }}>
          <ScrollRegion fill role="region" aria-label="Event log" tabIndex={0} stickToBottom>
            <ol data-lab-log="">
              {log.map((line, index) => (
                <li key={index}>
                  <code>{line}</code>
                </li>
              ))}
            </ol>
          </ScrollRegion>
        </div>
      </Grid>
    </Stack>
  );
}
