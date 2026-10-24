---
'@flamboyantengineer/ui-components': patch
---

Fix keyboard, focus and announcement gaps, and render less, across widgets and assemblies.

- `EmojiPicker`: a recent list that names one emoji twice, or in two skin tones, no longer crashes the picker; each emoji shows once, and `onRecentEmojiChange` reports one key per emoji. `loadEmoji` is called once per picker (the bundled set once per locale), so a loader written inline no longer reloads after each choice; give the picker a new `key` to load again. Hovering an emoji redraws only the preview and `useActiveEmoji` readers, not the grid.
- `CharacterGrid`: the grid is named by `aria-labelledby` when given, like the root. Hovering or focusing a cell redraws only the preview.
- `DiagramCanvas`: a repeated announcement (the same node moved twice) is read again. Removing the last node moves focus to the previous node, else to the viewport (now focusable without joining the Tab order); removing a connection in the outline moves focus to the next link, else the previous one, else the node's entry. Dragging a node renders only the dragged nodes and re-routes only their edges. The `+` and `-` keys are left to sliders as well as fields and editable content.
- `Tour`: an uncontrolled step returns to `defaultStep` whenever the tour closes, including when the host sets a controlled `isOpen` to `false`.
- `MediaViewer`: the previous and next buttons stay focusable (`aria-disabled`) at the ends of the set, so focus no longer leaves the dialog. Page Up and Page Down move between items, and while focus is in the viewport and a zoomed image is wider than it, the arrow keys scroll the image. The chevrons point the other way right to left. Keys are left to editable content with any `contenteditable` value but `false`.
- `Carousel`: the chevrons point the other way right to left; arrow keys are left to editable content with any `contenteditable` value but `false`, and to widgets in a slide that already handled them.
- `BarChart`, `LineChart`, `DonutChart`: Escape closes a tooltip opened by hover wherever focus is, and goes no further.
- `CommandPalette`: letter and digit chords match when Shift, Alt (Option) or the keyboard layout types another character for the key, such as Control+Shift+1 or Option+P on macOS.
- `NavigationRail`: a stored collapsed state or width of the wrong type falls back to the default.
- `AppFrameContent`, `AppFrameBandContent`: without an `AppFrame` above, they render their children in place even below a projection provider of the host's own.
