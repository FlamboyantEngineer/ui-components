---
'@flamboyantengineer/ui-components': minor
---

SearchPane takes `replaceMode` (`none`, `hidable` or `shown`) instead of deciding the mode from its handlers, and its root's `data-mode` becomes `data-replace-mode`; only a `hidable` pane draws the chevron. FindBar and SearchPane take `emptyNavigation="hidden"` to leave out Previous and Next while nothing matches. FindBar wraps the replacement and its buttons in a `replace-group` part, so Replace and Replace all stay on the replacement's line, and the arrows sit snug against the query when no count shows.
