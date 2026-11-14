---
'@flamboyantengineer/ui-components': minor
---

Spinner is now the library's one busy indicator: the indeterminate circular progress's quarter arc, drawn in its context's text colour, turning twice from the top back to the top with an ease in and out. Buttons, menus, comboboxes, search fields, banners, toasts, empty states, inline errors and chat activity draw it in their spinner slots, a running chat tool call shows it in place of the refresh glyph, and a pending button's spinner takes the size of the button's icons. InlineError draws its recovery as links right after the message instead of a secondary button: `retryIcon` adds a glyph to the Retry link and `actions` adds more suggested actions, such as reloading the current version. The reference sheet centres a banner's and a toast's glyph, actions and dismiss button on their content.
