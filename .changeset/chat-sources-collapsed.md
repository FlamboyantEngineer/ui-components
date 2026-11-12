---
'@flamboyantengineer/ui-components': minor
---

`ChatSources` starts collapsed behind a "Sources (3)" trigger with a chevron, and a press (pointer, Enter or Space) shows the list. `isExpanded`, `defaultExpanded` and `onExpandedChange` control it, and in `ChatParts` a sources part with an `id` keeps the reader's choice in `expandedParts`. New hooks: `ui-chat-sources__trigger`, `__indicator` and `__panel`. The `chatSourcesLabel` string now reads "Sources ({count})".
