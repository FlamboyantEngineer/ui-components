import { describe, expect, it } from 'vitest';
import {
  groupChatMessages,
  type ChatGroupableMessage,
  type ChatSequenceItem,
} from './chat-grouping.js';

/** Each item as a short word: the day of a separator, `unread`, or `<id>:<position>`. */
function describeItems(items: Array<ChatSequenceItem<ChatGroupableMessage>>): string[] {
  return items.map((item) => {
    if (item.kind === 'date') return item.date;
    if (item.kind === 'unread') return 'unread';
    return `${item.message.id}:${item.groupPosition}`;
  });
}

const by = (authorId: string | undefined, id: string, createdAt: string): ChatGroupableMessage => ({
  id,
  authorId,
  createdAt,
});

describe('groupChatMessages', () => {
  it('UIC-CHAT-TRANSCRIPT-6.1 puts date separators and the unread divider between the messages', () => {
    const messages = [
      by('ana', 'm1', '2026-04-19T09:00:00'),
      by('ben', 'm2', '2026-04-19T09:01:00'),
      by('ana', 'm3', '2026-04-20T08:00:00'),
      by('ana', 'm4', '2026-04-20T08:01:00'),
    ];
    const items = groupChatMessages(messages, { firstUnreadId: 'm3' });
    expect(describeItems(items)).toEqual([
      '2026-04-19',
      'm1:single',
      'm2:single',
      '2026-04-20',
      'unread',
      'm3:first',
      'm4:last',
    ]);
    expect(items.map((item) => item.key)).toEqual([
      'date-2026-04-19',
      'm1',
      'm2',
      'date-2026-04-20',
      'unread',
      'm3',
      'm4',
    ]);
    expect(items[1]).toMatchObject({ kind: 'message', message: messages[0] });
  });

  it('UIC-CHAT-TRANSCRIPT-6.1 starts no day for a message whose time cannot be read', () => {
    const messages = [by('ana', 'm1', '2026-04-20T08:00:00'), by('ana', 'm2', 'later')];
    expect(describeItems(groupChatMessages(messages))).toEqual([
      '2026-04-20',
      'm1:single',
      'm2:single',
    ]);
    expect(groupChatMessages([])).toEqual([]);
  });

  it('UIC-CHAT-TRANSCRIPT-6.2 groups consecutive messages by one author within the gap', () => {
    const messages = [
      by('ana', 'm1', '2026-04-20T08:00:00'),
      by('ana', 'm2', '2026-04-20T08:04:00'),
      by('ana', 'm3', '2026-04-20T08:09:00'),
      by('ana', 'm4', '2026-04-20T08:14:01'),
      by('ben', 'm5', '2026-04-20T08:15:00'),
      by('ana', 'm6', '2026-04-20T08:16:00'),
    ];
    expect(describeItems(groupChatMessages(messages))).toEqual([
      '2026-04-20',
      'm1:first',
      'm2:middle',
      'm3:last',
      'm4:single',
      'm5:single',
      'm6:single',
    ]);
    expect(describeItems(groupChatMessages(messages, { maxGap: 60 * 1000 })).slice(1, 4)).toEqual([
      'm1:single',
      'm2:single',
      'm3:single',
    ]);
  });

  it('UIC-CHAT-TRANSCRIPT-6.2 breaks groups at system notices, authorless messages and failed sends', () => {
    const messages: ChatGroupableMessage[] = [
      by('ana', 'm1', '2026-04-20T08:00:00'),
      { ...by(undefined, 'm2', '2026-04-20T08:00:30'), isSystem: true },
      by('ana', 'm3', '2026-04-20T08:01:00'),
      by(undefined, 'm4', '2026-04-20T08:01:30'),
      by('ana', 'm5', '2026-04-20T08:02:00'),
      { ...by('ana', 'm6', '2026-04-20T08:02:30'), delivery: 'failed' },
      { ...by('ana', 'm7', '2026-04-20T08:03:00'), delivery: 'sending' },
      { ...by('ana', 'm8', '2026-04-20T08:03:30'), delivery: 'sent' },
      { ...by('ana', 'm9', '2026-04-20T08:04:00'), isSystem: true },
    ];
    expect(describeItems(groupChatMessages(messages))).toEqual([
      '2026-04-20',
      'm1:single',
      'm2:single',
      'm3:single',
      'm4:single',
      'm5:single',
      'm6:single',
      'm7:first',
      'm8:last',
      'm9:single',
    ]);
  });

  it('UIC-CHAT-TRANSCRIPT-6.2 breaks a group at the unread divider', () => {
    const messages = [
      by('ana', 'm1', '2026-04-20T08:00:00'),
      by('ana', 'm2', '2026-04-20T08:01:00'),
      by('ana', 'm3', '2026-04-20T08:02:00'),
      by('ana', 'm4', '2026-04-20T08:03:00'),
    ];
    expect(describeItems(groupChatMessages(messages, { firstUnreadId: 'm3' }))).toEqual([
      '2026-04-20',
      'm1:first',
      'm2:last',
      'unread',
      'm3:first',
      'm4:last',
    ]);
  });

  it('UIC-CHAT-TRANSCRIPT-6.2 UIC-CHAT-TRANSCRIPT-6.3 breaks a group at local midnight', () => {
    const messages = [
      by('ana', 'm1', '2026-04-20T23:58:00'),
      by('ana', 'm2', '2026-04-21T00:01:00'),
    ];
    expect(describeItems(groupChatMessages(messages))).toEqual([
      '2026-04-20',
      'm1:single',
      '2026-04-21',
      'm2:single',
    ]);
  });

  it('UIC-CHAT-TRANSCRIPT-6.3 follows the days of the given time zone', () => {
    const messages = [
      by('ana', 'm1', '2026-04-20T23:58:00Z'),
      by('ana', 'm2', '2026-04-21T00:01:00Z'),
      by('ana', 'm3', '2026-04-20T22:04:00-02:00'),
    ];
    expect(describeItems(groupChatMessages(messages, { timeZone: 'UTC' }))).toEqual([
      '2026-04-20',
      'm1:single',
      '2026-04-21',
      'm2:first',
      'm3:last',
    ]);
    expect(describeItems(groupChatMessages(messages, { timeZone: 'America/New_York' }))).toEqual([
      '2026-04-20',
      'm1:first',
      'm2:middle',
      'm3:last',
    ]);
    expect(describeItems(groupChatMessages(messages, { timeZone: 'Asia/Tokyo' }))).toEqual([
      '2026-04-21',
      'm1:first',
      'm2:middle',
      'm3:last',
    ]);
    const floating = [
      by('ana', 'm1', '2026-04-20T23:59:00'),
      by('ana', 'm2', '2026-04-21T00:00:30'),
    ];
    expect(describeItems(groupChatMessages(floating, { timeZone: 'Asia/Tokyo' }))).toEqual([
      '2026-04-20',
      'm1:single',
      '2026-04-21',
      'm2:single',
    ]);
  });
});
