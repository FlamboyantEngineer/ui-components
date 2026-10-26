import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement, useId } from 'react';
import { Separator as AriaSeparator } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
const hooks = createHooks('separator', ['start-line', 'label', 'end-line']);
/** `elementType` or an `<hr>`, which turns into a `<div>` when it cannot hold the rule. */
function resolveElement(elementType, { orientation, isLabelled }) {
    const element = elementType ?? 'hr';
    return element === 'hr' && (isLabelled || orientation === 'vertical') ? 'div' : element;
}
/**
 * Finishes the building block's element props: a decorative rule drops the separator role, and a
 * labelled one gains its lines and label. The caller's `render` receives the finished props.
 */
function createDraw({ element, parts, render, decorative, orientation }) {
    return (props) => {
        const finished = { ...props };
        if (decorative) {
            finished.role = 'none';
            delete finished['aria-orientation'];
            delete finished['aria-label'];
            delete finished['aria-labelledby'];
        }
        if (parts !== null)
            finished.children = parts;
        return render
            ? render(finished, { orientation })
            : createElement(element, finished);
    };
}
/** The lines on both sides of a label, hidden from assistive technology. */
function SeparatorParts({ label, labelId }) {
    return (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('start-line'), "aria-hidden": "true" }), _jsx("span", { ...hooks.slot('label'), id: labelId, children: label }), _jsx("span", { ...hooks.slot('end-line'), "aria-hidden": "true" })] }));
}
/**
 * A rule between groups of content, horizontal or vertical, optionally
 * with a label drawn across it that also names it.
 */
export function Separator({ orientation = 'horizontal', variant = 'solid', label, labelPosition = 'center', decorative = false, elementType, render, className, ...rest }) {
    const labelId = useId();
    const isLabelled = !isEmptyNode(label);
    const element = resolveElement(elementType, { orientation, isLabelled });
    const isNamedByLabel = isLabelled && !decorative && !rest['aria-label'] && !rest['aria-labelledby'];
    const parts = isLabelled ? _jsx(SeparatorParts, { label: label, labelId: labelId }) : null;
    return (_jsx(AriaSeparator, { ...rest, ...hooks.root({
            className,
            props: rest,
            data: { orientation, variant, labelPosition: isLabelled ? labelPosition : undefined },
        }), orientation: orientation, elementType: element, "aria-labelledby": isNamedByLabel ? labelId : rest['aria-labelledby'], render: createDraw({ element, parts, render, decorative, orientation }) }));
}
//# sourceMappingURL=separator.js.map