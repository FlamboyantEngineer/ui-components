import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import * as locales from './index.js';

type Element = ReturnType<IntlMessageFormat['getAst']>[number];

/** The argument names a message reads, in all of its branches. */
function collectArguments(elements: readonly Element[], names = new Set<string>()): Set<string> {
  for (const element of elements) {
    if ('value' in element && element.type !== 0) names.add(element.value);
    if ('options' in element) {
      for (const option of Object.values(element.options)) collectArguments(option.value, names);
    }
  }
  return names;
}

function readArguments(message: string, locale: string): string[] {
  const ast = new IntlMessageFormat(message, locale, undefined, { ignoreTag: true }).getAst();
  return [...collectArguments(ast)].sort();
}

describe('shipped language files', () => {
  const english = Object.entries(locales.en);

  it.each(Object.entries(locales))(
    'UIC-PROVIDER-3.5 %s has every English key, with messages that read the English arguments',
    (language, messages) => {
      expect(Object.keys(messages)).toEqual(english.map(([key]) => key));
      for (const [key, message] of english) {
        const translated = messages[key as keyof typeof messages];
        const allowed = readArguments(message, 'en');
        const used = readArguments(translated, language);
        expect(
          used.filter((name) => !allowed.includes(name)),
          `${language}.${key} reads unknown arguments`,
        ).toEqual([]);
        expect(used.length > 0, `${language}.${key} drops all arguments`).toBe(allowed.length > 0);
      }
    },
  );
});
