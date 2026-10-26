import { useMemo, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import { addChosenKeys, canStepChosenKeys, dropChosenKeys, stepChosenKeys, } from './transfer-moves.js';
const noKeys = new Set();
function buildSide(all, { filterText, selection, blocked, }) {
    const terms = splitMatchTerms(filterText, { ignoreAccents: true });
    const shown = terms.length === 0
        ? all
        : all.filter((item) => textMatchesTerms(item.label, terms, { ignoreAccents: true }));
    const movable = new Set(shown.map((item) => item.id).filter((key) => !blocked.has(key)));
    const filtered = selection === 'all' ? movable : new Set([...selection].filter((key) => movable.has(key)));
    const selected = selection !== 'all' && filtered.size === selection.size ? selection : filtered;
    return { all, shown, selected, movable, filterText };
}
/**
 * A transfer list's model: the chosen keys (controlled or held here), each side's rows, filter and
 * selection, and the moves between and within the sides.
 */
export function useTransferList(options) {
    const { items, disabledKeys, isDisabled } = options;
    const [chosen, setChosen] = useControllableState(options.value, options.defaultValue ?? [], options.onChange && ((next) => options.onChange?.([...next])));
    const [filters, setFilters] = useState({ available: '', chosen: '' });
    const [selections, setSelections] = useState({
        available: noKeys,
        chosen: noKeys,
    });
    // A stable set, so the sides' lists keep their rows across unrelated renders.
    const blocked = useMemo(() => (isDisabled ? new Set(items.map((item) => item.id)) : new Set(disabledKeys ?? [])), [isDisabled, items, disabledKeys]);
    const byId = new Map(items.map((item) => [item.id, item]));
    const held = new Set(chosen);
    const sides = {
        available: buildSide(items.filter((item) => !held.has(item.id)), { filterText: filters.available, selection: selections.available, blocked }),
        chosen: buildSide(chosen.flatMap((key) => byId.get(key) ?? []), { filterText: filters.chosen, selection: selections.chosen, blocked }),
    };
    const transfer = (from, keys) => {
        const moved = new Set([...keys].filter((key) => !blocked.has(key)));
        if (moved.size === 0)
            return;
        const order = items.map((item) => item.id);
        setChosen(from === 'available'
            ? addChosenKeys(chosen, { added: moved, order })
            : chosen.filter((key) => !moved.has(key)));
        const to = from === 'available' ? 'chosen' : 'available';
        setSelections({ [from]: new Set(), [to]: moved });
    };
    const step = (direction) => ({
        canStep: canStepChosenKeys(chosen, { selected: sides.chosen.selected, step: direction }),
        onStep: () => setChosen(stepChosenKeys(chosen, { selected: sides.chosen.selected, step: direction })),
    });
    return {
        sides,
        blocked,
        transfer,
        /** Moves the actioned row, or the whole selection when it holds the row. */
        act: (from, key) => transfer(from, sides[from].selected.has(key) ? sides[from].selected : new Set([key])),
        select: (side, keys) => setSelections((current) => ({ ...current, [side]: keys })),
        filter: (side, text) => setFilters((current) => ({ ...current, [side]: text })),
        drop: (drop) => setChosen(dropChosenKeys(chosen, drop)),
        up: step(-1),
        down: step(1),
    };
}
//# sourceMappingURL=use-transfer-list.js.map