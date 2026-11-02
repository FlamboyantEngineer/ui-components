'use client';

import { useLayoutEffect, useRef, type Ref, type RefObject } from 'react';
import { clamp } from '../../utils/clamp.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { Tab, TabList } from '../tabs/tabs.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import { DockPanelFades, useDockPanelFades } from './dock-panel-fades.js';
import { dockPanelCountMax, type DockPanelLauncherPane } from './dock-panel-launchers.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';

interface DockPanelTabsProps {
  /** The panel's label, which names the tab list. */
  label: string;
  panes: readonly DockPanelLauncherPane[];
  focus: Pick<DockPanelFocus, 'tabRef'>;
  /** The panel shows its tabs: it is expanded and docked. */
  isShown: boolean;
}

/** The width of the fade over each scrolling edge, which a revealed tab stays clear of. */
const fadeSize = 26;

/**
 * Scrolls the list the least that shows the selected tab clear of the fades, if any part of it is
 * under one or outside the list. A tab wider than the room left aligns its start.
 */
function revealSelectedTab(list: HTMLElement) {
  const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
  const range = list.scrollWidth - list.clientWidth;
  if (!tab || range <= 0) return;
  const box = measureInScroller(tab, list);
  const position = list.scrollLeft;
  const start = position + fadeSize;
  const end = position + list.clientWidth - fadeSize;
  const rtl = getOwnerWindow(list).getComputedStyle(list).direction === 'rtl';
  const right = box.left + box.width;
  const alignLeft = box.left - fadeSize;
  const alignRight = right - list.clientWidth + fadeSize;
  let target = position;
  if (box.width > end - start) target = rtl ? alignRight : alignLeft;
  else if (box.left < start) target = alignLeft;
  else if (right > end) target = alignRight;
  const [min, max] = rtl ? [-range, 0] : [0, range];
  const next = clamp(target, min, max);
  if (next !== position) list.scrollLeft = next;
}

/**
 * Shows the selected tab clear of the fades whenever the list appears (the panel expands) and
 * whenever it resizes. Otherwise the reader's own scroll position stays, and the tab list itself
 * centres each newly selected tab.
 */
function useRevealSelectedTab(listRef: RefObject<HTMLElement | null>, isShown: boolean) {
  useLayoutEffect(() => {
    if (isShown && listRef.current) revealSelectedTab(listRef.current);
  }, [isShown, listRef]);
  useResizeObserver(
    () => (isShown && listRef.current ? [listRef.current] : []),
    () => {
      if (listRef.current) revealSelectedTab(listRef.current);
    },
  );
}

/**
 * The expanded panel's tabs: one horizontal strip of the panes' icons, labels and counts, which
 * scrolls freely (the wheel too) with a fade at each edge that hides tabs. It stays mounted while
 * the panel is collapsed, hidden, so the tabs keep pairing with their panes.
 */
export function DockPanelTabs({ label, panes, focus, isShown }: DockPanelTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const edges = useDockPanelFades(listRef, 'horizontal', { wheel: false });
  useRevealSelectedTab(listRef, isShown);
  return (
    <div {...hooks.slot('strip', { orientation: 'horizontal' })} hidden={!isShown}>
      <DockPanelTabList {...{ label, panes, focus }} listRef={listRef} />
      <DockPanelFades edges={edges.overflow} orientation="horizontal" />
    </div>
  );
}

/**
 * The tab list alone, which is all React Aria's hidden render of the panel needs to collect the
 * tabs: the rest of the panel renders once, outside it.
 */
export function DockPanelTabList({
  label,
  panes,
  focus,
  listRef,
}: Omit<DockPanelTabsProps, 'isShown'> & { listRef?: Ref<HTMLDivElement> | undefined }) {
  return (
    <TabList ref={listRef} aria-label={label} overflow="scroll" {...hooks.slot('tab-list')}>
      {panes.map((pane) => (
        <Tab
          key={toKeyIdentity(pane.id)}
          id={pane.id}
          ref={focus.tabRef(pane.id)}
          icon={pane.icon}
          count={pane.count}
          countMax={dockPanelCountMax}
          isDisabled={pane.isDisabled}
          {...hooks.slot('tab')}
        >
          {pane.label}
        </Tab>
      ))}
    </TabList>
  );
}
