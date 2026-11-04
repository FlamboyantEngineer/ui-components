// The condition tree as plain data, the pure edits the builder makes to it, and its evaluation.

// Runtime helpers come from their pure modules: filter-bar.tsx is a client module, whose exports a
// server component receives as client references it cannot call.
import { type FilterValueGetter, matchesFilterCondition } from '../filter-bar/filter-matching.js';
import {
  type FilterCondition,
  type FilterField,
  isFilterConditionComplete,
} from '../filter-bar/filter-model.js';

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

type SiblingEdit = (rules: readonly ConditionNode[], index: number) => readonly ConditionNode[];

/** `group` with the sibling list holding node `id` replaced by `edit` of it. */
function editSiblings(group: ConditionGroup, id: string, edit: SiblingEdit): ConditionGroup {
  const index = group.rules.findIndex((node) => node.id === id);
  if (index >= 0) return { ...group, rules: edit(group.rules, index) };
  let changed = false;
  const rules = group.rules.map((node) => {
    if (node.type !== 'group' || changed) return node;
    const next = editSiblings(node, id, edit);
    changed = next !== node;
    return next;
  });
  return changed ? { ...group, rules } : group;
}

/** The node `id` in the tree, or `undefined`. */
export function findConditionNode(group: ConditionGroup, id: string): ConditionNode | undefined {
  if (group.id === id) return group;
  for (const node of group.rules) {
    const found = node.type === 'group' ? findConditionNode(node, id) : undefined;
    if (node.id === id) return node;
    if (found) return found;
  }
  return undefined;
}

/** The tree with node `id` replaced by `next` (the root itself included). */
export function replaceConditionNode(
  root: ConditionGroup,
  id: string,
  next: ConditionNode,
): ConditionGroup {
  if (root.id === id && next.type === 'group') return next;
  return editSiblings(root, id, (rules, index) => rules.with(index, next));
}

/** The tree without node `id`. */
export function removeConditionNode(root: ConditionGroup, id: string): ConditionGroup {
  return editSiblings(root, id, (rules, index) => rules.toSpliced(index, 1));
}

/** The tree with node `id` swapped with its previous (`-1`) or next (`1`) sibling, if it has one. */
export function moveConditionNode(root: ConditionGroup, id: string, delta: -1 | 1): ConditionGroup {
  return editSiblings(root, id, (rules, index) => {
    const target = index + delta;
    const moved = rules[index];
    const other = rules[target];
    return moved && other ? rules.with(index, other).with(target, moved) : rules;
  });
}

/** The ids of `node` and every node in it. */
export function listConditionIds(node: ConditionNode): string[] {
  return node.type === 'rule' ? [node.id] : [node.id, ...node.rules.flatMap(listConditionIds)];
}

/** A copy of `node` and everything in it under new ids. */
export function copyConditionNode(node: ConditionNode, createId: () => string): ConditionNode {
  if (node.type === 'rule') return { ...node, id: createId() };
  return {
    ...node,
    id: createId(),
    rules: node.rules.map((child) => copyConditionNode(child, createId)),
  };
}

type RecordTest<T> = (record: T) => boolean;

/**
 * The test for one node, or `null` when the node takes no part in matching: a rule missing its
 * value or on an unknown field, or a group holding no such node.
 */
function compileNode<T>(
  node: ConditionNode,
  fields: ReadonlyMap<string, FilterField>,
  getValue: FilterValueGetter<T>,
): RecordTest<T> | null {
  if (node.type === 'rule') {
    const field = fields.get(node.field);
    if (!field || !isFilterConditionComplete(node, field)) return null;
    return (record) => matchesFilterCondition(getValue(record, field.id), node, field);
  }
  const tests = node.rules.flatMap((child) => compileNode(child, fields, getValue) ?? []);
  if (tests.length === 0) return null;
  return node.combinator === 'and'
    ? (record) => tests.every((test) => test(record))
    : (record) => tests.some((test) => test(record));
}

/**
 * A test of a record against a condition group: every active rule (`and`) or one of them (`or`),
 * nested groups counting as one rule. The fields are indexed and the active rules resolved once, so
 * the test does no lookups or allocations per record. Rules missing their value, rules on unknown
 * fields and groups holding no active rule are left out; a group left with nothing matches every
 * record.
 */
export function createConditionMatcher<T>(options: {
  group: ConditionGroup;
  fields: readonly FilterField[];
  getValue: FilterValueGetter<T>;
}): RecordTest<T> {
  const { group, fields, getValue } = options;
  const byId = new Map(fields.map((field) => [field.id, field]));
  return compileNode(group, byId, getValue) ?? (() => true);
}

/**
 * Whether a record matches a condition group, as `createConditionMatcher` tests it. To test many
 * records against one group, create the matcher once instead.
 */
export function matchesConditionGroup<T>(
  record: T,
  group: ConditionGroup,
  options: { fields: readonly FilterField[]; getValue: FilterValueGetter<T> },
): boolean {
  return createConditionMatcher({ group, ...options })(record);
}
