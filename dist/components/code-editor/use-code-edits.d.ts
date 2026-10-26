import { type RefObject } from 'react';
import type { CodeEdit } from './code-editing.js';
export interface CodeEditsOptions {
    inputRef: RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: ((value: string) => void) | undefined;
}
/**
 * Applies the editor's own edits (indentation, pairs, completions, replacements): through the
 * browser's editing when the text area has focus, so undo keeps working, or else through
 * `onChange`, selecting the edit's selection once the new value is rendered.
 */
export declare function useCodeEdits({ inputRef, value, onChange }: CodeEditsOptions): (edit: CodeEdit) => void;
//# sourceMappingURL=use-code-edits.d.ts.map