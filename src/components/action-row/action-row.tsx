'use client';

import { type FocusEvent, type ReactNode, useRef } from 'react';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { type FocusTarget, useFocusReturn } from '../../utils/focus-target.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import type { ActionRowAction } from './action-row-action.js';
import { ActionRowActions } from './action-row-actions.js';
import { actionRowHooks as hooks } from './action-row-hooks.js';

/** An element, by ref or by a function that returns it, that focus moves to. */
export type ActionRowFocusTarget = FocusTarget;

/** `visible` keeps every action in the row; `menu` collapses those that do not fit into a menu. */
export type ActionRowOverflow = 'visible' | 'menu';

/** How lead content uses its space: truncated, or an intrinsic-width horizontal scroller. */
export type ActionRowLeadOverflow = 'truncate' | 'scroll';

export interface ActionRowProps
  extends
    RefProps<HTMLDivElement>,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>,
    KeyboardEventProps,
    BaseProps {
  /** The actions in the order to render them. */
  actions: readonly ActionRowAction[];
  /** Content at the start of the row, before the actions (a title, a filter, a status line). */
  lead?: ReactNode;
  /** Lead content uses the remaining width and scrolls horizontally with `scroll`. Defaults to truncate. */
  leadOverflow?: ActionRowLeadOverflow | undefined;
  /** Size of every action button. Defaults to `md`. */
  size?: ControlSize | undefined;
  /**
   * Draws the actions as one toolbar, named by `aria-label` or `aria-labelledby`: one tab
   * stop, with the arrow keys moving between the actions.
   */
  toolbar?: boolean | undefined;
  /** What happens to actions that do not fit. Defaults to `visible`. */
  overflow?: ActionRowOverflow | undefined;
  /** Where focus goes when the row unmounts while it holds focus. */
  finalFocus?: ActionRowFocusTarget | undefined;
}

/** Caller-ordered actions with stable identity, asynchronous pending state and optional overflow. */
export function ActionRow(props: ActionRowProps) {
  const { actions, lead } = props;
  if (actions.length === 0 && isEmptyNode(lead)) return null;
  return <ActionRowBar {...props} />;
}

/** Reveals focused lead controls without scrolling the page; oversized controls keep their trailing end visible. */
function revealLeadFocus(event: FocusEvent<HTMLDivElement>) {
  const scroller = event.currentTarget;
  if (event.target === scroller || !scroller.contains(event.target)) return;
  const box = measureInScroller(event.target, scroller);
  const left = scroller.scrollLeft;
  const right = left + scroller.clientWidth;
  let delta = 0;
  if (box.width > scroller.clientWidth) {
    const rtl = getOwnerWindow(scroller).getComputedStyle(scroller).direction === 'rtl';
    delta = rtl ? box.left - left : box.left + box.width - right;
  } else if (box.left < left) delta = box.left - left;
  else if (box.left + box.width > right) delta = box.left + box.width - right;
  if (delta !== 0) scroller.scrollLeft += delta;
}

/** The row ActionRow draws, which hands focus to `finalFocus` when it leaves holding focus. */
function ActionRowBar({
  actions,
  lead,
  size = 'md',
  toolbar = false,
  overflow = 'visible',
  leadOverflow = 'truncate',
  finalFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ref,
  ...rest
}: ActionRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useMergedRefs(ref, containerRef);
  useFocusReturn({ containerRef, finalFocus });
  return (
    <div
      {...rest}
      ref={rootRef}
      {...hooks.root({ className, props: rest, data: { size, overflow, leadOverflow } })}
    >
      {isEmptyNode(lead) ? null : (
        <div
          {...hooks.slot('lead')}
          onFocus={leadOverflow === 'scroll' ? revealLeadFocus : undefined}
        >
          {lead}
        </div>
      )}
      {actions.length > 0 ? (
        <ActionRowActions
          actions={actions}
          size={size}
          isToolbar={toolbar}
          isCollapsing={overflow === 'menu'}
          aria-label={toolbar ? ariaLabel : undefined}
          aria-labelledby={toolbar ? ariaLabelledBy : undefined}
        />
      ) : null}
    </div>
  );
}

export type { ActionRowAction } from './action-row-action.js';
