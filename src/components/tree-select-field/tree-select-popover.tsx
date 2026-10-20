import { useRef, useState, type KeyboardEvent } from 'react';
import { Dialog } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { PopoverPanel } from '../popover/popover.js';
import { triggerWidthProperty } from '../portal/portal.js';
import { SearchField } from '../search-field/search-field.js';
import { Tree, type TreeItemData } from '../tree/tree.js';
import { getAncestorKeys, type TreeIndex } from './tree-index.js';
import type { TreeSelectFieldProps } from './tree-select-field.js';

export interface TreeSelectPopoverProps<T extends TreeItemData> extends Pick<
  TreeSelectFieldProps<T, 'single' | 'multiple'>,
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
  /** Called with the keys chosen now. */
  onChoose: (keys: Iterable<Key>) => void;
  /** Closes the popover. */
  onClose: () => void;
}

const hooks = createHooks('tree-select-field', ['popover', 'dialog', 'search', 'tree']);

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
  onChoose,
  onClose,
}: TreeSelectPopoverProps<T>) {
  const strings = useUiStrings();
  const [filterText, setFilterText] = useState('');
  const treeRef = useRef<HTMLDivElement>(null);
  const [expanded] = useState(() => keys.flatMap((key) => getAncestorKeys(index, key)));
  // Captured, since a search field with a key handler of its own would keep Escape from closing
  // the popover: Down from the search field moves to the tree's first row, and Escape in the tree
  // closes the popover instead of clearing a multiple choice.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const isInSearch = (event.target as Element).closest(`.${hooks.slotClass('search')}`) !== null;
    if (event.key === 'ArrowDown' && isInSearch) {
      event.preventDefault();
      treeRef.current?.querySelector<HTMLElement>('[role="row"]')?.focus();
    } else if (event.key === 'Escape' && !isInSearch) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };
  // A single choice's rows toggle once one is chosen, so pressing the chosen row empties the
  // selection: that keeps the value, and still closes the popover.
  const choose = (selection: Selection) => {
    const chosen = selection === 'all' ? [...index.keys()] : [...selection];
    if (isMultiple) onChoose(chosen);
    else onChoose(chosen.length > 0 ? chosen.slice(-1) : keys);
  };
  return (
    <Dialog
      {...hooks.slot('dialog')}
      aria-label={label}
      render={(props) => <section {...props} onKeyDownCapture={onKeyDownCapture} />}
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
        onAction={isMultiple ? undefined : (key) => onChoose([key])}
        onItemKeyDown={(item, event) => {
          if (isMultiple || event.key !== 'Enter') return false;
          onChoose([item.id]);
          return true;
        }}
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
      {...hooks.slot('popover')}
      placement="bottom start"
      offset={4}
      style={triggerWidthProperty}
    >
      <TreeSelectDialog {...props} />
    </PopoverPanel>
  );
}
