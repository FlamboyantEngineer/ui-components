---
'@flamboyantengineer/ui-components': minor
---

`ChatMessage` and `Chat` take `collapseFooterTime` (default `false`), published on the message as `data-collapse-footer-time`: the reference stylesheet then gives a footer that holds only the time no room until the message is hovered or focused, and slides its line open after a short pause, so a pointer passing over the chat moves nothing. Without it the time's line stays. `AnchoredTooltip` places its arrow out of the panel's flow on the side facing the anchor, as `Tooltip` does, so the panel is no taller than its content.
