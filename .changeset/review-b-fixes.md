---
'@flamboyantengineer/ui-components': minor
---

- **Disclosure**: a disclosure whose `id` is `0` or `''` is now addressed by its group's `expandedKeys`, `defaultExpandedKeys` and `onExpandedChange`, which keep reporting the caller's own ids.
- **Toast**: a toast added, updated with a new lifetime or settled from a promise while the region is hovered or holds focus stays paused until the reader leaves. Focusing the region itself (F6) now pauses the timers and publishes `data-expanded`, and a toast dismissed while it held focus or sat under the pointer no longer leaves the region expanded with paused timers.
- **UserCard**: a card rendered in place, outside an overlay, no longer takes focus when it appears; a card opened in a popover still does.
- **LoadingRegion**: keyboard focus inside the content when blocking starts moves to the region's root (focusable only while blocking) instead of dropping to the page, and returns to the element that had it when blocking ends, unless the reader moved it.
- **LoadingCard**: an indeterminate bar is named by `progress['aria-label']` when set.
- **UserIdentity**: a space separates the name from the secondary line, so a name computed from a row's content reads them as separate words, styled or not.
- **Path**: `expandable`, `isExpanded`, `defaultExpanded` and `onExpandedChange`, inherited from the truncation tooltip, are deprecated; they still work and will be removed in a major release.
