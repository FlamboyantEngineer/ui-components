import type { Key } from '../../core/props.js';
import type { DockPanelPaneProps } from './dock-panel-pane.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';
/** The frame edge a panel docks against; `start` and `end` follow the reading direction. */
export type DockPanelPosition = 'start' | 'end' | 'bottom';
/** A launcher's pane: what its button shows, and the pane element it controls. */
export interface DockPanelLauncherPane extends Pick<DockPanelPaneProps, 'id' | 'label' | 'icon' | 'count' | 'isDisabled'> {
    elementId: string;
}
/** What the launchers drive: the selected pane and whether it shows, docked or in the drawer. */
export interface DockPanelOpenState {
    selectedKey: Key | null;
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
}
export interface DockPanelLaunchersProps {
    /** The panel's label, which names the toolbar and the toggle. */
    label: string;
    position: DockPanelPosition;
    panes: readonly DockPanelLauncherPane[];
    /** The selected pane and whether it shows, which the toggle flips. */
    state: DockPanelOpenState;
    /** Receives each launcher's button by its pane. */
    focus: Pick<DockPanelFocus, 'launcherRef'>;
    /** The panes open in a drawer, so a launcher opens a dialog rather than a region. */
    isOverlay: boolean;
    /** The id of the element that holds the docked panes, which the toggle controls. */
    bodyId: string;
    /** Called with the pane whose launcher was pressed. */
    onLaunch: (key: Key) => void;
}
/**
 * The panel's launchers as one toolbar (arrow keys move between them), with the toggle that
 * collapses and expands the panel last.
 */
export declare function DockPanelLaunchers({ label, position, panes, state, focus, isOverlay, bodyId, onLaunch, }: DockPanelLaunchersProps): import("react").JSX.Element;
//# sourceMappingURL=dock-panel-launchers.d.ts.map