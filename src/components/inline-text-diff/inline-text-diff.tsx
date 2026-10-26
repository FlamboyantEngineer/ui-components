import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import type { InlineTextDiffSegment } from './text-diff.js';

export { createInlineWordDiff } from './text-diff.js';
export type { InlineTextDiffSegment } from './text-diff.js';

export interface InlineTextDiffProps extends BaseProps {
  /** Runs in reading order, from `createInlineTextDiffExcerpt` or `createInlineWordDiff`. */
  segments: readonly InlineTextDiffSegment[];
}

const hooks = createHooks('inline-text-diff', ['removed', 'added']);

/** A change to a text value, inline: unchanged context, the removed run and the added run. */
export function InlineTextDiff({ segments, className, ...rest }: InlineTextDiffProps) {
  return (
    <span {...rest} {...hooks.root({ className })}>
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
