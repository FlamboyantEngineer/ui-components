import { describe, expect, it } from 'vitest';
import { isSameMessage, type MessageComposerMessage } from './composer-message.js';

const message = (fields: Partial<MessageComposerMessage['tokens'][number]> = {}) => ({
  text: 'Ask @Maria',
  tokens: [{ start: 4, end: 10, kind: 'mention' as const, id: 'maria', label: 'Maria', ...fields }],
});

describe('isSameMessage (UIC-MESSAGE-COMPOSER-4.2)', () => {
  it('compares the text and each token field by field', () => {
    expect(isSameMessage(message(), message())).toBe(true);
    expect(isSameMessage(message(), message({ recordType: undefined }))).toBe(true);
    expect(isSameMessage(message(), { ...message(), text: 'Ask @Maria!' })).toBe(false);
    expect(isSameMessage(message(), message({ id: 'jon' }))).toBe(false);
    expect(isSameMessage(message(), message({ end: 9 }))).toBe(false);
    expect(isSameMessage(message(), message({ recordType: 'person' }))).toBe(false);
    expect(isSameMessage(message(), { text: 'Ask @Maria', tokens: [] })).toBe(false);
  });
});
