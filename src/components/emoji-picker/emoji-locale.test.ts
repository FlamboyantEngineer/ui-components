import { describe, expect, it } from 'vitest';
import { parseEmojiData } from './emoji-catalog.js';
import { loadEmojiData, mergeEmojiLocale, resolveEmojiLocale } from './emoji-locale.js';
import { isEmojiLocale } from './emoji-locales.js';

describe('emoji locales', { timeout: 15_000 }, () => {
  it('UIC-EMOJI-PICKER-4.4 resolves a language tag to a bundled locale', () => {
    expect(resolveEmojiLocale('fr-CA')).toBe('fr');
    expect(resolveEmojiLocale('es-MX')).toBe('es-mx');
    expect(resolveEmojiLocale('es-AR')).toBe('es');
    expect(resolveEmojiLocale('en-GB')).toBe('en-gb');
    expect(resolveEmojiLocale('en-US')).toBe('en');
    expect(resolveEmojiLocale('zh-TW')).toBe('zh-hant');
    expect(resolveEmojiLocale('zh-Hant')).toBe('zh-hant');
    expect(resolveEmojiLocale('zh-CN')).toBe('zh');
    expect(resolveEmojiLocale('pt-BR')).toBe('pt');
    expect(resolveEmojiLocale('ja')).toBe('ja');
    expect(resolveEmojiLocale('tlh')).toBe('en');
    expect(resolveEmojiLocale('not a tag')).toBe('en');
    for (const locale of ['bn', 'da', 'de', 'et', 'fi', 'hi', 'hu', 'it', 'ko', 'lt', 'ms']) {
      expect(isEmojiLocale(locale)).toBe(true);
    }
    for (const locale of ['nb', 'nl', 'pl', 'ru', 'sv', 'th', 'uk', 'vi']) {
      expect(isEmojiLocale(locale)).toBe(true);
    }
    expect(isEmojiLocale('toString')).toBe(false);
  });

  it('UIC-EMOJI-PICKER-4.4 replaces names and keywords line by line, keeping blanks English', () => {
    const emoji = parseEmojiData(
      ['food', '🍎||red apple|apple|fruit|0.6', '🍌||banana|banana|fruit|0.6'].join('\n'),
    );
    const [apple, banana] = mergeEmojiLocale(emoji, 'pomme rouge|fruit,pomme\n|');
    expect(apple).toMatchObject({
      label: 'pomme rouge',
      keywords: ['fruit', 'pomme'],
      shortcodes: ['apple'],
      unicode: '🍎',
      version: 0.6,
    });
    expect(banana).toMatchObject({ label: 'banana', keywords: ['fruit'] });
  });

  it('UIC-EMOJI-PICKER-4.4 loads each locale once as its own set, with English shortcodes', async () => {
    const french = loadEmojiData('fr-FR');
    expect(loadEmojiData('fr-CA')).toBe(french);
    expect(loadEmojiData('fr')).toBe(french);
    const [emoji, english] = await Promise.all([french, loadEmojiData()]);
    expect(emoji).toHaveLength(english.length);
    const apple = emoji.find((item) => item.unicode === '🍎');
    expect(apple).toMatchObject({ label: 'pomme rouge', shortcodes: ['apple', 'red_apple'] });
    expect(apple?.keywords).toContain('pomme');
    const german = await loadEmojiData('de-AT');
    expect(german[0]?.label).toBe('grinsendes Gesicht');
    expect(german[0]?.version).toBe(english[0]?.version);
  });
});
