import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import type { InlineTextDiffSegment } from './text-diff.js';

export type { InlineTextDiffSegment } from './text-diff.js';
export { createInlineWordDiff } from './text-diff.js';

/** `changes` marks the removed and added runs; `final` shows the resulting text alone. */
export type InlineTextDiffView = 'changes' | 'final';

export interface InlineTextDiffProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** Runs in reading order, from `createInlineTextDiffExcerpt` or `createInlineWordDiff`. */
  segments: readonly InlineTextDiffSegment[];
  /** What the diff shows. Defaults to `changes`. */
  view?: InlineTextDiffView | undefined;
  /**
   * The whole text after the change, shown by the `final` view. Without it the view joins the
   * unchanged and added segments, which is the whole text only when they are uncut, as
   * `createInlineWordDiff`'s are; an excerpt cuts its context, so pass the full value with one.
   */
  finalText?: string | undefined;
}

const hooks = createHooks('inline-text-diff', ['removed', 'added']);

/** The text after the change, from the segments: the unchanged and added runs in order. */
function joinFinalText(segments: readonly InlineTextDiffSegment[]): string {
  return segments
    .filter((segment) => segment.kind !== 'removed')
    .map((segment) => segment.text)
    .join('');
}

/**
 * A change to a text value, inline: unchanged context, the removed run and the added run, or in
 * the `final` view the resulting text without any change marked.
 */
export function InlineTextDiff({
  segments,
  view = 'changes',
  finalText,
  className,
  ...rest
}: InlineTextDiffProps) {
  if (view === 'final') {
    return (
      <span {...rest} {...hooks.root({ className, data: { view } })}>
        {finalText ?? joinFinalText(segments)}
      </span>
    );
  }
  return (
    <span {...rest} {...hooks.root({ className, data: { view } })}>
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
