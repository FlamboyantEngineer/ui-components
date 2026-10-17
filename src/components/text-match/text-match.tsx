import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { findTermRanges, splitMatchTerms } from './match-ranges.js';

/** Registers a text with the nearest provider and returns the function that unregisters it. */
export type TextMatchRegister = (text: string) => () => void;

export interface TextMatchProviderProps {
  /** The query as typed. It is split into terms on whitespace, ignoring case and `/`, `_`, `-`. */
  query?: string | undefined;
  /** Match terms as words: never inside one, and as a word's start only from three characters. */
  matchWords?: boolean | undefined;
  /** Called with each text rendered by a `TextMatch` below; returns its cleanup. */
  registerText?: TextMatchRegister | undefined;
  /** The content whose `TextMatch` labels highlight the query. */
  children?: ReactNode;
}

/** Every mark carries the caller's class and `data-*` attributes; an `id` would repeat, so none. */
export interface TextMatchProps extends Omit<BaseProps, 'id'> {
  /** The text to show. */
  children: string;
}

interface TextMatchContextValue {
  terms: readonly string[];
  matchWords: boolean;
  registerText: TextMatchRegister | undefined;
}

const noTerms: readonly string[] = Object.freeze([]);

const TextMatchContext = createContext<TextMatchContextValue>({
  terms: noTerms,
  matchWords: false,
  registerText: undefined,
});

const hooks = createHooks('text-match');

/** Supplies the query that every `TextMatch` below it highlights. Renders no element. */
export function TextMatchProvider({
  query = '',
  matchWords = false,
  registerText,
  children,
}: TextMatchProviderProps) {
  const terms = useMemo(() => splitMatchTerms(query), [query]);
  const value = useMemo(
    () => ({ terms, matchWords, registerText }),
    [terms, matchWords, registerText],
  );
  return <TextMatchContext.Provider value={value}>{children}</TextMatchContext.Provider>;
}

/**
 * Shows a text with each occurrence of the nearest provider's terms wrapped in a `<mark>`.
 * Without a provider, terms or a hit it returns the plain text, with no element of its own.
 */
export function TextMatch({ children: text, className, ...rest }: TextMatchProps) {
  const { terms, matchWords, registerText } = useContext(TextMatchContext);
  useEffect(() => registerText?.(text), [registerText, text]);

  if (terms.length === 0) return text;
  const ranges = findTermRanges(text, terms, { matchWords });
  if (ranges.length === 0) return text;

  const markProps = hooks.root({ className, props: rest });
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(
      <mark key={range.start} {...markProps}>
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
