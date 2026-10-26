import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { createFilterCondition, FilterConditionFields, isFilterConditionComplete, } from '../filter-bar/filter-bar.js';
import { SelectField } from '../select-field/select-field.js';
import { ConditionActions } from './condition-actions.js';
import { conditionBuilderHooks as hooks, useConditionBuilder } from './condition-context.js';
/**
 * One rule: the field select, the operator and value of the field's type, the rule's menu and its
 * validation message. Choosing another field starts the rule over with that field's first operator.
 */
export function ConditionRuleRow({ rule, index, count }) {
    const strings = useUiStrings();
    const { fields, validate, actions, elementId } = useConditionBuilder();
    const messageId = useId();
    const field = fields.find((candidate) => candidate.id === rule.field);
    const isIncomplete = field !== undefined && !isFilterConditionComplete(rule, field);
    const message = validate?.(rule) ?? (isIncomplete ? strings.conditionIncomplete : null);
    const chooseField = (id) => {
        const next = fields.find((candidate) => candidate.id === id);
        if (next && next.id !== rule.field)
            actions.update({ ...rule, ...createFilterCondition(next) });
    };
    return (_jsxs("div", { ...hooks.slot('rule', { incomplete: isIncomplete, invalid: Boolean(message) }), id: elementId(rule.id), role: "group", "aria-label": strings.conditionRule(index + 1), "aria-describedby": message ? messageId : undefined, children: [_jsx(SelectField, { label: strings.filterField, labelLayout: "control-only", className: hooks.slotClass('field'), options: fields.map(({ id, label }) => ({ id, label })), value: rule.field, committedValue: rule.field, onChange: (id) => (id === null ? undefined : chooseField(String(id))) }), field ? (_jsx(FilterConditionFields, { field: field, condition: rule, onChange: (condition) => actions.update({ ...rule, ...condition }), labelLayout: "control-only", slotClass: hooks.slotClass })) : null, _jsx(ConditionActions, { id: rule.id, index: index, count: count }), message ? (_jsx("p", { ...hooks.slot('message'), id: messageId, children: message })) : null] }));
}
//# sourceMappingURL=condition-rule.js.map