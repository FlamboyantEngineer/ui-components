import { jsx as _jsx } from "react/jsx-runtime";
import { Field, useFieldControl } from '../field/field.js';
import { SliderControl, sliderHooks as hooks } from './slider-parts.js';
/**
 * A field for a number picked along a track, on React Aria's `Slider`: a thumb that moves with the
 * pointer and the arrow, Page and Home and End keys, a fill, optional marks and a value output,
 * with the field's label, description, validation, dirty state, undo and menu. Each drag or key
 * press commits.
 */
export function Slider({ marks = [], valueLabel = 'output', size = 'md', fillOffset, ...props }) {
    const { state, field, rest } = useFieldControl(props, { initialValue: props.minValue ?? 0 });
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data: { valueLabel } }), size: size, state: state, children: (control) => (_jsx(SliderControl, { state: state, control: control, label: field.label, rest: rest, marks: marks, valueLabel: valueLabel, fillOffset: fillOffset, thumbLabels: [undefined] })) }));
}
export { RangeSlider, keepThumbsApart } from './range-slider.js';
//# sourceMappingURL=slider.js.map