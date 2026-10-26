import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
const hooks = createHooks('icon-label', ['icon', 'label']);
/** A decorative leading icon followed by text, inheriting the host's typography. */
export function IconLabel({ icon, label, size = 'md', truncate, grow, hideLabel, collapsible, live, className, ...rest }) {
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data: { size, truncate, grow, collapsible } }), "aria-live": live, children: [_jsx(Icon, { ...toIconProps(icon), size: size, className: hooks.slotClass('icon') }), truncate ? (_jsx(TruncationTooltip, { className: hooks.slotClass('label'), hidden: hideLabel, children: label })) : (_jsx("span", { ...hooks.slot('label'), hidden: hideLabel, children: label }))] }));
}
//# sourceMappingURL=icon-label.js.map