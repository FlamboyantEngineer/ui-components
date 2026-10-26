import { type ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type DockPanelPosition } from './dock-panel-launchers.js';
export type { DockPanelPosition } from './dock-panel-launchers.js';
export interface DockPanelProps extends BaseProps {
    /** Names the panel region, its launcher toolbar, its toggle and its separator. */
    label: string;
    /** The frame edge it docks against. Defaults to `end`. */
    position?: DockPanelPosition | undefined;
    /** The panes, as `DockPanelPane` elements. */
    children?: ReactNode;
    /** The selected pane's `id` (controlled). It stays selected while the panel is collapsed. */
    selectedKey?: Key | undefined;
    /** The pane selected at first when uncontrolled. Defaults to the first enabled pane. */
    defaultSelectedKey?: Key | undefined;
    /** Receives the `id` of the pane a launcher selects. */
    onSelectionChange?: ((key: Key) => void) | undefined;
    /** Whether the selected pane shows (controlled); collapsed, only the launchers show. */
    isExpanded?: boolean | undefined;
    /** Whether the panel starts expanded when uncontrolled. Defaults to `true`. */
    defaultExpanded?: boolean | undefined;
    /** Receives each expanded state a launcher or the toggle asks for while docked. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /** The expanded panel's size along its axis, launchers included, in pixels (controlled). */
    size?: number | undefined;
    /** The size at first when uncontrolled. Defaults to 320. */
    defaultSize?: number | undefined;
    /** Receives each size from a drag or a key step on the separator. */
    onSizeChange?: ((size: number) => void) | undefined;
    /** The smallest size, in pixels. Defaults to 200. */
    minSize?: number | undefined;
    /** The largest size, in pixels. Defaults to 640. */
    maxSize?: number | undefined;
    /** Pixels of the parent the panel always leaves to the content beside it, lowering `maxSize`. */
    minMainSize?: number | undefined;
    /** Restores and saves the uncontrolled selection, expanded state and size under this key. */
    persistKey?: string | undefined;
    /** Below this parent width, in pixels, the open pane shows in a drawer over the page. */
    overlayBelow?: number | undefined;
}
/**
 * A panel docked against an edge of an application frame: a toolbar of pane launchers that stays
 * visible while the panel is collapsed, one open pane at a time beside the main content, a
 * separator that resizes it, and a drawer over the page below `overlayBelow`. Panes stay mounted
 * while hidden; the selection, expanded state and size persist under `persistKey`.
 */
export declare function DockPanel({ label, position, children, defaultExpanded, defaultSize, minSize, maxSize, minMainSize, overlayBelow, className, id, ...rest }: DockPanelProps): import("react").JSX.Element;
export { DockPanelPane } from './dock-panel-pane.js';
export type { DockPanelPaneProps } from './dock-panel-pane.js';
//# sourceMappingURL=dock-panel.d.ts.map