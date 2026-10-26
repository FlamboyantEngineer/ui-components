import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, toIconProps } from '../icon/icon.js';
const hooks = createHooks('badge', ['dot', 'start-icon', 'label', 'end-icon', 'accessible-label']);
function isCountBadge(props) {
    return typeof props.count === 'number';
}
function isDotBadge(props) {
    return props.variant === 'dot';
}
function isAriaHidden(value) {
    return value === true || value === 'true';
}
/** Text only assistive technology reads, in place of a visible label that differs from it. */
function AccessibleLabel({ children }) {
    return (_jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('accessible-label'), children: children }));
}
/** The text a count is read as: the caller's label, else the uncapped count ("12 or more" with `more`). */
function describeCount({ count, more, 'aria-label': ariaLabel }, strings) {
    if (ariaLabel !== undefined)
        return ariaLabel;
    const exact = normalizeCount(count);
    if (exact === undefined)
        return '';
    return more ? strings.countOrMore(exact) : String(exact);
}
function CountBadge({ count, max, more = false, placement = 'inline', tone = 'neutral', size = 'md', bare = false, showZero = true, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const visible = formatCount(count, { max, more });
    const spoken = describeCount({ count, more, 'aria-label': ariaLabel }, strings);
    const isSeparate = !isAriaHidden(rest['aria-hidden']) && spoken !== visible;
    const data = { variant: 'count', tone, size, placement, bare };
    if (!showZero && normalizeCount(count) === 0 && !more)
        return null;
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data }), children: [_jsx("span", { ...hooks.slot('label'), "aria-hidden": isSeparate || undefined, children: visible }), isSeparate ? _jsx(AccessibleLabel, { children: spoken }) : null] }));
}
/** A tone dot with no text: decorative, or read as its `aria-label` from visually hidden text. */
function DotBadge({ placement = 'inline', tone = 'neutral', size = 'md', bare = false, className, 'aria-label': ariaLabel, ...rest }) {
    const isSpoken = Boolean(ariaLabel) && !isAriaHidden(rest['aria-hidden']);
    const data = { variant: 'dot', tone, size, placement, bare };
    return (_jsx("span", { ...rest, "aria-hidden": isSpoken ? rest['aria-hidden'] : true, ...hooks.root({ className, data }), children: isSpoken && ariaLabel ? _jsx(AccessibleLabel, { children: ariaLabel }) : null }));
}
/**
 * Where a label badge's `aria-label` goes: its name when it has a role, else visually hidden text
 * read in place of the visible label, since a generic element cannot carry a name.
 */
function resolveLabelName({ role, ariaLabel, ariaHidden, }) {
    if (role)
        return { name: ariaLabel, hiddenText: undefined };
    const isSpoken = Boolean(ariaLabel) && !isAriaHidden(ariaHidden);
    return { name: undefined, hiddenText: isSpoken ? ariaLabel : undefined };
}
/** A label badge's decorative icon in its slot, or nothing. */
function renderLabelIcon(source, slot) {
    return isEmptyNode(source) ? null : (_jsx(Icon, { ...toIconProps(source), className: hooks.slotClass(slot) }));
}
function LabelBadge({ variant = 'subtle', children, announce = true, mutedDot = false, startIcon, endIcon, tone = 'neutral', size = 'md', bare = false, className, 'aria-label': ariaLabel, ...rest }) {
    const isStatus = variant === 'status';
    const role = isStatus && announce ? 'status' : undefined;
    const { name, hiddenText } = resolveLabelName({
        role,
        ariaLabel,
        ariaHidden: rest['aria-hidden'],
    });
    const data = { variant, tone, size, bare, mutedDot: isStatus && mutedDot };
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data }), role: role, "aria-label": name, children: [isStatus ? _jsx("span", { ...hooks.slot('dot'), "aria-hidden": "true" }) : null, renderLabelIcon(startIcon, 'start-icon'), _jsx("span", { ...hooks.slot('label'), "aria-hidden": hiddenText !== undefined || undefined, children: children }), renderLabelIcon(endIcon, 'end-icon'), hiddenText === undefined ? null : _jsx(AccessibleLabel, { children: hiddenText })] }));
}
/**
 * A compact, non-interactive value a reader scans: a tag, a type, a state or a count.
 * Pass `children` for a label, `count` for a formatted number, or `variant="dot"` for a marker.
 */
export function Badge(props) {
    if (isCountBadge(props))
        return _jsx(CountBadge, { ...props });
    if (isDotBadge(props))
        return _jsx(DotBadge, { ...props });
    return _jsx(LabelBadge, { ...props });
}
//# sourceMappingURL=badge.js.map