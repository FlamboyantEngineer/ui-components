# Condition Builder

`ConditionBuilder` edits a boolean expression as a tree: groups that match all or any of their rules, rules that test one field with an operator and a value, and groups nested inside groups. It shares the [Filter Bar](FILTER-BAR.md)'s field definitions, operators, value shapes and value controls, so a host can switch from flat filters to an advanced expression without changing its fields. The value is plain data, and `createConditionMatcher` (or `matchesConditionGroup` for a single record) evaluates it against records.

## UIC-CONDITION-BUILDER-1 - Tree and editing

### UIC-CONDITION-BUILDER-1.1 - Plain tree value

The value shall be a root group `{ type: 'group', id, combinator, rules }` whose `combinator` is `and` or `or` and whose `rules` hold, in order, rules `{ type: 'rule', id, field, operator, value }` (a [Filter Bar](FILTER-BAR.md) condition with an id) and nested groups. `value` with `onChange` controls the tree and `defaultValue` starts an uncontrolled one, an empty `and` group by default; `onChange` receives a new tree after each change and every node keeps its id. Nodes the builder adds get ids unique within it.

Implementation: `src/components/condition-builder/condition-builder.tsx`, `src/components/condition-builder/condition-tree.ts`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `src/components/condition-builder/condition-tree.test.ts`

### UIC-CONDITION-BUILDER-1.2 - Groups

Each group (`ui-condition-builder__group`, publishing `data-depth` from 1 at the root and `data-combinator`) shall start with a [Segmented Choice](SEGMENTED-CHOICE.md) named by the provider string `conditionCombinator` between all (`and`) and any (`or`), then list its rules and nested groups in order, or the provider string `noRules` while it holds none, then end with an add-rule button and, while its depth is below `maxDepth` (3 by default), an add-group button.

Implementation: `src/components/condition-builder/condition-group.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-1.3 - Rules

Each rule (`ui-condition-builder__rule`) shall draw a select of the fields (`ui-condition-builder__field`), then the operator select and value control of the field's type exactly as the filter bar's editor draws them ([UIC-FILTER-BAR-2.2](FILTER-BAR.md#uic-filter-bar-22---editor)), labelled for assistive technology only, then its menu. Choosing another field starts the rule over with that field's first operator and an empty value, keeping its id. A rule on a field not in `fields` draws only its field select and menu. Editing a rule draws only that rule and the groups that hold it again; the other rules and groups keep their rendered content.

Implementation: `src/components/condition-builder/condition-rule.tsx`, `src/components/filter-bar/filter-editor.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-1.4 - Adding

The add-rule button shall append a rule on the first field with its first operator, and the add-group button an `and` group holding one such rule; focus moves to the new rule's field select.

Implementation: `src/components/condition-builder/condition-builder.tsx`, `src/components/condition-builder/condition-group.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-1.5 - Moving, duplicating and deleting

Each rule and each nested group shall have a menu (`ui-condition-builder__actions`, named by the provider string `conditionActions`) to move it up or down among its siblings (disabled at either end), duplicate it after itself under new ids, nested nodes included, and delete it. After a move focus returns to the moved node's menu button, after a duplicate it moves to the copy's first control, and after a delete to the add-rule button of the group that held the node.

Implementation: `src/components/condition-builder/condition-actions.tsx`, `src/components/condition-builder/condition-builder.tsx`, `src/components/condition-builder/condition-tree.ts`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `src/components/condition-builder/condition-tree.test.ts`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-1.6 - Validation

A rule shall show a message (`ui-condition-builder__message`) that describes it and publishes `data-invalid` on it: the message `validate(rule)` returns, or else, for a rule missing its value, the provider string `conditionIncomplete`, which also publishes `data-incomplete`.

Implementation: `src/components/condition-builder/condition-rule.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-1.7 - Hooks and caller attributes

The builder shall carry the hooks below, append the caller's `className`, and forward `id`, caller `data-*` attributes and the ARIA labelling attributes to its root.

Implementation: `src/components/condition-builder/condition-builder.tsx`, `src/components/condition-builder/condition-context.ts`
Verification: `src/components/condition-builder/condition-builder.test.tsx`

## UIC-CONDITION-BUILDER-2 - Matching

### UIC-CONDITION-BUILDER-2.1 - Evaluating a tree

`matchesConditionGroup(record, group, { fields, getValue })` shall match a record when it matches every active node of an `and` group or one of an `or` group, testing rules as `matchesFilterCondition` does ([UIC-FILTER-BAR-3.1](FILTER-BAR.md#uic-filter-bar-31---matching-one-condition)) and nested groups recursively. Rules missing their value, rules on unknown fields and groups holding no active rule are not active; a group with no active node matches every record.

Implementation: `src/components/condition-builder/condition-tree.ts`
Verification: `src/components/condition-builder/condition-tree.test.ts`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-2.2 - Precompiled matching

`createConditionMatcher({ group, fields, getValue })` shall return a test of a record that matches as [UIC-CONDITION-BUILDER-2.1](#uic-condition-builder-21---evaluating-a-tree) describes, mirroring `createFilterMatcher` ([UIC-FILTER-BAR-3.2](FILTER-BAR.md#uic-filter-bar-32---matching-a-record)): it indexes the fields and resolves the active nodes once, so testing a record reads no field definitions and only the values of active rules. `matchesConditionGroup` delegates to it; a host testing many records against one tree creates the matcher once.

Implementation: `src/components/condition-builder/condition-tree.ts`
Verification: `src/components/condition-builder/condition-tree.test.ts`, `e2e/condition-builder.spec.ts`

## UIC-CONDITION-BUILDER-3 - Accessibility

### UIC-CONDITION-BUILDER-3.1 - Named groups and rules

The builder shall be a group named by its `aria-label`, its `aria-labelledby`, or else the provider string `conditions`; each nested group is a group named by the provider string `conditionGroup`, and each rule a group named by the provider string `conditionRule` from its position among its siblings (`Rule 2`), described by its message.

Implementation: `src/components/condition-builder/condition-builder.tsx`, `src/components/condition-builder/condition-group.tsx`, `src/components/condition-builder/condition-rule.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

### UIC-CONDITION-BUILDER-3.2 - Moving from the keyboard

Alt+Arrow Up and Alt+Arrow Down on a node's menu button shall move the node up or down among its siblings without opening the menu, keeping focus on the button; at either end the key does nothing.

Implementation: `src/components/condition-builder/condition-actions.tsx`
Verification: `src/components/condition-builder/condition-builder.test.tsx`, `e2e/condition-builder.spec.ts`

## Hooks

| Hook                                  | Kind  | Values      | Description                                                   |
| ------------------------------------- | ----- | ----------- | ------------------------------------------------------------- |
| `ui-condition-builder`                | root  |             | The builder's group.                                          |
| `ui-condition-builder__group`         | slot  |             | A group, the root group included.                             |
| `ui-condition-builder__group-header`  | slot  |             | Holds a group's combinator choice and menu.                   |
| `ui-condition-builder__combinator`    | slot  |             | The all or any choice (also `ui-segmented-choice`).           |
| `ui-condition-builder__rules`         | slot  |             | The list of a group's rules and nested groups.                |
| `ui-condition-builder__item`          | slot  |             | One entry of that list.                                       |
| `ui-condition-builder__rule`          | slot  |             | A rule.                                                       |
| `ui-condition-builder__field`         | slot  |             | A rule's field select (also `ui-select-field`).               |
| `ui-condition-builder__operator`      | slot  |             | A rule's operator select (also `ui-select-field`).            |
| `ui-condition-builder__value`         | slot  |             | A rule's value control, or the group of a range's two fields. |
| `ui-condition-builder__message`       | slot  |             | A rule's validation message.                                  |
| `ui-condition-builder__actions`       | slot  |             | Holds a rule's or a group's menu button.                      |
| `ui-condition-builder__empty`         | slot  |             | What a group with no rules shows.                             |
| `ui-condition-builder__group-actions` | slot  |             | Holds a group's add buttons.                                  |
| `ui-condition-builder__add-rule`      | slot  |             | The add-rule button (also `ui-button`).                       |
| `ui-condition-builder__add-group`     | slot  |             | The add-group button (also `ui-button`).                      |
| `data-depth`                          | state |             | On a group: its level, 1 at the root.                         |
| `data-combinator`                     | state | `and`, `or` | On a group: how its rules combine.                            |
| `data-incomplete`                     | state | `true`      | On a rule: it is missing its value.                           |
| `data-invalid`                        | state | `true`      | On a rule: it shows a message.                                |
