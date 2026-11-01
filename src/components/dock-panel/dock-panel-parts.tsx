'use client';

import { containsComposed, getComposedActiveElement, isFocused } from '../../utils/focus-target.js';
import {
  Children,
  isValidElement,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { Drawer } from '../drawer/drawer.js';
import { ResizeHandle } from '../split-view/split-view.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import type {
  DockPanelLauncherPane,
  DockPanelOpenState,
  DockPanelPosition,
} from './dock-panel-launchers.js';
import { DockPanelPane, DockPanelPaneContext, type DockPanelPaneProps } from './dock-panel-pane.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';
import type { DockPanelState } from './use-dock-panel-state.js';
import { isHTMLElement } from '../../utils/is-element.js';

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

/** The element every pane renders into, and the places that can hold it. */
interface PaneHost {
  element: HTMLElement;
  /** Holds the panes while no drawer does. */
  bodyRef: (node: HTMLElement | null) => void;
  /** Holds the panes while the drawer is open. */
  drawerRef: (node: HTMLElement | null) => void;
}

interface PaneFrameProps {
  entry: PaneEntry;
  /** The pane that shows, docked or in the drawer, if any. */
  shownKey: Key | null;
  isOverlay: boolean;
  focus: Pick<DockPanelFocus, 'paneRef'>;
}

interface DockPanelPanesProps {
  bodyId: string;
  position: DockPanelPosition;
  panes: readonly PaneEntry[];
  /** The pane shown beside the main content, if any. */
  openKey: Key | null;
  isOverlay: boolean;
  open: DockPanelOpenState;
  focus: Pick<DockPanelFocus, 'paneRef'>;
}

interface DockPanelDrawerProps {
  position: DockPanelPosition;
  /** The open pane, which titles the drawer. */
  entry: PaneEntry;
  state: DockPanelOpenState;
  /** Receives the element that holds the panes in the drawer. */
  holderRef: ((node: HTMLElement | null) => void) | undefined;
}

const subscribeToNothing = () => () => undefined;

/** Arrow keys step 5 % of this many pixels (10), Shift+arrows 1 % (2). */
const keyboardExtent = 200;

/** The `DockPanelPane` children, each with its launcher and the id of its element. */
export function readPanes(children: ReactNode, baseId: string): PaneEntry[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<DockPanelPaneProps> =>
        isValidElement(child) && child.type === DockPanelPane,
    )
    .map((element, index) => ({
      element,
      launcher: { ...element.props, elementId: `${baseId}-pane-${index}` },
    }));
}

/** The keys of the panes whose launchers are enabled, in order. */
export function readEnabledKeys(panes: readonly PaneEntry[]): Key[] {
  return panes.filter((pane) => !pane.launcher.isDisabled).map((pane) => pane.launcher.id);
}

/**
 * Whether the panel is an overlay, from its parent's width, and its largest size: `maxSize`,
 * lowered to leave `minMainSize` of the parent along the panel's axis, never below `minSize`.
 */
export function useDockPanelBounds(rootRef: RefObject<HTMLElement | null>, options: BoundsOptions) {
  const { position, minSize, maxSize, minMainSize, overlayBelow } = options;
  const parent = useElementSize(rootRef, { parent: true, box: 'client' });
  if (parent === null) return { isOverlay: false, largest: Math.max(minSize, maxSize) };
  const extent = position === 'bottom' ? parent.height : parent.width;
  const room = minMainSize === undefined ? maxSize : Math.min(maxSize, extent - minMainSize);
  return {
    isOverlay: overlayBelow !== undefined && parent.width < overlayBelow,
    largest: Math.max(minSize, room),
  };
}

/** The window splitter on the panel's inner edge, sizing the panel in pixels. */
export function DockPanelSeparator({
  label,
  position,
  state,
  minSize,
  maxSize,
  bodyId,
  onResizingChange,
}: DockPanelSeparatorProps) {
  const strings = useUiStrings();
  return (
    <ResizeHandle
      className={hooks.slotClass('handle')}
      orientation={position === 'bottom' ? 'horizontal' : 'vertical'}
      sizedPane={position === 'start' ? 'before' : 'after'}
      value={state.size}
      minValue={minSize}
      maxValue={maxSize}
      extent={keyboardExtent}
      aria-label={strings.resizePanel(label)}
      aria-controls={bodyId}
      onChange={state.changeSize}
      onChangeEnd={state.commitSize}
      onChangeCancel={state.cancelSize}
      onResizingChange={onResizingChange}
      resetKey={state.sizeOwner}
    />
  );
}

// The pane host is made once, in render, before any holder exists; appending it to a holder in
// another window's document adopts it there.
function createPaneHost(): PaneHost {
  // eslint-disable-next-line no-restricted-globals
  const element = document.createElement('div');
  element.className = hooks.slotClass('panes');
  const holders: { body: HTMLElement | null; drawer: HTMLElement | null } = {
    body: null,
    drawer: null,
  };
  const place = () => {
    const holder = holders.drawer ?? holders.body;
    if (!holder || element.parentNode === holder) return;
    // Moving an element blurs what it holds; focus stays put where the element lands shown. The
    // holder may still be hidden while React commits, so focus that does not take is retried once
    // the commit has shown it.
    const active = getComposedActiveElement(element);
    holder.append(element);
    if (!isHTMLElement(active) || !containsComposed(element, active)) return;
    active.focus({ preventScroll: true });
    if (!isFocused(active)) queueMicrotask(() => active.focus({ preventScroll: true }));
  };
  return {
    element,
    bodyRef(node) {
      holders.body = node;
      place();
    },
    drawerRef(node) {
      holders.drawer = node;
      place();
    },
  };
}

/**
 * One element for every pane, which the body holds and the open drawer borrows: the panes render
 * into it through a portal, so moving it keeps them mounted. It is `null` on the server and while
 * hydrating, when the panes render in place in the body.
 */
function usePaneHost(): PaneHost | null {
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  // eslint-disable-next-line no-restricted-globals -- see createPaneHost
  const [host] = useState(() => (typeof document === 'undefined' ? null : createPaneHost()));
  return isHydrated ? host : null;
}

/** Hands a pane its element id, its visibility and the ref that lets its launcher focus it. */
function PaneFrame({ entry, shownKey, isOverlay, focus }: PaneFrameProps) {
  const { id, elementId } = entry.launcher;
  const isHidden = id !== shownKey;
  const paneRef = focus.paneRef(id);
  const value = useMemo(
    () => ({ elementId, isHidden, isOverlay, paneRef }),
    [elementId, isHidden, isOverlay, paneRef],
  );
  return <DockPanelPaneContext value={value}>{entry.element}</DockPanelPaneContext>;
}

/**
 * The body and, while an overlay, the drawer: the panes render once, into the pane host the body
 * holds and the open drawer borrows. Docked, the open pane shows; in the drawer, the selected one.
 */
export function DockPanelPanes({
  bodyId,
  position,
  panes,
  openKey,
  isOverlay,
  open,
  focus,
}: DockPanelPanesProps) {
  const host = usePaneHost();
  const shownKey = isOverlay ? open.selectedKey : openKey;
  const selected = panes.find((pane) => pane.launcher.id === open.selectedKey);
  const frames = panes.map((entry) => (
    <PaneFrame key={entry.element.key} {...{ entry, shownKey, isOverlay, focus }} />
  ));
  return (
    <>
      <div {...hooks.slot('body')} ref={host?.bodyRef} id={bodyId} hidden={openKey === null}>
        {host ? createPortal(frames, host.element) : frames}
      </div>
      {isOverlay && selected ? (
        <DockPanelDrawer
          position={position}
          entry={selected}
          state={open}
          holderRef={host?.drawerRef}
        />
      ) : null}
    </>
  );
}

/** The drawer that holds the panes while the panel is an overlay, titled by the open pane. */
function DockPanelDrawer({ position, entry, state, holderRef }: DockPanelDrawerProps) {
  return (
    <Drawer
      className={hooks.slotClass('drawer')}
      position={position}
      title={entry.element.props.title ?? entry.launcher.label}
      showCloseButton
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
    >
      <div {...hooks.slot('drawer-body')} ref={holderRef} />
    </Drawer>
  );
}

/**
 * Whether the selected pane shows: the expanded state while docked; while an overlay, whether the
 * drawer is open, which only a launcher or the toggle opens and which closes when the panel docks.
 */
export function useDockPanelOpenState(
  state: DockPanelState,
  isOverlay: boolean,
): DockPanelOpenState {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  if (!isOverlay && isDrawerOpen) setDrawerOpen(false);
  return isOverlay
    ? { selectedKey: state.selectedKey, isOpen: isDrawerOpen, setOpen: setDrawerOpen }
    : { selectedKey: state.selectedKey, isOpen: state.isExpanded, setOpen: state.setExpanded };
}
