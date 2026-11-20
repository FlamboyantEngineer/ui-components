import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

export type BubbleAlign = 'start' | 'end';
export type BubbleVariant =
  'default' | 'secondary' | 'muted' | 'tinted' | 'outline' | 'ghost' | 'destructive';
/** The bubble edge that reactions overlap. */
export type BubbleReactionsSide = 'top' | 'bottom';

export interface BubbleGroupProps extends ContainerProps<'div'>, BaseProps {}

export interface BubbleProps extends ContainerProps<'div'>, BaseProps {
  /** Which side of the message holds the bubble. Defaults to `start`. */
  align?: BubbleAlign | undefined;
  /** The bubble's surface. Defaults to `default`. */
  variant?: BubbleVariant | undefined;
}

export interface BubbleContentProps extends ContainerProps<'div'>, BaseProps {}

export interface BubbleReactionsProps extends ContainerProps<'div'>, BaseProps {
  /** The bubble edge the reactions overlap. Defaults to `bottom`. */
  side?: BubbleReactionsSide | undefined;
  /** Which end of that edge holds them. Defaults to `end`. */
  align?: BubbleAlign | undefined;
}

const hooks = createHooks('bubble', ['content', 'reactions']);
const groupHooks = createHooks('bubble-group');

/** Consecutive bubbles of one message, stacked in reading order. */
export function BubbleGroup({ className, ...props }: BubbleGroupProps) {
  return <div {...props} {...groupHooks.root({ className })} />;
}

/** A surface for a message or other content. */
export function Bubble({ align = 'start', variant = 'default', className, ...props }: BubbleProps) {
  return <div {...props} {...hooks.root({ className, data: { align, variant } })} />;
}

/** The content inside a bubble, preserving the caller's markup and controls. */
export function BubbleContent({ className, ...props }: BubbleContentProps) {
  return <div {...props} {...hooks.slot('content', undefined, className)} />;
}

/** The reactions to a bubble, such as a `ReactionBar`, overlapping one of its edges. */
export function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  ...props
}: BubbleReactionsProps) {
  return <div {...props} {...hooks.slot('reactions', { side, align }, className)} />;
}
