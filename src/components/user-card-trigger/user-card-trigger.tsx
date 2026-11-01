'use client';

import { createContext, useContext, useId, useRef, type ReactNode } from 'react';
import { Button as AriaButton, Provider } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, PressEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { HoverCard, type HoverCardTriggerProps } from '../hover-card/hover-card.js';
import { PopoverPanel } from '../popover/popover.js';
import { containsFocus } from '../../utils/focus-target.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { restoreFocus, useCardOpening, type UserCardTriggerType } from './user-card-opening.js';

export type { UserCardTriggerType } from './user-card-opening.js';

export interface UserCardTriggerProps
  extends
    OpenStateProps,
    Pick<HoverCardTriggerProps, 'delay' | 'closeDelay'>,
    PressEventProps,
    BaseProps {
  /** Opens nothing and refuses presses. */
  isDisabled?: boolean | undefined;
  /**
   * The card to open, usually a `UserCard`. Without one the trigger is a plain button; a card that
   * arrives or leaves later keeps the same button, and its focus.
   */
  card?: ReactNode;
  /** What the trigger shows: an avatar, a name or a user identity row. */
  children: ReactNode;
  /**
   * `press` (the default) opens the card on a click, Enter or Space. `hover` opens it `delay`
   * milliseconds after hover or keyboard focus, or on a long press, without moving focus, and closes
   * it `closeDelay` milliseconds after the pointer and focus leave; pressing then runs `onPress` only.
   */
  trigger?: UserCardTriggerType | undefined;
}

const hooks = createHooks('user-card-trigger', ['popover']);

/** The `UserCardTrigger` that opened a card, which its actions dismiss. */
export interface UserCardOwner {
  /** The card opened on hover, where it must not take focus as a dialog would. */
  isPreview: boolean;
  /** Closes the card from the pressed action, returning focus to the trigger if the action held it. */
  dismiss: (action: Element) => void;
}

/**
 * Set by a `UserCardTrigger` around its own card only; a card rendered anywhere else, an ancestor's
 * overlay included, has no owner to close.
 */
const UserCardOwnerContext = createContext<UserCardOwner | null>(null);

/** The `UserCardTrigger` that opened the card being rendered, or `null` outside one's card. */
export function useUserCardOwner(): UserCardOwner | null {
  return useContext(UserCardOwnerContext);
}

/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the card's actions close it, returning focus to the trigger. The button
 * stays the same element while `card` comes and goes.
 */
export function UserCardTrigger({
  card,
  children,
  trigger = 'press',
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  delay,
  closeDelay,
  className,
  onPress,
  isDisabled,
  ...rest
}: UserCardTriggerProps) {
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  // A card open when the trigger turns disabled closes once and stays closed when it is enabled.
  useCloseWhenLocked(isOpen, Boolean(isDisabled), () => setOpen(false));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasCard = card !== undefined && card !== null && card !== false;
  const isPreview = trigger === 'hover';
  const fallbackId = useId();
  const triggerId = rest.id ?? fallbackId;
  const opening = useCardOpening({
    mode: hasCard ? trigger : undefined,
    isOpen: isOpen && !isDisabled,
    setOpen,
    buttonRef,
    triggerId,
    delay,
    closeDelay,
    isDisabled,
  });
  const owner: UserCardOwner = {
    isPreview,
    dismiss: (action) => {
      const hadFocus = containsFocus(action);
      setOpen(false);
      // A press card's dialog returns focus as it closes; a hover card only returns it to where it
      // was when the card opened, which after a hover is the page.
      if (isPreview && hadFocus && buttonRef.current) restoreFocus(buttonRef.current);
    },
  };
  const popover = hasCard ? (
    <UserCardOwnerContext value={owner}>{card}</UserCardOwnerContext>
  ) : null;
  return (
    // The same providers and button render with or without a card, so the button keeps its focus.
    <Provider values={opening.contexts as never}>
      <AriaButton
        {...rest}
        {...opening.triggerProps}
        id={triggerId}
        ref={buttonRef}
        isDisabled={isDisabled}
        onPress={(event) => {
          onPress?.(event);
          opening.onPress?.();
        }}
        // The slot marks a button that opens a card.
        {...(hasCard ? hooks.root({ className }) : { className })}
      >
        {children}
      </AriaButton>
      {popover && isPreview ? (
        <HoverCard className={hooks.slotClass('popover')}>{popover}</HoverCard>
      ) : null}
      {popover && !isPreview ? (
        <PopoverPanel className={hooks.slotClass('popover')}>{popover}</PopoverPanel>
      ) : null}
    </Provider>
  );
}
