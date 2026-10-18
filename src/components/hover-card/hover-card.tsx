import type { ReactNode } from 'react';
import {
  PreviewTrigger,
  type PopoverProps as AriaPopoverProps,
  type PreviewTriggerProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { PopoverPanel } from '../popover/popover.js';

/** The trigger and card pair: React Aria's `PreviewTrigger` delays and open state. */
export type HoverCardTriggerProps = PreviewTriggerProps;

export interface HoverCardProps
  extends
    Omit<
      AriaPopoverProps,
      'className' | 'style' | 'children' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
    >,
    BaseProps {
  /** Shows an arrow pointing at the trigger. */
  showArrow?: boolean | undefined;
  /** The card's content, which may be interactive. */
  children: ReactNode;
}

const hooks = createHooks('hover-card', ['arrow']);

/**
 * Opens the `HoverCard` among its children `delay` milliseconds after the pointer rests on the
 * trigger (a React Aria focusable such as a `Link` or `Button`) or keyboard focus reaches it, or on a
 * long press, and closes it `closeDelay` milliseconds after both leave the trigger and the card.
 */
export function HoverCardTrigger(props: HoverCardTriggerProps) {
  return <PreviewTrigger {...props} />;
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
    >
      {children}
    </PopoverPanel>
  );
}
