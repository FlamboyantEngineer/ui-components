import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, VisuallyHidden, useNumberFormatter, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Icon } from '../icon/icon.js';
const hooks = createHooks('steps', [
    'item',
    'step',
    'marker',
    'text',
    'label',
    'optional',
    'description',
    'connector',
]);
const statusGlyphs = { complete: 'check', error: 'error', skipped: 'minus' };
/** The status of the step at `index`: its own, else read from where it sits against the current one. */
function resolveStepStatus(item, index, currentIndex) {
    if (item.status)
        return item.status;
    if (currentIndex === -1 || index > currentIndex)
        return 'upcoming';
    return index === currentIndex ? 'current' : 'complete';
}
/** The decorative marker: a glyph for a settled step, else the step's number. */
function StepMarker({ status, index }) {
    const format = useNumberFormatter();
    const glyph = status in statusGlyphs ? statusGlyphs[status] : null;
    return (_jsx("span", { ...hooks.slot('marker'), "aria-hidden": "true", children: glyph ? _jsx(Icon, { glyph: glyph, size: "sm" }) : format.format(index + 1) }));
}
/** The label with the status words assistive technology reads after it, then the extra lines. */
function StepText({ item, status, isCurrent, isCompact, isComplete, isLast }) {
    const strings = useUiStrings();
    const settled = status === 'complete' || status === 'error' || status === 'skipped';
    const label = (_jsxs("span", { ...hooks.slot('label'), children: [item.label, settled ? (_jsxs(_Fragment, { children: [' ', _jsx(VisuallyHidden, { children: strings.stepStatus(status) })] })) : null] }));
    return (_jsxs("span", { ...hooks.slot('text'), children: [isCompact && !isCurrent ? (_jsxs(_Fragment, { children: [_jsx(VisuallyHidden, { children: label }), isComplete && isLast ? strings.stepStatus('complete') : null] })) : (label), item.isOptional && !isCompact ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('optional'), children: strings.optional })] })) : null, isCompact || isEmptyNode(item.description) ? null : (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('description'), children: item.description })] }))] }));
}
function Step(props) {
    const { item, index, status, isCurrent, isLast, isDisabled, onAction } = props;
    const content = (_jsxs(_Fragment, { children: [_jsx(StepMarker, { status: status, index: index }), _jsx(StepText, { ...props })] }));
    const canPress = Boolean(onAction) && !isCurrent && status !== 'upcoming' && status !== 'current';
    return (_jsxs("li", { ...hooks.slot('item', { status, current: isCurrent, disabled: isDisabled }), "aria-current": isCurrent ? 'step' : undefined, children: [canPress ? (_jsx(AriaButton, { className: hooks.slotClass('step'), isDisabled: isDisabled, onPress: () => onAction?.(item.id), children: content })) : (_jsx("span", { ...hooks.slot('step'), children: content })), isLast ? null : _jsx("span", { ...hooks.slot('connector'), "aria-hidden": "true" })] }));
}
/**
 * An ordered list of the steps of a task with where each one stands, the current one marked with
 * `aria-current="step"`. Steps already reached can be pressed to return to them.
 */
export function Steps({ items, currentId = null, isComplete = false, orientation = 'horizontal', variant = 'default', onAction, isDisabled = false, className, ...rest }) {
    const strings = useUiStrings();
    const currentIndex = items.findIndex((item) => item.id === currentId);
    const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
    return (_jsx("ol", { "aria-label": named ? undefined : strings.steps, ...rest, ...hooks.root({
            className,
            props: rest,
            data: { orientation, variant, complete: isComplete },
        }), children: items.map((item, index) => (_jsx(Step, { item: item, index: index, status: isComplete ? 'complete' : resolveStepStatus(item, index, currentIndex), isCurrent: !isComplete && index === currentIndex, isComplete: isComplete, isLast: index === items.length - 1, isCompact: variant === 'compact', isDisabled: isDisabled || Boolean(item.isDisabled), onAction: onAction }, toKeyIdentity(item.id)))) }));
}
//# sourceMappingURL=steps.js.map