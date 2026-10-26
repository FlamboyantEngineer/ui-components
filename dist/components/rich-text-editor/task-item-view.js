import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEditorEventCallback, useStopEvent, } from '@handlewithcare/react-prosemirror';
import { useContext, useRef } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { RichTextEditorContext, richTextEditorHooks as hooks } from './rich-text-context.js';
/** A task list item drawn by the editor: a checkbox that ticks the task, then its content. */
export function TaskItemView({ children, nodeProps, ref, className, ...props }) {
    const strings = useUiStrings();
    const isEditable = useContext(RichTextEditorContext)?.isEditable ?? false;
    const box = useRef(null);
    const isChecked = nodeProps.node.attrs.checked === true;
    const setChecked = useEditorEventCallback((view, checked) => {
        view.dispatch(view.state.tr.setNodeAttribute(nodeProps.getPos(), 'checked', checked));
    });
    // The editor leaves events on the checkbox to it, so a press ticks the box instead of moving the caret.
    useStopEvent((_view, event) => box.current?.contains(event.target) ?? false);
    const hookProps = hooks.slot('task-item', { checked: isChecked });
    return (_jsxs("li", { ...props, ...hookProps, className: mergeClassNames(hookProps.className, className), ref: ref, children: [_jsx("span", { ...hooks.slot('task-checkbox'), ref: box, contentEditable: false, children: _jsx(Checkbox, { size: "sm", "aria-label": strings.taskDone, isSelected: isChecked, isReadOnly: !isEditable, onChange: setChecked }) }), _jsx("div", { ...hooks.slot('task-content'), ref: nodeProps.contentDOMRef, children: children })] }));
}
//# sourceMappingURL=task-item-view.js.map