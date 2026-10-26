import { type ReactNode, type Ref } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type ActionRowAction } from '../action-row/action-row.js';
import type { IconSource } from '../icon/icon.js';
export interface DockPanelPaneProps extends Omit<BaseProps, 'id'> {
    /** Identifies the pane in the panel's selection. */
    id: Key;
    /** Names the pane, its launcher and the launcher's tooltip. */
    label: string;
    /** The launcher's icon: a built-in glyph name or any icon node. */
    icon: IconSource;
    /** A count on the launcher, such as unread entries. Zero, negative and non-finite values show none. */
    count?: number | null | undefined;
    /** Refuses the pane's launcher. */
    isDisabled?: boolean | undefined;
    /** A heading in the pane's header row. */
    title?: ReactNode;
    /** The header row's actions, as an `ActionRow` draws them. */
    actions?: readonly ActionRowAction[] | undefined;
    /** The pane's content. */
    children?: ReactNode;
}
/** What an `DockPanel` tells each of its panes. */
export interface DockPanelPaneContextValue {
    /** The pane element's id, which its launcher controls. */
    elementId: string;
    /** The pane is not the open one: it stays mounted, hidden and inert. */
    isHidden: boolean;
    /** The pane fills the panel's drawer, whose title already names it. */
    isOverlay: boolean;
    /** Receives the pane element, which takes focus when its launcher opens it. */
    paneRef: Ref<HTMLElement>;
}
export declare const DockPanelPaneContext: import("react").Context<DockPanelPaneContextValue | null>;
/**
 * One pane of an `DockPanel`, which draws its launcher from the pane's label, icon and count. The
 * pane is a labelled region with an optional header row (a title and `ActionRow` actions) above
 * its content; while another pane is open it stays mounted, hidden and inert, keeping its state.
 */
export declare function DockPanelPane({ id: _id, label, icon: _icon, count: _count, isDisabled: _isDisabled, title, actions, children, className, ...rest }: DockPanelPaneProps): import("react").JSX.Element;
//# sourceMappingURL=dock-panel-pane.d.ts.map