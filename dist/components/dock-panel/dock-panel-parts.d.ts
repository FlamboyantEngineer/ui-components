import { type ReactElement, type ReactNode, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import type { DockPanelLauncherPane, DockPanelOpenState, DockPanelPosition } from './dock-panel-launchers.js';
import { type DockPanelPaneProps } from './dock-panel-pane.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';
import type { DockPanelState } from './use-dock-panel-state.js';
/** A pane element with its launcher. */
export interface PaneEntry {
    element: ReactElement<DockPanelPaneProps>;
    launcher: DockPanelLauncherPane;
}
interface BoundsOptions {
    position: DockPanelPosition;
    minSize: number;
    maxSize: number;
    minMainSize: number | undefined;
    overlayBelow: number | undefined;
}
interface DockPanelSeparatorProps {
    label: string;
    position: DockPanelPosition;
    state: DockPanelState;
    minSize: number;
    maxSize: number;
    bodyId: string;
    onResizingChange: (isResizing: boolean) => void;
}
interface PaneFrameProps {
    entry: PaneEntry;
    /** The pane shown beside the main content, if any. */
    openKey: Key | null;
    isOverlay: boolean;
    focus: Pick<DockPanelFocus, 'paneRef'>;
}
interface DockPanelDrawerProps {
    position: DockPanelPosition;
    /** The open pane, which titles the drawer. */
    entry: PaneEntry;
    state: DockPanelOpenState;
    children: ReactNode;
}
/** The `DockPanelPane` children, each with its launcher and the id of its element. */
export declare function readPanes(children: ReactNode, baseId: string): PaneEntry[];
/** The keys of the panes whose launchers are enabled, in order. */
export declare function readEnabledKeys(panes: readonly PaneEntry[]): Key[];
/**
 * Whether the panel is an overlay, from its parent's width, and its largest size: `maxSize`,
 * lowered to leave `minMainSize` of the parent along the panel's axis, never below `minSize`.
 */
export declare function useDockPanelBounds(rootRef: RefObject<HTMLElement | null>, options: BoundsOptions): {
    isOverlay: boolean;
    largest: number;
};
/** The window splitter on the panel's inner edge, sizing the panel in pixels. */
export declare function DockPanelSeparator({ label, position, state, minSize, maxSize, bodyId, onResizingChange, }: DockPanelSeparatorProps): import("react").JSX.Element;
/** Hands a pane its element id, its visibility and the ref that lets its launcher focus it. */
export declare function PaneFrame({ entry, openKey, isOverlay, focus }: PaneFrameProps): import("react").JSX.Element;
/** The drawer that holds the open pane while the panel is an overlay, titled by the pane. */
export declare function DockPanelDrawer({ position, entry, state, children }: DockPanelDrawerProps): import("react").JSX.Element;
/**
 * Whether the selected pane shows: the expanded state while docked; while an overlay, whether the
 * drawer is open, which only a launcher or the toggle opens and which closes when the panel docks.
 */
export declare function useDockPanelOpenState(state: DockPanelState, isOverlay: boolean): DockPanelOpenState;
export {};
//# sourceMappingURL=dock-panel-parts.d.ts.map