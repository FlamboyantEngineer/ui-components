import type { UiStrings } from '../../core/strings.js';
import type { CodeDiagnostic } from './code-editor.js';
import type { FieldIssue } from '../field/field.js';
import { type JsonSchema } from './json-schema.js';
/** The problems to mark in the editor, and the one the field reports. */
export interface JsonCheck {
    diagnostics: CodeDiagnostic[];
    issue: FieldIssue | null;
}
/**
 * Checks JSON text: text that does not parse has one problem where parsing stops; text that
 * parses is checked against `schema`, each problem marked where it is and the first one reported
 * with its line and column. Blank text has no problems.
 */
export declare function checkJsonText(source: string, schema: JsonSchema | undefined, strings: UiStrings): JsonCheck;
/** Reuses the current result for the field check and the editor's diagnostic layer. */
export declare function createJsonChecker(schema: JsonSchema | undefined, strings: UiStrings): (source: string) => JsonCheck;
//# sourceMappingURL=json-check.d.ts.map