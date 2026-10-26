import { jsx as _jsx } from "react/jsx-runtime";
import { createElement, Fragment, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { UiLink } from '../../core/provider.js';
import { mapTree } from '../../utils/map-tree.js';
import { TextMatch } from '../text-match/text-match.js';
import { defaultHtmlPolicy, sanitizeHtml, } from './sanitize-html.js';
const hooks = createHooks('html-markup');
const reactPropNames = {
    accesskey: 'accessKey',
    class: 'className',
    colspan: 'colSpan',
    crossorigin: 'crossOrigin',
    datetime: 'dateTime',
    hreflang: 'hrefLang',
    referrerpolicy: 'referrerPolicy',
    rowspan: 'rowSpan',
    srcset: 'srcSet',
    tabindex: 'tabIndex',
    usemap: 'useMap',
};
const booleanAttributes = new Set(['checked', 'disabled', 'hidden', 'open', 'reversed']);
function toElementProps(attributes) {
    const props = {};
    for (const [name, value] of Object.entries(attributes)) {
        props[reactPropNames[name] ?? name] = booleanAttributes.has(name) ? true : value;
    }
    return props;
}
function renderDefaultElement(element, children) {
    const props = toElementProps(element.attributes);
    const { href } = element.attributes;
    if (element.tag === 'a' && href !== undefined) {
        return (_jsx(UiLink, { ...props, href: href, children: children }));
    }
    return createElement(element.tag, props, ...(element.children.length > 0 ? [children] : []));
}
function renderNodes(nodes, renderElement) {
    return mapTree(nodes, (node) => (node.type === 'element' ? node.children : undefined), (node, children, index) => {
        if (node.type === 'text')
            return _jsx(TextMatch, { children: node.text }, index);
        const custom = renderElement?.(node, children);
        return (_jsx(Fragment, { children: custom === undefined ? renderDefaultElement(node, children) : custom }, index));
    });
}
/**
 * Renders an HTML fragment through an allowlist sanitizer as React elements, never through
 * innerHTML. Links render through the provider's link renderer; text through `TextMatch`.
 */
export function HtmlMarkup({ markup, policy = defaultHtmlPolicy, renderElement, className, ...rest }) {
    const nodes = useMemo(() => sanitizeHtml(markup, policy), [markup, policy]);
    return (_jsx("div", { ...rest, ...hooks.root({ className }), children: renderNodes(nodes, renderElement) }));
}
//# sourceMappingURL=html-markup.js.map