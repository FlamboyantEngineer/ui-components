'use client';

import { useLayoutEffect, useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { readTreeChildren } from '../../utils/tree-reorder.js';
import { formatPath } from '../../utils/path.js';
import { FieldFormValue } from '../field/field.js';
import type { FieldControlProps, FieldInputProps, FieldState } from '../field/field.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import type { TreeItemData } from '../tree/tree.js';
import {
  getAncestorKeys,
  getTopChosenKeys,
  indexTreeItems,
  orderChosenKeys,
  removeChosenKey,
  settleCascadeKeys,
  type TreeIndex,
} from './tree-index.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { TreeSelectPopover } from './tree-select-popover.js';
import { TreeSelectTrigger } from './tree-select-trigger.js';
import type { SelectTreeFieldProps, SelectFieldValueDisplay } from './select-tree-field.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

type TreeSelectConfig<T extends TreeItemData> = Omit<
  SelectTreeFieldProps<T, 'single' | 'multiple'>,
  keyof FieldInputProps<unknown> | 'selectionMode' | 'valueDisplay' | 'mode'
> & { name?: string | undefined };

interface TreeSelectControlProps<T extends TreeItemData> extends TreeSelectConfig<T> {
  control: FieldControlProps;
  state: FieldState<Key | Key[] | null>;
  /** The field's label, which names the popover, the chips and the clear button. */
  label: string;
  isMultiple: boolean;
  valueDisplay: SelectFieldValueDisplay;
}

/** A chosen node as the trigger and the chips show it. */
interface ChosenNode {
  id: Key;
  text: string;
  /** The key matches no loaded node, so it shows as itself. */
  isMissing: boolean;
}

function toKeys(value: Key | Key[] | null): Key[] {
  if (Array.isArray(value)) return value;
  return value === null ? [] : [value];
}

function describeNode<T extends TreeItemData>(
  key: Key,
  {
    index,
    getTextValue,
    display,
  }: {
    index: TreeIndex<T>;
    getTextValue: (item: T) => string;
    display: SelectFieldValueDisplay;
  },
): ChosenNode {
  const entry = index.get(key);
  if (!entry) return { id: key, text: String(key), isMissing: true };
  const text =
    display === 'path'
      ? formatPath(
          [...getAncestorKeys(index, key), key].flatMap((ancestor) => {
            const node = index.get(ancestor);
            return node ? [getTextValue(node.item)] : [];
          }),
        )
      : getTextValue(entry.item);
  return { id: key, text, isMissing: false };
}

/** The chosen nodes and the edits a pick, a chip's removal or a clear makes, each committed at once. */
function useChosenNodes<T extends TreeItemData>(props: TreeSelectControlProps<T>) {
  const {
    items,
    getChildren = readTreeChildren,
    state,
    isMultiple,
    selectionPropagation = true,
  } = props;
  const strings = useUiStrings();
  const index = useMemo(() => indexTreeItems(items, getChildren), [items, getChildren]);
  const cascade = isMultiple && selectionPropagation;
  const held = toKeys(state.value);
  const keys = cascade ? settleCascadeKeys(held, index) : held;
  // A chosen branch whose children loaded or were added later takes them along as a change, so the
  // value, the rows and the form agree.
  const { setValue } = state;
  const isUnsettled = keys.length !== held.length;
  useLayoutEffect(() => {
    if (isUnsettled) setValue(keys);
  });
  const shown = cascade ? getTopChosenKeys(keys, index) : keys;
  const describe = { index, getTextValue: props.getTextValue, display: props.valueDisplay };
  const commit = (next: Iterable<Key>) => {
    const ordered = orderChosenKeys(next, index);
    state.setValue(isMultiple ? ordered : (ordered[0] ?? null));
    state.commit();
  };
  const chosen = shown.map((key) => describeNode(key, describe));
  const single = isMultiple ? null : (chosen[0] ?? null);
  return {
    index,
    keys,
    cascade,
    getChildren,
    chosen,
    /** What the trigger reads: the count of a multiple choice or a single choice's text. */
    summary: isMultiple && chosen.length > 0 ? strings.selectedCount(chosen.length) : single?.text,
    isMissing: Boolean(single?.isMissing),
    commit,
    remove: (removed: Iterable<Key>) =>
      commit(
        [...removed].reduce((left, key) => removeChosenKey(left, { key, index, cascade }), keys),
      ),
  };
}

interface TreeSelectChipsProps {
  label: string;
  chosen: readonly ChosenNode[];
  onRemove: ((keys: Set<Key>) => void) | undefined;
}

/** A multiple choice's chosen nodes as removable chips, one per chosen branch. */
function TreeSelectChips({ label, chosen, onRemove }: TreeSelectChipsProps) {
  const strings = useUiStrings();
  return (
    <TagGroup
      className={hooks.slotClass('chips')}
      aria-label={strings.selectedValues(label)}
      items={chosen}
      size="sm"
      onRemove={onRemove}
    >
      {(node) => (
        <Tag
          {...hooks.slot('chip', { missing: node.isMissing })}
          id={node.id}
          textValue={node.text}
        >
          {node.text}
        </Tag>
      )}
    </TagGroup>
  );
}

/** A single choice's form value: its key, or none. */
function toSingleFormValue(key: Key | undefined): string | null {
  return key === undefined ? null : String(key);
}

/**
 * A tree select field's control: the framed trigger that opens the popover, the clear button, the
 * chips of a multiple choice and the hidden inputs a form submits.
 */
export function TreeSelectControl<T extends TreeItemData>(props: TreeSelectControlProps<T>) {
  const { control, state, label, isMultiple } = props;
  const strings = useUiStrings();
  const nodes = useChosenNodes(props);
  const [open, setOpen] = useControllableState(
    props.isOpen,
    Boolean(props.defaultOpen),
    props.onOpenChange,
  );
  const isEditable = !state.isReadOnly && !state.isDisabled;
  useCloseWhenLocked(open, !isEditable, () => setOpen(false));
  const text = nodes.summary;
  return (
    <>
      <TreeSelectTrigger
        control={control}
        triggerRef={props.triggerRef}
        text={text ?? props.placeholder ?? strings.selectPlaceholder}
        isPlaceholder={text === undefined}
        isMissing={nodes.isMissing}
        clearLabel={props.isClearable && state.canClear ? strings.clearValue(label) : null}
        onClear={state.clear}
        isOpen={open && isEditable}
        onOpenChange={(next) => {
          if (isEditable) setOpen(next);
        }}
        popover={
          <TreeSelectPopover
            label={label}
            items={props.items}
            getTextValue={props.getTextValue}
            hasChildItems={props.hasChildItems}
            onLoadChildren={props.onLoadChildren}
            isMultiple={isMultiple}
            getChildren={nodes.getChildren}
            keys={nodes.keys}
            index={nodes.index}
            cascade={nodes.cascade}
            onChoose={(keys) => {
              nodes.commit(keys);
              if (!isMultiple) setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        }
      />
      {isMultiple && nodes.chosen.length > 0 ? (
        <TreeSelectChips
          label={label}
          chosen={nodes.chosen}
          onRemove={isEditable ? nodes.remove : undefined}
        />
      ) : null}
      <FieldFormValue
        name={props.name}
        value={isMultiple ? nodes.keys.map(String) : toSingleFormValue(nodes.keys[0])}
        isDisabled={state.isDisabled}
      />
    </>
  );
}
