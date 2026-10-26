/** Strings of code blocks. */
export interface CodeStrings {
    /** The heading of a code block without a title or language, by its variant (`code`, `terminal`). */
    codeBlockTitle: (variant: 'code' | 'terminal') => string;
    /** Copies a code block's code. */
    codeBlockCopy: string;
    /** Copies the commands of a terminal block, without their prompts, by their count. */
    codeBlockCopyCommands: (count: number) => string;
    /** Copies a terminal block that holds only output. */
    codeBlockCopyOutput: string;
    /** Applies a code block's code to the reader's work, such as a file being edited. */
    codeBlockApply: string;
}
export declare const codeStrings: CodeStrings;
//# sourceMappingURL=code-strings.d.ts.map