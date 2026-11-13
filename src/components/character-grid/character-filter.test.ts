import { describe, expect, it, vi } from 'vitest';
import { filterCharacterCategories, formatCodePoints } from './character-filter.js';

const categories = [
  {
    id: 'currency',
    label: 'Currency',
    characters: [
      { char: '€', name: 'Euro sign' },
      { char: '£', name: 'Pound sign' },
    ],
  },
  {
    id: 'marks',
    label: 'Marks',
    characters: [
      { char: '°', name: 'Degree sign' },
      { char: 'é', name: 'Latin small letter e with acute' },
      { char: '1️⃣', name: 'Keycap one' },
    ],
  },
];

describe('formatCodePoints', () => {
  it('UIC-CHARACTER-GRID-1.4 writes code points in Unicode notation', () => {
    expect(formatCodePoints('©')).toBe('U+00A9');
    expect(formatCodePoints('😀')).toBe('U+1F600');
    expect(formatCodePoints('1️⃣')).toBe('U+0031 U+FE0F U+20E3');
  });
});

describe('filterCharacterCategories', () => {
  it('UIC-CHARACTER-GRID-2.1 keeps every category whole for a blank query', () => {
    expect(filterCharacterCategories(categories, '  ')).toEqual(categories);
  });

  it('UIC-CHARACTER-GRID-2.1 matches every word of a name, ignoring case and accents', () => {
    expect(
      filterCharacterCategories(categories, 'SIGN').map((category) => category.characters.length),
    ).toEqual([2, 1]);
    expect(filterCharacterCategories(categories, 'sign degree')).toEqual([
      { ...categories[1], characters: [{ char: '°', name: 'Degree sign' }] },
    ]);
    expect(filterCharacterCategories(categories, 'ácute')[0]?.characters).toEqual([
      { char: 'é', name: 'Latin small letter e with acute' },
    ]);
  });

  it('UIC-CHARACTER-GRID-2.1 matches the character itself and its code point', () => {
    expect(filterCharacterCategories(categories, '£')[0]?.characters).toEqual([
      { char: '£', name: 'Pound sign' },
    ]);
    expect(filterCharacterCategories(categories, 'U+00B0')[0]?.characters).toEqual([
      { char: '°', name: 'Degree sign' },
    ]);
    expect(filterCharacterCategories(categories, 'u+20ac')[0]?.characters).toEqual([
      { char: '€', name: 'Euro sign' },
    ]);
    expect(filterCharacterCategories(categories, 'u+31')).toEqual([]);
  });

  it('UIC-CHARACTER-GRID-2.1 matches a name that reads like a code point', () => {
    const signs = [
      {
        id: 'signs',
        label: 'Signs',
        characters: [
          { char: '¬', name: 'Not sign' },
          { char: 'ŭ', name: 'Uac sample' },
        ],
      },
    ];
    expect(filterCharacterCategories(signs, 'uac')[0]?.characters.map(({ name }) => name)).toEqual([
      'Not sign',
      'Uac sample',
    ]);
  });

  it('UIC-CHARACTER-GRID-2.1 leaves out categories without a match', () => {
    expect(filterCharacterCategories(categories, 'euro').map((category) => category.id)).toEqual([
      'currency',
    ]);
    expect(filterCharacterCategories(categories, 'nothing like it')).toEqual([]);
  });

  it('UIC-CHARACTER-GRID-2.1 normalizes a search once across a large character set', () => {
    const normalize = vi.spyOn(String.prototype, 'normalize');
    const characters = Array.from({ length: 1_000 }, (_, index) => ({
      char: String.fromCodePoint(0x1f300 + index),
      name: `Sample character ${index}`,
    }));
    expect(filterCharacterCategories([{ id: 'all', label: 'All', characters }], 'Ω')).toEqual([]);
    expect(normalize.mock.contexts.filter((context) => String(context) === 'Ω')).toHaveLength(1);
  });
});
