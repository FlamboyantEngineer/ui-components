import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ChatToolCallApproval } from './tool-call-approval.js';
import { type ChatToolCallStatus } from './tool-call-parts.js';
export type { ChatToolCallApproval, ChatToolCallDecision } from './tool-call-approval.js';
export type { ChatToolCallStatus } from './tool-call-parts.js';
/** A tool call as data: what a host stores for one call of a tool by an assistant. */
export interface ChatToolCallData {
    /** The call's id, also the root element's `id`. */
    id: string;
    /** The tool's name, such as `search_recipes`. */
    name: string;
    /** A readable title, such as `Searched recipes`. Defaults to one derived from `name`. */
    label?: string | undefined;
    /** Where the call stands. */
    status: ChatToolCallStatus;
    /** The arguments the tool takes, shown as JSON. */
    args?: unknown;
    /** What the tool returned, shown as JSON. */
    result?: unknown;
    /** Why a `failed` call failed. */
    error?: string | undefined;
    /** How long the call ran, in milliseconds. */
    durationMs?: number | undefined;
    /** How the call was, or is to be, approved. */
    approval?: ChatToolCallApproval | undefined;
}
export interface ChatToolCallProps extends Omit<BaseProps, 'id'>, ChatToolCallData {
    /** Lets the call run once. Shows Approve while the approval is pending. */
    onApprove?: (() => void) | undefined;
    /** Refuses the call, with the reader's reason when they gave one. Shows Deny while pending. */
    onDeny?: ((reason?: string) => void) | undefined;
    /** Lets the call run, and the tool run from then on without asking. Shows Always allow. */
    onAlwaysAllow?: (() => void) | undefined;
    /** Whether the body shows (controlled). */
    isExpanded?: boolean | undefined;
    /** Whether the body shows at first. Defaults to following the status. */
    defaultExpanded?: boolean | undefined;
    /** Receives each requested expanded state, also while controlled. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /** A custom body for the tool, which replaces the arguments and result. */
    children?: ReactNode;
}
/**
 * One call of a tool by an assistant, as a collapsible card: a trigger with the status, the label
 * and the duration, a body with the arguments and result as JSON (or a custom body), the error of
 * a failed call, and, when the call asks for approval, Approve, Deny with a reason and Always
 * allow, with keyboard shortcuts, then the decision.
 */
export declare function ChatToolCall({ id, name, label, status, args, result, error, durationMs, approval, onApprove, onDeny, onAlwaysAllow, isExpanded, defaultExpanded, onExpandedChange, children, className, ...rest }: ChatToolCallProps): import("react").JSX.Element;
//# sourceMappingURL=chat-tool-call.d.ts.map