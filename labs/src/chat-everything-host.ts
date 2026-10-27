// The host of the Chat lab's everything-at-once conversation, where a team and a trip planner
// talk. A message with a command or a mention of the planner goes to the planner through
// useChatController; any other goes to the team, who receive it, read it and answer.

import { useState } from 'react';
import type { ChatAttachmentData } from '../../src/components/chat-attachment/chat-attachment.js';
import {
  useChatController,
  type ChatControllerProps,
  type ChatSendFunction,
} from '../../src/components/chat-controller/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { agents, fakeUpload, withModelNote } from './chat-agent.js';
import { createReplyHandlers, useLabModelChoice } from './chat-assistant-host.js';
import {
  everythingMessages,
  everythingOlderPages,
  plannerCommands,
  teamReplier,
} from './chat-everything-samples.js';
import { useOlderHistory, usePeopleCallbacks } from './chat-people-host.js';
import { plannerId, readerId } from './chat-samples.js';

/** The mentions and commands of a message's text. */
function readTokens(message: ChatMessageData): readonly ChatTextToken[] {
  return message.parts.flatMap((part) => (part.type === 'text' ? (part.tokens ?? []) : []));
}

/** Whether a message goes to the planner: it holds a command or mentions the planner. */
function isForPlanner(tokens: readonly ChatTextToken[]): boolean {
  return tokens.some((token) => token.kind === 'command' || token.id === plannerId);
}

/** Streams what the reader's last message to the planner asks for: its command, else an answer. */
const sendToPlanner: ChatSendFunction = (messages, context) => {
  const asked = messages.findLast(
    (message) => message.authorId === readerId && isForPlanner(readTokens(message)),
  );
  const command = asked && readTokens(asked).find((token) => token.kind === 'command');
  const behaviour = plannerCommands.find((entry) => entry.id === command?.id)?.behaviour;
  return agents[behaviour ?? 'answer'](messages, context);
};

/** The files the composer has uploaded, taken out of it for a message to the team. */
function takeUploads(props: ChatControllerProps): ChatAttachmentData[] {
  const uploaded = props.attachments.filter((entry) => entry.status === 'complete');
  for (const entry of uploaded) props.onRemoveAttachment?.(entry.id);
  return uploaded.map(({ status: _status, progress: _progress, ...file }) => file);
}

/**
 * The conversation's chat props: the controller's, with sending and Retry shared between the
 * planner and the team, the team's typing, older history, the model picker whose choice each
 * reply names, and the host's Copy, Apply and rating handlers.
 */
export function useEverythingChat(record: (line: string) => void) {
  const [allowed, setAllowed] = useState<readonly string[]>([]);
  const { modelPicker, choice } = useLabModelChoice();
  const controller = useChatController({
    send: withModelNote(sendToPlanner, choice),
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages: everythingMessages,
    upload: fakeUpload,
    alwaysAllowed: allowed,
    onAlwaysAllowedChange: setAllowed,
  });
  const { props, setMessages } = controller;
  const team = usePeopleCallbacks({ setMessages, replier: teamReplier });
  const older = useOlderHistory(everythingOlderPages, setMessages);
  const chatProps = {
    ...props,
    ...older,
    ...createReplyHandlers(setMessages, record),
    typingIds: team.typingIds,
    onSend: (text: string, tokens: readonly ChatTextToken[] = []) => {
      if (isForPlanner(tokens)) props.onSend(text, tokens);
      else team.send({ text, tokens, attachments: takeUploads(props) });
    },
    onReply: team.onReply,
    onRetry: (id: string) => {
      const message = props.messages.find((entry) => entry.id === id);
      if (message?.delivery === 'failed') team.onRetry(id);
      else props.onRetry(id);
    },
  };
  return { allowed, chatProps, modelPicker };
}
