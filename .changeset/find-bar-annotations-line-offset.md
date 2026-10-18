---
'@flamboyantengineer/ui-components': minor
---

Add `FindBar`: a find row with the find box, the match count, previous and next match, a menu of matching options, replace and replace all, and close; the caller owns the matching and reports `matchCount` and `currentIndex`. New glyphs `arrow-up` and `arrow-down`, and the string `matchTotal`.

`CodeEditor` and `PdfViewer` draw their find rows with `FindBar`. `CodeEditor` takes `firstLineNumber` to number an excerpt from its first line; diagnostics count lines from it. `PdfViewer` takes `showAnnotations` (true by default); `false` draws the pages, thumbnails and printed pages without annotations and builds no link layer.

Breaking: the find rows publish the `ui-find-bar` hooks. Removed `ui-code-editor__search-input`, `ui-code-editor__replace-input` and `ui-code-editor__search-status` (`ui-code-editor__search` stays, on the bar), and `ui-pdf-viewer__search-field`, `ui-pdf-viewer__search-input`, `ui-pdf-viewer__search-clear` and `ui-pdf-viewer__search-status` with the find field's `data-empty` (`ui-pdf-viewer__group` stays, on the bar). The code editor's find box is now a search box (`role="searchbox"`) with a clear button, and both rows step with `arrow-up` and `arrow-down` glyphs instead of chevrons.
