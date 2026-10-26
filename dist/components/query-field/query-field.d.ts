import type { BaseProps } from '../../core/props.js';
import { type CodeDiagnostic, type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completions } from '../completion-list/completion-list.js';
/** A query language, as the functions that read it. */
export interface QueryGrammar {
    /** Splits the query into tokens for highlighting. */
    tokenize?: CodeTokenizer | undefined;
    /** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
    complete?: Completions | undefined;
    /** The problems in a query; an error keeps it from being submitted. */
    diagnose?: ((query: string) => readonly CodeDiagnostic[]) | undefined;
}
export interface QueryFieldProps extends BaseProps {
    /** The visible label, which names the input. */
    label: string;
    /** The language: tokens, completions and problems. */
    grammar: QueryGrammar;
    /** The query, controlled. */
    value?: string | undefined;
    /** The query to start with, uncontrolled. */
    defaultValue?: string | undefined;
    /** Called with the query on each change. */
    onChange?: ((value: string) => void) | undefined;
    /** Called with the query on Enter or the run button, while the grammar reports no error. */
    onSubmit?: ((query: string) => void) | undefined;
    /** Shown while the query is empty. */
    placeholder?: string | undefined;
    /** Keeps the query readable and selectable but refuses every edit. */
    isReadOnly?: boolean | undefined;
    /** Refuses focus and every edit. */
    isDisabled?: boolean | undefined;
}
/**
 * A one-line input for a query language on `CodeEditor`: the caller's grammar highlights tokens,
 * offers completions and reports problems, which mark the query and list below it. Enter, when no
 * completion is open, or the run button submits a query without errors.
 */
export declare function QueryField({ label, grammar, value: controlledValue, defaultValue, onChange, onSubmit, placeholder, isReadOnly, isDisabled, className, id, ...rest }: QueryFieldProps): import("react").JSX.Element;
//# sourceMappingURL=query-field.d.ts.map