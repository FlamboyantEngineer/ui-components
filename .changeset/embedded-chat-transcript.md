---
'@flamboyantengineer/ui-components': minor
---

`ChatTranscript` and `Chat` take `presentation`: `framed` (the default) keeps the transcript's own bordered, rounded canvas, and `embedded` drops that frame so a conversation placed in a panel or tab uses the surrounding surface. The transcript publishes `data-presentation`; its padding, scrolling, following, keyboard model, unread and jump controls and announcements are the same in both.
