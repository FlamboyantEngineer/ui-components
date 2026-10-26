import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { formatOutlineNumber } from '../../utils/outline-number.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { insertStep, isStepListDirty, moveStep, removeStep, resolveStepMove, updateStep, } from './step-list.js';
import { StepRow, stepListEditorHooks as hooks, } from './step-row.js';
import { useStepDrag } from './use-step-drag.js';
const noSteps = [];
/** The step elements of the editor, by the step ids they carry. */
function findStepElement(root, id) {
    const steps = root?.querySelectorAll(`.${hooks.slotClass('step')}`) ?? [];
    return [...steps].find((step) => step.dataset['key'] === id);
}
function findFocusPart(step, part) {
    const selector = part === 'field' ? 'textarea, input' : `.${hooks.slotClass('actions')}`;
    return step?.querySelector(selector) ?? null;
}
/** The edits a step's menu, its keys and its drag make, each followed by a focus move. */
function useStepActions(options) {
    const { steps, setSteps, root } = options;
    const createId = useIdFactory();
    const requestFocus = useFocusRequest();
    const focusStep = (id, part) => requestFocus(() => findFocusPart(findStepElement(root.current, id), part));
    const insertAt = (index, values = {}) => {
        const step = { id: createId(), values };
        setSteps(insertStep(steps, index, step));
        focusStep(step.id, 'field');
    };
    const move = (move, focus) => {
        if (!move)
            return;
        setSteps(moveStep(steps, move));
        focus();
    };
    const run = (action, id) => {
        const index = steps.findIndex((step) => step.id === id);
        const step = steps[index];
        if (!step)
            return;
        if (action === 'insert-above')
            insertAt(index);
        else if (action === 'insert-below')
            insertAt(index + 1);
        else if (action === 'duplicate')
            insertAt(index + 1, step.values);
        else if (action === 'delete') {
            setSteps(removeStep(steps, id));
            const next = steps[index + 1] ?? steps[index - 1];
            if (next)
                focusStep(next.id, 'field');
            else
                requestFocus(() => root.current?.querySelector(`.${hooks.slotClass('add')}`));
        }
        else {
            move(resolveStepMove(steps, id, action === 'up' ? -1 : 1), () => focusStep(id, 'actions'));
        }
    };
    /** Alt+Arrow keys: focus stays on the element that had it, which the move may drop. */
    const step = (id, delta) => {
        const active = document.activeElement;
        move(resolveStepMove(steps, id, delta), () => requestFocus(() => (active instanceof HTMLElement && active.isConnected ? active : null)));
    };
    return { run, step, insertAt, move: (stepMove) => move(stepMove, () => { }) };
}
/**
 * Edits an ordered list of steps, each a numbered row with a multi-line text field per column
 * (such as an action, its data and its expected result). Steps are added, inserted above or below,
 * duplicated, moved and deleted from their menus, reordered by dragging their handles or with
 * Alt+ArrowUp and Alt+ArrowDown, and marked dirty against the committed steps. The value is plain
 * data.
 */
export function StepListEditor({ columns, value, defaultValue = noSteps, onChange, committedValue, isReadOnly = false, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const [steps, setSteps] = useControllableState(value, defaultValue, onChange);
    const root = useRef(null);
    const actions = useStepActions({ steps, setSteps, root });
    const drag = useStepDrag({ steps, onMove: actions.move });
    const committedById = useMemo(() => (committedValue ? new Map(committedValue.map((step) => [step.id, step])) : null), [committedValue]);
    const columnIds = columns.map(({ id }) => id);
    const isDirty = committedValue !== undefined && isStepListDirty(steps, committedValue, columnIds);
    const label = ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.steps);
    return (_jsxs("div", { ...rest, ref: root, ...hooks.root({ className, props: rest, data: { dirty: isDirty, readonly: isReadOnly } }), role: "group", "aria-label": label, children: [steps.length === 0 ? (_jsx(EmptyState, { size: "sm", description: strings.noSteps, className: hooks.slotClass('empty') })) : (_jsxs(_Fragment, { children: [_jsx("div", { ...hooks.slot('header'), "aria-hidden": "true", children: columns.map((column) => (_jsx("span", { ...hooks.slot('heading'), "data-column": column.id, children: column.label }, column.id))) }), _jsx("ol", { ...hooks.slot('steps'), children: steps.map((step, index) => (_jsx(StepRow, { step: step, index: index, count: steps.length, number: formatOutlineNumber([index]), columns: columns, committed: committedById ? (committedById.get(step.id) ?? null) : undefined, isReadOnly: isReadOnly, drag: drag, onChange: (next) => setSteps(updateStep(steps, next)), onAction: actions.run, onStep: actions.step }, step.id))) })] })), isReadOnly ? null : (_jsx(Button, { variant: "ghost", size: "sm", startIcon: "plus", className: hooks.slotClass('add'), onPress: () => actions.insertAt(steps.length), children: strings.addStep }))] }));
}
//# sourceMappingURL=step-list-editor.js.map