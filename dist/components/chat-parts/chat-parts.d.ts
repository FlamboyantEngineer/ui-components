import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { RecordLabelResolver } from '../record-label/record-label.js';
import type { ChatQuestionAnswer, ChatQuestionAnsweredMark } from '../chat-question/chat-question.js';
import type { ChatCodePart, ChatCustomPart, ChatPart, ChatTextFormat, ChatToolCallPart } from './chat-part.js';
export type { ChatCodePart, ChatCustomPart, ChatDiffPart, ChatFilesPart, ChatPart, ChatPartType, ChatPlanPart, ChatQuestionPart, ChatReasoningPart, ChatSourcesPart, ChatTextFormat, ChatTextPart, ChatTextToken, ChatToolCallPart, } from './chat-part.js';
export type { ChatMessageData, ChatParticipant, ChatParticipantKind } from './chat-conversation.js';
/** A tool call's approval callbacks, bound to the call; each is absent when the host gave none. */
export interface ChatToolCallHandlers {
    onApprove?: (() => void) | undefined;
    onDeny?: ((reason?: string) => void) | undefined;
    onAlwaysAllow?: (() => void) | undefined;
}
/** Draws the calls of one tool in place of the default card's body, or of the whole card. */
export interface ChatToolRenderer {
    /** Draws the call, with its approval callbacks. */
    render: (call: ChatToolCallPart, handlers: ChatToolCallHandlers) => ReactNode;
    /** What the drawing replaces: the card's `body` (the default), or the whole `card`. */
    replaces?: 'body' | 'card' | undefined;
}
export interface ChatPartsProps extends BaseProps {
    /** The message's parts, in the order they were written. */
    parts: readonly ChatPart[];
    /** Prefixes the DOM ids of tool calls and questions, so equal part ids in two messages differ. */
    messageId?: string | undefined;
    /** The message still streams in: a group of steps at its end runs. Defaults to `false`. */
    isStreaming?: boolean | undefined;
    /** How text parts without their own `format` render. Defaults to `markdown`. */
    textFormat?: ChatTextFormat | undefined;
    /** Reasoning and groups of steps open on their own while they run; without it they stay closed. Defaults to `true`. */
    expandsActivity?: boolean | undefined;
    /** Renderers by tool name, which replace the body or the whole card of that tool's calls. */
    toolRenderers?: Readonly<Record<string, ChatToolRenderer>> | undefined;
    /** Approves a tool call; shows Approve while an approval waits. */
    onApprove?: ((callId: string) => void) | undefined;
    /** Denies a tool call, with the reader's reason when they gave one; shows Deny. */
    onDeny?: ((callId: string, reason?: string) => void) | undefined;
    /** Always allows a tool call's tool; shows Always allow. */
    onAlwaysAllow?: ((callId: string) => void) | undefined;
    /** Receives the reader's answers to a question part; a promise is awaited. Without it, read-only. */
    onAnswerQuestion?: ((questionId: string, answers: ChatQuestionAnswer[]) => void | Promise<unknown>) | undefined;
    /** Dismisses a question part; shows Dismiss. A returned promise is awaited. */
    onDismissQuestion?: ((questionId: string) => void | Promise<unknown>) | undefined;
    /** How a question part's tabs mark an answered question: `icon` (the default) or `style`. */
    questionAnsweredMark?: ChatQuestionAnsweredMark | undefined;
    /** Retries a failed attachment upload; shows Retry. */
    onRetryAttachment?: ((id: string) => void) | undefined;
    /** Shows Apply on code: a code part, or a fenced block in text (passed as a code part). */
    onApplyCode?: ((code: string, part: ChatCodePart) => void) | undefined;
    /** Draws a custom part; without it custom parts render nothing. */
    renderPart?: ((part: ChatCustomPart) => ReactNode) | undefined;
    /** Looks up how a record reference token's chip shows its record: name, icon, link, preview or unavailability. */
    getReference?: RecordLabelResolver | undefined;
    /** The reader's open and closed choices by part id or group key (controlled). */
    expandedParts?: Readonly<Record<string, boolean>> | undefined;
    /** Receives the choices each time the reader opens or closes a part or group. */
    onExpandedPartsChange?: ((expandedParts: Record<string, boolean>) => void) | undefined;
}
/**
 * The parts of one message, each drawn by the component for its type: text as Markdown (or plain
 * text) with code blocks, citations and token pills, reasoning, tool calls with their approvals and
 * renderers, questions, plans, sources, attachments, code, diffs and custom parts. Consecutive
 * reasoning and tool calls fold into a group of steps that runs while the message streams; both
 * open on their own while they run, unless `expandsActivity` is false.
 */
export declare function ChatParts({ parts, messageId, isStreaming, textFormat, expandedParts, onExpandedPartsChange, className, id, ...rest }: ChatPartsProps): import("react").JSX.Element;
//# sourceMappingURL=chat-parts.d.ts.map