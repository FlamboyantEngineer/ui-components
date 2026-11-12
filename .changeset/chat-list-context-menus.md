---
'@flamboyantengineer/ui-components': minor
---

`ChatList` takes `renderContextMenu(conversation)`: a secondary click, a long touch, the Context Menu key or Shift+F10 on a row opens a `ContextMenu` with the `Menu` it returns for that conversation, named by the new provider string `conversationMenu`. Focus returns to the row when the menu closes, and the row carries `data-menu-open` while its menu is open. A conversation it returns nothing for keeps the browser's own menu.
