---
'@flamboyantengineer/ui-components': minor
---

`Chat` takes `toolCallTimePlacement`, the time placement of a message made only of tool calls, so a chat can show its replies' times and leave out its tool calls'; it defaults to `timePlacement`. `ChatMessage` and `Chat` take a fourth time placement, `tooltip`, which shows the time in a tooltip over the message once it has been hovered or held focus for the tooltip delay. A footer that holds only the time publishes `data-time-only`.
