---
'@flamboyantengineer/ui-components': minor
---

`Chat` takes `activityTimePlacement`, the time placement of a message without written text (tool calls, reasoning, plans, sources, files or custom parts, alone or together, or a streaming reply with nothing written yet), so a chat can show its written messages' times and leave out its activity's; it defaults to `timePlacement`, and a written reply with sources keeps its one time. `ChatMessage` and `Chat` take a fourth time placement, `tooltip`, which shows the time in a tooltip over the message once it has been hovered or held focus for the tooltip delay. A footer that holds only the time publishes `data-time-only`.
