// The parts of a tree comparison around its tree: hooks, toolbar, summary, column labels and rows.

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { GlyphName } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import type {
  CompareTreeNode,
  ComparedTreeRow,
  TreeChange,
  TreeChangeCounts,
} from '../../utils/compare-trees.js';
import { Icon } from '../icon/icon.js';
import { Button } from '../button/button.js';
import { Switch } from '../switch/switch.js';

/** Which tree a cell shows. */
export type TreeCompareSide = 'left' | 'right';

/** Draws a node's label in one side's cell. */
export type TreeCompareLabelRenderer<T extends CompareTreeNode> = (
  node: T,
  side: TreeCompareSide,
) => ReactNode;

/** The hook classes every module of the tree comparison writes (specs/TREE-COMPARE.md). */
export const treeCompareHooks = createHooks('tree-compare', [
  'toolbar',
  'summary',
  'count',
  'changes-only',
  'previous',
  'next',
  'header',
  'column-label',
  'tree',
  'row',
  'cell',
  'marker',
  'branch',
  'jump',
]);

const hooks = treeCompareHooks;

const changeGlyphs: Readonly<Record<Exclude<TreeChange, 'unchanged'>, GlyphName>> = {
  added: 'plus',
  removed: 'minus',
  changed: 'edit',
  moved: 'move',
};

const countedChanges = ['added', 'removed', 'changed', 'moved'] as const;

/** The number of each kind of difference, or a note that there is none. */
function TreeCompareSummary({ counts }: { counts: TreeChangeCounts }) {
  const strings = useUiStrings();
  const names = {
    added: strings.treeAddedCount,
    removed: strings.treeRemovedCount,
    changed: strings.treeChangedCount,
    moved: strings.treeMovedCount,
  };
  const shown = countedChanges.filter((change) => counts[change] > 0);
  if (shown.length === 0) return <p {...hooks.slot('summary')}>{strings.treeNoDifferences}</p>;
  return (
    <ul {...hooks.slot('summary')}>
      {shown.map((change) => (
        <li key={change} {...hooks.slot('count', { change })}>
          {names[change](counts[change])}
        </li>
      ))}
    </ul>
  );
}

/** The summary, the switch that keeps only differences and the buttons that move between them. */
export function TreeCompareToolbar(props: {
  counts: TreeChangeCounts;
  changesOnly: boolean;
  onChangesOnlyChange: (changesOnly: boolean) => void;
  hasChanges: boolean;
  onStep: (step: 1 | -1) => void;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('toolbar')}>
      <TreeCompareSummary counts={props.counts} />
      <Switch
        size="sm"
        className={hooks.slotClass('changes-only')}
        isSelected={props.changesOnly}
        onChange={props.onChangesOnlyChange}
      >
        {strings.treeChangesOnly}
      </Switch>
      <Button
        className={hooks.slotClass('previous')}
        icon="chevron-up"
        label={strings.treePreviousChange}
        size="sm"
        variant="ghost"
        isDisabled={!props.hasChanges}
        onPress={() => props.onStep(-1)}
      />
      <Button
        className={hooks.slotClass('next')}
        icon="chevron-down"
        label={strings.treeNextChange}
        size="sm"
        variant="ghost"
        isDisabled={!props.hasChanges}
        onPress={() => props.onStep(1)}
      />
    </div>
  );
}

/** The two column labels above the rows. */
export function TreeCompareHeader(props: { leftLabel: string; rightLabel: string }) {
  return (
    <div {...hooks.slot('header')}>
      <span {...hooks.slot('column-label', { side: 'left' })}>{props.leftLabel}</span>
      <span {...hooks.slot('column-label', { side: 'right' })}>{props.rightLabel}</span>
    </div>
  );
}

function TreeCompareCell<T extends CompareTreeNode>(props: {
  node: T | undefined;
  side: TreeCompareSide;
  branch: GlyphName | null;
  renderLabel: TreeCompareLabelRenderer<T> | undefined;
}) {
  const { node, side, branch, renderLabel } = props;
  if (!node) return <span {...hooks.slot('cell', { side, empty: true })} />;
  return (
    <span {...hooks.slot('cell', { side })}>
      {branch ? <Icon glyph={branch} size="sm" className={hooks.slotClass('branch')} /> : null}
      {renderLabel ? renderLabel(node, side) : node.label}
    </span>
  );
}

/**
 * One aligned row: the left node's cell, the change marker and the right node's cell. The tree's
 * own expand button serves the row; the right cell repeats its glyph, decoratively.
 */
export function TreeCompareRowContent<T extends CompareTreeNode>(props: {
  row: ComparedTreeRow<T>;
  isExpanded: boolean;
  renderLabel: TreeCompareLabelRenderer<T> | undefined;
}) {
  const { row, isExpanded, renderLabel } = props;
  const { change } = row;
  const branch = row.children.length > 0 ? (isExpanded ? 'chevron-down' : 'chevron-right') : null;
  return (
    <span {...hooks.slot('row', { change })}>
      <TreeCompareCell node={row.left} side="left" branch={null} renderLabel={renderLabel} />
      <span {...hooks.slot('marker', { change })}>
        {change === 'unchanged' ? null : <Icon glyph={changeGlyphs[change]} size="sm" />}
      </span>
      <TreeCompareCell node={row.right} side="right" branch={branch} renderLabel={renderLabel} />
    </span>
  );
}

/** The button on a moved row that goes to the node's other position. */
export function TreeCompareJump(props: { isOldPosition: boolean; onPress: () => void }) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('jump')}
      icon={props.isOldPosition ? 'arrow-right' : 'arrow-left'}
      label={props.isOldPosition ? strings.treeGoToNewPosition : strings.treeGoToOldPosition}
      size="xs"
      variant="ghost"
      onPress={props.onPress}
    />
  );
}
