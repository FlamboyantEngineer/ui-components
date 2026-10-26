import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ColorArea, ColorSlider, ColorThumb, Dialog, Popover, SliderTrack, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ColorSwatchPicker, ColorSwatchPickerItem } from '../color-swatch/color-swatch.js';
import { ColorChannelInputs, ColorFormatChoice } from './color-field-channels.js';
import { ColorFieldEyeDropper } from './color-field-eye-dropper.js';
import { hasAlpha } from './color-values.js';
export const colorFieldHooks = createHooks('color-field', [
    'trigger',
    'swatch',
    'value',
    'group',
    'entry',
    'popover',
    'dialog',
    'area',
    'slider',
    'track',
    'thumb',
    'input',
    'swatches',
    'clear',
]);
const hooks = colorFieldHooks;
function ChannelSlider({ channel }) {
    return (_jsx(ColorSlider, { ...hooks.slot('slider', { channel }), colorSpace: "hsb", channel: channel, children: _jsx(SliderTrack, { ...hooks.slot('track'), children: _jsx(ColorThumb, { ...hooks.slot('thumb') }) }) }));
}
/**
 * The picker popover: the format choice, a saturation and brightness area, the hue slider (and the
 * alpha slider for an alpha format), the format's inputs, the eye dropper, the preset swatches and
 * Clear, which closes the picker once the colour is gone.
 */
export function ColorFieldPanel({ label, state, format, formats, onFormatChange, swatches, allowsEyeDropper, }) {
    const strings = useUiStrings();
    return (_jsx(Popover, { ...hooks.slot('popover'), placement: "bottom start", offset: 4, children: _jsx(Dialog, { ...hooks.slot('dialog'), "aria-label": label, children: ({ close }) => (_jsxs(_Fragment, { children: [_jsx(ColorFormatChoice, { format: format, formats: formats, onFormatChange: onFormatChange }), _jsx(ColorArea, { ...hooks.slot('area'), colorSpace: "hsb", xChannel: "saturation", yChannel: "brightness", children: _jsx(ColorThumb, { ...hooks.slot('thumb') }) }), _jsx(ChannelSlider, { channel: "hue" }), hasAlpha(format) ? _jsx(ChannelSlider, { channel: "alpha" }) : null, _jsx(ColorChannelInputs, { format: format }), swatches.length > 0 ? (_jsx(ColorSwatchPicker, { className: hooks.slotClass('swatches'), size: "sm", children: swatches.map((swatch) => (_jsx(ColorSwatchPickerItem, { color: swatch }, swatch))) })) : null, state.isRequired ? null : (_jsx(Button, { className: hooks.slotClass('clear'), variant: "ghost", size: "sm", isDisabled: !state.canClear, onPress: () => {
                            state.clear();
                            close();
                        }, children: strings.clear })), allowsEyeDropper ? _jsx(ColorFieldEyeDropper, {}) : null] })) }) }));
}
//# sourceMappingURL=color-field-panel.js.map