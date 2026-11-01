// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderInDistantZones } from '../../../test/time-zones.js';
import { ChatMessage } from './chat-message.js';

describe('ChatMessage on the server', () => {
  it('UIC-CHAT-TRANSCRIPT-2.4 names a message by the same time whatever the server zone', () => {
    const [utc, kiritimati] = renderInDistantZones(() => (
      <ChatMessage
        id="m1"
        author={{ name: 'Ana Lopez' }}
        time="2026-10-30T13:30:00Z"
        getNow={() => new Date('2026-10-31T01:00:00Z')}
      >
        The samples arrived.
      </ChatMessage>
    ));
    expect(kiritimati).toBe(utc);
  });
});
