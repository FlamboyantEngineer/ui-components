---
'@flamboyantengineer/ui-components': minor
---

Fix keyboard, focus and state gaps in the board, calendar, dashboard, editor and compare components.

- `Board`: a card moved by Alt+Arrow into a virtualized cell that does not render it scrolls that cell until the card renders and keeps focus. Column drag handles publish `aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"` and React Aria's drag button description.
- `CalendarView`: arrow, Home, End and Page keys move from the day of the cell that has focus, including a day of a neighbouring month. A keyboard move the owner of a controlled `date` does not apply no longer takes focus on a later `date` change.
- `DashboardGrid`: new `persistKey` remembers the uncontrolled layout; `storageKey` still works and is deprecated. A resize at the last column keeps the tile's start column. A move or resize that leaves the layout unchanged (an arrow key against an edge) calls no `onLayoutChange` and announces nothing. A pointer drag redraws the tiles only when it reaches another cell.
- `CodeEditor`: new `name`, so a form submits the source. Escape then Shift+Tab leaves the editor backwards, as Escape then Tab leaves it forwards. Hover lookups stay cheap on long sources. The never-emitted `completions`, `completion`, `completion-label`, `completion-description` and `completion-documentation` slot names are removed from the editor's hook set; the completion list keeps its own `ui-completion-list` hooks.
- `MergeView`: typing in a conflict's editor no longer redraws the input sides or the clean chunks.
- `TreeCompare`: uncontrolled expansion starts over when `left` or `right` changes, so differences in a tree that arrives later show expanded.
- `AnnotationLayer`: marks of numeric and text ids with the same spelling stay distinct.
- `Timeline`: a cancelled pointer drag no longer swallows the next Enter or Space on the item.
- `PdfViewer`: a new `URL` object for the same address is the same document and no longer reloads it.
