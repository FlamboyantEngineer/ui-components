---
'@flamboyantengineer/ui-components': minor
---

Add message display options. `ChatMessage` takes `showAvatar`, `showAuthorName`, `showTime` and `variant` (`bubble`, the default, or `plain`), published as `data-variant`, with `data-avatar-hidden` while the avatar is hidden. `Chat` takes `showAvatars`, `showAuthorNames`, `showTimes`, `sentVariant` and `receivedVariant`, so a conversation can drop avatars, names and times and draw replies as plain text on the page while the reader's own messages keep their bubble. Each message keeps its author and time in its accessible name. The defaults keep today's look.
