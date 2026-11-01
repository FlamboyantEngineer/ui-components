'use client';

import { MinusGlyph, PlusGlyph, type GlyphComponent } from '../../core/glyphs.js';
// The anatomy of one tree row, inside React Aria's row content.

import type { ReactNode } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import { TextMatch } from '../text-match/text-match.js';
import type { TreeExpandGlyph, TreeItemData, TreeItemState } from './tree-props.js';
import type { TreeRowOptions } from './tree-item.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeLoads } from './use-tree-loads.js';
import { keepControlFocusReturn } from '../../utils/keep-control-focus-return.js';

/** What every row's content reads. */
export type RowContentOptions<T extends TreeItemData> = Pick<
  TreeRowOptions<T>,
  | 'getTextValue'
  | 'getIcon'
  | 'renderLabel'
  | 'renderMeta'
  | 'renderActions'
  | 'expandGlyph'
  | 'checkboxSelection'
  | 'isIndeterminate'
  | 'rename'
  | 'loads'
> & { isMovable: (key: Key) => boolean; hasReorder: boolean };

/** The expand glyph: the shared chevron, pointing to the inline end while collapsed, or plus-minus. */
function useTreeExpandGlyph(glyph: TreeExpandGlyph, isExpanded: boolean): GlyphComponent {
  const chevron = useExpandGlyph(isExpanded);
  if (glyph === 'chevron') return chevron;
  return isExpanded ? MinusGlyph : PlusGlyph;
}

/** The expand button of a row with children, or a spacer holding its place. */
function TreeExpandButton({ state, glyph }: { state: TreeItemState; glyph: TreeExpandGlyph }) {
  const strings = useUiStrings();
  const icon = useTreeExpandGlyph(glyph, state.isExpanded);
  if (!state.hasChildItems) return <span {...hooks.slot('expand-spacer')} aria-hidden="true" />;
  return (
    <AriaButton
      slot="chevron"
      className={hooks.slotClass('expand')}
      aria-label={state.isExpanded ? strings.collapse : strings.expand}
    >
      <Icon icon={icon} size="sm" />
    </AriaButton>
  );
}

/** The label slot: the caller's label, the marked text value, or the name field while renaming. */
function TreeRowLabel<T extends TreeItemData>(props: {
  item: T;
  state: TreeItemState;
  options: RowContentOptions<T>;
}) {
  const { item, state, options } = props;
  const { rename, renderLabel, getTextValue } = options;
  let label: ReactNode;
  if (rename?.editingKey === item.id) label = rename.renderEditor(item);
  else if (renderLabel) label = renderLabel(item, state);
  else label = <TextMatch>{getTextValue(item)}</TextMatch>;
  return <span {...hooks.slot('label')}>{label}</span>;
}

/** Why loading a branch's children failed, with a retry, in the row. */
function TreeLoadError({ loads, itemKey }: { loads: TreeLoads | null; itemKey: Key }) {
  const error = loads?.errorOf(itemKey);
  if (!loads || !error) return null;
  return (
    <InlineError className={hooks.slotClass('load-error')} onRetry={() => loads.load(itemKey)}>
      {error}
    </InlineError>
  );
}

/**
 * One row's anatomy: drag handle, expand button or spacer, selection checkbox, icon, label, meta,
 * load error and actions.
 */
export function TreeRowContent<T extends TreeItemData>(props: {
  item: T;
  state: TreeItemState;
  hasCheckbox: boolean;
  options: RowContentOptions<T>;
}) {
  const { item, state, options } = props;
  const icon = options.getIcon?.(item, state);
  const meta = options.renderMeta?.(item, state);
  const actions = options.renderActions?.(item, state);
  return (
    <>
      {options.hasReorder ? (
        <DragHandle
          className={hooks.slotClass('drag-handle')}
          isDisabled={!options.isMovable(item.id)}
        />
      ) : null}
      <TreeExpandButton state={state} glyph={options.expandGlyph} />
      {props.hasCheckbox ? (
        <Checkbox
          size="sm"
          slot="selection"
          className={hooks.slotClass('checkbox')}
          isIndeterminate={options.isIndeterminate(item.id)}
        />
      ) : null}
      {!icon ? null : <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />}
      <TreeRowLabel item={item} state={state} options={options} />
      {isEmptyNode(meta) ? null : <span {...hooks.slot('meta')}>{meta}</span>}
      <TreeLoadError loads={options.loads} itemKey={item.id} />
      {isEmptyNode(actions) ? null : (
        <span ref={keepControlFocusReturn} {...hooks.slot('actions')}>
          {actions}
        </span>
      )}
    </>
  );
}
