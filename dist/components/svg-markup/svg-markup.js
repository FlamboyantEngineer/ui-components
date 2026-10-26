import { createElement } from 'react';
import { createHooks } from '../../core/hooks.js';
import { mapTree } from '../../utils/map-tree.js';
import { toImageProps } from '../icon/icon.js';
import { parseSvgMarkup } from './parse-svg-markup.js';
const hooks = createHooks('svg-markup');
const reactPropNames = {
    class: 'className',
    tabindex: 'tabIndex',
    crossorigin: 'crossOrigin',
    'xmlns:xlink': 'xmlnsXlink',
};
/** Root attributes the component and its caller own; the markup's values are dropped. */
const ownedRootAttribute = /^(class|style|width|height|role|focusable|tabindex|id|aria-.+|data-.+)$/i;
function toCamelCase(name) {
    return name.replace(/[-:]([a-z])/g, (_, letter) => letter.toUpperCase());
}
/** The React prop for an SVG attribute: `stroke-width` → `strokeWidth`, `xlink:href` → `xlinkHref`. */
function toPropName(attribute) {
    const mapped = reactPropNames[attribute];
    if (mapped)
        return mapped;
    if (attribute.startsWith('data-') || attribute.startsWith('aria-'))
        return attribute;
    return toCamelCase(attribute);
}
/** A CSS declaration list as a React style object. */
function parseStyle(css) {
    const style = {};
    for (const declaration of css.split(';')) {
        const colon = declaration.indexOf(':');
        if (colon === -1)
            continue;
        const property = declaration.slice(0, colon).trim();
        const value = declaration.slice(colon + 1).trim();
        if (!property || !value)
            continue;
        if (property.startsWith('--')) {
            style[property] = value;
            continue;
        }
        const lower = property.toLowerCase();
        const name = lower.startsWith('-ms-') ? lower.slice(1) : lower;
        style[toCamelCase(name)] = value;
    }
    return style;
}
function toElementProps(attributes, keep = () => true) {
    const props = {};
    for (const [name, value] of Object.entries(attributes)) {
        if (!keep(name))
            continue;
        props[toPropName(name)] = name === 'style' ? parseStyle(value) : value;
    }
    return props;
}
function renderChildren(node) {
    return mapTree(node.children, (child) => (child.type === 'element' ? child.children : undefined), (child, children, key) => child.type === 'text'
        ? child.text
        : createElement(child.tag, { ...toElementProps(child.attributes), key }, children));
}
function tryParse(markup) {
    try {
        return parseSvgMarkup(markup);
    }
    catch {
        return null;
    }
}
/**
 * Renders SVG markup as React elements, without innerHTML. The root keeps the markup's drawing
 * attributes (`viewBox`, `fill`, `stroke`, …); the stylesheet sizes it. Decorative unless labelled.
 * Renders nothing when the markup has no `<svg>` root.
 */
export function SvgMarkup({ markup, label, className, ...rest }) {
    const tree = tryParse(markup);
    if (!tree)
        return null;
    return createElement('svg', {
        ...toElementProps(tree.attributes, (name) => !ownedRootAttribute.test(name)),
        ...rest,
        ...hooks.root({ className }),
        focusable: 'false',
        ...toImageProps(label),
    }, renderChildren(tree));
}
//# sourceMappingURL=svg-markup.js.map