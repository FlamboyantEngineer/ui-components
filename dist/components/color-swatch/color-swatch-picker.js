import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo } from 'react';
import { parseColor, ColorSwatchPicker as AriaColorSwatchPicker, ColorSwatchPickerItem as AriaColorSwatchPickerItem, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { ColorSwatch, isSwatchColor } from './color-swatch.js';
const hooks = createHooks('color-swatch-picker', ['item']);
const SwatchSizeContext = createContext('md');
/** Each item's colour text by the key the building block gives it, to report picks as given. */
const ColorTextsContext = createContext(null);
function toColorKey(color) {
    return parseColor(color).toString('hexa');
}
/**
 * A list of colour swatches to choose one from (React Aria `ColorSwatchPicker`): a single-selection
 * listbox whose arrow keys move between swatches and whose Enter or Space picks one.
 */
export function ColorSwatchPicker({ size = 'md', className, children, value, defaultValue, onChange, ...rest }) {
    const texts = useMemo(() => new Map(), []);
    return (_jsx(AriaColorSwatchPicker, { ...rest, ...hooks.root({ className, props: rest, data: { size } }), value: isSwatchColor(value) ? value : undefined, defaultValue: isSwatchColor(defaultValue) ? defaultValue : undefined, onChange: onChange
            ? (color) => {
                const key = color.toString('hexa');
                onChange(texts.get(key) ?? key);
            }
            : undefined, children: _jsx(ColorTextsContext, { value: texts, children: _jsx(SwatchSizeContext, { value: size, children: children }) }) }));
}
/** One choice of a `ColorSwatchPicker`: an option drawing its colour as a `ColorSwatch`. */
export function ColorSwatchPickerItem({ color, colorName, className, ...rest }) {
    const size = useContext(SwatchSizeContext);
    const texts = useContext(ColorTextsContext);
    const isShown = isSwatchColor(color);
    useEffect(() => {
        if (!isShown)
            return;
        const key = toColorKey(color);
        texts?.set(key, color);
        return () => {
            if (texts?.get(key) === color)
                texts.delete(key);
        };
    }, [texts, color, isShown]);
    if (!isShown)
        return null;
    return (_jsx(AriaColorSwatchPickerItem, { ...rest, ...hooks.slot('item', undefined, className), color: color, children: _jsx(ColorSwatch, { color: color, colorName: colorName, size: size }) }));
}
//# sourceMappingURL=color-swatch-picker.js.map