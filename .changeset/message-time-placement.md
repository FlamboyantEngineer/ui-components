---
'@flamboyantengineer/ui-components': minor
---

Place a message's time in its header, under it in the footer, or nowhere. `ChatMessage` replaces `showTime` with `timePlacement` (`header`, `footer` or `none`), and `Chat` replaces `showTimes` with `timePlacement`. A time in the footer sits under the message, and the reference stylesheet shows it with the message's actions while the message is hovered or holds focus. Replace `showTime={false}` and `showTimes={false}` with `timePlacement="none"`.
