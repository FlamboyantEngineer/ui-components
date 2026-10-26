// The Chat lab's host controls: Quote in an assistant chat, the composer's "+" menu and the host's
// tools beside the model picker, Ctrl+Enter, blank messages carried by selected context or files,
// and sending the host must accept.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatAttachmentData } from '../../src/components/chat-attachment/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Stack } from '../../src/components/layout/layout.js';
import { UiProvider } from '../../src/core/provider.js';
import { useLabModelChoice } from './chat-assistant-host.js';
import {
  assistantPeople,
  nextLabId,
  nowIso,
  plannerId,
  readerId,
  sentMessage,
  textMessage,
} from './chat-samples.js';
import { LabSection } from './chrome/index.js';
import { createLabComposerMenu } from './message-composer-menu-cases.js';

const quoteStrings = { reply: 'Quote', chatReplyingTo: 'Quoting', chatCancelReply: 'Cancel quote' };

const initialMessages: ChatMessageData[] = [
  textMessage({
    id: 'host-question',
    time: '2026-04-20T09:40:00',
    authorId: readerId,
    text: 'Which trains reach the coast before noon on Saturday?',
  }),
  textMessage({
    id: 'host-answer',
    time: '2026-04-20T09:40:20',
    authorId: plannerId,
    text: 'Two do: the **8:05**, direct, arriving at 10:12, and the **9:30**, changing once, arriving at 11:48.',
  }),
];

/** Waits like a request to a server, then accepts or refuses. */
function request(refuse: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (refuse ? reject(new Error('Service unavailable')) : resolve()), 700);
  });
}

/**
 * The conversation, and a host that accepts a message after a moment or refuses it when asked; in
 * plan mode its reply outlines the steps first.
 */
function useAcceptingHost(isPlanning: boolean) {
  const [messages, setMessages] = useState<readonly ChatMessageData[]>(initialMessages);
  const [refuseNext, setRefuseNext] = useState(true);
  const [error, setError] = useState('');
  const accept = async (text: string, tokens: readonly ChatTextToken[], replyTo?: string) => {
    setError('');
    await request(refuseNext);
    setRefuseNext(false);
    const noted = isPlanning ? 'Noted. First the steps, then the details.' : 'Noted.';
    const answer = text.trim() === '' ? 'Using the selected rows as the question.' : noted;
    setMessages((list) => [
      ...list,
      sentMessage(text || '(no text)', tokens, replyTo ? { replyTo } : {}),
      {
        id: nextLabId('host-reply'),
        authorId: plannerId,
        createdAt: nowIso(),
        parts: [{ type: 'text', text: answer }],
      },
    ]);
  };
  return {
    messages,
    refuseNext,
    setRefuseNext,
    error,
    onSend: (text: string, tokens: readonly ChatTextToken[] = []) => accept(text, tokens),
    onReply: (id: string, text: string, tokens: readonly ChatTextToken[]) =>
      accept(text, tokens, id),
    onSendError: (reason: unknown) => {
      setRefuseNext(false);
      setError(
        `Not sent: ${reason instanceof Error ? reason.message : 'unknown error'}. Your message is kept; send it again.`,
      );
    },
  };
}

/** The files the reader attached from the menu, which the next accepted message takes. */
function useLabAttachments() {
  const [files, setFiles] = useState<readonly ChatAttachmentData[]>([]);
  return {
    attachments: files,
    onAttach: (added: File[]) =>
      setFiles((list) => [
        ...list,
        ...added.map((file) => ({
          id: nextLabId('host-file'),
          name: file.name,
          mediaType: file.type,
        })),
      ]),
    onRemoveAttachment: (id: string) => setFiles((list) => list.filter((file) => file.id !== id)),
    clear: () => setFiles([]),
  };
}

/**
 * The assistant chat with the composer's "+" menu and the host's checkboxes beside the model
 * picker, and the host's error.
 */
function HostDemo() {
  const [isPlanning, setPlanning] = useState(false);
  const host = useAcceptingHost(isPlanning);
  const files = useLabAttachments();
  const { modelPicker } = useLabModelChoice();
  const [allowChanges, setAllowChanges] = useState(false);
  const [useSelection, setUseSelection] = useState(false);
  return (
    <Stack space="sm" data-lab-demo="host">
      <Checkbox isSelected={host.refuseNext} onChange={host.setRefuseNext}>
        Refuse the next message
      </Checkbox>
      <div style={{ height: 460, maxWidth: 560 }}>
        <UiProvider strings={quoteStrings}>
          <Chat
            messages={host.messages}
            participants={assistantPeople}
            currentUserId={readerId}
            conversationId="lab-host"
            title="Trip planner"
            placeholder="Ask about the trains… (Ctrl+Enter sends)"
            submitShortcut="Ctrl+Enter"
            minRows={2}
            maxRows={6}
            allowsEmptySubmit={useSelection}
            modelPicker={modelPicker}
            composerMenu={createLabComposerMenu({ isPlanning, onPlanningChange: setPlanning })}
            attachments={files.attachments}
            onAttach={files.onAttach}
            onRemoveAttachment={files.onRemoveAttachment}
            composerToolbar={
              <>
                <Checkbox isSelected={allowChanges} onChange={setAllowChanges}>
                  Allow changes
                </Checkbox>
                <Checkbox isSelected={useSelection} onChange={setUseSelection}>
                  Ask about the selection
                </Checkbox>
              </>
            }
            onSend={async (text, tokens) => {
              await host.onSend(text, tokens);
              files.clear();
            }}
            onReply={host.onReply}
            onSendError={host.onSendError}
            onCopy={() => undefined}
          />
        </UiProvider>
      </div>
      <p role="alert" data-lab-output="host-error">
        {host.error}
      </p>
    </Stack>
  );
}

export function ChatHostCases() {
  return (
    <LabSection
      title="Host controls"
      description="A host's own controls around the full Chat. Copy and Quote any finished message (the provider strings name Reply Quote); Escape or Cancel quote drops it, and the quote jumps to its message. The composer's + menu comes first, in place of the attach button: attach files, insert a goal prompt, turn on Plan mode (the reply then outlines the steps first) or insert an integration's command as a pill. The host's checkboxes follow it, before the model picker, and wrap in a narrow composer, Send staying at the end. Enter breaks the line and Ctrl+Enter sends; with Ask about the selection, a blank message sends too. The host accepts each message after a moment: while it waits the composer holds the message and sends it only once, and when it refuses (the first message, or whenever Refuse the next message is on) the text, its pills and the quote stay, the host shows its error, and sending again works."
    >
      <HostDemo />
    </LabSection>
  );
}
