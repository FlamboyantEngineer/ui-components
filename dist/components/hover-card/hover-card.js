import { jsx as _jsx } from "react/jsx-runtime";
import { PreviewTrigger } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { PopoverPanel } from '../popover/popover.js';
const hooks = createHooks('hover-card', ['arrow']);
/**
 * Opens the `HoverCard` among its children `delay` milliseconds after the pointer rests on the
 * trigger (a React Aria focusable such as a `Link` or `Button`) or keyboard focus reaches it, or on a
 * long press, and closes it `closeDelay` milliseconds after both leave the trigger and the card.
 */
export function HoverCardTrigger({ children, ...trigger }) {
    return _jsx(PreviewTrigger, { ...trigger, children: children });
}
/**
 * A card of extra content about its trigger, shown on hover and focus without taking focus. It
 * shares the popover's positioning and arrow; Tab from the trigger moves into it and Escape closes it.
 */
export function HoverCard({ showArrow = false, className, children, ...rest }) {
    return (_jsx(PopoverPanel, { ...rest, ...hooks.root({ className, props: rest }), arrowClassName: showArrow ? hooks.slotClass('arrow') : undefined, children: children }));
}
//# sourceMappingURL=hover-card.js.map