import { Fragment, isValidElement, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { isTextItem, metaLineSeparator } from './meta-line-text.js';

/** The props of a line of node entries; `MetaLine` also takes label entries. */
export interface MetaLineBaseProps
  extends
    RefProps<HTMLSpanElement>,
    BaseProps,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  /** The entries, in order. Empty entries are skipped without leaving a separator. */
  items: readonly ReactNode[];
}

const hooks = createHooks('meta-line', ['separator']);

/** Whether an entry draws anything: not nullish, boolean, blank, or an empty array or fragment. */
export function hasContent(item: ReactNode): boolean {
  if (item === null || item === undefined || typeof item === 'boolean') return false;
  if (typeof item === 'string' || typeof item === 'number') return isTextItem(item);
  if (Array.isArray(item)) return item.some(hasContent);
  if (isValidElement<{ children?: ReactNode }>(item) && item.type === Fragment) {
    return hasContent(item.props.children);
  }
  return true;
}

function getEntryKey(item: ReactNode, index: number): string {
  // Explicit keys and positions live in separate namespaces, so key="1" never meets position 1.
  // Positions count every item, empty ones included, so an entry keeps its key when one before it
  // empties.
  return isValidElement(item) && item.key !== null ? `k:${item.key}` : `i:${index}`;
}

/**
 * One inline line of node entries separated by a decorative middot: the line `MetaLine` draws, for
 * components that `Label` itself depends on.
 */
export function MetaLineBase({ items, className, ...rest }: MetaLineBaseProps) {
  const entries = items.flatMap((item, index) =>
    hasContent(item) ? [{ item, key: getEntryKey(item, index) }] : [],
  );
  if (entries.length === 0) return null;
  return (
    // A named line is a group, since a name on a span without a role is ignored.
    <span
      {...rest}
      role={rest['aria-label'] || rest['aria-labelledby'] ? 'group' : undefined}
      {...hooks.root({ className })}
    >
      {entries.map(({ item, key }, index) => (
        <Fragment key={key}>
          {index > 0 ? (
            <>
              {' '}
              <span {...hooks.slot('separator')} aria-hidden="true">
                {metaLineSeparator}
              </span>{' '}
            </>
          ) : null}
          {item}
        </Fragment>
      ))}
    </span>
  );
}
