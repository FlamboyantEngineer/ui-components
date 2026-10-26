import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { Glyph, UiLink, useUiStrings } from '../../core/provider.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
export const redlineCompareHooks = createHooks('redline-compare', [
    'header',
    'summary',
    'navigation',
    'previous',
    'next',
    'columns',
    'column-label',
    'rows',
    'row',
    'marker',
    'cell',
    'block',
    'word',
    'mark',
    'notes',
    'note',
    'jump',
    'actions',
    'accept',
    'reject',
]);
const hooks = redlineCompareHooks;
/** Marks nest in this order, the first outermost. */
const markOrder = [
    'link',
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
];
const markElements = {
    bold: 'strong',
    italic: 'em',
    underline: 'u',
    strike: 's',
    code: 'code',
};
/** The name of a block's kind, with its level where the kind has one. */
export function nameBlockType(block, strings) {
    return strings.redlineBlockType(block.type, block.level ?? null);
}
/** Wraps text in one mark's element; a link with an unsafe destination draws as plain text. */
function wrapInMark(mark, content) {
    const props = hooks.slot('mark', { mark: mark.type });
    if (mark.type !== 'link') {
        const Element = markElements[mark.type];
        return _jsx(Element, { ...props, children: content });
    }
    if (mark.href === undefined || !isSafeUrl(mark.href))
        return _jsx("span", { ...props, children: content });
    return (_jsx(UiLink, { ...props, href: mark.href, children: content }));
}
function MarkedText({ run }) {
    const marks = [...run.marks].sort((a, b) => markOrder.indexOf(b.type) - markOrder.indexOf(a.type));
    return _jsx(_Fragment, { children: marks.reduce((content, mark) => wrapInMark(mark, content), run.text) });
}
/** A block's text on one side: kept words as they are, added words in `<ins>`, removed in `<del>`. */
export function RedlineBlock({ block, words }) {
    return (_jsx("div", { ...hooks.slot('block', { type: block.type, level: block.level }), children: words.map(({ change, runs }, index) => {
            const text = runs.map((run, at) => _jsx(MarkedText, { run: run }, at));
            if (change === 'equal')
                return _jsx("span", { children: text }, index);
            const Element = change === 'added' ? 'ins' : 'del';
            return (_jsx(Element, { ...hooks.slot('word', { change }), children: text }, index));
        }) }));
}
/** The counts of changed blocks and the buttons that move between changes. */
export function RedlineCompareHeader(props) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsx("p", { ...hooks.slot('summary'), children: strings.redlineSummary(props.counts) }), _jsxs("span", { ...hooks.slot('navigation'), children: [_jsx(Button, { icon: "chevron-up", size: "sm", label: strings.redlinePreviousChange, className: hooks.slotClass('previous'), isDisabled: !props.canMove.previous, onPress: () => props.onMove(-1) }), _jsx(Button, { icon: "chevron-down", size: "sm", label: strings.redlineNextChange, className: hooks.slotClass('next'), isDisabled: !props.canMove.next, onPress: () => props.onMove(1) })] })] }));
}
/** The labels over the two columns of a split compare, which the cells' content already conveys. */
export function RedlineCompareColumns({ labels }) {
    return (_jsxs("div", { ...hooks.slot('columns'), "aria-hidden": "true", children: [_jsx("span", { ...hooks.slot('column-label', { side: 'old' }), children: labels.old }), _jsx("span", { ...hooks.slot('column-label', { side: 'new' }), children: labels.new })] }));
}
const markerGlyphs = { changed: 'edit', added: 'plus', removed: 'minus', moved: 'move' };
/** The row's change glyph and its spoken description, which also describes its buttons. */
export function RedlineMarker(props) {
    return (_jsxs("span", { ...hooks.slot('marker', { change: props.change }), children: [props.change === 'unchanged' ? null : _jsx(Glyph, { name: markerGlyphs[props.change] }), _jsx(VisuallyHidden, { elementType: "span", id: props.labelId, children: props.label })] }));
}
//# sourceMappingURL=redline-compare-parts.js.map