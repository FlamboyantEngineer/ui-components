# Constraint Editor

`ConstraintEditor` authors the constraints and default value of one field in a schema: whether it is required, its default, numeric or date bounds, text lengths and pattern, and how many options a list takes. It is a [Property Panel](PROPERTY-PANEL.md) of ordinary fields ([Select Field](SELECT-FIELD.md), [Text Field](TEXT-FIELD.md), [Number Field](NUMBER-FIELD.md), [Date Time Field](DATE-TIME-FIELD.md)), so their labels, validation and keyboard behaviour apply unchanged. It edits a small generic model; the host keeps its schema types, inheritance and permissions, runtime semantics, storage and authoritative validation. Boolean condition trees belong to [Condition Builder](CONDITION-BUILDER.md).

## UIC-CONSTRAINT-EDITOR-1 - Model

### UIC-CONSTRAINT-EDITOR-1.1 - Kinds and constraints

`kind` shall decide the constraints offered, in this order (`constraintsByKind`):

| Kind      | Constraints                                                | Value types                                                   |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `text`    | `required`, `default`, `minLength`, `maxLength`, `pattern` | boolean; text; whole numbers; a pattern matched in full (`u`) |
| `number`  | `required`, `default`, `minimum`, `maximum`                | boolean; decimal text                                         |
| `date`    | `required`, `default`, `minimum`, `maximum`                | boolean; `YYYY-MM-DD`                                         |
| `options` | `required`, `default`, `minCount`, `maxCount`              | boolean; an option id; whole numbers                          |

`constraints` narrows them to those the field declares, keeping this order. The value is a `ConstraintSet` with one optional key per constraint.

Implementation: `src/components/constraint-editor/constraint-model.ts`, `src/components/constraint-editor/constraint-editor.tsx`
Verification: `src/components/constraint-editor/constraint-model.test.ts`, `src/components/constraint-editor/constraint-editor.test.tsx`

### UIC-CONSTRAINT-EDITOR-1.2 - Unset and exact values

A constraint that is not set shall be absent from the set, which stays apart from `false`, `0` and an empty text default. Numeric bounds and defaults are kept as the decimal text the author typed, never converted through a JavaScript number, and compare as decimals with every digit (`compareDecimalText`) unless `compare` orders them, for a host's own number type. Dates compare as `YYYY-MM-DD` text unless `compare` orders them.

Implementation: `src/components/constraint-editor/constraint-model.ts`, `src/components/constraint-editor/decimal-text.ts`
Verification: `src/components/constraint-editor/constraint-model.test.ts`, `src/components/constraint-editor/decimal-text.test.ts`

### UIC-CONSTRAINT-EDITOR-1.3 - Problems

`validateConstraints(kind, set, compare)` shall list the problems of a set as `{ constraint, reason }`, on the constraint whose control shows them: unreadable numbers (`notNumber`, on that constraint), a maximum below the minimum (`boundsReversed`, on `maximum`), reversed lengths or counts (`lengthsReversed`, `countsReversed`, on the maximum), a default outside the bounds or lengths (`defaultBelowMinimum`, `defaultAboveMaximum`, `defaultTooShort`, `defaultTooLong`), an unreadable pattern (`patternInvalid`) and a default that does not match it (`defaultPatternMismatch`). A text length counts code points. Problems never change the set: nothing is clamped, swapped or dropped.

Implementation: `src/components/constraint-editor/constraint-model.ts`
Verification: `src/components/constraint-editor/constraint-model.test.ts`

## UIC-CONSTRAINT-EDITOR-2 - Editor

### UIC-CONSTRAINT-EDITOR-2.1 - Structure and controls

`ConstraintEditor` shall render a `PropertyPanel` whose root also carries `ui-constraint-editor` and publishes `data-kind`, named by its `aria-label` or `aria-labelledby`. Each offered constraint renders a row (`ui-constraint-editor__row`, publishing `data-constraint` with the constraint's name in kebab case) holding a field labelled by the provider string `constraintLabel`: `required` is a single `SelectField` of the provider's `constraintRequiredChoice` choices with an empty choice `constraintNotSet`; lengths and counts are `NumberField`s of whole numbers from 0; date bounds and defaults are `DateTimeField`s; an options default is a `SelectField` of `options`; other values are `TextField`s (`inputMode="decimal"` for numbers). Empty controls show `constraintNotSet`.

Implementation: `src/components/constraint-editor/constraint-editor.tsx`, `src/components/constraint-editor/constraint-controls.tsx`
Verification: `src/components/constraint-editor/constraint-editor.test.tsx`, `e2e/constraint-editor.spec.ts`

### UIC-CONSTRAINT-EDITOR-2.2 - Changes and unsetting

The set shall be controlled by `value` with `onChange(set, issues)`, or held from `defaultValue`. Each control change sets its constraint, and an Unset button (`ui-constraint-editor__unset`, named by the provider string `constraintUnset`) after a set constraint removes it. Emptying a text or number control unsets its constraint, except a text field's default, where empty text is a value until Unset. A new `value` replaces every control's value.

Implementation: `src/components/constraint-editor/constraint-editor.tsx`, `src/components/constraint-editor/constraint-controls.tsx`
Verification: `src/components/constraint-editor/constraint-editor.test.tsx`, `e2e/constraint-editor.spec.ts`

### UIC-CONSTRAINT-EDITOR-2.3 - Shown problems and host errors

Each problem shall show as an error on its constraint's field, worded by the provider string `constraintIssue`, while the root publishes `data-invalid`. `errors` maps a host's or server's message to the constraint it belongs to, for example from a field path the server reported; it shows on that field after the editor's own problems.

Implementation: `src/components/constraint-editor/constraint-editor.tsx`
Verification: `src/components/constraint-editor/constraint-editor.test.tsx`, `e2e/constraint-editor.spec.ts`

### UIC-CONSTRAINT-EDITOR-2.4 - Locked, read-only and disabled

`lockedConstraints` shall make those constraints' fields read-only, publish `data-locked` on their rows and draw no Unset button, as for inherited or permission-held constraints. `isReadOnly` locks every constraint, and `isDisabled` disables every field through the panel.

Implementation: `src/components/constraint-editor/constraint-editor.tsx`, `src/components/constraint-editor/constraint-controls.tsx`
Verification: `src/components/constraint-editor/constraint-editor.test.tsx`

### UIC-CONSTRAINT-EDITOR-2.5 - Custom controls and caller attributes

`renderConstraint(control)` shall draw a constraint's control in place of the library's, from its `name`, `label`, `value`, `onChange` (`undefined` unsets), `isReadOnly` and `issues`; returning `undefined` or `null` keeps the library's. The editor appends the caller's `className` and forwards `id` and caller `data-*` attributes to its root.

Implementation: `src/components/constraint-editor/constraint-editor.tsx`
Verification: `src/components/constraint-editor/constraint-editor.test.tsx`

## Hooks

| Hook                          | Kind      | Values                                                                                                       | Description                              |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `ui-constraint-editor`        | root      |                                                                                                              | The editor (also `ui-property-panel`).   |
| `ui-constraint-editor__row`   | slot      |                                                                                                              | One constraint's field and Unset button. |
| `ui-constraint-editor__unset` | slot      |                                                                                                              | The Unset button (also `ui-button`).     |
| `data-kind`                   | attribute | `text`, `number`, `date`, `options`                                                                          | On the root: the kind of field.          |
| `data-invalid`                | state     | `true`                                                                                                       | On the root: the set has problems.       |
| `data-constraint`             | attribute | `required`, `default`, `minimum`, `maximum`, `min-length`, `max-length`, `pattern`, `min-count`, `max-count` | On a row: its constraint.                |
| `data-locked`                 | state     | `true`                                                                                                       | On a row: the constraint is locked.      |
