import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEditorEffect, useEditorEventListener, useEditorState, } from '@handlewithcare/react-prosemirror';
import { TextSelection } from 'prosemirror-state';
import { useRef, useState } from 'react';
import { Popover, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ToolbarRow } from '../layout/layout.js';
import { useLayerZIndex } from '../portal/portal.js';
import { FormatButtons, LinkButton } from './format-controls.js';
import { getMarkItems } from './format-items.js';
import { useRichTextEditorContext } from './rich-text-context.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';
const hooks = createHooks('selection-toolbar', ['row', 'link-editor']);
/** Whether focus moved to the toolbar or the link editor it opened, which keep it open. */
function isInsideToolbar(target, toolbar) {
    if (!(target instanceof Element))
        return false;
    return Boolean(toolbar?.contains(target) || target.closest(`.${hooks.slotClass('link-editor')}`));
}
/**
 * React Aria places an open popover again only when its placement changes, so a moved selection
 * alternates between the logical and the physical spelling of the same placement.
 */
function useFollowedPlacement(key) {
    const { direction } = useLocale();
    const [spelling, setSpelling] = useState({ key, isPhysical: false });
    if (spelling.key !== key)
        setSpelling({ key, isPhysical: !spelling.isPhysical });
    if (!spelling.isPhysical)
        return 'top start';
    return direction === 'rtl' ? 'top right' : 'top left';
}
/** The viewport box of a selected text range, or null for a caret or a node selection. */
function useSelectionBox() {
    const state = useEditorState();
    const [box, setBox] = useState(null);
    useEditorEffect((view) => {
        const { selection } = view.state;
        if (selection.empty || !(selection instanceof TextSelection))
            return setBox(null);
        const start = view.coordsAtPos(selection.from);
        const end = view.coordsAtPos(selection.to);
        const [left, right] = [Math.min(start.left, end.left), Math.max(start.right, end.right)];
        const key = `${selection.from}:${selection.to}:${left}:${start.top}:${right}:${end.bottom}`;
        const rect = new DOMRect(left, start.top, right - left, end.bottom - start.top);
        setBox((current) => (current?.key === key ? current : { key, rect }));
    }, [state]);
    return box;
}
/**
 * A toolbar floating above selected text in the enclosing `RichTextEditor`, for its children: the
 * marks and the link button. Alt+F10 moves focus into it from the document and Escape returns.
 */
export function SelectionToolbar({ className, children, ...rest }) {
    const strings = useUiStrings();
    const controller = useRichTextController();
    const focusReturn = useFocusReturn(controller);
    const { surfaceRef } = useRichTextEditorContext('SelectionToolbar');
    const zIndex = useLayerZIndex('dropdown');
    const box = useSelectionBox();
    const rowRef = useRef(null);
    const [hasEditorFocus, setEditorFocus] = useState(false);
    const [hasOwnFocus, setOwnFocus] = useState(false);
    const [dismissed, setDismissed] = useState(null);
    const placement = useFollowedPlacement(box?.key ?? '');
    const isOpen = box !== null &&
        controller.isEditable &&
        dismissed !== box.key &&
        (hasEditorFocus || hasOwnFocus);
    useEditorEventListener('focus', () => (setEditorFocus(true), false));
    useEditorEventListener('blur', (_view, event) => {
        if (!isInsideToolbar(event.relatedTarget, rowRef.current))
            setEditorFocus(false);
        return false;
    });
    useEditorEventListener('keydown', (_view, event) => {
        if (!isOpen || !event.altKey || event.key !== 'F10')
            return false;
        rowRef.current?.querySelector('button:not([disabled])')?.focus();
        event.preventDefault();
        return true;
    });
    const onKeyDown = (event) => {
        if (event.key !== 'Escape')
            return;
        event.preventDefault();
        setDismissed(box?.key ?? null);
        controller.focus();
    };
    const onBlur = (event) => {
        if (!isInsideToolbar(event.relatedTarget, rowRef.current))
            setOwnFocus(false);
    };
    const label = rest['aria-labelledby']
        ? undefined
        : (rest['aria-label'] ?? strings.selectionFormatting);
    return (_jsx(Popover, { ...hooks.root({ className, props: rest }), isOpen: isOpen, isNonModal: true, triggerRef: surfaceRef, getTargetRect: () => box?.rect ?? null, placement: placement, offset: 6, style: { zIndex }, children: _jsx("div", { ref: focusReturn.ref, onFocus: () => setOwnFocus(true), onBlur: onBlur, onKeyDown: onKeyDown, children: _jsxs(ToolbarRow, { ref: rowRef, className: hooks.slotClass('row'), "aria-label": label, "aria-labelledby": rest['aria-labelledby'], justify: "start", space: "xs", children: [_jsx(FormatButtons, { controller: controller, items: getMarkItems(strings) }), controller.supports({ type: 'set-link', href: null }) ? (_jsx(LinkButton, { controller: controller, className: hooks.slotClass('link-editor'), onCommand: focusReturn.request })) : null, children] }) }) }));
}
//# sourceMappingURL=selection-toolbar.js.map