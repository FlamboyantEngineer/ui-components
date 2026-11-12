import type { ChatConversation } from '../../src/components/chat-list/chat-list.js';
import { HistoryGlyph, SparklesGlyph } from '../../src/core/glyphs.js';
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

const historyTitles = [
  'Planning a vegetable garden',
  'Sourdough starter schedule',
  'Comparing bike tyre widths',
  'Choosing a reading lamp',
  'Weekend hiking routes',
  'Fixing a squeaky door hinge',
  'Learning to read sheet music',
  'Packing list for a ferry trip',
  'Repotting a fig tree',
  'Watercolour paper weights',
  'Converting oven temperatures',
  'Bird feeder placement',
  'Knitting a first scarf',
  'Restoring an old bookshelf',
  'Making cold brew at home',
  'Picking a tent for two',
  'Pressing autumn leaves',
  'Tuning a ukulele',
  'Composting in a small flat',
  'Drying herbs from the garden',
];

/** The history mark: a conversation that has earlier versions. */
const earlierVersions = { icon: HistoryGlyph, label: 'Earlier versions' };

/** Titles only, newest first; all but the second have earlier versions, and the first is working. */
export const historyConversations: ChatConversation[] = historyTitles.map((title, index) => ({
  id: `history-${index + 1}`,
  title,
  status: index === 1 ? undefined : earlierVersions,
  activity: index === 0 ? 'Working' : undefined,
}));

/** One conversation of each kind, for the row matrix. */
export const rowKinds = {
  person: featuredConversations[0] as ChatConversation,
  group: featuredConversations[1] as ChatConversation,
  assistant: featuredConversations[2] as ChatConversation,
  title: { id: 'title', title: 'Sourdough starter schedule' } as ChatConversation,
  icon: { id: 'icon', title: 'Weekend hiking routes', icon: SparklesGlyph } as ChatConversation,
  status: {
    id: 'status',
    title: 'Repotting a fig tree',
    status: earlierVersions,
  } as ChatConversation,
  activity: { id: 'activity', title: 'Tuning a ukulele', activity: 'Typing' } as ChatConversation,
};
