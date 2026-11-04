import { Fragment, isValidElement, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';

/** A value the text form of a metadata line accepts. Blank strings, booleans and nullish values are skipped. */
export type MetaLineTextItem = string | number | boolean | null | undefined;

export interface MetaLineProps
  extends
    RefProps<HTMLSpanElement>,
    BaseProps,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  /** The entries, in order. Empty entries are skipped without leaving a separator. */
  items: readonly ReactNode[];
}

const separator = '·';
const textSeparator = ` ${separator} `;

const hooks = createHooks('meta-line', ['separator']);

function isTextItem(item: unknown): item is string | number {
  return typeof item === 'number' || (typeof item === 'string' && item.trim().length > 0);
}

function hasContent(item: ReactNode): boolean {
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

/** The text form of a metadata line, for tooltips, descriptions and other string-only places. */
export function formatMetaLine(items: readonly MetaLineTextItem[]): string {
  return items.filter(isTextItem).join(textSeparator);
}

/** One inline line of metadata entries separated by a decorative middot. */
export function MetaLine({ items, className, ...rest }: MetaLineProps) {
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
                {separator}
              </span>{' '}
            </>
          ) : null}
          {item}
        </Fragment>
      ))}
    </span>
  );
}
