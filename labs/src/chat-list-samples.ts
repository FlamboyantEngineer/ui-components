import type { ChatConversation } from '../../src/components/chat-list/chat-list.js';
import { otherPicture, samplePicture } from './people-samples.js';

/** A fixed clock, so every time reads the same on every day. */
export const getNow = () => new Date(2026, 3, 20, 10, 30);

/** An ISO time `minutes` before the lab's clock. */
export function minutesAgo(minutes: number): string {
  return new Date(getNow().getTime() - minutes * 60_000).toISOString();
}

const people = {
  ana: { id: 'ana', name: 'Ana Lima', presence: 'active' as const },
  ben: { id: 'ben', name: 'Ben Ode', src: samplePicture, presence: 'away' as const },
  chen: { id: 'chen', name: 'Chen Wu', presence: 'busy' as const },
  dia: { id: 'dia', name: 'Dia Rao', src: otherPicture },
  eli: { id: 'eli', name: 'Eli Park' },
};

/** The first conversations: one-to-one, groups, an assistant, unread and muted. */
const featuredConversations: ChatConversation[] = [
  {
    id: 'ana',
    title: 'Ana Lima',
    lastMessage: 'I can meet you at the river at noon.',
    time: minutesAgo(4),
    unreadCount: 2,
    participants: [people.ana],
  },
  {
    id: 'trip',
    title: 'Lisbon trip',
    lastMessage: 'Ben: I booked the café table for Friday.',
    time: minutesAgo(35),
    unreadCount: 12,
    participants: [people.ben, people.chen, people.dia, people.eli],
  },
  {
    id: 'helper',
    title: 'Travel helper',
    lastMessage: 'Here are three walking routes through the old town.',
    time: minutesAgo(80),
    avatar: { name: 'Travel helper', src: samplePicture, shape: 'rounded' },
  },
  {
    id: 'recipes',
    title: 'Recipe swap',
    lastMessage: 'Chen: The soup needs another hour on the stove.',
    time: minutesAgo(60 * 20),
    unreadCount: 140,
    isMuted: true,
    participants: [people.chen, people.dia],
  },
  {
    id: 'ben',
    title: 'Ben Ode',
    lastMessage: 'Thanks, see you tomorrow!',
    time: minutesAgo(60 * 30),
    participants: [people.ben],
  },
  {
    id: 'chen',
    title: 'Chen Wu',
    lastMessage: 'Muted until the weekend.',
    time: minutesAgo(60 * 24 * 3),
    isMuted: true,
    participants: [people.chen],
  },
];

const topics = ['Garden plan', 'Book club', 'Bike repair', 'Bakery order', 'Museum visit'];

/** Many quieter conversations after the featured ones, for scrolling and search. */
export const manyConversations: ChatConversation[] = [
  ...featuredConversations,
  ...Array.from({ length: 34 }, (_, index) => ({
    id: `topic-${index + 1}`,
    title: `${topics[index % topics.length]} ${Math.floor(index / topics.length) + 1}`,
    lastMessage: index % 3 === 0 ? 'Eli: Shall we move it to Thursday?' : 'Sounds good to me.',
    time: minutesAgo(60 * 24 * (4 + index)),
    participants: [people.eli, people.dia],
  })),
];

/** One conversation of each kind, for the row matrix. */
export const rowKinds = {
  person: featuredConversations[0] as ChatConversation,
  group: featuredConversations[1] as ChatConversation,
  assistant: featuredConversations[2] as ChatConversation,
};
