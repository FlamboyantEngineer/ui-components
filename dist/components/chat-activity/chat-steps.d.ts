import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ActivityExpansionProps } from './activity-disclosure.js';
export interface ChatStepsProps extends Omit<BaseProps, 'id'>, ActivityExpansionProps {
    /** The run goes on: the group is open and busy. Defaults to `false`. */
    isRunning?: boolean | undefined;
    /** What the run is doing now, such as its reasoning's latest heading; labels it while it runs. */
    title?: string | undefined;
    /** How long the run took, in milliseconds, once it ended. */
    durationMs?: number | undefined;
    /** How many steps the group holds. Defaults to the number of children. */
    stepCount?: number | undefined;
    /** The steps: consecutive reasoning and tool-call parts of one reply. */
    children?: ReactNode;
}
/**
 * The consecutive reasoning and tool calls of one reply folded into one disclosure. While the run
 * goes on it is open (unless it does not expand automatically), labelled by its `title` or "Working…"
 * with the number of steps; once the run ends it collapses,
 * labelled with how long it took. The reader's own choice wins over both.
 */
export declare function ChatSteps({ isRunning, title, durationMs, stepCount, children, className, ...rest }: ChatStepsProps): import("react").JSX.Element;
//# sourceMappingURL=chat-steps.d.ts.map