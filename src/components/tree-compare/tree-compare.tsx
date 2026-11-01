'use client';

import { useMemo, type KeyboardEvent } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  compareTrees,
  type CompareTreeNode,
  type ComparedTreeRow,
} from '../../utils/compare-trees.js';
import { requireDefined } from '../../utils/require-defined.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { Tree } from '../tree/tree.js';
import {
  TreeCompareHeader,
  TreeCompareJump,
  TreeCompareRowContent,
  TreeCompareToolbar,
  treeCompareHooks as hooks,
  type TreeCompareLabelRenderer,
} from './tree-compare-parts.js';
import {
  collectKeysAboveChanges,
  filterChangedRows,
  indexRows,
  nameRow,
} from './tree-compare-rows.js';
import { useTreeCompareNavigation } from './use-tree-compare-navigation.js';

export type { TreeCompareLabelRenderer, TreeCompareSide } from './tree-compare-parts.js';

export interface TreeCompareProps<T extends CompareTreeNode>
  extends BaseProps, AriaLabellingProps, ExpansionProps, RefProps<HTMLDivElement> {
  /** The left hierarchy, such as the earlier version. Ids are unique within each tree. */
  left: readonly T[];
  /** The right hierarchy, such as the later version. */
  right: readonly T[];
  /** Heads the left column. Defaults to the provider's `valueBefore` string. */
  leftLabel?: string | undefined;
  /** Heads the right column. Defaults to the provider's `valueAfter` string. */
  rightLabel?: string | undefined;
  /** Whether a node on both sides is unchanged. Defaults to comparing labels. */
  isEqual?: ((left: T, right: T) => boolean) | undefined;
  /** Draws a node's label in one side's cell. Defaults to its `label`. */
  renderLabel?: TreeCompareLabelRenderer<T> | undefined;
  /** Shows only the rows that differ and the rows above them, controlled. */
  changesOnly?: boolean | undefined;
  /** Whether only differences show at first, uncontrolled. */
  defaultChangesOnly?: boolean | undefined;
  /** Called when the reader turns "only differences" on or off. */
  onChangesOnlyChange?: ((changesOnly: boolean) => void) | undefined;
}

type Row<T extends CompareTreeNode> = ComparedTreeRow<T>;

const readChildren = <T extends CompareTreeNode>(row: Row<T>) => row.children;

/**
 * The expanded rows, by default every row with a difference below it. Uncontrolled expansion
 * belongs to the compared trees: it starts over when `left` or `right` changes.
 */
function useCompareExpansion<T extends CompareTreeNode>(
  { rows, trees }: { rows: ReadonlyArray<Row<T>>; trees: object },
  props: ExpansionProps,
) {
  const { expandedKeys, defaultExpandedKeys, onExpandedChange } = props;
  const initial = useMemo(
    () => (defaultExpandedKeys ? new Set(defaultExpandedKeys) : collectKeysAboveChanges(rows)),
    [defaultExpandedKeys, rows],
  );
  const [own, setOwn] = useStateFor(trees, initial);
  const isControlled = expandedKeys !== undefined;
  const setExpanded = (next: Set<Key>) => {
    if (!isControlled) setOwn(next);
    onExpandedChange?.(next);
  };
  return [isControlled ? new Set(expandedKeys) : own, setExpanded] as const;
}

/** Everything the comparison draws: the aligned rows shown, the filter, expansion and navigation. */
function useTreeCompareModel<T extends CompareTreeNode>(props: TreeCompareProps<T>) {
  const { left, right, isEqual, changesOnly, defaultChangesOnly = false } = props;
  const comparison = useMemo(() => compareTrees(left, right, { isEqual }), [left, right, isEqual]);
  const trees = useMemo(() => ({ left, right }), [left, right]);
  const [isFiltered, setFiltered] = useControllableState(
    changesOnly,
    defaultChangesOnly,
    props.onChangesOnlyChange,
  );
  const rows = useMemo(
    () => (isFiltered ? filterChangedRows(comparison.rows) : comparison.rows),
    [comparison, isFiltered],
  );
  const index = useMemo(() => indexRows(rows), [rows]);
  const [expanded, setExpanded] = useCompareExpansion({ rows: comparison.rows, trees }, props);
  const navigation = useTreeCompareNavigation({
    index,
    expandedKeys: expanded,
    setExpandedKeys: setExpanded,
  });
  const { counts } = comparison;
  return {
    rows,
    counts,
    hasChanges: counts.added + counts.removed + counts.changed + counts.moved > 0,
    isFiltered,
    setFiltered,
    expanded,
    setExpanded,
    navigation,
    /** A moved row goes to its other position; a row with child rows expands or collapses. */
    onAction(key: Key) {
      const row = index.byId.get(key);
      if (row?.counterpartId !== undefined) navigation.reveal(row.counterpartId);
      else if (row && row.children.length > 0) {
        const next = new Set(expanded);
        if (!next.delete(key)) next.add(key);
        setExpanded(next);
      }
    },
    /** F7 steps to the next difference and Shift+F7 to the previous one. */
    onItemKeyDown(_row: Row<T>, event: KeyboardEvent<HTMLElement>) {
      if (event.key !== 'F7') return false;
      navigation.step(event.shiftKey ? -1 : 1);
      return true;
    },
  };
}

/**
 * Two hierarchies aligned row by row on React Aria's tree through `Tree`: each row shows a node's
 * left and right versions side by side, marked added, removed, changed or moved, with one
 * expansion for both sides, a filter that keeps only differences, steps between differences, links
 * between a moved node's two positions and a summary of the counts.
 */
export function TreeCompare<T extends CompareTreeNode>(props: TreeCompareProps<T>) {
  const strings = useUiStrings();
  const model = useTreeCompareModel(props);
  const { navigation, rows, counts, hasChanges, isFiltered, setFiltered } = model;
  const { expanded, setExpanded, onAction, onItemKeyDown } = model;
  const { onFocus, step, treeRef, reveal } = navigation;
  const { className, id, ref, leftLabel, rightLabel, renderLabel } = props;
  const {
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-details': details,
  } = props;
  return (
    <div
      {...hooks.root({ className, props, data: { changesOnly: isFiltered } })}
      id={id}
      ref={ref}
      onFocus={onFocus}
    >
      <TreeCompareToolbar
        counts={counts}
        changesOnly={isFiltered}
        onChangesOnlyChange={setFiltered}
        hasChanges={hasChanges}
        onStep={step}
      />
      <TreeCompareHeader
        leftLabel={leftLabel ?? strings.valueBefore}
        rightLabel={rightLabel ?? strings.valueAfter}
      />
      <Tree
        aria-label={label ?? (labelledBy ? undefined : strings.treeComparison)}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-details={details}
        ref={treeRef}
        className={hooks.slotClass('tree')}
        items={rows}
        getChildren={readChildren}
        getTextValue={(row) => nameRow(row, strings)}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
        onAction={onAction}
        onItemKeyDown={onItemKeyDown}
        emptyMessage={strings.treeNoDifferences}
        renderLabel={(row, state) => (
          <TreeCompareRowContent
            row={row}
            isExpanded={state.isExpanded}
            renderLabel={renderLabel}
          />
        )}
        renderActions={(row) =>
          row.counterpartId === undefined ? null : (
            <TreeCompareJump
              isOldPosition={row.right === undefined}
              onPress={() => reveal(requireDefined(row.counterpartId))}
            />
          )
        }
      />
    </div>
  );
}
