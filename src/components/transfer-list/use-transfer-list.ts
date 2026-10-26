import { useMemo, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key, Selection } from '../../core/props.js';
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import {
  addChosenKeys,
  canStepChosenKeys,
  dropChosenKeys,
  stepChosenKeys,
  type TransferDrop,
} from './transfer-moves.js';
import type { TransferListItem, TransferListSide } from './transfer-pane.js';

interface TransferListOptions {
  items: readonly TransferListItem[];
  value: readonly Key[] | undefined;
  defaultValue: readonly Key[] | undefined;
  onChange: ((value: Key[]) => void) | undefined;
  disabledKeys: Iterable<Key> | undefined;
  isDisabled: boolean;
}

/** One side's rows, filter and selection, as its pane draws them. */
export interface TransferSide {
  /** Every item on the side. */
  all: readonly TransferListItem[];
  /** The items the side's filter shows. */
  shown: readonly TransferListItem[];
  /** The selected keys among the shown items. */
  selected: ReadonlySet<Key>;
  /** The shown keys that can move. */
  movable: ReadonlySet<Key>;
  filterText: string;
}

type PerSide<T> = Record<TransferListSide, T>;

const noKeys: ReadonlySet<Key> = new Set();

function buildSide(
  all: readonly TransferListItem[],
  {
    filterText,
    selection,
    blocked,
  }: { filterText: string; selection: Selection; blocked: ReadonlySet<Key> },
): TransferSide {
  const terms = splitMatchTerms(filterText, { ignoreAccents: true });
  const shown =
    terms.length === 0
      ? all
      : all.filter((item) => textMatchesTerms(item.label, terms, { ignoreAccents: true }));
  const movable = new Set(shown.map((item) => item.id).filter((key) => !blocked.has(key)));
  const filtered =
    selection === 'all' ? movable : new Set([...selection].filter((key) => movable.has(key)));
  const selected = selection !== 'all' && filtered.size === selection.size ? selection : filtered;
  return { all, shown, selected, movable, filterText };
}

/**
 * A transfer list's model: the chosen keys (controlled or held here), each side's rows, filter and
 * selection, and the moves between and within the sides.
 */
export function useTransferList(options: TransferListOptions) {
  const { items, disabledKeys, isDisabled } = options;
  const [chosen, setChosen] = useControllableState<readonly Key[]>(
    options.value,
    options.defaultValue ?? [],
    options.onChange && ((next) => options.onChange?.([...next])),
  );
  const [filters, setFilters] = useState<PerSide<string>>({ available: '', chosen: '' });
  const [selections, setSelections] = useState<PerSide<Selection>>({
    available: noKeys as Set<Key>,
    chosen: noKeys as Set<Key>,
  });
  // A stable set, so the sides' lists keep their rows across unrelated renders.
  const blocked = useMemo<ReadonlySet<Key>>(
    () => (isDisabled ? new Set(items.map((item) => item.id)) : new Set(disabledKeys ?? [])),
    [isDisabled, items, disabledKeys],
  );
  const byId = new Map(items.map((item) => [item.id, item]));
  const held = new Set(chosen);
  const sides: PerSide<TransferSide> = {
    available: buildSide(
      items.filter((item) => !held.has(item.id)),
      { filterText: filters.available, selection: selections.available, blocked },
    ),
    chosen: buildSide(
      chosen.flatMap((key) => byId.get(key) ?? []),
      { filterText: filters.chosen, selection: selections.chosen, blocked },
    ),
  };
  const transfer = (from: TransferListSide, keys: ReadonlySet<Key>) => {
    const moved = new Set([...keys].filter((key) => !blocked.has(key)));
    if (moved.size === 0) return;
    const order = items.map((item) => item.id);
    setChosen(
      from === 'available'
        ? addChosenKeys(chosen, { added: moved, order })
        : chosen.filter((key) => !moved.has(key)),
    );
    const to = from === 'available' ? 'chosen' : 'available';
    setSelections({ [from]: new Set(), [to]: moved } as PerSide<Selection>);
  };
  const step = (direction: -1 | 1) => ({
    canStep: canStepChosenKeys(chosen, { selected: sides.chosen.selected, step: direction }),
    onStep: () =>
      setChosen(stepChosenKeys(chosen, { selected: sides.chosen.selected, step: direction })),
  });
  return {
    sides,
    blocked,
    transfer,
    /** Moves the actioned row, or the whole selection when it holds the row. */
    act: (from: TransferListSide, key: Key) =>
      transfer(from, sides[from].selected.has(key) ? sides[from].selected : new Set([key])),
    select: (side: TransferListSide, keys: Selection) =>
      setSelections((current) => ({ ...current, [side]: keys })),
    filter: (side: TransferListSide, text: string) =>
      setFilters((current) => ({ ...current, [side]: text })),
    drop: (drop: TransferDrop) => setChosen(dropChosenKeys(chosen, drop)),
    up: step(-1),
    down: step(1),
  };
}
