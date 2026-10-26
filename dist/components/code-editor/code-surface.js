import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { VisuallyHidden } from '../../primitives/index.js';
import { ControlCompletionList, } from '../completion-list/completion-list.js';
import { CodeScrollbars } from './code-scrollbars.js';
import { CodeArea } from './code-area.js';
import { CodeHoverTooltip } from './code-hover.js';
import { CodeDiagnostics, CodeGutter, codeEditorHooks as hooks, severitiesByLine, } from './code-layers.js';
import { CodeSearchPanel } from './code-search.js';
import { useCodeSurface } from './use-code-surface.js';
/** The diagnostics list, when listed, and the status that reads a problem out after F8. */
function CodeProblems(props) {
    return (_jsxs(_Fragment, { children: [props.isListed ? _jsx(CodeDiagnostics, { id: props.id, diagnostics: props.diagnostics }) : null, _jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('announcement'), role: "status", children: props.announcement })] }));
}
/** What sits around the surface: the problems, the completion list and the hover tip. */
function CodeEditorOverlays(props) {
    const { model, diagnostics, listId } = props;
    return (_jsxs(_Fragment, { children: [diagnostics ? (_jsx(CodeProblems, { id: props.diagnosticsId, diagnostics: diagnostics, isListed: props.isListed, announcement: model.announcement })) : null, listId ? (_jsx(ControlCompletionList, { model: model.completion, listId: listId, anchorRef: props.caretRef, className: hooks.slotClass('popover') })) : null, _jsx(CodeHoverTooltip, { model: model.hover, inputRef: model.layers.input })] }));
}
/**
 * A code editing surface: a native text area over a highlighted copy of the source, so the browser
 * keeps the caret, selection, undo and input methods. The language (tokens), the diagnostics and
 * the completions come from the caller. It can indent with Tab, pair brackets, match the bracket at
 * the caret, mark problems with hover tips, find and replace, number lines and show a toolbar row.
 */
function CodeSurfaceBody({ view }) {
    const { model, value, onChange, wrap, multiline, id, props, locks, inputRef, caretRef, baseId, problems, located, lineNumbers, firstLineNumber, textWidth, listId, } = view;
    const { layers } = model;
    return (_jsxs("div", { ...hooks.slot('surface'), children: [lineNumbers || located.length > 0 ? (_jsx(CodeGutter, { measurement: !lineNumbers, lines: value.split('\n'), firstLineNumber: firstLineNumber, severities: severitiesByLine(located), textWidth: textWidth, gutterRef: layers.gutter })) : null, _jsx(CodeArea, { model, value, onChange, wrap, multiline, props, locks, inputRef, caretRef, id: id ?? baseId, isInvalid: problems.isInvalid, listId: listId, describedBy: problems.describedBy }), multiline ? (_jsx(CodeScrollbars, { input: layers.input, gutter: layers.gutter, inputId: id ?? baseId, diagnostics: located, value: value, wrap: wrap })) : null] }));
}
/** Native textarea editing with highlighted layers, diagnostics and custom scrollbars. */
export function CodeSurface(props) {
    const view = useCodeSurface(props);
    const { model, toolbar, diagnostics, diagnosticsId, listId, caretRef, problems } = view;
    return (_jsxs("div", { ...hooks.root({ className: view.className, props: view.dataProps, data: view.data }), children: [toolbar ? _jsx("div", { ...hooks.slot('toolbar'), children: toolbar }) : null, model.search.isOpen ? (_jsx(CodeSearchPanel, { model: model.search, canReplace: !view.locks.isReadOnly && !view.locks.isDisabled })) : null, _jsx(CodeSurfaceBody, { view: view }), _jsx(CodeEditorOverlays, { model, diagnostics, diagnosticsId, listId, caretRef, isListed: problems.isListed })] }));
}
//# sourceMappingURL=code-surface.js.map