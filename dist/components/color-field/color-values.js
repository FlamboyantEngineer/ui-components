// A colour field's value model: the stored text, the formats it is written and edited in, and the
// channels each format's inputs edit.
import { parseColor } from '../../primitives/index.js';
const alphaFormats = new Set(['hexa', 'rgba', 'hsla', 'hsba']);
const spaces = {
    hex: undefined,
    hexa: undefined,
    rgb: 'rgb',
    rgba: 'rgb',
    hsl: 'hsl',
    hsla: 'hsl',
    hsb: 'hsb',
    hsba: 'hsb',
};
/** A format that carries an alpha channel. */
export function hasAlpha(format) {
    return alphaFormats.has(format);
}
function attemptParse(text) {
    try {
        return parseColor(text);
    }
    catch {
        return null;
    }
}
/**
 * A colour text as the CSS colour it spells, trimmed and with a `#` added to bare hex digits;
 * `null` when it is no colour.
 */
export function toColorText(value) {
    const text = value?.trim();
    if (!text)
        return null;
    return [text, `#${text}`].find((candidate) => attemptParse(candidate) !== null) ?? null;
}
/**
 * A colour text written in a format, with alpha to two decimals, so a hex alpha (`80`) reads `0.5`
 * rather than `0.5019607843137255`. Text that is no colour is kept.
 */
export function formatColor(text, format) {
    const color = attemptParse(text);
    if (!color)
        return text;
    const alpha = color.getChannelValue('alpha');
    return color.withChannelValue('alpha', Math.round(alpha * 100) / 100).toString(format);
}
/** The stored text of a colour: hex in lower case (`#rrggbb`, `#rrggbbaa`), other formats as written. */
export function toStoredValue(color, format) {
    const text = color.toString(format);
    return format === 'hex' || format === 'hexa' ? text.toLowerCase() : text;
}
/** A typed colour text as the stored text, or `null` when it is no colour. */
export function storeColorText(value, format) {
    const text = toColorText(value);
    const color = text === null ? null : attemptParse(text);
    return color ? toStoredValue(color, format) : null;
}
/** The inputs that edit a format: the hex input or the space's three channels, then alpha. */
export function describeFormatInputs(format) {
    const space = spaces[format];
    const channels = space ? [...parseColor('#000000').toFormat(space).getColorChannels()] : [];
    return {
        hasHex: !space,
        space,
        channels: hasAlpha(format) ? [...channels, 'alpha'] : channels,
    };
}
//# sourceMappingURL=color-values.js.map