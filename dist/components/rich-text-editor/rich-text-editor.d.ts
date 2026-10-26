import { type ReactNode } from 'react';
import { type FieldInputProps } from '../field/field.js';
import type { RichTextDocument } from './rich-text-document.js';
import { type RichTextSchema } from './rich-text-schema.js';
export interface RichTextEditorProps extends FieldInputProps<RichTextDocument> {
    /** The node and mark types the document may hold. Defaults to the default schema. */
    schema?: RichTextSchema | undefined;
    /** Shown while the document is empty. */
    placeholder?: string | undefined;
    /** Shown in a row above the document, such as a `FormatToolbar`. */
    toolbar?: ReactNode;
    /** Chrome that floats over the document: `SelectionToolbar`, `InsertMenu`, `BlockHandle`. */
    children?: ReactNode;
}
/**
 * A field for formatted text: headings, lists, tasks, quotes, code, links and inline marks, with
 * undo history, Markdown-style shortcuts as you type and keyboard shortcuts. The value is the
 * document as JSON. Its toolbar and floating chrome drive it through `useRichTextController`.
 */
export declare function RichTextEditor(props: RichTextEditorProps): import("react").JSX.Element;
export { createRichTextSchema } from './rich-text-schema.js';
export type { RichTextAttributeSpec, RichTextDomAttributes, RichTextDomOutput, RichTextElementData, RichTextMarkSpec, RichTextNodeSpec, RichTextParseRule, RichTextSchema, RichTextSchemaOptions, } from './rich-text-schema.js';
export type { RichTextAttributes, RichTextAttributeValue, RichTextDocument, RichTextMark, RichTextNode, } from './rich-text-document.js';
export type { RichTextCommand } from './rich-text-command.js';
export { useRichTextController } from './rich-text-controller.js';
export type { RichTextController } from './rich-text-controller.js';
export { serializeRichTextHtml, serializeRichTextText } from './rich-text-export.js';
export type { RichTextExportOptions } from './rich-text-export.js';
//# sourceMappingURL=rich-text-editor.d.ts.map