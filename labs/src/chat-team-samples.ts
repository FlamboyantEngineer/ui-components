// A small team's conversation for the Chat lab, over three days, plus a very long history.

import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { readerId, textMessage, type LabTextMessage } from './chat-samples.js';

/** A mention of `label` where it first occurs in `text`. */
function mention(text: string, id: string, label: string): ChatTextToken {
  const start = text.indexOf(label);
  return { start, end: start + label.length, kind: 'mention', id, label };
}

/** A text message with mentions of the people named. */
function withMentions(
  message: LabTextMessage,
  people: ReadonlyArray<[id: string, label: string]>,
): ChatMessageData {
  const tokens = people.map(([id, label]) => mention(message.text, id, label));
  return { ...textMessage(message), parts: [{ type: 'text', text: message.text, tokens }] };
}

const mapNote = '@Ana Lopez can you share the trail map?';
const cardNote = '@Sam Reed you have the club card, right?';

export const teamMessages: ChatMessageData[] = [
  textMessage({
    id: 'team-1',
    authorId: 'ana',
    time: '2026-04-18T09:00:00',
    text: 'Morning! Who is in for the hike next weekend?',
  }),
  textMessage({
    id: 'team-2',
    authorId: 'ana',
    time: '2026-04-18T09:01:00',
    text: 'I can drive four people.',
  }),
  textMessage({ id: 'team-3', authorId: 'ben', time: '2026-04-18T09:20:00', text: 'Count me in.' }),
  textMessage({
    id: 'team-4',
    authorId: 'mia',
    time: '2026-04-18T09:22:00',
    text: 'Me too, if we start after 8.',
  }),
  withMentions(
    {
      id: 'team-5',
      authorId: readerId,
      time: '2026-04-19T17:30:00',
      text: mapNote,
      delivery: 'read',
    },
    [['ana', '@Ana Lopez']],
  ),
  textMessage({
    id: 'team-6',
    authorId: 'ana',
    time: '2026-04-19T17:45:00',
    text: 'Here it is: the loop is **12 km** with one steep part.',
  }),
  textMessage({ id: 'team-7', authorId: 'ben', time: '2026-04-19T17:47:00', text: 'Looks great.' }),
  textMessage({
    id: 'team-8',
    authorId: 'ben',
    time: '2026-04-19T17:48:00',
    text: 'I will bring snacks.',
  }),
  textMessage({
    id: 'team-9',
    authorId: 'mia',
    time: '2026-04-20T08:10:00',
    text: 'The forecast looks fine for Saturday.',
  }),
  textMessage({
    id: 'team-10',
    authorId: 'ana',
    time: '2026-04-20T08:12:00',
    text: '8:30 start then?',
    replyTo: 'team-4',
  }),
  textMessage({
    id: 'team-11',
    authorId: 'ben',
    time: '2026-04-20T08:30:00',
    text: 'Works for me.',
  }),
  textMessage({
    id: 'team-12',
    authorId: 'mia',
    time: '2026-04-20T09:00:00',
    text: 'Should we book the hut for lunch?',
  }),
  textMessage({
    id: 'team-13',
    authorId: 'ana',
    time: '2026-04-20T09:05:00',
    text: 'Yes, I can call them.',
  }),
  withMentions({ id: 'team-14', authorId: 'ben', time: '2026-04-20T09:06:00', text: cardNote }, [
    [readerId, '@Sam Reed'],
  ]),
];

export const teamFirstUnread = 'team-9';

export const teamReadPositions = { ana: 'team-14', ben: 'team-12', mia: 'team-14' };

/** Older pages of the team's history, newest page first. */
export const teamOlderPages: ChatMessageData[][] = [
  [
    textMessage({
      id: 'team-older-3',
      authorId: 'mia',
      time: '2026-04-17T19:00:00',
      text: 'The photos from last time are up.',
    }),
    textMessage({
      id: 'team-older-4',
      authorId: 'ben',
      time: '2026-04-17T19:04:00',
      text: 'The lake one is my favourite.',
    }),
  ],
  [
    textMessage({
      id: 'team-older-1',
      authorId: 'ana',
      time: '2026-04-16T12:00:00',
      text: 'Welcome to the hiking group!',
    }),
    textMessage({
      id: 'team-older-2',
      authorId: readerId,
      time: '2026-04-16T12:10:00',
      text: 'Thanks for adding me.',
      delivery: 'read',
    }),
  ],
];

const longAuthors = ['ana', 'ben', 'mia', readerId];
const longTopics = ['the route', 'the lunch stop', 'the train back', 'the gear list', 'the photos'];

/**
 * A history of `count` messages, one every eleven minutes up to the lab's clock, one of them the
 * only to mention the lighthouse, for the search to find while virtualized away.
 */
export function createLongHistory(count: number): ChatMessageData[] {
  const end = new Date('2026-04-20T10:00:00').getTime();
  return Array.from({ length: count }, (_, index) => {
    const authorId = longAuthors[index % longAuthors.length];
    const text =
      index === 40
        ? 'Message 41: does anyone remember the lighthouse trail?'
        : `Message ${index + 1}: a note about ${longTopics[index % longTopics.length]}.`;
    const time = new Date(end - (count - index) * 11 * 60 * 1000).toISOString();
    return textMessage({ id: `long-${index + 1}`, authorId, time, text });
  });
}
