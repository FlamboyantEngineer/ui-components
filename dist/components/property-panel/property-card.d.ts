import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type PropertyExpansionProps } from './property-disclosure.js';
export interface PropertyCardProps extends Omit<BaseProps, 'id'>, PropertyExpansionProps {
    /** The card's name, in its trigger. A query matches it for every row inside. */
    name: string;
    /** A short summary of the values inside, after the name. */
    summary?: ReactNode;
    /** Whether a value inside overrides an inherited one; the rows inside also report it. */
    isOverridden?: boolean | undefined;
    /** Buttons after the trigger; pressing them does not toggle the card. */
    actions?: ReactNode;
    /** The card's rows. */
    children?: ReactNode;
}
/**
 * A collapsible group of related properties inside a section (React Aria `Disclosure`), counted as
 * one property of its section. A query keeps it while its name or a row inside matches, and opens it.
 */
export declare function PropertyCard({ name, summary, isOverridden, actions, isExpanded, defaultExpanded, onExpandedChange, children, className, ...rest }: PropertyCardProps): import("react").JSX.Element;
//# sourceMappingURL=property-card.d.ts.map