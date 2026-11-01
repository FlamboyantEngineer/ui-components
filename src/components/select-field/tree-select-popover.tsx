'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { Dialog } from '../../primitives/index.js';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { PopoverPanel } from '../popover/popover.js';
import { triggerWidthProperty } from '../portal/portal.js';
import { SearchField } from '../search-field/search-field.js';
import { Tree, type TreeItemData } from '../tree/tree.js';
import { collectAncestorKeys, type TreeIndex } from './tree-index.js';
import { createBranchCheck, useBranchPress } from './tree-branch-press.js';
import type { SelectTreeFieldProps } from './select-tree-field.js';
import { DEFAULT_DROPDOWN_OFFSET } from '../../utils/overlay-defaults.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

interface TreeSelectPopoverProps<T extends TreeItemData> extends Pick<
  SelectTreeFieldProps<T, 'single' | 'multiple'>,
  'items' | 'getTextValue' | 'hasChildItems' | 'onLoadChildren'
> {
  /** The field's label, which names the dialog, the search and the tree. */
  label: string;
  getChildren: (item: T) => readonly T[] | undefined;
  isMultiple: boolean;
  /** The chosen keys. */
  keys: readonly Key[];
  index: TreeIndex<T>;
  /** Choosing cascades through the hierarchy. */
  cascade: boolean;
  /** Branches can be chosen, with a press on an open branch; otherwise only leaves are. */
  selectableBranches: boolean;
  /** Called with the keys chosen now. */
  onChoose: (keys: Iterable<Key>) => void;
  /** Closes the popover. */
  onClose: () => void;
}

interface TreeChoosingOptions {
  index: TreeIndex<TreeItemData>;
  keys: readonly Key[];
  isMultiple: boolean;
  selectableBranches: boolean;
  isBranch: (key: Key) => boolean;
  onChoose: (keys: Iterable<Key>) => void;
}

/**
 * How the tree's presses and selection changes become choices. A single choice's rows toggle once
 * one is chosen, so pressing the chosen row empties the selection: that keeps the value, and still
 * closes the popover. A press on a branch row opens or closes it instead (UIC-SELECT-FIELD-9.6).
 * Without `selectableBranches`, a branch's checkbox chooses its leaves, never the branch itself.
 */
function useTreeChoosing(options: TreeChoosingOptions) {
  const { index, keys, isMultiple, selectableBranches, isBranch, onChoose } = options;
  const branchPress = useBranchPress({ selectableBranches, isMultiple });
  const choose = (selection: Selection) => {
    if (branchPress.claim()) return;
    const all = selection === 'all' ? [...index.keys()] : [...selection];
    const chosen = selectableBranches ? all : all.filter((key) => !isBranch(key));
    if (isMultiple) onChoose(chosen);
    else onChoose(chosen.length > 0 ? chosen.slice(-1) : keys);
  };
  const act = (key: Key) => {
    if (!branchPress.claim()) onChoose([key]);
  };
  const onItemKeyDown = (item: TreeItemData, event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' || isComposingKey(event.nativeEvent)) return false;
    if (branchPress.claim()) return true;
    if (isMultiple) return false;
    onChoose([item.id]);
    return true;
  };
  return { branchPress, choose, act, onItemKeyDown };
}

/**
 * Captured, since a search field with a key handler of its own would keep Escape from closing the
 * popover: Down from the search field moves to the tree's first row, and Escape in the tree closes
 * the popover instead of clearing a multiple choice. A key an input method composition owns (a Down
 * through its candidates, an Escape that drops them) is left to it.
 */
function handleDialogKey(
  event: KeyboardEvent<HTMLElement>,
  tree: HTMLElement | null,
  onClose: () => void,
) {
  if (isComposingKey(event.nativeEvent)) return;
  const isInSearch = (event.target as Element).closest(`.${hooks.slotClass('search')}`) !== null;
  if (event.key === 'ArrowDown' && isInSearch) {
    event.preventDefault();
    tree?.querySelector<HTMLElement>('[role="row"]')?.focus();
  } else if (event.key === 'Escape' && !isInSearch) {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }
}

/**
 * The dialog in a tree select field's popover: a search that filters the tree, keeping the matches'
 * ancestors as context, and the tree itself, opened at the chosen nodes. Down moves from the search
 * to the tree's first row.
 */
function TreeSelectDialog<T extends TreeItemData>({
  label,
  items,
  getTextValue,
  getChildren,
  hasChildItems,
  onLoadChildren,
  isMultiple,
  keys,
  index,
  cascade,
  selectableBranches,
  onChoose,
  onClose,
}: TreeSelectPopoverProps<T>) {
  const strings = useUiStrings();
  const [filterText, setFilterText] = useState('');
  const treeRef = useRef<HTMLDivElement>(null);
  const [expanded] = useState(() => collectAncestorKeys(index, keys));
  const { branchPress, choose, act, onItemKeyDown } = useTreeChoosing({
    index,
    keys,
    isMultiple,
    selectableBranches,
    isBranch: createBranchCheck(index, getChildren, hasChildItems),
    onChoose,
  });
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    branchPress.onKeyDownCapture(event);
    handleDialogKey(event, treeRef.current, onClose);
  };
  return (
    <Dialog
      {...hooks.slot('dialog')}
      aria-label={label}
      render={(props) => (
        <section
          {...props}
          onKeyDownCapture={onKeyDownCapture}
          onPointerDownCapture={branchPress.onPointerDownCapture}
        />
      )}
    >
      <SearchField
        className={hooks.slotClass('search')}
        label={strings.filterLabel(label)}
        placeholder={strings.filterLabel(label)}
        size="sm"
        value={filterText}
        onChange={setFilterText}
        autoFocus
      />
      <Tree
        ref={treeRef}
        className={hooks.slotClass('tree')}
        aria-label={label}
        variant="picker"
        items={items}
        getTextValue={getTextValue}
        getChildren={getChildren}
        hasChildItems={hasChildItems}
        onLoadChildren={onLoadChildren}
        selectionMode={isMultiple ? 'multiple' : 'single'}
        selectedKeys={keys}
        onSelectionChange={choose}
        onAction={isMultiple ? undefined : act}
        onItemKeyDown={onItemKeyDown}
        checkboxSelection={isMultiple}
        selectionPropagation={cascade}
        defaultExpandedKeys={expanded}
        filterText={filterText}
        emptyMessage={filterText.trim() ? strings.noResults : strings.noItems}
      />
    </Dialog>
  );
}

/**
 * The popover a tree select field opens. Its dialog mounts each time it opens, so the search starts
 * empty and the tree opens at the chosen nodes every time.
 */
export function TreeSelectPopover<T extends TreeItemData>(props: TreeSelectPopoverProps<T>) {
  return (
    <PopoverPanel
      {...hooks.slot('popover', { mode: 'tree' })}
      placement="bottom start"
      offset={DEFAULT_DROPDOWN_OFFSET}
      style={triggerWidthProperty}
    >
      <TreeSelectDialog {...props} />
    </PopoverPanel>
  );
}
