# Step List Editor

`StepListEditor` edits an ordered list of steps, such as the steps of a test procedure or a recipe. Each step is a numbered row with one multi-line text field per caller column (for example an action, its input data and its expected result). Steps are added, inserted, duplicated, moved and deleted from their menus, reordered by dragging their handles or with Alt+Arrow keys, and marked dirty against the steps as last saved. The value is plain data. It is a list of field groups rather than a grid, so every field keeps its own arrow keys and the Tab key walks through every field.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-STEP-LIST-EDITOR-1 - Steps and editing

### UIC-STEP-LIST-EDITOR-1.1 - Numbered steps of fields

The editor shall draw its steps as an ordered list (`ui-step-list-editor__steps`) of steps (`ui-step-list-editor__step`, publishing the step's `id` as `data-key`), after a row of the `columns`' labels (`ui-step-list-editor__header`, one `ui-step-list-editor__heading` per column with `data-column`) hidden from assistive technology. Each step draws its number (`ui-step-list-editor__number`, from `formatOutlineNumber` of its position, so the first step is `1`), then a group (`ui-step-list-editor__fields`) holding one multi-line [Text Field](TEXT-FIELD.md) per column (`ui-step-list-editor__field`, publishing the column's `id` as `data-column`), named by the column's `label` and showing its `placeholder` while empty, one row tall and growing with its text up to six rows.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`, `labs/reference/step-list-editor.css`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-1.2 - No steps

While it holds no steps, the editor shall draw a small [Empty State](EMPTY-STATE.md) (`ui-step-list-editor__empty`) reading the provider string `noSteps` in place of the header and the list.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-1.3 - Plain value

The value shall be an array of steps `{ id, values }`, where `values` maps column ids to text and a missing column reads as empty. `value` with `onChange` controls the steps and `defaultValue` starts an uncontrolled list, empty by default; `onChange` receives a new array after each edit, insertion, removal or move, and every step keeps its `id`. Typing in a field replaces that column's text in its step. Steps the editor adds, inserts or duplicates get ids unique within the document that no step of the current list holds, so a list saved from an earlier page and restored never shares an id with a step added after it.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-list.ts`, `src/utils/use-id-factory.ts`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `src/components/step-list-editor/step-list.test.ts`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-1.4 - Any column id

Column ids shall be any unique strings, including names such as `constructor`, `__proto__` and `toString`: a step reads only the values it holds itself, so a missing one reads as empty rather than as a property every object inherits, and adding, inserting, duplicating, editing and dirty marks work as for any column. A value the caller gives under such a name reads as given.

Implementation: `src/components/step-list-editor/step-list.ts`, `src/utils/read-own.ts`
Verification: `src/components/step-list-editor/step-list-editor-ids.test.tsx`, `src/utils/read-own.test.ts`

## UIC-STEP-LIST-EDITOR-2 - Adding, removing and moving

### UIC-STEP-LIST-EDITOR-2.1 - Adding, inserting, duplicating and deleting

An add button (`ui-step-list-editor__add`, a [Button](BUTTON.md) reading the provider string `addStep`) after the list shall append an empty step. Each step's menu (`ui-step-list-editor__actions`, a [Dropdown Menu](DROPDOWN-MENU.md) named by the provider string `stepActions` with the step's number) shall offer, in order, `insertStepAbove` and `insertStepBelow`, which insert an empty step before or after it, `duplicate`, which inserts a copy of its text after it under a new id, move up and move down (UIC-STEP-LIST-EDITOR-2.2) and `delete`, which removes it. After an insertion or a duplication focus moves to the new step's first field; after a deletion, to the first field of the step that took its place, else of the step before it, else to the add button.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`, `src/components/step-list-editor/step-list.ts`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `src/components/step-list-editor/step-list.test.ts`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-2.2 - Moving from the menu

The menu's move up and move down entries (the provider string `moveItem`) shall move the step one place, and are disabled on the first and the last step; focus moves to the moved step's menu button.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-2.3 - Moving with Alt+Arrow keys

Alt+ArrowUp and Alt+ArrowDown pressed with focus anywhere in a step except in a text control (with no other modifier) shall move the step one place up or down, doing nothing at either end, without opening its menu; focus stays on the element that had it once the step has moved. Keys from the step's open menu, and keys an input method composes (`isComposing`, or key code 229), do not move it. In a step's text field the chord stays with the field, whose caret it moves (Option+Arrow moves by paragraph on macOS), and the step does not move.

Implementation: `src/components/step-list-editor/step-row.tsx`, `src/components/step-list-editor/step-list-editor.tsx`, `src/utils/use-focus-request.ts`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-2.4 - Drag and drop

Each step shall start with a drag handle (`ui-step-list-editor__handle`, an [Icon Button](BUTTON.md) named by the provider string `moveStep` with the step's number). A pointer drag starts only from the handle, which makes its step draggable while it is pressed, so selecting text in a field never drags the step; pressing the handle by keyboard or with a screen reader starts React Aria's keyboard drag. A step is dropped on another step of the same editor, and takes its place: it lands after the target when dragged down and before it when dragged up. The dragged step publishes `data-dragging`, and the step under it `data-drop-target` with `data-position` (`before`, `after`). Steps of another editor and other dragged data are refused.

Implementation: `src/components/step-list-editor/use-step-drag.ts`, `src/components/step-list-editor/step-row.tsx`, `src/components/step-list-editor/step-list.ts`, `labs/reference/step-list-editor.css`
Verification: `src/components/step-list-editor/step-list.test.ts`, `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

## UIC-STEP-LIST-EDITOR-3 - Dirty marks and read-only

### UIC-STEP-LIST-EDITOR-3.1 - Dirty marks

With `committedValue`, the steps as last saved, a step shall publish `data-dirty` when it is new or any of its columns differs from the committed step with the same `id`; each field of a committed step compares itself with the committed text, publishing the field's own `data-dirty` and restore button ([Field](FIELD.md)); and the editor publishes `data-dirty` while its steps differ from the committed ones in any way, a step removed or moved included. Without `committedValue` nothing is marked. The fields of a step with no committed counterpart (a new step, or every step without `committedValue`) are plain inputs (`tracksChanges: false`, UIC-FIELD-2.7): they are never dirty, never commit and take no `committedValue`.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`, `src/components/step-list-editor/step-list.ts`, `labs/reference/step-list-editor.css`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `src/components/step-list-editor/step-list.test.ts`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-3.2 - Read-only

`isReadOnly` shall draw the steps without handles, menus or the add button, with read-only fields, ignore Alt+Arrow moves, and publish `data-readonly` on the editor.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

## UIC-STEP-LIST-EDITOR-4 - Accessibility

### UIC-STEP-LIST-EDITOR-4.1 - Names and order

The editor shall be a group named by `aria-label` or `aria-labelledby`, else by the provider string `steps`; each step's fields form a group named by the provider string `stepLabel` with the step's number, its number itself being hidden from assistive technology. The handle, the fields and the menu button of every step are in the Tab sequence in reading order, and the step's arrow keys belong to its fields.

Implementation: `src/components/step-list-editor/step-list-editor.tsx`, `src/components/step-list-editor/step-row.tsx`
Verification: `src/components/step-list-editor/step-list-editor.test.tsx`, `e2e/step-list-editor.spec.ts`

### UIC-STEP-LIST-EDITOR-4.2 - Focus after an edit

The editors that add, remove and move their items (this editor, [Condition Builder](CONDITION-BUILDER.md) and [Board](BOARD.md)) shall move focus with `useFocusRequest`: a request names how to find the element to focus, and after the next render it is focused, then checked again on the following frames until it holds focus (at most 60 attempts, including while the target has not mounted), since an open menu keeps the page inert for a few frames and moving an element drops its focus. The target's own document and animation frames are used once it exists. A pointer press, key press, newer request or unmount ends the request, so a pending check never takes focus back from where the reader has moved it.

Implementation: `src/utils/use-focus-request.ts`, `src/components/condition-builder/condition-builder.tsx`, `src/components/board/board.tsx`
Verification: `src/utils/use-focus-request.test.tsx`, `src/components/condition-builder/condition-builder.test.tsx`

## Hooks

| Hook                           | Kind  | Values            | Description                                                     |
| ------------------------------ | ----- | ----------------- | --------------------------------------------------------------- |
| `ui-step-list-editor`          | root  |                   | The editor's group.                                             |
| `ui-step-list-editor__header`  | slot  |                   | The column labels over the steps.                               |
| `ui-step-list-editor__heading` | slot  |                   | One column's label.                                             |
| `ui-step-list-editor__steps`   | slot  |                   | The ordered list of steps.                                      |
| `ui-step-list-editor__step`    | slot  |                   | One step (`<li>`).                                              |
| `ui-step-list-editor__handle`  | slot  |                   | A step's drag handle (also `ui-button`).                        |
| `ui-step-list-editor__number`  | slot  |                   | A step's number.                                                |
| `ui-step-list-editor__fields`  | slot  |                   | The group of a step's fields.                                   |
| `ui-step-list-editor__field`   | slot  |                   | One column's field in a step (also `ui-text-field`).            |
| `ui-step-list-editor__actions` | slot  |                   | A step's menu button (also `ui-dropdown-menu`).                 |
| `ui-step-list-editor__empty`   | slot  |                   | What an editor with no steps shows (also `ui-empty-state`).     |
| `ui-step-list-editor__add`     | slot  |                   | The add button (also `ui-button`).                              |
| `data-dirty`                   | state | `true`            | The editor or a step differs from the committed steps.          |
| `data-readonly`                | state | `true`            | On the editor: it is read-only.                                 |
| `data-key`                     | state |                   | On a step: its `id`.                                            |
| `data-column`                  | state |                   | On a heading or a field: its column's `id`.                     |
| `data-dragging`                | state | `true`            | On a step: it is being dragged.                                 |
| `data-drop-target`             | state | `true`            | On a step: the dragged step would land on it.                   |
| `data-position`                | state | `before`, `after` | On a drop target step: the side the dragged step would land on. |
