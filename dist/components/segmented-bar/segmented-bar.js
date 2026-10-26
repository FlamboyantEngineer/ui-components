import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { resolveSegmentedBar } from './segmented-layout.js';
import { SegmentedTrack } from './segmented-track.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
const hooks = createHooks('segmented-bar', [
    'label',
    'total',
    'track',
    'segment',
    'legend',
    'item',
    'swatch',
    'item-label',
    'item-value',
    'item-share',
]);
const shareFormat = { style: 'percent', maximumFractionDigits: 1 };
/** The legend list: each segment's label, count and share, visible or read only by assistive technology. */
function SegmentedBarLegend({ segments, formatOptions, isVisible, }) {
    const count = useNumberFormatter(formatOptions);
    const percent = useNumberFormatter(shareFormat);
    const list = (_jsx("ul", { ...hooks.slot('legend'), children: segments.map(({ segment, value, share }) => (_jsxs("li", { ...hooks.slot('item', { tone: segment.tone ?? 'neutral' }), children: [_jsx("span", { ...hooks.slot('swatch'), "aria-hidden": "true" }), _jsx("span", { ...hooks.slot('item-label'), children: segment.label }), ' ', _jsx("span", { ...hooks.slot('item-value'), children: count.format(value) }), ' ', _jsx("span", { ...hooks.slot('item-share'), children: percent.format(share / 100) })] }, toKeyIdentity(segment.id)))) }));
    return isVisible ? list : _jsx(VisuallyHidden, { children: list });
}
/**
 * One bar split into proportional segments, such as passed, failed and skipped checks, with a
 * summary list of each segment's count and share that a legend can show.
 */
export function SegmentedBar({ segments, label, shape = 'linear', animated = false, total, showTotal = true, showLegend = false, size = 'md', formatOptions, className, ...rest }) {
    const labelId = useId();
    const strings = useUiStrings();
    const format = useNumberFormatter(formatOptions);
    const resolved = resolveSegmentedBar(segments, total);
    const hasLabel = label != null && rest['aria-labelledby'] === undefined && !rest['aria-label'];
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { size, shape, animated } }), role: "group", "aria-labelledby": hasLabel ? labelId : rest['aria-labelledby'], children: [label != null ? (_jsx("span", { ...hooks.slot('label'), id: labelId, children: label })) : null, showTotal ? (_jsx("span", { ...hooks.slot('total'), children: strings.totalCount(format.format(resolved.total)) })) : null, _jsx(SegmentedTrack, { shape: shape, segments: resolved.segments, animated: animated }), _jsx(SegmentedBarLegend, { segments: resolved.segments, formatOptions: formatOptions, isVisible: showLegend })] }));
}
//# sourceMappingURL=segmented-bar.js.map