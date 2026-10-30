'use client';

import {
  ChevronDoubleLeftGlyph,
  ChevronDoubleRightGlyph,
  ChevronDownGlyph,
  ChevronUpGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { useId, type Ref } from 'react';
import { Toolbar, useLocale } from '../../primitives/index.js';
import type { Key, Placement } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import type { DockPanelPaneProps } from './dock-panel-pane.js';
import type { DockPanelFocus } from './use-dock-panel-focus.js';

/** The frame edge a panel docks against; `start` and `end` follow the reading direction. */
export type DockPanelPosition = 'start' | 'end' | 'bottom';

/** A launcher's pane: what its button shows, and the pane element it controls. */
export interface DockPanelLauncherPane extends Pick<
  DockPanelPaneProps,
  'id' | 'label' | 'icon' | 'count' | 'isDisabled'
> {
  elementId: string;
}

/** What the launchers drive: the selected pane and whether it shows, docked or in the drawer. */
export interface DockPanelOpenState {
  selectedKey: Key | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

interface DockPanelLaunchersProps {
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

interface DockPanelLauncherProps {
  pane: DockPanelLauncherPane;
  isSelected: boolean;
  isOpen: boolean;
  isOverlay: boolean;
  placement: Placement;
  buttonRef: Ref<HTMLButtonElement | HTMLAnchorElement>;
  onPress: () => void;
}

/** Tooltips open toward the main content, away from the panel's edge. */
const tooltipPlacements: Readonly<Record<DockPanelPosition, Placement>> = {
  start: 'end',
  end: 'start',
  bottom: 'top',
};

/** The toggle points the way the panel moves: toward its edge to collapse, away to expand. */
function resolveToggleGlyph(position: DockPanelPosition, isExpanded: boolean, isRtl: boolean) {
  if (position === 'bottom') return isExpanded ? ChevronDownGlyph : ChevronUpGlyph;
  const towardEnd = (position === 'end') === isExpanded;
  const glyph: GlyphComponent =
    towardEnd !== isRtl ? ChevronDoubleRightGlyph : ChevronDoubleLeftGlyph;
  return glyph;
}

/** One pane's launcher: an icon button named and tooltipped by the pane's label, and its count. */
function DockPanelLauncher({
  pane,
  isSelected,
  isOpen,
  isOverlay,
  placement,
  buttonRef,
  onPress,
}: DockPanelLauncherProps) {
  const strings = useUiStrings();
  const countId = useId();
  const count = normalizeCount(pane.count) || undefined;
  return (
    <span {...hooks.slot('launcher', { selected: isSelected })}>
      <Tooltip content={pane.label} relationship="label" placement={placement}>
        <Button
          ref={buttonRef}
          icon={pane.icon}
          label={pane.label}
          size="sm"
          isDisabled={pane.isDisabled}
          aria-expanded={isOpen}
          aria-controls={isOverlay ? undefined : pane.elementId}
          aria-haspopup={isOverlay ? 'dialog' : undefined}
          aria-describedby={count === undefined ? undefined : countId}
          onPress={onPress}
        />
      </Tooltip>
      {count === undefined ? null : (
        <>
          <Badge
            className={hooks.slotClass('count')}
            count={count}
            max={99}
            size="sm"
            placement="overlay"
            aria-hidden
          />
          <span id={countId} hidden>
            {strings.itemCount(count)}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * The panel's launchers as one toolbar (arrow keys move between them), with the toggle that
 * collapses and expands the panel last.
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
  const { selectedKey, isOpen } = state;
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const toggleLabel = isOpen ? strings.collapsePanel(label) : strings.expandPanel(label);
  return (
    <Toolbar
      aria-label={strings.panelPanes(label)}
      orientation={position === 'bottom' ? 'horizontal' : 'vertical'}
      className={hooks.slotClass('launchers')}
    >
      {panes.map((pane) => (
        <DockPanelLauncher
          key={toKeyIdentity(pane.id)}
          pane={pane}
          isSelected={pane.id === selectedKey}
          isOpen={isOpen && pane.id === selectedKey}
          isOverlay={isOverlay}
          placement={tooltipPlacements[position]}
          buttonRef={focus.launcherRef(pane.id)}
          onPress={() => onLaunch(pane.id)}
        />
      ))}
      <Button
        className={hooks.slotClass('toggle')}
        icon={resolveToggleGlyph(position, isOpen, isRtl)}
        label={toggleLabel}
        tooltip={toggleLabel}
        size="sm"
        isDisabled={selectedKey === null}
        aria-expanded={isOpen}
        aria-controls={isOverlay ? undefined : bodyId}
        onPress={() => state.setOpen(!isOpen)}
      />
    </Toolbar>
  );
}
