import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ProseMirror, ProseMirrorDoc } from '@handlewithcare/react-prosemirror';
import { useCallback, useMemo, useRef, useState } from 'react';
import { createEditorPlugins, createEditorState, decoratePlaceholder, replaceDocument, } from './editor-state.js';
import { RichTextEditorContext, richTextEditorHooks as hooks, } from './rich-text-context.js';
import { TaskItemView } from './task-item-view.js';
const nodeViewComponents = { taskItem: TaskItemView };
/**
 * The engine state, kept in step with the field's value: an edit reports the new document, and a
 * value that differs from the shown document (a controlled change, a restore, a field undo)
 * replaces it.
 */
function useSyncedEditorState(schema, value, onChange) {
    const plugins = useMemo(() => createEditorPlugins(schema), [schema]);
    const [state, setState] = useState(() => createEditorState(schema, value, plugins));
    const [shown, setShown] = useState(value);
    if (state.schema !== schema) {
        setState(createEditorState(schema, value, plugins));
    }
    else if (value !== shown) {
        setShown(value);
        setState(replaceDocument(state, value));
    }
    const dispatchTransaction = useCallback((tr) => {
        setState((current) => current.apply(tr));
        if (!tr.docChanged)
            return;
        const next = tr.doc.toJSON();
        setShown(next);
        onChange(next);
    }, [onChange]);
    return { state, dispatchTransaction };
}
/** The editable document inside the field: its toolbar, the content and the floating chrome. */
export function EditorSurface(props) {
    const { control, schema, placeholder } = props;
    const { state, dispatchTransaction } = useSyncedEditorState(schema, props.value, props.onChange);
    const surfaceRef = useRef(null);
    const [contentAttributes, setContentAttributes] = useState({});
    const isEditable = !control.readOnly && !control.disabled;
    const context = useMemo(() => ({ isEditable, surfaceRef, setContentAttributes }), [isEditable]);
    const placeholderClass = hooks.slotClass('placeholder');
    const decorations = useCallback((current) => decoratePlaceholder(current, placeholder, placeholderClass), [placeholder, placeholderClass]);
    return (_jsx(ProseMirror, { state: state, dispatchTransaction: dispatchTransaction, editable: () => isEditable, decorations: decorations, nodeViewComponents: nodeViewComponents, children: _jsx(RichTextEditorContext, { value: context, children: _jsxs("div", { ...hooks.slot('frame'), children: [props.toolbar ? _jsx("div", { ...hooks.slot('toolbar'), children: props.toolbar }) : null, _jsxs("div", { ...hooks.slot('surface'), ref: surfaceRef, style: { position: 'relative' }, children: [_jsx(ProseMirrorDoc, { ...contentAttributes, ...hooks.slot('content', { readonly: control.readOnly, disabled: control.disabled }), ref: control.ref, id: control.id, role: "textbox", "aria-multiline": "true", "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], "aria-describedby": control['aria-describedby'], "aria-errormessage": control['aria-errormessage'], "aria-invalid": control['aria-invalid'], "aria-required": control['aria-required'], "aria-readonly": control.readOnly || undefined, "aria-disabled": control.disabled || undefined, "aria-placeholder": placeholder, tabIndex: control.readOnly && !control.disabled ? 0 : undefined }), props.children] })] }) }) }));
}
//# sourceMappingURL=editor-surface.js.map