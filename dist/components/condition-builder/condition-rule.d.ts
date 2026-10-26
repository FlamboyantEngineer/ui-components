import type { ConditionRule } from './condition-tree.js';
export interface ConditionRuleRowProps {
    rule: ConditionRule;
    index: number;
    count: number;
}
/**
 * One rule: the field select, the operator and value of the field's type, the rule's menu and its
 * validation message. Choosing another field starts the rule over with that field's first operator.
 */
export declare function ConditionRuleRow({ rule, index, count }: ConditionRuleRowProps): import("react").JSX.Element;
//# sourceMappingURL=condition-rule.d.ts.map