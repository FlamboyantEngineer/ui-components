import { type KeyboardEvent, type RefObject } from 'react';
import { type Completion } from './completion-match.js';
/** What a completion source knows about the place it completes. */
export interface CompletionContext {
    value: string;
    caret: number;
    /** The word before the caret, as the control reads words. */
    query: string;
    /** The reader asked for completions with Ctrl+Space. */
    isExplicit: boolean;
}
/** A source's completions, and the text they replace when it is not the word before the caret. */
export interface CompletionResult {
    options: readonly Completion[];
    /** Where the replaced text starts; the typed text from here to the caret filters the options. */
    from?: number | undefined;
    /** Where the replaced text ends, at or after the caret. */
    to?: number | undefined;
    /** Matches the options against the typed text. Defaults to true; false shows them as given. */
    filter?: boolean | undefined;
}
export type CompletionAnswer = readonly Completion[] | CompletionResult;
/** Completes the place at the caret, at once or later. */
export type CompletionSource = (context: CompletionContext) => CompletionAnswer | Promise<CompletionAnswer>;
/** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
export type Completions = readonly Completion[] | CompletionSource;
/** The text a completion replaces. */
export interface CompletionRange {
    start: number;
    end: number;
}
/** Why the completions are looked up: an edit, a caret move or the reader's request. */
export type CompletionReason = 'input' | 'move' | 'explicit';
export interface CompletionsOptions {
    completions: Completions | undefined;
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    /** A read-only or disabled control offers nothing. */
    isLocked: boolean;
    /** The word before the caret that a vocabulary completes. */
    findQuery: (value: string, caret: number) => string;
    /** Inserts a completion over the text it replaces. */
    insert: (completion: Completion, range: CompletionRange) => void;
}
export interface CompletionsModel {
    isOpen: boolean;
    options: readonly Completion[];
    activeIndex: number;
    /** The caret offset the list belongs to. */
    caret: number;
    setActiveIndex(index: number): void;
    apply(option: Completion): void;
    /** Looks the completions up for the caret after it moved. */
    track(reason: CompletionReason): void;
    /** Renders again so the list follows the caret, as after the control scrolled. */
    reposition(): void;
    close(): void;
    /** Handles Ctrl+Space and, while the list is open, its keys; returns whether the key was used. */
    handleKeyDown(event: KeyboardEvent<HTMLElement>): boolean;
    /** Follows the caret after a navigation key the list did not use. */
    handleKeyUp(event: KeyboardEvent<HTMLElement>): void;
}
/**
 * Completion for a text control that keeps focus: the options for the place at the caret, from a
 * vocabulary or a source, ranked against the typed text; an active option moved with the arrow
 * keys; Enter or Tab inserts it, Escape closes the list and Ctrl+Space asks for it. Only the latest
 * lookup's answer shows.
 */
export declare function useCompletions(options: CompletionsOptions): CompletionsModel;
//# sourceMappingURL=use-completions.d.ts.map