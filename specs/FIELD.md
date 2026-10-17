# Field

The field base every field control is built on. `useFieldState` is the controller: it holds or relays a field's value, knows its committed value, validates it, tracks dirty state and keeps a per-field undo history. `Field` lays a field out around its control: the label, the control, the restore, help and menu buttons, a decoration slot for the host's badges, the description and the validation message. It hands the control the ids and ARIA attributes it needs through a render function, so any control (a React Aria `Input`, a select trigger, a custom widget) becomes a field. `getFieldUndo` lets a host's shortcut handler undo or redo the focused field, and `FieldRestoreButton` restores a value wherever a control offers one. `validateString` checks text against length and format rules. Field controls (a text field, a number field) share their props through `FieldInputProps` and build on `useFieldControl` and `toAriaControlProps`. `FieldPreviousValue` shows a value an edit replaced or removed, beside the current one. A field shows its validation when its validation mode allows, can check its value asynchronously, shows external errors by name, and can report its error to the browser's constraint validation; the nearest [Form](FORM.md) or `Fieldset` hands it defaults through the field scope. `Fieldset` groups fields under a legend and disables them together.

## UIC-FIELD-1 - Layout

### UIC-FIELD-1.1 - Label and control

`Field` shall draw its `label` text in a `<label>` element (`ui-field__label`) for the control, and call its `children` with the control's props: an `id` the label points at, `aria-labelledby` naming the label (`aria-label` in the `control-only` layout), the description and state attributes below, and a `ref` through which the control publishes its element. The control's accessible name is the label text; pressing the label focuses the control. The label text is drawn through `TextMatch`, so a `TextMatchProvider` above the field highlights matching label text without changing the name.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-1.2 - Label layouts

`labelLayout` shall choose where the label sits and publish it as `data-label-layout`: `label-control` (the default) puts the label before the control, `control-label` after it, `label-colon-control` before it followed by a colon (`ui-field__colon`, hidden from assistive technology), and `control-only` draws no label: the control is named by `aria-label` with the label text instead. The reference sheet stacks `label-control` and lays the other layouts on one row.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`, `labs/reference/field.css`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-1.3 - Description

`description` shall render in `ui-field__description` below the control and be the first reference of the control's `aria-describedby`.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-1.4 - Help

`help` shall draw a help button (`ui-field__help`, an `IconButton` with the `help` glyph) after the control, named by the provider string `fieldHelp` from the label (`Help for <label>`). The button shows the help in a `Tooltip` on hover and keyboard focus, and a hidden copy of the help describes the button, so the help is announced when the button is reached even before the tooltip opens.

Implementation: `src/components/field/field-parts.tsx`, `src/core/strings.ts`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-1.5 - Required marker

A required field (`isRequired`) shall draw an asterisk in `ui-field__required` inside its label (when the layout draws one), hidden from assistive technology, publish `data-required` on its root and give its control `aria-required="true"`, so the requirement is announced from the control rather than from the asterisk.

Implementation: `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-1.6 - Decoration

`decoration` shall render the host's marks for the field (badges, state labels) in `ui-field__decoration` after the field's buttons. The decoration describes the control: its id follows the description in the control's `aria-describedby`.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-1.7 - Read-only and disabled

A read-only (`isReadOnly`) or disabled (`isDisabled`) field shall publish `data-readonly` or `data-disabled` on its root and pass `readOnly` or `disabled` to its control. It refuses every change (UIC-FIELD-2.4) and never shows dirty state. A disabled field's menu button is disabled and its context menu unavailable; a read-only field keeps its menu, with Clear and Set to default disabled.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`, `src/components/field/field-menu.tsx`
Verification: `src/components/field/field.test.tsx`, `src/components/field/field-menu.test.tsx`

### UIC-FIELD-1.8 - Hooks and caller attributes

`Field` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root. A caller `id` goes on the root and every part's id derives from it (`<id>-control`, `<id>-label`, `<id>-description`, `<id>-decoration`, `<id>-message`); without one the ids derive from a generated id.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-1.9 - Interaction states

`Field` shall publish on its root `data-focused` while focus is inside the field (its control, its buttons and the popovers they open, which React's focus events reach through portals), `data-touched` once focus has left the field (`state.touch()`, also when the focused part unmounts) and `data-filled` while the value is not empty (UIC-FIELD-3.1), so a stylesheet can wait for interaction.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-form.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/field-form.test.tsx`

## UIC-FIELD-2 - Value and commit

### UIC-FIELD-2.1 - Value

`useFieldState` shall take a controlled `value` with `onChange`, or hold the value itself. An uncontrolled field starts at its `committedValue` when given and otherwise at its `defaultValue`. `setValue` changes the value and calls `onChange`.

Implementation: `src/components/field/field-state.ts`
Verification: `src/components/field/field-state.test.tsx`

### UIC-FIELD-2.2 - Commit

`commit()` shall finish an edit: when the value differs from the committed value it calls `onCommit` with the value and, unless the caller controls `committedValue`, makes it the committed value. A field the caller controls stays dirty until the caller passes the new committed value. An uncontrolled committed value starts at the committed value, the controlled value or the default, whichever is given first.

Implementation: `src/components/field/field-state.ts`
Verification: `src/components/field/field-state.test.tsx`

### UIC-FIELD-2.3 - Dirty state

A field shall be dirty while its value differs from its committed value by structure (key order and object identity do not count) and publish `data-dirty` on its root. A read-only or disabled field is never dirty.

Implementation: `src/components/field/field-state.ts`, `src/components/field/field-value.ts`, `src/components/field/field.tsx`
Verification: `src/components/field/field-state.test.tsx`, `src/components/field/field.test.tsx`

### UIC-FIELD-2.4 - Locked fields

A read-only or disabled field shall refuse every change: `setValue`, `commit`, restore, clear, set to default, undo and redo do nothing and call no callback.

Implementation: `src/components/field/field-state.ts`
Verification: `src/components/field/field-state.test.tsx`

### UIC-FIELD-2.5 - Clear and set to default

`clear()` shall set the `emptyValue` and `setToDefault()` the `defaultValue`, each followed by a commit. `canClear` holds while the field is editable, not required, has an `emptyValue` and does not already hold it; `canSetDefault` while it is editable, has a `defaultValue` and does not already hold it. Otherwise the action does nothing.

Implementation: `src/components/field/field-state.ts`
Verification: `src/components/field/field-state.test.tsx`

## UIC-FIELD-3 - Validation

### UIC-FIELD-3.1 - Status and message

A field's `validation` shall have a status and, unless valid, a message, decided in this order: a required field with an empty value (nothing, blank text or an empty list) is `invalid` with the provider string `valueRequired`; an issue of severity `error` from `validate` is `invalid` with its message; while `isPending` the field is `pending` with the provider string `validating`; an issue of severity `warning` is `warning` with its message; otherwise the field is `valid`.

Implementation: `src/components/field/field-state.ts`, `src/components/field/field-value.ts`, `src/core/strings.ts`
Verification: `src/components/field/field-state.test.tsx`

### UIC-FIELD-3.2 - Validation hooks

`Field` shall publish the status as `data-validation` on its root and show the message in `ui-field__message`, which carries `data-severity` (`error` while invalid, `warning` while warning).

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-3.3 - Validation ARIA

An invalid field's control shall carry `aria-invalid="true"` and `aria-errormessage` naming the message. Whenever a message shows, its id is the last reference of the control's `aria-describedby`, so a warning or pending note describes the control too.

Implementation: `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-3.4 - Announcing messages

The message element shall stay in the document while empty, as a polite atomic live region (`aria-live="polite"`, `aria-atomic="true"`), so assistive technology announces each new message without interrupting typing.

Implementation: `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-3.5 - Several issues

`validate` shall return no issue, one, or a list of them. `state.issues` lists every issue the field shows, errors first, and the message is the first error's (or warning's). An issue may name the validity state it matches in `validity`, as the browser's `ValidityState` names them: a required field left empty gives `valueMissing`, the string rules `tooShort`, `tooLong` and `patternMismatch` (UIC-FIELD-7.4), a number field's range and step rules `rangeUnderflow`, `rangeOverflow` and `stepMismatch`, and external errors `customError`.

Implementation: `src/components/field/field-validation.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/field-validation.test.tsx`

### UIC-FIELD-3.6 - Rendering the message

`renderMessage(validation, issues)` shall render the content of the message element while it shows a message, so a host can word a message per validity state or list every issue; without it the element shows the message. The element stays the polite live region of UIC-FIELD-3.4.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-parts.tsx`
Verification: `src/components/field/field.test.tsx`

### UIC-FIELD-3.7 - Validation mode

`validationMode` shall choose when a field shows its validation: `immediate` from the start, `change` once its value changes through the field or focus leaves it, `blur` once focus leaves it, `submit` once its form shows it (`revealValidation()`, which a form calls on submit). Until then `validation` is `valid`, with no message, ARIA or issues; once shown it follows the value. `realtimeValidation` is always the current value's validation, shown or not. A field without a mode takes the mode of the nearest form and is otherwise `immediate`.

Implementation: `src/components/field/field-validation.ts`, `src/components/field/field-state.ts`, `src/components/field/field-scope.ts`
Verification: `src/components/field/field-validation.test.tsx`, `src/components/field/field-form.test.tsx`

### UIC-FIELD-3.8 - Asynchronous validation

`validateAsync(value, signal)` shall run once the value has stayed unchanged for `validationDebounce` milliseconds (0 by default), unless the value already has an error. Until its result for the current value arrives the field is `pending`; its issues then join the field's, and a check that rejects reports none. A newer value aborts the older check through `signal`, and a result counts only for the value it checked.

Implementation: `src/components/field/field-async.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/field-async.test.tsx`

### UIC-FIELD-3.9 - External errors

A field with a `name` shall show the nearest form's `validationErrors` for that name (a message or a list) as errors with the validity `customError`, first among its issues and whatever its validation mode. They clear once the value differs from the value they were given for; a new errors object shows them again.

Implementation: `src/components/field/field-validation.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/field-validation.test.tsx`, `src/components/field/field-control.test.tsx`

### UIC-FIELD-3.10 - Native constraint validation

`validationBehavior` (the nearest form's, else `aria`) shall decide whether the browser sees the field's validation. In the `native` behavior, while the value has an error or is being checked, the field gives its control element, when it takes part in constraint validation (an input, a text area), the message as its custom validity, and clears it otherwise, so `checkValidity()` fails and the browser blocks a native submit. An `invalid` event at the control shows the field's validation; inside a form the field prevents the browser's own message. In the `aria` behavior the field leaves the control's validity alone.

Implementation: `src/components/field/field-form.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/field-form.test.tsx`

## UIC-FIELD-4 - Restore

### UIC-FIELD-4.1 - Restoring a field

While dirty, a field shall show a `FieldRestoreButton` after its control, named from its label (`Restore <label>`). Pressing it puts the committed value back. A pointer press leaves focus on the control; a keyboard press moves focus to the control before the button leaves.

Implementation: `src/components/field/field.tsx`, `src/components/field/field-restore-button.tsx`
Verification: `src/components/field/field.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-4.2 - Restore button

`FieldRestoreButton` shall be an `IconButton` with the `restore` glyph named by the provider string `restoreValue` from its `label`, whose pointer press does not move focus. It takes the `IconButton` props (`onPress`, `isDisabled`, `size`, `className`, `data-*`) and works from the keyboard like any button.

Implementation: `src/components/field/field-restore-button.tsx`, `src/core/strings.ts`
Verification: `src/components/field/field-restore-button.test.tsx`

## UIC-FIELD-5 - Undo and redo

### UIC-FIELD-5.1 - History

`useFieldState` shall record every distinct value the field shows, from edits, actions and controlled changes alike, keeping the last 100. `undo()` and `redo()` step back and forward through them, each followed by a commit; a new value after an undo drops the values that could be redone. `canUndo` and `canRedo` tell whether a step is possible; a read-only or disabled field has none.

Implementation: `src/components/field/field-state.ts`, `src/components/field/field-history.ts`
Verification: `src/components/field/field-history.test.ts`, `src/components/field/field-state.test.tsx`

### UIC-FIELD-5.2 - Shortcuts

Ctrl+Z or Cmd+Z pressed inside a field shall undo that field, and Ctrl+Shift+Z, Cmd+Shift+Z or Ctrl+Y redo it, preventing the browser's default. Only the field holding focus changes. A chord with nothing to undo or redo, one already handled, or one pressed in a menu the field opened is left alone.

Implementation: `src/components/field/field-undo.ts`, `src/components/field/field.tsx`
Verification: `src/components/field/field-undo.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-5.3 - Undo registry

Each mounted field shall register its undo on its root element. `getFieldUndo(element)` returns the undo of the nearest field at or above `element` (`canUndo`, `canRedo`, `undo()`, `redo()`), or `null` outside any field, so a host's shortcut handler passes the focused element and changes only that field. No event reaches the other fields.

Implementation: `src/components/field/field-undo.ts`, `src/components/field/field.tsx`
Verification: `src/components/field/field-undo.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-5.4 - Removing a registration

An unmounted field's registration shall be gone, and removing an earlier registration of an element shall leave a later registration of the same element in place.

Implementation: `src/components/field/field-undo.ts`
Verification: `src/components/field/field-undo.test.tsx`

## UIC-FIELD-6 - Field menu

### UIC-FIELD-6.1 - Entries

`menu` shall list the field menu's entries in the caller's order: the built-in actions by name, `clear` (provider string `clear`, `close` glyph), `set-default` (`setDefault`, `refresh` glyph) and `help` (`help`, `help` glyph), and any `Menu` entry.

Implementation: `src/components/field/field-menu.tsx`, `src/core/strings.ts`
Verification: `src/components/field/field-menu.test.tsx`

### UIC-FIELD-6.2 - Availability

Clear shall be disabled unless the field can be cleared and Set to default unless it can be set to its default (UIC-FIELD-2.5); Help is always enabled. A field with an empty `menu` draws no menu button and leaves the browser's context menu alone.

Implementation: `src/components/field/field-menu.tsx`, `src/components/field/field.tsx`
Verification: `src/components/field/field-menu.test.tsx`

### UIC-FIELD-6.3 - Opening

The field menu shall open from a menu button after the control (`ui-field__menu`, a `DropdownMenu` showing the `more` glyph) and as the field's context menu: a secondary click or long touch anywhere on the field, or Shift+F10 or the Context Menu key inside it. Both are named by the provider string `fieldActions` from the label (`<label> actions`).

Implementation: `src/components/field/field-menu.tsx`, `src/components/field/field.tsx`, `src/core/strings.ts`
Verification: `src/components/field/field-menu.test.tsx`, `e2e/field.spec.ts`

### UIC-FIELD-6.4 - Actions

Choosing Clear or Set to default shall apply it to the field state. `onMenuAction` then receives the id of every chosen entry, built-in or not, so a host can act on Help or its own entries.

Implementation: `src/components/field/field-menu.tsx`
Verification: `src/components/field/field-menu.test.tsx`, `e2e/field.spec.ts`

## UIC-FIELD-7 - String rules

### UIC-FIELD-7.1 - Length

`validateString(value, rules, messages)` shall return an error with the provider string `tooShort` for a text shorter than `minLength` and `tooLong` for one longer than `maxLength`, counting characters (code points).

Implementation: `src/components/field/string-rules.ts`, `src/core/strings.ts`
Verification: `src/components/field/string-rules.test.ts`

### UIC-FIELD-7.2 - Format

A text that does not match `pattern` as a whole shall get an error with the provider string `patternMismatch`.

Implementation: `src/components/field/string-rules.ts`
Verification: `src/components/field/string-rules.test.ts`

### UIC-FIELD-7.3 - Trimming and empty text

With `trim`, the rules shall check the text without its leading and trailing whitespace. An empty text passes every rule and the function returns `null`; requiring a value is the field's `isRequired`.

Implementation: `src/components/field/string-rules.ts`
Verification: `src/components/field/string-rules.test.ts`

### UIC-FIELD-7.4 - Counting and naming

`getLength` shall count a text's length for `minLength` and `maxLength`, in place of code points (`countCodePoints`), so a grapheme counter counts a combined emoji once. Each error names its rule in `validity`: `tooShort`, `tooLong` or `patternMismatch`.

Implementation: `src/components/field/string-rules.ts`
Verification: `src/components/field/string-rules.test.ts`

## UIC-FIELD-8 - Field controls

### UIC-FIELD-8.1 - Control props

Every field control shall take the field's props through one type, `FieldInputProps<T>`: the `useFieldState` options (value, default, committed and empty values, `onChange`, `onCommit`, `validate`, `validateAsync`, `validationDebounce`, `validationMode`, `validationBehavior`, `name`, `isRequired`, `isReadOnly`, `isDisabled`, `isPending`) and the `Field` props but its state and render function (label, layout, description, help, decoration, menu, `onMenuAction`, `renderMessage`, `className`, `id` and caller `data-*`). `useFieldControl(props, options)` shall split a control's props into the field state, the props for `Field` and the control's own props. A field with no value, committed value or default starts at the control's `initialValue`, which is then also its default; a field with no `emptyValue` clears to the control's `emptyValue`; the control's `check` runs before the caller's `validate`, and its error wins. The form `name` goes to both the field state (UIC-FIELD-3.9) and the control's own props, so the control still submits under it.

Implementation: `src/components/field/field-control.ts`
Verification: `src/components/field/field-control.test.tsx`

### UIC-FIELD-8.2 - React Aria control props

`toAriaControlProps(control)` shall give a React Aria control the field's id, `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-errormessage`, and its states as `isInvalid`, `isRequired`, `isReadOnly` and `isDisabled`, with `validationBehavior="aria"` so the field alone validates and React Aria only reports the status.

Implementation: `src/components/field/field-control.ts`
Verification: `src/components/field/field-control.test.tsx`

## UIC-FIELD-9 - Previous values

### UIC-FIELD-9.1 - Marker

`FieldPreviousValue` shall mark a value the edit replaced or removed, so a control can show it beside the current value: a `<span>` (`ui-field-previous-value`) holding the value content (text, or an icon and its label) in a `<del>` element (`ui-field-previous-value__value`), which the reference sheet strikes through. The value stays readable to assistive technology. It appends the caller's `className` and forwards caller `data-*` attributes and `id`.

Implementation: `src/components/field/field-previous-value.tsx`, `labs/reference/field.css`
Verification: `src/components/field/field-previous-value.test.tsx`

### UIC-FIELD-9.2 - Restoring a previous value

With `onRestore`, the marker shall end with a `FieldRestoreButton` named from `restoreLabel` (or the text content) that calls `onRestore` once per press, keeps pointer focus where it was and is disabled while `isDisabled`. Without `onRestore` the marker only shows the value.

Implementation: `src/components/field/field-previous-value.tsx`
Verification: `src/components/field/field-previous-value.test.tsx`

## UIC-FIELD-10 - Fieldset

### UIC-FIELD-10.1 - Legend and group

`Fieldset` shall render a native `<fieldset>` (`ui-fieldset`) around its children, with `legend` in a `<legend>` (`ui-fieldset__legend`) that names the group. It appends the caller's `className` and forwards caller `data-*` attributes, `id` and the native fieldset props (`name`, `form`, `aria-*`).

Implementation: `src/components/field/fieldset.tsx`, `labs/reference/field.css`
Verification: `src/components/field/fieldset.test.tsx`, `e2e/form.spec.ts`

### UIC-FIELD-10.2 - Shared disabled state

`isDisabled` shall disable the fieldset natively, which disables its native controls, publish `data-disabled` and disable every field inside through the field scope: their state refuses every change (UIC-FIELD-2.4), their controls are disabled and they never block a form's submit. A fieldset inside a disabled one publishes `data-disabled` too.

Implementation: `src/components/field/fieldset.tsx`, `src/components/field/field-scope.ts`, `src/components/field/field-state.ts`
Verification: `src/components/field/fieldset.test.tsx`, `src/components/field/field-validation.test.tsx`, `e2e/form.spec.ts`

## Hooks

| Hook                             | Kind      | Values                                                                  | Description                                                      |
| -------------------------------- | --------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ui-field`                       | root      |                                                                         | The field's `<div>`.                                             |
| `ui-field__label`                | slot      |                                                                         | The `<label>`; the `control-only` layout draws none.             |
| `ui-field__required`             | slot      |                                                                         | The asterisk of a required field, inside the label.              |
| `ui-field__colon`                | slot      |                                                                         | The colon of the `label-colon-control` layout, inside the label. |
| `ui-field__control`              | slot      |                                                                         | Holds the control.                                               |
| `ui-field__help`                 | slot      |                                                                         | The help button (also `ui-icon-button`).                         |
| `ui-field__menu`                 | slot      |                                                                         | The menu button (also `ui-dropdown-menu` and `ui-icon-button`).  |
| `ui-field__decoration`           | slot      |                                                                         | The host's badges and marks.                                     |
| `ui-field__description`          | slot      |                                                                         | The description.                                                 |
| `ui-field__message`              | slot      |                                                                         | The validation message; empty while valid.                       |
| `data-label-layout`              | attribute | `label-control`, `control-label`, `label-colon-control`, `control-only` | Where the label sits.                                            |
| `data-validation`                | state     | `valid`, `invalid`, `warning`, `pending`                                | Validation status.                                               |
| `data-dirty`                     | state     | `true`                                                                  | The value differs from the committed value.                      |
| `data-required`                  | state     | `true`                                                                  | A value is required.                                             |
| `data-readonly`                  | state     | `true`                                                                  | Read-only.                                                       |
| `data-disabled`                  | state     | `true`                                                                  | Disabled.                                                        |
| `data-touched`                   | state     | `true`                                                                  | Focus has left the field at least once.                          |
| `data-filled`                    | state     | `true`                                                                  | The value is not empty.                                          |
| `data-focused`                   | state     | `true`                                                                  | Focus is inside the field, popovers it opens included.           |
| `data-severity`                  | state     | `error`, `warning`                                                      | On the message: the severity of the message shown.               |
| `ui-field-restore-button`        | root      |                                                                         | A restore button (also `ui-icon-button`).                        |
| `ui-field-previous-value`        | root      |                                                                         | A previous-value marker.                                         |
| `ui-field-previous-value__value` | slot      |                                                                         | The previous value, in a `<del>` element.                        |
| `ui-fieldset`                    | root      |                                                                         | A fieldset's `<fieldset>`.                                       |
| `ui-fieldset__legend`            | slot      |                                                                         | The fieldset's `<legend>`.                                       |
