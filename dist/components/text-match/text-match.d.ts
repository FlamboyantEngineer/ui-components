import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** Registers a text with the nearest provider and returns the function that unregisters it. */
export type TextMatchRegister = (text: string) => () => void;
export interface TextMatchProviderProps {
    /** The query as typed. It is split into terms on whitespace, ignoring case and `/`, `_`, `-`. */
    query?: string | undefined;
    /** Match terms as words: never inside one, and as a word's start only from three characters. */
    matchWords?: boolean | undefined;
    /** Fold accented letters to their base letter, so `cafe` marks `café`. */
    ignoreAccents?: boolean | undefined;
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
/** Supplies the query that every `TextMatch` below it highlights. Renders no element. */
export declare function TextMatchProvider({ query, matchWords, ignoreAccents, registerText, children, }: TextMatchProviderProps): import("react").JSX.Element;
/**
 * Shows a text with each occurrence of the nearest provider's terms wrapped in a `<mark>` that
 * names the term it matched in `data-term`. Without a provider, terms or a hit it returns the plain
 * text, with no element of its own.
 */
export declare function TextMatch({ children: text, className, ...rest }: TextMatchProps): string | import("react").JSX.Element;
export { splitMatchTerms, textMatchesTerms } from './match-ranges.js';
//# sourceMappingURL=text-match.d.ts.map