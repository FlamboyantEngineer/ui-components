import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { isStepDirty, readStepValue } from './step-list.js';
import { useStepRowDrag } from './use-step-drag.js';
export const stepListEditorHooks = createHooks('step-list-editor', [
    'header',
    'heading',
    'steps',
    'step',
    'handle',
    'number',
    'fields',
    'field',
    'actions',
    'empty',
    'add',
]);
const hooks = stepListEditorHooks;
const moveKeys = { ArrowUp: -1, ArrowDown: 1 };
/** A step's menu: insert above or below, duplicate, move up or down, and delete. */
function StepMenu({ id, index, count, number, onAction }) {
    const strings = useUiStrings();
    const disabledKeys = [];
    if (index === 0)
        disabledKeys.push('up');
    if (index === count - 1)
        disabledKeys.push('down');
    return (_jsx(DropdownMenu, { iconOnly: true, label: strings.stepActions(number), variant: "ghost", size: "sm", placement: "bottom end", className: hooks.slotClass('actions'), items: [
            { id: 'insert-above', label: strings.insertStepAbove },
            { id: 'insert-below', label: strings.insertStepBelow },
            { id: 'duplicate', label: strings.duplicate },
            { id: 'up', label: strings.moveItem('up') },
            { id: 'down', label: strings.moveItem('down') },
            { id: 'delete', label: strings.delete },
        ], disabledKeys: disabledKeys, onAction: (key) => onAction(key, id) }));
}
/**
 * One step: a drag handle, its number, a multi-line text field per column and its menu while
 * editable. Alt+ArrowUp and Alt+ArrowDown anywhere in the step move it.
 */
export function StepRow(props) {
    const { step, number, columns, committed, isReadOnly, drag, onChange, onStep } = props;
    const strings = useUiStrings();
    const label = strings.stepLabel(number);
    const row = useStepRowDrag({ id: step.id, label, drag: isReadOnly ? null : drag });
    const onKeyDownCapture = (event) => {
        const delta = moveKeys[event.key];
        // Keys from an open menu reach the step through its portal; only the step's own keys move it.
        if (!delta || !isMoveChord(event) || !event.currentTarget.contains(event.target)) {
            return;
        }
        // Captured before the menu button, which would open its menu on Alt+ArrowDown.
        event.preventDefault();
        event.stopPropagation();
        if (!isReadOnly)
            onStep(step.id, delta);
    };
    const isDirty = committed !== undefined &&
        isStepDirty(step, committed ?? undefined, columns.map(({ id }) => id));
    // A field marks its own edit against the committed step; a new step is marked as a whole.
    const readCommitted = (column) => readStepValue(committed ?? step, column);
    return (_jsxs("li", { ref: row.ref, ...row.props, ...hooks.slot('step', {
            dirty: isDirty,
            dragging: row.isDragging,
            dropTarget: row.dropPosition !== null,
            position: row.dropPosition,
        }), "data-key": step.id, onKeyDownCapture: onKeyDownCapture, children: [isReadOnly ? null : (_jsx(Button, { icon: "drag-handle", size: "sm", label: strings.moveStep(number), className: hooks.slotClass('handle'), ...row.handleProps })), _jsx("span", { ...hooks.slot('number'), "aria-hidden": "true", children: number }), _jsx("div", { ...hooks.slot('fields'), role: "group", "aria-label": label, children: columns.map((column) => (_jsx(TextField, { className: hooks.slotClass('field'), "data-column": column.id, label: column.label, labelLayout: "control-only", multiline: true, minRows: 1, maxRows: 6, placeholder: column.placeholder, isReadOnly: isReadOnly, value: readStepValue(step, column.id), committedValue: readCommitted(column.id), onChange: (text) => onChange({ ...step, values: { ...step.values, [column.id]: text } }) }, column.id))) }), isReadOnly ? null : (_jsx(StepMenu, { id: step.id, index: props.index, count: props.count, number: number, onAction: props.onAction }))] }));
}
//# sourceMappingURL=step-row.js.map