import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../../primitives/index.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { RecordChipParts } from './record-chip-parts.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
const hooks = createHooks('record-label', [
    'label',
    'identity',
    'icon',
    'identifier',
    'name',
    'accessible-label',
]);
const unavailableGlyphs = { restricted: 'lock', missing: 'warning' };
/** The root: a link to the record, or a span. */
function RecordLabelRoot({ href, isExternal, children, ...rest }) {
    if (href === undefined)
        return _jsx("span", { ...rest, children: children });
    return (_jsx(Link, { ...rest, href: href, isExternal: isExternal, variant: "secondary", underline: "hover", children: children }));
}
/**
 * The root's caller props and the text read in place of the visible label. A link carries the
 * caller's name; a span cannot, so it reads `aria-label` from hidden text and drops `aria-labelledby`.
 */
function resolveLabelling(props, isLink) {
    const { 'aria-label': ariaLabel, 'aria-labelledby': _labelledBy, ...unnamed } = props;
    if (isLink)
        return { rootProps: props, hiddenText: undefined };
    return { rootProps: unnamed, hiddenText: ariaLabel || undefined };
}
function resolveRecordHooks({ isChipLabel, className, data, }) {
    return isChipLabel
        ? {
            ...hooks.slot('label', data),
            className: mergeClassNames(hooks.slotClass('label'), className),
        }
        : hooks.root({ className, data: { ...data, mode: 'label' } });
}
/**
 * A record named by its icon and identifier, which never break apart, then its name, which gives up
 * width first: cut with a tooltip, or wrapped. With `href` the whole label is a link.
 */
export function RecordLabelText({ identifier, name, icon, size = 'md', href, isExternal, truncate = true, unavailable, className, isChipLabel = false, ...rest }) {
    const strings = useUiStrings();
    const glyph = unavailable ? unavailableGlyphs[unavailable] : icon;
    const text = name?.trim();
    const link = unavailable ? undefined : href;
    const { rootProps, hiddenText } = resolveLabelling(rest, link !== undefined);
    const isHidden = hiddenText !== undefined || undefined;
    return (_jsxs(RecordLabelRoot, { ...rootProps, ...resolveRecordHooks({ isChipLabel, className, data: { size, truncate, unavailable } }), href: link, isExternal: isExternal, children: [_jsxs("span", { ...hooks.slot('identity'), "aria-hidden": isHidden, children: [glyph ? (_jsx(Icon, { ...toIconProps(glyph), size: size, className: hooks.slotClass('icon') })) : null, _jsx("span", { ...hooks.slot('identifier'), children: unavailable ? strings.recordUnavailable(unavailable) : identifier })] }), text && !unavailable ? (_jsxs(_Fragment, { children: [' ', truncate ? (_jsx(TruncationTooltip, { className: hooks.slotClass('name'), "aria-hidden": isHidden, children: text })) : (_jsx("span", { ...hooks.slot('name'), "aria-hidden": isHidden, children: text }))] })) : null, hiddenText === undefined ? null : (_jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('accessible-label'), children: hiddenText }))] }));
}
/** One record reference, as a plain label or a chip with metadata, preview and removal. */
export function RecordLabel({ mode = 'label', type, version, state, layout, preview, onRemove, ...rest }) {
    return mode === 'chip' ? (_jsx(RecordChipParts, { ...rest, type: type, version: version, state: state, layout: layout, preview: preview, onRemove: onRemove })) : (_jsx(RecordLabelText, { ...rest }));
}
//# sourceMappingURL=record-label.js.map