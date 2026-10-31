'use client';

import { useEffect, useRef, type ReactNode } from 'react';
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
} from '../../primitives/index.js';
import type { OpenStateProps } from '../../core/events.js';
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
  const state = useMenuTriggerState(openState);
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger({ type: 'menu', isDisabled }, state, ref);
  useEffect(() => {
    if (isDisabled && state.isOpen) state.close();
  }, [isDisabled, state]);
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
        ref={ref}
        isPressed={!isDisabled && state.isOpen}
      >
        <MenuTriggerPress>{children}</MenuTriggerPress>
      </PressResponder>
    </Provider>
  );
}
