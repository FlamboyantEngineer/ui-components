'use client';

import { useCallback, useId, useMemo, useRef, type RefObject } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { useLatest } from '../../utils/use-latest.js';
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
  listConditionIds,
  findConditionNode,
  moveConditionNode,
  removeConditionNode,
  replaceConditionNode,
  type ConditionGroup,
  type ConditionNode,
  type ConditionRule,
} from './condition-tree.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { getElementByIdFrom } from '../../utils/owner-window.js';

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
  /**
   * Shows each rule's and nested group's menu button. Defaults to true; false leaves the same
   * actions in their context menus only.
   */
  showActionButtons?: boolean | undefined;
}

/** Where focus goes after an edit: the first match of `selector` inside an element, or itself. */
interface FocusRequest {
  elementId: string;
  selector?: string | undefined;
}

const emptyTree: ConditionGroup = { type: 'group', id: 'root', combinator: 'and', rules: [] };

function findFocusTarget(
  root: HTMLElement | null,
  { elementId, selector }: FocusRequest,
): HTMLElement | null {
  const element = getElementByIdFrom(root, elementId);
  // Without a match, the element itself, which takes focus while it shows no menu button.
  const target = (selector ? element?.querySelector(selector) : null) ?? element;
  return isHTMLElement(target) ? target : null;
}

/** Moves focus to the requested element after the render that drew it. */
function useNodeFocusRequest(rootRef: RefObject<HTMLElement | null>) {
  const request = useFocusRequest();
  return useCallback(
    (target: FocusRequest) => request(() => findFocusTarget(rootRef.current, target)),
    [request, rootRef],
  );
}

/** The group that holds the node `id`, searched from `group` down. */
function findParentGroup(id: string, group: ConditionGroup): ConditionGroup | undefined {
  return group.rules.some((node) => node.id === id)
    ? group
    : group.rules
        .filter((node): node is ConditionGroup => node.type === 'group')
        .map((node) => findParentGroup(id, node))
        .find(Boolean);
}

function useBuilderActions(options: {
  tree: ConditionGroup;
  setTree: (tree: ConditionGroup) => void;
  fields: readonly FilterField[];
  elementId: (id: string, part?: 'add') => string;
  rootRef: RefObject<HTMLElement | null>;
}): ConditionBuilderActions {
  const { elementId } = options;
  // The actions read the current tree and fields when they run, so they stay the same object.
  const latest = useLatest(options);
  const createId = useIdFactory();
  const requestFocus = useNodeFocusRequest(options.rootRef);
  return useMemo(() => {
    // Each edit's ids skip every id in the current tree, restored and nested ones included.
    const startIds = () => createId(listConditionIds(latest.current.tree));
    const newRule = (nextId: () => string): ConditionRule | null => {
      const field = latest.current.fields[0];
      return field ? { type: 'rule', id: nextId(), ...createFilterCondition(field) } : null;
    };
    const edit = (change: (tree: ConditionGroup) => ConditionGroup) => {
      const { tree, setTree } = latest.current;
      setTree(change(tree));
    };
    /** Appends `node` to a group and focuses the first control of its first rule. */
    const append = (groupId: string, node: ConditionNode, focusId: string) => {
      const group = findConditionNode(latest.current.tree, groupId);
      if (group?.type !== 'group') return;
      edit((tree) =>
        replaceConditionNode(tree, groupId, { ...group, rules: [...group.rules, node] }),
      );
      requestFocus({ elementId: elementId(focusId), selector: 'button' });
    };
    return {
      update: (node) => edit((tree) => replaceConditionNode(tree, node.id, node)),
      remove: (id) => {
        const parent = findParentGroup(id, latest.current.tree);
        edit((tree) => removeConditionNode(tree, id));
        if (parent) requestFocus({ elementId: elementId(parent.id, 'add') });
      },
      move: (id, delta) => {
        edit((tree) => moveConditionNode(tree, id, delta));
        requestFocus({
          elementId: elementId(id),
          selector: `.${conditionBuilderHooks.slotClass('actions')} button`,
        });
      },
      duplicate: (id) => {
        const { tree } = latest.current;
        const node = findConditionNode(tree, id);
        const parent = findParentGroup(id, tree);
        if (!node || !parent) return;
        const copy = copyConditionNode(node, startIds());
        const at = parent.rules.indexOf(node) + 1;
        edit((current) =>
          replaceConditionNode(current, parent.id, {
            ...parent,
            rules: parent.rules.toSpliced(at, 0, copy),
          }),
        );
        requestFocus({ elementId: elementId(copy.id), selector: 'button' });
      },
      addRule: (groupId) => {
        const rule = newRule(startIds());
        if (rule) append(groupId, rule, rule.id);
      },
      addGroup: (groupId) => {
        const nextId = startIds();
        const id = nextId();
        const rule = newRule(nextId);
        const group: ConditionGroup = {
          type: 'group',
          id,
          combinator: 'and',
          rules: rule ? [rule] : [],
        };
        append(groupId, group, rule?.id ?? group.id);
      },
    };
  }, [latest, createId, requestFocus, elementId]);
}

/**
 * Edits a boolean expression as nested groups: each group matches all or any of its rules, and each
 * rule tests one field with an operator and a value of the field's type, using the same field
 * definitions and editors as `FilterBar`. Rules and groups are added, duplicated, deleted and moved
 * among their siblings from their menus (a button, which `showActionButtons` can leave out, and a
 * context menu) or with Alt+Arrow keys, groups nest up to `maxDepth`, and each rule shows its
 * validation message. The value is a plain tree.
 */
export function ConditionBuilder({
  fields,
  value,
  defaultValue = emptyTree,
  onChange,
  maxDepth = 3,
  validate,
  showActionButtons = true,
  className,
  'aria-label': ariaLabel,
  ...rest
}: ConditionBuilderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const strings = useUiStrings();
  const [tree, setTree] = useControllableState(value, defaultValue, onChange);
  const baseId = useId();
  const elementId = useCallback(
    (id: string, part?: 'add') => `${baseId}-${part ?? 'node'}-${id}`,
    [baseId],
  );
  const actions = useBuilderActions({ tree, setTree, fields, elementId, rootRef });
  const context = useMemo(
    () => ({ fields, maxDepth, validate, actions, elementId, showActionButtons }),
    [fields, maxDepth, validate, actions, elementId, showActionButtons],
  );
  return (
    <div
      {...rest}
      ref={rootRef}
      {...conditionBuilderHooks.root({ className, props: rest })}
      role="group"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.conditions)}
    >
      <ConditionBuilderContext value={context}>
        <ConditionGroupView group={tree} depth={1} />
      </ConditionBuilderContext>
    </div>
  );
}

export { createConditionMatcher, matchesConditionGroup } from './condition-tree.js';
export type {
  ConditionCombinator,
  ConditionGroup,
  ConditionNode,
  ConditionRule,
} from './condition-tree.js';
export type { ConditionRuleValidator } from './condition-context.js';
