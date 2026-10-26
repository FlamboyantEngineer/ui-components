import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { SearchField } from '../search-field/search-field.js';
const hooks = createHooks('find-bar', [
    'query',
    'status',
    'previous',
    'next',
    'options',
    'replacement',
    'replace',
    'replace-all',
    'close',
]);
const noOptions = [];
/** What the status reads: searching, the current match of the total, the total, no results, or nothing. */
function describeStatus({ matchCount, currentIndex = -1, isPending }, strings) {
    if (isPending)
        return strings.searching;
    if (matchCount === undefined)
        return '';
    if (matchCount === 0)
        return strings.noResults;
    if (currentIndex >= 0 && currentIndex < matchCount) {
        return strings.stepOfTotal(currentIndex + 1, matchCount);
    }
    return strings.matchTotal(matchCount);
}
/** The menu of matching options, each one checked while it is on; choosing one keeps it open. */
function FindBarOptions(props) {
    const strings = useUiStrings();
    const { options } = props;
    const [selected, setSelected] = useControllableState(props.selectedOptions, props.defaultSelectedOptions ?? noOptions, (keys) => props.onSelectedOptionsChange?.(new Set(keys)));
    return (_jsx(DropdownMenu, { className: hooks.slotClass('options'), iconOnly: true, icon: "chevron-down", label: strings.findOptions, size: "sm", selectionMode: "multiple", shouldCloseOnSelect: false, selectedKeys: selected, onSelectionChange: (keys) => setSelected(keys === 'all' ? new Set(options.map(({ id }) => id)) : new Set(keys)), items: options.map(({ id, label }) => ({ id, label })) }));
}
/** The replacement box with the Replace and Replace all buttons the caller asked for. */
function FindBarReplace({ hasMatches, ...props }) {
    const strings = useUiStrings();
    const { onReplace, onReplaceAll } = props;
    const [replacement, setReplacement] = useControllableState(props.replacement, props.defaultReplacement ?? '', props.onReplacementChange);
    const onKeyDown = (event) => {
        // The Enter that confirms a text composition replaces nothing.
        if (event.key !== 'Enter' || event.nativeEvent.isComposing)
            return;
        event.preventDefault();
        event.stopPropagation();
        if (hasMatches)
            onReplace?.(replacement);
    };
    return (_jsxs(_Fragment, { children: [_jsx(Input, { className: hooks.slotClass('replacement'), "aria-label": strings.replaceWith, value: replacement, onChange: (event) => setReplacement(event.target.value), onKeyDown: onKeyDown }), onReplace ? (_jsx(Button, { className: hooks.slotClass('replace'), size: "sm", variant: "ghost", isDisabled: !hasMatches, onPress: () => onReplace(replacement), children: strings.replace })) : null, onReplaceAll ? (_jsx(Button, { className: hooks.slotClass('replace-all'), size: "sm", variant: "ghost", isDisabled: !hasMatches, onPress: () => onReplaceAll(replacement), children: strings.replaceAll })) : null] }));
}
/** The find box, the match count and the Previous match and Next match buttons. */
function FindBarFind({ matchCount, currentIndex, isPending, onNext, onPrevious, ...props }) {
    const strings = useUiStrings();
    const [query, setQuery] = useControllableState(props.query, props.defaultQuery ?? '', props.onQueryChange);
    const hasMatches = (matchCount ?? 0) > 0;
    const onKeyDown = (event) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing)
            return;
        event.preventDefault();
        if (!hasMatches)
            return;
        if (event.shiftKey)
            onPrevious?.();
        else
            onNext?.();
    };
    return (_jsxs(_Fragment, { children: [_jsx(SearchField, { className: hooks.slotClass('query'), label: props.label ?? strings.find, placeholder: props.placeholder, size: "sm", value: query, onChange: setQuery, onKeyDown: onKeyDown, isPending: isPending, inputRef: props.inputRef }), _jsx("span", { ...hooks.slot('status'), role: "status", children: describeStatus({ matchCount, currentIndex, isPending }, strings) }), _jsx(Button, { className: hooks.slotClass('previous'), icon: "arrow-up", label: strings.previousMatch, size: "sm", isDisabled: !hasMatches, onPress: onPrevious }), _jsx(Button, { className: hooks.slotClass('next'), icon: "arrow-down", label: strings.nextMatch, size: "sm", isDisabled: !hasMatches, onPress: onNext })] }));
}
/**
 * A find row: the find box with the match count, previous and next match, optional matching
 * options, an optional replacement with Replace and Replace all, and an optional Close button. The
 * caller finds the matches and reports how many there are and which one is current. Enter and
 * Shift+Enter in the find box step through the matches, Enter in the replacement box replaces, and
 * Escape closes the bar when it can close.
 */
export function FindBar({ label, placeholder, query, defaultQuery, onQueryChange, matchCount, currentIndex, isPending = false, onNext, onPrevious, replacement, defaultReplacement, onReplacementChange, onReplace, onReplaceAll, options, selectedOptions, defaultSelectedOptions, onSelectedOptionsChange, onClose, inputRef, className, id, ...rest }) {
    const strings = useUiStrings();
    // Escape closes the bar before the find box would empty itself; a menu's Escape is the menu's own.
    const onKeyDownCapture = (event) => {
        if (event.key !== 'Escape' || !onClose)
            return;
        if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target))
            return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
    };
    const find = { label, placeholder, query, defaultQuery, onQueryChange, inputRef };
    const steps = { matchCount, currentIndex, isPending, onNext, onPrevious };
    const replace = { replacement, defaultReplacement, onReplacementChange, onReplace, onReplaceAll };
    const selection = { selectedOptions, defaultSelectedOptions, onSelectedOptionsChange };
    const hasMatches = (matchCount ?? 0) > 0;
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { pending: isPending } }), id: id, onKeyDownCapture: onKeyDownCapture, children: [_jsx(FindBarFind, { ...find, ...steps }), options && options.length > 0 ? _jsx(FindBarOptions, { ...selection, options: options }) : null, onReplace || onReplaceAll ? _jsx(FindBarReplace, { ...replace, hasMatches: hasMatches }) : null, onClose ? (_jsx(Button, { className: hooks.slotClass('close'), icon: "close", label: strings.close, size: "sm", onPress: onClose })) : null] }));
}
//# sourceMappingURL=find-bar.js.map