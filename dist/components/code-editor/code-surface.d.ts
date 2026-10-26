import type { ReactNode, Ref } from 'react';
import type { BaseProps, Size } from '../../core/props.js';
import { type Completion, type CompletionSource } from '../completion-list/completion-list.js';
import type { CodeLanguage } from './code-languages.js';
import { type CodeTextAreaProps } from './code-area.js';
import { type CodeDiagnostic, type CodeTokenizer } from './code-layers.js';
export type CodeEditorSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `soft` wraps long lines; `off` scrolls them sideways. */
export type CodeEditorWrap = 'soft' | 'off';
export interface CodeSurfaceProps extends BaseProps, CodeTextAreaProps {
    /** Language identifier published for the stylesheet. */
    language?: CodeLanguage | undefined;
    /** The source text, controlled. */
    value: string;
    onChange?: ((value: string) => void) | undefined;
    /** The language: splits the source into tokens for the highlighted layer. */
    tokenize?: CodeTokenizer | undefined;
    /** Problems to list below the editor, mark in the source and the gutter. An error makes it invalid. */
    diagnostics?: readonly CodeDiagnostic[] | undefined;
    /** Lists the diagnostics below the source. Defaults to `true`; marks and tips stay without it. */
    listDiagnostics?: boolean | undefined;
    /** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
    completions?: readonly Completion[] | CompletionSource | undefined;
    /** Information for the hover tip at a source offset, shown with the problems marked there. */
    renderHover?: ((offset: number) => ReactNode) | undefined;
    /** Starting height. Defaults to `md`. */
    size?: CodeEditorSize | undefined;
    /** Defaults to `soft`. */
    wrap?: CodeEditorWrap | undefined;
    /**
     * Edits several lines. Defaults to `true`; `false` keeps the source on one line that never wraps:
     * Enter is left to the caller's `onKeyDown`, and typed or pasted line breaks become spaces.
     */
    multiline?: boolean | undefined;
    /** Numbers the source lines in a gutter. */
    lineNumbers?: boolean | undefined;
    /** The number of the first line, for an excerpt of a longer text; diagnostics count lines from it. Defaults to 1. */
    firstLineNumber?: number | undefined;
    /** Tools shown in a row above the source, such as a label, a count or a format button. */
    toolbar?: ReactNode;
    /** Spaces per indentation level, for Tab, Shift+Tab and Enter. Defaults to 2. */
    indent?: number | undefined;
    /** Tab and Shift+Tab indent and outdent instead of moving focus; Escape then Tab leaves. */
    indentWithTab?: boolean | undefined;
    /** Typing an opening bracket or quote inserts its partner, and typing the partner steps over it. */
    autoCloseBrackets?: boolean | undefined;
    /** Ctrl+F or Cmd+F opens a find and replace row above the source. */
    allowsSearch?: boolean | undefined;
    /** Keeps the source readable and selectable but refuses every edit. */
    isReadOnly?: boolean | undefined;
    /** Refuses focus and every edit. */
    isDisabled?: boolean | undefined;
    /** Marks the source invalid, besides an error among the diagnostics. */
    isInvalid?: boolean | undefined;
    /** Reports that the source is required (`aria-required`). */
    isRequired?: boolean | undefined;
    /** The text area. */
    ref?: Ref<HTMLTextAreaElement> | undefined;
}
/** Native textarea editing with highlighted layers, diagnostics and custom scrollbars. */
export declare function CodeSurface(props: CodeSurfaceProps): import("react").JSX.Element;
export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
//# sourceMappingURL=code-surface.d.ts.map