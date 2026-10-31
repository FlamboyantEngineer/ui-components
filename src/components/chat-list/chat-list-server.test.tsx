// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderInDistantZones } from '../../../test/time-zones.js';
import { ChatList } from './chat-list.js';

describe('ChatList on the server', () => {
  it('UIC-CHAT-LIST-1.3 names a row by the same time whatever the server zone', () => {
    const conversations = [{ id: 'c1', title: 'Ana Lopez', time: '2026-10-30T13:30:00Z' }];
    const [utc, kiritimati] = renderInDistantZones(() => (
      <ChatList
        aria-label="Conversations"
        conversations={conversations}
        getNow={() => new Date('2026-10-31T01:00:00Z')}
      />
    ));
    expect(kiritimati).toBe(utc);
  });
});
