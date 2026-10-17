import { describe, expect, it } from 'vitest';
import {
  addRecentEmoji,
  applySkinTone,
  getEmojiKey,
  getEmojiLabel,
  loadEmojiData,
  parseEmojiData,
  resolveEmojiKeys,
  searchEmoji,
  skinTones,
  toEmojiSelection,
  toHexcode,
  withSkinTone,
  type CustomEmoji,
  type EmojiEntry,
  type NativeEmoji,
} from './emoji-catalog.js';

const fixture = [
  'smileys',
  '😀||grinning face|grinning|happy,smile',
  'people',
  '👋|1|waving hand|wave|hello,bye',
  '🧑‍🤝‍🧑|2|people holding hands|people_holding_hands|couple',
  'symbols',
  '❤️||red heart|heart,red_heart|love',
].join('\n');

const party: CustomEmoji = { shortcode: 'party_parrot', src: '/parrot.gif', keywords: ['bird'] };

function natives(list: readonly NativeEmoji[]): EmojiEntry[] {
  return list.map((emoji) => ({ kind: 'native', emoji }));
}

describe('emoji catalog', () => {
  it('UIC-EMOJI-PICKER-4.1 parses categories, names, shortcodes, keywords and tone rules', () => {
    const [grinning, wave, pair, heart] = parseEmojiData(fixture);
    expect(grinning).toMatchObject({
      unicode: '😀',
      hexcode: '1F600',
      label: 'grinning face',
      category: 'smileys',
      shortcodes: ['grinning'],
      keywords: ['happy', 'smile'],
      skins: undefined,
    });
    expect(wave?.category).toBe('people');
    expect(wave?.skins).toEqual(['👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿']);
    expect(pair?.skins?.[4]).toBe('🧑🏿‍🤝‍🧑🏿');
    expect(heart).toMatchObject({ hexcode: '2764', category: 'symbols', keywords: ['love'] });
  });

  it('UIC-EMOJI-PICKER-4.1 loads the bundled standard set once, in category order', async () => {
    const first = loadEmojiData();
    expect(loadEmojiData()).toBe(first);
    const emoji = await first;
    expect(emoji.length).toBeGreaterThan(1800);
    const categories = [...new Set(emoji.map((item) => item.category))];
    expect(categories).toEqual([
      'smileys',
      'people',
      'nature',
      'food',
      'travel',
      'activities',
      'objects',
      'symbols',
      'flags',
    ]);
    expect(emoji.some((item) => item.label.startsWith('regional indicator'))).toBe(false);
    const wave = emoji.find((item) => item.shortcodes.includes('wave'));
    expect(wave?.skins).toHaveLength(5);
    const flag = emoji.find((item) => item.hexcode === '1F1FA-1F1F8');
    expect(flag?.label).toBe('flag: United States');
  });

  it('UIC-EMOJI-PICKER-4.2 ranks shortcode, label and keyword matches, custom emoji included', async () => {
    const entries = natives(await loadEmojiData());
    expect(getEmojiLabel(searchEmoji(entries, ':wave:', 5)[0] as EmojiEntry)).toBe('waving hand');
    const grinning = searchEmoji(entries, 'grinning', 60);
    expect(getEmojiLabel(grinning[0] as EmojiEntry)).toContain('grinning');
    expect(searchEmoji(entries, 'zzzznotanemoji', 60)).toEqual([]);
    expect(searchEmoji(entries, '  ', 60)).toEqual([]);
    expect(searchEmoji(entries, 'heart', 3)).toHaveLength(3);

    const mixed = [...natives(parseEmojiData(fixture)), { kind: 'custom', emoji: party } as const];
    expect(searchEmoji(mixed, 'parrot', 10)).toEqual([{ kind: 'custom', emoji: party }]);
    expect(searchEmoji(mixed, 'bird', 10)).toHaveLength(1);
    expect(searchEmoji(mixed, 'HEART', 10).map(getEmojiLabel)).toEqual(['red heart']);
  });

  it('UIC-EMOJI-PICKER-4.3 applies skin tones only to emoji that take one', () => {
    const [grinning, wave] = parseEmojiData(fixture) as [NativeEmoji, NativeEmoji];
    expect(skinTones).toEqual([
      'default',
      'light',
      'medium-light',
      'medium',
      'medium-dark',
      'dark',
    ]);
    expect(applySkinTone(wave, 'medium')).toBe('👋🏽');
    expect(applySkinTone(wave, 'default')).toBe('👋');
    expect(applySkinTone(grinning, 'dark')).toBe('😀');
    expect(withSkinTone('✋', 'light')).toBe('✋🏻');
    expect(withSkinTone('✋', 'default')).toBe('✋');
    expect(toEmojiSelection({ kind: 'native', emoji: wave }, 'dark')).toEqual({
      kind: 'native',
      emoji: wave,
      unicode: '👋🏿',
      hexcode: '1F44B-1F3FF',
      skinTone: 'dark',
    });
    expect(toEmojiSelection({ kind: 'native', emoji: grinning }, 'dark')).toMatchObject({
      unicode: '😀',
      skinTone: 'default',
    });
    expect(toEmojiSelection({ kind: 'custom', emoji: party }, 'dark')).toEqual({
      kind: 'custom',
      emoji: party,
    });
    expect(toHexcode('❤️')).toBe('2764');
  });

  it('UIC-EMOJI-PICKER-2.2 keys, resolves and orders recently used emoji', () => {
    const list = parseEmojiData(fixture);
    const wave = { kind: 'native', emoji: list[1] as NativeEmoji } as const;
    expect(getEmojiKey(wave)).toBe('👋');
    expect(getEmojiKey({ kind: 'custom', emoji: party })).toBe(':party_parrot:');
    expect(
      resolveEmojiKeys(['👋🏽', ':party_parrot:', ':missing:', '🦄', '❤'], list, [party]),
    ).toEqual([wave, { kind: 'custom', emoji: party }, { kind: 'native', emoji: list[3] }]);
    expect(addRecentEmoji(['a', 'b', 'c'], 'b', 3)).toEqual(['b', 'a', 'c']);
    expect(addRecentEmoji(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });

  it('UIC-EMOJI-PICKER-2.3 names a custom emoji by its label or shortcode', () => {
    expect(getEmojiLabel({ kind: 'custom', emoji: party })).toBe(':party_parrot:');
    expect(getEmojiLabel({ kind: 'custom', emoji: { ...party, label: 'Party parrot' } })).toBe(
      'Party parrot',
    );
  });
});
