import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { resolveContainment, type LayoutContainmentProps } from './layout.js';

export type ContentsProps = ContainerProps<'div'> & BaseProps;

export type InlineContentsProps = ContainerProps<'span'> & BaseProps;

export interface EmbeddedFrameProps
  extends Omit<ContainerProps<'iframe'>, 'title'>, BaseProps, LayoutContainmentProps {
  /** The frame's accessible name. */
  title: string;
}

const contentsHooks = createHooks('contents');
const inlineContentsHooks = createHooks('inline-contents');
const embeddedFrameHooks = createHooks('embedded-frame');

/**
 * A wrapper that adds no box of its own (`display: contents` in the stylesheet), for event capture,
 * portals and adapters. `hidden` removes its children from layout without unmounting them.
 */
export function Contents({ children, className, ...rest }: ContentsProps) {
  return (
    <div {...rest} {...contentsHooks.root({ className })}>
      {children}
    </div>
  );
}

/** The inline counterpart of `Contents`, valid inside phrasing content. */
export function InlineContents({ children, className, ...rest }: InlineContentsProps) {
  return (
    <span {...rest} {...inlineContentsHooks.root({ className })}>
      {children}
    </span>
  );
}

/**
 * An `<iframe>` that fills its host like `View`. It is fully sandboxed unless the caller grants
 * permissions through `sandbox`.
 */
export function EmbeddedFrame({
  className,
  sandbox,
  grow,
  fill,
  clip,
  ...rest
}: EmbeddedFrameProps) {
  const data = resolveContainment({ grow, fill, clip }, { grow: true, fill: true, clip: true });
  return (
    <iframe {...rest} sandbox={sandbox ?? ''} {...embeddedFrameHooks.root({ className, data })} />
  );
}
