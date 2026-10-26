import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Label, ProgressBar as AriaProgressBar, Meter as AriaMeter, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { ProgressRing } from './progress-ring.js';
import { resolveMeterTone } from './progress-meter.js';
import { clamp } from '../../utils/clamp.js';
const hooks = createHooks('progress-bar', ['label', 'value', 'track', 'fill', 'ring']);
const spinnerHooks = createHooks('spinner');
function toFinite(value, fallback) {
    return value !== undefined && Number.isFinite(value) ? value : fallback;
}
/**
 * Bounds a range so it never claims more than it measured: non-finite numbers fall back to the
 * minimum, the maximum is never below the minimum and the value stays inside the range.
 */
export function resolveProgressRange(range) {
    const minValue = toFinite(range.minValue, 0);
    const maxValue = Math.max(minValue, range.maxValue === undefined ? 100 : toFinite(range.maxValue, minValue));
    return { value: clamp(toFinite(range.value, minValue), minValue, maxValue), minValue, maxValue };
}
/** Whether measured progress reached the end of a range that has one. */
function isComplete(range) {
    return range.maxValue > range.minValue && range.value === range.maxValue;
}
/** The root both progress indicators render; `children` draws the indicator. */
export function ProgressRoot({ hooks: rootHooks, size, tone, mode = 'progress', shape = 'linear', low, high, optimum, isIndeterminate = false, value, minValue, maxValue, className, render, children, ...rest }) {
    const range = resolveProgressRange({ value, minValue, maxValue });
    const indeterminate = mode === 'progress' && isIndeterminate;
    const complete = mode === 'progress' && !indeterminate && isComplete(range);
    const judged = tone ??
        (mode === 'meter' ? resolveMeterTone(range, { low, high, optimum }) : undefined) ??
        'neutral';
    const data = { size, tone: judged, mode, shape, indeterminate, complete };
    const Root = mode === 'meter' ? AriaMeter : AriaProgressBar;
    return (_jsx(Root, { ...rest, ...rootHooks.root({ className, data }), ...range, ...(mode === 'progress' ? { isIndeterminate: indeterminate } : {}), render: render
            ? (props, state) => render(props, {
                percentage: state.percentage,
                valueText: state.valueText,
                isIndeterminate: indeterminate,
            })
            : undefined, children: (state) => children({
            percentage: state.percentage,
            valueText: state.valueText,
            isIndeterminate: indeterminate,
        }) }));
}
/** The label and value text both progress indicators show. */
export function ProgressText({ hooks: textHooks, label, showValueLabel, values, }) {
    return (_jsxs(_Fragment, { children: [label != null ? _jsx(Label, { className: textHooks.slotClass('label'), children: label }) : null, showValueLabel && !values.isIndeterminate ? (_jsx("span", { ...textHooks.slot('value'), children: values.valueText })) : null] }));
}
/** A bar showing how much of a known amount of work is done, or that work is under way. */
export function ProgressBar({ label, shape = 'linear', showValueLabel = shape === 'linear', size = 'md', ...rest }) {
    return (_jsx(ProgressRoot, { ...rest, shape: shape, hooks: hooks, size: size, children: (values) => (_jsxs(_Fragment, { children: [_jsx(ProgressText, { hooks: hooks, label: label, showValueLabel: showValueLabel, values: values }), shape === 'circular' ? (_jsx(ProgressRing, { gap: values.isIndeterminate ? 75 : 100 - (values.percentage ?? 0) })) : (_jsx("div", { ...hooks.slot('track'), children: _jsx("div", { ...hooks.slot('fill'), style: values.isIndeterminate ? undefined : { width: `${values.percentage ?? 0}%` } }) }))] })) }));
}
/**
 * A busy indicator for unmeasured work too small for a bar. Without `label` it is decorative, such
 * as the start of a busy line whose text carries the status; with one it stands alone as an
 * indeterminate progress bar named by the label.
 */
export function Spinner({ size = 'md', label, className, ...rest }) {
    const hookProps = spinnerHooks.root({ className, data: { size } });
    if (!label)
        return _jsx("span", { ...rest, ...hookProps, "aria-hidden": "true" });
    return (_jsx(AriaProgressBar, { ...rest, ...hookProps, "aria-label": label, isIndeterminate: true, 
        // The glyph stays a `<span>`, so a named spinner still sits inside a line of text.
        render: (props) => _jsx("span", { ...props }) }));
}
export { resolveMeterTone } from './progress-meter.js';
//# sourceMappingURL=progress-bar.js.map