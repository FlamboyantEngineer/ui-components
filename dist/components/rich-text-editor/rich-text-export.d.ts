import type { RichTextNode } from './rich-text-document.js';
import { type RichTextSchema } from './rich-text-schema.js';
export interface RichTextExportOptions {
    /** The schema the document follows. Defaults to the default schema. */
    schema?: RichTextSchema | undefined;
}
/**
 * The document as HTML, rendered as each node and mark type renders itself. Text and attribute
 * values are escaped and links keep only safe addresses.
 */
export declare function serializeRichTextHtml(document: RichTextNode, options?: RichTextExportOptions): string;
/** The document's text: one line per text block, and a line break for each hard break. */
export declare function serializeRichTextText(document: RichTextNode, options?: RichTextExportOptions): string;
//# sourceMappingURL=rich-text-export.d.ts.map