import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId } from 'react';
import { Collection, ComboBoxStateContext, Header, ListBox, ListBoxItem, ListBoxLoadMoreItem, ListBoxSection, ListLayout, Popover, PopoverContext, useSlottedContext, Virtualizer, } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useFrameFlag } from '../../utils/use-frame-flag.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import { useAutoHighlight, useCreatedSelection, useOpenState } from './combobox-effects.js';
import { flattenOptions, hasOptionLabelled, isSection, } from './combobox-options.js';
const hooks = createHooks('combobox', [
    'popover',
    'listbox',
    'section',
    'section-header',
    'option',
    'option-icon',
    'option-label',
    'option-description',
    'create',
    'load-more',
    'empty',
    'list-header',
]);
// Estimates the virtualizer starts from; it measures each row as it renders.
const listLayoutOptions = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };
function OptionContent({ option, highlightMatches, }) {
    return (_jsxs(_Fragment, { children: [option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), className: hooks.slotClass('option-icon') })) : null, _jsx("span", { ...hooks.slot('option-label'), children: highlightMatches ? _jsx(TextMatch, { children: option.label }) : option.label }), option.description ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('option-description'), children: option.description })] })) : null] }));
}
function OptionRow({ option, display, }) {
    return (_jsx(ListBoxItem, { id: option.id, textValue: option.label, isDisabled: option.isDisabled, className: hooks.slotClass('option'), children: (state) => display.renderOption ? (display.renderOption({ ...option, id: fromCollectionKey(option.id) }, {
            isSelected: state.isSelected,
            isFocused: state.isFocused,
            isFocusVisible: state.isFocusVisible,
            isHovered: state.isHovered,
            isPressed: state.isPressed,
            isDisabled: state.isDisabled,
        })) : (_jsx(OptionContent, { option: option, highlightMatches: display.highlightMatches })) }));
}
function renderItems(display) {
    return (item) => {
        if (!isSection(item))
            return _jsx(OptionRow, { option: item, display: display });
        return (_jsxs(ListBoxSection, { id: item.id, className: hooks.slotClass('section'), children: [_jsx(Header, { className: hooks.slotClass('section-header'), children: item.title }), item.options.map((option) => (_jsx(OptionRow, { option: option, display: display }, toKeyIdentity(option.id))))] }));
    };
}
/** The action row that adds the typed text; its text value is the typed text, so filters keep it. */
function CreateRow({ text, onCreate, createdRef, }) {
    const strings = useUiStrings();
    const id = useId();
    return (_jsx(ListBoxItem, { id: id, textValue: text, className: hooks.slotClass('create'), 
        // React Aria commits the field as the row closes the list, which reports the old selection;
        // adding after that commit keeps the selection and text the caller sets for the new option.
        onAction: () => {
            createdRef.current = text;
            queueMicrotask(() => onCreate(text));
        }, children: strings.createOption(text) }));
}
function OptionList(props) {
    const strings = useUiStrings();
    const { items, onCreateOption, loading, inputText, renderEmpty } = props;
    const created = inputText.trim();
    const canCreate = onCreateOption !== undefined &&
        created !== '' &&
        !hasOptionLabelled(flattenOptions(items), created);
    const list = (_jsxs(ListBox, { className: hooks.slotClass('listbox'), renderEmptyState: loading.isLoading ? undefined : () => _jsx("span", { ...hooks.slot('empty'), children: renderEmpty() }), children: [_jsx(Collection, { items: items, children: renderItems(props) }), canCreate ? (_jsx(CreateRow, { text: created, onCreate: onCreateOption, createdRef: props.createdRef })) : null, loading.onLoadMore || loading.isLoading ? (_jsx(ListBoxLoadMoreItem, { className: hooks.slotClass('load-more'), onLoadMore: loading.onLoadMore, isLoading: loading.isLoading, children: strings.loading })) : null] }));
    const content = props.virtualized ? (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: listLayoutOptions, children: list })) : (list);
    if (!props.highlightMatches)
        return content;
    return (_jsx(TextMatchProvider, { query: props.filterText, ignoreAccents: true, children: content }));
}
/**
 * The suggestion list: the list header, then a listbox of options and sections, then the add row and
 * the loading row, or the empty content, in a popover on the `dropdown` layer that publishes the
 * field's width as `--ui-trigger-width`. It also keeps an option highlighted when asked and holds the building
 * block's open state to the combobox's.
 */
export function ComboboxSuggestions(props) {
    const zIndex = useLayerZIndex('dropdown');
    const state = useContext(ComboBoxStateContext);
    const isShown = useFrameFlag(props.isOpen, props.inputRef);
    const context = useSlottedContext(PopoverContext);
    const contextStyle = typeof context?.style === 'object' ? context.style : {};
    useAutoHighlight({ autoHighlight: Boolean(props.autoHighlight), completion: props.completion });
    useCreatedSelection(props.createdRef);
    useOpenState(props.isOpen);
    const { inputText, completion, listHeader, inputRef } = props;
    const filterText = completion?.text === inputText ? completion.typed : inputText;
    return (_jsxs(Popover, { ...hooks.slot('popover', { layer: 'dropdown', size: props.size }), isOpen: isShown, onOpenChange: (open) => {
            if (!open)
                state?.close();
        }, offset: 4, containerPadding: 8, style: { ...contextStyle, ...triggerWidthProperty, zIndex }, 
        // Focus leaving the popover closes it, unless it returns to the input from the list header.
        shouldCloseOnInteractOutside: (element) => element !== inputRef.current, children: [listHeader ? (_jsx("div", { ...hooks.slot('list-header'), onClickCapture: () => inputRef.current?.focus(), children: listHeader })) : null, _jsx(OptionList, { ...props, filterText: filterText })] }));
}
//# sourceMappingURL=combobox-suggestions.js.map