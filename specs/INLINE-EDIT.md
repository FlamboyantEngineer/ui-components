# Inline Edit

`InlineEdit` shows a value read in place, such as a record's title or a property on a detail page, and turns it into its editor where it stands: a press or F2 on the read view opens the editor, Enter or focus leaving it saves, and Escape cancels. The editor is the caller's (`renderEditor`): any field control, such as a [Text Field](TEXT-FIELD.md), [Number Field](NUMBER-FIELD.md), [Select Field](SELECT-FIELD.md) or [Date-Time Field](DATE-TIME-FIELD.md); without one, a one-line Text Field edits a text value. A save may be asynchronous: the editor stays open and pending until it settles, and shows why it failed with an [Inline Error](INLINE-ERROR.md). The read view is a React Aria `Button`. The caller owns the value and saves it.

## UIC-INLINE-EDIT-1 - Reading and editing

### UIC-INLINE-EDIT-1.1 - Read view

`InlineEdit` shall render a `<div>` root (`ui-inline-edit`) holding, while not editing, a button (`ui-inline-edit__read`) that shows the value (`ui-inline-edit__value`), drawn by `renderValue` or else as text, followed by the `edit` glyph (`ui-inline-edit__icon`). While the value is empty (nullish, blank text or an empty list) the button shows `placeholder` instead (`ui-inline-edit__placeholder`) and the root publishes `data-empty`. In the reference sheet, hovering the read view gives it a light fill and shows a small (12-pixel) pencil, and keyboard focus draws the editing control's own focus frame (a focus-coloured border and a thin ring) rather than a wider halo, so the frame keeps its size when Enter commits an edit and focus returns to the read view.

Implementation: `src/components/inline-edit/inline-edit.tsx`, `src/components/inline-edit/use-inline-edit.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.2 - Opening the editor

A press on the read view (a click, Enter or Space) or F2 on it shall replace it with the editor (`ui-inline-edit__editor`, holding the editor in `ui-inline-edit__control`), publish `data-editing` on the root and move focus to the editor's first element that Tab reaches (skipping hidden inputs and any control that is disabled, inside a disabled fieldset, hidden or inert), trying the next one when focus does not land, selecting the text of an input and putting the caret at the end of a text area. `isEditing` (controlled) or `defaultEditing` open the editor, and `onEditingChange` receives each opening and closing; an editor open when the component mounts does not take focus, and focus moves only as editing turns on or off, so effects that run again over the same state (Strict Mode, a hidden `Activity` shown again) move none.

Implementation: `src/components/inline-edit/inline-edit.tsx`, `src/components/inline-edit/use-inline-edit.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.3 - The editor

`renderEditor` shall draw the editor from the value being edited (`value`), which starts at the saved value each time the editor opens, through `isEditing` too, `onChange` to change it, `commit(value?)` to save it (or the value given, as a select does on a choice), `cancel()`, the `label` that names the editor's control and `isPending`. Without `renderEditor`, a one-line [Text Field](TEXT-FIELD.md) named by `label` in the `control-only` layout edits the value as text, without showing its own dirty state.

Implementation: `src/components/inline-edit/inline-edit.tsx`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.4 - Saving

Enter in the editor shall save the value being edited, except on a button, on a control whose list is expanded, in a text area or an editable region without Control or Meta, or while an input method composes, including the Enter reported with key code 229 as a composition ends; focus leaving the editor, and any overlay the editor opened, shall save it too. A press inside the editor decides for itself, since some browsers focus no button on a press and the editor blurs to nothing: the save on leaving waits until the press ends, and runs only if focus is then outside the editor and the press did not close it. The editor's own control still receives that Enter (its default action, such as submitting a form, is prevented and it goes no further than the editor), and the save waits until the task that delivered the Enter or the blur ends, then reads the value being edited at that moment, so a control that commits its text on Enter or blur (a number field parsing `42`) saves what it took in. A save so delayed belongs to the editing session that asked for it: once that session ends (the owner closes the editor, or closes and reopens it, before the save runs) it saves and closes nothing. An editor's `commit` saves the value being edited, or the value it is given, which then becomes the value being edited; a given `null` or `undefined` is a value like any other, distinct from giving none. Saving a value equal to the saved one (by structure) only closes the editor; a changed value calls `onSave` with it and closes the editor once saved. Closing after Enter, `commit` or the save button returns focus to the read view; closing because focus left keeps focus where it went.

Implementation: `src/components/inline-edit/use-inline-edit.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.5 - Cancelling

Escape in the editor, except in an overlay the editor opened, on a control whose list is expanded or while an input method composes, shall close the editor without saving, discarding the value being edited, prevent the key's default and stop it there, so an enclosing dialog stays open; focus returns to the read view.

Implementation: `src/components/inline-edit/use-inline-edit.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.6 - Pending and failed saves

While a promise returned by `onSave` is pending, the root shall publish `data-pending`, the editor receives `isPending` and stays editable, and cancels are ignored. A save asked for meanwhile (Enter, focus leaving, `commit`) waits for the pending one and then saves what it asked for if that changed: the value `commit` was given, else the value being edited when the queued save starts, through the `onSave` (and failure message) current when it starts, while a save already running keeps the callback it started with. A save, pending or queued, never changes the value being edited, so an edit made after a save was asked for stays in the editor. When the last save resolves the editor closes only if the value being edited is the one saved: otherwise it stays open with the newer value until it is saved, so text accepted while saving is never dropped. Each opening and closing of the editor, controlled or not, is a new session: a save that settles after its session ended, or after the inline edit unmounted, closes, clears and reports nothing; when it rejects the editor stays open with the value being edited, the root publishes `data-invalid` and an [Inline Error](INLINE-ERROR.md) (`ui-inline-edit__error`) after the editor shows the rejection's message, or the provider's `saveFailed` string when it has none, until the next save or the editor closes.

Implementation: `src/components/inline-edit/inline-edit.tsx`, `src/components/inline-edit/use-inline-edit.ts`, `src/core/strings/view.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.7 - Save and cancel buttons

With `showActions`, the editor shall end with a group (`ui-inline-edit__actions`) of two small icon buttons: save (`ui-inline-edit__save`, the `check` glyph named by the provider's `save` string), pending while a save runs, and cancel (`ui-inline-edit__cancel`, the `close` glyph named by `cancel`), disabled while a save runs. Moving focus to them does not save, and pressing cancel never saves, also where a press takes no focus.

Implementation: `src/components/inline-edit/inline-edit.tsx`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

### UIC-INLINE-EDIT-1.8 - Disabled

With `isDisabled`, explicit or inherited from a disabled scope, the read view shall be a disabled button without the edit glyph that never opens the editor, and the root publishes `data-disabled`. An editor already open (opened before, by `defaultEditing` or by a controlled `isEditing`) stays open and keeps its draft but is frozen: `renderEditor` receives `isDisabled` (the default text field and the save button are disabled), changes are ignored, and Enter, focus leaving, the save button and `commit` start no save. A save already running finishes and closes the editor as usual; a save queued behind it has not started and is dropped, leaving its draft. Escape still closes the editor without saving. Once enabled again, the draft saves as usual.

Implementation: `src/components/inline-edit/inline-edit.tsx`
Verification: `src/components/inline-edit/inline-edit.test.tsx`

### UIC-INLINE-EDIT-1.9 - Hooks and caller attributes

`InlineEdit` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/inline-edit/inline-edit.tsx`
Verification: `src/components/inline-edit/inline-edit.test.tsx`

## UIC-INLINE-EDIT-2 - Accessibility

### UIC-INLINE-EDIT-2.1 - Names and announcements

The read view shall be named by the provider's `editValue` string for `label`, held for assistive technology only, followed by the value or placeholder it shows, so its name holds its visible text; the default editor's control is named by `label`, and a failed save's message is an assertive alert.

Implementation: `src/components/inline-edit/inline-edit.tsx`, `src/core/strings/view.ts`
Verification: `src/components/inline-edit/inline-edit.test.tsx`, `e2e/inline-edit.spec.ts`

## Hooks

| Hook                          | Kind  | Values | Description                                            |
| ----------------------------- | ----- | ------ | ------------------------------------------------------ |
| `ui-inline-edit`              | root  |        | The inline edit (`<div>`).                             |
| `ui-inline-edit__read`        | slot  |        | The read view's button.                                |
| `ui-inline-edit__value`       | slot  |        | The value shown in the read view.                      |
| `ui-inline-edit__placeholder` | slot  |        | What the read view shows while the value is empty.     |
| `ui-inline-edit__icon`        | slot  |        | The edit glyph after the value.                        |
| `ui-inline-edit__editor`      | slot  |        | The editor, its buttons and its error, while editing.  |
| `ui-inline-edit__control`     | slot  |        | The element around the caller's editor.                |
| `ui-inline-edit__actions`     | slot  |        | The save and cancel buttons.                           |
| `ui-inline-edit__save`        | slot  |        | The save button (also `ui-button`).                    |
| `ui-inline-edit__cancel`      | slot  |        | The cancel button (also `ui-button`).                  |
| `ui-inline-edit__error`       | slot  |        | Why the last save failed (also `ui-inline-error`).     |
| `data-editing`                | state | `true` | The editor is open.                                    |
| `data-pending`                | state | `true` | A save is running.                                     |
| `data-invalid`                | state | `true` | The last save failed.                                  |
| `data-empty`                  | state | `true` | The saved value is empty.                              |
| `data-disabled`               | state | `true` | The value is read only.                                |
| `data-hovered`                | state | `true` | On the read view: the pointer is over it (React Aria). |
| `data-pressed`                | state | `true` | On the read view: it is being pressed (React Aria).    |
| `data-focused`                | state | `true` | On the read view: it has focus (React Aria).           |
| `data-focus-visible`          | state | `true` | On the read view: it has keyboard focus (React Aria).  |
