import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type FilterField } from '../filter-bar/filter-bar.js';
import { type ConditionRuleValidator } from './condition-context.js';
import { type ConditionGroup } from './condition-tree.js';
export interface ConditionBuilderProps extends BaseProps, AriaLabellingProps {
    /** The fields rules can test, as for a `FilterBar`. */
    fields: readonly FilterField[];
    /** The root group, controlled. */
    value?: ConditionGroup | undefined;
    /** The root group to start with, uncontrolled. Defaults to an empty `and` group. */
    defaultValue?: ConditionGroup | undefined;
    /** Called with the new root group after each change. */
    onChange?: ((value: ConditionGroup) => void) | undefined;
    /** The deepest level of groups, the root group being level 1. Defaults to 3. */
    maxDepth?: number | undefined;
    /** Checks each rule; a returned message shows under the rule and marks it invalid. */
    validate?: ConditionRuleValidator | undefined;
}
/**
 * Edits a boolean expression as nested groups: each group matches all or any of its rules, and each
 * rule tests one field with an operator and a value of the field's type, using the same field
 * definitions and editors as `FilterBar`. Rules and groups are added, duplicated, deleted and moved
 * among their siblings from their menus or with Alt+Arrow keys, groups nest up to `maxDepth`, and
 * each rule shows its validation message. The value is a plain tree.
 */
export declare function ConditionBuilder({ fields, value, defaultValue, onChange, maxDepth, validate, className, 'aria-label': ariaLabel, ...rest }: ConditionBuilderProps): import("react").JSX.Element;
export { matchesConditionGroup } from './condition-tree.js';
export type { ConditionCombinator, ConditionGroup, ConditionNode, ConditionRule, } from './condition-tree.js';
export type { ConditionRuleValidator } from './condition-context.js';
//# sourceMappingURL=condition-builder.d.ts.map