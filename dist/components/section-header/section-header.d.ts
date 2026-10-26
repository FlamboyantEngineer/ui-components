import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';
import { type HeadingLevel } from './heading-level.js';
export { HeadingLevelContext, useHeadingLevel } from './heading-level.js';
export type { HeadingLevel } from './heading-level.js';
export interface SectionHeaderProps extends BaseProps {
    /** The heading text. */
    title: ReactNode;
    /** Supporting text under the title. Omitted when it renders nothing. */
    description?: ReactNode;
    /** Trailing actions or status, after the text. */
    actions?: ReactNode;
    /** The heading element's level. Defaults to one below the enclosing section's, else 3. */
    headingLevel?: HeadingLevel | undefined;
}
export interface SectionProps extends SectionHeaderProps, LayoutContainmentProps {
    /** The section's content, after its header. */
    children?: ReactNode;
    /** Gap between the header and the content. Defaults to `2xl`. */
    space?: LayoutSpace | undefined;
    /** The title toggles the content. Expanded by default. */
    collapsible?: boolean | undefined;
    /** Whether a collapsible section's content shows (controlled). */
    isExpanded?: boolean | undefined;
    /** Whether a collapsible section's content shows at first. Defaults to `true`. */
    defaultExpanded?: boolean | undefined;
    /** Receives each requested expanded state of a collapsible section. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}
/**
 * A section title with optional supporting text and trailing actions, in a `<header>` that is not
 * a landmark: outside sectioning content a `<header>` would be the page's banner.
 */
export declare function SectionHeader({ title, description, actions, headingLevel, className, ...rest }: SectionHeaderProps): import("react").JSX.Element;
/**
 * A `<section>` region named by its header's title, followed by its content in a `Stack`. The
 * description and actions stay out of the region's name. Sections nested in its content take the
 * next heading level, and a `collapsible` section's title toggles its content.
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=section-header.d.ts.map