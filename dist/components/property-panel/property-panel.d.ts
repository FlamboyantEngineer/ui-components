import { type ReactNode } from 'react';
import type { ExpansionProps } from '../../core/events.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
/** `responsive` stacks row labels over their controls in a narrow panel; `inline` keeps them beside. */
export type PropertyPanelLabelLayout = 'responsive' | 'inline';
/** `separate` frames each button; `segmented` frames the run once, with dividers. */
export type PropertyIconGroupVariant = 'separate' | 'segmented';
export interface PropertyPanelProps extends BaseProps, Pick<NativeProps<'section'>, 'aria-label' | 'aria-labelledby'>, ExpansionProps {
    /** Lets several sections be open at once; `false` makes the panel an accordion. Defaults to `true`. */
    allowsMultipleExpanded?: boolean | undefined;
    /** Content above the body, such as a title or a search box. */
    header?: ReactNode;
    /** Where row labels sit. Defaults to `responsive`. */
    labelLayout?: PropertyPanelLabelLayout | undefined;
    /** Disables every field inside, which then refuses changes. */
    isDisabled?: boolean | undefined;
    /** Makes every field inside read-only. */
    isReadOnly?: boolean | undefined;
    /** The panel's sections, groups and rows. */
    children?: ReactNode;
}
export interface PropertyGroupProps extends BaseProps {
    /** A heading over the rows, which also names the group. A query matches it for every row inside. */
    heading?: string | undefined;
    /** The group's rows and cards. */
    children?: ReactNode;
}
export interface PropertyIconGroupProps extends BaseProps, Pick<NativeProps<'div'>, 'aria-label' | 'aria-labelledby'> {
    /** How the stylesheet frames the buttons. Defaults to `separate`. */
    variant?: PropertyIconGroupVariant | undefined;
    /** The icon buttons. */
    children?: ReactNode;
}
/**
 * A panel of labelled properties of one subject, as a `<section>` with an optional header. It can
 * open and close its sections as a group, and disable or lock every field inside.
 */
export declare function PropertyPanel({ header, labelLayout, isDisabled, isReadOnly, expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded, children, className, ...rest }: PropertyPanelProps): import("react").JSX.Element;
/** A run of rows under an optional heading. A query hides it while no row inside matches. */
export declare function PropertyGroup({ heading, children, className, id, ...rest }: PropertyGroupProps): import("react").JSX.Element;
/** A named group of related icon buttons inside one property row, such as text alignments. */
export declare function PropertyIconGroup({ variant, children, className, ...rest }: PropertyIconGroupProps): import("react").JSX.Element;
export { PropertyCard } from './property-card.js';
export type { PropertyCardProps } from './property-card.js';
export { PropertyRow } from './property-row.js';
export type { PropertyRowProps } from './property-row.js';
export { PropertySection } from './property-section.js';
export type { PropertySectionProps } from './property-section.js';
export { PropertyStrip, PropertyStripCell } from './property-strip.js';
export type { PropertyStripCellProps, PropertyStripProps } from './property-strip.js';
//# sourceMappingURL=property-panel.d.ts.map