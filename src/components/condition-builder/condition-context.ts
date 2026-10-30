'use client';

import { createContext, useContext } from 'react';
import { createHooks } from '../../core/hooks.js';
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

interface ConditionBuilderContextValue {
  fields: readonly FilterField[];
  maxDepth: number;
  validate: ConditionRuleValidator | undefined;
  actions: ConditionBuilderActions;
  /** The element id of a node, or of a group's add-rule button. */
  elementId(id: string, part?: 'add'): string;
}

export const conditionBuilderHooks = createHooks('condition-builder', [
  'group',
  'group-header',
  'combinator',
  'rules',
  'item',
  'rule',
  'field',
  'operator',
  'value',
  'message',
  'actions',
  'empty',
  'group-actions',
  'add-rule',
  'add-group',
]);

export const ConditionBuilderContext = createContext<ConditionBuilderContextValue | null>(null);

/** The builder a rule or a group belongs to. */
export function useConditionBuilder(): ConditionBuilderContextValue {
  const value = useContext(ConditionBuilderContext);
  if (!value) throw new Error('A condition rule or group renders inside a ConditionBuilder.');
  return value;
}
