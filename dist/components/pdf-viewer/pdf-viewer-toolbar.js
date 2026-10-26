import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Label, NumberField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { ToolbarScroller } from '../toolbar-scroller/toolbar-scroller.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { pdfZoomLevels } from './pdf-zoom.js';
import { PdfViewerSearch } from './pdf-viewer-search.js';
const wholePercent = { maximumFractionDigits: 0 };
const fitModes = [
    { zoom: 'page-width', glyph: 'fit-width', stringKey: 'fitWidth' },
    { zoom: 'page-fit', glyph: 'fit-page', stringKey: 'fitPage' },
];
/**
 * The toolbar moves focus with the left and right arrow keys; a text field inside it keeps them for
 * its caret, except at the ends of its text.
 */
function keepCaretKeys(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement) || field.selectionStart === null)
        return;
    const { selectionStart, selectionEnd, value } = field;
    const atStart = selectionStart === 0 && selectionEnd === 0;
    const atEnd = selectionStart === value.length && selectionEnd === value.length;
    if ((event.key === 'ArrowLeft' && !atStart) || (event.key === 'ArrowRight' && !atEnd)) {
        event.stopPropagation();
    }
}
/** The find state a caller's controls receive, without the viewer's highlight bookkeeping. */
function pickSearchControls(search) {
    const { query, setQuery, options, setOptions, isPending, total, current } = search;
    const { findNext, findPrevious } = search;
    return {
        query,
        setQuery,
        options,
        setOptions,
        isPending,
        total,
        current,
        findNext,
        findPrevious,
    };
}
/** The menu of document commands: rotating the pages, printing them and saving the file. */
function PdfViewerCommands({ isReady, commands }) {
    const strings = useUiStrings();
    return (_jsx(DropdownMenu, { iconOnly: true, icon: "more-vertical", label: strings.moreOptions, size: "sm", isDisabled: !isReady, items: [
            {
                id: 'rotate-clockwise',
                label: strings.rotateClockwise,
                onAction: () => commands.rotate(90),
            },
            {
                id: 'rotate-counterclockwise',
                label: strings.rotateCounterclockwise,
                onAction: () => commands.rotate(-90),
            },
            { type: 'separator', id: 'output' },
            { id: 'print', label: strings.print, onAction: commands.print },
            { id: 'download', label: strings.download, onAction: commands.download },
        ] }));
}
function PdfViewerPageNav({ isReady, pageCount, currentPage, onPageChange, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('group'), children: [_jsx(Button, { icon: "chevron-up", label: strings.previousPage, size: "sm", isDisabled: !isReady || currentPage <= 0, onPress: () => onPageChange(currentPage - 1) }), _jsxs(NumberField, { className: hooks.slotClass('page-field'), value: currentPage + 1, minValue: 1, maxValue: Math.max(pageCount, 1), formatOptions: { useGrouping: false }, isDisabled: !isReady, isWheelDisabled: true, onChange: (pageNumber) => {
                    if (Number.isFinite(pageNumber))
                        onPageChange(pageNumber - 1);
                }, children: [_jsx(Label, { className: hooks.slotClass('page-label'), children: strings.page }), _jsx(Input, { className: hooks.slotClass('page-input') })] }), _jsx("span", { ...hooks.slot('page-total'), children: strings.ofTotal(pageCount) }), _jsx(Button, { icon: "chevron-down", label: strings.nextPage, size: "sm", isDisabled: !isReady || currentPage >= pageCount - 1, onPress: () => onPageChange(currentPage + 1) })] }));
}
/**
 * The caller's leading actions, the sidebar toggle, zoom with its fit modes, page navigation, find,
 * the document commands and the caller's actions, in one toolbar.
 */
export function PdfViewerToolbar({ label, isReady, zoom, search, findFieldRef, sidebar, commands, onKeyDown, actions, leadingActions, renderSearch, ...page }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...hooks.slot('toolbar'), onKeyDownCapture: keepCaretKeys, onKeyDown: onKeyDown, children: _jsxs(ToolbarScroller, { "aria-label": strings.controlsFor(label), children: [leadingActions ? _jsx("div", { ...hooks.slot('leading-actions'), children: leadingActions }) : null, _jsx(Button, { icon: "sidebar", label: strings.sidebar, size: "sm", isSelected: sidebar.isOpen, isDisabled: !isReady, onPress: () => sidebar.setOpen(!sidebar.isOpen) }), _jsx(ZoomControl, { levels: pdfZoomLevels, value: zoom.percent, onChange: zoom.setZoom, formatOptions: wholePercent, isDisabled: !isReady }), fitModes.map(({ zoom: fit, glyph, stringKey }) => (_jsx(Button, { icon: glyph, label: strings[stringKey], size: "sm", isSelected: zoom.zoom === fit, isDisabled: !isReady, onPress: () => zoom.setZoom(fit) }, fit))), _jsx(PdfViewerPageNav, { isReady: isReady, ...page }), renderSearch ? (renderSearch(pickSearchControls(search))) : (_jsx(PdfViewerSearch, { search: search, fieldRef: findFieldRef })), _jsx(PdfViewerCommands, { isReady: isReady, commands: commands }), actions ? _jsx("div", { ...hooks.slot('actions'), children: actions }) : null] }) }));
}
//# sourceMappingURL=pdf-viewer-toolbar.js.map