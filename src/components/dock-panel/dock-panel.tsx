'use client';

import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { useIsHidden } from '../../primitives/index.js';
import { Tabs } from '../tabs/tabs.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import {
  DockPanelLaunchers,
  DockPanelToggle,
  type DockPanelOpenState,
  type DockPanelPosition,
} from './dock-panel-launchers.js';
import {
  DockPanelPanes,
  DockPanelSeparator,
  readEnabledKeys,
  readPanes,
  type PaneEntry,
  useDockPanelBounds,
  useDockPanelOpenState,
} from './dock-panel-parts.js';
import { DockPanelTabList, DockPanelTabs } from './dock-panel-tabs.js';
import { useDockPanelFocus, type DockPanelFocus } from './use-dock-panel-focus.js';
import { useDockPanelState, type DockPanelState } from './use-dock-panel-state.js';

export type { DockPanelPosition } from './dock-panel-launchers.js';

export interface DockPanelProps extends BaseProps {
  /** Names the panel region, its tabs, its launchers, its toggle and its separator. */
  label: string;
  /** The frame edge it sits against. Defaults to `end`. */
  position?: DockPanelPosition | undefined;
  /** The panes, as `DockPanelPane` elements. */
  children?: ReactNode;
  /** The selected pane's `id` (controlled). It stays selected while the panel is collapsed. */
  selectedKey?: Key | undefined;
  /** The pane selected at first when uncontrolled. Defaults to the first enabled pane. */
  defaultSelectedKey?: Key | undefined;
  /** Receives the `id` of each pane a tab or a launcher selects. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** Whether the selected pane shows (controlled); collapsed, only the launcher rail shows. */
  isExpanded?: boolean | undefined;
  /** Whether the panel starts expanded when uncontrolled. Defaults to `true`. */
  defaultExpanded?: boolean | undefined;
  /** Receives each expanded state the toggle, a launcher or the separator asks for. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** The expanded panel's size along its axis, in pixels (controlled). */
  size?: number | undefined;
  /** The size at first when uncontrolled. Defaults to 320. */
  defaultSize?: number | undefined;
  /** Receives the size a drag or a key step previews, at most once per animation frame. */
  onSizeChange?: ((size: number) => void) | undefined;
  /** Receives the final size once when a drag or a key step ends: the moment to save it. */
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  /** A drag abandoned without an end: drop the sizes it previewed. */
  onSizeChangeCancel?: (() => void) | undefined;
  /** The smallest size, in pixels. Defaults to 200. */
  minSize?: number | undefined;
  /** The largest size, in pixels. Defaults to 640. */
  maxSize?: number | undefined;
  /** Pixels of the parent the panel always leaves to the content beside it, lowering `maxSize`. */
  minMainSize?: number | undefined;
  /** Restores and saves the uncontrolled selection, expanded state and size under this key. */
  persistKey?: string | undefined;
  /** Below this parent width, in pixels, the selected pane shows in a drawer over the page. */
  overlayBelow?: number | undefined;
}

/**
 * A launcher activation shows its pane: collapsed, it selects the pane, expands the panel and
 * hands focus to the pane's tab; as an overlay, it opens the drawer, or closes it on the open pane.
 */
function createLaunch(state: DockPanelState, open: DockPanelOpenState, focus: DockPanelFocus) {
  return (key: Key) => {
    if (key === open.selectedKey && open.isOpen) return open.setOpen(false);
    focus.requestFocus(key);
    state.setSelectedKey(key);
    if (!open.isOpen) open.setOpen(true);
  };
}

/** A key that changes each time the panel stops showing its pane, abandoning a drag then. */
function useCollapseKey(isShown: boolean, owner: object) {
  const [collapses, setCollapses] = useState({ count: 0, wasShown: isShown });
  if (collapses.wasShown !== isShown) {
    setCollapses({ count: collapses.count + (isShown ? 0 : 1), wasShown: isShown });
  }
  return useMemo(() => ({ owner, collapses: collapses.count }), [owner, collapses.count]);
}

interface DockPanelLayoutProps {
  label: string;
  position: DockPanelPosition;
  panes: readonly PaneEntry[];
  state: DockPanelState;
  focus: DockPanelFocus;
  open: DockPanelOpenState;
  isShown: boolean;
  isOverlay: boolean;
  bodyId: string;
  resetKey: object;
  minSize: number;
  maxSize: number;
  onResizingChange: (isResizing: boolean) => void;
}

/**
 * The separator, the header (tabs, toggle and launchers) and the body. React Aria renders the
 * `Tabs` children once more, hidden, to collect the tabs; that render gets the tab list alone.
 */
function DockPanelLayout(props: DockPanelLayoutProps) {
  const { label, position, panes, state, focus, open, isShown, isOverlay, bodyId } = props;
  const launchers = panes.map((pane) => pane.launcher);
  // The tabs render from the props this render collects, refs included.
  if (useIsHidden()) return <DockPanelTabList {...{ label, focus }} panes={launchers} />;
  return (
    <>
      {isOverlay ? null : (
        <DockPanelSeparator
          {...{ label, position, state, bodyId }}
          {...{ minSize: props.minSize, maxSize: props.maxSize, resetKey: props.resetKey }}
          isCollapsed={!isShown}
          onResizingChange={props.onResizingChange}
        />
      )}
      <div
        {...hooks.slot('header', {
          orientation: isShown || position === 'bottom' ? 'horizontal' : 'vertical',
        })}
      >
        <DockPanelTabs {...{ label, focus, isShown }} panes={launchers} />
        <DockPanelToggle {...{ label, position, isOverlay, bodyId }} state={open} />
        {isShown ? null : (
          <DockPanelLaunchers
            {...{ label, position, isOverlay, bodyId, focus }}
            panes={launchers}
            state={open}
            onLaunch={createLaunch(state, open, focus)}
          />
        )}
      </div>
      <DockPanelPanes {...{ bodyId, position, panes, isShown, isOverlay, open }} />
    </>
  );
}

/**
 * A panel against an edge of an application frame. Expanded, it shows one horizontal strip of
 * tabs, one per pane, beside a collapse button, above the selected pane; collapsed, a 40 pixel rail
 * of launchers (vertical labels beside a side edge) that expand it. A separator on its inner edge
 * resizes it, and expands it when dragged while collapsed. Panes stay mounted while hidden; below
 * `overlayBelow` the selected pane opens in a drawer. The selection, expanded state and size are
 * each controlled or held by the panel, which saves them under `persistKey`.
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
  const bodyId = `${useId()}-body`;
  const rootRef = useRef<HTMLElement>(null);
  const [isResizing, setResizing] = useState(false);
  const { isOverlay, largest } = useDockPanelBounds(rootRef, {
    ...{ position, minSize, maxSize, minMainSize, overlayBelow },
  });
  const panes = readPanes(children);
  const state = useDockPanelState({
    ...rest,
    ...{ rootRef, defaultExpanded, defaultSize, minSize },
    enabledKeys: readEnabledKeys(panes),
    maxSize: largest,
  });
  const isShown = state.isExpanded && !isOverlay && state.selectedKey !== null;
  const focus = useDockPanelFocus({
    openKey: isShown ? state.selectedKey : null,
    rootRef,
  });
  const open = useDockPanelOpenState(state, isOverlay);
  const resetKey = useCollapseKey(isShown, state.sizeOwner);
  const data = { position, expanded: isShown, overlay: isOverlay, resizing: isResizing };

  return (
    <section
      {...hooks.root({ className, props: rest, data })}
      ref={rootRef}
      id={id}
      aria-label={label}
      style={isShown ? { [position === 'bottom' ? 'height' : 'width']: state.size } : undefined}
    >
      <Tabs
        {...hooks.slot('tabs')}
        selectedKey={state.selectedKey ?? undefined}
        onSelectionChange={state.setSelectedKey}
        size="sm"
      >
        <DockPanelLayout
          {...{ label, position, panes, state, focus, open, isShown, isOverlay, bodyId, resetKey }}
          {...{ minSize, maxSize: largest, onResizingChange: setResizing }}
        />
      </Tabs>
    </section>
  );
}

export { DockPanelPane } from './dock-panel-pane.js';
export type { DockPanelPaneProps } from './dock-panel-pane.js';
