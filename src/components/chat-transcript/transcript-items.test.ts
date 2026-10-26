import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';
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
});
