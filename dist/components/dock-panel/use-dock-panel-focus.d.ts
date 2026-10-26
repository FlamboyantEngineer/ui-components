import type { Key } from '../../core/props.js';
export interface DockPanelFocus {
    /** A ref callback for the pane with `key`. */
    paneRef: (key: Key) => (node: HTMLElement | null) => void;
    /** A ref callback for the launcher of the pane with `key`. */
    launcherRef: (key: Key) => (node: HTMLElement | null) => void;
    /** Moves focus into the pane with `key` once it opens. */
    requestFocus: (key: Key) => void;
}
/**
 * Focus handoff between launchers and panes: a pane its launcher opened takes focus, and when the
 * open pane closes while it holds focus, focus moves back to its launcher. It runs after every
 * commit, before the browser moves focus out of a pane that became hidden.
 */
export declare function useDockPanelFocus(openKey: Key | null): DockPanelFocus;
//# sourceMappingURL=use-dock-panel-focus.d.ts.map