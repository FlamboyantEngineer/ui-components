import type { FilterField } from '../filter-bar/filter-bar.js';
import type { ConditionNode, ConditionRule } from './condition-tree.js';
/** Checks a rule; a message makes it invalid. */
export type ConditionRuleValidator = (rule: ConditionRule) => string | null | undefined;
/** The edits a rule or a group asks the builder for. */
export interface ConditionBuilderActions {
    update(node: ConditionNode): void;
    remove(id: string): void;
    move(id: string, delta: -1 | 1): void;
    duplicate(id: string): void;
    addRule(groupId: string): void;
    addGroup(groupId: string): void;
}
export interface ConditionBuilderContextValue {
    fields: readonly FilterField[];
    maxDepth: number;
    validate: ConditionRuleValidator | undefined;
    actions: ConditionBuilderActions;
    /** The element id of a node, or of a group's add-rule button. */
    elementId(id: string, part?: 'add'): string;
}
export declare const conditionBuilderHooks: import("../../core/hooks.js").ComponentHooks<"value" | "operator" | "empty" | "actions" | "message" | "field" | "group" | "item" | "rules" | "rule" | "combinator" | "group-header" | "group-actions" | "add-rule" | "add-group">;
export declare const ConditionBuilderContext: import("react").Context<ConditionBuilderContextValue | null>;
/** The builder a rule or a group belongs to. */
export declare function useConditionBuilder(): ConditionBuilderContextValue;
//# sourceMappingURL=condition-context.d.ts.map