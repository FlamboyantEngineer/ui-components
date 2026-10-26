import type { Node } from 'prosemirror-model';
import type { MessageComposerMessage } from '../composer-message.js';
/** The document as Markdown: a line per paragraph, code blocks between fences, pills as text. */
export declare function serializeComposerDocument(doc: Node): MessageComposerMessage;
/**
 * The document for a message: a paragraph per line with pills over its tokens, and a code block
 * for each fenced run of lines. An unclosed fence stays text.
 */
export declare function parseComposerMessage(message: MessageComposerMessage): Node;
//# sourceMappingURL=composer-markdown.d.ts.map