import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type HtmlElementNode, type HtmlPolicy } from './sanitize-html.js';
export interface HtmlMarkupProps extends BaseProps {
    /** The HTML fragment to show, for example stored rich text. It is sanitized before rendering. */
    markup: string;
    /** What the sanitizer keeps. Defaults to `defaultHtmlPolicy`. */
    policy?: HtmlPolicy | undefined;
    /**
     * Replaces a kept element: receives the sanitized element and its rendered children. Return
     * `undefined` to keep the default element, `null` to render nothing.
     */
    renderElement?: ((element: HtmlElementNode, children: ReactNode) => ReactNode) | undefined;
}
/**
 * Renders an HTML fragment through an allowlist sanitizer as React elements, never through
 * innerHTML. Links render through the provider's link renderer; text through `TextMatch`.
 */
export declare function HtmlMarkup({ markup, policy, renderElement, className, ...rest }: HtmlMarkupProps): import("react").JSX.Element;
//# sourceMappingURL=html-markup.d.ts.map