import { useControllableState } from '../../core/controllable-state.js';
import type { Key, Selection, SelectionMode } from '../../core/props.js';

interface DiagramSelectionOptions {
  selectionMode: SelectionMode;
  selectedKeys: Iterable<Key> | 'all' | undefined;
  defaultSelectedKeys: Iterable<Key> | 'all' | undefined;
  onSelectionChange: ((keys: Selection) => void) | undefined;
  /** Every node and edge id, which `'all'` stands for. */
  allKeys: readonly Key[];
}

export interface DiagramSelection {
  selected: ReadonlySet<Key>;
  /** Selects `key` alone, or with `toggle` adds or removes it (multiple selection only). */
  select: (key: Key, toggle: boolean) => void;
  /** Selects exactly `keys`, or only the first of them in single selection. */
  replace: (keys: readonly Key[]) => void;
}

function toSelection(keys: Iterable<Key> | 'all' | undefined): Selection | undefined {
  if (keys === undefined) return undefined;
  return keys === 'all' ? 'all' : new Set(keys as Iterable<Key>);
}

/** The selected nodes and edges, controlled or not, in the canvas's selection mode. */
export function useDiagramSelection(options: DiagramSelectionOptions): DiagramSelection {
  const { selectionMode, allKeys } = options;
  const [value, setValue] = useControllableState<Selection>(
    toSelection(options.selectedKeys),
    toSelection(options.defaultSelectedKeys) ?? new Set(),
    options.onSelectionChange,
  );
  const selected: ReadonlySet<Key> = value === 'all' ? new Set(allKeys) : value;
  const replace = (keys: readonly Key[]) => {
    if (selectionMode === 'none') return;
    const next = selectionMode === 'single' ? keys.slice(0, 1) : keys;
    const isSame = next.length === selected.size && next.every((key) => selected.has(key));
    if (!isSame) setValue(new Set(next));
  };
  const select = (key: Key, toggle: boolean) => {
    if (!toggle || selectionMode !== 'multiple') {
      replace([key]);
      return;
    }
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setValue(next);
  };
  return { selected, select, replace };
}
