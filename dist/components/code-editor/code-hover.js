import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState, } from 'react';
import { Popover } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLayerZIndex } from '../portal/portal.js';
import { findOffsetAt, measureRange, readCopyText } from './code-geometry.js';
import { codeEditorHooks as hooks } from './code-layers.js';
/** How long the tip stays after the pointer leaves, so the pointer can move into it. */
const LEAVE_DELAY = 200;
function diagnosticsAt(marked, offset) {
    return marked
        .filter(({ range }) => offset >= range.start && offset < range.end)
        .map(({ diagnostic }) => diagnostic);
}
/**
 * The hover tip of a code editor: the problems marked under the pointer and the caller's hover
 * information for that offset, read from the highlighted copy under the text area.
 */
export function useCodeHover({ inputRef, highlightRef, marked, renderHover, segments, }) {
    const [tip, setTip] = useState(null);
    const timer = useRef(null);
    const copy = useRef(null);
    // Pointer moves read the copy's text nodes from the last render instead of walking it each time.
    const readCopy = (highlight) => {
        const last = copy.current;
        if (last?.highlight === highlight && last.segments === segments)
            return last.text;
        copy.current = { highlight, segments, text: readCopyText(highlight) };
        return copy.current.text;
    };
    const hold = useCallback(() => {
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = null;
    }, []);
    const close = useCallback(() => {
        hold();
        setTip(null);
    }, [hold]);
    useEffect(() => hold, [hold]);
    const tipAt = (offset, range) => {
        const highlight = highlightRef.current;
        const rect = highlight ? measureRange(readCopy(highlight), range) : null;
        const diagnostics = diagnosticsAt(marked, offset);
        const info = renderHover?.(offset);
        if (!rect || (diagnostics.length === 0 && isEmptyNode(info)))
            return null;
        return { offset, rect, diagnostics, info };
    };
    const onPointerLeave = () => {
        hold();
        timer.current = setTimeout(() => setTip(null), LEAVE_DELAY);
    };
    return {
        tip,
        showAt: (range) => setTip(tipAt(range.start, range)),
        onPointerMove(event) {
            const highlight = highlightRef.current;
            if (!highlight || event.buttons !== 0 || inputRef.current === null)
                return;
            const offset = findOffsetAt(readCopy(highlight), event.clientX, event.clientY);
            if (offset !== null && offset === tip?.offset)
                return hold();
            const next = offset === null ? null : tipAt(offset, { start: offset, end: offset + 1 });
            if (next) {
                hold();
                setTip(next);
            }
            else if (tip && !timer.current)
                onPointerLeave();
        },
        onPointerLeave,
        hold,
        close,
    };
}
/** The hover tip: a non-modal popover on the tooltip layer, pointing at the hovered text. */
export function CodeHoverTooltip({ model, inputRef }) {
    const zIndex = useLayerZIndex('tooltip');
    const { tip } = model;
    return (_jsx(Popover, { className: hooks.slotClass('tooltip'), isOpen: tip !== null, onOpenChange: (open) => (open ? undefined : model.close()), isNonModal: true, triggerRef: inputRef, getTargetRect: () => tip?.rect, placement: "top start", offset: 4, style: { zIndex }, onPointerEnter: model.hold, onPointerLeave: model.onPointerLeave, children: _jsxs("div", { role: "tooltip", children: [tip?.diagnostics.map((diagnostic, index) => (_jsx("div", { ...hooks.slot('diagnostic', { severity: diagnostic.severity ?? 'error' }), children: diagnostic.message }, index))), tip?.info] }) }));
}
//# sourceMappingURL=code-hover.js.map