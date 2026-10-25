// Sample people and messages for the Chat lab: a trip planner assistant, and a small team.

import type {
  ChatMessageData,
  ChatParticipant,
  ChatTextToken,
} from '../../src/components/chat-parts/index.js';

export const readerId = 'sam';
export const plannerId = 'planner';

export const reader: ChatParticipant = { id: readerId, name: 'Sam Reed', kind: 'person' };

export const planner: ChatParticipant = {
  id: plannerId,
  name: 'Trip planner',
  kind: 'assistant',
  colorKey: 'planner',
};

export const ana: ChatParticipant = {
  id: 'ana',
  name: 'Ana Lopez',
  kind: 'person',
  status: 'active',
  statusLabel: 'Active',
};

export const ben: ChatParticipant = {
  id: 'ben',
  name: 'Ben Carter',
  kind: 'person',
  status: 'away',
  statusLabel: 'Away',
};

export const mia: ChatParticipant = { id: 'mia', name: 'Mia Chen', kind: 'person' };

export const assistantPeople = [reader, planner];
export const pairPeople = [reader, ana];
export const teamPeople = [reader, ana, ben, mia];

/** The lab's fixed clock for conversations that are not live. */
export const getLabNow = () => new Date('2026-04-20T10:30:00');

/** A text message for a sample conversation: its id, local time and text, and other fields. */
export interface LabTextMessage extends Omit<Partial<ChatMessageData>, 'createdAt'> {
  id: string;
  time: string;
  text: string;
}

export function textMessage({ id, time, text, ...extra }: LabTextMessage): ChatMessageData {
  return { id, createdAt: time, parts: [{ type: 'text', text }], ...extra };
}

/** An id unique in the lab session, for messages the lab adds. */
let counter = 0;
export function nextLabId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** The current time as an ISO string, for messages sent in a live demo. */
export const nowIso = () => new Date().toISOString();

/** A message the reader sends in a live demo, with its mentions and commands. */
export function sentMessage(
  text: string,
  tokens: readonly ChatTextToken[] = [],
  extra: Partial<ChatMessageData> = {},
): ChatMessageData {
  return {
    id: nextLabId('sent'),
    authorId: readerId,
    createdAt: nowIso(),
    parts: [{ type: 'text', text, tokens: [...tokens] }],
    ...extra,
  };
}
