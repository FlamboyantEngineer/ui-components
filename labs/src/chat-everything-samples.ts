// A team and its trip planner for the Chat lab's everything-at-once conversation: three days of
// messages before today's, two older pages, and the planner's commands.

import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import type { AgentBehaviour } from './chat-agent.js';
import { tripAttachments } from './chat-attachment-samples.js';
import type { LabReplier } from './chat-people-host.js';
import {
  ana,
  ben,
  mia,
  planner,
  plannerId,
  reader,
  readerId,
  textMessage,
} from './chat-samples.js';
import { withMentions } from './chat-team-samples.js';

/** The local time `time` (`HH:MM`) on the day `days` days before today, as an ISO string. */
function daysAgo(days: number, time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** `minutes` before now, as an ISO string, so today's messages are never ahead of the clock. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const everythingPeople = [reader, ana, ben, mia, planner];

/** The planner's commands, each asking the fake agent for one of its behaviours. */
export const plannerCommands: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  behaviour: AgentBehaviour;
}> = [
  {
    id: 'summarize',
    label: 'summarize',
    description: 'Plan the weekend in short, with tools and sources',
    behaviour: 'answer',
  },
  {
    id: 'book',
    label: 'book',
    description: 'Book dinner once you approve',
    behaviour: 'approval-awaited',
  },
  {
    id: 'cancel',
    label: 'cancel',
    description: 'Cancel the old hotel, approved on the next turn',
    behaviour: 'approval-turn',
  },
  { id: 'ask', label: 'ask', description: 'Ask the team questions', behaviour: 'question' },
  {
    id: 'plan',
    label: 'plan',
    description: 'Work through a plan, then a diff and a terminal',
    behaviour: 'plan',
  },
  { id: 'ferry', label: 'ferry', description: 'Ferry times, failing once', behaviour: 'failure' },
];

/** Ana answers each message the reader sends to the team. */
export const teamReplier: LabReplier = {
  id: ana.id,
  replies: ['On it!', 'Sounds good to me.', 'Ha, deal. See you there.'],
};

/** The reader's hotel confirmation: a mention, then the listing's photos and the itinerary. */
function confirmationMessage(): ChatMessageData {
  const message = withMentions(
    {
      id: 'all-3',
      authorId: readerId,
      time: daysAgo(2, '18:04'),
      text: '@Ana Lopez I do. Here it is, with the photos from the listing.',
      delivery: 'read',
    },
    [[ana.id, '@Ana Lopez']],
  );
  const shared = ['harbour', 'tower', 'pdf'];
  const attachments = tripAttachments.filter((entry) => shared.includes(entry.id));
  return { ...message, parts: [...message.parts, { type: 'files', attachments }] };
}

export const everythingMessages: ChatMessageData[] = [
  textMessage({
    id: 'all-1',
    time: daysAgo(2, '17:55'),
    text: 'Ana Lopez added Trip planner to the conversation.',
  }),
  textMessage({
    id: 'all-2',
    authorId: ana.id,
    time: daysAgo(2, '18:00'),
    text: 'Who has the hotel confirmation?',
  }),
  confirmationMessage(),
  textMessage({
    id: 'all-4',
    authorId: ben.id,
    time: daysAgo(2, '18:10'),
    text: 'The rooftop looks amazing.',
    reactions: [
      { emoji: '😍', people: ['Ana Lopez', 'Mia Chen'] },
      { emoji: '👍', isReacted: true, people: [reader.name] },
    ],
  }),
  withMentions(
    {
      id: 'all-5',
      authorId: mia.id,
      time: daysAgo(2, '18:12'),
      text: '@Trip planner where can we hear fado on Saturday night?',
    },
    [[plannerId, '@Trip planner']],
  ),
  textMessage({
    id: 'all-6',
    authorId: plannerId,
    time: daysAgo(2, '18:13'),
    text: 'Try **Mouraria**: its small fado houses open at 20:00, and a table for five is easy to get before 21:00.',
  }),
  textMessage({
    id: 'all-7',
    authorId: ben.id,
    time: daysAgo(1, '09:15'),
    text: 'My train only gets in at 22:00 on Friday, so start dinner without me.',
    isEdited: true,
  }),
  textMessage({
    id: 'all-8',
    authorId: ana.id,
    time: daysAgo(1, '09:20'),
    text: 'I can drive everyone from the airport.',
    isDeleted: true,
  }),
  textMessage({
    id: 'all-9',
    authorId: readerId,
    time: daysAgo(1, '19:30'),
    text: 'Is everyone fine with a 9:00 start on Saturday?',
    delivery: 'read',
  }),
  textMessage({
    id: 'all-10',
    authorId: readerId,
    time: daysAgo(1, '19:31'),
    text: 'Can someone pick up pastries on the way?',
    delivery: 'failed',
  }),
  textMessage({ id: 'all-11', authorId: mia.id, time: minutesAgo(95), text: '9 works for me.' }),
  textMessage({
    id: 'all-12',
    authorId: ana.id,
    time: minutesAgo(80),
    text: 'Let us meet at the hotel at 8:30 then, before the castle queue.',
    replyTo: 'all-9',
  }),
  withMentions(
    {
      id: 'all-13',
      authorId: ben.id,
      time: minutesAgo(40),
      text: '@Sam Reed can you bring the power adapters?',
    },
    [[readerId, '@Sam Reed']],
  ),
];

export const everythingFirstUnread = 'all-11';

export const everythingReadPositions = { ana: 'all-13', ben: 'all-13', mia: 'all-12' };

/** Older pages of the conversation, newest page first. */
export const everythingOlderPages: ChatMessageData[][] = [
  [
    textMessage({
      id: 'all-older-3',
      authorId: mia.id,
      time: daysAgo(3, '20:00'),
      text: 'I found flights on Friday evening for all of us.',
    }),
    textMessage({
      id: 'all-older-4',
      authorId: ben.id,
      time: daysAgo(3, '20:06'),
      text: 'Booked mine. Window seat, of course.',
    }),
  ],
  [
    textMessage({
      id: 'all-older-1',
      authorId: ana.id,
      time: daysAgo(4, '12:00'),
      text: 'A group for our Lisbon weekend!',
    }),
    textMessage({
      id: 'all-older-2',
      authorId: readerId,
      time: daysAgo(4, '12:10'),
      text: 'Thanks for adding me.',
      delivery: 'read',
    }),
  ],
];
