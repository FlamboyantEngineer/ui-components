import { jsx as _jsx } from "react/jsx-runtime";
import { ColorSwatch as AriaColorSwatch, parseColor } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
const hooks = createHooks('color-swatch');
/** Whether the swatch can draw `color`: a hex, `rgb()`, `hsl()` or `hsb()` colour string. */
export function isSwatchColor(color) {
    if (!color)
        return false;
    try {
        parseColor(color);
        return true;
    }
    catch {
        return false;
    }
}
/** A colour shown on its own, named by its colour so assistive technology can read it. */
export function ColorSwatch({ color, size = 'md', className, colorName, ...rest }) {
    const strings = useUiStrings();
    const drawn = isSwatchColor(color) ? color : undefined;
    return (_jsx(AriaColorSwatch, { ...rest, ...hooks.root({ className, props: rest, data: { size, empty: drawn === undefined } }), color: drawn, colorName: drawn === undefined ? strings.noColor : colorName }));
}
export { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';
//# sourceMappingURL=color-swatch.js.map