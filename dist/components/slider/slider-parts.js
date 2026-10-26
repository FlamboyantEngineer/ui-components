import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { useObjectRef, Slider as AriaSlider, SliderFill, SliderOutput, SliderThumb, SliderTrack, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { clamp } from '../../utils/clamp.js';
export const sliderHooks = createHooks('slider', [
    'box',
    'output',
    'track',
    'fill',
    'mark',
    'mark-label',
    'thumb',
    'thumb-label',
]);
const hooks = sliderHooks;
function toValues(value) {
    return Array.isArray(value) ? value : [value];
}
/** The filled part of the track: between the thumbs of a range, else between the offset and the value. */
function resolveFill(values, bounds) {
    if (values.length > 1)
        return { low: values[0] ?? 0, high: values.at(-1) ?? 0 };
    const origin = clamp(bounds.offset ?? bounds.minValue, bounds.minValue, bounds.maxValue);
    const value = values[0] ?? origin;
    return { low: Math.min(origin, value), high: Math.max(origin, value) };
}
function Mark({ mark, bounds }) {
    const span = bounds.maxValue - bounds.minValue || 1;
    const percent = `${clamp((mark.value - bounds.minValue) / span, 0, 1) * 100}%`;
    const isInRange = mark.value >= bounds.low && mark.value <= bounds.high;
    return (_jsx("span", { ...hooks.slot('mark', { inRange: isInRange }), "aria-hidden": "true", style: bounds.isVertical
            ? { position: 'absolute', bottom: percent }
            : { position: 'absolute', insetInlineStart: percent }, children: mark.label != null ? _jsx("span", { ...hooks.slot('mark-label'), children: mark.label }) : null }));
}
/**
 * A slider's group on React Aria's `Slider`: the value output, the track with its fill and marks,
 * and one thumb per value. The value lives in the field state; each drag or key press commits.
 */
export function SliderControl({ state, control, label, rest, marks, valueLabel, fillOffset, thumbLabels, normalize = (next) => next, }) {
    const { name, onChangeEnd, ...aria } = rest;
    const inputRef = useObjectRef(control.ref);
    // The value set during this interaction; the field state's value is the last render's.
    const latest = useRef(state.value);
    latest.current = state.value;
    const isLocked = state.isReadOnly || state.isDisabled;
    const minValue = aria.minValue ?? 0;
    const maxValue = aria.maxValue ?? 100;
    const values = toValues(state.value);
    const bounds = {
        minValue,
        maxValue,
        isVertical: aria.orientation === 'vertical',
        ...resolveFill(values, { minValue, maxValue, offset: fillOffset }),
    };
    return (_jsxs(AriaSlider, { ...aria, ...hooks.slot('box'), id: control.id, "aria-label": label, "aria-describedby": control['aria-describedby'], isDisabled: control.disabled, value: state.value, onChange: (next) => {
            if (isLocked)
                return;
            latest.current = normalize(next, latest.current);
            state.setValue(latest.current);
        }, onChangeEnd: () => {
            if (isLocked)
                return;
            state.commit();
            onChangeEnd?.(latest.current);
        }, children: [valueLabel === 'output' ? _jsx(SliderOutput, { ...hooks.slot('output') }) : null, _jsxs(SliderTrack, { ...hooks.slot('track'), children: [_jsx(SliderFill, { ...hooks.slot('fill'), offset: fillOffset }), marks.map((mark) => (_jsx(Mark, { mark: mark, bounds: bounds }, mark.value))), values.map((_, index) => (_jsx(SliderThumb, { ...hooks.slot('thumb'), index: index, name: name, "aria-label": thumbLabels[index], inputRef: index === 0 ? inputRef : undefined, 
                        // React Aria reports a thumb invalid only through this deprecated prop.
                        isInvalid: control['aria-invalid'], "aria-errormessage": control['aria-errormessage'], children: valueLabel === 'thumb'
                            ? ({ state: slider }) => (_jsx("span", { ...hooks.slot('thumb-label'), "aria-hidden": "true", children: slider.getThumbValueLabel(index) }))
                            : null }, index)))] })] }));
}
//# sourceMappingURL=slider-parts.js.map