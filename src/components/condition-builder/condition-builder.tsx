import { useId } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { createFilterCondition, type FilterField } from '../filter-bar/filter-bar.js';
import {
  ConditionBuilderContext,
  conditionBuilderHooks,
  type ConditionBuilderActions,
  type ConditionRuleValidator,
} from './condition-context.js';
import { ConditionGroupView } from './condition-group.js';
import {
  copyConditionNode,
  findConditionNode,
  moveConditionNode,
  removeConditionNode,
  replaceConditionNode,
  type ConditionGroup,
  type ConditionNode,
  type ConditionRule,
} from './condition-tree.js';

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

/** Where focus goes after an edit: an element, or the first match of `selector` inside it. */
interface FocusRequest {
  elementId: string;
  selector?: string | undefined;
}

const emptyTree: ConditionGroup = { type: 'group', id: 'root', combinator: 'and', rules: [] };

function findFocusTarget({ elementId, selector }: FocusRequest): HTMLElement | null {
  const element = document.getElementById(elementId);
  const target = selector ? element?.querySelector(selector) : element;
  return target instanceof HTMLElement ? target : null;
}

/** Moves focus to the requested element after the render that drew it. */
function useNodeFocusRequest() {
  const request = useFocusRequest();
  return (target: FocusRequest) => request(() => findFocusTarget(target));
}

function useBuilderActions(options: {
  tree: ConditionGroup;
  setTree: (tree: ConditionGroup) => void;
  fields: readonly FilterField[];
  elementId: (id: string, part?: 'add') => string;
}): ConditionBuilderActions {
  const { tree, setTree, fields, elementId } = options;
  const createId = useIdFactory();
  const requestFocus = useNodeFocusRequest();
  const newRule = (): ConditionRule | null => {
    const field = fields[0];
    return field ? { type: 'rule', id: createId(), ...createFilterCondition(field) } : null;
  };
  /** Appends `node` to a group and focuses the first control of its first rule. */
  const append = (groupId: string, node: ConditionNode, focusId: string) => {
    const group = findConditionNode(tree, groupId);
    if (group?.type !== 'group') return;
    setTree(replaceConditionNode(tree, groupId, { ...group, rules: [...group.rules, node] }));
    requestFocus({ elementId: elementId(focusId), selector: 'button' });
  };
  const parentOf = (id: string, group: ConditionGroup = tree): ConditionGroup | undefined =>
    group.rules.some((node) => node.id === id)
      ? group
      : group.rules
          .filter((node): node is ConditionGroup => node.type === 'group')
          .map((node) => parentOf(id, node))
          .find(Boolean);
  return {
    update: (node) => setTree(replaceConditionNode(tree, node.id, node)),
    remove: (id) => {
      const parent = parentOf(id);
      setTree(removeConditionNode(tree, id));
      if (parent) requestFocus({ elementId: elementId(parent.id, 'add') });
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
      if (!node || !parent) return;
      const copy = copyConditionNode(node, createId);
      const at = parent.rules.indexOf(node) + 1;
      setTree(
        replaceConditionNode(tree, parent.id, {
          ...parent,
          rules: parent.rules.toSpliced(at, 0, copy),
        }),
      );
      requestFocus({ elementId: elementId(copy.id), selector: 'button' });
    },
    addRule: (groupId) => {
      const rule = newRule();
      if (rule) append(groupId, rule, rule.id);
    },
    addGroup: (groupId) => {
      const rule = newRule();
      const group: ConditionGroup = {
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
export function ConditionBuilder({
  fields,
  value,
  defaultValue = emptyTree,
  onChange,
  maxDepth = 3,
  validate,
  className,
  'aria-label': ariaLabel,
  ...rest
}: ConditionBuilderProps) {
  const strings = useUiStrings();
  const [tree, setTree] = useControllableState(value, defaultValue, onChange);
  const baseId = useId();
  const elementId = (id: string, part?: 'add') => `${baseId}-${part ?? 'node'}-${id}`;
  const actions = useBuilderActions({ tree, setTree, fields, elementId });
  return (
    <div
      {...rest}
      {...conditionBuilderHooks.root({ className, props: rest })}
      role="group"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.conditions)}
    >
      <ConditionBuilderContext value={{ fields, maxDepth, validate, actions, elementId }}>
        <ConditionGroupView group={tree} depth={1} />
      </ConditionBuilderContext>
    </div>
  );
}

export { matchesConditionGroup } from './condition-tree.js';
export type {
  ConditionCombinator,
  ConditionGroup,
  ConditionNode,
  ConditionRule,
} from './condition-tree.js';
export type { ConditionRuleValidator } from './condition-context.js';
