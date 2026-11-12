# PDF Viewer

`PdfViewer` reads a PDF: it draws each page on a canvas with the page's text laid over it as a transparent, selectable text layer and its links over that, and offers zoom with fit modes, page navigation, find with its options, a sidebar of page thumbnails and outline, and commands to rotate, print and save the document in one toolbar above the pages, with a context menu that copies selected text. It asks for the password of a protected document, and answers the keyboard and touch gestures of a document reader. A caller can draw its own content over the pages, add entries to the context menu, send the reader to a page, a named destination or a rectangle, own the find, read the text of any page, follow the reader's clicks, selections and position in the document, and place controls at either end of the toolbar or render the toolbar elsewhere. The PDF engine (pdf.js, the `pdfjs-dist` package, an optional peer dependency) is injected by the host through `loadEngine`, so the library never imports it and a host that shows no PDF never loads it. The viewer is data-driven: it takes a source and callbacks and calls no host service.

## UIC-PDF-VIEWER-1 - Document

### UIC-PDF-VIEWER-1.1 - Source and engine

`source` shall be the document's URL (a string or a `URL`) or its bytes (an `ArrayBuffer` or a `Uint8Array`), including a `URL`, `ArrayBuffer` or `Uint8Array` made in another same-origin window, such as a frame or popup the viewer renders into. The viewer shall call `loadEngine` when a document starts loading and open the source with the engine's `getDocument`: a URL as `{ url }`, bytes as `{ data }` holding a copy in a `Uint8Array` of the viewer's window, because the engine transfers the buffer it is given to its worker; the caller's array stays readable. A new source, including a new array with the same bytes, is a new document; a URL is the same document while its address is the same, whether it comes as a string or as a new `URL` object of any window. The previous document's loading task shall be destroyed when the source changes and when the viewer unmounts, which also stops its worker. Each source and each retry is a new document lifetime: when a lifetime ends, what it opened and any password it asked for are dropped, so a viewer that returns to an earlier source (A, B, then A again) loads it again and stays loading until the new load opens, never showing the destroyed document, and a late result or password request of an ended lifetime changes nothing. The engine is described by the structural `PdfEngine` type, which the `pdfjs-dist` module satisfies.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/pdf-engine.ts`, `src/components/pdf-viewer/use-pdf-document.ts`, `src/utils/is-url.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-engine.test.ts`, `src/components/pdf-viewer/use-pdf-document.test.tsx`, `src/utils/is-url.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.2 - Worker

`workerSrc` shall be set on the engine's `GlobalWorkerOptions` before it opens a document. Without it the engine keeps the worker the host configured.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`

### UIC-PDF-VIEWER-1.3 - Loading

From the moment it has a source until the document has opened, the viewer shall publish `data-loading` on its root and `aria-busy="true"` on its document (`ui-pdf-viewer__scroller`), never on an ancestor of the overlay's status, cover its stage with a [Loading Overlay](LOADING-OVERLAY.md) and disable its zoom and page controls. A `null` source shall keep the viewer loading without opening anything, for a host still fetching the bytes. A query typed meanwhile runs once the document has opened (UIC-PDF-VIEWER-5.2).

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`, `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.4 - Error

When the engine cannot be loaded or the document cannot be opened, the viewer shall publish `data-error`, show an [Inline Error](INLINE-ERROR.md) with the provider's `documentFailed` string over its stage, and call `onError` with the error. The error's retry button loads the same source again.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.5 - Loader options

`documentOptions` shall be passed to the engine's `getDocument` with the source: `httpHeaders` and `withCredentials` for the requests of a URL source, and `cMapUrl`, `cMapPacked` and `standardFontDataUrl`, where the engine finds the character maps and standard font data some documents need. They are read when a document starts loading, as the worker is; a new object alone does not reload the document.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/pdf-engine.ts`
Verification: `src/components/pdf-viewer/use-pdf-document.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.6 - Password

When the engine asks for the document's password (its loading task's `onPassword`), the viewer shall publish `data-locked` on its root instead of `data-loading`, leave its document not busy, and show a `ui-pdf-viewer__password` form over its stage: a password [Text Field](TEXT-FIELD.md) labelled with the provider's `password` string and described by its `passwordRequired` string, and a submit button with its `openDocument` string. Submitting gives the engine the password and marks the button pending until the engine answers; a password the engine turns down stays in the field, marked with the provider's `passwordIncorrect` string until it changes. The document opens once the engine accepts a password.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/pdf-viewer-password.tsx`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/use-pdf-document.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.7 - Long documents

The viewer shall open documents of at least 250 pages. It keeps at most 8 page requests (`getPage`) in flight while opening a document, and at most 8 page-text requests while extracting the text for a search, and starts no further request once the document's lifetime ends. Only the pages near the view draw (UIC-PDF-VIEWER-2.1); the others keep empty canvases. The lab's 250-page report is built in the lab and times its opening; in the browser test it shows its first page, reaches its last page and finds a word on page 248.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/use-pdf-search.ts`, `src/components/pdf-viewer/map-bounded.ts`
Verification: `src/components/pdf-viewer/use-pdf-document.test.tsx`, `src/components/pdf-viewer/map-bounded.test.ts`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-2 - Pages

### UIC-PDF-VIEWER-2.1 - Page rendering

Each page shall be a `ui-pdf-viewer__page` element sized to the page at the applied zoom, where 100% shows the page at its printed size (96 CSS pixels per inch), holding a `ui-pdf-viewer__canvas` the engine draws into at the device pixel ratio, capped at 2²⁵ device pixels per page. The bitmap shall include the appearance of the page's annotations (the engine's `AnnotationMode.ENABLE`) unless they are switched off (UIC-PDF-VIEWER-2.5); form fields are drawn as they appear, not as fields to fill in. Only pages within one scroller height above or below the view render; this look-ahead distance follows the scroller's height when it resizes, independently of its width; a page further away keeps its size but releases its bitmap and its text and annotation layers, and every rendering page is drawn again when the zoom or the rotation changes. Visibility uses the scroller's own window's observer, or renders every page when that window cannot observe intersections. Reports from disconnected observers and replaced or removed page elements shall be ignored, and unchanged reports shall preserve the current visibility set.

Implementation: `src/components/pdf-viewer/pdf-viewer-page.tsx`, `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/page-bitmap.ts`, `src/components/pdf-viewer/use-near-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/page-bitmap.test.ts`, `src/components/pdf-viewer/use-near-pages.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.2 - Text layer

Over each rendered page the engine shall build its text layer in `ui-pdf-viewer__text-layer`, from the same text content the find searches, so the page's text can be selected and copied where it appears on the canvas. A page's text content is requested once and shared; a request that fails is forgotten, so the text layer, the find and the document handle can ask again. The root publishes the scale, in CSS pixels per point, as `--ui-pdf-viewer-scale`. The engine positions each text run (an element with `role="presentation"`) as a percentage of the layer and sets its font height, horizontal stretch and rotation in the `--font-height`, `--scale-x` and `--rotate` custom properties, and the layer's `--min-font-size` and `data-main-rotation`; the host stylesheet turns these into transparent text over the canvas, as the reference sheet's text-layer rules do. The library loads no stylesheet for it.

Implementation: `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/pdf-engine.ts`, `src/components/pdf-viewer/pdf-viewer.tsx`, `labs/reference/pdf-viewer.css`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.3 - Page scroller

The pages shall scroll in `ui-pdf-viewer__scroller`, a focusable `role="document"` element named by `aria-label` (the provider's `document` string by default), so the keyboard scrolls the document once it has focus. A new document starts at its first page, unless it opens at `defaultPage` (UIC-PDF-VIEWER-4.4). Opening a new document or removing the viewer shall cancel any queued scroll capture in the scroller's own window and ignore its late callback.

Implementation: `src/components/pdf-viewer/pdf-viewer-stage.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/use-pdf-pages.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.4 - Links

Over the text layer of each rendered page that has links, unless annotations are switched off (UIC-PDF-VIEWER-2.5), the engine shall build its annotation layer of those links in `ui-pdf-viewer__annotation-layer`; the page's other annotations and its form fields show as the bitmap draws them. The layer is transparent to the pointer (`pointer-events: none`), so the text under it stays selectable; the engine positions each link as a percentage of the layer and sets the layer's `data-main-rotation`, and the host stylesheet places the links and gives them the pointer, as the reference sheet's annotation-layer rules do. A link to the web opens in a new tab (`target="_blank"`, `rel="nofollow noopener noreferrer"`: `nofollow` because the document's links are its author's, and the new-tab tokens of a [Link](LINK.md#uic-link-22---new-tabs); its address as its `title`); a link whose address `isSafeUrl` refuses (`javascript:`) gets no destination, since the engine adapter does not promise to filter the document's addresses; a link to a destination in the document goes there as a named destination does (UIC-PDF-VIEWER-4.5); a link running the named actions `NextPage`, `PrevPage`, `FirstPage` or `LastPage` goes to that page.

Implementation: `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/pdf-link-service.ts`, `src/utils/safe-url.ts`, `src/components/pdf-viewer/use-pdf-links.ts`, `src/components/pdf-viewer/pdf-viewer-page.tsx`, `labs/reference/pdf-viewer.css`
Verification: `src/components/pdf-viewer/use-pdf-links.test.tsx`, `src/components/pdf-viewer/pdf-link-service.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.5 - Annotations switch

`showAnnotations` (true by default) set to `false` shall leave the page's annotations out of everything the viewer draws: the page bitmaps, the thumbnails and the printed pages are drawn without their appearances (the engine's `AnnotationMode.DISABLE`) and no page builds its annotation layer, so the document's links are neither shown nor followed. The text layer, find and the caller's overlays are unchanged. Changing it draws the rendered pages again.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/use-pdf-viewer.ts`, `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/pdf-commands.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-commands.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.6 - Page failures

A page whose bitmap fails to draw shall publish `data-error` on its `ui-pdf-viewer__page` and show, over the page in a `ui-pdf-viewer__page-error` slot, an [Inline Error](INLINE-ERROR.md) with the provider's `pageFailed` string for its page number and a retry button that draws the page again, and the viewer shall call `onPageError(pageIndex, error)`. The other pages, find and the page navigation keep working. A drawing cancelled because the page left the view, the zoom or rotation changed, another document opened or the viewer unmounted is not a failure, and a failure from a drawing that was replaced is ignored. The failure clears once the page draws again: on a retry, a new zoom or rotation, or after the page leaves the view and comes back. A thumbnail that fails to draw stays blank.

Implementation: `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/page-bitmap.ts`, `src/components/pdf-viewer/pdf-viewer-page.tsx`
Verification: `src/components/pdf-viewer/use-page-render.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-3 - Zoom

### UIC-PDF-VIEWER-3.1 - Zoom control

The toolbar shall show a [Zoom Control](ZOOM-CONTROL.md) over a 25% grid from 25% to 1000%, displaying the applied zoom rounded to a whole percent. A step from any zoom, including one a fit mode resolved to, lands on the next grid level on that side. `onZoomChange` shall receive the applied zoom in percent whenever it changes once the document has opened.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-zoom.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.2 - Fit modes

Fit page width and fit whole page shall be toggle buttons beside the zoom control (`fit-width` and `fit-page` glyphs, the provider's `fitWidth` and `fitPage` strings), pressed while their mode applies. Fitting the width fits the widest page into the page column's width and keeps the zoom between 50% and 200%; fitting the page fits the largest page whole into the column. The column is the scroller's client box less the padding of `ui-pdf-viewer__pages`. A fit is resolved again whenever the scroller changes size; a zoom chosen as a percentage is kept. `defaultZoom` (a percentage, `page-width` by default, or `page-fit`) is the zoom the viewer opens at.

Page dimensions shall be reduced without intermediate dimension arrays or function-argument limits.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-zoom.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.3 - Reading position

A zoom change shall keep the reader's place: the page at the top of the view and the depth into it, and the horizontal centre of the view. Scrolls shall capture that position at most once per animation frame in the scroller's own window, including when the frame identifier is zero.

Implementation: `src/components/pdf-viewer/use-pdf-pages.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/use-pdf-pages.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.4 - Wheel zoom

Ctrl or Command with the wheel over the pages shall step the zoom along the grid (up zooms in) and prevent the browser's own page zoom.

Implementation: `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.5 - Keyboard zoom

With focus in the viewer or its toolbar and the document open, Ctrl or Command with `+` (or `=`) and `-` shall step the zoom along the grid, and with `0` return to `defaultZoom`, preventing the browser's own page zoom. Shift may be held when typing `+`; other shifted shortcuts remain native.

Implementation: `src/components/pdf-viewer/use-pdf-keyboard.ts`
Verification: `src/components/pdf-viewer/use-pdf-keyboard.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.6 - Pinch zoom

On a touch screen, two fingers pinching over the pages shall scale the page column with them (an inline `transform` about the point between them), and apply the zoom they reached when they lift: the zoom before the gesture times the ratio of the fingers' last span to their first, within 25% and 1000%. The pages are drawn again only then, so the element under a finger stays in place for the whole gesture. Two fingers dragging without pinching scroll the pages; one finger keeps the browser's scrolling. The engine's `TouchManager` tells the gestures apart. Closing or replacing the document or removing the viewer cancels a pinch, clears its temporary transform without committing a zoom, and ignores late callbacks from its touch manager.

Implementation: `src/components/pdf-viewer/use-pinch-zoom.ts`
Verification: `src/components/pdf-viewer/use-pinch-zoom.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.7 - Caller zoom ladder

`zoomLevels` shall accept at least two finite, positive, strictly increasing percentages. Invalid configurations use the default ladder. Slider, buttons, keyboard, wheel, pinch and numeric zoom use its endpoints and steps. Fit modes retain their normal fit behavior within those endpoints.

Implementation: `src/components/pdf-viewer/pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-keyboard.ts`, `src/components/pdf-viewer/use-pinch-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-zoom.test.ts`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-4 - Page navigation

### UIC-PDF-VIEWER-4.1 - Current page

The toolbar shall show the page the reader is on, the one filling most of the view, in a number field labelled with the provider's `page` string (`ui-pdf-viewer__page-field`), followed by the total (`ui-pdf-viewer__page-total`, the provider's `ofTotal` string).

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-4.2 - Going to a page

Previous page and next page buttons (`chevron-up` and `chevron-down` glyphs) shall scroll to the neighbouring page and are disabled on the first and last page. A page number typed into the field and committed with Enter or by leaving it scrolls to that page, limited to the document's pages. Escape shall discard an uncommitted edit and restore the current page's localized number without moving the viewer. Enter, Escape and navigation keys sent while an input method composes shall remain with that input method and shall neither navigate nor discard its edit. A page lands where the first page sits at the top of the document.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-4.3 - Controlled page

`page` (zero-based), with `onPageChange`, shall put the caller in charge of the page: when `page` changes to a page other than the one the reader is on, the viewer goes to it once, landing as in UIC-PDF-VIEWER-4.2, as soon as the document has opened, the page is laid out and the viewer is shown; a page past the end goes to the last page. Once the document has opened, `onPageChange` shall report the page the reader is on whenever it changes — by scrolling, the toolbar, find or a revealed rectangle — unless `page` already names it. A `page` that repeats a page reported since the caller last caught up goes nowhere, so a caller that follows the reports never pulls the reader back. Each newly opened document shall start at the caller's current `page`, even when it has not changed since the previous document, without reporting the first page in between; the reports of the previous document no longer count as echoes. The page field shows the page the reader is on.

Implementation: `src/components/pdf-viewer/use-pdf-navigation.ts`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/use-pdf-navigation.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-4.4 - Opening page

Without `page`, a document shall open at `defaultPage` (zero-based, limited to its pages), landing as in UIC-PDF-VIEWER-4.2 once it is laid out and the viewer is shown. A document opens at the first of these that is set: `revealRect` (UIC-PDF-VIEWER-7.3), `page`, `defaultPage`. A `destination` set when it opens is looked up after, and moves the reader once found (UIC-PDF-VIEWER-4.5). A request left over from the previous document is dropped. Requests wait while the document loads and while the viewer is hidden.

Implementation: `src/components/pdf-viewer/use-pdf-navigation.ts`
Verification: `src/components/pdf-viewer/use-pdf-navigation.test.tsx`

### UIC-PDF-VIEWER-4.5 - Named destinations

Each time `destination` changes to a name, and when a document opens with it set, the viewer shall go to the destination the document defines under that name, once. A destination lands like a revealed rectangle (UIC-PDF-VIEWER-7.3): the spot it names (the top left of an `XYZ` destination, the top of a `FitH` or `FitBH` one, the left of a `FitV` or `FitBV` one, the corner of a `FitR` one) lands where a page's top lands, and a destination naming no spot (`Fit`, `FitB`) lands on its page's top; its zoom is not applied. A name the document does not define does nothing. Links and outline entries go to their destinations, named or explicit, the same way.

Looking a destination up waits on the document, and only the latest navigation request counts, in one order shared by every way of navigating: a lookup still pending is dropped once another destination is followed (a new `destination`, an outline entry or a link), the reader goes to a page (the page field, the previous and next page buttons, a thumbnail, the page keys or a link's page action), the caller asks for a page or a rectangle (a new `page` other than an echo of a reported page, or a new `revealRect`), find brings a match into view, `destination` is cleared, or another document opens, whichever order the lookups finish in. Scrolling, zoom and rotation are not requests: a lookup pending across them still lands.

Implementation: `src/components/pdf-viewer/pdf-destination.ts`, `src/components/pdf-viewer/use-pdf-links.ts`, `src/components/pdf-viewer/use-pdf-navigation.ts`
Verification: `src/components/pdf-viewer/pdf-destination.test.ts`, `src/components/pdf-viewer/use-pdf-navigation.test.tsx`, `src/components/pdf-viewer/use-pdf-links.test.tsx`, `src/components/pdf-viewer/pdf-viewer-sidebar.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-4.6 - Page keys

With focus in the page scroller and the document open, Home and End shall go to the first and the last page. Page Up and Page Down go to the previous and the next page while the zoom fits the whole page; at any other zoom they keep the browser's scrolling by a screen, as the arrow keys and the space bar do. A key pressed in a field, editable content or a key-owning widget (slider, spin button, text box, combo box, list box, grid, tree, menu or tab list) that a caller draws over a page stays with it, as does a key another handler already handled (its default prevented) or one that confirms an input method's text; the viewer's Ctrl or Command shortcuts likewise leave a handled key alone.

Implementation: `src/components/pdf-viewer/use-pdf-keyboard.ts`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/use-pdf-keyboard.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-5 - Find

### UIC-PDF-VIEWER-5.1 - Matches

The toolbar's find row, a [Find Bar](FIND-BAR.md) (also `ui-pdf-viewer__group`) whose find box is labelled and hinted with the provider's `findInDocument` string and emptied by its Escape key and clear button, shall find the query in the text of every page, ignoring case; whitespace in the query matches any whitespace, including a line break, so a phrase is found across lines. Every match in a rendered text layer shall be wrapped in a `ui-pdf-viewer__match` element, the current match carrying `data-current`. A phrase may span any number of text runs; locating its pieces shall skip unrelated runs, and grouping highlights shall not copy a growing collection for each match. Emptying the query removes the matches.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/pdf-search.ts`, `src/components/pdf-viewer/highlights.ts`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-search.test.ts`, `src/components/pdf-viewer/highlights.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.2 - Result count

The bar's status (UIC-FIND-BAR-1.2) shall report the current match and the total (`2 of 4`), the provider's `noResults` string once a query has no match, and its `searching` string while a query waits for the document or its text; a blank query reports nothing. A query typed while the document loads runs once it has opened.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.3 - Stepping through matches

The bar's Previous match and Next match buttons, and Enter and Shift + Enter in the field, shall step the current match backwards and forwards, wrapping at either end; the buttons are disabled without matches. A new query starts at the first match on or after the current page. The current match is brought into view: its page is scrolled to when it is not rendered, and the match is centred when it is not fully visible, measured in the scroller's own pixels, also under an ancestor `transform: scale()`.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/use-pdf-search.ts`, `src/components/pdf-viewer/pdf-viewer-page.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-search.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.4 - Caller-owned query

`searchQuery` shall replace the viewer's own query: the find runs on it and the find field shows it. `onSearchQueryChange` shall receive every query typed into or cleared from the field, or set through `renderSearch`'s `setQuery`, whether or not `searchQuery` is set.

Implementation: `src/components/pdf-viewer/use-pdf-search.ts`, `src/components/pdf-viewer/pdf-viewer-search.tsx`
Verification: `src/components/pdf-viewer/use-pdf-search.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.5 - Caller-owned current match

`matchIndex` shall replace the viewer's own current match, taken modulo the number of matches, so a counter that rises and falls steps forwards and backwards through them. `onMatchIndexChange` shall receive the match a step moves to (the buttons, Enter and Shift + Enter, or `renderSearch`'s `findNext` and `findPrevious`) and, for a new set of matches, the first match on or after the current page. While `matchIndex` is set, the current match moves only when it changes, and each change brings the current match into view. Changing `matchRevealRequest` shall bring the current match back into view even when its index is unchanged, without reporting another index change. A request made before text is available shall reveal the match when extraction completes; clearing the query cancels it.

Implementation: `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/use-pdf-search.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.6 - The caller's find controls

`renderSearch` shall draw the find controls in place of the viewer's own field, count, buttons and options. It receives the query, `setQuery`, the options in effect (`options`, each one set) and `setOptions`, `isPending`, `total`, the current match (`current`, zero-based), `findNext` and `findPrevious`; returning `null` draws no find controls, for a caller whose controls sit outside the viewer. Matches are highlighted and brought into view as with the viewer's own controls.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/use-pdf-search.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.7 - Find options

After the match buttons, the bar's options menu (UIC-FIND-BAR-1.4), named with the provider's `findOptions` string, shall check the find options that are on, and toggle one when chosen, staying open: `highlightAll` (on by default: every match is highlighted; off, only the current one), `matchCase` (upper and lower case differ), `ignoreAccents` (an accented letter matches its base letter, so `cafe` finds `café`, whether the accent is a letter of its own or a combining mark) and `wholeWords` (a match is not part of a longer word: no letter, mark, digit or underscore on either side). They are named with the provider's string of the same name. `searchOptions` shall replace the viewer's own options, and `onSearchOptionsChange` receive every set chosen in the menu or through `renderSearch`'s `setOptions`. A change of options other than `highlightAll` is a new set of matches (UIC-PDF-VIEWER-5.3).

Implementation: `src/components/pdf-viewer/pdf-search.ts`, `src/components/pdf-viewer/use-pdf-search.ts`, `src/components/pdf-viewer/pdf-viewer-search.tsx`
Verification: `src/components/pdf-viewer/pdf-search.test.ts`, `src/components/pdf-viewer/use-pdf-search.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.8 - Find shortcut

With focus in the viewer or its toolbar, Ctrl or Command with F (on a non-Latin layout, the key in the F key's place, [UIC-SHORTCUT-1.8](SHORTCUT.md)) shall focus the viewer's find field and select its text, instead of opening the browser's find. While `renderSearch` draws the find controls, the shortcut is left to the browser.

Implementation: `src/components/pdf-viewer/use-pdf-keyboard.ts`, `src/components/pdf-viewer/pdf-viewer-search.tsx`
Verification: `src/components/pdf-viewer/use-pdf-keyboard.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.9 - Ordered search results

Caller search controls shall expose readonly ordered `results` with zero-based page index, source text and start/end offsets. `selectResult(index)` activates a result with the same wrapping and reveal behavior as stepping, without extracting text again.

Implementation: `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/use-pdf-search.test.tsx`

### UIC-PDF-VIEWER-5.10 - Search text status

Caller controls shall expose `status`: idle for an empty query, loading while awaiting a document or its text, ready after extraction, unavailable when all pages have no searchable text, or error when the document or any text extraction failed. Successful partial matches may remain available on error. Source changes and cancellation shall discard stale outcomes.

Implementation: `src/components/pdf-viewer/use-pdf-page-texts.ts`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/use-pdf-search.test.tsx`

## UIC-PDF-VIEWER-6 - Toolbar

### UIC-PDF-VIEWER-6.1 - Toolbar

The controls shall sit above the pages in a [Toolbar Scroller](TOOLBAR-SCROLLER.md) named with the provider's `controlsFor` string (`Report controls`), in this order: the caller's `leadingActions` (`ui-pdf-viewer__leading-actions`), the sidebar toggle (UIC-PDF-VIEWER-10.1), zoom, fit modes, page navigation, find (or the controls `renderSearch` draws), the document commands (UIC-PDF-VIEWER-9.1), then the caller's `actions` (`ui-pdf-viewer__actions`). The left and right arrow keys move focus along the toolbar; inside a text field they move the caret, and move focus only at the ends of the text; while an input method composes in the field (`isComposing`, or key code 229), every arrow is the input method's and moves no focus.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-6.2 - Hooks and caller attributes

`PdfViewer` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/styling-hooks.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`

### UIC-PDF-VIEWER-6.3 - Toolbar elsewhere

With `toolbarSlot`, the toolbar shall render at the [Projection](PROJECTION.md) outlet of that slot instead of above the pages, keeping the viewer's state and handlers, for a screen whose toolbar spans panels beside the document. Without a `ProjectionProvider` above, it renders in place.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-7 - Overlays

### UIC-PDF-VIEWER-7.1 - Page overlays

For each page that renders (UIC-PDF-VIEWER-2.1), `renderPageOverlay` shall be called with the page index and the engine's viewport of the page at the applied zoom and rotation (`page.getViewport({ scale, rotation })`, where `scale` is CSS pixels per point), and its content drawn in a `ui-pdf-viewer__overlay` layer over the page's text and annotation layers. The layer covers exactly the page's bitmap inside the page element, so content positioned in viewport coordinates sits on what the bitmap shows at every zoom and moves with its page when the page column changes size. The layer is transparent to the pointer (`pointer-events: none`, which its content inherits), so text under it stays selectable; content that takes the pointer opts in itself.

Implementation: `src/components/pdf-viewer/pdf-viewer-page.tsx`, `src/components/pdf-viewer/use-pdf-document.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-7.2 - Page viewports

`onPageViewports` shall receive the viewports of the pages that render, keyed by page index, whenever that set or the applied zoom changes: the set is read again each time rather than accumulated, and it is empty while no document is open.

Implementation: `src/components/pdf-viewer/use-pdf-navigation.ts`
Verification: `src/components/pdf-viewer/use-pdf-navigation.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-7.3 - Revealing a rectangle

Each time `revealRect` (a page index and a rectangle in page coordinates) changes value, the viewer shall bring that rectangle into view once: its top lands where a page's top lands when going to a page, and the view moves sideways to centre it when it is not fully visible across. A request made before the document has opened or while the viewer is hidden waits until the page is laid out and the viewer is shown. An equal rectangle passed again does nothing, so a rectangle rebuilt on every render never pulls the reader back; after `null`, it is a new request. Each newly opened document shall reveal the current rectangle, even an equal one.

Implementation: `src/components/pdf-viewer/use-pdf-navigation.ts`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/use-pdf-navigation.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-7.4 - Page coordinates

Positions the viewer reports and takes shall be in page coordinates: points from the top-left corner of the page as displayed, after the reader's rotation, whatever the zoom; at the applied zoom a point spans the viewport's `scale` in CSS pixels. A client position becomes a page position by subtracting the client position of the page's bitmap, inside the page element's border, so scrolled ancestors cost nothing. A node is placed on a page by walking its ancestors against the page elements themselves. `findBoxAtPoint(boxes, point)` shall return the last of `boxes` containing `point`, edges included, so caller content drawn later wins a hit test.

Implementation: `src/components/pdf-viewer/page-geometry.ts`
Verification: `src/components/pdf-viewer/page-geometry.test.ts`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-8 - Context menu

### UIC-PDF-VIEWER-8.1 - No browser menu

A secondary click (a `contextmenu` event) over the pages shall not open the browser's menu, unless caller content under the pointer has already handled the event (prevented its default), which the viewer then leaves alone. The viewer's menu is a [Context Menu](CONTEXT-MENU.md) at the pointer and opens only when it has entries.

Implementation: `src/components/pdf-viewer/use-pdf-context-menu.ts`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/use-pdf-context-menu.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-8.2 - Copying the selection

While the reader's selection is not blank and lies inside the page scroller, the menu shall offer Copy first (the provider's `copy` string, entry id `copy`), which copies the selected text to the clipboard. A selection elsewhere on the screen does not count. Copy has no icon by default; `menuIcons` gives it one as `copy` ([UIC-MENU-6.1](MENU.md#uic-menu-61---action-icon-maps)), and the caller's entries take their own `icon`.

Implementation: `src/components/pdf-viewer/use-pdf-context-menu.ts`
Verification: `src/components/pdf-viewer/use-pdf-context-menu.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-8.3 - Selection entries

`getSelectionMenuItems` shall be called with the selection located on the page where it starts — its text, the page index, the page's viewport and the rectangle of its first line in page coordinates — and its entries placed after Copy. A selection that cannot be placed on a page offers Copy alone.

Implementation: `src/components/pdf-viewer/use-pdf-context-menu.ts`, `src/components/pdf-viewer/page-geometry.ts`
Verification: `src/components/pdf-viewer/use-pdf-context-menu.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-8.4 - Page entries

Without such a selection, `getPageMenuItems` shall be called with the page under the pointer, its viewport and the pointer's position in page coordinates, and the menu shall show its entries. Off the pages, or with no entries, no menu opens.

Implementation: `src/components/pdf-viewer/use-pdf-context-menu.ts`, `src/components/pdf-viewer/page-geometry.ts`
Verification: `src/components/pdf-viewer/use-pdf-context-menu.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-9 - Document commands

### UIC-PDF-VIEWER-9.1 - Commands menu

After find, a [Dropdown Menu](DROPDOWN-MENU.md) drawn as an icon button (`more-vertical` glyph, the provider's `moreOptions` string) shall offer, with the provider's strings of the same names, `rotateClockwise` and `rotateCounterclockwise`, a separator, then `print` and `download`. It is disabled until the document has opened.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`
Verification: `src/components/pdf-viewer/pdf-commands.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-9.2 - Rotation

Rotating shall turn every page a quarter turn clockwise or counterclockwise on top of the page's own rotation, keeping the reader's place as a zoom change does (UIC-PDF-VIEWER-3.3). A quarter turn swaps each page's width and height, so the fit modes fit the turned pages; every layer is drawn at the turned viewport, and page coordinates follow the pages as displayed. A new document opens unturned.

Implementation: `src/components/pdf-viewer/use-pdf-rotation.ts`, `src/components/pdf-viewer/use-pdf-document.ts`
Verification: `src/components/pdf-viewer/use-pdf-rotation.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-9.3 - Printing

Printing shall draw every page at 150 dots per inch, as the document sets it (without the reader's rotation), scaled down where needed to the same pixel ceiling as the screen's bitmaps, into images in a hidden frame, emptying each canvas once its image is encoded, one printed sheet each, open the browser's print dialog on that frame, and remove the frame and release the images once printing is over (`afterprint`). The frame and every image drawn so far shall also be released, once, when a page fails to draw or encode or the frame fails to fill or print; the viewer then calls `onCommandError('print', error)`. A print still drawing is cancelled, with the page being drawn and without a failure, when another print starts, another document opens or the viewer unmounts.

Implementation: `src/components/pdf-viewer/pdf-commands.ts`, `src/components/pdf-viewer/use-pdf-commands.ts`
Verification: `src/components/pdf-viewer/pdf-commands.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-9.4 - Saving

Downloading shall save the document's bytes, as the engine holds them, under the file name at the end of a URL source's path when it ends in `.pdf`, and otherwise under the viewer's name with `.pdf` (`Report.pdf`). A save that fails calls `onCommandError('download', error)`.

Implementation: `src/components/pdf-viewer/pdf-commands.ts`
Verification: `src/components/pdf-viewer/pdf-commands.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-10 - Sidebar

### UIC-PDF-VIEWER-10.1 - Sidebar

A toggle button (`sidebar` glyph, the provider's `sidebar` string) shall show and hide a `ui-pdf-viewer__sidebar` panel in the stage before the page scroller, pressed while it shows; it is disabled until the document has opened. `defaultSidebarOpen` opens it with the viewer. The panel holds [Tabs](TABS.md) named with the `sidebar` string: the page thumbnails (the `pages` string) and the outline (the `outline` string), which is disabled when the document has none and selected when it has one.

Implementation: `src/components/pdf-viewer/pdf-viewer-sidebar.tsx`, `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer-sidebar.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-10.2 - Thumbnails

The thumbnails shall be a React Aria `ListBox` (`ui-pdf-viewer__thumbnails`) named with the `pages` string, with one single-selection option per page (`ui-pdf-viewer__thumbnail`, named with the `pageNumber` string) holding the page drawn in a `ui-pdf-viewer__thumbnail-canvas` and its number in `ui-pdf-viewer__thumbnail-label`. The page the reader is on is selected; choosing another goes to it. The canvas takes the content width of its option, which the host stylesheet sets, and the height of the page at that width, inline; its bitmap is drawn at the device pixel ratio while the option is within a sidebar's height of the view, at the reader's rotation.

Implementation: `src/components/pdf-viewer/pdf-viewer-thumbnails.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer-sidebar.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-10.3 - Outline

The outline shall be a [Tree](TREE.md) (`ui-pdf-viewer__outline`) named with the `outline` string, one row per entry of the document's outline, nested as the document nests them; an entry the document opens (a positive count) starts expanded. Choosing an entry goes to its destination (UIC-PDF-VIEWER-4.5), or opens its web address in a new tab; an address `isSafeUrl` refuses opens nothing. The outline is not virtualized: only top-level entries and those the document opens render at first, which keeps it to a few hundred rows for documents a reader browses this way.

Implementation: `src/components/pdf-viewer/pdf-viewer-sidebar.tsx`, `src/components/pdf-viewer/use-pdf-document.ts`, `src/utils/safe-url.ts`
Verification: `src/components/pdf-viewer/pdf-viewer-sidebar.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-10.4 - Resizing

The open sidebar shall have a vertical [Resize Handle](SPLIT-VIEW.md) (`ui-pdf-viewer__sidebar-resizer`), named with the provider's `sidebar` string and controlling the sidebar's unique id. Pointer dragging and the handle's arrow, Shift+arrow, Home and End keys shall resize it between 120 and 480 pixels, limited to half the stage when that leaves at least 120 pixels. The initial width is 200 pixels. A cancelled drag shall restore the committed width; closing and reopening shall retain it. Opening, closing and resizing shall keep the document scroller mounted and keyboard resizing shall not navigate pages. The sidebar's inline width is functional layout geometry.

The host shall keep the sidebar tabs outside the selected content's scroll region and reserve its scrollbar gutter so fitting thumbnail widths cannot toggle overflow continuously.

Implementation: `src/components/pdf-viewer/pdf-viewer-frame.tsx`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`, `src/components/pdf-viewer/pdf-viewer-sidebar.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer-sidebar.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-11 - Document access and reading gestures

### UIC-PDF-VIEWER-11.1 - Document access

With `onDocumentChange`, the viewer shall hand the caller a handle on each document once it opens, and `null` once it closes: on a new source, on a failure and on unmount. The handle's `pageCount` is the document's, and `getPageText(pageIndex)` shall resolve with a page's `text` (its runs joined, a line break after each run that ends a line), the engine's own text `content`, whose runs carry their geometry in PDF user space, and the engine's `viewport` of the page at 100% zoom and the reader's rotation at the time of the read, which maps that geometry to page coordinates (UIC-PDF-VIEWER-7.4). Reading a page shall neither draw it nor scroll to it. `getPageText` shall reject with a `RangeError` for a page the document does not have, with the engine's error when the engine cannot read the page, and with an error once its document has closed, including a read in flight when it closes. The handle lasts through zoom and rotation.

Implementation: `src/components/pdf-viewer/use-pdf-access.ts`
Verification: `src/components/pdf-viewer/use-pdf-access.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-11.2 - Page clicks

With `onPageClick`, a primary-button click on a page shall report its page index, the clicked spot in page coordinates and the page's viewport at the applied zoom. A click inside a link, a control or any other interactive or focusable element on the page, a click whose default the caller's own handler prevented, and the click that ends a text selection shall not be reported. The viewer never prevents the click itself, so text selection, links, annotations and the caller's overlay controls keep their own behaviour.

Implementation: `src/components/pdf-viewer/use-pdf-gestures.ts`
Verification: `src/components/pdf-viewer/use-pdf-gestures.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-11.3 - Selection changes

With `onSelectionChange`, when the reader releases the pointer or a key with text selected inside the viewer, the viewer shall report that selection located as the selection context menu locates it (UIC-PDF-VIEWER-8.3): its text, the page where it starts, its first line in page coordinates and the page's viewport at the applied zoom. It shall report `null` once the selection is gone or leaves the viewer, and when the document closes. A selection is reported once, however many releases repeat it. Reporting it opens no menu and changes no selection.

Implementation: `src/components/pdf-viewer/use-pdf-gestures.ts`
Verification: `src/components/pdf-viewer/use-pdf-gestures.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-11.4 - Visible position

With `onVisiblePositionChange`, the viewer shall report where the top edge of the view falls: the page there (the next page when the edge falls between two pages) and how far down it the edge falls, in points from the page's top as displayed, 0 above its first line of pixels. It shall measure at most once a frame, after a scroll, a zoom, a turn of the pages, a resize of the scroller and a new document, and report only a position that differs from the last one by at least a hundredth of a point; a new document reports its position even where the last one stood.

Implementation: `src/components/pdf-viewer/use-pdf-visible-position.ts`
Verification: `src/components/pdf-viewer/use-pdf-visible-position.test.tsx`, `e2e/pdf-viewer.spec.ts`

## Hooks

| Hook                              | Kind     | Values                  | Description                                                                                        |
| --------------------------------- | -------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `ui-pdf-viewer`                   | root     |                         | The viewer `<div>`.                                                                                |
| `ui-pdf-viewer__toolbar`          | slot     |                         | The toolbar's wrapper, around a Toolbar Scroller.                                                  |
| `ui-pdf-viewer__leading-actions`  | slot     |                         | The caller's leading actions at the start of the toolbar.                                          |
| `ui-pdf-viewer__group`            | slot     |                         | The page navigation group, and the find row (a Find Bar beside its own `ui-find-bar` hooks).       |
| `ui-pdf-viewer__page-field`       | slot     |                         | The page number field (React Aria `NumberField`).                                                  |
| `ui-pdf-viewer__page-label`       | slot     |                         | The page field's visible label.                                                                    |
| `ui-pdf-viewer__page-input`       | slot     |                         | The page field's `<input>`.                                                                        |
| `ui-pdf-viewer__page-total`       | slot     |                         | The page total after the field.                                                                    |
| `ui-pdf-viewer__actions`          | slot     |                         | The caller's actions at the end of the toolbar.                                                    |
| `ui-pdf-viewer__stage`            | slot     |                         | The positioned area under the toolbar.                                                             |
| `ui-pdf-viewer__sidebar`          | slot     |                         | The panel of thumbnails and outline before the page scroller.                                      |
| `ui-pdf-viewer__sidebar-resizer`  | slot     |                         | The Resize Handle that sizes the sidebar; also `ui-resize-handle`.                                 |
| `ui-pdf-viewer__thumbnails`       | slot     |                         | The thumbnails' React Aria `ListBox`.                                                              |
| `ui-pdf-viewer__thumbnail`        | slot     |                         | One page's option in the thumbnails; its content width sizes the canvas.                           |
| `ui-pdf-viewer__thumbnail-canvas` | slot     |                         | A thumbnail's bitmap, sized inline.                                                                |
| `ui-pdf-viewer__thumbnail-label`  | slot     |                         | A thumbnail's page number.                                                                         |
| `ui-pdf-viewer__outline`          | slot     |                         | The outline's Tree, beside its own `ui-tree` hooks.                                                |
| `ui-pdf-viewer__scroller`         | slot     |                         | The focusable `role="document"` element the pages scroll in.                                       |
| `ui-pdf-viewer__pages`            | slot     |                         | The positioned page column; its padding is left free by the fits.                                  |
| `ui-pdf-viewer__page`             | slot     |                         | One page, sized inline to the zoom.                                                                |
| `ui-pdf-viewer__page-error`       | slot     |                         | The positioned layer over a page whose bitmap failed, holding its Inline Error.                    |
| `ui-pdf-viewer__canvas`           | slot     |                         | The page bitmap.                                                                                   |
| `ui-pdf-viewer__text-layer`       | slot     |                         | The engine's selectable text layer over the bitmap.                                                |
| `ui-pdf-viewer__annotation-layer` | slot     |                         | The engine's pointer-transparent layer of the page's links over the text.                          |
| `ui-pdf-viewer__overlay`          | slot     |                         | The pointer-transparent layer over a page holding the caller's overlay content.                    |
| `ui-pdf-viewer__match`            | slot     |                         | A find match inside a text run.                                                                    |
| `ui-pdf-viewer__password`         | slot     |                         | The form that asks for a protected document's password, over the stage.                            |
| `data-loading`                    | state    | `true`                  | The document has not opened yet.                                                                   |
| `data-locked`                     | state    | `true`                  | The document waits for its password.                                                               |
| `data-error`                      | state    | `true`                  | On the root: the engine or the document could not be opened. On a page: its bitmap failed to draw. |
| `data-current`                    | state    | `true`                  | On the current match.                                                                              |
| `data-main-rotation`              | state    | `0`, `90`, `180`, `270` | Set on the text and annotation layers by the engine: the page's rotation.                          |
| `data-selected`                   | state    | `true`                  | The thumbnail of the page the reader is on (React Aria).                                           |
| `data-selection-mode`             | state    | `single`                | On a thumbnail: the thumbnails' selection mode (React Aria).                                       |
| `data-layout`                     | state    | `stack`                 | On the thumbnails: their layout (React Aria).                                                      |
| `data-orientation`                | state    | `vertical`              | On the thumbnails: their orientation (React Aria).                                                 |
| `data-collection`                 | state    |                         | React Aria's collection marker, on the thumbnails and each thumbnail.                              |
| `data-key`                        | state    |                         | On a thumbnail: its page index (React Aria).                                                       |
| `data-disabled`                   | state    | `true`                  | The page field or input, or a thumbnail, is disabled (React Aria).                                 |
| `data-hovered`                    | state    | `true`                  | The page input or a thumbnail is hovered (React Aria).                                             |
| `data-focused`                    | state    | `true`                  | The page input, the thumbnails or one of them has focus (React Aria).                              |
| `data-focus-visible`              | state    | `true`                  | The page input, the thumbnails or one of them has keyboard focus (React Aria).                     |
| `data-pressed`                    | state    | `true`                  | A thumbnail is pressed (React Aria).                                                               |
| `--ui-pdf-viewer-scale`           | property |                         | CSS pixels per point at the applied zoom, on the root.                                             |
