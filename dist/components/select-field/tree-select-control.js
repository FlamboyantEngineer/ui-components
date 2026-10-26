import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { readTreeChildren } from '../../utils/tree-reorder.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { formatPath } from '../../utils/path.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import { getAncestorKeys, getTopChosenKeys, indexTreeItems, orderChosenKeys, removeChosenKey, } from './tree-index.js';
import { TreeSelectPopover } from './tree-select-popover.js';
import { TreeSelectTrigger } from './tree-select-trigger.js';
const hooks = createHooks('select-field', ['chips', 'chip']);
function toKeys(value) {
    if (Array.isArray(value))
        return value;
    return value === null ? [] : [value];
}
function describeNode(key, { index, getTextValue, display, }) {
    const entry = index.get(key);
    if (!entry)
        return { id: key, text: String(key), isMissing: true };
    const text = display === 'path'
        ? formatPath([...getAncestorKeys(index, key), key].flatMap((ancestor) => {
            const node = index.get(ancestor);
            return node ? [getTextValue(node.item)] : [];
        }))
        : getTextValue(entry.item);
    return { id: key, text, isMissing: false };
}
/** The chosen nodes and the edits a pick, a chip's removal or a clear makes, each committed at once. */
function useChosenNodes(props) {
    const { items, getChildren = readTreeChildren, state, isMultiple, selectionPropagation = true, } = props;
    const strings = useUiStrings();
    const index = useMemo(() => indexTreeItems(items, getChildren), [items, getChildren]);
    const keys = toKeys(state.value);
    const cascade = isMultiple && selectionPropagation;
    const shown = cascade ? getTopChosenKeys(keys, index) : keys;
    const describe = { index, getTextValue: props.getTextValue, display: props.valueDisplay };
    const commit = (next) => {
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
        remove: (removed) => commit([...removed].reduce((left, key) => removeChosenKey(left, { key, index, cascade }), keys)),
    };
}
/** A multiple choice's chosen nodes as removable chips, one per chosen branch. */
function TreeSelectChips({ label, chosen, onRemove }) {
    const strings = useUiStrings();
    return (_jsx(TagGroup, { className: hooks.slotClass('chips'), "aria-label": strings.selectedValues(label), items: chosen, size: "sm", onRemove: onRemove, children: (node) => (_jsx(Tag, { ...hooks.slot('chip', { missing: node.isMissing }), id: node.id, textValue: node.text, children: node.text })) }));
}
/** The hidden inputs a form submits: one per chosen key, or one empty entry for a single choice. */
function HiddenInputs({ name, keys, isMultiple, isDisabled, }) {
    const entries = isMultiple ? keys : [keys[0] ?? ''];
    return entries.map((key) => (_jsx("input", { type: "hidden", name: name, value: String(key), disabled: isDisabled }, toKeyIdentity(key))));
}
/**
 * A tree select field's control: the framed trigger that opens the popover, the clear button, the
 * chips of a multiple choice and the hidden inputs a form submits.
 */
export function TreeSelectControl(props) {
    const { control, state, label, isMultiple } = props;
    const strings = useUiStrings();
    const nodes = useChosenNodes(props);
    const [open, setOpen] = useControllableState(props.isOpen, Boolean(props.defaultOpen), props.onOpenChange);
    const isEditable = !state.isReadOnly && !state.isDisabled;
    const text = nodes.summary;
    return (_jsxs(_Fragment, { children: [_jsx(TreeSelectTrigger, { control: control, text: text ?? props.placeholder ?? strings.selectPlaceholder, isPlaceholder: text === undefined, isMissing: nodes.isMissing, clearLabel: props.isClearable && state.canClear ? strings.clearValue(label) : null, onClear: state.clear, isOpen: open && isEditable, onOpenChange: (next) => {
                    if (isEditable)
                        setOpen(next);
                }, popover: _jsx(TreeSelectPopover, { label: label, items: props.items, getTextValue: props.getTextValue, hasChildItems: props.hasChildItems, onLoadChildren: props.onLoadChildren, isMultiple: isMultiple, getChildren: nodes.getChildren, keys: nodes.keys, index: nodes.index, cascade: nodes.cascade, onChoose: (keys) => {
                        nodes.commit(keys);
                        if (!isMultiple)
                            setOpen(false);
                    }, onClose: () => setOpen(false) }) }), isMultiple && nodes.chosen.length > 0 ? (_jsx(TreeSelectChips, { label: label, chosen: nodes.chosen, onRemove: isEditable ? nodes.remove : undefined })) : null, props.name ? (_jsx(HiddenInputs, { name: props.name, keys: nodes.keys, isMultiple: isMultiple, isDisabled: state.isDisabled })) : null] }));
}
//# sourceMappingURL=tree-select-control.js.map