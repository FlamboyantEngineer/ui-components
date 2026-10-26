import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { ConditionActions } from './condition-actions.js';
import { conditionBuilderHooks as hooks, useConditionBuilder } from './condition-context.js';
import { ConditionRuleRow } from './condition-rule.js';
import type { ConditionCombinator, ConditionGroup } from './condition-tree.js';

interface ConditionGroupViewProps {
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
export function ConditionGroupView({ group, depth, index, count }: ConditionGroupViewProps) {
  const strings = useUiStrings();
  const { maxDepth, actions, elementId } = useConditionBuilder();
  const isRoot = index === undefined;
  const size = group.rules.length;
  return (
    <div
      {...hooks.slot('group', { depth, combinator: group.combinator })}
      id={elementId(group.id)}
      role={isRoot ? undefined : 'group'}
      aria-label={isRoot ? undefined : strings.conditionGroup}
    >
      <div {...hooks.slot('group-header')}>
        <SegmentedChoice
          aria-label={strings.conditionCombinator}
          size="sm"
          className={hooks.slotClass('combinator')}
          options={[
            { value: 'and', label: strings.combinatorAnd },
            { value: 'or', label: strings.combinatorOr },
          ]}
          value={group.combinator}
          onChange={(combinator) => {
            if (combinator)
              actions.update({ ...group, combinator: combinator as ConditionCombinator });
          }}
        />
        {isRoot ? null : <ConditionActions id={group.id} index={index} count={count ?? 1} />}
      </div>
      {size > 0 ? (
        <ul {...hooks.slot('rules')}>
          {group.rules.map((node, at) => (
            <li key={node.id} {...hooks.slot('item')}>
              {node.type === 'group' ? (
                <ConditionGroupView group={node} depth={depth + 1} index={at} count={size} />
              ) : (
                <ConditionRuleRow rule={node} index={at} count={size} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p {...hooks.slot('empty')}>{strings.noRules}</p>
      )}
      <div {...hooks.slot('group-actions')}>
        <Button
          id={elementId(group.id, 'add')}
          variant="ghost"
          size="sm"
          startIcon="plus"
          className={hooks.slotClass('add-rule')}
          onPress={() => actions.addRule(group.id)}
        >
          {strings.addRule}
        </Button>
        {depth < maxDepth ? (
          <Button
            variant="ghost"
            size="sm"
            startIcon="plus"
            className={hooks.slotClass('add-group')}
            onPress={() => actions.addGroup(group.id)}
          >
            {strings.addGroup}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
