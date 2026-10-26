import type { BaseProps } from '../../core/props.js';
import { type ChatPlanData } from './chat-activity.js';
export interface ChatPlanProps extends BaseProps, ChatPlanData {
}
/**
 * An assistant's plan: an optional title, how many steps are done, and the ordered steps, each with
 * a status glyph and status words, the one in progress marked as the current step. Status changes
 * are announced politely, at most one announcement every two seconds.
 */
export declare function ChatPlan({ title, steps, className, ...rest }: ChatPlanProps): import("react").JSX.Element;
//# sourceMappingURL=chat-plan.d.ts.map