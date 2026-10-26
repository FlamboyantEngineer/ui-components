import { type ReactNode } from 'react';
/** Where a tool call stands, from queued to finished. */
export type ChatToolCallStatus = 'pending' | 'running' | 'approval-requested' | 'succeeded' | 'failed' | 'denied' | 'cancelled';
interface ToolCallTitleProps {
    label: string;
    status: ChatToolCallStatus;
    durationMs: number | undefined;
    isAutoApproved: boolean;
}
interface ToolCallBodyProps {
    args: unknown;
    result: unknown;
    /** A custom body, which replaces the arguments and result. */
    children?: ReactNode;
}
/**
 * The trigger's content: the status glyph, the label, the status, the duration and the badge,
 * spaced so the trigger's name reads them as words.
 */
export declare function ToolCallTitle({ label, status, durationMs, isAutoApproved }: ToolCallTitleProps): import("react").JSX.Element;
/** A failed call's error, announced as an alert. */
export declare function ToolCallError({ message }: {
    message: string;
}): import("react").JSX.Element;
/** The panel's content: the custom body, else the arguments and result, else a note. */
export declare function ToolCallBody({ args, result, children }: ToolCallBodyProps): string | number | bigint | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element;
export {};
//# sourceMappingURL=tool-call-parts.d.ts.map