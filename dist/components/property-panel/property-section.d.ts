import type { ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import type { HeadingLevel } from '../section-header/section-header.js';
import { type PropertyExpansionProps } from './property-disclosure.js';
export interface PropertySectionProps extends Omit<BaseProps, 'id'>, PropertyExpansionProps {
    /** The section's key among the panel's `expandedKeys`. */
    id?: Key | undefined;
    /** Disables the trigger. */
    isDisabled?: boolean | undefined;
    /** Keeps the section mounted, with its rows' state, while removing it from layout and navigation. */
    hidden?: boolean | undefined;
    /** The section's title, in its trigger. A query matches it for every row inside. */
    title: string;
    /** Supporting text at the top of the open section. */
    description?: ReactNode;
    /** Passive text after the count, inside the trigger. */
    meta?: ReactNode;
    /** Buttons after the trigger; pressing them does not toggle the section. */
    actions?: ReactNode;
    /** The count to show, zero included. Defaults to the number of properties inside, when any. */
    count?: number | undefined;
    /** The level of the heading around the trigger. Defaults to 3. */
    headingLevel?: HeadingLevel | undefined;
    /** Remembers whether the section is open through the provider storage under this key, unless the panel opens its sections. */
    persistKey?: string | undefined;
    /** The section's groups, cards and rows. */
    children?: ReactNode;
}
/**
 * A collapsible category of a property panel (React Aria `Disclosure`): a heading whose trigger
 * shows the title, an override mark and the count, trailing actions, and the content, which stays
 * mounted while collapsed. A query opens it while it holds a match and hides it otherwise.
 */
export declare function PropertySection({ id, title, description, meta, actions, count, headingLevel, persistKey, isExpanded, defaultExpanded, onExpandedChange, hidden, children, className, ...rest }: PropertySectionProps): import("react").JSX.Element;
//# sourceMappingURL=property-section.d.ts.map