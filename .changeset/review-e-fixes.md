---
'@flamboyantengineer/ui-components': patch
---

Fix behaviour in the date, choice, colour and editor fields.

- `RichTextEditor`: the block commands (move, duplicate, delete) act on every top-level block the selection touches, so a select-all followed by Alt+Shift+Up or Down no longer throws, and the block menu deletes or turns every selected block; it keeps a selection over several blocks when it opens. A block type reads active in the format toolbar only when every selected text block has it. Locking the editor closes the block menu, and unlocking no longer reopens it. The block handle no longer re-renders on every mouse move inside one block.
- Field base: each object or array value is walked once however often it is compared, so large values (documents) no longer slow every change. Values are treated as immutable: a value changed in place is not seen as changed.
- `ColorField`: `name` now submits the stored colour through a hidden input (the typed input carries no name, so the form holds the colour once). A read-only field's trigger stays focusable and enabled but never opens the picker; locking the field closes an open picker. The HSB example in the spec now matches the text the trigger writes.
- `DateTimeField`: the range calendar picks a range that spans unavailable days when its ends are available, as typed values and presets already could. Today and Now read the clock when pressed. A required field's popover has no Clear, and Clear is disabled while there is no value.
- `RelativeDateField`: Arrow Left, Arrow Right and typing on the closed trigger no longer commit the first preset; only the open list picks. A read-only field no longer calls `onOpenChange` when pressed.
- `TreeSelectField`: a read-only field no longer calls `onOpenChange` when pressed.
- `SelectField`: a multiple select's trigger shows the provider's `selectedCount` text for its choices (and `data-placeholder` only while it has none), so it is named by its choices. An option whose id is `''` shows as the choice when picked. Typing in the filter of a long list no longer redraws every option row.
- `RangeSlider`: thumbs already closer than `minStepsBetweenThumbs` no longer jump apart on one key press; a move that brings them closer is refused.
- `JsonEditor`: typing no longer waits for the whole text to be formatted to update the Format button.
