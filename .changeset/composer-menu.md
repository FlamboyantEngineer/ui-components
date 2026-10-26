---
'@flamboyantengineer/ui-components': minor
---

A "+" menu for the message composers:

- `MessageComposer` and `RichMessageComposer` take `menu` (`{ sections, filterable? }`): a "+" button at the start of the toolbar, in place of the attach button, opens a menu above the composer with a heading per section. Items (`MessageComposerMenuItem`) have an icon, a label, a note, a shortcut hint, a disabled state with a reason, a toggle state the host controls (`isSelected` with `onSelectedChange`, which keeps the menu open) and submenus. An item's `onAction` receives the composer's helpers (`MessageComposerHelpers`): `insertText` and `insertPill` at the caret (a pill in the rich composer, its text in the plain one), `attachFiles` (the system file chooser, then `onAttach`) and `focusInput`. `filterable` leads the menu with a search field that narrows the items by label and note. Drop and paste of files keep working.
- `Chat` forwards `composerMenu`; its tools are the "+" button, the emoji button, `composerToolbar`, the model picker, then Send or Stop.
- The plain entry point now also exports `MessageComposerToken` and `MessageComposerTokenKind`.
- Styling hooks `ui-message-composer__menu-button` and `ui-message-composer__menu`, the provider string `composerMenu`, labs and reference styles.
