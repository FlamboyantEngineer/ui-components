import { defineStrings, toSelectKey } from '../message-format.js';
/** How a filter condition compares a record's value with the condition's value. */
export type FilterOperator =
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'equals'
  | 'not-equals'
  | 'less-than'
  | 'at-most'
  | 'greater-than'
  | 'at-least'
  | 'before'
  | 'after'
  | 'between'
  | 'any-of'
  | 'none-of'
  | 'empty'
  | 'not-empty';

/** Strings of filter bars, condition builders, query fields and facet lists. */
interface QueryStrings {
  /** Default accessible name of a filter bar. */
  filters: string;
  /** Opens the menu of fields to filter by. */
  addFilter: string;
  /** Removes every filter of a filter bar. */
  clearAllFilters: string;
  /** Names a filter's remove button, from the filter as the chip reads it. */
  removeFilter: (filter: string) => string;
  /** Reads an operator, after the field's name (`Status is any of`). */
  filterOperator: (operator: FilterOperator) => string;
  /** Labels the choice of a condition's field. */
  filterField: string;
  /** Labels the choice of a condition's operator. */
  filterCondition: string;
  /** Labels a condition's value. */
  filterValue: string;
  /** Reads a range of values (`2 and 5`). */
  filterRange: (start: string, end: string) => string;
  /** The message of a condition whose value is missing. */
  conditionIncomplete: string;
  /** Default accessible name of a condition builder. */
  conditions: string;
  /** Names a nested group of conditions. */
  conditionGroup: string;
  /** Names one rule of a condition group, from its position. */
  conditionRule: (position: number) => string;
  /** Labels the choice between matching every rule and matching any rule. */
  conditionCombinator: string;
  /** A group matches when every rule matches. */
  combinatorAnd: string;
  /** A group matches when any rule matches. */
  combinatorOr: string;
  /** Adds a rule to a condition group. */
  addRule: string;
  /** Adds a nested group to a condition group. */
  addGroup: string;
  /** What a condition group with no rules shows. */
  noRules: string;
  /** Names a rule's or a group's menu of actions. */
  conditionActions: string;
  /** Submits a query. */
  runQuery: string;
  /** Shows the facet values a list keeps folded, from how many there are. */
  showMoreValues: (count: number) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const queryStrings = defineStrings<QueryStrings>({
  removeFilter: (filter) => ({ filter }),
  filterOperator: (operator) => ({ operator: toSelectKey(operator) }),
  filterRange: (start, end) => ({ start, end }),
  conditionRule: (position) => ({ position }),
  showMoreValues: (count) => ({ count }),
});
