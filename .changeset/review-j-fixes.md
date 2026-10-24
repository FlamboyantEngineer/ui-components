---
'@flamboyantengineer/ui-components': minor
---

Keep unavailable menu items and field restore buttons within keyboard reach.

- `MenuItem`: new `focusableWhenDisabled` prop. With `isDisabled`, the item stays in keyboard navigation (arrow keys, Home, End, type-to-select and hover reach it) with `aria-disabled="true"` and `data-disabled`, so its description can explain why it is unavailable; a press, Enter or Space does nothing, changes no selection, follows no link and keeps the menu open. A `SubmenuTrigger`'s item ignores it. A `MenuItem` with `isDisabled={false}` no longer overrides the menu's `disabledKeys`.
- `TransitionMenu`: a transition with a `disabledReason` can now be reached with the arrow keys, so screen reader and keyboard users hear its reason; it is announced as unavailable and cannot be chosen.
- `JsonEditor`, `RichTextEditor` and `SignaturePad` (typed name): the field commits when focus leaves it rather than when the editor or input loses focus, so Tab from an edited control reaches the restore button instead of losing focus. Format, Enter and drawn strokes still commit at once.
- `ColorField` with `allowsTyping`: leaving the colour input applies the typed text, and the field commits it once focus leaves the field (Enter still commits at once), so moving to the swatch button or the restore button commits nothing.
