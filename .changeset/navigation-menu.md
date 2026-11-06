---
'@flamboyantengineer/ui-components': minor
---

Add `NavigationMenu`, `NavigationMenuItem` and `NavigationMenuLink` for site navigation: a navigation landmark of top-level links and items whose panels hold links and other content. One panel opens at a time, by press or by a resting mouse or pen with an open delay and a closing grace period, and closes on Escape (returning focus to its trigger), a press outside, focus leaving the menu or a press on a link. Links keep native and router behaviour and mark the current page; the root publishes `data-open` and the open panel's size as `--ui-navigation-menu-panel-width` and `--ui-navigation-menu-panel-height`.
