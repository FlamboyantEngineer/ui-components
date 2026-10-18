import type { Key } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';

export type SegmentedChoiceSelectionMode = 'single' | 'multiple';

/** One value or none for a single choice, the pressed values for a multiple one. */
export type SegmentedChoiceValue<M extends SegmentedChoiceSelectionMode = 'single'> =
  M extends 'multiple' ? string[] : string | null;

export interface ChoiceSelectionOptions<M extends SegmentedChoiceSelectionMode> {
  options: readonly { value: string }[];
  selectionMode?: M | undefined;
  value?: SegmentedChoiceValue<M> | undefined;
  defaultValue?: SegmentedChoiceValue<M> | undefined;
  onChange?: ((value: SegmentedChoiceValue<M>) => void) | undefined;
  isInherited: boolean;
  isClearable: boolean;
  isReadOnly: boolean;
}

export interface ChoiceSelection {
  selectionMode: SegmentedChoiceSelectionMode;
  selectedKeys: string[];
  onSelectionChange: (keys: Set<Key>) => void;
}

/** What picking the selected segment of a single choice again commits, if anything. */
function resolveRepick(
  current: string | null,
  { isInherited, isClearable }: { isInherited: boolean; isClearable: boolean },
): string | null | undefined {
  if (current === null) return undefined;
  if (isInherited) return current;
  return isClearable ? null : undefined;
}

/**
 * The group's selection mode, selected keys and selection handler. A single choice applies the
 * rules for picking the selected segment again; a multiple one reports its values in option order.
 */
export function useChoiceSelection<M extends SegmentedChoiceSelectionMode>({
  options,
  selectionMode,
  value,
  defaultValue,
  onChange,
  isInherited,
  isClearable,
  isReadOnly,
}: ChoiceSelectionOptions<M>): ChoiceSelection {
  const isMultiple = selectionMode === 'multiple';
  const empty = (isMultiple ? [] : null) as SegmentedChoiceValue<M>;
  const [current, commit] = useControllableState(value, defaultValue ?? empty, onChange);

  if (isMultiple) {
    return {
      selectionMode: 'multiple',
      selectedKeys: [...(current as string[])],
      onSelectionChange: (keys) => {
        if (isReadOnly) return;
        const picked = options.map((option) => option.value).filter((key) => keys.has(key));
        commit(picked as SegmentedChoiceValue<M>);
      },
    };
  }
  const single = current as string | null;
  return {
    selectionMode: 'single',
    selectedKeys: single === null ? [] : [single],
    // React Aria reports an empty selection when the selected segment is picked again.
    onSelectionChange: (keys) => {
      if (isReadOnly) return;
      const [picked] = keys;
      const next =
        picked === undefined ? resolveRepick(single, { isInherited, isClearable }) : String(picked);
      if (next !== undefined) commit(next as SegmentedChoiceValue<M>);
    },
  };
}
