'use client';

import { useRef, type ReactNode } from 'react';
import {
  MenuContext,
  OverlayTriggerStateContext,
  PopoverContext,
  PressResponder,
  Provider,
  RootMenuTriggerStateContext,
  useIsHidden,
  useMenuTrigger,
  useMenuTriggerState,
  type PressEvent,
} from '../../primitives/index.js';
import type { OpenStateProps } from '../../core/events.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { MenuTriggerPress } from './menu-trigger-press.js';

export interface MenuTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `MenuPopover`. */
  children: ReactNode;
  /**
   * Keeps the trigger mounted as it is but opens nothing: the trigger gets no popup props and an
   * open menu closes, for a menu whose entries have not arrived or have all gone.
   */
  isDisabled?: boolean | undefined;
}

/**
 * Opens its `MenuPopover` from its trigger (React Aria `MenuTrigger`): on press, Enter or Space,
 * and on Arrow Down or Arrow Up, which focus the first or last item. It renders React Aria's
 * trigger tree itself so that `isDisabled` changes only the trigger's press props, and the trigger
 * keeps its element, focus and state while its menu comes and goes.
 */
export function MenuTrigger({ isDisabled = false, children, ...openState }: MenuTriggerProps) {
  const { isOpen, onOpenChange } = openState;
  // A disabled trigger draws a controlled menu closed whatever its owner says.
  const state = useMenuTriggerState({
    ...openState,
    isOpen: isOpen === undefined ? undefined : isOpen && !isDisabled,
  });
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger({ type: 'menu', isDisabled }, state, ref);
  const handlePressStart = (event: PressEvent) => {
    // React Aria opens mouse menus on press start and toggles only touch menus.
    if (state.isOpen && event.pointerType !== 'touch' && event.pointerType !== 'keyboard') {
      state.close();
    } else {
      menuTriggerProps.onPressStart?.(event);
    }
  };
  // An open menu whose trigger turns disabled closes once, through the ordinary close, so it stays
  // closed when the trigger is enabled again.
  useCloseWhenLocked(isOpen ?? state.isOpen, isDisabled, () => {
    if (isOpen === undefined) state.close();
    else onOpenChange?.(false);
  });
  // A collection's hidden pass renders its items' content only to read the collection.
  if (useIsHidden()) return null;
  const popover = {
    trigger: 'MenuTrigger',
    triggerRef: ref,
    scrollRef,
    placement: 'bottom start' as const,
    'aria-labelledby': menuProps['aria-labelledby'],
  };
  return (
    <Provider
      values={[
        [MenuContext, { ...menuProps, ref: scrollRef }],
        [OverlayTriggerStateContext, state],
        [RootMenuTriggerStateContext, state],
        [PopoverContext, popover],
      ]}
    >
      <PressResponder
        {...(isDisabled ? {} : menuTriggerProps)}
        onPressStart={isDisabled ? undefined : handlePressStart}
        ref={ref}
        isPressed={!isDisabled && state.isOpen}
      >
        <MenuTriggerPress>{children}</MenuTriggerPress>
      </PressResponder>
    </Provider>
  );
}
