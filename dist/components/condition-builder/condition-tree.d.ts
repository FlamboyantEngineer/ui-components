import { type FilterCondition, type FilterField, type FilterValueGetter } from '../filter-bar/filter-bar.js';
/** `and` matches when every rule of a group matches, `or` when any does. */
export type ConditionCombinator = 'and' | 'or';
/** One field–operator–value rule of a condition tree. */
export interface ConditionRule extends FilterCondition {
    type: 'rule';
    /** Stable among the tree's nodes. */
    id: string;
}
/** A group of rules and nested groups joined by a combinator. */
export interface ConditionGroup {
    type: 'group';
    /** Stable among the tree's nodes. */
    id: string;
    combinator: ConditionCombinator;
    rules: readonly ConditionNode[];
}
export type ConditionNode = ConditionRule | ConditionGroup;
/** The node `id` in the tree, or `undefined`. */
export declare function findConditionNode(group: ConditionGroup, id: string): ConditionNode | undefined;
/** The tree with node `id` replaced by `next` (the root itself included). */
export declare function replaceConditionNode(root: ConditionGroup, id: string, next: ConditionNode): ConditionGroup;
/** The tree without node `id`. */
export declare function removeConditionNode(root: ConditionGroup, id: string): ConditionGroup;
/** The tree with node `id` swapped with its previous (`-1`) or next (`1`) sibling, if it has one. */
export declare function moveConditionNode(root: ConditionGroup, id: string, delta: -1 | 1): ConditionGroup;
/** A copy of `node` and everything in it under new ids. */
export declare function copyConditionNode(node: ConditionNode, createId: () => string): ConditionNode;
/**
 * Whether a record matches a condition group: every active rule (`and`) or one of them (`or`),
 * nested groups counting as one rule. Rules missing their value, rules on unknown fields and groups
 * holding no active rule are left out; a group left with nothing matches every record.
 */
export declare function matchesConditionGroup<T>(record: T, group: ConditionGroup, options: {
    fields: readonly FilterField[];
    getValue: FilterValueGetter<T>;
}): boolean;
//# sourceMappingURL=condition-tree.d.ts.map