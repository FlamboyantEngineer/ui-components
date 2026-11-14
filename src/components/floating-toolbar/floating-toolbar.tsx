'use client';

import {
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  useState,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Placement, RefProps } from '../../core/props.js';
import { Popover, useLocale } from '../../primitives/index.js';
import { DEFAULT_OVERLAY_GAP } from '../../utils/overlay-defaults.js';
import { ToolbarRow } from '../layout/layout.js';
import { useLayerZIndex } from '../portal/portal.js';

export interface FloatingToolbarProps extends RefProps<HTMLElement>, BaseProps, AriaLabellingProps {
  /** Shows the toolbar. */
  isOpen: boolean;
  /** The element the toolbar floats over, such as an editor's content. */
  triggerRef: RefObject<Element | null>;
  /**
   * The box the toolbar floats over, in the viewport, such as a selected text range; defaults to
   * the trigger's own box. Null keeps the toolbar where it is.
   */
  getTargetRect?: (() => DOMRect | null) | undefined;
  /** Changes whenever the target box moves, which places the toolbar again. */
  targetKey?: string | undefined;
  /** Where the toolbar goes against the target. Defaults to `top start`. */
  placement?: Placement | undefined;
  /** Called on Escape inside the toolbar, for the caller to hide it and return focus. */
  onDismiss?: (() => void) | undefined;
  /** The toolbar row, the element its controls are in. */
  rowRef?: Ref<HTMLDivElement> | undefined;
  /** A class for the toolbar row, beside its own hook, for a component built on this one. */
  rowClassName?: string | undefined;
  /** Focus entering the toolbar's controls. */
  onFocus?: FocusEventHandler<HTMLDivElement> | undefined;
  /** Focus leaving one of the toolbar's controls, to another or elsewhere. */
  onBlur?: FocusEventHandler<HTMLDivElement> | undefined;
  /** The toolbar's controls. */
  children?: ReactNode;
}

const hooks = createHooks('floating-toolbar', ['row']);

// The physical spelling of a logical placement, for the reading direction.
function physicalOf(placement: Placement, direction: 'ltr' | 'rtl'): Placement {
  const [side, align] = placement.split(' ');
  if (align !== 'start' && align !== 'end') return placement;
  const isLeft = (align === 'start') === (direction === 'ltr');
  return `${side ?? 'top'} ${isLeft ? 'left' : 'right'}` as Placement;
}

/**
 * React Aria places an open popover again only when its placement changes, so a moved target
 * alternates between the logical and the physical spelling of the same placement.
 */
function useFollowedPlacement(key: string, placement: Placement): Placement {
  const { direction } = useLocale();
  const [spelling, setSpelling] = useState({ key, isPhysical: false });
  if (spelling.key !== key) setSpelling({ key, isPhysical: !spelling.isPhysical });
  return spelling.isPhysical ? physicalOf(placement, direction) : placement;
}

/**
 * A toolbar floating over a box, such as selected text: a non-modal popover holding a toolbar row,
 * which never takes focus as it opens or moves, so typing and selecting carry on beneath it. The
 * caller moves focus into it, and Escape inside it calls `onDismiss`.
 */
export function FloatingToolbar({
  ref,
  className,
  isOpen,
  triggerRef,
  getTargetRect,
  targetKey = '',
  placement = 'top start',
  onDismiss,
  rowRef,
  rowClassName,
  onFocus,
  onBlur,
  children,
  ...rest
}: FloatingToolbarProps) {
  const zIndex = useLayerZIndex('dropdown');
  const followed = useFollowedPlacement(targetKey, placement);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !onDismiss) return;
    event.preventDefault();
    event.stopPropagation();
    onDismiss();
  };
  const { 'aria-label': label, 'aria-labelledby': labelledBy, ...props } = rest;
  return (
    <Popover
      ref={ref}
      {...hooks.root({ className, props })}
      isOpen={isOpen}
      isNonModal
      triggerRef={triggerRef}
      {...(getTargetRect ? { getTargetRect } : {})}
      placement={followed}
      offset={DEFAULT_OVERLAY_GAP}
      style={{ zIndex }}
    >
      <ToolbarRow
        ref={rowRef}
        className={mergeClassNames(hooks.slotClass('row'), rowClassName)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={label}
        aria-labelledby={labelledBy}
        justify="start"
        space="xs"
        onKeyDown={onKeyDown}
      >
        {children}
      </ToolbarRow>
    </Popover>
  );
}
