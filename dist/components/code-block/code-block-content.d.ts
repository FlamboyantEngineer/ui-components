import type { CodeTokenizer } from '../code-editor/code-editor.js';
/** One line of a terminal block: a command typed after the prompt, or output. */
export interface TerminalLine {
    kind: 'command' | 'output';
    /** The line without its prompt. */
    text: string;
}
export declare const codeBlockHooks: import("../../core/hooks.js").ComponentHooks<"code" | "header" | "title" | "line" | "copy" | "actions" | "apply" | "token" | "prompt">;
/** Reads terminal lines: a line that is the prompt, or starts with it and a space, is a command. */
export declare function splitTerminalLines(code: string, prompt: string): TerminalLine[];
/** What Copy and Apply use: a terminal block's commands without their prompts, or else the code. */
export declare function readCodeBlockValue(code: string, commands: readonly TerminalLine[]): string;
export declare function CodeTokens({ code, tokenize }: {
    code: string;
    tokenize?: CodeTokenizer;
}): import("react").JSX.Element | import("react").JSX.Element[];
/** Terminal lines; the prompt is decoration, hidden from assistive technology and from Copy. */
export declare function TerminalLines({ lines, prompt }: {
    lines: TerminalLine[];
    prompt: string;
}): import("react").JSX.Element[];
//# sourceMappingURL=code-block-content.d.ts.map