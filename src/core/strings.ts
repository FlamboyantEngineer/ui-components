import { en } from './locales/index.js';
import {
  DEFAULT_LOCALE,
  formatMessage,
  type MessageValues,
  type StringModule,
} from './message-format.js';
import * as modules from './strings/index.js';

type TextOf<M> = M extends StringModule<infer S> ? S : never;
type Intersection<U> = (U extends unknown ? (value: U) => void : never) extends (
  value: infer I,
) => void
  ? I
  : never;

/**
 * Built-in text every component draws from, compiled from a language file for one locale. Text
 * without arguments is a string; text with arguments is a function of them. The entries are
 * declared in one module per area, which `src/core/strings/index.ts` lists.
 */
export type UiStrings = Intersection<TextOf<(typeof modules)[keyof typeof modules]>>;

/**
 * A language file: every built-in text as an ICU MessageFormat message, keyed like `UiStrings`. Text
 * without arguments is used as written.
 */
export type UiMessages = Record<keyof UiStrings, string>;

type ToMessageValues = (...args: never[]) => MessageValues;

const messageArguments: Readonly<Record<string, ToMessageValues>> = Object.assign(
  {},
  ...Object.values(modules).map((module: StringModule<unknown>) => module.arguments),
);

/** Compiles a language file into the text components draw for `locale`. */
export function compileStrings(messages: UiMessages, locale: string): UiStrings {
  const strings: Record<string, unknown> = { ...messages };
  for (const [key, toValues] of Object.entries(messageArguments)) {
    const message = messages[key as keyof UiMessages];
    strings[key] = (...args: never[]) => formatMessage(message, toValues(...args), locale);
  }
  return strings as unknown as UiStrings;
}

let defaultStrings: UiStrings | undefined;

/**
 * The built-in English text, compiled on first use rather than when the library loads, so
 * importing a component does no string work until one renders outside every provider.
 */
export function getDefaultStrings(): UiStrings {
  defaultStrings ??= compileStrings(en, DEFAULT_LOCALE);
  return defaultStrings;
}
