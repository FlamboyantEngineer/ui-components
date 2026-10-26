import { Schema, type Node } from 'prosemirror-model';
import { type MessageComposerToken } from '../composer-message.js';
/** What a pill node carries. */
export type PillAttributes = Pick<MessageComposerToken, 'kind' | 'id' | 'label' | 'recordType'>;
/** A pill's text: its trigger character and its label, such as `@Maria Santos`; a reference's label. */
export declare function getPillText(node: Node): string;
/** The composer's schema: paragraphs (one per line), code blocks and pills. */
export declare const composerSchema: Schema<"text" | "paragraph" | "codeBlock" | "pill" | "doc", never>;
//# sourceMappingURL=composer-schema.d.ts.map