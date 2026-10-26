import { type ReactNode } from 'react';
import type { ChatPart, ChatTextFormat } from './chat-part.js';
import type { ChatPartsProps } from './chat-parts.js';
import { type MarkdownNodeRenderer } from './chat-text-part.js';
import type { PartsExpansion } from './use-parts-expansion.js';
/** What every part view draws with: the message's callbacks, overrides and expansion. */
export interface PartContext extends Pick<ChatPartsProps, 'toolRenderers' | 'onApprove' | 'onDeny' | 'onAlwaysAllow' | 'onAnswerQuestion' | 'onDismissQuestion' | 'questionAnsweredMark' | 'onRetryAttachment' | 'onApplyCode' | 'renderPart' | 'getReference' | 'expandsActivity'> {
    textFormat: ChatTextFormat;
    renderNode: MarkdownNodeRenderer;
    /** The DOM id of a part: its id, prefixed by the message's. */
    toDomId: (id: string) => string;
    expansion: PartsExpansion;
}
interface PartViewProps<P extends ChatPart> {
    part: P;
    context: PartContext;
}
/** One part, drawn by the component for its type; a custom part by `renderPart`, else nothing. */
export declare function ChatPartView({ part, context }: PartViewProps<ChatPart>): ReactNode;
export {};
//# sourceMappingURL=chat-part-view.d.ts.map