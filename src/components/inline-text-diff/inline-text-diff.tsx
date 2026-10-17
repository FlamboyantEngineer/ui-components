import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { InlineTextDiffSegment } from './text-diff.js';

export interface InlineTextDiffProps {
  /** Runs in reading order. Build them with `createInlineTextDiffExcerpt(before, after)`. */
  segments: readonly InlineTextDiffSegment[];
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('inline-text-diff', ['removed', 'added']);

/** A change to a text value, inline: unchanged context, the removed run and the added run. */
export function InlineTextDiff({ segments, className, id, ...rest }: InlineTextDiffProps) {
  return (
    <span {...hooks.root({ className, props: rest })} id={id}>
      {segments.map((segment, index) => {
        if (segment.kind === 'removed') {
          return (
            <del key={index} {...hooks.slot('removed')}>
              {segment.text}
            </del>
          );
        }
        if (segment.kind === 'added') {
          return (
            <ins key={index} {...hooks.slot('added')}>
              {segment.text}
            </ins>
          );
        }
        return <Fragment key={index}>{segment.text}</Fragment>;
      })}
    </span>
  );
}
