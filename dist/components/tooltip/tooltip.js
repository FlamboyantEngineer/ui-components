import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloneElement, isValidElement } from 'react';
import { OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from '../../primitives/index.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
/** The hover delay before a tooltip opens, in milliseconds. */
export const TOOLTIP_DELAY = 500;
const hooks = createHooks('tooltip', ['arrow', 'content']);
/** The gap between the panel and its trigger, room for the arrow, in pixels. */
const tooltipOffset = 8;
/** The tooltip panel with its hooks; inside a `TooltipTrigger` or standalone with `triggerRef`. */
export function TooltipPanel({ variant, children, className, placement = 'top', ...rest }) {
    return (_jsxs(AriaTooltip, { ...rest, placement: placement, offset: tooltipOffset, ...hooks.root({ className, data: { variant } }), children: [_jsx(OverlayArrow, { className: hooks.slotClass('arrow') }), _jsx("span", { ...hooks.slot('content'), children: children })] }));
}
/**
 * Names the trigger element by `label`. React Aria describes the trigger by the open panel; here
 * the panel repeats the name, so an empty `aria-describedby`, which wins over React Aria's, keeps it
 * from being read twice. A trigger's own description still wins.
 */
function labelTrigger(children, label) {
    if (!isValidElement(children))
        return children;
    return cloneElement(children, {
        'aria-label': label,
        'aria-describedby': children.props['aria-describedby'] ?? '',
    });
}
/**
 * A short, non-interactive hint shown when its trigger is hovered (after `delay`) or keyboard
 * focused, and dismissed on leave, blur, press or Escape. With `relationship="label"` the hint is
 * the trigger's name instead of its description.
 */
export function Tooltip({ content, children, variant = 'default', placement, className, delay = TOOLTIP_DELAY, relationship = 'description', ...rest }) {
    const [data, triggerProps] = splitDataAttributes(rest);
    const isLabel = relationship === 'label' && typeof content === 'string';
    return (_jsxs(TooltipTrigger, { ...triggerProps, delay: delay, children: [isLabel ? labelTrigger(children, content) : children, _jsx(TooltipPanel, { ...data, variant: variant, className: className, placement: placement, children: content })] }));
}
//# sourceMappingURL=tooltip.js.map