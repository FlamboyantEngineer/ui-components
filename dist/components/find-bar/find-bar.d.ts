import type { RefObject } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
/** A way of matching the reader can turn on or off, such as matching case or whole words. */
export interface FindBarOption {
    id: Key;
    label: string;
}
export interface FindBarProps extends BaseProps {
    /** Names the find box. Defaults to the provider's `find` string. */
    label?: string | undefined;
    /** Hint shown in the empty find box. */
    placeholder?: string | undefined;
    /** The query, controlled. */
    query?: string | undefined;
    /** The query the box starts with, uncontrolled. */
    defaultQuery?: string | undefined;
    /** Called with the query on each change. */
    onQueryChange?: ((query: string) => void) | undefined;
    /** How many matches the caller found; `undefined` while nothing is searched. */
    matchCount?: number | undefined;
    /** The current match, zero-based; outside the matches when there is none. */
    currentIndex?: number | undefined;
    /** The matches are being looked for. */
    isPending?: boolean | undefined;
    /** Moves to the next match: the Next match button, or Enter in the find box. */
    onNext?: (() => void) | undefined;
    /** Moves to the previous match: the Previous match button, or Shift+Enter in the find box. */
    onPrevious?: (() => void) | undefined;
    /** The replacement text, controlled. */
    replacement?: string | undefined;
    /** The replacement text the box starts with, uncontrolled. */
    defaultReplacement?: string | undefined;
    /** Called with the replacement text on each change. */
    onReplacementChange?: ((replacement: string) => void) | undefined;
    /** Adds the replacement box and a Replace button, which calls it with the replacement. */
    onReplace?: ((replacement: string) => void) | undefined;
    /** Adds the replacement box and a Replace all button, which calls it with the replacement. */
    onReplaceAll?: ((replacement: string) => void) | undefined;
    /** Ways of matching, offered in a menu of options the reader turns on and off. */
    options?: readonly FindBarOption[] | undefined;
    /** The options turned on, controlled. */
    selectedOptions?: Iterable<Key> | undefined;
    /** The options turned on at first, uncontrolled. */
    defaultSelectedOptions?: Iterable<Key> | undefined;
    /** Called with the options turned on after each change. */
    onSelectedOptionsChange?: ((keys: Set<Key>) => void) | undefined;
    /** Adds a Close button, which Escape anywhere in the bar also presses. */
    onClose?: (() => void) | undefined;
    /** Receives the find box's input, so a caller can move focus to it. */
    inputRef?: RefObject<HTMLInputElement | null> | undefined;
}
/**
 * A find row: the find box with the match count, previous and next match, optional matching
 * options, an optional replacement with Replace and Replace all, and an optional Close button. The
 * caller finds the matches and reports how many there are and which one is current. Enter and
 * Shift+Enter in the find box step through the matches, Enter in the replacement box replaces, and
 * Escape closes the bar when it can close.
 */
export declare function FindBar({ label, placeholder, query, defaultQuery, onQueryChange, matchCount, currentIndex, isPending, onNext, onPrevious, replacement, defaultReplacement, onReplacementChange, onReplace, onReplaceAll, options, selectedOptions, defaultSelectedOptions, onSelectedOptionsChange, onClose, inputRef, className, id, ...rest }: FindBarProps): import("react").JSX.Element;
//# sourceMappingURL=find-bar.d.ts.map