'use client';

import type { ReactNode } from 'react';
import { LoadingBoundaryProvider } from '../../core/loading-boundary.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { normalizeCount } from '../../utils/count.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** `text` is a line of text, `rectangle` a block such as media, `circle` a round avatar. */
export type SkeletonShape = 'text' | 'rectangle' | 'circle';

export interface SkeletonProps extends BaseProps {
  /** The placeholder's shape. Defaults to `rectangle`. */
  shape?: SkeletonShape | undefined;
  /** Whether the content is loading. Defaults to `true`. */
  isLoading?: boolean | undefined;
  /** Whether the stylesheet may animate the placeholder while loading. Defaults to `true`. */
  animated?: boolean | undefined;
  /**
   * The real content. While loading it keeps its layout under the placeholder but is inert and
   * hidden from assistive technology; once loaded it shows. Without it, the skeleton is a block.
   */
  children?: ReactNode;
}

export interface SkeletonTextProps extends BaseProps, Pick<SkeletonProps, 'animated'> {
  /** The number of placeholder lines, at least one. Defaults to 3. */
  lines?: number | undefined;
}

const hooks = createHooks('skeleton', ['content']);
const textHooks = createHooks('skeleton-text', ['line']);

/** A skeleton has no focusable root to hold focus on; an overlay's own restoration applies. */
function keepFocus() {}

/**
 * A placeholder for content that is loading. Without children it is a decorative block of `shape`;
 * around real content it is the loading region, drawing the placeholder in the content's place
 * until `isLoading` turns false, without remounting the content.
 */
export function Skeleton({
  shape = 'rectangle',
  isLoading = true,
  animated = true,
  children,
  className,
  ...rest
}: SkeletonProps) {
  const data = { shape, loading: isLoading, animated: isLoading && animated };
  if (isEmptyNode(children)) {
    return <div {...rest} {...hooks.root({ className, data })} aria-hidden="true" />;
  }
  return (
    <div {...rest} {...hooks.root({ className, data })} aria-busy={isLoading || undefined}>
      <div {...hooks.slot('content')} inert={isLoading} aria-hidden={isLoading || undefined}>
        <LoadingBoundaryProvider isSuspended={isLoading} holdFocus={keepFocus}>
          {children}
        </LoadingBoundaryProvider>
      </div>
    </div>
  );
}

/** A decorative placeholder for a paragraph: `lines` text skeletons. */
export function SkeletonText({ lines = 3, animated, className, ...rest }: SkeletonTextProps) {
  const count = Math.max(1, normalizeCount(lines) ?? 3);
  return (
    <div {...rest} {...textHooks.root({ className })} aria-hidden="true">
      {Array.from({ length: count }, (_, line) => (
        <Skeleton
          key={line}
          shape="text"
          animated={animated}
          className={textHooks.slotClass('line')}
        />
      ))}
    </div>
  );
}
