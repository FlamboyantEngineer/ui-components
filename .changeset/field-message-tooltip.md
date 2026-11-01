---
'@flamboyantengineer/ui-components': minor
---

Fields take `messageDisplay` (`inline` by default, or `tooltip`), published as `data-message-display`. With `tooltip`, the message region stays in the field, so it still describes the control and announces changes, but the reference sheet hides it visually. The message (every issue `renderMessage` lists) instead shows in a tooltip against the control (`ui-field__message-tooltip`) while the field is focused or hovered. Escape hides the tooltip. A message coming or going never moves the layout.
