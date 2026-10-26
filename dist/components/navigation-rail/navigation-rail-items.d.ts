import { type JSX, type ReactNode } from 'react';
import type { PressEvent } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
export interface NavigationRailSectionProps extends BaseProps {
    /** The section's title, which names its list. Without it the list is unnamed. */
    title?: string | undefined;
    /** The section's `NavigationRailItem`s and `NavigationRailGroup`s. */
    children?: ReactNode;
}
export interface NavigationRailItemProps extends BaseProps {
    /** The item's text, its tooltip while the rail is collapsed. */
    label: string;
    /** The destination, reached through the provider's link renderer. */
    href?: string | undefined;
    /** Called when the item is pressed, as for an item without `href`. */
    onPress?: ((event: PressEvent) => void) | undefined;
    /** The icon before the label, the item's tile while the rail is collapsed. */
    icon?: IconSource;
    /** A positive count after the label, such as unread entries; capped at 99+. */
    count?: number | undefined;
    /** What the count is read as, such as `4 unread`. Defaults to the count. */
    countLabel?: string | undefined;
    /** The item is the current page: `aria-current="page"`. */
    isCurrent?: boolean | undefined;
}
export interface NavigationRailGroupProps extends BaseProps {
    /** The group's text, on the button that opens it. */
    label: string;
    /** The icon before the label, the group's tile while the rail is collapsed. */
    icon?: IconSource;
    /** The group's `NavigationRailItem`s and nested groups. */
    children?: ReactNode;
    /** Whether the group is open (controlled). */
    isExpanded?: boolean | undefined;
    /** Whether the group starts open when uncontrolled. */
    defaultExpanded?: boolean | undefined;
    /** Called when the group opens or closes. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}
/** A titled list of a rail's items and groups. Its title shows only while the rail is expanded. */
export declare function NavigationRailSection({ title, children, className, ...rest }: NavigationRailSectionProps): JSX.Element;
/**
 * A link in the rail: an icon, a label and a count, `aria-current="page"` when it is the current
 * page. While the rail is collapsed it shows its icon, with the label in a tooltip.
 */
export declare function NavigationRailItem({ label, href, onPress, icon, count, countLabel, isCurrent, className, ...rest }: NavigationRailItemProps): JSX.Element;
/**
 * A group of items that opens and closes under a button. It publishes `data-current` while it
 * holds the current page, and opens when the current page moves inside it. In a collapsed rail
 * its items stay closed, and pressing it expands the rail and opens it.
 */
export declare function NavigationRailGroup({ label, icon, children, isExpanded: expandedProp, defaultExpanded, onExpandedChange, className, ...rest }: NavigationRailGroupProps): JSX.Element;
//# sourceMappingURL=navigation-rail-items.d.ts.map