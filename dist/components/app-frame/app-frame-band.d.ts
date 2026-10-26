import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type AppFrameBandSlot } from './app-frame.js';
export interface AppFrameBandProps extends BaseProps, AriaLabellingProps {
    /** The leading part: a title, a breadcrumb or fields. */
    leading?: ReactNode;
    /** A transient status after the leading part, such as a `SaveStatus`. */
    status?: ReactNode;
    /** The tools: `ToolbarRowGroup`s in one toolbar that scrolls when the band is narrow. */
    children?: ReactNode;
    /** Names the tools toolbar. Defaults to the provider's `tools` string. */
    toolsLabel?: string | undefined;
    /** The trailing actions. */
    actions?: ReactNode;
    /** Names the actions group. Defaults to the provider's `actions` string. */
    actionsLabel?: string | undefined;
}
export interface AppFrameBandContentProps {
    /** The part of the nearest frame's band to fill. */
    slot: AppFrameBandSlot;
    /** The content, which replaces the band's own for that part while mounted. */
    children?: ReactNode;
}
/**
 * The command band of an application frame, a named group: a leading title or breadcrumb, a
 * transient status, the tools in a toolbar that scrolls instead of wrapping, and trailing actions.
 * Inside an `AppFrame`, descendants fill its parts through `AppFrameBandContent`.
 */
export declare function AppFrameBand({ leading, status, children, actions, toolsLabel, actionsLabel, className, ...rest }: AppFrameBandProps): import("react").JSX.Element;
/**
 * Fills a part of the nearest frame's band from anywhere below the frame, in place of its own.
 * Without a frame above, it renders its children in place.
 */
export declare function AppFrameBandContent({ slot, children }: AppFrameBandContentProps): import("react").JSX.Element;
//# sourceMappingURL=app-frame-band.d.ts.map