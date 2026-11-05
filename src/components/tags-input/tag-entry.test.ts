import { describe, expect, it, vi } from 'vitest';
import { getDefaultStrings } from '../../core/strings.js';

const defaultStrings = getDefaultStrings();
import {
  checkGivenTags,
  checkTag,
  hasTagDelimiter,
  resolveTagEntry,
  splitTagText,
  type TagRules,
} from './tag-entry.js';

const rules: TagRules = {
  delimiters: [','],
  maxValues: undefined,
  allowsDuplicates: false,
  validateTag: undefined,
  strings: defaultStrings,
};

describe('tag entry', () => {
  it('UIC-TAGS-INPUT-3.3 checks a large given list with one read per tag', () => {
    const count = 5000;
    let reads = 0;
    const value = new Proxy(
      [...Array.from({ length: count }, (_, index) => `Tag ${index}`), 'Tag 42'],
      {
        get(target, key, receiver) {
          if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
          return Reflect.get(target, key, receiver) as unknown;
        },
      },
    );
    expect(checkGivenTags(value, rules)?.message).toBe('“Tag 42” is already added.');
    expect(reads).toBe(count + 1);
    reads = 0;
    expect(checkGivenTags(value, { ...rules, allowsDuplicates: true })).toBeNull();
    expect(reads).toBe(0);
  });

  it.each([false, true])(
    'UIC-TAGS-INPUT-2.2 UIC-TAGS-INPUT-3.3 reads existing tags once at most for a large paste when duplicates are %s',
    (allowsDuplicates) => {
      const count = 5000;
      let reads = 0;
      const value = new Proxy(
        Array.from({ length: count }, (_, index) => `Held ${index}`),
        {
          get(target, key, receiver) {
            if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
            return Reflect.get(target, key, receiver) as unknown;
          },
        },
      );
      const validateTag = vi.fn(() => null);
      const entered = Array.from({ length: count }, (_, index) => `New ${index}`);
      const result = resolveTagEntry(entered.join(','), {
        keepLast: false,
        value,
        rules: { ...rules, allowsDuplicates, validateTag },
      });
      expect(result).toEqual({ added: entered, inputValue: '', rejected: null });
      expect(reads).toBe(allowsDuplicates ? 0 : count);
      expect(validateTag).toHaveBeenCalledTimes(count);
    },
  );

  it('UIC-TAGS-INPUT-3.1 UIC-TAGS-INPUT-3.4 checks accepted tags once and preserves refusal order', () => {
    const validateTag = vi.fn((tag: string) => (tag === 'No' ? 'Refused.' : null));
    const result = resolveTagEntry('Old,New,New,No,Last,Extra,Tail', {
      keepLast: true,
      value: ['Old'],
      rules: { ...rules, maxValues: 3, validateTag },
    });
    expect(result).toEqual({
      added: ['New', 'Last'],
      inputValue: 'Old,New,No,Extra,Tail',
      rejected: 'Old',
    });
    expect(validateTag.mock.calls.map(([tag]) => tag)).toEqual(['New', 'No', 'Last']);
  });

  it('UIC-TAGS-INPUT-2.1 UIC-TAGS-INPUT-2.2 splits at delimiters and line breaks', () => {
    expect(splitTagText('Fig, Kiwi;Lime\r\nMango\nPlum', [',', ';'])).toEqual([
      'Fig',
      ' Kiwi',
      'Lime',
      'Mango',
      'Plum',
    ]);
    expect(splitTagText('a.b|c', ['.', '|'])).toEqual(['a', 'b', 'c']);
    expect(hasTagDelimiter('Fig', [','])).toBe(false);
    expect(hasTagDelimiter('Fig,', [','])).toBe(true);
    expect(hasTagDelimiter('Fig\nKiwi', [])).toBe(true);
    expect(hasTagDelimiter('Fig,Kiwi', ['', ';'])).toBe(false);
  });

  it('UIC-TAGS-INPUT-2.1 trims tags, skips empty ones and keeps the text still being typed', () => {
    expect(resolveTagEntry(' Fig ,, Kiwi', { keepLast: false, value: [], rules })).toEqual({
      added: ['Fig', 'Kiwi'],
      inputValue: '',
      rejected: null,
    });
    expect(resolveTagEntry('Fig, Ki', { keepLast: true, value: [], rules })).toEqual({
      added: ['Fig'],
      inputValue: ' Ki',
      rejected: null,
    });
  });

  it('UIC-TAGS-INPUT-3.1 keeps refused tags in the input, ahead of the text being typed', () => {
    expect(
      resolveTagEntry('Apple,Fig,Pear,Ki', { keepLast: true, value: ['Apple', 'Pear'], rules }),
    ).toEqual({ added: ['Fig'], inputValue: 'Apple,Pear,Ki', rejected: 'Apple' });
    expect(
      resolveTagEntry('Fig Fig', {
        keepLast: false,
        value: [],
        rules: { ...rules, delimiters: [] },
      }),
    ).toEqual({ added: ['Fig Fig'], inputValue: '', rejected: null });
    expect(
      resolveTagEntry('Fig\nFig', {
        keepLast: false,
        value: [],
        rules: { ...rules, delimiters: [] },
      }),
    ).toEqual({ added: ['Fig'], inputValue: 'Fig', rejected: 'Fig' });
  });

  it('UIC-TAGS-INPUT-3.2 refuses tags past the maximum, counting the tags of the same entry', () => {
    const capped = { ...rules, maxValues: 3 };
    expect(checkTag('Fig', ['Apple', 'Pear', 'Plum'], capped)).toEqual({
      severity: 'error',
      message: 'Add up to 3 values.',
      validity: 'rangeOverflow',
    });
    expect(checkTag('Fig', ['Apple'], { ...rules, maxValues: 1 })?.message).toBe(
      'Add up to 1 value.',
    );
    expect(
      resolveTagEntry('Fig,Kiwi,Lime', { keepLast: false, value: ['Apple'], rules: capped }),
    ).toEqual({
      added: ['Fig', 'Kiwi'],
      inputValue: 'Lime',
      rejected: 'Lime',
    });
  });

  it('UIC-TAGS-INPUT-3.3 refuses duplicates unless they are allowed', () => {
    expect(checkTag('Apple', ['Apple'], rules)).toEqual({
      severity: 'error',
      message: '“Apple” is already added.',
      validity: 'customError',
    });
    expect(checkTag('apple', ['Apple'], rules)).toBeNull();
    expect(checkTag('Apple', ['Apple'], { ...rules, allowsDuplicates: true })).toBeNull();
    expect(resolveTagEntry('Fig,Fig', { keepLast: false, value: [], rules })).toEqual({
      added: ['Fig'],
      inputValue: 'Fig',
      rejected: 'Fig',
    });
  });

  it('UIC-TAGS-INPUT-3.4 refuses a tag with the message the caller returns', () => {
    const checked = {
      ...rules,
      validateTag: (tag: string) => (tag.includes('@') ? null : 'Enter an address.'),
    };
    expect(checkTag('ada', [], checked)).toEqual({
      severity: 'error',
      message: 'Enter an address.',
      validity: 'customError',
    });
    expect(checkTag('ada@example.com', [], checked)).toBeNull();
    expect(checkTag('ada', [], { ...rules, validateTag: () => '' })).toBeNull();
  });
});
