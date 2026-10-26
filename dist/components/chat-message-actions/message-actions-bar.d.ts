import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { MessageCommands } from './message-commands.js';
export interface MessageActionsBarProps extends BaseProps, AriaLabellingProps {
    state: MessageCommands;
    /** The overlays, when the bar owns them. */
    children?: ReactNode;
}
export declare const actionHooks: import("../../core/hooks.js").ComponentHooks<"edit" | "copy" | "delete" | "reply" | "status" | "comment" | "reason" | "feedback" | "react" | "rating" | "reasons" | "feedback-actions" | "emoji-popover">;
/** The toolbar of a message's commands, in a fixed order; arrow keys move between them. */
export declare function MessageActionsBar({ state, children, className, ...rest }: MessageActionsBarProps): import("react").JSX.Element;
//# sourceMappingURL=message-actions-bar.d.ts.map