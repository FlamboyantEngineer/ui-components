import { useContext, useState, type RefObject } from 'react';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { useOverlayRegistration } from '../../core/overlay-presence.js';

interface PopoverPresenceProps {
  /** The popover's own open state, when it has one; otherwise its trigger's state decides. */
  isOpen?: boolean | undefined;
  /** The element a controlled popover is placed against, shared by every copy of it. */
  triggerRef?: RefObject<Element | null> | undefined;
}

/**
 * Counts the popover rendered next to it as an open interactive overlay: every library overlay a
 * reader works in (menus, field popups and popovers) renders one just before its popover, with the
 * popover's `isOpen` and `triggerRef`. It reads the open state as the popover does: its own
 * `isOpen`, else its trigger's. React Aria renders a collection's content twice, once hidden: both
 * copies share one registration. A hover hint or a contextual toolbar renders none.
 */
export function PopoverPresence({ isOpen, triggerRef }: PopoverPresenceProps) {
  const triggerState = useContext(OverlayTriggerStateContext);
  const [own] = useState(() => ({}));
  const isControlled = isOpen !== undefined || !triggerState;
  useOverlayRegistration(
    isControlled ? (isOpen ?? false) : triggerState.isOpen,
    isControlled ? (triggerRef ?? own) : triggerState,
  );
  return null;
}
