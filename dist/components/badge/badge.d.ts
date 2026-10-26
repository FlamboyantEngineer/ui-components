import type { ReactNode } from 'react';
import type { BaseProps, NativeProps, Size, Tone } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
export type BadgeTone = Tone;
export type BadgeSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `subtle` is a tinted pill, `solid` a filled token, `status` a tone dot before the label. */
export type BadgeVariant = 'subtle' | 'solid' | 'status';
export type BadgePlacement = 'inline' | 'overlay';
interface BadgeCommonProps extends BaseProps, Pick<NativeProps<'span'>, 'hidden' | 'aria-hidden' | 'aria-label'> {
    /** The value's tone. Defaults to `neutral`. */
    tone?: BadgeTone | undefined;
    /** Scale. Defaults to `md`. */
    size?: BadgeSize | undefined;
    /** Drop the pill inside chrome that already draws its own edge; tone and dot stay. */
    bare?: boolean | undefined;
}
export interface BadgeLabelProps extends BadgeCommonProps {
    /** Shape. Defaults to `subtle`. */
    variant?: BadgeVariant | undefined;
    /** The short value the badge shows. */
    children: ReactNode;
    /** A `status` badge is a polite live region unless this is `false`. */
    announce?: boolean | undefined;
    /** Soften only the status dot, keeping the label's contrast. */
    mutedDot?: boolean | undefined;
    /** A decorative icon before the label: a built-in glyph name or any icon node. */
    startIcon?: IconSource;
    /** A decorative icon after the label: a built-in glyph name or any icon node. */
    endIcon?: IconSource;
    count?: never;
    max?: never;
    more?: never;
    placement?: never;
    showZero?: never;
}
export interface BadgeCountProps extends BadgeCommonProps {
    /** The count. Shown as a whole, nonnegative number; a value that is not finite shows nothing. */
    count: number;
    /** Counts above this cap read as `max+`. Omit for the exact count. */
    max?: number | undefined;
    /** More entries exist beyond the counted ones: the count reads as `count+` and "count or more". */
    more?: boolean | undefined;
    /** `overlay` pins the count to the upper trailing corner of a positioned host. Defaults to `inline`. */
    placement?: BadgePlacement | undefined;
    /** Show a count of zero. Defaults to `true`; `false` renders nothing while the count is zero. */
    showZero?: boolean | undefined;
    variant?: never;
    children?: never;
    announce?: never;
    mutedDot?: never;
    startIcon?: never;
    endIcon?: never;
}
export interface BadgeDotProps extends BadgeCommonProps {
    /** A tone dot with no text, such as a corner marker on an icon or avatar. */
    variant: 'dot';
    /** `overlay` pins the dot to the upper trailing corner of a positioned host. Defaults to `inline`. */
    placement?: BadgePlacement | undefined;
    children?: never;
    count?: never;
    max?: never;
    more?: never;
    showZero?: never;
    announce?: never;
    mutedDot?: never;
    startIcon?: never;
    endIcon?: never;
}
export type BadgeProps = BadgeLabelProps | BadgeCountProps | BadgeDotProps;
/**
 * A compact, non-interactive value a reader scans: a tag, a type, a state or a count.
 * Pass `children` for a label, `count` for a formatted number, or `variant="dot"` for a marker.
 */
export declare function Badge(props: BadgeProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=badge.d.ts.map