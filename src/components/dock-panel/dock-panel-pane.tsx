'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { pickDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { ActionRow, type ActionRowAction } from '../action-row/action-row.js';
import type { IconSource } from '../icon/icon.js';
import { TabPanel } from '../tabs/tabs.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';

export interface DockPanelPaneProps extends RefProps<HTMLDivElement>, Omit<BaseProps, 'id'> {
  /** Identifies the pane in the panel's selection. */
  id: Key;
  /** Names the pane, its tab and its collapsed launcher. */
  label: string;
  /** The icon of its tab and launcher: an imported icon component or rendered element. */
  icon: IconSource;
  /** A count on its tab and launcher. Zero, negative and non-finite values show none. */
  count?: number | null | undefined;
  /** Refuses the pane's tab and launcher. */
  isDisabled?: boolean | undefined;
  /** Pane-local actions in a row above the content, as an `ActionRow` draws them. */
  actions?: readonly ActionRowAction[] | undefined;
  /** Content pinned below the scrolling content, such as a composer or a status line. */
  footer?: ReactNode;
  /** The pane's content. */
  children?: ReactNode;
}

/** Whether a pane is inside an `DockPanel`, which pairs it with its tab. */
export const DockPanelPaneContext = createContext(false);

const noActions: readonly ActionRowAction[] = Object.freeze([]);

/**
 * One pane of an `DockPanel`, which draws its tab and launcher from the pane's label, icon and
 * count. The pane is the tab's panel: optional pane-local actions, the content, and an optional
 * footer. While another pane is shown it stays mounted, hidden and inert, keeping its state.
 */
export function DockPanelPane({
  ref,
  id,
  label: _label,
  icon: _icon,
  count: _count,
  isDisabled: _isDisabled,
  actions = noActions,
  footer,
  children,
  className,
  ...rest
}: DockPanelPaneProps) {
  const body = (
    <>
      {actions.length > 0 ? (
        <ActionRow className={hooks.slotClass('actions')} actions={actions} size="sm" />
      ) : null}
      {/* The content scrolls on its own between the actions and the footer, so the keyboard can
          reach and scroll it. */}
      <div {...hooks.slot('content')} tabIndex={0}>
        {children}
      </div>
      {isEmptyNode(footer) ? null : <div {...hooks.slot('footer')}>{footer}</div>}
    </>
  );
  if (!useContext(DockPanelPaneContext)) {
    return (
      <section {...pickDataAttributes(rest)} {...hooks.slot('pane', undefined, className)}>
        {body}
      </section>
    );
  }
  return (
    <TabPanel
      ref={ref}
      {...pickDataAttributes(rest)}
      id={id}
      shouldForceMount
      {...hooks.slot('pane', undefined, className)}
      render={(props, state) => <div {...props} hidden={state.isInert || undefined} />}
    >
      {body}
    </TabPanel>
  );
}
