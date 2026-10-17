import { Fragment, isValidElement, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';

const SEPARATOR = '·';
const TEXT_SEPARATOR = ` ${SEPARATOR} `;

/** A value the text form of a metadata line accepts. Blank strings, booleans and nullish values are skipped. */
export type MetaLineTextItem = string | number | boolean | null | undefined;

export interface MetaLineProps {
  /** The entries, in order. Empty entries are skipped without leaving a separator. */
  items: readonly ReactNode[];
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

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

function entryKey(item: ReactNode, index: number): string {
  // Explicit keys and positions live in separate namespaces, so key="1" never meets position 1.
  return isValidElement(item) && item.key !== null ? `k:${item.key}` : `i:${index}`;
}

/** The text form of a metadata line, for tooltips, descriptions and other string-only places. */
export function formatMetaLine(items: readonly MetaLineTextItem[]): string {
  return items.filter(isTextItem).join(TEXT_SEPARATOR);
}

/** One inline line of metadata entries separated by a decorative middot. */
export function MetaLine({ items, className, id, ...rest }: MetaLineProps) {
  const entries = items.filter(hasContent);
  if (entries.length === 0) return null;
  return (
    <span {...hooks.root({ className, props: rest })} id={id}>
      {entries.map((item, index) => (
        <Fragment key={entryKey(item, index)}>
          {index > 0 ? (
            <>
              {' '}
              <span {...hooks.slot('separator')} aria-hidden="true">
                {SEPARATOR}
              </span>{' '}
            </>
          ) : null}
          {item}
        </Fragment>
      ))}
    </span>
  );
}
