import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ColorField as AriaColorField, Input } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { describeFormatInputs } from './color-values.js';
const hooks = createHooks('color-field', ['format', 'channels', 'hex', 'channel', 'input']);
/** The format choice of the picker: one segment per offered format. */
export function ColorFormatChoice({ format, formats, onFormatChange }) {
    const strings = useUiStrings();
    if (formats.length < 2)
        return null;
    return (_jsx(SegmentedChoice, { className: hooks.slotClass('format'), "aria-label": strings.colorFormat, size: "sm", sizing: "content", options: formats.map((value) => ({ value, label: value.toUpperCase() })), value: format, onChange: (value) => {
            if (value)
                onFormatChange(value);
        } }));
}
/**
 * The picker's inputs for its format: a hex input, or a number input per channel of the format's
 * colour space (React Aria `ColorField` with `channel`), then alpha for a format that has it. Each
 * channel input is named by React Aria from its channel.
 */
export function ColorChannelInputs({ format }) {
    const strings = useUiStrings();
    const { hasHex, space, channels } = describeFormatInputs(format);
    return (_jsxs("div", { ...hooks.slot('channels'), children: [hasHex ? (_jsx(AriaColorField, { ...hooks.slot('hex'), "aria-label": strings.hexColor, children: _jsx(Input, { ...hooks.slot('input') }) })) : null, channels.map((channel) => (_jsx(AriaColorField, { ...hooks.slot('channel'), channel: channel, colorSpace: space, children: _jsx(Input, { ...hooks.slot('input') }) }, channel)))] }));
}
//# sourceMappingURL=color-field-channels.js.map