---
'@flamboyantengineer/ui-components': patch
---

Menus opened from a `MenuTrigger` (the composer "+" menu, the model picker and other `MenuPopover` menus) no longer lock the page: it stays scrollable, reachable and visible to assistive technology while the menu is open. As the page scrolls, the menu stays open and keeps its place against its trigger, a sticky or fixed one included; scrolling an element that holds the trigger still closes it. `DropdownMenu` menus no longer close when the page scrolls. `ContextMenu` still holds the page still, like a platform context menu.
