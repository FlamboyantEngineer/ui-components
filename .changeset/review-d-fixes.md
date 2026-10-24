---
'@flamboyantengineer/ui-components': minor
---

Fix focus, commit, form and overlay behaviour across the field controls and overlays.

- `Field`: new `commitOnBlur` prop for controls that commit on blur: the field commits once focus leaves it (its control, buttons and popovers), not when focus moves to its own buttons. Focus moving between a field's parts no longer touches it (a `blur` mode message no longer shows while the reader is still in the field), and a focused restore button that leaves moves focus to the control instead of dropping it. A native form reset puts every field back to its first value. `commit()` after a controlled `setValue` in the same event commits the value the caller renders. Undo can step back to a first value that is `undefined`.
- `FieldPreviousValue`: content that is not plain text names the restore button from its text.
- `TextField`: Tab from an edited field reaches its restore button, and the field commits when focus leaves it. With `displayValue` and `name`, the form submits the value through a hidden input instead of the display text. With `trim`, the character count counts the trimmed text.
- `PinInput`: commits when focus leaves the field, so Tab reaches the restore button; `onComplete` and `onCommit` receive the value a controlled caller renders; a native form reset empties it again.
- `NumberField`: Tab reads the typed number before focus moves and the field commits once focus leaves it, so Tab reaches the restore button. Shift or Alt with an arrow steps an empty value up to the minimum and down to the maximum, as the plain arrows do.
- `TagsInput`: typing no longer renders every tag again; a controlled caller's change to the tags is what commits; a native form reset puts the first tags back.
- `Form`: mounting or submitting a large form notifies its problems once per commit and reads the fields only when a `ProblemList` asks.
- `Modal` and `ConfirmDialog`: inside a `ModalTrigger` or `DialogTrigger`, the dialog's own `onOpenChange` reports the closes it makes, so `ConfirmDialog` calls `onCancel` there too.
- `ContextMenuTrigger`: a secondary click or long touch on a text control inside the target keeps the browser's own menu; a disabled trigger mounts no menu and closes an open one. `ContextMenu` renders its fallback anchor element only without `triggerRef`, so a field adds no element beside its root.
- `TruncationTooltip`: focus a script moves after a pointer press (focus restoration) no longer opens the tooltip; only visible keyboard focus does.
