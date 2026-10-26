import type { ReactNode } from 'react';
import { type PropertyRowProps } from '../property-panel/property-panel.js';
/** One side of a box, such as a margin. */
export type BoxSide = 'top' | 'bottom' | 'left' | 'right';
/** One side of a box in flow-relative terms, which follow the writing direction. */
export type LogicalBoxSide = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';
/** What linked sides share: one edit sets `all` four sides, or the side and its opposite (`pairs`). */
export type FourSidePropertyStripLink = 'all' | 'pairs';
/** A value for some or all of the sides. */
export type FourSideValues<S extends string, T> = Readonly<Partial<Record<S, T>>>;
/** One side's value and the way to change it, handed to `renderSide`. */
export interface FourSideField<T> {
    /** The side's value, when the strip holds values. */
    value: T | undefined;
    /** Sets the side's value, and the sides linked to it. */
    onChange: (value: T) => void;
}
interface FourSideOptions<S extends string, T> extends Omit<PropertyRowProps, 'children' | 'keywords' | 'htmlFor'> {
    /** Draws the control of one side. Each control names itself, for example `Margin top`. */
    renderSide: (side: S, field: FourSideField<T>) => ReactNode;
    /** The sides' values, controlled. */
    value?: FourSideValues<S, T> | undefined;
    /** The sides' values to start from, uncontrolled. */
    defaultValue?: FourSideValues<S, T> | undefined;
    /** Called with every side's value when one changes. */
    onChange?: ((value: FourSideValues<S, T>) => void) | undefined;
    /** Offers a toggle that links the sides, so one edit sets all four or each opposite pair. */
    link?: FourSidePropertyStripLink | undefined;
    /** Whether the sides are linked, controlled. */
    isLinked?: boolean | undefined;
    /** Whether the sides start linked, uncontrolled. */
    defaultLinked?: boolean | undefined;
    /** Called when the reader links or unlinks the sides. */
    onLinkedChange?: ((isLinked: boolean) => void) | undefined;
}
export type FourSidePropertyStripProps<T = string> = (FourSideOptions<BoxSide, T> & {
    /** `physical` (the default) edits top, bottom, left and right. */
    sides?: 'physical' | undefined;
}) | (FourSideOptions<LogicalBoxSide, T> & {
    /** `logical` edits block start and end, then inline start and end, which follow the direction. */
    sides: 'logical';
});
/**
 * One property row holding a value for each side of a box, such as margins or padding: top,
 * bottom, left and right, or their flow-relative counterparts. Each side's cell shows the first
 * letter of the side's name; the names are also words a query matches. Holding the values, the
 * strip can link its sides so that one edit sets all four or each opposite pair.
 */
export declare function FourSidePropertyStrip<T = string>(props: FourSidePropertyStripProps<T>): import("react").JSX.Element;
export {};
//# sourceMappingURL=four-side-property-strip.d.ts.map