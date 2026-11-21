import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

/** `default` is a plain line, `separator` rules both sides of its content, `border` rules beneath it. */
export type MarkerVariant = 'default' | 'separator' | 'border';

export interface MarkerProps extends ContainerProps<'div'>, BaseProps {
  /** How the marker sets itself apart. Defaults to `default`. */
  variant?: MarkerVariant | undefined;
}

export interface MarkerIconProps extends ContainerProps<'span'>, BaseProps {}

export interface MarkerContentProps extends ContainerProps<'span'>, BaseProps {}

const hooks = createHooks('marker', ['icon', 'content'], {
  root: 'marker',
  icon: 'marker-icon',
  content: 'marker-content',
});

/**
 * A line that marks a place in a conversation, such as a day, the first unread message or a
 * reply that was stopped. The caller gives it a role, such as `separator`, where it divides content.
 */
export function Marker({ variant = 'default', className, ...props }: MarkerProps) {
  return <div {...props} {...hooks.root({ className, data: { variant } })} />;
}

/** A decorative glyph before the marker's content. */
export function MarkerIcon({ className, ...props }: MarkerIconProps) {
  return <span aria-hidden="true" {...props} {...hooks.slot('icon', undefined, className)} />;
}

/** The marker's text, such as a date. */
export function MarkerContent({ className, ...props }: MarkerContentProps) {
  return <span {...props} {...hooks.slot('content', undefined, className)} />;
}
