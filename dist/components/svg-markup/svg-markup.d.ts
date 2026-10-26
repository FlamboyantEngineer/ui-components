import type { BaseProps } from '../../core/props.js';
export interface SvgMarkupProps extends BaseProps {
    /** SVG markup with a root `<svg>` element, for example an entry of a host icon registry. */
    markup: string;
    /** Accessible name. Without one the drawing is decorative and hidden from assistive technology. */
    label?: string | undefined;
}
/**
 * Renders SVG markup as React elements, without innerHTML. The root keeps the markup's drawing
 * attributes (`viewBox`, `fill`, `stroke`, …); the stylesheet sizes it. Decorative unless labelled.
 * Renders nothing when the markup has no `<svg>` root.
 */
export declare function SvgMarkup({ markup, label, className, ...rest }: SvgMarkupProps): import("react").ReactSVGElement | null;
//# sourceMappingURL=svg-markup.d.ts.map