---
'@flamboyantengineer/ui-components': minor
---

`ChatList` is a sidebar of single-line rows. New chat is a row at the top, an optional `heading` (such as "Recents") names the list, and `onLoadMore` adds a Load more row and fades the last two rows while more can load. A row shows its title and only what else the conversation gives: an `icon` or avatar at its start, a host `status` mark (`{ icon, label }`, such as the new `HistoryGlyph`), an `activity` ("Typing", "Working") drawn as pulsing dots, the last message, time and unread count; each is read in the row's name. The search field is opt-in with `showSearch`. `renderActions` is removed: a conversation's commands live in its context menu (`renderContextMenu`).
