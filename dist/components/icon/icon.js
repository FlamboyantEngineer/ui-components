import { jsx as _jsx } from "react/jsx-runtime";
import { defaultGlyphs } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
const hooks = createHooks('icon', ['glyph']);
/** Whether an icon source names a built-in glyph; any other string is drawn as text. */
export function isGlyphName(source) {
    return typeof source === 'string' && Object.hasOwn(defaultGlyphs, source);
}
/** Image semantics for a drawing: an image named by `label`, or hidden from assistive technology. */
export function toImageProps(label) {
    return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
}
/** The `Icon` props that draw an icon source: `{ glyph }` for a glyph name, `{ children }` for a node. */
export function toIconProps(source) {
    return isGlyphName(source) ? { glyph: source } : { children: source };
}
/** One icon box: a built-in glyph or any icon node, decorative unless it has a label. */
export function Icon({ glyph, children, size = 'md', label, className, ...rest }) {
    return (_jsx("span", { ...rest, ...hooks.root({ className, data: { size, glyph } }), ...toImageProps(label), children: glyph ? _jsx(Glyph, { name: glyph, className: hooks.slotClass('glyph') }) : children }));
}
//# sourceMappingURL=icon.js.map