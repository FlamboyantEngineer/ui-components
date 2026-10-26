import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
export const problemListHooks = createHooks('problem-list', [
    'title',
    'summary',
    'items',
    'item',
    'jump',
    'icon',
    'label',
    'message',
]);
const hooks = problemListHooks;
/** The glyph, the severity read aloud, the label and the message of one problem. */
function ProblemText({ problem }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx(Icon, { glyph: problem.severity, className: hooks.slotClass('icon') }), _jsx(VisuallyHidden, { elementType: "span", children: `${strings.problemSeverity(problem.severity)}:` }), ' ', problem.label ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('label'), children: problem.label }), ' '] })) : null, _jsx("span", { ...hooks.slot('message'), children: problem.message })] }));
}
/** The problems, each a button that reaches its field when it can, else plain text. */
export function ProblemItems({ problems, onAction, }) {
    return (_jsx("ul", { ...hooks.slot('items'), children: problems.map((problem) => (_jsx("li", { ...hooks.slot('item', { severity: problem.severity }), children: problem.focus || onAction ? (_jsx(Button, { className: hooks.slotClass('jump'), variant: "bare", onPress: () => {
                    problem.focus?.();
                    onAction?.(problem.id);
                }, children: _jsx(ProblemText, { problem: problem }) })) : (_jsx(ProblemText, { problem: problem })) }, toKeyIdentity(problem.id)))) }));
}
//# sourceMappingURL=problem-list-items.js.map