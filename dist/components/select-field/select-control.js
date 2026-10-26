import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { Select as AriaSelect } from '../../primitives/index.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import { SelectChips } from './select-chips.js';
import { SelectList } from './select-list.js';
import { useSelectActions, useSelectModel, } from './select-model.js';
import { flattenSelectItems, toSelectKeys } from './select-options.js';
import { SelectTrigger } from './select-trigger.js';
/** Lists with more options than this filter by default. */
const FILTER_THRESHOLD = 10;
const hooks = createHooks('select-field', ['select']);
function emptyMessage(search, strings) {
    if (search?.isLoading)
        return strings.loading;
    if (search?.hasFailed)
        return strings.searchFailed;
    if (search?.isTooShort)
        return strings.typeToSearch(search.minSearchLength);
    return strings.noResults;
}
/** The open list's props: its items, how they are drawn, the filter and the search's state. */
function useListProps(props, model) {
    const strings = useUiStrings();
    const { search } = model;
    const isFilterable = props.filterable ??
        (Boolean(search) || flattenSelectItems(props.options).length > FILTER_THRESHOLD);
    return {
        items: model.listed,
        isMultiple: props.isMultiple,
        blockedKeys: model.blockedKeys,
        renderOption: props.renderOption,
        isVirtualized: Boolean(props.virtualized),
        isFilterable,
        filtersLocally: !search,
        isLoading: Boolean(search?.isLoading),
        emptyMessage: emptyMessage(search, strings),
        more: search?.hasMore ? { isLoading: search.isLoadingMore, onLoadMore: search.loadMore } : null,
    };
}
/**
 * The trigger's ref (read for its font, focused after a clear and published to the field), its
 * placeholder, a multiple select's count of its choices and the measured width of the widest text
 * it can show.
 */
function useTrigger(control, props, model) {
    const strings = useUiStrings();
    const triggerRef = useRef(null);
    const ref = useMemo(() => mergeRefs(triggerRef, control.ref), [control.ref]);
    const placeholder = props.placeholder ?? strings.selectPlaceholder;
    const options = flattenSelectItems(props.options);
    const count = model.keys.length;
    const texts = [
        model.empty?.label ?? placeholder,
        ...(props.isMultiple ? [strings.selectedCount(options.length)] : []),
        ...options.map((option) => option.label),
    ];
    const width = useWidestTextWidth(triggerRef, texts);
    const style = width === null
        ? undefined
        : measuredProperty('select-field-label-width', width);
    return {
        ref,
        placeholder,
        summary: props.isMultiple && count > 0 ? strings.selectedCount(count) : null,
        style,
        focus: () => triggerRef.current?.focus(),
    };
}
/**
 * A select field's control: React Aria's `Select` with the framed trigger, the open list and, for a
 * multiple select, the chips. Every pick, chip removal, clear and restore commits at once.
 */
export function SelectControl({ control, label, ...props }) {
    const { state, isMultiple } = props;
    const strings = useUiStrings();
    const model = useSelectModel(props);
    const list = useListProps(props, model);
    const actions = useSelectActions(props, model, list.isFilterable);
    const trigger = useTrigger(control, props, model);
    const submitted = isMultiple ? model.keys : [model.keys[0] ?? ''];
    return (_jsxs(_Fragment, { children: [_jsxs(AriaSelect, { className: hooks.slotClass('select'), style: trigger.style, id: control.id, "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], "aria-describedby": control['aria-describedby'], selectionMode: isMultiple ? 'multiple' : 'single', value: isMultiple
                    ? model.keys.map(toCollectionKey)
                    : model.single
                        ? toCollectionKey(model.single.id)
                        : null, onChange: (value) => actions.commitKeys(toSelectKeys(value).map(fromCollectionKey)), isOpen: actions.isOpen, onOpenChange: actions.changeOpen, isDisabled: state.isDisabled, isRequired: state.isRequired, isInvalid: state.validation.status === 'invalid', validationBehavior: "aria", allowsEmptyCollection: true, autoFocus: props.autoFocus, children: [_jsx(SelectTrigger, { ref: trigger.ref, chosen: model.single, previous: model.previous, placeholder: trigger.placeholder, summary: trigger.summary, clearLabel: props.isClearable && state.canClear ? strings.clearValue(label) : null, onClear: () => {
                            state.clear();
                            trigger.focus();
                        }, onKeyDownCapture: actions.seedFilter }), _jsx(SelectList, { ...list, filterText: actions.filterText, onFilterTextChange: actions.changeFilter })] }), props.name
                ? submitted.map((key) => (_jsx("input", { type: "hidden", name: props.name, value: String(key), disabled: state.isDisabled }, toCollectionKey(key))))
                : null, isMultiple ? (_jsx(SelectChips, { label: label, chosen: model.chosen, added: model.added, removed: model.removed, isEditable: !state.isReadOnly && !state.isDisabled, isFull: model.isFull, onRemove: (keys) => actions.commitKeys(model.keys.filter((key) => !keys.has(key))), onRestore: (key) => actions.commitKeys([...model.keys, key]) })) : null] }));
}
//# sourceMappingURL=select-control.js.map