import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
import { type ViewActionHandlers } from './view-actions.js';
/** One saved view of a collection. */
export interface ViewSwitcherView {
    /** Identifies the view. */
    id: Key;
    /** The view's name. */
    label: string;
    /** A glyph name or icon node before the name, such as the view's layout. Decorative. */
    icon?: IconSource;
}
/** `tabs` lists the views as tabs; `menu` puts them in a menu, for many views or little room. */
export type ViewSwitcherVariant = 'tabs' | 'menu';
export interface ViewSwitcherProps extends BaseProps, AriaLabellingProps, ViewActionHandlers {
    /** The saved views, in order. */
    views: readonly ViewSwitcherView[];
    /** The selected view's `id`, controlled. */
    selectedKey?: Key | undefined;
    /** The view selected at first, uncontrolled. Defaults to the default view, else the first. */
    defaultSelectedKey?: Key | undefined;
    /** Called with the view the reader selects. */
    onSelectionChange?: ((key: Key) => void) | undefined;
    /** The selected view's current settings differ from its saved ones. */
    isDirty?: boolean | undefined;
    /** The view that opens first, which is marked. */
    defaultViewKey?: Key | null | undefined;
    /** How the views show. Defaults to `tabs`. */
    variant?: ViewSwitcherVariant | undefined;
    /** The selected view's content: the tab panel of `tabs`, after the menu of `menu`. */
    children?: ReactNode;
}
/**
 * Names and switches the saved views of a collection, as tabs or a menu. The selected view shows a
 * modified mark while its settings differ from its saved ones; its actions save, save as a new
 * view, reset, rename, make it the default view or delete it, each tab also offering its own.
 */
export declare function ViewSwitcher(props: ViewSwitcherProps): import("react").JSX.Element;
//# sourceMappingURL=view-switcher.d.ts.map