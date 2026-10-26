import { createContext, useContext, type ReactNode, type Ref } from 'react';
import { pickDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { ActionRow, type ActionRowAction } from '../action-row/action-row.js';
import type { IconSource } from '../icon/icon.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';

export interface DockPanelPaneProps extends Omit<BaseProps, 'id'> {
  /** Identifies the pane in the panel's selection. */
  id: Key;
  /** Names the pane, its launcher and the launcher's tooltip. */
  label: string;
  /** The launcher's icon: a built-in glyph name or any icon node. */
  icon: IconSource;
  /** A count on the launcher, such as unread entries. Zero, negative and non-finite values show none. */
  count?: number | null | undefined;
  /** Refuses the pane's launcher. */
  isDisabled?: boolean | undefined;
  /** A heading in the pane's header row. */
  title?: ReactNode;
  /** The header row's actions, as an `ActionRow` draws them. */
  actions?: readonly ActionRowAction[] | undefined;
  /** The pane's content. */
  children?: ReactNode;
}

/** What an `DockPanel` tells each of its panes. */
export interface DockPanelPaneContextValue {
  /** The pane element's id, which its launcher controls. */
  elementId: string;
  /** The pane is not the open one: it stays mounted, hidden and inert. */
  isHidden: boolean;
  /** The pane fills the panel's drawer, whose title already names it. */
  isOverlay: boolean;
  /** Receives the pane element, which takes focus when its launcher opens it. */
  paneRef: Ref<HTMLElement>;
}

export const DockPanelPaneContext = createContext<DockPanelPaneContextValue | null>(null);

const noActions: readonly ActionRowAction[] = Object.freeze([]);

/**
 * One pane of an `DockPanel`, which draws its launcher from the pane's label, icon and count. The
 * pane is a labelled region with an optional header row (a title and `ActionRow` actions) above
 * its content; while another pane is open it stays mounted, hidden and inert, keeping its state.
 */
export function DockPanelPane({
  id: _id,
  label,
  icon: _icon,
  count: _count,
  isDisabled: _isDisabled,
  title,
  actions = noActions,
  children,
  className,
  ...rest
}: DockPanelPaneProps) {
  const context = useContext(DockPanelPaneContext);
  const level = useHeadingLevel(undefined);
  const Heading = `h${level}` as const;
  const isHidden = context?.isHidden ?? false;
  const heading =
    context?.isOverlay || isEmptyNode(title) ? null : (
      <Heading {...hooks.slot('title')}>{title}</Heading>
    );
  return (
    <section
      {...pickDataAttributes(rest)}
      {...hooks.slot('pane', undefined, className)}
      ref={context?.paneRef}
      id={context?.elementId}
      aria-label={label}
      tabIndex={context ? -1 : undefined}
      hidden={isHidden}
      inert={isHidden}
    >
      <ActionRow className={hooks.slotClass('header')} lead={heading} actions={actions} size="sm" />
      {/* The content scrolls on its own below the header, so the keyboard can reach and scroll it. */}
      <div {...hooks.slot('content')} tabIndex={0}>
        {children}
      </div>
    </section>
  );
}
