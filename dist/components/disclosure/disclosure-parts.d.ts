import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
export interface DisclosureHeaderProps extends BaseProps {
    /** A `DisclosureTitle` and the controls beside it, which do not toggle the disclosure. */
    children?: ReactNode;
}
export interface DisclosureTitleProps extends BaseProps {
    /** The title, inside the trigger. */
    children?: ReactNode;
}
/** The panel's role: `group` (the default), or `region` for a landmark-worthy section. */
export type DisclosurePanelRole = 'group' | 'region';
/** The state a disclosure panel passes to `render` with its element's props. */
export interface DisclosurePanelRenderState {
    /** Keyboard focus is inside the panel. */
    isFocusVisibleWithin: boolean;
}
export interface DisclosurePanelProps extends BaseProps {
    /** The panel's role. Defaults to `group`. */
    role?: DisclosurePanelRole | undefined;
    /** The content that the disclosure shows and hides. */
    children?: ReactNode;
    /** Replaces the panel's `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', DisclosurePanelRenderState> | undefined;
}
/** The row that holds a `DisclosureTitle` and controls beside it, such as actions. */
export declare function DisclosureHeader({ className, children, ...rest }: DisclosureHeaderProps): import("react").JSX.Element;
/**
 * The disclosure's heading, at its level, holding the trigger: a button that toggles the panel and
 * shows the indicator glyph before or after the title.
 */
export declare function DisclosureTitle({ className, children, ...rest }: DisclosureTitleProps): import("react").JSX.Element;
/**
 * The content a disclosure shows and hides. It stays mounted while
 * collapsed, and headings inside take the levels below the disclosure's title.
 */
export declare function DisclosurePanel({ className, children, ...rest }: DisclosurePanelProps): import("react").JSX.Element;
//# sourceMappingURL=disclosure-parts.d.ts.map