import type { ConditionGroup } from './condition-tree.js';
export interface ConditionGroupViewProps {
    group: ConditionGroup;
    /** 1 for the root group. */
    depth: number;
    /** Its position among its siblings; absent for the root group. */
    index?: number | undefined;
    /** How many siblings it has, itself included. */
    count?: number | undefined;
}
/**
 * A group: the choice between matching all and any of its rules, its menu (except at the root), its
 * rules and nested groups in order, and buttons that add a rule and, above the depth limit, a group.
 */
export declare function ConditionGroupView({ group, depth, index, count }: ConditionGroupViewProps): import("react").JSX.Element;
//# sourceMappingURL=condition-group.d.ts.map