import type { HTMLAttributes, ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type IconSize, type IconSource } from '../icon/icon.js';
export interface IconLabelProps extends BaseProps, Pick<HTMLAttributes<HTMLSpanElement>, 'hidden'> {
    /** A built-in glyph name or any icon node. The icon is decorative; the label names it. */
    icon: IconSource;
    /** The text after the icon. */
    label: ReactNode;
    /** Icon box size; the host stylesheet sizes the gap from it. Defaults to `md`. */
    size?: Exclude<IconSize, 'inherit'> | undefined;
    /**
     * Keep the label on one line and let the stylesheet ellipsize it. The full text stays in the DOM
     * and shows in a tooltip while it is cut.
     */
    truncate?: boolean | undefined;
    /** Take the available width of the host row. */
    grow?: boolean | undefined;
    /** Hide the label text (for collapsed navigation); the host control supplies the accessible name. */
    hideLabel?: boolean | undefined;
    /** Mark the label text as one the stylesheet may hide in narrow containers. */
    collapsible?: boolean | undefined;
    /** Announce label changes. Quiet by default. */
    live?: 'polite' | 'assertive' | undefined;
}
/** A decorative leading icon followed by text, inheriting the host's typography. */
export declare function IconLabel({ icon, label, size, truncate, grow, hideLabel, collapsible, live, className, ...rest }: IconLabelProps): import("react").JSX.Element;
//# sourceMappingURL=icon-label.d.ts.map