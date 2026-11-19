import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

export type BubbleAlign = 'start' | 'end';
export type BubbleVariant = 'default' | 'muted' | 'outline' | 'ghost';

export interface BubbleProps extends ContainerProps<'div'>, BaseProps {
  /** Which side of the message holds the bubble. Defaults to `start`. */
  align?: BubbleAlign | undefined;
  /** The bubble's surface. Defaults to `default`. */
  variant?: BubbleVariant | undefined;
}

export interface BubbleContentProps extends ContainerProps<'div'>, BaseProps {}

const hooks = createHooks('bubble', ['content']);

/** A surface for a message or other content. */
export function Bubble({ align = 'start', variant = 'default', className, ...props }: BubbleProps) {
  return <div {...props} {...hooks.root({ className, data: { align, variant } })} />;
}

/** The content inside a bubble, preserving the caller's markup and controls. */
export function BubbleContent({ className, ...props }: BubbleContentProps) {
  return <div {...props} {...hooks.slot('content', undefined, className)} />;
}
