---
'@flamboyantengineer/ui-components': minor
---

`ToolbarScroller` draws its tools in the same strip in both overflow modes, so switching between `scroll` and `menu` keeps every tool that stays visible mounted, with its state and focus; a focused tool that collapses into the menu hands focus to the next tool or the menu button. Tools drawn from `items` now sit in a `ui-toolbar-scroller__item` element in the `scroll` mode too.
