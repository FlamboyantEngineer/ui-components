'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLatest } from '../../utils/use-latest.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { splitMatchTerms, TextMatchProvider } from '../text-match/text-match.js';
import {
  hasNoPropertyMatch,
  PropertyScopeContext,
  type PropertyScopeFilter,
  usePropertyTallies,
} from './scope-tally.js';

export interface PropertyScopeProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The query as typed. Property rows below stay visible only while their texts hold every term. */
  query?: string | undefined;
  /**
   * Whether a row matches: called with the texts of its section, group and card, its label and its
   * keywords joined by spaces, and the query. Defaults to the texts holding every term.
   */
  filter?: PropertyScopeFilter | undefined;
  /** Shows a clear button in the no-match message, which calls this to empty the query. */
  onClear?: (() => void) | undefined;
  /** The property sections, groups, cards and rows the query filters. */
  children?: ReactNode;
}

const hooks = createHooks('property-scope', ['status']);

/**
 * Filters the property sections, groups, cards and rows below it by a query the caller owns:
 * rows whose texts miss a term hide but stay mounted, matching containers open, matched text is
 * marked, and a status message reports a query nothing matches.
 */
export function PropertyScope({
  query = '',
  filter,
  onClear,
  children,
  className,
  ...rest
}: PropertyScopeProps) {
  const strings = useUiStrings();
  const terms = useMemo(() => splitMatchTerms(query), [query]);
  // A query lifted to reveal a field stays lifted until the query changes.
  const [liftedQuery, setLiftedQuery] = useState<string | null>(null);
  const isLifted = liftedQuery === query;
  const isFiltering = !isLifted && (filter ? query.trim() !== '' : terms.length > 0);
  const { report, total } = usePropertyTallies();
  const latestClear = useLatest(onClear);
  const value = useMemo(
    () => ({
      terms,
      isFiltering,
      query,
      filter,
      path: '',
      report,
      reveal: () => {
        setLiftedQuery(query);
        latestClear.current?.();
      },
    }),
    [terms, isFiltering, query, filter, report, latestClear],
  );
  const hasNoMatch = hasNoPropertyMatch(isFiltering, total);

  return (
    <div {...rest} {...hooks.root({ className })}>
      <TextMatchProvider query={isLifted ? '' : query}>
        <PropertyScopeContext value={value}>{children}</PropertyScopeContext>
      </TextMatchProvider>
      <div {...hooks.slot('status')} role="status">
        {hasNoMatch ? (
          <EmptyState
            size="sm"
            description={
              <>
                {strings.noPropertyMatches(query.trim())}
                {onClear ? (
                  <>
                    {' '}
                    <Button variant="ghost" size="xs" onPress={onClear}>
                      {strings.clearFilter}
                    </Button>
                  </>
                ) : null}
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export type { PropertyScopeFilter } from './scope-tally.js';
export {
  matchesPropertyScope,
  PropertyScopeContext,
  usePropertyScopeLevel,
  useReportPropertyTally,
} from './scope-tally.js';
