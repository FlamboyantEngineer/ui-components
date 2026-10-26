import { type CodeSurfaceProps, type CodeEditorSize } from './code-surface.js';
import type { FieldInputProps } from '../field/field.js';
import type { JsonSchema } from './json-schema.js';
import { type CodeLanguage, type CodeSyntax } from './code-languages.js';
export interface CodeLanguageOptions {
    /** Basic syntax preset. Defaults to plain `text`. */
    language?: CodeLanguage | undefined;
    /** Custom syntax rules; override the preset. An explicit tokenizer overrides both. */
    syntax?: CodeSyntax | undefined;
}
export interface CodeEditorFieldProps extends Omit<FieldInputProps<string>, 'size'>, Omit<CodeSurfaceProps, keyof FieldInputProps<string> | 'ref'>, CodeLanguageOptions {
    /** A field with label, validation, dirty state, restore, undo and menu. Defaults to `field`. */
    variant?: 'field' | undefined;
    /** Starting surface height. Defaults to md. */
    size?: CodeEditorSize | undefined;
    /** JSON Schema validation, completion and hover documentation in JSON mode. */
    schema?: JsonSchema | undefined;
}
export interface CodeEditorSurfaceProps extends CodeSurfaceProps, CodeLanguageOptions {
    /** A controlled editing surface for embedding inside other fields or widgets. */
    variant: 'surface';
}
export type CodeEditorProps = CodeEditorFieldProps | CodeEditorSurfaceProps;
/** A code field, or an embedded surface, with preset or custom syntax and located diagnostics. */
export declare function CodeEditor(props: CodeEditorProps): import("react").JSX.Element;
export type { CodeEditorSize, CodeEditorWrap } from './code-surface.js';
export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
export type { CodeLanguage, CodeSyntax, CodeSyntaxRule } from './code-languages.js';
export type { JsonSchema, JsonSchemaType } from './json-schema.js';
//# sourceMappingURL=code-editor.d.ts.map