import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';
import { ChatDateSeparator } from './chat-date-separator.js';
import { ChatTypingIndicator } from './chat-typing-indicator.js';
import { ChatUnreadDivider } from './chat-unread-divider.js';
import { collectTranscriptItems, diffTranscriptKeys } from './transcript-items.js';

const keysOf = (children: Parameters<typeof collectTranscriptItems>[0]) =>
  collectTranscriptItems(children).map((item) => item.key);

describe('transcript items', () => {
  it('UIC-CHAT-TRANSCRIPT-3.7 keys each child by its id, else its React key, else its position', () => {
    expect(
      keysOf([
        createElement('article', { key: 'k1', id: 'first' }),
        createElement('article', { key: 'k2' }),
        null,
        'text',
        createElement(
          Fragment,
          { key: 'group' },
          createElement('hr'),
          createElement('article', { id: 'third' }),
        ),
        createElement('article', { key: 'k2' }),
      ]),
    ).toEqual(['first', 'k2', '#2', '#3', 'third', 'k2#5']);
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 tells arrivals from older history and from another conversation', () => {
    expect(diffTranscriptKeys(null, ['a'])).toEqual({ isReset: true, arrivals: [], older: [] });
    expect(diffTranscriptKeys([], ['a', 'b'])).toEqual({
      isReset: false,
      arrivals: ['a', 'b'],
      older: [],
    });
    expect(diffTranscriptKeys(['c', 'd', 'typing'], ['a', 'b', 'c', 'd', 'e', 'typing'])).toEqual({
      isReset: false,
      arrivals: ['e'],
      older: ['a', 'b'],
    });
    expect(diffTranscriptKeys(['a'], ['x'])).toEqual({ isReset: true, arrivals: [], older: [] });
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 places nothing by a part that survived', () => {
    const isPart = (key: string) => key === 'day' || key === 'typing';
    // Older history loads under the separator of a day both lists share.
    expect(diffTranscriptKeys(['day', 'c', 'd'], ['day', 'a', 'b', 'c', 'd', 'e'], isPart)).toEqual(
      {
        isReset: false,
        arrivals: ['e'],
        older: ['a', 'b'],
      },
    );
    // Another conversation of the same day keeps only the separator.
    expect(diffTranscriptKeys(['day', 'a'], ['day', 'x'], isPart)).toEqual({
      isReset: true,
      arrivals: [],
      older: [],
    });
    // Only parts were there, so the first messages arrive.
    expect(diffTranscriptKeys(['typing'], ['a', 'typing'], isPart)).toEqual({
      isReset: false,
      arrivals: ['a'],
      older: [],
    });
  });

  it('UIC-CHAT-TRANSCRIPT-3.7 knows the parts between messages by their component', () => {
    const items = collectTranscriptItems([
      createElement(ChatDateSeparator, { key: 'day', date: '2026-04-20' }),
      createElement(ChatUnreadDivider, { key: 'unread' }),
      createElement('article', { key: 'm1' }),
      createElement(ChatTypingIndicator, { key: 'typing', names: [] }),
    ]);
    expect(items.map((item) => [item.key, item.isPart])).toEqual([
      ['day', true],
      ['unread', true],
      ['m1', false],
      ['typing', true],
    ]);
  });
});
