---
'@flamboyantengineer/ui-components': minor
---

Fix review findings across the foundation, content and layout components.

- Controlled state: every component with a controllable value calls its change handler only when the value changes (`Object.is`), as React Aria does; setting the current value again no longer reports it.
- Caller `data-*` attributes render the same way on every component, as React renders them: `false` becomes `"false"`, `null` and `undefined` omit the attribute.
- Components that keep their own ref beside the caller's (`ScrollRegion`, `SplitView`, `TabList`, `Banner`, `Combobox`, `TruncationTooltip`, `ListView`) now run the cleanup a React 19 callback ref returns.
- `Card`: a click inside content portalled out of the card, such as a popover, menu or dialog the card opened, no longer activates the card's action.
- `SvgMarkup` and `parseSvgMarkup`: SMIL animations (`set`, `animate`, `animateColor`, `animateMotion`, `animateTransform`) that animate a link attribute or carry a script URL are dropped with their content; script URLs are dropped from link attributes whatever their case or separator (`xlink-href`); a nested element of the same name no longer ends a dropped element early.
- `HtmlMarkup` and `sanitizeHtml`: a blocked element that nests one of the same name (an `<object>` fallback, an `<svg>`) is dropped whole. Only the elements HTML reads as text (`script`, `style`, `iframe`, `noembed`, `noframes`, `noscript`, `xmp`, `plaintext`, `textarea`, `title`) keep their content unparsed.
- `ColorSwatch` and `ColorSwatchPicker`: a colour in a notation React Aria does not read (`red`, `transparent`, `currentColor`, `oklch()`, space-separated `rgb()`) draws an empty swatch instead of throwing; the picker leaves such items out and treats such a value as no value. The accepted notations are hex, `rgb()`, `hsl()` and `hsb()`.
- `Markdown`: builds its elements without recursion, so deeply nested quotes no longer overflow the stack. `renderNode` runs once per node inside task items; a task item's first paragraph labels its checkbox and is no longer passed to `renderNode`, and the item's children are the label's inline nodes followed by its other blocks.
- `Icon`: `isGlyphName` and `toIconProps` treat only built-in glyph names as glyphs, so another string such as `★` draws as text instead of crashing (`IconLabel`, `Badge`, `RecordLabel` and other icon props).
- `ScrollRegion`: the wheel over an overlay thumb no longer scrolls the page while the viewport can still scroll that way, and a focused thumb that disappears with its axis no longer keeps the tracks shown.
- Testing helpers: `selectOption` no longer closes an open multiple-selection list, so consecutive calls pick several options.
- `MetaLine`: an entry without a key keeps its state when an entry before it empties.
- `RelativeTime`, `RelativeDateField` and `describeRelativeTime`: the unit follows the rounded count, so values read `1 minute ago`, `1 hour ago` and `yesterday` rather than `60 seconds ago`, `60 minutes ago` and `24 hours ago`; `nextChange` follows the same rule.
- `Badge`: a label badge without a role reads its `aria-label` from the visually hidden `ui-badge__accessible-label` slot instead of naming its `<span>`; an announced status badge keeps it as its name.
- `RecordLabel`: without a link, its `aria-label` is read from a new visually hidden `ui-record-label__accessible-label` slot and `aria-labelledby` is not set, since a `<span>` cannot carry a name.
- `SectionHeader` and `StatusBar`: a standalone section header (`role="none"`) and a status bar (`role="none"`, or `role="group"` when named; a caller `role` wins) are no longer the page's `banner` or `contentinfo` landmarks.
- `InlineTextDiff`: `createInlineTextDiffExcerpt` with a `context` or `run` of 0 keeps none of that text and adds no ellipsis.
- `Stack` and `Cluster`: an empty-string child gets no divider. The documented `space` and `gutter` defaults of `Page`, `Stack`, `Cluster`, `Grid`, `ToolbarRow` and `Section` now match their behaviour.
- `TextMatch`: without `ignoreAccents`, an unaccented term no longer matches a word whose accent is written as a combining mark, in `findTermRanges` and `textMatchesTerms` alike.
- `DescriptionList` and `formatDescriptionValue`: values take ISO 8601 date and date-time texts and ranges of them, formatted as calendar dates in the formatter's time zone; a text that is not a date shows as written. `Date` values keep working and are deprecated.
- `Shortcut`: renders the server's notation on the server and while hydrating, then the browser's, so hydration matches.
- `SplitView`: a disabled `ResizeHandle` still passes pointer and key events to the caller's handlers. `resolveSplitBounds` and `resolveInitialSplitSize` are deprecated; `SplitView` does not use them.
