'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import {
  DockPanelLaunchers,
  type DockPanelOpenState,
  type DockPanelPosition,
} from './dock-panel-launchers.js';
import {
  DockPanelPanes,
  DockPanelSeparator,
  readEnabledKeys,
  readPanes,
  useDockPanelBounds,
  useDockPanelOpenState,
} from './dock-panel-parts.js';
import { useDockPanelFocus, type DockPanelFocus } from './use-dock-panel-focus.js';
import { useDockPanelState, type DockPanelState } from './use-dock-panel-state.js';

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

/** A launcher press opens its pane (focus follows it in) or, on the open pane, closes it. */
function createLaunch(state: DockPanelState, open: DockPanelOpenState, focus: DockPanelFocus) {
  return (key: Key) => {
    if (key === open.selectedKey && open.isOpen) return open.setOpen(false);
    focus.requestFocus(key);
    if (key !== open.selectedKey) state.setSelectedKey(key);
    if (!open.isOpen) open.setOpen(true);
  };
}

/**
 * A panel docked against an edge of an application frame: a toolbar of pane launchers that stays
 * visible while the panel is collapsed, one open pane at a time beside the main content, a
 * separator that resizes it, and a drawer over the page below `overlayBelow`. Panes stay mounted
 * while hidden and when they move between the body and the drawer; the selection, expanded state
 * and size persist under `persistKey`.
 */
export function DockPanel({
  label,
  position = 'end',
  children,
  defaultExpanded = true,
  defaultSize = 320,
  minSize = 200,
  maxSize = 640,
  minMainSize,
  overlayBelow,
  className,
  id,
  ...rest
}: DockPanelProps) {
  const baseId = useId();
  const bodyId = `${baseId}-body`;
  const rootRef = useRef<HTMLElement>(null);
  const [isResizing, setResizing] = useState(false);
  const bounds = { position, minSize, maxSize, minMainSize, overlayBelow };
  const { isOverlay, largest } = useDockPanelBounds(rootRef, bounds);
  const panes = readPanes(children, baseId);
  const state = useDockPanelState({
    ...rest,
    enabledKeys: readEnabledKeys(panes),
    defaultExpanded,
    defaultSize,
    minSize,
    maxSize: largest,
  });
  const openKey = state.isExpanded && !isOverlay ? state.selectedKey : null;
  const focus = useDockPanelFocus(openKey, rootRef);
  const open = useDockPanelOpenState(state, isOverlay);
  const isDocked = openKey !== null;
  // A drag ends with its separator if the panel collapses mid-drag.
  const data = {
    position,
    expanded: isDocked,
    overlay: isOverlay,
    resizing: isDocked && isResizing,
  };
  const axis = position === 'bottom' ? 'height' : 'width';

  return (
    <section
      {...hooks.root({ className, props: rest, data })}
      ref={rootRef}
      id={id}
      aria-label={label}
      style={openKey === null ? undefined : { [axis]: state.size }}
    >
      <DockPanelLaunchers
        {...{ label, position, isOverlay, bodyId }}
        state={open}
        focus={focus}
        panes={panes.map((pane) => pane.launcher)}
        onLaunch={createLaunch(state, open, focus)}
      />
      {openKey === null ? null : (
        <DockPanelSeparator
          {...{ label, position, state, minSize, bodyId }}
          maxSize={largest}
          onResizingChange={setResizing}
        />
      )}
      <DockPanelPanes {...{ bodyId, position, panes, openKey, isOverlay, open, focus }} />
    </section>
  );
}

export { DockPanelPane } from './dock-panel-pane.js';
export type { DockPanelPaneProps } from './dock-panel-pane.js';
