import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { ConditionActions } from './condition-actions.js';
import { conditionBuilderHooks as hooks, useConditionBuilder } from './condition-context.js';
import { ConditionRuleRow } from './condition-rule.js';
/**
 * A group: the choice between matching all and any of its rules, its menu (except at the root), its
 * rules and nested groups in order, and buttons that add a rule and, above the depth limit, a group.
 */
export function ConditionGroupView({ group, depth, index, count }) {
    const strings = useUiStrings();
    const { maxDepth, actions, elementId } = useConditionBuilder();
    const isRoot = index === undefined;
    const size = group.rules.length;
    return (_jsxs("div", { ...hooks.slot('group', { depth, combinator: group.combinator }), id: elementId(group.id), role: isRoot ? undefined : 'group', "aria-label": isRoot ? undefined : strings.conditionGroup, children: [_jsxs("div", { ...hooks.slot('group-header'), children: [_jsx(SegmentedChoice, { "aria-label": strings.conditionCombinator, size: "sm", className: hooks.slotClass('combinator'), options: [
                            { value: 'and', label: strings.combinatorAnd },
                            { value: 'or', label: strings.combinatorOr },
                        ], value: group.combinator, onChange: (combinator) => {
                            if (combinator)
                                actions.update({ ...group, combinator: combinator });
                        } }), isRoot ? null : _jsx(ConditionActions, { id: group.id, index: index, count: count ?? 1 })] }), size > 0 ? (_jsx("ul", { ...hooks.slot('rules'), children: group.rules.map((node, at) => (_jsx("li", { ...hooks.slot('item'), children: node.type === 'group' ? (_jsx(ConditionGroupView, { group: node, depth: depth + 1, index: at, count: size })) : (_jsx(ConditionRuleRow, { rule: node, index: at, count: size })) }, node.id))) })) : (_jsx("p", { ...hooks.slot('empty'), children: strings.noRules })), _jsxs("div", { ...hooks.slot('group-actions'), children: [_jsx(Button, { id: elementId(group.id, 'add'), variant: "ghost", size: "sm", startIcon: "plus", className: hooks.slotClass('add-rule'), onPress: () => actions.addRule(group.id), children: strings.addRule }), depth < maxDepth ? (_jsx(Button, { variant: "ghost", size: "sm", startIcon: "plus", className: hooks.slotClass('add-group'), onPress: () => actions.addGroup(group.id), children: strings.addGroup })) : null] })] }));
}
//# sourceMappingURL=condition-group.js.map