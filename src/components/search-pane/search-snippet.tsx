import type { BaseProps, RefProps } from '../../core/props.js';
import type { SearchSnippetData } from './build-search-snippet.js';
import { searchSnippetHooks as hooks } from './search-pane-hooks.js';

export interface SearchSnippetProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** The snippet `buildSearchSnippet` built. */
  snippet: SearchSnippetData;
}

/** The ellipsis that stands for text a snippet leaves out. */
function SnippetEllipsis() {
  return <span {...hooks.slot('ellipsis')}>…</span>;
}

/**
 * Draws a snippet on one line: the leading context, the words next to the match, the match in a
 * `<mark>`, and the context after, with an ellipsis only where text was left out. The leading
 * context and the near words sit in isolated runs, so a stylesheet can cut it from its start when the row is
 * narrow and keep the words next to the match and the match itself in view.
 */
export function SearchSnippet({ ref, snippet, className, id, ...rest }: SearchSnippetProps) {
  const { lead, near, match, after, isStartOmitted, isEndOmitted } = snippet;
  // The start's ellipsis opens the first run that has text: the near words when a word too long to
  // keep whole was cut and no leading context is left.
  const leadEllipsis = isStartOmitted && lead !== '';
  const nearEllipsis = isStartOmitted && lead === '';
  return (
    <span
      ref={ref}
      id={id}
      {...hooks.root({
        className,
        props: rest,
        data: { startOmitted: isStartOmitted, endOmitted: isEndOmitted },
      })}
    >
      {lead ? (
        <span {...hooks.slot('lead')}>
          <bdi>
            {leadEllipsis ? <SnippetEllipsis /> : null}
            {lead}
          </bdi>
        </span>
      ) : null}
      <span {...hooks.slot('near')}>
        <bdi>
          {nearEllipsis ? <SnippetEllipsis /> : null}
          {near}
        </bdi>
      </span>
      <mark {...hooks.slot('match')}>{match}</mark>
      <span {...hooks.slot('after')}>
        {after}
        {isEndOmitted ? <SnippetEllipsis /> : null}
      </span>
    </span>
  );
}
