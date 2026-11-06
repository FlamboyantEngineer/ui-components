# Cascader Field

`CascaderField` is a [field](FIELD.md) for choosing one leaf of a hierarchy through adjacent panels. Its value is the path of option ids from the top level down to the chosen leaf (`CascaderValue`, `readonly Key[] | null`). It takes the field's props (`FieldInputProps<CascaderValue>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. Its control is a trigger showing the chosen path, which opens a popover of panels built on React Aria's `ListBox`: the top-level options, then the children of each option on the active path, each level in its own listbox beside the last.

Options are plain data (`CascaderOption`: `id`, `label`, optional `description`, `icon`, `isDisabled`, `children` and `hasChildren`). An option with `children`, or with `hasChildren` and none given, is a branch; every other option is a leaf. Only a leaf is chosen: pressing a branch opens its level, and the value always ends at a leaf.

When another component is simpler:

- `SelectField` with `mode="tree"` ([UIC-SELECT-FIELD-9](SELECT-FIELD.md#uic-select-field-9---trigger-and-popover)) shows the whole hierarchy in one expandable tree. It suits choosing several values, choosing a branch itself, or filtering a hierarchy by text.
- [Relation Columns](RELATION-COLUMNS.md) browses the items on either side of an item in place on the page, with no field value.

Search: a cascader filters nothing. Within a level, typing moves to the next option whose label starts with the typed text (React Aria's typeahead). A hierarchy too large to browse level by level belongs in `SelectField`'s tree mode with filtering.

Small screens: the panels sit in one row, and the reference sheet scrolls that row inline, keeping each panel at a readable width. The popover is no wider than the viewport, so the deepest panel stays reachable by scrolling or with the forward arrow.

## UIC-CASCADER-FIELD-1 - Contract

### UIC-CASCADER-FIELD-1.1 - Field control and trigger

`CascaderField` shall render a `Field` around its trigger, built with `useFieldControl`, and take the field's props. Its root carries `ui-cascader-field` beside `ui-field`, and takes the caller's `className`, `data-*` attributes and `id` as the field does. The control is a React Aria button (`ui-cascader-field__trigger`) holding the value (`ui-cascader-field__value`). The value shows each option of the chosen path in a segment (`ui-cascader-field__segment`), with a separator (`ui-cascader-field__separator`, the provider string `cascaderPathSeparator`) between segments and a space on each side of it. With nothing chosen it shows `placeholder` (the provider string `selectPlaceholder` by default), with `data-placeholder`. The trigger is named by the field label followed by the path, so two options with the same label read apart by their parents (`South / Coast / Pine Harbour`). A path id whose option is not known, such as one restored before its branch loads, shows as its id. A disabled field's trigger is disabled. A read-only field's trigger stays focusable but opens nothing.

Implementation: `src/components/cascader-field/cascader-field.tsx`, `src/components/cascader-field/cascader-field-hooks.ts`, `labs/reference/cascader-field.css`
Verification: `src/components/cascader-field/cascader-field.test.tsx`, `e2e/cascader-field.spec.ts`

### UIC-CASCADER-FIELD-1.2 - Options and ids

Options shall be identified by their `id`, a string or a number. Ids are compared by type and value, so `1` and `'1'` are different options, and only within their level, so two levels can reuse an id. A disabled option (`isDisabled`) is marked disabled, is skipped by the arrow keys, and is never chosen or opened, even when it holds children. Each option shows its icon (`ui-cascader-field__option-icon`), label (`ui-cascader-field__option-label`) and description (`ui-cascader-field__option-description`), and a branch also shows a forward glyph (`ui-cascader-field__branch-icon`) and carries `data-branch`.

Implementation: `src/components/cascader-field/cascader-options.ts`, `src/components/cascader-field/cascader-panels.tsx`
Verification: `src/components/cascader-field/cascader-field.test.tsx`

### UIC-CASCADER-FIELD-1.3 - Clearing, resetting and forms

Backspace or Delete on the focused trigger shall clear an optional value to `null` and commit it. A required field ignores those keys, and every other key on the trigger goes on to the field, for its undo and redo chords. The field menu's Clear and Set to default work as for any field, and a form reset restores the default path. With `name`, a hidden input of that name submits the chosen leaf's id as text, empty while no leaf is chosen, and nothing while the field is disabled.

Implementation: `src/components/cascader-field/cascader-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/cascader-field/cascader-field.test.tsx`, `e2e/cascader-field.spec.ts`

## UIC-CASCADER-FIELD-2 - Panels

### UIC-CASCADER-FIELD-2.1 - Opening and keyboard

Pressing the trigger, or Enter or Space on it, shall open a popover (`ui-cascader-field__popover`, below the trigger's start edge, on the `dropdown` overlay layer with `data-layer="dropdown"`) holding a dialog (`ui-cascader-field__dialog`) named by the field label. The dialog holds the panels (`ui-cascader-field__panels`): one panel (`ui-cascader-field__panel`, with `data-level` counting from `0` and `data-status`) for each level of the active path, each holding a listbox (`ui-cascader-field__listbox`) of options (`ui-cascader-field__option`). The top listbox is named by the field label, and each deeper listbox by the label of the option that opened it, so moving into a level announces its parent. Opening starts the active path at the chosen value and focuses its leaf, or the first enabled top-level option while nothing is chosen. Within a level, Up and Down, Home, End and typeahead move focus. The logical forward arrow (Right, or Left right to left) opens the focused branch and moves focus into its level, on its first enabled option. The backward arrow returns focus to the option that opened the level. Focus stays on one option at a time, inside the dialog, and Escape or a press outside closes the popover and returns focus to the trigger. Locking the field (read-only or disabled) closes the popover.

Implementation: `src/components/cascader-field/cascader-field.tsx`, `src/components/cascader-field/cascader-panels.tsx`, `labs/reference/cascader-field.css`
Verification: `src/components/cascader-field/cascader-field.test.tsx`, `e2e/cascader-field.spec.ts`

### UIC-CASCADER-FIELD-2.2 - Choosing a leaf

Enter, Space or a press on a branch shall make it the active option of its level (`aria-selected`) and open its level, closing any deeper levels of the path before it. Enter, Space or a press on a leaf shall set the value to the path down to it through `onChange`, commit it, close the popover and return focus to the trigger. Pressing the chosen leaf again chooses it again and closes the popover.

Implementation: `src/components/cascader-field/cascader-field.tsx`, `src/components/cascader-field/cascader-panels.tsx`
Verification: `src/components/cascader-field/cascader-field.test.tsx`, `e2e/cascader-field.spec.ts`

## UIC-CASCADER-FIELD-3 - Loading children

### UIC-CASCADER-FIELD-3.1 - Loading, failure and retry

An option with `hasChildren` and no `children` shall load its children through `loadChildren(option, { path, signal })` the first time it opens, where `path` holds the options from the top level down to it. While the load runs its panel carries `data-status="loading"` and holds a status (`ui-cascader-field__status`, `role="status"`) with the provider string `loading`, and focus waits on the branch, moving into the level once its options arrive. A failed load shows the provider string `cascaderLoadFailed` and a Retry button (`ui-cascader-field__retry`, also `ui-button`, the provider string `retry`), with `data-status="failed"`. Retry loads it again. A level that loads no options shows the provider string `noResults`. Loaded children are kept for the field's lifetime, so a branch opens again without a second load, and one branch loads at most once at a time.

Implementation: `src/components/cascader-field/use-cascader-loads.ts`, `src/components/cascader-field/cascader-panels.tsx`
Verification: `src/components/cascader-field/cascader-field.test.tsx`, `e2e/cascader-field.spec.ts`

### UIC-CASCADER-FIELD-3.2 - Controlled replacement and unmounting

A controlled `value` replaced while a branch loads shall stay as given: an arriving load fills in its branch but never changes the value or reopens the popover. Unmounting the field aborts each running load through its `signal`, and the result of an aborted load is ignored.

Implementation: `src/components/cascader-field/use-cascader-loads.ts`, `src/components/cascader-field/cascader-field.tsx`
Verification: `src/components/cascader-field/cascader-field.test.tsx`

## Hooks

| Hook                                    | Kind      | Values                                     | Description                                                   |
| --------------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------- |
| `ui-cascader-field`                     | root      |                                            | The field's root (also `ui-field`).                           |
| `ui-cascader-field__trigger`            | slot      |                                            | The button that opens the panels.                             |
| `ui-cascader-field__value`              | slot      |                                            | The chosen path, or the placeholder.                          |
| `ui-cascader-field__segment`            | slot      |                                            | One option of the chosen path.                                |
| `ui-cascader-field__separator`          | slot      |                                            | The separator between two segments.                           |
| `ui-cascader-field__popover`            | slot      |                                            | The popover holding the panels.                               |
| `ui-cascader-field__dialog`             | slot      |                                            | The dialog inside the popover.                                |
| `ui-cascader-field__panels`             | slot      |                                            | The row of panels.                                            |
| `ui-cascader-field__panel`              | slot      |                                            | One level of the active path.                                 |
| `ui-cascader-field__listbox`            | slot      |                                            | A level's `role="listbox"` list.                              |
| `ui-cascader-field__option`             | slot      |                                            | One `role="option"` row.                                      |
| `ui-cascader-field__option-icon`        | slot      |                                            | An option's icon (also `ui-icon`).                            |
| `ui-cascader-field__option-label`       | slot      |                                            | An option's label.                                            |
| `ui-cascader-field__option-description` | slot      |                                            | An option's description.                                      |
| `ui-cascader-field__branch-icon`        | slot      |                                            | A branch's forward glyph (also `ui-glyph`).                   |
| `ui-cascader-field__status`             | slot      |                                            | A level's loading, failure or empty message.                  |
| `ui-cascader-field__retry`              | slot      |                                            | The Retry button of a failed level (also `ui-button`).        |
| `data-placeholder`                      | state     | `true`                                     | On the value: nothing is chosen, so it shows the placeholder. |
| `data-level`                            | state     |                                            | On a panel: its depth, from `0` for the top level.            |
| `data-status`                           | state     | `ready`, `loading`, `failed`               | On a panel and its status: whether its options are there.     |
| `data-branch`                           | state     | `true`                                     | On an option: it opens a further level.                       |
| `data-layer`                            | attribute | `dropdown`                                 | On the popover: its overlay layer; the z-index is set inline. |
| `data-placement`                        | state     | `top`, `bottom`, `left`, `right`, `center` | On the popover: the side it opened on (React Aria).           |
| `data-trigger`                          | state     | `DialogTrigger`                            | On the popover: what opened it (React Aria).                  |
| `data-entering`                         | state     | `true`                                     | On the popover: opening (React Aria).                         |
| `data-exiting`                          | state     | `true`                                     | On the popover: closing (React Aria).                         |
| `data-collection`                       | state     |                                            | React Aria's collection marker, on the listboxes and options. |
| `data-key`                              | attribute |                                            | On an option: its encoded collection key; not for styling.    |
| `data-layout`                           | state     | `stack`                                    | On a listbox (React Aria).                                    |
| `data-orientation`                      | state     | `vertical`                                 | On a listbox (React Aria).                                    |
| `data-empty`                            | state     | `true`                                     | On a listbox with no options (React Aria).                    |
| `data-focused`                          | state     | `true`                                     | On the trigger, a listbox or an option (React Aria).          |
| `data-focus-visible`                    | state     | `true`                                     | On the trigger, a listbox or an option (React Aria).          |
| `data-hovered`                          | state     | `true`                                     | On the trigger or an option (React Aria).                     |
| `data-pressed`                          | state     | `true`                                     | On the trigger or an option (React Aria).                     |
| `data-selected`                         | state     | `true`                                     | On an option: the active option of its level (React Aria).    |
| `data-selection-mode`                   | state     | `single`                                   | On an option (React Aria).                                    |
| `data-disabled`                         | state     | `true`                                     | On the trigger or an option: disabled (React Aria).           |
