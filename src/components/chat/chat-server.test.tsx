// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderInDistantZones } from '../../../test/time-zones.js';
import type { ChatMessageData, ChatParticipant } from '../chat-parts/chat-parts.js';
import { Chat } from './chat.js';

const people: ChatParticipant[] = [
  { id: 'sam', name: 'Sam Reed', kind: 'person' },
  { id: 'ana', name: 'Ana Lopez', kind: 'person' },
];

const said = (id: string, authorId: string, createdAt: string): ChatMessageData => ({
  id,
  authorId,
  createdAt,
  parts: [{ type: 'text', text: `Text of ${id}` }],
});

describe('Chat on the server', () => {
  it('UIC-CHAT-1.6 renders the same date separators whatever the server zone', () => {
    // A day apart in UTC, one day in Kiritimati.
    const messages = [
      said('m1', 'ana', '2026-10-30T13:30:00Z'),
      said('m2', 'sam', '2026-10-31T00:30:00Z'),
    ];
    const [utc, kiritimati] = renderInDistantZones(() => (
      <Chat
        messages={messages}
        participants={people}
        currentUserId="sam"
        getNow={() => new Date('2026-10-31T01:00:00Z')}
      />
    ));
    expect(kiritimati).toBe(utc);
  });
});
