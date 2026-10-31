import { IntlMessageFormat } from 'intl-messageformat';
import { getListFormat } from '../utils/intl-format.js';
import { createLruCache } from '../utils/lru-cache.js';

/** Items a message reads as one locale-aware list: `a, b and c`, `a, b or c`, or `a, b, c`. */
export interface MessageList {
  items: readonly string[];
  type: 'and' | 'or' | 'unit';
}

const listTypes = { and: 'conjunction', or: 'disjunction', unit: 'unit' } as const;

/**
 * A value a message argument takes. Numbers format with the locale (`{count}`, `#` in a plural),
 * string arrays and `MessageList`s read as a locale-aware list, and booleans pick a `select` branch
 * named `true` or `false`. An argument passed as `undefined` or `null` reads as empty text, picks a
 * `select`'s `other` branch and counts as zero in a plural or number; leaving the argument out
 * altogether is an error (see `formatMessage`).
 */
export type MessageValue = string | number | boolean | readonly string[] | MessageList | undefined;

/** The named arguments of a message. */
export type MessageValues = Readonly<Record<string, MessageValue | null>>;

const formats = createLruCache<string, IntlMessageFormat>(1024);

function getFormat(message: string, locale: string): IntlMessageFormat {
  const key = `${locale}\u0000${message}`;
  let format = formats.get(key);
  if (!format) {
    // Tags stay literal text: library messages hold no markup, and `<` may appear in text.
    format = new IntlMessageFormat(message, locale, undefined, { ignoreTag: true });
    formats.set(key, format);
  }
  return format;
}

function formatList(list: MessageList, locale: string): string {
  return getListFormat(locale, { type: listTypes[list.type] }).format(list.items);
}

function isMessageList(value: MessageValue): value is MessageList {
  return typeof value === 'object' && !Array.isArray(value);
}

function toArgument(value: MessageValue | null, locale: string): string | number {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return formatList({ items: value, type: 'and' }, locale);
  if (isMessageList(value)) return formatList(value, locale);
  return value as string | number;
}

/** The locale of the built-in English text and of text formatted outside every provider. */
export const DEFAULT_LOCALE = 'en-US';

/**
 * Formats an ICU MessageFormat message, such as
 * `{count, plural, =0 {No files} one {# file} other {# files}}`, with the locale's plural rules,
 * number formats and list patterns. Every argument the message names must be a key of `values`;
 * pass `undefined` or `null` for one without a value. Throws when the message is malformed or names
 * an argument `values` leaves out, so a misspelt argument or a stale translation fails loudly
 * instead of printing a gap.
 */
export function formatMessage(
  message: string,
  values: MessageValues = {},
  locale = DEFAULT_LOCALE,
): string {
  const args: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(values)) args[name] = toArgument(value, locale);
  return String(getFormat(message, locale).format(args));
}

/** For each text function of a strings interface, the message values its arguments become. */
export type MessageArguments<S> = {
  [K in keyof S as S[K] extends string ? never : K]: S[K] extends (...args: infer A) => string
    ? (...args: A) => MessageValues
    : never;
};

/**
 * A module of built-in text (`src/core/strings/`): the message values each of its text functions
 * reads its arguments as, typed by the text `S` it declares.
 */
export interface StringModule<S> {
  readonly arguments: MessageArguments<S>;
  /** Carries the module's text type for `UiStrings`; never set. */
  readonly text?: S;
}

/** Declares a module of built-in text from the message values its text functions read. */
export function defineStrings<S>(args: MessageArguments<S>): StringModule<S> {
  return { arguments: args };
}

/** A kebab-case value as a `select` branch name, which cannot hold `-`: `in-progress` → `inProgress`. */
export function toSelectKey(value: string): string {
  return value.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}
