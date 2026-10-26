import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { ComboBoxStateContext } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
const hooks = createHooks('combobox', ['chips', 'chip-icon']);
/**
 * The chosen options, in value order. An option the suggestions no longer list (the caller filtered
 * it out) keeps the label it last had; a key no suggestion ever listed shows itself.
 */
function useChosenOptions(options) {
    const state = useContext(ComboBoxStateContext);
    const [remembered, setRemembered] = useState(new Map());
    const keys = Array.isArray(state?.value)
        ? state.value.map(fromCollectionKey)
        : [];
    const listed = new Map(options.map((option) => [option.id, option]));
    const next = new Map();
    for (const key of keys) {
        const option = listed.get(key) ?? remembered.get(key);
        if (option)
            next.set(key, option);
    }
    // Remember committed choices during render, retaining their latest labels and icons.
    if (next.size !== remembered.size ||
        [...next].some(([key, option]) => remembered.get(key) !== option)) {
        setRemembered(next);
    }
    return keys.map((key) => next.get(key) ?? { id: key, label: String(key) });
}
/**
 * The text naming a multiple combobox, which names its chips, and the ref for its label element:
 * a text `label` or `aria-label` as given, else the text of the label element or of the elements
 * `aria-labelledby` names, read once they render, so a label drawn as markup or named elsewhere
 * still names the chips.
 */
export function useChipsLabel({ label, aria, isEnabled }) {
    const given = typeof label === 'string' ? label : aria['aria-label'];
    const labelledBy = aria['aria-labelledby'];
    const labelRef = useRef(null);
    const [read, setRead] = useState('');
    useLayoutEffect(() => {
        if (!isEnabled || given !== undefined)
            return;
        const element = labelRef.current;
        const owner = element?.ownerDocument ?? document;
        const sources = labelledBy
            ? labelledBy.split(/\s+/).map((id) => owner.getElementById(id))
            : [element];
        setRead(sources
            .map((source) => source?.textContent?.trim() ?? '')
            .filter(Boolean)
            .join(' '));
    }, [isEnabled, given, label, labelledBy]);
    return { text: given ?? read, labelRef };
}
/**
 * A multiple combobox's chosen options as removable chips, each with its option's icon, in the
 * library's `TagGroup` before the input: the arrow keys move between chips, and the remove button, Delete or Backspace removes one.
 */
export function ComboboxChips({ label, options, size, isEditable }) {
    const state = useContext(ComboBoxStateContext);
    const strings = useUiStrings();
    const chosen = useChosenOptions(options);
    if (!state || chosen.length === 0)
        return null;
    const onRemove = (removed) => state.setValue(chosen
        .map((option) => option.id)
        .filter((key) => !removed.has(key))
        .map(toCollectionKey));
    return (_jsx(TagGroup, { className: hooks.slotClass('chips'), "aria-label": strings.selectedValues(label), size: size, items: chosen, onRemove: isEditable ? onRemove : undefined, children: (option) => (_jsxs(Tag, { id: option.id, textValue: option.label, children: [option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), className: hooks.slotClass('chip-icon') })) : null, option.label] })) }));
}
//# sourceMappingURL=combobox-chips.js.map