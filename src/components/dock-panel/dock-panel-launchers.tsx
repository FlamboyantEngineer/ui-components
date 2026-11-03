'use client';

import {
  ChevronDoubleLeftGlyph,
  ChevronDoubleRightGlyph,
  ChevronDownGlyph,
  ChevronUpGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { useId, useRef, type JSX, type KeyboardEvent, type Ref } from 'react';
import { Button as AriaButton, Toolbar, useLocale } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import { DockPanelFades, useDockPanelFades } from './dock-panel-fades.js';
import type { DockPanelPaneProps } from './dock-panel-pane.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';

/** The frame edge a panel sits against; `start` and `end` follow the reading direction. */
export type DockPanelPosition = 'start' | 'end' | 'bottom';

/** What a pane's tab and launcher show. */
export type DockPanelLauncherPane = Pick<
  DockPanelPaneProps,
  'id' | 'label' | 'icon' | 'count' | 'countVariant' | 'launcherCountVariant' | 'isDisabled'
>;

/** What the launchers and the toggle drive: the selected pane and whether it shows. */
export interface DockPanelOpenState {
  selectedKey: Key | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

interface DockPanelLaunchersProps {
  /** The panel's label, which names the toolbar. */
  label: string;
  position: DockPanelPosition;
  panes: readonly DockPanelLauncherPane[];
  state: DockPanelOpenState;
  focus: Pick<DockPanelFocus, 'launcherRef'>;
  /** The panes open in a drawer, so a launcher opens a dialog rather than the body. */
  isOverlay: boolean;
  /** The id of the element that holds the docked panes. */
  bodyId: string;
  /** Called with the pane whose launcher was activated. */
  onLaunch: (key: Key) => void;
}

interface DockPanelLauncherProps {
  pane: DockPanelLauncherPane;
  isSelected: boolean;
  isOpen: boolean;
  isOverlay: boolean;
  bodyId: string;
  buttonRef: Ref<HTMLButtonElement>;
  onPress: () => void;
}

interface DockPanelToggleProps {
  label: string;
  position: DockPanelPosition;
  state: DockPanelOpenState;
  isOverlay: boolean;
  bodyId: string;
}

/** Counts above this show as `9+`; the launcher's description keeps the full count. */
export const dockPanelCountMax = 9;

/** The toggle points the way the panel moves: toward its edge to collapse, away to expand. */
export function resolveToggleGlyph(
  position: DockPanelPosition,
  isExpanded: boolean,
  isRtl: boolean,
): GlyphComponent {
  if (position === 'bottom') return isExpanded ? ChevronDownGlyph : ChevronUpGlyph;
  const towardEnd = (position === 'end') === isExpanded;
  return towardEnd !== isRtl ? ChevronDoubleRightGlyph : ChevronDoubleLeftGlyph;
}

/** Home and End move focus to the first and last enabled launcher; the toolbar has the arrows. */
function moveToBound(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Home' && event.key !== 'End') return;
  const launchers = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      `.${hooks.slotClass('launcher')}:not([disabled])`,
    ),
  ];
  const target = event.key === 'Home' ? launchers[0] : launchers.at(-1);
  if (!target) return;
  event.preventDefault();
  target.focus();
}

/**
 * The launcher list scrolls, and Firefox would make a scroller a tab stop of its own; the arrow
 * keys and the launchers already reach everything in it.
 */
function renderScroller(props: JSX.IntrinsicElements['div']) {
  return <div {...props} tabIndex={-1} />;
}

/** One collapsed launcher: the pane's icon, its label (vertical beside a side edge) and count. */
function DockPanelLauncher({
  pane,
  isSelected,
  isOpen,
  isOverlay,
  bodyId,
  buttonRef,
  onPress,
}: DockPanelLauncherProps) {
  const strings = useUiStrings();
  const countId = useId();
  const count = normalizeCount(pane.count) || undefined;
  return (
    <AriaButton
      {...hooks.slot('launcher', { selected: isSelected })}
      ref={buttonRef}
      isDisabled={pane.isDisabled}
      aria-expanded={isOpen}
      aria-controls={isOverlay ? undefined : bodyId}
      aria-haspopup={isOverlay ? 'dialog' : undefined}
      aria-describedby={count === undefined ? undefined : countId}
      onPress={onPress}
    >
      <Icon {...toIconProps(pane.icon)} className={hooks.slotClass('launcher-icon')} />
      <span {...hooks.slot('launcher-label')}>{pane.label}</span>
      {count === undefined ? null : (
        <>
          <Badge
            className={hooks.slotClass('count')}
            variant={pane.launcherCountVariant ?? 'solid'}
            count={count}
            max={dockPanelCountMax}
            size="sm"
            aria-hidden
          />
          <span id={countId} hidden>
            {strings.itemCount(count)}
          </span>
        </>
      )}
    </AriaButton>
  );
}

/**
 * The collapsed panel's launchers as one toolbar: the arrow keys, Home and End move focus between
 * them, and a press, Enter or Space activates one. The list scrolls natively when it is longer
 * than the rail, with a fade at each edge that hides launchers.
 */
export function DockPanelLaunchers({
  label,
  position,
  panes,
  state,
  focus,
  isOverlay,
  bodyId,
  onLaunch,
}: DockPanelLaunchersProps) {
  const strings = useUiStrings();
  const orientation = position === 'bottom' ? 'horizontal' : 'vertical';
  const listRef = useRef<HTMLDivElement>(null);
  const edges = useDockPanelFades(listRef, orientation);
  return (
    // The toolbar forwards no key handlers, so its wrapper hears Home and End as they bubble.
    <div {...hooks.slot('strip', { orientation })} onKeyDown={moveToBound}>
      <Toolbar
        aria-label={strings.panelPanes(label)}
        orientation={orientation}
        {...hooks.slot('launchers', { orientation })}
        ref={listRef}
        render={renderScroller}
      >
        {panes.map((pane) => (
          <DockPanelLauncher
            key={toKeyIdentity(pane.id)}
            pane={pane}
            isSelected={pane.id === state.selectedKey}
            isOpen={isOverlay && state.isOpen && pane.id === state.selectedKey}
            isOverlay={isOverlay}
            bodyId={bodyId}
            buttonRef={focus.launcherRef(pane.id)}
            onPress={() => onLaunch(pane.id)}
          />
        ))}
      </Toolbar>
      <DockPanelFades edges={edges.overflow} orientation={orientation} />
    </div>
  );
}

/** The button that collapses the panel and expands it again, pinned outside the scrolling list. */
export function DockPanelToggle({
  label,
  position,
  state,
  isOverlay,
  bodyId,
}: DockPanelToggleProps) {
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const { isOpen } = state;
  const toggleLabel = isOpen ? strings.collapsePanel(label) : strings.expandPanel(label);
  return (
    <Button
      className={hooks.slotClass('toggle')}
      icon={resolveToggleGlyph(position, isOpen, isRtl)}
      label={toggleLabel}
      tooltip={toggleLabel}
      size="sm"
      isDisabled={state.selectedKey === null}
      aria-expanded={isOpen}
      aria-controls={isOverlay ? undefined : bodyId}
      onPress={() => state.setOpen(!isOpen)}
    />
  );
}
