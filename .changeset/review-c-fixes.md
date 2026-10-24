---
'@flamboyantengineer/ui-components': patch
---

Fix accessibility and behaviour gaps in the buttons, fields and toolbars.

- `Button` and `IconButton`: a button with `href` now passes `aria-label`, `aria-labelledby`, `aria-details`, `hidden`, `onKeyDown`, `onKeyUp` and `onFocusChange` to its link, and a disabled link's `<span>` drops `target` and `rel`. A toggle no longer adds `aria-pressed` when the caller states a `role` or `aria-checked`. The `isPending` documentation now says Button keeps its icons and label under the busy indicator, and the specs say how React Aria names a pending button that has `aria-label` (its label followed by the busy indicator's name).
- `ActionButton`: a `type="submit"` or `type="reset"` button keeps its type, submits its form with the press that starts the action (in a browser, React Aria's switch to a plain button used to cancel that submission) and refuses repeat submissions until the action settles, also during `pendingDelay`.
- `LoadMore`: renders a `Button` with one pending lifecycle instead of wrapping an `ActionButton`; its markup and behaviour are unchanged.
- `Link`: a disabled link, or one without `href`, no longer draws the new-tab glyph and text.
- `FileUpload`: the hidden form input is disabled with the upload, so a disabled upload submits no files and neither a disabled nor a read-only upload refuses a form submit. After a removed file leaves the list, focus moves to the next remove button, else the previous one, else the command. Overlapping offers with an async `validate` no longer pass `maxFiles` together, and the latest offer's refusals show. The form input's files are set again only when the listed files change.
- `SegmentedChoice`: a read-only multiple selection no longer sets `aria-readonly` on its toolbar, which WAI-ARIA does not allow there; `data-readonly` and the ignored presses stay.
- `GridSizePicker`: Enter or Space chooses the focused cell, not the cell under the pointer.
- `Combobox`: the clear button of a multiple combobox empties the typed text and keeps the chips instead of reporting an empty value; a pointer press on the clear button keeps focus in the input, also while the list is open. The chips group takes its name from a label drawn as markup or from the elements `aria-labelledby` names.
- `ActionRow`: an action without its own `tooltip` is no longer described by the tooltip that repeats its label.
- `CompletionList`: `scoreCompletion` ranks a later word prefix as a word prefix (`na` in `new_name`). While a source's answer to an edit is pending, an open list stays open, narrowed to the typed text, instead of closing on every keystroke. An option's label and description are separated by a space, so its name reads "Lyon France" rather than "LyonFrance".
- `CopyButton`: every copy is announced, also a second one within the timeout.
- `ZoomControl`: one slider step from a value between levels requests the neighbouring level, as the step buttons do.
- `ToolbarScroller` and `useScrollStripOverflow`: a strip that mounts after the first render, as after a switch from `overflow="menu"` to `"scroll"`, takes wheel input and tracks its children.
