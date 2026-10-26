import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link as AriaLink } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, UiLink, useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
const hooks = createHooks('link', ['external-icon', 'new-tab-label']);
const safeRel = ['noopener', 'noreferrer'];
/** The caller's `rel` with the tokens that keep a new tab from reaching back to this page. */
function mergeSafeRel(rel) {
    const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
    return [...tokens, ...safeRel.filter((token) => !tokens.includes(token))].join(' ');
}
/** A link that navigates renders through the provider's link renderer; a disabled one is a span. */
export function renderLinkElement(props) {
    if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
        return _jsx(UiLink, { ...props, href: props.href });
    }
    const { href: _href, target: _target, rel: _rel, ...spanProps } = props;
    return _jsx("span", { ...spanProps });
}
/**
 * The glyph and the visually hidden text of a link that opens in a new tab. The space before the
 * glyph also separates the content from the hidden text in the accessible name.
 */
function NewTabParts() {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [' ', _jsx(Glyph, { name: "external-link", className: hooks.slotClass('external-icon') }), _jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('new-tab-label'), children: strings.opensInNewTab })] }));
}
/**
 * A navigation link: it navigates through the provider's `navigate` and link
 * renderer, says when it opens a new tab, and without `href` is a pressable link.
 */
export function Link({ variant = 'primary', isStandalone = false, underline = isStandalone ? 'hover' : 'always', isExternal = false, target = isExternal ? '_blank' : undefined, rel, routerOptions, children, render = renderLinkElement, className, ...rest }) {
    // A link without a destination, or a disabled one, is a span that opens nothing.
    const opensNewTab = target === '_blank' && rest.href !== undefined && !rest.isDisabled;
    return (_jsxs(AriaLink, { ...rest, routerOptions: routerOptions, ...hooks.root({
            className,
            props: rest,
            data: { variant, standalone: isStandalone, underline },
        }), target: target, rel: opensNewTab ? mergeSafeRel(rel) : rel, 
        // The building block draws a `<span>` without `href`; its props fit an anchor's.
        render: (props, state) => render(props, state), children: [children, opensNewTab ? _jsx(NewTabParts, {}) : null] }));
}
//# sourceMappingURL=link.js.map