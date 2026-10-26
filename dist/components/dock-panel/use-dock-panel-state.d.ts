import type { Key } from '../../core/props.js';
/** The panel state a `persistKey` saves: each value the caller does not control. */
export interface DockPanelStoredState {
    selectedKey?: Key | undefined;
    isExpanded?: boolean | undefined;
    size?: number | undefined;
}
export interface DockPanelStateOptions {
    /** The panes that can be selected, in order. */
    enabledKeys: readonly Key[];
    selectedKey?: Key | undefined;
    defaultSelectedKey?: Key | undefined;
    onSelectionChange?: ((key: Key) => void) | undefined;
    isExpanded?: boolean | undefined;
    defaultExpanded: boolean;
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    size?: number | undefined;
    defaultSize: number;
    onSizeChange?: ((size: number) => void) | undefined;
    /** The size bounds, in pixels. */
    minSize: number;
    maxSize: number;
    persistKey?: string | undefined;
}
export interface DockPanelState {
    /** The selected pane, kept while the panel is collapsed; `null` without an enabled pane. */
    selectedKey: Key | null;
    setSelectedKey: (key: Key) => void;
    isExpanded: boolean;
    setExpanded: (isExpanded: boolean) => void;
    /** The expanded size, within the bounds. */
    size: number;
    /** A size during a drag or a key step. */
    changeSize: (size: number) => void;
    /** The size after a drag or a key step, which a persisted panel saves. */
    commitSize: (size: number) => void;
}
/**
 * The selected pane, the expanded state and the size of an dock panel, each controlled or held by
 * the panel, which restores and saves the values it holds under `persistKey`.
 */
export declare function useDockPanelState(options: DockPanelStateOptions): DockPanelState;
//# sourceMappingURL=use-dock-panel-state.d.ts.map