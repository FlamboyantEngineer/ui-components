---
'@flamboyantengineer/ui-components': minor
---

Close gaps in `PdfViewer`.

- Links: the engine's annotation layer draws each page's links in `__annotation-layer`, transparent to the pointer between them. Links to the web open in a new tab; links to destinations and the `NextPage`, `PrevPage`, `FirstPage` and `LastPage` actions move the viewer. The bitmap now draws the appearance of the page's annotations (`AnnotationMode.ENABLE`, previously `DISABLE`).
- Password: a protected document asks for its password in a `__password` form over the stage (root `data-locked`), marks a wrong one and opens with the right one.
- Navigation: `defaultPage` (the page a document opens at) and `destination` (a named destination, gone to each time it changes). Home and End go to the first and last page; Page Up and Page Down turn pages at the whole-page fit.
- Sidebar: a toolbar toggle (`sidebar` glyph) and `defaultSidebarOpen` show a `__sidebar` with page thumbnails (`__thumbnails`, `__thumbnail`, `__thumbnail-canvas`, `__thumbnail-label`, a React Aria `ListBox`) and the document outline (`__outline`, a `Tree`).
- Commands: a "More options" menu rotates the pages a quarter turn either way, prints them through a hidden frame and saves the file (`.pdf` name from the URL or the viewer's name).
- Find options: a "Find options" menu with highlight all, match case, ignore accents and whole words; `searchOptions` and `onSearchOptionsChange` let the caller own them, and `renderSearch` receives `options` and `setOptions`.
- Keyboard and touch: Ctrl or Command with F focuses the find field, with + / - steps the zoom and with 0 returns to the opening zoom; a two-finger pinch zooms and a two-finger drag scrolls (the engine's `TouchManager`).
- `documentOptions` passes request headers, credentials, character maps and standard fonts to the engine.
- The structural `PdfEngine` type now also asks for what `pdfjs-dist` 6 provides for these features (`AnnotationLayer`, `TouchManager`, `PasswordResponses`, `AnnotationMode.ENABLE`, the loading task's `onPassword`, a document's `getOutline`, `getDestination`, `getPageIndex` and `getData`, a page's `rotate`, `view` and `getAnnotations`): the `pdfjs-dist` module still satisfies it; a hand-made engine must add them.
- Reference sheet: the stage lays the sidebar beside the page scroller (the scroller is now a flex item instead of absolutely placed), and the text and annotation layers share the scale and rotation rules.
- Provider: the `sidebar` glyph and the strings `sidebar`, `pages`, `outline`, `pageNumber`, `rotateClockwise`, `rotateCounterclockwise`, `print`, `download`, `findOptions`, `highlightAll`, `matchCase`, `ignoreAccents`, `wholeWords`, `password`, `passwordRequired`, `passwordIncorrect` and `openDocument`.
