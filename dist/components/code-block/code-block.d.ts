import type { BaseProps } from '../../core/props.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
export { createCodeBlockOverride } from './markdown-code-block.js';
export type { CodeBlockOverrideOptions } from './markdown-code-block.js';
/** `code` shows source; `terminal` shows commands after a prompt and their output. */
export type CodeBlockVariant = 'code' | 'terminal';
/** The data of a code block, as a message part carries it. */
export interface CodeBlockData {
    /** The code, shown exactly as given. */
    code: string;
    /** The language, such as `ts`; heads the block when there is no `title`. */
    language?: string | undefined;
    /** Heads the block in place of the language, such as a file name. */
    title?: string | undefined;
    /** Defaults to `code`. */
    variant?: CodeBlockVariant | undefined;
}
export interface CodeBlockProps extends BaseProps, CodeBlockData {
    /** Shows an Apply action that hands over the block's value, such as to insert it in a file. */
    onApply?: ((code: string) => void) | undefined;
    /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
    applyLabel?: string | undefined;
    /** Splits the code of a `code` block into typed tokens for highlighting, as `CodeEditor` does. */
    tokenize?: CodeTokenizer | undefined;
    /** The prompt that starts a command line of a `terminal` block. Defaults to `$`. */
    prompt?: string | undefined;
}
/**
 * A block of code headed by its title or language, with a Copy button and an optional Apply
 * action. The code is preformatted and scrolls sideways; while it overflows, the reader can focus it
 * to scroll by keyboard. A `terminal` block marks its command lines and copies only the commands.
 */
export declare function CodeBlock({ code, language, title, variant, onApply, applyLabel, tokenize, prompt, className, id, ...rest }: CodeBlockProps): import("react").JSX.Element;
//# sourceMappingURL=code-block.d.ts.map