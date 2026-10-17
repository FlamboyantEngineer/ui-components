import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { findTermRanges, splitMatchTerms } from './match-ranges.js';

/** Registers a text with the nearest scope and returns the function that unregisters it. */
export type TextMatchRegister = (text: string) => () => void;

interface TextMatchContextValue {
  terms: readonly string[];
  matchWords: boolean;
  registerText: TextMatchRegister | undefined;
}

const NO_TERMS: readonly string[] = Object.freeze([]);

const TextMatchContext = createContext<TextMatchContextValue>({
  terms: NO_TERMS,
  matchWords: false,
  registerText: undefined,
});

export interface TextMatchScopeProps {
  /** The query as typed. It is split into terms on whitespace, ignoring case and `/`, `_`, `-`. */
  query?: string | undefined;
  /**
   * Match terms as words: never inside a word, and at the start of a longer word only for terms of
   * three or more characters. By default a term matches anywhere, as a filter box needs.
   */
  matchWords?: boolean | undefined;
  /** Called with each text rendered by a `TextMatch` below; returns its cleanup. */
  registerText?: TextMatchRegister | undefined;
  children?: ReactNode;
}

/** Supplies the query that every `TextMatch` below it highlights. Renders no element. */
export function TextMatchScope({
  query = '',
  matchWords = false,
  registerText,
  children,
}: TextMatchScopeProps) {
  const terms = useMemo(() => splitMatchTerms(query), [query]);
  const value = useMemo(
    () => ({ terms, matchWords, registerText }),
    [terms, matchWords, registerText],
  );
  return <TextMatchContext.Provider value={value}>{children}</TextMatchContext.Provider>;
}

export interface TextMatchProps {
  /** The text to show. */
  children: string;
  /** Appended to every mark. */
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('text-match');

/**
 * Shows a text with each occurrence of the nearest scope's terms wrapped in a `<mark>`.
 * Without a scope, terms or a hit it returns the plain text, with no element of its own.
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
