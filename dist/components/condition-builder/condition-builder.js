import { jsx as _jsx } from "react/jsx-runtime";
import { useId } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { createFilterCondition } from '../filter-bar/filter-bar.js';
import { ConditionBuilderContext, conditionBuilderHooks, } from './condition-context.js';
import { ConditionGroupView } from './condition-group.js';
import { copyConditionNode, findConditionNode, moveConditionNode, removeConditionNode, replaceConditionNode, } from './condition-tree.js';
const emptyTree = { type: 'group', id: 'root', combinator: 'and', rules: [] };
function findFocusTarget({ elementId, selector }) {
    const element = document.getElementById(elementId);
    const target = selector ? element?.querySelector(selector) : element;
    return target instanceof HTMLElement ? target : null;
}
/** Moves focus to the requested element after the render that drew it. */
function useNodeFocusRequest() {
    const request = useFocusRequest();
    return (target) => request(() => findFocusTarget(target));
}
function useBuilderActions(options) {
    const { tree, setTree, fields, elementId } = options;
    const createId = useIdFactory();
    const requestFocus = useNodeFocusRequest();
    const newRule = () => {
        const field = fields[0];
        return field ? { type: 'rule', id: createId(), ...createFilterCondition(field) } : null;
    };
    /** Appends `node` to a group and focuses the first control of its first rule. */
    const append = (groupId, node, focusId) => {
        const group = findConditionNode(tree, groupId);
        if (group?.type !== 'group')
            return;
        setTree(replaceConditionNode(tree, groupId, { ...group, rules: [...group.rules, node] }));
        requestFocus({ elementId: elementId(focusId), selector: 'button' });
    };
    const parentOf = (id, group = tree) => group.rules.some((node) => node.id === id)
        ? group
        : group.rules
            .filter((node) => node.type === 'group')
            .map((node) => parentOf(id, node))
            .find(Boolean);
    return {
        update: (node) => setTree(replaceConditionNode(tree, node.id, node)),
        remove: (id) => {
            const parent = parentOf(id);
            setTree(removeConditionNode(tree, id));
            if (parent)
                requestFocus({ elementId: elementId(parent.id, 'add') });
        },
        move: (id, delta) => {
            setTree(moveConditionNode(tree, id, delta));
            requestFocus({
                elementId: elementId(id),
                selector: `.${conditionBuilderHooks.slotClass('actions')} button`,
            });
        },
        duplicate: (id) => {
            const node = findConditionNode(tree, id);
            const parent = parentOf(id);
            if (!node || !parent)
                return;
            const copy = copyConditionNode(node, createId);
            const at = parent.rules.indexOf(node) + 1;
            setTree(replaceConditionNode(tree, parent.id, {
                ...parent,
                rules: parent.rules.toSpliced(at, 0, copy),
            }));
            requestFocus({ elementId: elementId(copy.id), selector: 'button' });
        },
        addRule: (groupId) => {
            const rule = newRule();
            if (rule)
                append(groupId, rule, rule.id);
        },
        addGroup: (groupId) => {
            const rule = newRule();
            const group = {
                type: 'group',
                id: createId(),
                combinator: 'and',
                rules: rule ? [rule] : [],
            };
            append(groupId, group, rule?.id ?? group.id);
        },
    };
}
/**
 * Edits a boolean expression as nested groups: each group matches all or any of its rules, and each
 * rule tests one field with an operator and a value of the field's type, using the same field
 * definitions and editors as `FilterBar`. Rules and groups are added, duplicated, deleted and moved
 * among their siblings from their menus or with Alt+Arrow keys, groups nest up to `maxDepth`, and
 * each rule shows its validation message. The value is a plain tree.
 */
export function ConditionBuilder({ fields, value, defaultValue = emptyTree, onChange, maxDepth = 3, validate, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const [tree, setTree] = useControllableState(value, defaultValue, onChange);
    const baseId = useId();
    const elementId = (id, part) => `${baseId}-${part ?? 'node'}-${id}`;
    const actions = useBuilderActions({ tree, setTree, fields, elementId });
    return (_jsx("div", { ...rest, ...conditionBuilderHooks.root({ className, props: rest }), role: "group", "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.conditions), children: _jsx(ConditionBuilderContext, { value: { fields, maxDepth, validate, actions, elementId }, children: _jsx(ConditionGroupView, { group: tree, depth: 1 }) }) }));
}
export { matchesConditionGroup } from './condition-tree.js';
//# sourceMappingURL=condition-builder.js.map