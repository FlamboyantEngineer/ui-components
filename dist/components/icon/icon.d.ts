import type { ReactNode } from 'react';
import { type GlyphName } from '../../core/glyphs.js';
import type { BaseProps, Size } from '../../core/props.js';
/** A fixed box size, or `inherit`: a 1em box that scales with the surrounding font. */
export type IconSize = Extract<Size, 'sm' | 'md' | 'lg'> | 'inherit';
/** An icon given as a built-in glyph name or as any icon node. Components take icons in this form. */
export type IconSource = GlyphName | ReactNode;
export interface IconProps extends BaseProps {
    /** A built-in glyph, drawn from the provider's glyph map. */
    glyph?: GlyphName | undefined;
    /** Any icon node (an SVG element, an image), used when no `glyph` is given. */
    children?: ReactNode;
    /** Box size; `inherit` follows the surrounding font size. Defaults to `md`. */
    size?: IconSize | undefined;
    /** Accessible name. Without one the icon is decorative and hidden from assistive technology. */
    label?: string | undefined;
}
/** Whether an icon source names a built-in glyph; any other string is drawn as text. */
export declare function isGlyphName(source: IconSource): source is GlyphName;
/** Image semantics for a drawing: an image named by `label`, or hidden from assistive technology. */
export declare function toImageProps(label: string | undefined): {
    role: 'img';
    'aria-label': string;
} | {
    'aria-hidden': true;
};
/** The `Icon` props that draw an icon source: `{ glyph }` for a glyph name, `{ children }` for a node. */
export declare function toIconProps(source: IconSource): Pick<IconProps, 'glyph' | 'children'>;
/** One icon box: a built-in glyph or any icon node, decorative unless it has a label. */
export declare function Icon({ glyph, children, size, label, className, ...rest }: IconProps): import("react").JSX.Element;
//# sourceMappingURL=icon.d.ts.map