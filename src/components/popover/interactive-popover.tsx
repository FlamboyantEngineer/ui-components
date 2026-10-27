import { useContext, useState, type ComponentProps } from 'react';
import { OverlayTriggerStateContext, Popover } from '../../primitives/index.js';
import { useOverlayRegistration } from '../../core/overlay-presence.js';

type InteractivePopoverProps = ComponentProps<typeof Popover>;

/**
 * The floating surface of every library overlay a reader works in (menus, field popups and
 * popovers): React Aria's popover, counted in the provider's overlay presence while open. It reads
 * the open state as the popover does: its own `isOpen`, else its trigger's. A hover hint or a
 * contextual toolbar uses the plain popover, which is never counted.
 */
export function InteractivePopover(props: InteractivePopoverProps) {
  const triggerState = useContext(OverlayTriggerStateContext);
  const [own] = useState(() => ({}));
  const isControlled = props.isOpen !== undefined || !triggerState;
  const isOpen = isControlled ? (props.isOpen ?? false) : triggerState.isOpen;
  // React Aria renders a collection's content twice, once hidden: both copies share the token.
  const token = isControlled ? (props.triggerRef ?? own) : triggerState;
  useOverlayRegistration(isOpen, token);
  return <Popover {...props} />;
}
