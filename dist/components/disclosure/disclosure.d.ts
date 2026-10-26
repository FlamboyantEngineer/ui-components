import { type ReactNode, type Ref } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { type HeadingLevel } from '../section-header/section-header.js';
import { type DisclosureIndicatorPosition } from './disclosure-hooks.js';
export type { DisclosureIndicatorPosition } from './disclosure-hooks.js';
/** The states a disclosure passes to `render` with its root's props. */
export interface DisclosureRenderState {
    isExpanded: boolean;
    /** Keyboard focus is inside the disclosure. */
    isFocusVisibleWithin: boolean;
    isDisabled: boolean;
}
/** The state a disclosure group passes to `render` with its root's props. */
export interface DisclosureGroupRenderState {
    isDisabled: boolean;
}
export interface DisclosureProps extends Omit<BaseProps, 'id'> {
    /** The disclosure's key among a `DisclosureGroup`'s expanded keys; it stays off the element. */
    id?: Key | undefined;
    /** Whether the panel shows (controlled). */
    isExpanded?: boolean | undefined;
    /** Whether the panel shows at first when uncontrolled. */
    defaultExpanded?: boolean | undefined;
    /** Receives each requested expanded state, also while controlled. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /** Disables the trigger; the panel keeps its state. */
    isDisabled?: boolean | undefined;
    /**
     * The title the disclosure draws in its trigger; `children` then fill its panel. Without it,
     * `children` compose the parts: a `DisclosureTitle` (or a `DisclosureHeader` around one) and a
     * `DisclosurePanel`.
     */
    title?: ReactNode;
    /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
    headingLevel?: HeadingLevel | undefined;
    /** Where the trigger's indicator glyph sits. Defaults to `start`. */
    indicatorPosition?: DisclosureIndicatorPosition | undefined;
    /** The panel's content with `title`, else the parts. */
    children?: ReactNode;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Replaces the root `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', DisclosureRenderState> | undefined;
}
export interface DisclosureGroupProps extends BaseProps {
    /** The `id`s of the open disclosures (controlled). */
    expandedKeys?: Iterable<Key> | undefined;
    /** The `id`s of the disclosures open at first when uncontrolled. */
    defaultExpandedKeys?: Iterable<Key> | undefined;
    /** Receives the requested set of open `id`s after each toggle. */
    onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
    /** Lets several disclosures stay open; by default opening one closes the other. */
    allowsMultipleExpanded?: boolean | undefined;
    /** Disables every disclosure in the group. */
    isDisabled?: boolean | undefined;
    /** The group's disclosures, each with an `id` naming it in the expanded keys. */
    children?: ReactNode;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Replaces the root `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', DisclosureGroupRenderState> | undefined;
}
/**
 * A collapsible section: a heading whose trigger toggles a panel. With
 * `title` it draws its own title and panel; without it, the caller composes the parts. Inside a
 * `DisclosureGroup` its `id` is its key among the group's expanded keys.
 */
export declare function Disclosure({ id, title, headingLevel, indicatorPosition, children, className, ...rest }: DisclosureProps): import("react").JSX.Element;
/**
 * Disclosures that expand together, one at a time as an accordion
 * unless `allowsMultipleExpanded`. Arrow keys, Home and End move focus between their triggers.
 */
export declare function DisclosureGroup({ expandedKeys, defaultExpandedKeys, onExpandedChange, className, children, ...rest }: DisclosureGroupProps): import("react").JSX.Element;
export { DisclosureHeader, DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';
export type { DisclosureHeaderProps, DisclosurePanelProps, DisclosurePanelRenderState, DisclosurePanelRole, DisclosureTitleProps, } from './disclosure-parts.js';
//# sourceMappingURL=disclosure.d.ts.map