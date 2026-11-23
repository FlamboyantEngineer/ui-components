---
'@flamboyantengineer/ui-components': minor
---

`ChatMessage` renders its `ui-chat-message__actions` inside the bubble (`ui-chat-message__content`), after the `BubbleContent`, so a stylesheet anchors the actions bar to the bubble the reader sees rather than to the wider message body. The reference stylesheet now keeps the bar at the bubble's upper-left corner for a sent message (upper-right otherwise), also for a long sent message on a wide screen. The actions now come before the footer, error and reactions in reading and focus order, and the transcript still announces the content's text alone.
