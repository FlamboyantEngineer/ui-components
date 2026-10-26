import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
export interface NavigationRailProps extends BaseProps, AriaLabellingProps {
    /** The `NavigationRailSection`s. */
    children?: ReactNode;
    /** Content above the sections, such as a product link; the collapse button follows it. */
    header?: ReactNode;
    /** Content below the sections, such as the signed-in person. */
    footer?: ReactNode;
    /** Whether the rail shows icons only (controlled). */
    isCollapsed?: boolean | undefined;
    /** Whether the rail starts collapsed when uncontrolled. Defaults to false. */
    defaultCollapsed?: boolean | undefined;
    /** Called when the rail collapses or expands. */
    onCollapsedChange?: ((isCollapsed: boolean) => void) | undefined;
    /** Draws a handle at the inline end that resizes the expanded rail. */
    isResizable?: boolean | undefined;
    /** The expanded width in pixels (controlled). */
    width?: number | undefined;
    /** The expanded width in pixels when uncontrolled. Defaults to 240. */
    defaultWidth?: number | undefined;
    /** Called with the new width when a drag ends or after a key step. */
    onWidthChange?: ((width: number) => void) | undefined;
    /** The smallest width a resize reaches. Defaults to 180. */
    minWidth?: number | undefined;
    /** The largest width a resize reaches. Defaults to 400. */
    maxWidth?: number | undefined;
    /** Keeps the uncontrolled collapsed state and width in the provider storage under this key. */
    persistKey?: string | undefined;
}
/**
 * The side navigation of an application (a `navigation` landmark): a header with a collapse
 * button, sections of links and groups, and a footer. Collapsed, it shows icons with tooltips; it
 * can be resized, and its collapsed state and width persist through the provider storage.
 */
export declare function NavigationRail({ children, header, footer, isCollapsed: collapsedProp, defaultCollapsed, onCollapsedChange, isResizable, width: widthProp, defaultWidth, onWidthChange, minWidth, maxWidth, persistKey, className, ...rest }: NavigationRailProps): import("react").JSX.Element;
//# sourceMappingURL=navigation-rail.d.ts.map