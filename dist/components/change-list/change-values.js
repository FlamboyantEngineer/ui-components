import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { createInlineWordDiff, InlineTextDiff, } from '../inline-text-diff/inline-text-diff.js';
import { compareLists, isBlankValue } from './list-changes.js';
export const changeListHooks = createHooks('change-list', [
    'change',
    'text',
    'old',
    'new',
    'arrow',
    'items',
    'item',
    'side',
    'caption',
    'empty',
    'attribution',
]);
const hooks = changeListHooks;
const toText = (value) => typeof value === 'string' ? value : (value ?? []).join(', ');
// A blank value is unset: an empty text is a list of none, not a list of one empty item.
const toList = (value) => isBlankValue(value) ? [] : typeof value === 'string' ? [value] : [...(value ?? [])];
function ListItems({ items, renderValue, }) {
    return (_jsx("ul", { ...hooks.slot('items'), children: items.map(({ value, change }, index) => {
            const content = renderValue(value);
            return (_jsxs("li", { ...hooks.slot('item', { change }), children: [change === 'added' ? _jsx("ins", { children: content }) : null, change === 'removed' ? _jsx("del", { children: content }) : null, change === 'unchanged' ? content : null] }, `${change}:${value}:${index}`));
        }) }));
}
/** Old → new on one line: the word diff of a text, the changed items of a list, or both values. */
function CompactValues({ type, before, after, renderValue }) {
    const strings = useUiStrings();
    if (type === 'text') {
        const segments = createInlineWordDiff(toText(before), toText(after));
        return _jsx(InlineTextDiff, { segments: segments, className: hooks.slotClass('text') });
    }
    if (type === 'list') {
        const { before: old, after: next } = compareLists(toList(before), toList(after));
        const moved = [...old, ...next].filter((item) => item.change !== 'unchanged');
        return _jsx(ListItems, { items: moved, renderValue: renderValue });
    }
    const hasBoth = !isBlankValue(before) && !isBlankValue(after);
    return (_jsxs(_Fragment, { children: [isBlankValue(before) ? null : (_jsx("del", { ...hooks.slot('old'), children: renderValue(toText(before)) })), hasBoth ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('arrow'), "aria-hidden": "true", children: ' → ' }), _jsxs(VisuallyHidden, { children: [" ", strings.changedTo, " "] })] })) : null, isBlankValue(after) ? null : _jsx("ins", { ...hooks.slot('new'), children: renderValue(toText(after)) })] }));
}
/** One side of a detailed change: its caption, then its value or the empty placeholder. */
function Side({ side, children }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('side', { side }), children: [_jsx("span", { ...hooks.slot('caption'), children: side === 'before' ? strings.valueBefore : strings.valueAfter }), ' ', children ?? _jsx("span", { ...hooks.slot('empty'), children: strings.emptyValue })] }));
}
const keepOut = (kind) => (segment) => segment.kind !== kind;
/** The old and the new value of a detailed change, each drawn with what changed on its side. */
function DetailedValues({ type, before, after, renderValue }) {
    let old = null;
    let next = null;
    if (type === 'text') {
        const segments = createInlineWordDiff(toText(before), toText(after));
        const className = hooks.slotClass('text');
        if (!isBlankValue(before))
            old = _jsx(InlineTextDiff, { segments: segments.filter(keepOut('added')), className: className });
        if (!isBlankValue(after))
            next = (_jsx(InlineTextDiff, { segments: segments.filter(keepOut('removed')), className: className }));
    }
    else if (type === 'list') {
        const lists = compareLists(toList(before), toList(after));
        if (lists.before.length > 0)
            old = _jsx(ListItems, { items: lists.before, renderValue: renderValue });
        if (lists.after.length > 0)
            next = _jsx(ListItems, { items: lists.after, renderValue: renderValue });
    }
    else {
        if (!isBlankValue(before))
            old = _jsx("del", { ...hooks.slot('old'), children: renderValue(toText(before)) });
        if (!isBlankValue(after))
            next = _jsx("ins", { ...hooks.slot('new'), children: renderValue(toText(after)) });
    }
    return (_jsxs(_Fragment, { children: [_jsx(Side, { side: "before", children: old }), _jsx(Side, { side: "after", children: next })] }));
}
/** A change's values in the variant's arrangement. */
export function ChangeValues(props) {
    return props.variant === 'compact' ? _jsx(CompactValues, { ...props }) : _jsx(DetailedValues, { ...props });
}
//# sourceMappingURL=change-values.js.map