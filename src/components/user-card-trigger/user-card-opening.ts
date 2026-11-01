'use client';

// How a UserCardTrigger opens its card, on press or on hover, as React Aria's DialogTrigger and
// PreviewTrigger do, but through hooks: the trigger then renders the same providers and button with
// or without a card, so a card that comes or goes never remounts the button.

import { useMemo, useRef, type RefObject } from 'react';
import {
  DialogContext,
  OverlayTriggerStateContext,
  PopoverContext,
  useOverlayTrigger,
  useOverlayTriggerState,
  usePreviewTrigger,
  useTooltipTriggerState,
} from '../../primitives/index.js';
import { HOVER_CARD_CLOSE_DELAY, HOVER_CARD_DELAY } from '../../utils/overlay-defaults.js';
import { focusRestoreEvent } from '../../utils/keep-control-focus-return.js';

/** `press` opens the card on a click, Enter or Space; `hover` on hover, keyboard focus or long press. */
export type UserCardTriggerType = 'press' | 'hover';

/** What one way of opening the card gives the trigger button and its popover. */
interface Opening {
  /** ARIA and event props for the trigger button. */
  triggerProps: Record<string, unknown>;
  /** Runs on a press of the trigger. */
  onPress?: (() => void) | undefined;
  /** The overlay state the card's popover reads. */
  state: unknown;
  /** The props a dialog in the popover takes. */
  dialog: object | null;
  /** The props the popover takes. */
  popover: object;
}

interface OpeningOptions {
  isActive: boolean;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}

export interface CardOpeningOptions extends Omit<OpeningOptions, 'isActive'> {
  /** How the card opens; `undefined` without a card. */
  mode: UserCardTriggerType | undefined;
  /** The trigger button's id, which names the press card's dialog. */
  triggerId: string;
  /** Milliseconds before a hover card opens. Defaults to 600. */
  delay?: number | undefined;
  /** Milliseconds before a hover card closes. Defaults to 200. */
  closeDelay?: number | undefined;
  isDisabled?: boolean | undefined;
}

/** What the trigger renders: props for its button and the contexts around button and popover. */
export interface CardOpening {
  triggerProps: Record<string, unknown> | undefined;
  onPress: (() => void) | undefined;
  /** Provider values, the same three contexts with or without a card. */
  contexts: Array<[unknown, unknown]>;
}

function usePressOpening({ isActive, isOpen, setOpen, buttonRef }: OpeningOptions): Opening {
  const state = useOverlayTriggerState({ isOpen: isActive && isOpen, onOpenChange: setOpen });
  const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, buttonRef);
  const { onPress, ...ariaProps } = triggerProps;
  return {
    triggerProps: ariaProps,
    onPress: () => onPress?.({} as never),
    state,
    dialog: overlayProps,
    popover: { trigger: 'DialogTrigger', triggerRef: buttonRef, id: overlayProps.id },
  };
}

function useHoverOpening({
  isActive,
  isOpen,
  setOpen,
  buttonRef,
  delay = HOVER_CARD_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
  isDisabled,
}: OpeningOptions & Pick<CardOpeningOptions, 'delay' | 'closeDelay' | 'isDisabled'>): Opening {
  const state = useTooltipTriggerState({
    isOpen: isActive && isOpen,
    onOpenChange: setOpen,
    delay,
    closeDelay,
  });
  const idleRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const { triggerProps, popoverProps } = usePreviewTrigger(
    {
      isDisabled: Boolean(isDisabled) || !isActive,
      triggerRef: isActive ? buttonRef : idleRef,
      popoverRef,
    },
    state,
  );
  // Popovers expect an overlay state; the tooltip state keeps the open and close delays.
  const overlayState = useMemo(
    () => ({
      isOpen: state.isOpen,
      open: () => state.open(),
      close: () => state.close(),
      setOpen: (open: boolean) => (open ? state.open() : state.close()),
      toggle: () => (state.isOpen ? state.close() : state.open()),
    }),
    [state],
  );
  // The style only stops the touch callout of a long press, a visual style the hooks leave out.
  const { style: _style, ...ariaProps } = triggerProps;
  return {
    triggerProps: ariaProps,
    state: overlayState,
    dialog: null,
    popover: {
      trigger: 'PreviewTrigger',
      triggerRef: buttonRef,
      ref: popoverRef,
      isNonModal: true,
      shouldSkipAnimation: state.shouldSkipAnimation,
      ...popoverProps,
    },
  };
}

/**
 * Opens the card on press, as a dialog popover that takes focus, or on hover, keyboard focus or a
 * long press without moving focus. Both ways are always set up, and only the active one reaches the
 * button and the popover.
 */
export function useCardOpening({
  mode,
  triggerId,
  delay,
  closeDelay,
  isDisabled,
  ...options
}: CardOpeningOptions): CardOpening {
  const press = usePressOpening({ ...options, isActive: mode === 'press' });
  const hover = useHoverOpening({
    ...options,
    isActive: mode === 'hover',
    delay,
    closeDelay,
    isDisabled,
  });
  const opening = mode === 'press' ? press : mode === 'hover' ? hover : undefined;
  // A press card's dialog is named by its trigger, as React Aria's DialogTrigger names it.
  const labelledBy = mode === 'press' ? { 'aria-labelledby': triggerId } : null;
  return {
    triggerProps: opening?.triggerProps,
    onPress: opening?.onPress,
    contexts: [
      [OverlayTriggerStateContext, opening?.state ?? null],
      [DialogContext, opening?.dialog ? { ...opening.dialog, ...labelledBy } : null],
      [PopoverContext, opening ? { ...opening.popover, ...labelledBy } : null],
    ],
  };
}

/**
 * Moves focus to `element` the way React Aria's focus scopes restore it: through the cancelable
 * `react-aria-focus-scope-restore` event, which a preview trigger takes to refocus itself without
 * reopening its card.
 */
export function restoreFocus(element: HTMLElement): void {
  const event = new CustomEvent(focusRestoreEvent, {
    bubbles: true,
    cancelable: true,
  });
  if (element.dispatchEvent(event)) element.focus();
}
