'use client';

import { useContext, useMemo, useRef, type ReactNode } from 'react';
import {
  FocusableContext,
  OverlayTriggerStateContext,
  PopoverContext,
  usePreviewTrigger,
} from '../../primitives/index.js';
import type { OpenStateProps, OverlayPositionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { PopoverPanel } from '../popover/popover.js';
import { HOVER_CARD_CLOSE_DELAY, HOVER_CARD_DELAY } from '../../utils/overlay-defaults.js';
import { usePreviewState } from '../../utils/use-preview-state.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { usePointerEntry } from '../../utils/use-pointer-entry.js';
import { usePreviewEscape } from '../../utils/use-preview-escape.js';

/** A focusable trigger and the `HoverCard` it opens on hover and focus. */
export interface HoverCardTriggerProps extends OpenStateProps {
  /** The trigger (a `Link`, `Button` or other focusable), then its `HoverCard`. */
  children: ReactNode;
  /** Milliseconds the pointer or focus rests on the trigger before the card opens. Defaults to 600. */
  delay?: number | undefined;
  /** Milliseconds after the pointer and focus leave before the card closes. Defaults to 200. */
  closeDelay?: number | undefined;
  /** Opens nothing. */
  isDisabled?: boolean | undefined;
}

export interface HoverCardProps extends BaseProps, OverlayPositionProps {
  /** Shows an arrow pointing at the trigger. */
  showArrow?: boolean | undefined;
  /** Names the card. */
  'aria-label'?: string | undefined;
  /** Names the card by another element. */
  'aria-labelledby'?: string | undefined;
  /** The card's content, which may be interactive. */
  children: ReactNode;
}

const hooks = createHooks('hover-card', ['arrow']);

/**
 * Hands the trigger's props to the focusable only while the trigger is enabled. It renders the same
 * tree either way, so the focusable keeps its identity.
 */
function TriggerProps({ isEnabled, children }: { isEnabled: boolean; children: ReactNode }) {
  const props = useContext(FocusableContext);
  const continued = usePointerEntry(props ?? {}, !isEnabled);
  return (
    <FocusableContext value={isEnabled && props ? continued : null}>{children}</FocusableContext>
  );
}

/**
 * Opens the `HoverCard` among its children `delay` milliseconds after the pointer rests on the
 * trigger (a React Aria focusable such as a `Link` or `Button`) or keyboard focus reaches it, or on a
 * long press, and closes it `closeDelay` milliseconds after both leave the trigger and the card.
 */
export function HoverCardTrigger({
  children,
  delay = HOVER_CARD_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
  isDisabled = false,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
}: HoverCardTriggerProps) {
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  // A disabled trigger draws its card closed whatever its owner says, and closes an open card once,
  // through the ordinary close, so it stays closed when the trigger is enabled again.
  useCloseWhenLocked(isOpen, isDisabled, () => setOpen(false));
  // React Aria's PreviewTrigger, with a state of the card's own (`usePreviewState`), so a tooltip
  // inside the open card neither closes it nor is closed by it.
  const state = usePreviewState({
    isOpen: isOpen && !isDisabled,
    onOpenChange: setOpen,
    delay,
    closeDelay,
  });
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  usePreviewEscape(state, { triggerRef, popoverRef });
  const { triggerProps, popoverProps } = usePreviewTrigger(
    { isDisabled, triggerRef, popoverRef },
    state,
  );
  // Popovers expect an overlay state; the preview state keeps the open and close delays.
  const overlayState = useMemo(
    () => ({
      isOpen: state.isOpen,
      open: () => state.open(),
      close: () => state.close(),
      setOpen: (open: boolean) => (open ? state.open() : state.close()),
      toggle: () => (state.isOpen ? state.close() : state.open()),
      point: null,
      setPoint: () => {},
    }),
    [state],
  );
  const popover = {
    trigger: 'PreviewTrigger',
    triggerRef,
    ref: popoverRef,
    isNonModal: true,
    shouldSkipAnimation: state.shouldSkipAnimation,
    ...popoverProps,
  };
  return (
    <OverlayTriggerStateContext value={overlayState}>
      <PopoverContext value={popover}>
        <FocusableContext value={{ ...triggerProps, ref: triggerRef }}>
          <TriggerProps isEnabled={!isDisabled}>{children}</TriggerProps>
        </FocusableContext>
      </PopoverContext>
    </OverlayTriggerStateContext>
  );
}

/**
 * A card of extra content about its trigger, shown on hover and focus without taking focus. It
 * shares the popover's positioning and arrow; Tab from the trigger moves into it and Escape closes it.
 */
export function HoverCard({ showArrow = false, className, children, ...rest }: HoverCardProps) {
  return (
    <PopoverPanel
      {...rest}
      {...hooks.root({ className, props: rest })}
      arrowClassName={showArrow ? hooks.slotClass('arrow') : undefined}
      isHint
    >
      {children}
    </PopoverPanel>
  );
}
