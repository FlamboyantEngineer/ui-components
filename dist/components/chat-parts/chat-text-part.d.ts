import { type ReactNode } from 'react';
import { type MarkdownNode } from '../markdown/markdown.js';
import { type RecordLabelResolver } from '../record-label/record-label.js';
import type { ChatCodePart, ChatPart, ChatTextFormat, ChatTextPart } from './chat-part.js';
/** A Markdown `renderNode`. */
export type MarkdownNodeRenderer = (node: MarkdownNode, children: ReactNode) => ReactNode;
export interface ChatTextPartViewProps {
    part: ChatTextPart;
    format: ChatTextFormat;
    /** The message's Markdown overrides, stable across renders. */
    renderNode: MarkdownNodeRenderer;
    /** How a record reference's chip shows its record. */
    getReference?: RecordLabelResolver | undefined;
}
/** A text part, as Markdown or as plain text. */
export declare function ChatTextPartView({ part, format, renderNode, getReference, }: ChatTextPartViewProps): import("react").JSX.Element;
/**
 * The message's Markdown overrides: fenced code as `CodeBlock` (with Apply when `onApplyCode` is
 * given) and `[n]` markers as citations of the sources of its `sources` parts. They stay the same
 * while the sources and the presence of `onApplyCode` do, so streaming keeps finished blocks.
 */
export declare function usePartsRenderNode(parts: readonly ChatPart[], onApplyCode: ((code: string, part: ChatCodePart) => void) | undefined): MarkdownNodeRenderer;
//# sourceMappingURL=chat-text-part.d.ts.map