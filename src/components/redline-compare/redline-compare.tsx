'use client';

import { getElementByIdWithin } from '../../utils/owner-window.js';
import { useId, useMemo, type KeyboardEvent, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { requireDefined } from '../../utils/require-defined.js';
import { useStateFor } from '../../utils/use-state-for.js';
import {
  compareBlocks,
  type BlockComparison,
  type ComparedBlockRow,
  type DocumentBlock,
} from '../../utils/compare-blocks.js';
import {
  RedlineCompareColumns,
  RedlineCompareHeader,
  redlineCompareHooks as hooks,
} from './redline-compare-parts.js';
import { RedlineRow, type RedlineDecision } from './redline-row.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';

export type { RedlineDecision } from './redline-row.js';

/** `inline` draws both documents in one column; `split` draws the old beside the new. */
export type RedlineCompareLayout = 'inline' | 'split';

/** A decision the reader took on one change, with the row it is about. */
export interface RedlineResolution<B extends DocumentBlock = DocumentBlock> {
  decision: RedlineDecision;
  /** The change: its key, its kind, both blocks where it has them and their indices. */
  row: ComparedBlockRow<B>;
}

export interface RedlineCompareProps<B extends DocumentBlock = DocumentBlock>
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The blocks of the document before the change. */
  oldBlocks: readonly B[];
  /** The blocks of the document after the change. */
  newBlocks: readonly B[];
  /** One column, or the two documents side by side. Defaults to `inline`. */
  layout?: RedlineCompareLayout | undefined;
  /** Heads the old column of a split compare. Defaults to the provider's `valueBefore` string. */
  oldLabel?: string | undefined;
  /** Heads the new column of a split compare. Defaults to the provider's `valueAfter` string. */
  newLabel?: string | undefined;
  /** The decisions taken so far by change key, controlled; without it the compare keeps them. */
  resolutions?: Readonly<Record<string, RedlineDecision>> | undefined;
  /** Called when the reader accepts or rejects a change. Without it no decision buttons draw. */
  onResolve?: ((resolution: RedlineResolution<B>) => void) | undefined;
}

const noDecisions: Readonly<Record<string, RedlineDecision>> = {};

/** A row the reader can step to and decide on: every difference but a moved block's old position. */
const isChangeRow = (row: ComparedBlockRow) => row.change !== 'unchanged' && row.move !== 'from';

/** Steps between changes and moved blocks' positions, focusing the row it reaches. */
function useRedlineNavigation(
  comparison: BlockComparison,
  baseId: string,
  ref: Ref<HTMLDivElement> | undefined,
) {
  const [rootRef, setRootRef] = useForwardedRef(ref);
  const [current, setCurrent] = useStateFor<string | null>(comparison, null);
  const { changes, positions } = useMemo(
    () => ({
      changes: comparison.rows.filter(isChangeRow),
      positions: new Map(comparison.rows.map((row, position) => [row.key, position])),
    }),
    [comparison],
  );
  const index = changes.findIndex((row) => row.key === current);
  const rowId = (key: string) => `${baseId}-row-${positions.get(key)}`;
  const focusRow = (key: string) => {
    const element = getElementByIdWithin(rootRef.current, rowId(key));
    element?.focus();
    element?.scrollIntoView?.({ block: 'nearest' });
  };
  const goTo = (key: string) => {
    if (changes.some((row) => row.key === key)) setCurrent(key);
    focusRow(key);
  };
  const move = (step: 1 | -1) => {
    const target = changes[current === null ? (step === 1 ? 0 : -1) : index + step];
    if (target) goTo(target.key);
  };
  return {
    setRootRef,
    current,
    rowId,
    goTo,
    move,
    canMove: { previous: current !== null && index > 0, next: index < changes.length - 1 },
  };
}

/**
 * The block-level redline of two rich documents: blocks aligned by id or text, inserted and
 * deleted words inline, changed kinds and formatting noted, moved blocks linked between their two
 * positions, inline or side by side, with steps between changes and accept and reject buttons that
 * report each decision as plain data.
 */
export function RedlineCompare<B extends DocumentBlock>({
  oldBlocks,
  newBlocks,
  layout = 'inline',
  oldLabel,
  newLabel,
  resolutions,
  onResolve,
  className,
  ref,
  ...rest
}: RedlineCompareProps<B>) {
  const strings = useUiStrings();
  const baseId = useId();
  const comparison = useMemo(() => compareBlocks(oldBlocks, newBlocks), [oldBlocks, newBlocks]);
  const { move, setRootRef, canMove, rowId, current, goTo } = useRedlineNavigation(
    comparison,
    baseId,
    ref,
  );
  const [ownDecisions, setOwnDecisions] = useStateFor(comparison, noDecisions);
  const decisions = resolutions ?? ownDecisions;
  const isSplit = layout === 'split';
  const resolve = (row: ComparedBlockRow<B>, decision: RedlineDecision) => {
    if (decisions[row.key] === decision) return;
    if (!resolutions) setOwnDecisions({ ...ownDecisions, [row.key]: decision });
    onResolve?.({ decision, row });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
    if (event.key === 'n') move(1);
    else if (event.key === 'p') move(-1);
    else return;
    event.preventDefault();
  };
  const labelledBy = rest['aria-labelledby'];
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { layout } })}
      aria-label={rest['aria-label'] ?? (labelledBy ? undefined : strings.redlineComparison)}
      ref={setRootRef}
      role="group"
      onKeyDown={onKeyDown}
    >
      <RedlineCompareHeader counts={comparison.counts} canMove={canMove} onMove={move} />
      {isSplit ? (
        <RedlineCompareColumns
          labels={{ old: oldLabel ?? strings.valueBefore, new: newLabel ?? strings.valueAfter }}
        />
      ) : null}
      <ol {...hooks.slot('rows')}>
        {comparison.rows.map((row) => (
          <RedlineRow
            key={row.key}
            row={row}
            rowId={rowId(row.key)}
            isSplit={isSplit}
            isCurrent={row.key === current}
            decision={decisions[row.key]}
            onResolve={
              onResolve && isChangeRow(row) ? (decision) => resolve(row, decision) : undefined
            }
            onJump={() => goTo(requireDefined(row.counterpartKey))}
          />
        ))}
      </ol>
    </div>
  );
}
