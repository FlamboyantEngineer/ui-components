import { describe, expect, it, vi } from 'vitest';
import { parseEmojiData } from './emoji-catalog.js';
import { filterNativeEmoji, isCountryFlag } from './emoji-filter.js';

const emoji = parseEmojiData(
  [
    'smileys',
    '😀||grinning face|grinning|happy|1',
    '🫠||melting face|melting_face|sarcasm|14',
    'food',
    '🍎||red apple|apple|fruit|0.6',
    'flags',
    '🏁||chequered flag|checkered_flag|race|0.6',
    '🇯🇵||flag: Japan|jp|flag|2',
    '🏴󠁧󠁢󠁳󠁣󠁴󠁿||flag: Scotland|scotland|flag|5',
    'symbols',
    '❤️||red heart|heart|love',
  ].join('\n'),
);
const labels = (list: readonly { label: string }[]) => list.map((item) => item.label);

describe('emoji filter', () => {
  it('UIC-EMOJI-PICKER-4.1 reads the Emoji version that introduced each emoji', () => {
    expect(emoji.map((item) => item.version)).toEqual([1, 14, 0.6, 0.6, 2, 5, undefined]);
  });

  it('UIC-EMOJI-PICKER-5.1 recognizes country flags as pairs of regional indicators', () => {
    expect(isCountryFlag('🇯🇵')).toBe(true);
    expect(isCountryFlag('🇯')).toBe(false);
    expect(isCountryFlag('🏁')).toBe(false);
    expect(isCountryFlag('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toBe(false);
    expect(labels(filterNativeEmoji(emoji, { hideCountryFlags: true }))).toEqual([
      'grinning face',
      'melting face',
      'red apple',
      'chequered flag',
      'flag: Scotland',
      'red heart',
    ]);
  });

  it('UIC-EMOJI-PICKER-5.2 leaves out emoji newer than the version, keeping unversioned ones', () => {
    expect(labels(filterNativeEmoji(emoji, { maxVersion: 2 }))).toEqual([
      'grinning face',
      'red apple',
      'chequered flag',
      'flag: Japan',
      'red heart',
    ]);
    expect(filterNativeEmoji(emoji, {})).toHaveLength(emoji.length);
  });

  it('UIC-EMOJI-PICKER-5.3 offers the chosen categories in the chosen order', () => {
    expect(
      labels(filterNativeEmoji(emoji, { categories: ['symbols', 'food', 'smileys'] })),
    ).toEqual(['red heart', 'red apple', 'grinning face', 'melting face']);
    expect(filterNativeEmoji(emoji, { categories: [] })).toEqual([]);
  });

  it('UIC-EMOJI-PICKER-5.4 keeps the emoji the filter accepts', () => {
    const filterEmoji = vi.fn((item: { unicode: string }) => item.unicode !== '🍎');
    const offered = filterNativeEmoji(emoji, { filterEmoji, maxVersion: 5 });
    expect(labels(offered)).not.toContain('red apple');
    expect(labels(offered)).not.toContain('melting face');
    expect(filterEmoji).not.toHaveBeenCalledWith(expect.objectContaining({ unicode: '🫠' }));
  });
});
