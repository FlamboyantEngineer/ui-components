---
'@flamboyantengineer/ui-components': minor
---

Chat, ChatMessage, ChatList, VersionHistory and DescriptionRow read the provider clock and time zone instead of the device's, so a server render and its hydration agree. `groupChatMessages` and `formatDescriptionValue` now require a `timeZone` (pass `useTimeZone()`), ChatList's default clock is the provider's, and a ChatList row's name follows its shown time and updates when the words change.
